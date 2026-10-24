import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { PRIX_PSYCHOLOGIQUE, prixPsychologique } from "../../src/config/cours/chapitres/prix-psychologique";
import { SEGMENTATIONS } from "../../src/config/cours/chapitres/segmenter-et-cibler";
import { priceEffect } from "../../src/engine/market/attraction";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE PRIX PSYCHOLOGIQUE, SUR LES REPÈRES DU SCÉNARIO ET L'ATTRACTION DU MOTEUR.
 *
 * Les repères sont ceux du scénario ; la demande perdue au seuil est celle que calcule la
 * fonction d'attraction ; elle dépasse de loin ce que la seule élasticité ferait perdre ; la
 * clientèle « avantageuse » est unique et suit l'écart au prix jugé normal.
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

describe.each(SEGMENTATIONS)("le prix psychologique chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const p = prixPsychologique(cas);
  const chapitre = chapitreDuCas(PRIX_PSYCHOLOGIQUE, cas);
  const segments = scenarioByCode(code).scenario.market.segments;

  it("les repères sont ceux du scénario, et le seuil étudié est celui de la clientèle qui rapporte le plus parmi celles qui en ont un", () => {
    for (const k of p.clienteles) {
      const g = segments.find((s) => s.code === k.code)!;
      expect(k.normal).toBe(g.refPrice);
      expect(k.tropBas).toBe(g.minAcceptablePrice);
      expect(k.seuil).toBe(g.psychThresholds[0]?.threshold ?? null);
    }
    const avecSeuil = p.clienteles.filter((k) => k.seuil !== null);
    expect(p.etudie.chiffreDAffaires).toBe(Math.max(...avecSeuil.map((k) => k.chiffreDAffaires)));
  });

  it("la demande perdue au seuil est celle de l'attraction, bien plus que la seule élasticité", () => {
    const g = segments.find((s) => s.code === p.etudie.code)!;
    expect(p.perte).toBeCloseTo((1 - priceEffect(p.seuil + 0.1, g) / priceEffect(p.seuil - 0.1, g)) * 100, 1);
    expect(p.perte).toBeGreaterThan(p.hausse * Math.abs(g.priceElasticity) * 3);
    expect(p.sous).toBeLessThan(p.seuil);
    expect(p.dessus).toBeGreaterThan(p.seuil);
  });

  it("la clientèle avantageuse est unique, et suit l'écart au prix jugé normal", () => {
    const ecarts = p.clienteles.map((k) => k.ecart);
    expect(ecarts.filter((e) => e === Math.min(...ecarts))).toHaveLength(1);
    const etape = chapitre.etapes.find((e) => e.id === "avantageux");
    if (etape?.type !== "choix") throw new Error("Pas d'étape avantageux");
    const nom = p.clienteles.find((k) => k.ecart === Math.min(...ecarts))!.nom;
    expect(etape.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toBe(nom);
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
