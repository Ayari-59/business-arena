import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { campagnesRejouees } from "../../src/config/cours/campagne";
import { COMMUNICATION, COMMUNICATIONS, communication } from "../../src/config/cours/chapitres/communication";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * CE QUE RAPPORTE LA COMMUNICATION, SUR LES BUDGETS QUE L'ARÈNE REJOUE.
 *
 * Le chapitre se joue là où les ventes répondent au budget ; les ventes montent de moins en
 * moins d'un budget à l'autre ; le gain et le coût d'une vente se recomposent ; le meilleur
 * budget et la cause des rendements décroissants suivent les ventes rejouées.
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

it("le chapitre se joue là où les ventes répondent au budget rejoué, et seulement là", () => {
  const repondent = ENTREPRISES_DU_COURS.filter((code) => {
    const v = campagnesRejouees(code);
    return v.at(-1)!.commandes > v[0]!.commandes;
  });
  expect([...COMMUNICATIONS].sort()).toEqual([...repondent].sort());
});

describe.each(COMMUNICATIONS)("la communication chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = communication(cas);
  const chapitre = chapitreDuCas(COMMUNICATION, cas);
  const juste = (id: string) => {
    const e = chapitre.etapes.find((x) => x.id === id);
    if (e?.type !== "choix") throw new Error(`Pas d'étape ${id}`);
    return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
  };

  it("les ventes montent de moins en moins d'un budget à l'autre", () => {
    const v = k.budgets;
    for (let i = 1; i < v.length; i++) expect(v[i]!.commandes).toBeGreaterThanOrEqual(v[i - 1]!.commandes);
    for (let i = 2; i < v.length; i++) expect(v[i]!.commandes - v[i - 1]!.commandes).toBeLessThanOrEqual(v[i - 1]!.commandes - v[i - 2]!.commandes);
  });

  it("le gain et le coût d'une vente gagnée se recomposent", () => {
    expect(k.ventesEnPlus).toBe(k.jouee.commandes - k.sans.commandes);
    expect(k.coutParVente).toBeCloseTo(k.jouee.budget / k.ventesEnPlus, 2);
    expect(k.gain).toBe(k.jouee.marge - k.sans.marge - k.jouee.budget);
  });

  it("le meilleur budget et la cause des rendements décroissants suivent les ventes rejouées", () => {
    const meilleur = k.budgets.reduce((a, b) => (b.resultat > a.resultat ? b : a));
    expect(k.meilleur.budget).toBe(meilleur.budget);
    expect(juste("meilleur-budget")).toBe(montantEcrit(meilleur.budget));
    const plafond = k.budgets.at(-1)!.commandes === k.budgets.at(-2)!.commandes;
    expect(juste("rendements")).toMatch(plafond ? /ne peut plus servir/ : /plus faciles/);
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
