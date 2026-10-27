import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { MARCHES, MARCHE_ET_PART_DE_MARCHE, marcheEtPart } from "../../src/config/cours/chapitres/marche-et-part-de-marche";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE MARCHÉ ET LA PART DE MARCHÉ, SUR L'ANNÉE DE L'ARÈNE.
 *
 * La part de marché est celle que le moteur calcule (ventes ÷ demande potentielle) ; la part
 * relative se lit face au premier concurrent ; la position suit le rang des ventes, la réponse
 * sur les prix suit le prix du leader ; l'évolution se recompose. Aucun nom de concurrent ne
 * reste sans contraction (« de Le Comptoir »).
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

describe.each(MARCHES)("le marché chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const m = marcheEtPart(cas);
  const chapitre = chapitreDuCas(MARCHE_ET_PART_DE_MARCHE, cas);
  const etape = (id: string) => chapitre.etapes.find((e) => e.id === id)!;

  it("la part de marché est celle que le moteur calcule, pour chaque enseigne", () => {
    const t = anneeJouee(code).partie.rounds[0]!;
    for (const e of m.debut.enseignes) expect(Math.abs(e.part - t.results[e.id]!.market.totalShare * 100), e.nom).toBeLessThan(0.11);
    expect(m.debut.enseignes).toHaveLength(3);
    expect(m.autres).toBeGreaterThanOrEqual(0);
  });

  it("la part relative se lit face au premier concurrent, et la position suit le rang des ventes", () => {
    const concurrents = m.debut.enseignes.filter((e) => e.id !== "joueur");
    expect(m.premierConcurrent.ventes).toBe(Math.max(...concurrents.map((e) => e.ventes)));
    expect(m.partRelative).toBeCloseTo(m.debut.entreprise.part / m.premierConcurrent.part, 2);
    expect(m.rang).toBe(1 + m.debut.enseignes.filter((e) => e.ventes > m.debut.entreprise.ventes).length);
    const position = etape("position");
    if (position.type !== "choix") throw new Error("Pas d'étape position");
    const juste = position.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(m.rang === 1 ? /^Le leader/ : m.rang === 2 ? /^Le challenger/ : /^Le suiveur/);
  });

  it("la réponse sur les prix suit le prix du leader", () => {
    const prix = etape("prix");
    if (prix.type !== "choix") throw new Error("Pas d'étape prix");
    const tries = [...m.debut.enseignes].sort((a, b) => a.prix - b.prix);
    const attendu = tries[0]!.id === m.leader.id ? /moins chère/ : tries.at(-1)!.id === m.leader.id ? /plus chère/ : /ni le plus cher/;
    expect(prix.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toMatch(attendu);
  });

  it("l'évolution du marché, des ventes et de la part se recompose", () => {
    expect(m.evolutionDuMarche).toBeCloseTo((m.fin.marche / m.debut.marche - 1) * 100, 1);
    expect(m.evolutionDesVentes).toBeCloseTo((m.fin.entreprise.ventes / m.debut.entreprise.ventes - 1) * 100, 1);
    expect(m.points).toBeCloseTo(m.fin.entreprise.part - m.debut.entreprise.part, 1);
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
