import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { DEMANDE_ET_PRIX, demandeEtPrix } from "../../src/config/cours/chapitres/demande-et-prix";
import { prixRejoues } from "../../src/config/cours/decision";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA DEMANDE RÉPOND AU PRIX, SUR LE TRIMESTRE QUE L'ARÈNE REJOUE.
 *
 * La demande est celle du moteur (ventes et ventes perdues) aux trois prix ; l'élasticité se
 * recompose ; la bonne réponse suit l'élasticité ; l'explication du chiffre d'affaires suit son
 * signe, y compris le cas limite où la demande peu élastique fait tout de même baisser le
 * chiffre d'affaires sur une hausse de dix pour cent.
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

describe.each(ENTREPRISES_DU_COURS)("la demande et le prix chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const d = demandeEtPrix(cas);
  const chapitre = chapitreDuCas(DEMANDE_ET_PRIX, cas);

  it("la demande aux trois prix est celle du moteur, et elle baisse quand le prix monte", () => {
    const v = prixRejoues(code);
    expect([d.bas.demande, d.base.demande, d.haut.demande]).toEqual(v.map((x) => x.quantite + x.perdues));
    expect(d.bas.demande).toBeGreaterThan(d.base.demande);
    expect(d.haut.demande).toBeLessThan(d.base.demande);
  });

  it("l'élasticité se recompose, et la bonne réponse la suit", () => {
    expect(d.elasticite).toBeCloseTo(d.variationDemande / d.variationPrix, 2);
    expect(d.elasticite).toBeLessThan(0);
    const etape = chapitre.etapes.find((e) => e.id === "elastique");
    if (etape?.type !== "choix") throw new Error("Pas d'étape elastique");
    expect(etape.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toMatch(Math.abs(d.elasticite) > 1 ? /^Élastique/ : /^Peu élastique/);
  });

  it("l'explication du chiffre d'affaires suit son signe, cas limite compris", () => {
    expect(d.caAvant).toBe(Math.round(d.base.demande * d.base.prix));
    expect(d.caApres).toBe(Math.round(d.haut.demande * d.haut.prix));
    expect(d.variationCa).toBeCloseTo((d.caApres / d.caAvant - 1) * 100, 1);
    const etape = chapitre.etapes.find((e) => e.id === "chiffre-d-affaires");
    if (etape?.type !== "montants") throw new Error("Pas d'étape chiffre-d-affaires");
    const texte = etape.explication(cas, { soldes: {} }).join(" ");
    expect(texte).toMatch(d.variationCa >= 0 ? /monte/ : d.elastique ? /élastique\./ : /tout juste/);
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
