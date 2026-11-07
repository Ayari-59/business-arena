import { beforeEach, describe, expect, it, vi } from "vitest";
import { LE_BILAN_FINANCIER_POUR_LA_BANQUE } from "../../src/config/cours/bureaux/le-bilan-financier-pour-la-banque";
import { LE_DIAGNOSTIC_POUR_L_ASSEMBLEE } from "../../src/config/cours/bureaux/le-diagnostic-pour-l-assemblee";
import { LE_TABLEAU_DE_FINANCEMENT_DE_NOVA } from "../../src/config/cours/bureaux/le-tableau-de-financement-de-nova";
import { LES_SOLDES_POUR_LA_BANQUE } from "../../src/config/cours/bureaux/les-soldes-pour-la-banque";
import type { Bureau } from "../../src/config/cours/bureaux/types";
import { LE_BILAN_FONCTIONNEL_DE_L_ALTERNANT } from "../../src/config/cours/enquetes/le-bilan-fonctionnel-de-l-alternant";
import { LE_TABLEAU_DES_FLUX_DE_L_ASSISTANTE } from "../../src/config/cours/enquetes/le-tableau-des-flux-de-l-assistante";
import { LES_COMPTES_ANNUELS_DU_STAGIAIRE } from "../../src/config/cours/enquetes/les-comptes-annuels-du-stagiaire";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuBureau, servirLeBureau, type RetourDuBureau } from "../../src/pedagogy/cours/bureau-servi";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LES ACTIVITÉS DU LOT D, SERVIES : AUCUN CORRIGÉ DANS CE QUI PART AU NAVIGATEUR (pedagogy/cours/bureau-servi.ts,
 * app/cours/bureau/actions.ts, app/cours/enquete/actions.ts).
 *
 * Pour chacune des trois enquêtes et des trois bureaux du lot : la page ne sert ni catégorie, ni pourquoi,
 * ni valeur de case, ni option juste, ni explication, ni les chiffres que seule la correction donne ; puis
 * chaque geste se joue au serveur, faux puis juste, la correction demandée, l'accès contrôlé par l'action.
 */

const acces = vi.hoisted(() => ({ ouvert: true }));
vi.mock("../../src/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
vi.mock("@/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
// Le suivi de la classe (migration 0057) écrit en base : ici, seule la correction compte
// (tests/unit/suivi-des-activites-actions.test.ts vérifie ce que l'action y envoie).
vi.mock("../../src/app/cours/suivi-des-activites", () => ({ noterDansLaClasse: vi.fn(async () => undefined) }));
vi.mock("@/app/cours/suivi-des-activites", () => ({ noterDansLaClasse: vi.fn(async () => undefined) }));

const eur = (x: number) => espacesOrdinaires(montantEcrit(x));

/** Chaque activité, et les chiffres que seule sa correction donne. */
const ACTIVITES: readonly { b: Bureau; secrets: readonly number[]; ratios?: readonly string[] }[] = [
  { b: LES_SOLDES_POUR_LA_BANQUE, secrets: [254_034, 126_234, 105_297.07] },
  { b: LE_BILAN_FONCTIONNEL_DE_L_ALTERNANT, secrets: [323_297.07, 32_200.73] },
  { b: LE_BILAN_FINANCIER_POUR_LA_BANQUE, secrets: [427_117.45, 382_117.45, 201_087.07] },
  { b: LES_COMPTES_ANNUELS_DU_STAGIAIRE, secrets: [52_000, 68_831.11] },
  { b: LE_DIAGNOSTIC_POUR_L_ASSEMBLEE, secrets: [], ratios: ["13,11", "23,39", "34,42", "3,78", "26,72", "42,44"] },
  { b: LE_TABLEAU_DE_FINANCEMENT_DE_NOVA, secrets: [263_297.07, 335_297.07] },
  { b: LE_TABLEAU_DES_FLUX_DE_L_ASSISTANTE, secrets: [94_087.07, 218_000] },
];

function retour<G extends Exclude<RetourDuBureau, { refus: string }>["geste"]>(x: RetourDuBureau, geste: G) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 200)).toBe(geste);
  return x as Extract<RetourDuBureau, { geste: G }>;
}

