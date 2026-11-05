import { describe, expect, it } from "vitest";
import { ASSORTIMENT } from "../../src/config/cours/chapitres/assortiment";
import { PROMOTION_QUI_PAIE } from "../../src/config/cours/chapitres/promotion-qui-paie";
import { S_ALIGNER_SUR_LE_CONCURRENT, TAUX_DE_MARQUE } from "../../src/config/cours/chapitres/taux-de-marque";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { ENQUETE_DU_PRIX, MARQUE, SOLDES, coutDuDepot } from "../../src/config/cours/monde/offre-et-prix";
import { attendus, juste } from "./gardes-de-la-boutique";

/**
 * LES COMPLÉMENTS DU BLOC 2 DU BTS MCO, DANS TROIS CHAPITRES EXISTANTS DE MAILLE & CO.
 *
 *   · C1, « L'assortiment » : la marque et les signes de qualité, la retouche offerte du mérinos (90
 *     demandés, 10 % de plus, 130 en stock ; 30 % des acheteurs ; 6 € la retouche ; 74 € de marge), l'emballage,
 *     les conditions générales de vente aux comités.
 *   · C2, « La promotion qui paie » : le prix de référence d'une réduction (le plus bas des 30 jours,
 *     59,40 € après la remise de février), les soldes, les loteries.
 *   · C3, « S'aligner sur le concurrent » : l'élasticité lue entre 55 € et 50 € hors taxes (600 puis
 *     681 pulls), le prix d'acceptabilité de l'enquête, le cadre légal des prix.
 * Chaque chiffre est refait à la main ; les gardes de texte des trois chapitres restent celles de leurs tests.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const d = (x: number) => Math.round(x * 10) / 10 + 0;

describe("C1 : ce qui porte une référence, dans l'assortiment", () => {
  it("quatre étapes avant la synthèse, et le chapitre tient en 20 étapes", () => {
    const ids = ASSORTIMENT.etapes.map((e) => e.id);
    expect(ids.slice(-5)).toEqual(["la-marque-et-la-qualite", "le-service-associe", "l-emballage", "les-conditions-de-vente", "synthese"]);
    expect(ids.length).toBeLessThanOrEqual(20);
  });

  it("la retouche offerte : 99 mérinos, 9 de plus, 666 € de marge, 30 retouches à 6 €, 486 € de gain", () => {
    const ventes = Math.min(Math.floor(90 * 1.1 + 1e-9), 70 + 60);
    const retouches = Math.round(ventes * 0.3);
    expect([ventes, (ventes - 90) * 74, retouches * 6, (ventes - 90) * 74 - retouches * 6]).toEqual([99, 666, 180, 486]);
    expect(attendus(ASSORTIMENT, "le-service-associe")).toEqual([99, 666, 180, 486]);
  });

  it("le droit : la marque déposée, l'origine vraie, pas de sac plastique de caisse, des conditions de vente complètes", () => {
    expect([MARQUE.dureeEnAnnees, coutDuDepot()]).toEqual([10, 230]);
    expect(juste(ASSORTIMENT, "la-marque-et-la-qualite")[0]).toMatch(/^Déposer la marque à l'INPI/);
    expect(juste(ASSORTIMENT, "l-emballage")[0]).toMatch(/^Non : le sac plastique/);
    expect(juste(ASSORTIMENT, "les-conditions-de-vente")[0]).toMatch(/indemnité de 40 €$/);
  });
});

describe("C2 : la réglementation des promotions", () => {
  it("trois étapes avant la synthèse, et le chapitre tient en 20 étapes", () => {
    const ids = PROMOTION_QUI_PAIE.etapes.map((e) => e.id);
    expect(ids.slice(-4)).toEqual(["le-prix-de-reference", "les-soldes", "le-jeu-concours", "synthese"]);
    expect(ids.length).toBeLessThanOrEqual(20);
  });

  it("le prix de référence : 59,40 € (la remise de février), 47,52 € à afficher, 11,1 % de réduction réelle sur l'étiquette", () => {
    const fevrier = c(66 * (1 - f.promotion.remise));
    expect([fevrier, c(fevrier * 0.8), d((1 - c(66 * 0.8) / fevrier) * 100)]).toEqual([59.4, 47.52, 11.1]);
    expect(attendus(PROMOTION_QUI_PAIE, "le-prix-de-reference")).toEqual([59.4, 47.52, 11.1]);
  });

  it("les soldes et les loteries", () => {
    expect([SOLDES.semaines, SOLDES.ancienneteMinimaleEnJours]).toEqual([4, 30]);
    expect(juste(PROMOTION_QUI_PAIE, "les-soldes")[0]).toMatch(/^Interdit/);
    expect(juste(PROMOTION_QUI_PAIE, "le-jeu-concours")[0]).toMatch(/^Oui, avec un règlement clair/);
  });
});

describe("C3 : ce qui borne le prix, dans « S'aligner sur le concurrent »", () => {
  it("trois étapes avant la critique du taux, dans la suite ; la première partie ne change pas", () => {
    const ids = S_ALIGNER_SUR_LE_CONCURRENT.etapes.map((e) => e.id);
    const i = ids.indexOf("la-critique-du-taux");
    expect(ids.slice(i - 3, i)).toEqual(["l-elasticite-lue", "le-prix-d-acceptabilite", "le-cadre-legal-du-prix"]);
    expect(TAUX_DE_MARQUE.etapes.map((e) => e.id)).not.toContain("l-elasticite-lue");
    expect(S_ALIGNER_SUR_LE_CONCURRENT.objectifs.at(-1)).toMatch(/^Expliquer ce qui borne le prix/);
    expect(S_ALIGNER_SUR_LE_CONCURRENT.objectifs.length).toBeLessThanOrEqual(5);
  });

  it("l'élasticité : −9,1 % de prix, +13,5 % de demande, −1,49 (la fiche suppose −1,5)", () => {
    const vp = (50 - 55) / 55;
    const vd = (681 - 600) / 600;
    expect([d(vp * 100), d(vd * 100), -c(-vd / vp + 1e-9)]).toEqual([-9.1, 13.5, -1.49]);
    expect(attendus(S_ALIGNER_SUR_LE_CONCURRENT, "l-elasticite-lue")).toEqual([-9.1, 13.5, -1.49]);
    expect(f.elasticiteAuPrix).toBe(-1.5);
  });

  it("le prix d'acceptabilité : 81 % à 66 €, 83 % à 60 €, le meilleur", () => {
    const acc = ENQUETE_DU_PRIX.map((l) => d((1 - l.tropCher - l.tropBonMarche) * 100));
    expect(acc).toEqual([70, 83, 81, 59, 30]);
    expect(attendus(S_ALIGNER_SUR_LE_CONCURRENT, "le-prix-d-acceptabilite")).toEqual([81, 83]);
    expect(juste(S_ALIGNER_SUR_LE_CONCURRENT, "le-cadre-legal-du-prix")[0]).toMatch(/^Toutes taxes comprises/);
  });
});
