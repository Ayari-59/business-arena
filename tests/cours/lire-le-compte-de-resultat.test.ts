import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { LIRE_LE_COMPTE_DE_RESULTAT, compteDeResultat } from "../../src/config/cours/chapitres/lire-le-compte-de-resultat";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE COMPTE DE RÉSULTAT, SUR L'ANNÉE DE L'ARÈNE.
 *
 * Produits moins charges redonnent le résultat net de l'arène à l'euro près ; le résultat de
 * l'activité est celui des soldes de gestion ; les taux se recomposent ; la bonne réponse sur
 * l'activité suit son signe.
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
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas)];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("le compte de résultat chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = compteDeResultat(cas);
  const chapitre = chapitreDuCas(LIRE_LE_COMPTE_DE_RESULTAT, cas);

  it("produits moins charges redonnent le résultat de l'arène, et le résultat de l'activité celui des soldes", () => {
    expect(Math.abs(k.resultat - k.s.arene.resultatNet)).toBeLessThanOrEqual(1);
    expect(k.resultat).toBeCloseTo(k.s.resultatNet, 1);
    expect(k.resultatExploitation).toBeCloseTo(k.s.resultatExploitation, 1);
    expect(k.charges).toBeCloseTo(k.exploitation + k.financieres + k.impot, 1);
  });

  it("les taux se recomposent, et la réponse sur l'activité suit son signe", () => {
    expect(k.tauxDeResultat).toBeCloseTo((k.resultat / k.s.ventes) * 100, 1);
    expect(k.partDuPersonnel).toBeCloseTo((k.s.personnel / k.charges) * 100, 1);
    const etape = chapitre.etapes.find((e) => e.id === "activite-ou-financement");
    if (etape?.type !== "choix") throw new Error("Pas d'étape activite-ou-financement");
    expect(etape.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toMatch(k.resultatExploitation > 0 ? /^L'activité est rentable/ : /perd de l'argent/);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèêAEIOUYÉ]/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
