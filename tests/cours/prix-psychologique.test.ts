import { describe, expect, it } from "vitest";
import { PRIX_PSYCHOLOGIQUE } from "../../src/config/cours/chapitres/prix-psychologique";
import { PROGRAMME } from "../../src/config/cours/registre";
import { UNE_PROMOTION_TROP_FORTE, promotionTropForte } from "../../src/config/cours/situations/par-chapitre/une-promotion-trop-forte";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-du-marche";

/**
 * LE PRIX PSYCHOLOGIQUE (bac STMG mercatique, palier 1), SUR LES REPÈRES DE PRIX DE NOVA DU MONDE DU
 * COURS, ET SON CAS : UNE PROMOTION TROP FORTE ?
 *
 * Refait à la main sur la fiche (monde/mercatique-de-nova.ts) : NOVA vend à 59 € ; les familles jugent
 * normal 59 €, se méfient sous 39 €, ne veulent pas passer 60 € ; leur droite, 5 000 − 55 × prix,
 * perd 15 % à partir de 60 € ; 38 € de coût variable.
 */

const d = (x: number) => Math.round(x * 10) / 10;
const familles = (p: number) => (5_000 - 55 * p) * (p >= 60 ? 0.85 : 1);

describe("le prix psychologique", () => {
  it("au programme du bac STMG, chez NOVA seule, et son cas lui est dédié", () => {
    expect(PROGRAMME.stmg[1]).toContain(PRIX_PSYCHOLOGIQUE.titre);
    expect(PRIX_PSYCHOLOGIQUE.entreprises?.codes).toEqual(["nova"]);
    gardeDuCas(UNE_PROMOTION_TROP_FORTE, PRIX_PSYCHOLOGIQUE);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(PRIX_PSYCHOLOGIQUE);
  });

  it("les familles : 0 % d'écart au prix normal, 1 € sous le seuil ; les mélomanes trouvent NOVA la plus avantageuse", () => {
    expect(attendus(PRIX_PSYCHOLOGIQUE, "ecart")).toEqual([0, 1]);
    expect(juste(PRIX_PSYCHOLOGIQUE, "avantageux")).toEqual(["Mélomanes"]);
  });

  it("de 59,90 € à 60,10 € : 15,5 % de demande perdue pour 0,33 % de hausse, 47 fois plus", () => {
    const perte = d((1 - familles(60.1) / familles(59.9)) * 100);
    const hausse = Math.round((60.1 / 59.9 - 1) * 10_000) / 100;
    expect([perte, hausse]).toEqual([15.5, 0.33]);
    expect(attendus(PRIX_PSYCHOLOGIQUE, "seuil")).toEqual([hausse, Math.round(perte / hausse)]);
    expect(juste(PRIX_PSYCHOLOGIQUE, "virgule-quatre-vingt-dix")).toEqual(["59,90 € : rester sous le seuil psychologique"]);
  });

  it("le curseur : 33 % de remise laissent 39,53 €, encore au-dessus des 39 € de méfiance ; 34 % tombent à 38,94 €", () => {
    const e = gardeDuCurseur(PRIX_PSYCHOLOGIQUE, "la-promotion-croyable", 33);
    expect([e.droites(NOVA).produit(33), e.droites(NOVA).produit(34), e.droites(NOVA).cout(0)]).toEqual([39.53, 38.94, 39]);
  });

  it("le laboratoire : 59,90 € laisse la plus grande marge sur les familles, 1 705,5 × 21,90 = 37 350,45 €", () => {
    const e = gardeDuLaboratoire(PRIX_PSYCHOLOGIQUE, "le-laboratoire-du-seuil");
    expect(e.defi(NOVA).solution).toEqual({ prix: 59.9 });
    expect(Math.round(familles(59.9) * 21.9 * 100) / 100).toBe(37_350.45);
    expect(familles(61) * 23).toBeLessThan(37_350.45);
  });
});

describe("une promotion trop forte ?", () => {
  it("30 % de remise : 41,30 €, au-dessus des 39 € ; la marge passe de 21 € à 3,30 €", () => {
    const r = promotionTropForte(NOVA);
    expect([r.prixPromo, r.ecartAuNormal, r.baisseMaximale, r.ecartALaMefiance, r.credible]).toEqual([41.3, -30, d((1 - 39 / 59) * 100), 2.3, true]);
    expect([r.margeAvant, r.margeApres, r.baisseDeLaMarge]).toEqual([21, 3.3, d((1 - 3.3 / 21) * 100)]);
  });
});