describe.each(ACTIVITES)("$b.code", ({ b, secrets, ratios }) => {
  beforeEach(() => {
    acces.ouvert = true;
  });
  const servi = servirLeBureau(b);
  const texte = espacesOrdinaires(JSON.stringify(servi));
  // Les options des questions sont des montants à choisir : la bonne y est, parmi les autres.
  const sansLesOptions = espacesOrdinaires(JSON.stringify({ ...servi, etapes: servi.etapes.map((e) => (e.type === "reponse" ? { ...e, questions: [] } : e)) }));

  it("la page sert la pile et les étapes, dans l'ordre, au bon format", () => {
    expect(servi.format).toBe(b.format ?? "bureau");
    expect(servi.pile.map((p) => p.code)).toEqual(b.pile.map((p) => p.code));
    expect(servi.etapes.map((e) => e.id)).toEqual(b.etapes.map((e) => e.id));
  });

  it("aucune clé de corrigé, aucune case remplie, aucun texte de corrigé", () => {
    for (const cle of ["categorie", "pourquoi", "juste", "retour", "calcul", "indice", "explication", "raison", "ecritures"]) expect(texte, cle).not.toContain(`"${cle}":`);
    for (const e of servi.etapes) if (e.type === "etat") for (const l of e.grille.lignes) for (const c of l.cellules) if (c.saisir) expect(c.valeur).toBeNull();
    const corriges = b.etapes.flatMap((e) => [
      ...e.explication,
      ...(e.type === "classement" ? e.elements.map((x) => x.pourquoi) : []),
      ...(e.type === "reponse" ? e.questions.flatMap((q) => q.options.map((o) => o.retour)) : []),
      ...(e.type === "etat" ? e.grille.lignes.flatMap((l) => l.cellules.flatMap((c) => [c.calcul ?? "", c.indice ?? ""])).filter((t) => t.length > 12) : []),
    ]);
    for (const t of corriges) expect(texte, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
  });

  it("aucun chiffre que seule la correction donne, hors des options à choisir", () => {
    for (const x of secrets) expect(sansLesOptions, String(x)).not.toContain(eur(x));
    for (const x of ratios ?? []) expect(sansLesOptions, x).not.toContain(x);
  });

  it("classer : faux, il dit lesquelles sans dire où ; juste, il dit pourquoi", () => {
    for (const e of b.etapes) {
      if (e.type !== "classement") continue;
      const tout = Object.fromEntries(e.elements.map((x) => [x.code, e.categories[0]!.code]));
      const faux = retour(corrigerAuBureau(b, { etape: e.id, geste: "classer", choix: tout }), "classer");
      expect(faux.juste).toBe(false);
      expect(faux.pourquoi).toBeUndefined();
      expect(JSON.stringify(faux)).not.toContain('"categorie"');
      const bon = retour(corrigerAuBureau(b, { etape: e.id, geste: "classer", choix: Object.fromEntries(e.elements.map((x) => [x.code, x.categorie])) }), "classer");
      expect(bon.juste).toBe(true);
      expect(Object.keys(bon.pourquoi!).length).toBe(e.elements.length);
    }
  });

  it("les tableaux : une case fausse se dit sans sa valeur ; justes, la grille revient", () => {
    for (const e of b.etapes) {
      if (e.type !== "etat") continue;
      const solutions = solutionsDuTableau(e.grille);
      const cle = Object.keys(solutions).at(-1)!;
      const faux = retour(corrigerAuBureau(b, { etape: e.id, geste: "etat", saisies: { ...solutions, [cle]: "1" } }), "etat");
      expect(faux.juste).toBe(false);
      expect(faux.grille).toBeUndefined();
      const bon = retour(corrigerAuBureau(b, { etape: e.id, geste: "etat", saisies: solutions }), "etat");
      expect(bon.juste).toBe(true);
      expect(bon.explication!.map(espacesOrdinaires)).toEqual(e.explication.map(espacesOrdinaires));
    }
  });

  it("répondre : une option fausse dit pourquoi ; l'explication vient avec la dernière bonne réponse", () => {
    const e = b.etapes.find((x) => x.type === "reponse")!;
    if (e.type !== "reponse") throw new Error("pas de questions");
    const q = e.questions[0]!;
    const non = retour(corrigerAuBureau(b, { etape: e.id, geste: "repondre", question: q.id, option: q.options.find((o) => !o.juste)!.texte, justes: [] }), "repondre");
    expect([non.juste, non.fini]).toEqual([false, false]);
    const justes: string[] = [];
    for (const [i, x] of e.questions.entries()) {
      const oui = retour(corrigerAuBureau(b, { etape: e.id, geste: "repondre", question: x.id, option: x.options.find((o) => o.juste)!.texte, justes }), "repondre");
      expect(oui.juste).toBe(true);
      expect(oui.fini).toBe(i === e.questions.length - 1);
      justes.push(x.id);
    }
  });

  it("la correction demandée rend tout ce que chaque étape attendait", () => {
    for (const e of b.etapes) expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "montrer" }), "montrer").explication.map(espacesOrdinaires)).toEqual(e.explication.map(espacesOrdinaires));
  });

  it("l'action serveur de son format contrôle l'accès à chaque geste, et pas celle de l'autre format", async () => {
    const { corrigerAuBureauAction } = await import("../../src/app/cours/bureau/actions");
    const { corrigerALEnqueteAction } = await import("../../src/app/cours/enquete/actions");
    const [la, lautre] = b.format === "enquete" ? [corrigerALEnqueteAction, corrigerAuBureauAction] : [corrigerAuBureauAction, corrigerALEnqueteAction];
    const envoi = { etape: b.etapes[0]!.id, geste: "montrer" };
    expect("geste" in (await la(b.code, envoi))).toBe(true);
    expect(await lautre(b.code, envoi)).toEqual({ refus: "bureau" });
    acces.ouvert = false;
    expect(await la(b.code, envoi)).toEqual({ refus: "licence" });
  });
});
