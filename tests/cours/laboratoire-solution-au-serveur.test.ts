import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LA SOLUTION D'UN LABORATOIRE SE DEMANDE AU SERVEUR (décision du propriétaire, novembre 2026).
 *
 * La page ne porte plus la solution (tests/architecture/corriges-hors-du-navigateur.test.ts). La route
 * /api/cours/lecture la rend au geste « montrer », seulement quand la règle est remplie, vérifiée chez
 * elle : deux positions validées dans ce laboratoire (le jeton signé que rend chaque validation le dit),
 * ou l'enseignant connecté qui projette en mode classe. Le contrôle de licence est celui de la lecture.
 */

let ouvert = true;
let session: { userId: string; role: "teacher" } | null = null;
vi.mock("@/app/cours/acces", () => ({ chapitreOuvert: async () => ouvert }));
vi.mock("@/lib/session", () => ({ getSession: async () => session }));

import { POST } from "@/app/api/cours/lecture/route";
import { casDeLEntreprise } from "@/config/cours/cas";
import { chapitreParCode } from "@/config/cours/registre";
import { chapitreDuCas } from "@/pedagogy/cours/deroule";
import { lireLeLaboratoire } from "@/pedagogy/cours/chapitre-servi";
import { signerLesEssais } from "@/pedagogy/cours/essais-du-laboratoire";
import type { EtapeSimulation } from "@/config/cours/types";

const CHAPITRE = "creation-premier-bilan";
const ENTREPRISE = "nova";
const ETAPE = "le-laboratoire-du-premier-bilan";
const cas = casDeLEntreprise(ENTREPRISE);
const labo = chapitreDuCas(chapitreParCode(CHAPITRE)!, cas).etapes.find((e) => e.id === ETAPE) as EtapeSimulation;
const depart = Object.fromEntries(labo.leviers(cas).map((l) => [l.code, l.depart]));
const solution = labo.defi(cas).solution;

const appeler = async (corps: Record<string, unknown>) => {
  const r = await POST(
    new Request("http://local/api/cours/lecture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chapitre: CHAPITRE, entreprise: ENTREPRISE, etape: ETAPE, ...corps }),
    }),
  );
  return { status: r.status, corps: (await r.json()) as Record<string, unknown> };
};
const valider = (position: Record<string, number>, jeton?: unknown) => appeler({ geste: "valider", position, ...(jeton === undefined ? {} : { jeton }) });
const montrer = (jeton?: unknown, classe?: boolean) => appeler({ geste: "montrer", ...(jeton === undefined ? {} : { jeton }), ...(classe ? { classe } : {}) });

beforeEach(() => {
  ouvert = true;
  session = null;
});

describe("« Montrer une solution » d'un laboratoire, au serveur", () => {
  it("le départ ne relève pas le défi : les essais qui suivent sont des essais ratés", () => {
    expect(labo.defi(cas).atteint(depart)).toBe(false);
  });

  it("refuse avant deux essais validés, et ne dit rien de la solution", async () => {
    const r0 = await montrer();
    expect(r0.status).toBe(403);
    expect(r0.corps).toEqual({ refus: "essais" });
    const v1 = await valider(depart);
    expect(v1.status).toBe(200);
    expect(v1.corps.atteint).toBe(false);
    expect(v1.corps.explication).toBeNull();
    expect(typeof v1.corps.jeton).toBe("string");
    const r1 = await montrer(v1.corps.jeton);
    expect(r1.status).toBe(403);
    expect(JSON.stringify(r1.corps)).not.toContain("solution");
  });

  it("rend la solution et sa lecture, explication comprise, après deux essais validés", async () => {
    const v1 = await valider(depart);
    const v2 = await valider(depart, v1.corps.jeton);
    const r = await montrer(v2.corps.jeton);
    expect(r.status).toBe(200);
    expect(r.corps.solution).toEqual(solution);
    expect(r.corps.lecture).toEqual(JSON.parse(JSON.stringify(lireLeLaboratoire(labo, cas, solution))));
    expect((r.corps.lecture as { atteint: boolean }).atteint).toBe(true);
    expect(((r.corps.lecture as { explication: string[] }).explication ?? []).length).toBeGreaterThan(0);
    expect(r.corps.lecture).not.toHaveProperty("jeton");
  });

  it("le jeton se lit comme inconnu : forgé, d'un autre laboratoire ou d'une autre entreprise, mal formé, il ne vaut rien", async () => {
    const lieu = { chapitre: CHAPITRE, entreprise: ENTREPRISE, etape: ETAPE };
    expect((await montrer(signerLesEssais(lieu, 2, "un-autre-secret"))).status).toBe(403);
    expect((await montrer(signerLesEssais({ ...lieu, entreprise: "hotel" }, 5))).status).toBe(403);
    expect((await montrer(signerLesEssais({ ...lieu, etape: "autre" }, 5))).status).toBe(403);
    expect((await montrer(`2.${"0".repeat(32)}`)).status).toBe(403);
    expect((await montrer("x".repeat(10_000))).status).toBe(403);
    expect((await montrer({ essais: 9 })).status).toBe(403);
    expect((await montrer(signerLesEssais(lieu, 2))).status).toBe(200);
    // Un jeton faux à la validation repart de zéro : une seule validation ne suffit pas.
    const v = await valider(depart, `9.${"f".repeat(32)}`);
    expect((await montrer(v.corps.jeton)).status).toBe(403);
  });

  it("une position hors des leviers est refusée, sans jeton", async () => {
    const r = await valider({ ...depart, [labo.leviers(cas)[0]!.code]: 1e12 });
    expect(r.status).toBe(400);
    expect(r.corps).toEqual({ refus: "position" });
  });

  it("la validation de la bonne position rend l'explication avec la réussite", async () => {
    const v = await valider(solution);
    expect(v.corps.atteint).toBe(true);
    expect((v.corps.explication as string[]).length).toBeGreaterThan(0);
  });

  it("en mode classe, tout de suite pour l'enseignant connecté, jamais pour qui ajoute seulement « classe »", async () => {
    expect((await montrer(undefined, true)).status).toBe(403);
    session = { userId: "prof", role: "teacher" };
    const r = await montrer(undefined, true);
    expect(r.status).toBe(200);
    expect(r.corps.solution).toEqual(solution);
    // Sans le mode classe, l'enseignant suit la règle de l'élève.
    expect((await montrer()).status).toBe(403);
  });

  it("le même contrôle de licence que la lecture : refusé sans licence, même avec deux essais", async () => {
    const lieu = { chapitre: CHAPITRE, entreprise: ENTREPRISE, etape: ETAPE };
    ouvert = false;
    session = { userId: "prof", role: "teacher" };
    const r = await montrer(signerLesEssais(lieu, 2), true);
    expect(r.status).toBe(403);
    expect(r.corps).toEqual({ refus: "licence" });
    expect((await valider(depart)).status).toBe(403);
  });
});
