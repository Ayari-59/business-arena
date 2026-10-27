import { describe, expect, it } from "vitest";
import { budgetDuTrimestre } from "../../src/config/cours/budget";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import type { Cas } from "../../src/config/cours/cas";
import { BUDGET_DE_TRESORERIE, ecartsDuBudget } from "../../src/config/cours/chapitres/budget-de-tresorerie";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import type { Etape } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";

/**
 * LE BUDGET DE TRÉSORERIE SUIT LES RÈGLES DE L'ARÈNE, DANS LES NEUF ENTREPRISES.
 *
 * Les formules que l'élève applique (encaissements, paiements au fournisseur, intérêts,
 * acompte d'impôt) sont celles du moteur : appliquées au deuxième trimestre réellement
 * joué, elles retrouvent ses flux. Le budget boucle, le réalisé aussi ; les deux cas de
 * l'écart existent (côté ventes, côté sorties). Aucun budget n'annonce plus de découvert.
 */

const chapitre = BUDGET_DE_TRESORERIE;
const etat = { soldes: {} };
const flux = (code: string, tour: number, label: string) =>
  anneeJouee(code).partie.rounds[tour]!.results["joueur"]!.cashFlow.items.find((i) => i.label === label)?.amount ?? 0;

function textesDe(e: Etape, cas: Cas): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("le budget de trésorerie chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const b = budgetDuTrimestre(code);
  const { partie } = anneeJouee(code);
  const r1 = partie.rounds[0]!.results["joueur"]!;
  const r2 = partie.rounds[1]!.results["joueur"]!;
  const s = scenarioByCode(code).scenario;
  const tva = s.finance.vatRate ?? 0;

  it("les formules de l'élève retrouvent les flux du deuxième trimestre joué", () => {
    // Encaissements = créances du début + ventes TTC − créances de fin.
    const encaissements = r1.balanceSheet.receivables + r2.incomeStatement.revenue * (1 + tva) - r2.balanceSheet.receivables;
    expect(encaissements).toBeCloseTo(flux(code, 1, "encaissements_clients"), 0);
    // Intérêts = dette restante × taux × 90 / 360 : ceux du budget sont ceux de l'arène.
    expect(b.prevu.interets).toBeCloseTo(r2.incomeStatement.interest, -1);
    // L'acompte d'impôt du premier trimestre suit la règle que le budget applique au deuxième.
    const report = anneeJouee(code).depart.exerciceFiscal?.report ?? anneeJouee(code).depart.taxLossCarryforward ?? 0;
    expect(s.finance.taxRate * Math.max(0, r1.incomeStatement.pretaxIncome - report)).toBeCloseTo(r1.incomeStatement.tax, 0);
    // La TVA reversée au deuxième trimestre est la dette de TVA du premier.
    expect(-flux(code, 1, "tva_decaissee")).toBeCloseTo(b.prevu.tva, -1);
  });

  it("le budget reconduit le premier trimestre : ventes, achats, acompte d'impôt recalculés de l'arène", () => {
    expect(b.prevu.ventesTtc).toBe(Math.round(Math.round(r1.incomeStatement.revenue) * (1 + tva)));
    expect(b.prevu.encaissements).toBe(b.t1.creancesFin + b.prevu.ventesTtc - b.t1.creancesFin);
    const achats = -flux(code, 0, "paiements_fournisseurs") + r1.balanceSheet.payables - anneeJouee(code).depart.finance.payables;
    expect(Math.abs(b.prevu.paiementsFournisseurs - achats)).toBeLessThanOrEqual(1);
    const p1 = Math.round(r1.incomeStatement.pretaxIncome);
    const p2 = p1 + Math.round(r1.incomeStatement.interest) - b.prevu.interets;
    const report = anneeJouee(code).depart.exerciceFiscal?.report ?? anneeJouee(code).depart.taxLossCarryforward ?? 0;
    const du = (x: number) => s.finance.taxRate * Math.max(0, x - report);
    expect(Math.abs(b.prevu.impot - (du(p1 + p2) - du(p1)))).toBeLessThanOrEqual(1);
  });

  it("la bonne réponse sur l'écart désigne le côté qui pèse le plus", () => {
    const ventes = Math.abs(b.realise.encaissements - b.prevu.encaissements);
    const sorties = Math.abs(b.realise.decaissements - b.prevu.decaissements);
    const etape = chapitre.etapes.find((e) => e.id === "d-ou-vient-l-ecart")!;
    if (etape.type !== "choix") throw new Error("choix attendu");
    const juste = etape.options(cas, etat).find((o) => o.juste)!;
    expect(juste.texte).toMatch(ventes >= sorties ? /^Les encaissements/ : /^Les décaissements/);
  });

  it("le budget boucle, le réalisé aussi, et le deuxième trimestre s'ouvre sur la trésorerie du premier", () => {
    expect(b.prevu.tresorerieFin).toBe(b.t1.tresorerieFin + b.prevu.encaissements - b.prevu.decaissements);
    expect(Math.abs(b.t1.tresorerieFin + b.realise.encaissements - b.realise.decaissements - b.realise.tresorerieFin)).toBeLessThanOrEqual(2);
    expect(Math.abs(r2.cashFlow.opening - b.t1.tresorerieFin)).toBeLessThanOrEqual(1);
    expect(b.prevu.impot).toBeGreaterThanOrEqual(0);
    // Au réalisé comme au budget, les encaissements sont ceux des clients : un remboursement d'impôt n'en est pas.
    expect(b.realise.encaissements).toBe(Math.round(flux(code, 1, "encaissements_clients")));
  });

  it("aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question ; des libellés uniques", () => {
    for (const e of chapitre.etapes) {
      for (const t of textesDe(e, cas)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      if (e.type === "montants") {
        const champs = e.champs(cas, etat);
        for (const c of champs) expect(Number.isFinite(c.attendu), e.id).toBe(true);
        expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      }
    }
  });
});

describe("le budget de trésorerie, quelle que soit l'entreprise", () => {
  // Dans l'année du bon gestionnaire, aucun budget n'annonce de découvert : la branche « découvert »
  // de l'étape « a-quoi-sert » ne se lit plus nulle part. La garde le constate ; si un découvert
  // revient, elle rougit, et il faudra revenir aux deux budgets.
  it("aucun budget n'annonce de découvert dans l'année du bon gestionnaire, et les deux causes d'écart (ventes, sorties) existent", () => {
    const budgets = ENTREPRISES_DU_COURS.map((c) => budgetDuTrimestre(c).prevu.tresorerieFin);
    expect(ENTREPRISES_DU_COURS.filter((_, i) => budgets[i]! < 0)).toEqual([]);
    const causes = new Set(ENTREPRISES_DU_COURS.map((c) => ecartsDuBudget(casDeLEntreprise(c)).principal));
    expect([...causes].sort()).toEqual(["decaissements", "encaissements"]);
  });

  it("est réservé (décision du propriétaire : la suite du cours sous licence), au palier 4, ses notions sont des fiches, ses étapes uniques", () => {
    expect(chapitre.libre).toBe(false);
    expect(chapitre.palier).toBe(4);
    expect(chapitre.parcours).toBe("controle-de-gestion");
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of chapitre.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  });
});
