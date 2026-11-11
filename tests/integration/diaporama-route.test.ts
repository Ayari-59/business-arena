import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA ROUTE DU DIAPORAMA (app/cours/[chapitre]/diaporama/route.ts) REFAIT LE CONTRÔLE D'ACCÈS.
 *
 * Le bouton n'est montré qu'à l'enseignant sous licence, mais l'adresse se tape : la route décide
 * elle-même. 403 pour le visiteur, pour l'élève (même dans une classe qui ouvre le chapitre), pour
 * l'enseignant sans licence ou à qui ce chapitre n'est pas ouvert ; 200 et un PowerPoint pour
 * l'enseignant et l'administrateur d'un établissement sous licence ; 404 hors de la liste blanche.
 */

let session: { userId: string; role: "teacher" } | null = null;
let invite: string | null = null;

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("@/lib/session", () => ({ getSession: async () => session }));
vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => invite }));

import { db } from "@/db";
import { users } from "@/db/schema";
import { GET } from "@/app/cours/[chapitre]/diaporama/route";
import { CHAPITRES } from "@/config/cours/registre";
import { TYPE_PPTX } from "@/config/cours/diaporamas";
import { creerClasse, rejoindreClasse } from "@/services/cours.service";
import { getTeacherOrgId } from "@/services/auth.service";
import { etablissementSousLicence, placerSousLicence } from "./helpers/licence";

const CHAPITRE = "fournisseurs-et-banque";
const appeler = (chapitre = CHAPITRE, qui: { session?: string | null; invite?: string | null } = {}) => {
  session = qui.session ? { userId: qui.session, role: "teacher" } : null;
  invite = qui.invite ?? null;
  return GET(new Request(`http://local/cours/${chapitre}/diaporama`), { params: Promise.resolve({ chapitre }) });
};

async function utilisateur(): Promise<string> {
  const [u] = await db.insert(users).values({ email: `${randomUUID()}@test.local`, displayName: "x" }).returning({ id: users.id });
  return u!.id;
}

let prof: string;
let admin: string;
let eleve: string;
let sansLicence: string;
let autreParcours: string;

beforeAll(async () => {
  prof = await utilisateur();
  await placerSousLicence(prof, { arene: "campus" });
  const classe = (await creerClasse({ enseignantId: prof, nom: "BTS CG 2", parcours: "comptabilite-generale" }))!;
  eleve = await utilisateur();
  await rejoindreClasse(eleve, classe.code, "Inès");

  // L'administrateur de l'établissement (org_admin), qui a inscrit son lycée.
  admin = (await etablissementSousLicence("Lycée de l'administrateur", { arene: "campus" })).userId;
  expect(await getTeacherOrgId(admin)).toBeTruthy();

  sansLicence = await utilisateur();

  // Offre Classe sur un autre parcours : le chapitre ne lui est pas ouvert.
  autreParcours = await utilisateur();
  await placerSousLicence(autreParcours, { arene: "classe", entreprises: ["hotel"], niveaux: [2] });
  await creerClasse({ enseignantId: autreParcours, nom: "BTS MCO 1", parcours: "mco" });
}, 120_000);

describe("GET /cours/[chapitre]/diaporama", () => {
  it("403 pour un visiteur", async () => {
    const r = await appeler();
    expect(r.status).toBe(403);
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    expect(r.headers.get("content-type") ?? "").not.toContain("presentation");
  });

  it("403 pour un élève, même dans une classe sous licence qui ouvre le chapitre", async () => {
    expect((await appeler(CHAPITRE, { invite: eleve })).status).toBe(403);
  });

  it("403 pour un enseignant sans licence, ou à qui l'offre n'ouvre pas ce chapitre", async () => {
    expect((await appeler(CHAPITRE, { session: sansLicence })).status).toBe(403);
    expect((await appeler(CHAPITRE, { session: autreParcours })).status).toBe(403);
  });

  it("200 et un PowerPoint pour l'enseignant sous licence, et pour l'administrateur de l'établissement", async () => {
    for (const qui of [prof, admin]) {
      const r = await appeler(CHAPITRE, { session: qui });
      expect(r.status).toBe(200);
      expect(r.headers.get("content-type")).toBe(TYPE_PPTX);
      expect(r.headers.get("cache-control")).toBe("private, no-store");
      expect(r.headers.get("content-disposition")).toBe(`attachment; filename="diaporama-${CHAPITRE}.pptx"`);
      const zip = await JSZip.loadAsync(await r.arrayBuffer());
      expect(zip.file("ppt/presentation.xml")).toBeTruthy();
      expect(zip.file("ppt/slides/slide1.xml")).toBeTruthy();
    }
  }, 60_000);

  it("404 pour un chapitre inconnu, ou hors de la liste blanche, même pour l'enseignant sous licence", async () => {
    expect((await appeler("pas-un-chapitre", { session: prof })).status).toBe(404);
    const autre = CHAPITRES.find((c) => c.code !== CHAPITRE && c.parcours === "comptabilite-generale")!;
    expect((await appeler(autre.code, { session: prof })).status).toBe(404);
  });

  /**
   * UN CHAPITRE LIBRE N'OUVRE PAS SON DIAPORAMA SANS LICENCE (la règle de ../acces.ts, `diaporamaPermis`,
   * que la route lit). Depuis novembre 2026, chaque diplôme a son chapitre libre
   * (config/cours/chapitres-libres.ts) : le diaporama reste un outil de la licence pour chacun d'eux.
   */
  it("un chapitre libre ne l'ouvre ni au visiteur, ni à l'élève, ni à l'enseignant sans licence ; il l'ouvre sous licence", async () => {
    const { diaporamaPermis } = await import("@/app/cours/acces");
    const libres = CHAPITRES.filter((c) => c.libre);
    expect(libres.length).toBeGreaterThan(1);
    for (const c of libres) {
      for (const qui of [{}, { invite: eleve }, { session: sansLicence }]) {
        session = qui.session ? { userId: qui.session, role: "teacher" } : null;
        invite = qui.invite ?? null;
        expect(await diaporamaPermis(c), `${c.code} : ${JSON.stringify(qui)}`).toBe(false);
      }
      session = { userId: prof, role: "teacher" };
      expect(await diaporamaPermis(c), c.code).toBe(true);
    }
  }, 60_000);
});
