import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { NEGOCIATIONS } from "../../src/config/cours/chapitres/negocier-le-prix";
import { TABLEAU_DE_BORD_COMMERCIAL, causeDeLaChute, tableauCommercial } from "../../src/config/cours/chapitres/tableau-de-bord-commercial";
import { BAISSE_DU_SERVICE_QUI_SIGNALE_L_OFFRE } from "../../src/config/cours/negociation";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE TABLEAU DE BORD COMMERCIAL, SUR L'ANNÉE DE L'ARÈNE.
 *
 * Les quatre trimestres sont ceux du moteur ; le trimestre qui décroche est celui de la plus
 * forte baisse ; la bonne réponse sur sa cause suit le taux de service puis la demande ; les
 * ventes manquées se recomposent.
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

describe.each(NEGOCIATIONS)("le tableau de bord commercial chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = tableauCommercial(cas);
  const chapitre = chapitreDuCas(TABLEAU_DE_BORD_COMMERCIAL, cas);
  const tours = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);

  it("les quatre trimestres sont ceux du moteur", () => {
    expect(k.trimestres).toHaveLength(tours.length);
    for (const [i, t] of k.trimestres.entries()) {
      const r = tours[i]!;
      const seg = Object.values(r.market.bySegment);
      expect(t.chiffreDAffaires).toBe(Math.round(r.incomeStatement.revenue));
      expect(t.ventes).toBe(Math.round(seg.reduce((s, v) => s + v.sold, 0)));
      expect(t.demande).toBe(Math.round(seg.reduce((s, v) => s + v.demandForCompany, 0)));
      expect(t.service).toBe(Math.round((t.ventes / t.demande) * 1000) / 10);
      expect(t.partDeMarche).toBeCloseTo(r.market.totalShare * 100, 0);
    }
  });

  it("le trimestre qui décroche est celui de la plus forte baisse, et sa cause suit le service puis la demande", () => {
    const baisses = k.trimestres.slice(1).map((t, i) => k.trimestres[i]!.chiffreDAffaires - t.chiffreDAffaires);
    expect(k.chute.baisse).toBe(Math.max(...baisses));
    expect(k.chute.baisse).toBeGreaterThan(0);
    const { t, avant } = k.chute;
    const attendue = t.service < avant.service - BAISSE_DU_SERVICE_QUI_SIGNALE_L_OFFRE ? "offre" : t.demande < avant.demande ? "demande" : "prix";
    expect(causeDeLaChute(k)).toBe(attendue);
    const etape = chapitre.etapes.find((e) => e.id === "diagnostic");
    if (etape?.type !== "choix") throw new Error("Pas d'étape diagnostic");
    const juste = etape.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(attendue === "offre" ? /ne l'a pas servie/ : attendue === "demande" ? /moins de clients/ : /prix/);
  });

  it("les ventes manquées et les évolutions se recomposent", () => {
    expect(k.manquees).toBe(k.dernier.demande - k.dernier.ventes);
    expect(Math.abs(k.caManque - k.manquees * k.dernier.prixMoyen)).toBeLessThan(1);
    expect(k.evolutionCa).toBeCloseTo((k.dernier.chiffreDAffaires / k.t1.chiffreDAffaires - 1) * 100, 1);
    expect(k.pointsDePart).toBeCloseTo(k.chute.t.partDeMarche - k.chute.avant.partDeMarche, 1);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
