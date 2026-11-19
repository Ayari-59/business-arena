import { randomUUID } from "node:crypto";
import { createElement, type ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

/**
 * LES NOMS DES OFFRES SE LISENT AU CATALOGUE EN VIGUEUR (décision du propriétaire, novembre
 * 2026 : il renomme lui-même les offres dans /admin/offres).
 *
 * Dans la base de test, l'offre « Programme » devient « Formation » par /admin/offres
 * (`enregistrerOffre`). Les pages rendues jusqu'au bout (/tarifs, /ecoles, /enseignants,
 * l'accueil, le guide et son « Combien ça coûte ? »), les comparatifs, les refus et un devis
 * nouveau disent « Formation ». Une licence vendue avant garde « Programme », le nom copié à
 * la vente. Garde du code : tests/architecture/noms-au-catalogue.test.ts.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "198.51.100.7" }),
  cookies: async () => ({ get: () => undefined, getAll: () => [], has: () => false }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: () => undefined, replace: () => undefined, refresh: () => undefined, prefetch: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));
const courriels: { sujet: string; texte: string }[] = [];
vi.mock("@/lib/courriel", () => ({
  envoyerCourriel: vi.fn(async (c: { sujet: string; texte: string }) => {
    courriels.push(c);
    return { envoye: false, raison: "test" };
  }),
}));

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orgLicences, users } from "@/db/schema";
import { enregistrerLAffichage, enregistrerOffre, lireLeCatalogue, lireLesNoms } from "@/services/catalogue.service";
import { attribuerUneLicence } from "@/services/vente.service";
import { etatDeLOffre, LicenceDepasseeError, verifierLaLicence } from "@/services/acces.service";
import { getLicenceStatus, parametrageDe } from "@/services/licence.service";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { envoyerDemandeDeDevisAction } from "@/app/devis/actions";
import { horsLicence, ligneDePrix, nomsDuCatalogue, NOMS_PAR_DEFAUT, reponseCombien, variablesDuCatalogue } from "@/config/tarifs";
import { vueDesTarifs } from "@/config/catalogue";
import { LigneDEtatDeLOffre } from "@/components/etat-de-l-offre";

/** Une page serveur asynchrone, rendue jusqu'au bout. */
async function rendre(c: ComponentType<Record<string, unknown>>, props: Record<string, unknown> = {}): Promise<string> {
  const { prerenderToNodeStream } = await import("react-dom/static");
  const { prelude } = await prerenderToNodeStream(createElement(c, props));
  let html = "";
  for await (const morceau of prelude) html += String(morceau);
  return html;
}
const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[  ]/g, " ")
    .replace(/\s+/g, " ");

const page = async (chemin: string): Promise<string> =>
  texte(await rendre((await import(chemin)).default as ComponentType<Record<string, unknown>>));

let n = 0;
async function enseignant(admin = false): Promise<{ userId: string; orgId: string }> {
  n += 1;
  const r = await registerTeacher({
    email: `noms-${n}-${randomUUID()}@lycee.test`,
    password: "motdepasse!",
    displayName: `Prof ${n}`,
    schoolName: `Lycée des noms ${n}`,
  });
  if ("error" in r) throw new Error(r.error);
  await db.update(users).set({ emailConfirmeLe: new Date() }).where(eq(users.id, r.userId));
  if (admin) await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.id, r.userId));
  return { userId: r.userId, orgId: (await getTeacherOrgId(r.userId))! };
}

