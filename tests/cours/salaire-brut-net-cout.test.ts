import { describe, expect, it } from "vitest";
import { casDeLEntreprise, TAUX_PATRONAL, TAUX_SALARIAL } from "../../src/config/cours/cas";
import { SALAIRE_BRUT_NET_COUT, salaire } from "../../src/config/cours/chapitres/salaire-brut-net-cout";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { HAUSSE_DU_NET } from "../../src/config/cours/ressources-humaines";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * DU SALAIRE BRUT AU COÛT POUR L'ENTREPRISE, SUR LA PAIE DU CAS.
 *
 * Le brut d'un salarié est celui de la paie de l'équipe ; net et coût se recomposent aux taux du
 * cours ; une hausse du net coûte bien plus qu'elle ne rapporte au salarié.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("le salaire chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = salaire(cas);
  const chapitre = chapitreDuCas(SALAIRE_BRUT_NET_COUT, cas);

  it("le brut d'un salarié est celui de la paie de l'équipe, et net et coût se recomposent", () => {
    expect(s.brut * s.effectif).toBeCloseTo(cas.personnel.brut, 0);
    expect(s.net).toBeCloseTo(s.brut * (1 - TAUX_SALARIAL), 1);
    expect(s.cout).toBeCloseTo(s.brut * (1 + TAUX_PATRONAL), 1);
    expect(s.coutPour100DeNet).toBeCloseTo(((1 + TAUX_PATRONAL) / (1 - TAUX_SALARIAL)) * 100, 0);
  });

  it("une hausse du net coûte la hausse ÷ (1 − taux salarial) × (1 + taux patronal)", () => {
    expect(s.hausseDuCout).toBeCloseTo((HAUSSE_DU_NET / (1 - TAUX_SALARIAL)) * (1 + TAUX_PATRONAL), 1);
    const etape = chapitre.etapes.find((e) => e.id === "augmentation");
    if (etape?.type !== "choix") throw new Error("Pas d'étape augmentation");
    expect(etape.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toBe(`Environ ${montantEcrit(Math.round(s.hausseDuCout))}`);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
