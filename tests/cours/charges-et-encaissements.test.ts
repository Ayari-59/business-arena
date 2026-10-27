import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHARGES_ET_ENCAISSEMENTS, resultatDuTrimestre } from "../../src/config/cours/chapitres/charges-et-encaissements";
import { premierTrimestre } from "../../src/config/cours/chapitres/les-flux";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * CHARGES ET ENCAISSEMENTS TIENNENT DANS LES NEUF ENTREPRISES.
 *
 * Le mois se range deux fois, et ce que le chapitre dit « pour plus tard » tombe bien après
 * le 31 janvier ; les charges du premier trimestre redonnent le résultat de l'arène, une
 * fois les commissions sorties du coût des ventes ; la dotation et le remboursement sont
 * ceux de l'arène ; aucun texte ne sort un « undefined ».
 */

const FIN_DE_JANVIER = 31;

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi, String(x.montant)]), ...e.explication(cas)];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("charges et encaissements chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(CHARGES_ET_ENCAISSEMENTS, cas);
  const t = resultatDuTrimestre(cas);

  it("ce qui se paie plus tard tombe après janvier ; chaque tri a toutes ses catégories, des libellés uniques", () => {
    expect(cas.achat.echeance).toBeGreaterThan(FIN_DE_JANVIER);
    expect(cas.venteCredit.echeance).toBeGreaterThan(FIN_DE_JANVIER);
    expect(cas.personnel.dateUrssaf).toBeGreaterThan(FIN_DE_JANVIER);
    for (const e of chapitre.etapes) {
      if (e.type !== "tri") continue;
      const elements = e.elements(cas);
      expect(new Set(elements.map((x) => x.categorie)).size, e.id).toBe(e.categories.length);
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      for (const x of elements) {
        expect(x.montant, x.libelle).toBeGreaterThan(0);
        expect(x.libelle).not.toMatch(/"/);
      }
    }
  });

  it("les charges du trimestre redonnent le résultat de l'arène ; dotation et remboursement sont les siens", () => {
    const r = anneeJouee(code).partie.rounds[0]!.results["joueur"]!;
    expect(t.produits - t.totalCharges).toBeCloseTo(t.resultat, 1);
    expect(t.resultat).toBeCloseTo(r.incomeStatement.netIncome, 1);
    expect(t.charges.some((l) => l.libelle === "Autres charges")).toBe(false);
    expect(t.dotation).toBeCloseTo(r.incomeStatement.depreciation, 1);
    expect(t.remboursement).toBeGreaterThan(0);
    expect(premierTrimestre(cas).variation).toBeCloseTo(r.cashFlow.closing - r.cashFlow.opening, 0);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|à) les? /);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