describe("« Programme » renommée « Formation » dans /admin/offres", () => {
  it("le site entier dit « Formation » ; la licence vendue avant garde « Programme »", { timeout: 120_000 }, async () => {
    const admin = await enseignant(true);
    const client = await enseignant(false);

    // AVANT : les noms par défaut, et une licence Programme vendue (son nom copié).
    expect(await lireLesNoms()).toEqual(NOMS_PAR_DEFAUT);
    await attribuerUneLicence(admin.userId, client.orgId, {
      offre: "programme",
      episodes: false,
      entreprise: "nova",
      niveau: null,
      maxEnseignants: 4,
      label: "Année 2026-2027",
      startsAt: new Date(Date.now() - 24 * 3600 * 1000),
      endsAt: new Date(Date.now() + 300 * 24 * 3600 * 1000),
      reference: null,
      nature: "vendue",
      prixCatalogueCents: null,
      remise: null,
      motifGratuite: null,
    });
    expect((await page("@/app/tarifs/page"))).toContain("Programme");

    // LE RENOMMAGE, comme l'admin l'enregistre (le nom d'une offre de la grille n'est plus figé).
    const programme = (await lireLeCatalogue()).offres.find((o) => o.code === "programme")!;
    await enregistrerOffre(admin.userId, { ...programme, nom: "Formation" }, "modification");
    const noms = await lireLesNoms();
    expect(noms.programme).toBe("Formation");
    expect(nomsDuCatalogue(await lireLeCatalogue())).toEqual({ ...NOMS_PAR_DEFAUT, programme: "Formation" });

    // /tarifs : la carte, les questions, les conditions de vente, la description.
    const tarifs = await page("@/app/tarifs/page");
    expect(tarifs).toContain("Formation");
    expect(tarifs).toContain("Quelle différence entre Classe, Formation et Campus ?");
    expect(tarifs).toContain("Durée : un an pour les offres Classe et Formation");
    expect(tarifs).not.toMatch(/\bProgramme\b/);
    const { generateMetadata } = (await import("@/app/tarifs/page")) as unknown as {
      generateMetadata: () => Promise<{ description: string }>;
    };
    await enregistrerLAffichage(admin.userId, { prixPublics: true });
    expect((await generateMetadata()).description).toContain("offre Formation");

    // Les comparatifs : la mention de Campus, prix publics allumés.
    const catalogue = await lireLeCatalogue();
    const campus = vueDesTarifs(catalogue, variablesDuCatalogue(noms), { prix: true }).cartes.find((c) => c.code === "campus")!;
    expect(campus.mention).toMatch(/moins cher que \d+ offres Formation$/);
    expect(await page("@/app/tarifs/page")).toMatch(/moins cher que \d+ offres Formation/);
    expect(ligneDePrix(catalogue, true)).toContain("offre Formation");
    // « Combien ça coûte ? », prix allumés puis éteints.
    expect(reponseCombien(catalogue, true)).toContain("l'offre Formation");
    await enregistrerLAffichage(admin.userId, { prixPublics: false });
    expect(reponseCombien(await lireLeCatalogue(), false)).toContain("l'offre Formation pour un programme");

    // /ecoles, /enseignants, l'accueil, le guide (« Combien ça coûte ? » et sa bande finale).
    const ecoles = await page("@/app/ecoles/page");
    expect(ecoles).toContain("Devis Campus ou Formation");
    expect(ecoles).toContain("Formation");
    expect(ecoles).not.toMatch(/\bProgramme\b/);
    const enseignants = await page("@/app/enseignants/page");
    expect(enseignants).toContain("la classe avec les offres Classe, Formation et Campus");
    expect(enseignants).not.toMatch(/\bProgramme\b/);
    const accueil = await page("@/app/page");
    expect(accueil).toContain("Pour vos classes : les offres Classe, Formation et Campus , sur devis.");
    expect(accueil).not.toMatch(/\bProgramme\b/);
    const guide = await page("@/app/guide/page");
    expect(guide).toContain("Combien ça coûte ?");
    expect(guide).toContain("l'offre Formation pour un programme");
    expect(guide).toContain("La partie de classe vient avec les offres Classe, Formation et Campus");

    // Un devis NOUVEAU prend le nom en vigueur : l'accusé de réception le dit.
    const f = new FormData();
    for (const [k, v] of Object.entries({
      offre: "programme",
      nom: "Claire Martin",
      fonction: "Directrice des études",
      organisation: "Lycée Pasteur",
      identifiant: "",
      effectif: "4",
      entreprise: "nova",
      niveau: "",
      email: `claire-${randomUUID()}@ecole.test`,
      message: "",
      codePromo: "",
      site: "",
    }))
      f.set(k, v);
    courriels.length = 0;
    const r = await envoyerDemandeDeDevisAction({ error: null, ok: null, values: null }, f);
    expect(r.error).toBeNull();
    expect(courriels.map((c) => c.sujet)).toContain("Votre demande de devis Business Arena · Offre Formation");

    // LA LICENCE DÉJÀ ÉMISE garde « Programme », le nom copié à la vente.
    const statut = await getLicenceStatus(client.orgId);
    expect(statut.licence?.nomDeLOffre).toBe("Programme");
    const etat = await etatDeLOffre(client.userId);
    const ligne = texte(await rendre(LigneDEtatDeLOffre as ComponentType<Record<string, unknown>>, { etat, niveauMaxGratuit: 3, noms }));
    expect(ligne).toContain("Offre Programme");
    expect(ligne).not.toContain("Formation");
    // Ses refus : « Votre offre Programme » (la licence), « l'offre Campus » (le catalogue).
    const p = parametrageDe(statut.licence!)!;
    expect(horsLicence(noms, p, { entreprise: "hotel" })?.message).toMatch(/^Votre offre Programme couvre/);
    const refus = await verifierLaLicence(client.orgId, { scenarioCode: "hotel", niveau: 1 }).catch((e: unknown) => e);
    expect(refus).toBeInstanceOf(LicenceDepasseeError);
    expect((refus as Error).message).toMatch(/^Votre offre Programme couvre/);
    const [ligneEnBase] = await db.select().from(orgLicences).where(eq(orgLicences.organizationId, client.orgId));
    expect((ligneEnBase!.conditions as { nom: string }).nom).toBe("Programme");

    // Une Classe qui bloque sur le niveau nomme l'offre au-dessus au catalogue en vigueur.
    expect(
      horsLicence(noms, { offre: "classe", entreprises: ["nova"], niveaux: [3], maxEnseignants: 1, maxPartiesEnCours: 1 }, { niveau: 4 })?.message,
    ).toContain("l'offre Formation ouvre les niveaux");
  });
});
