import { describe, expect, it } from "vitest";
import { DEMANDE_ET_PRIX, demandeEtPrix } from "../../src/config/cours/chapitres/demande-et-prix";
import { PROGRAMME } from "../../src/config/cours/registre";
import { REPERCUTER_LA_HAUSSE_DU_FOURNISSEUR, hausseDuFournisseur } from "../../src/config/cours/situations/par-chapitre/repercuter-la-hausse-du-fournisseur";
import { QUEL_PRIX_POUR_LA_SAISON } from "../../src/config/cours/situations/quel-prix-pour-la-saison";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-du-marche";

/**
 * LA DEMANDE RÉPOND AU PRIX (bac STMG mercatique, palier 1), SUR LA DROITE DE DEMANDE DE NOVA DU
 * MONDE DU COURS, ET SES CAS : RÉPERCUTER LA HAUSSE DU FOURNISSEUR, QUEL PRIX POUR LA SAISON ?
 *
 * Refait à la main : 16 755 − 203 × prix enceintes par trimestre, à l'enceinte inférieure
 * (nova-gestion.ts) ; 5 975 à 53,10 €, 4 778 à 59 €, 3 580 à 64,90 € ; 38 € de coût variable ; la
 * ligne de 7 000 enceintes.
 */

const d = (x: number) => Math.round(x * 10) / 10;
const demande = (p: number) => Math.floor(16_755 - 203 * p + 1e-9);
const marge = (p: number) => Math.round(Math.min(demande(p), 7_000) * (p - 38) * 100) / 100;

describe("la demande répond au prix", () => {
  it("au programme du bac STMG, chez NOVA seule ; ses cas jouent chez elle", () => {
    expect(PROGRAMME.stmg[1]).toContain(DEMANDE_ET_PRIX.titre);
    expect(DEMANDE_ET_PRIX.entreprises?.codes).toEqual(["nova"]);
    gardeDuCas(REPERCUTER_LA_HAUSSE_DU_FOURNISSEUR, DEMANDE_ET_PRIX);
    expect(QUEL_PRIX_POUR_LA_SAISON.entreprises?.codes).toEqual(["nova"]);
    gardesDeTexte(QUEL_PRIX_POUR_LA_SAISON);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(DEMANDE_ET_PRIX);
  });

  it("l'élasticité : +10 % de prix, −25,1 % de demande, −2,51 ; élastique ; le chiffre d'affaires baisse", () => {
    expect([demande(53.1), demande(59), demande(64.9)]).toEqual([5_975, 4_778, 3_580]);
    expect(attendus(DEMANDE_ET_PRIX, "elasticite")).toEqual([10, d((3_580 / 4_778 - 1) * 100), Math.round((-25.1 / 10) * 100) / 100]);
    expect(juste(DEMANDE_ET_PRIX, "elastique")).toEqual(["Élastique : elle baisse plus que le prix ne monte"]);
    expect(attendus(DEMANDE_ET_PRIX, "chiffre-d-affaires")).toEqual([4_778 * 59, Math.round(3_580 * 64.9), d((Math.round(3_580 * 64.9) / (4_778 * 59) - 1) * 100)]);
    expect(demandeEtPrix(NOVA).gagneDemandeEnBaissant).toBe(d((5_975 / 4_778 - 1) * 100));
  });

  it("le curseur : à 61 €, 4 372 enceintes laissent 100 556 €, au moins les 100 338 € de 59 € ; à 62 €, 100 056 €", () => {
    gardeDuCurseur(DEMANDE_ET_PRIX, "jusqu-ou-monter", 61);
    expect([marge(59), marge(61), marge(62)]).toEqual([4_778 * 21, 4_372 * 23, 4_169 * 24]);
  });

  it("le laboratoire : 60 € laisse la plus grande marge, 4 575 × 22 = 100 650 €", () => {
    const e = gardeDuLaboratoire(DEMANDE_ET_PRIX, "le-laboratoire-du-prix");
    expect(e.defi(NOVA).solution).toEqual({ prix: 60 });
    expect([marge(59), marge(60), marge(61)]).toEqual([100_338, 100_650, 100_556]);
  });
});

describe("répercuter la hausse du fournisseur", () => {
  it("5 % de hausse : 61,95 €, −12,55 % de demande, 4 178 enceintes, 258 827 € de chiffre d'affaires", () => {
    const r = hausseDuFournisseur(NOVA);
    expect([r.nouveauPrix, r.variationDemande, r.demandePrevue, r.caPrevu]).toEqual([61.95, -12.55, Math.round(4_778 * (1 - 0.1255)), Math.round(4_178 * 61.95)]);
    expect(r.variationCa).toBe(d((Math.round(4_178 * 61.95) / (4_778 * 59) - 1) * 100));
  });
});
