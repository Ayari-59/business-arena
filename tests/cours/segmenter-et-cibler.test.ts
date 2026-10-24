import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { SEGMENTATIONS, SEGMENTER_ET_CIBLER, segmentation } from "../../src/config/cours/chapitres/segmenter-et-cibler";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * SEGMENTER ET CIBLER, SUR LES CLIENTÈLES DU SCÉNARIO ET LE TRIMESTRE DE L'ARÈNE.
 *
 * Les segments sont ceux du scénario, leurs tailles et leurs ventes celles du moteur ; les
 * poids font cent ; chaque cible est le segment que sa sensibilité désigne.
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

describe.each(SEGMENTATIONS)("la segmentation chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const g = segmentation(cas);
  const chapitre = chapitreDuCas(SEGMENTER_ET_CIBLER, cas);
  const segments = scenarioByCode(code).scenario.market.segments;
  const juste = (id: string) => {
    const e = chapitre.etapes.find((x) => x.id === id);
    if (e?.type !== "choix") throw new Error(`Pas d'étape ${id}`);
    return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
  };

  it("les segments sont ceux du scénario, avec les tailles et les ventes du moteur", () => {
    const r = anneeJouee(code).partie.rounds[0]!.results["joueur"]!;
    expect(g.clienteles.length).toBeGreaterThanOrEqual(2);
    // Un segment que personne n'a pu acheter ce trimestre (CampusTech chez NOVA) ne se propose pas comme cible.
    for (const k of g.clienteles) expect(k.taille > 0 && k.ventes > 0, k.nom).toBe(true);
    for (const k of g.clienteles) {
      const v = r.market.bySegment[k.code]!;
      expect(k.taille).toBe(Math.round(v.potential));
      expect(k.ventes).toBe(Math.round(v.sold));
      expect(k.prixNormal).toBe(segments.find((s) => s.code === k.code)!.refPrice);
    }
    expect(g.clienteles.reduce((t, k) => t + k.poids, 0)).toBeCloseTo(100, 0);
  });

  it("chaque cible est le segment que sa sensibilité désigne", () => {
    const de = (k: (typeof g.clienteles)[number]) => segments.find((s) => s.code === k.code)!;
    const max = (f: (s: (typeof segments)[number]) => number) => g.clienteles.reduce((a, b) => (f(de(b)) > f(de(a)) ? b : a));
    expect(juste("cible-premium")).toBe(max((s) => s.qualitySensitivity).nom);
    expect(juste("cible-promotion")).toBe(max((s) => -s.priceElasticity).nom);
    expect(juste("reserve")).toBe(g.clienteles.reduce((a, b) => (b.taille - b.ventes > a.taille - a.ventes ? b : a)).nom);
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
