import { describe, expect, it } from "vitest";
import { ENTREPRISES_DU_MAGASIN, LE_PRIX_AFFICHE, REMISE_DE_LA_PROMOTION, faitsDeLaPromotion, remiseDuLaboratoire } from "../../src/config/cours/chapitres/le-prix-affiche";
import { TENIR_LA_CAISSE, caisseDuJour, ditLesCoupures, nomDeLaCoupure } from "../../src/config/cours/chapitres/tenir-la-caisse";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LA_CAISSE_DU_TRIMESTRE_DE_NOEL, caisseDeNoel } from "../../src/config/cours/situations/par-chapitre/la-caisse-du-trimestre-de-noel";
import { LA_PROMOTION_DE_NOEL, REMISE_DE_NOEL, promotionDeNoel } from "../../src/config/cours/situations/par-chapitre/la-promotion-de-noel";
import { BOUTIQUE, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * LE PRIX AFFICHÉ ET TENIR LA CAISSE (CAP EPC, palier 1), SUR LA BOUTIQUE DU MONDE DU COURS, ET
 * LEURS CAS : LA PROMOTION DE NOËL, LA CAISSE DU TRIMESTRE DE NOËL.
 *
 * Refait à la main sur la fiche de MAILLE & CO : le pull col rond à 55 € HT, 66 € TTC ; la
 * promotion de février (10 %, 59,40 €, 780 pulls demandés pour 700 en rayon) ; la journée de
 * janvier réglée en caisse (77 250 € ÷ 30 = 2 575 € HT, 3 090 € TTC, 772,50 € en espèces).
 */

const CAP = /^CAP EPC · /;

describe("les deux chapitres du CAP EPC et leurs cas", () => {
  it("portent les titres du programme, au palier 1, et des blocs du CAP EPC qui se résolvent", () => {
    for (const ch of [LE_PRIX_AFFICHE, TENIR_LA_CAISSE]) {
      expect([ch.parcours, ch.palier]).toEqual(["cap-epc", 1]);
      gardeDuProgramme(ch, PROGRAMME["cap-epc"][1]!, () => "cap-epc", CAP);
    }
    expect(LE_PRIX_AFFICHE.blocs).toEqual(["CAP EPC · Bloc 2 · Mettre en valeur et approvisionner"]);
    expect(TENIR_LA_CAISSE.blocs).toEqual(["CAP EPC · Bloc 3 · Conseiller et accompagner le client dans son parcours d'achat"]);
  });

  it("se jouent à la boutique du cours seule, et leurs cas leur sont dédiés", () => {
    expect([...ENTREPRISES_DU_MAGASIN]).toEqual(["boutique"]);
    gardeDuCas(LA_PROMOTION_DE_NOEL, LE_PRIX_AFFICHE);
    gardeDuCas(LA_CAISSE_DU_TRIMESTRE_DE_NOEL, TENIR_LA_CAISSE);
  });
});

describe("le prix affiché", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LE_PRIX_AFFICHE);
  });

  it("la TVA, le prix TTC, l'étiquette de l'écharpe, la remise de février", () => {
    expect(attendus(LE_PRIX_AFFICHE, "prix-ttc")).toEqual([11, 66]);
    expect(juste(LE_PRIX_AFFICHE, "la-bonne-etiquette")).toEqual(["42 €"]);
    expect(REMISE_DE_LA_PROMOTION).toBe(MAILLE_ET_CO.promotion.remise);
    expect(attendus(LE_PRIX_AFFICHE, "la-remise")).toEqual([6.6, 59.4]);
  });

  it("ce que la promotion fait vendre : 100 pulls et 1 650 € de plus, mais 80 clients sans pull", () => {
    expect(attendus(LE_PRIX_AFFICHE, "ce-que-la-promotion-vend")).toEqual([700 - 600, 700 * 49.5 - 600 * 55]);
    expect(juste(LE_PRIX_AFFICHE, "bilan")).toEqual(["Elle fait vendre plus, et le chiffre d'affaires monte"]);
    expect(faitsDeLaPromotion({ ventesEnPlus: 1, chiffreEnPlus: -2 })).toBe("1 article vendu en plus, et un chiffre d'affaires qui baisse de 2 €");
  });

  it("le curseur : 14 % de remise au plus gardent les 33 000 € du mois ; à 15 %, 32 725 €", () => {
    const e = gardeDuCurseur(LE_PRIX_AFFICHE, "jusqu-ou-remiser", 14);
    expect(e.lecture(BOUTIQUE, 14).at(-1)!.montant).toBe(Math.round(700 * 55 * 0.86 * 100) / 100);
    expect(e.droites(BOUTIQUE).produit(15)).toBe(700 * 46.75);
  });

  it("le laboratoire : seule une remise de 5 % fait mieux sans laisser un client sans pull", () => {
    gardeDuLaboratoire(LE_PRIX_AFFICHE, "le-laboratoire-de-la-remise");
    expect(remiseDuLaboratoire(MAILLE_ET_CO)).toEqual([5]);
  });
});

describe("la promotion de Noël", () => {
  it("30 % sur 66 € : 46,20 € ; 200 pulls de plus, 15 400 € de moins, la réponse est de ne pas la faire", () => {
    expect(REMISE_DE_NOEL).toBe(0.3);
    const p = promotionDeNoel(BOUTIQUE);
    expect([p.sans.demande, p.nouveauPrix, p.ventesEnPlus, p.chiffreEnPlus]).toEqual([400 + 850 + 150, 46.2, 1_600 - 1_400, 1_600 * 38.5 - 1_400 * 55]);
    expect(attendus(LA_PROMOTION_DE_NOEL, "l-etiquette")).toEqual([19.8, 46.2]);
    expect(juste(LA_PROMOTION_DE_NOEL, "reponse")).toEqual(["Ne pas la faire : elle rapporte moins"]);
  });
});

describe("tenir la caisse", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(TENIR_LA_CAISSE);
  });

  it("le ticket, la monnaie, la journée, les espèces, le fond de caisse, le tiroir", () => {
    expect(attendus(TENIR_LA_CAISSE, "le-ticket")).toEqual([42, 30, 72]);
    expect(attendus(TENIR_LA_CAISSE, "la-monnaie")).toEqual([28]);
    expect(juste(TENIR_LA_CAISSE, "rendre-juste")).toEqual(["1 billet de 20 €, 1 billet de 5 €, 1 pièce de 2 € et 1 pièce de 1 €"]);
    expect(attendus(TENIR_LA_CAISSE, "la-journee")).toEqual([Math.round(1_330 / 30), 77_250 / 30]);
    expect(attendus(TENIR_LA_CAISSE, "les-especes")).toEqual([3_090, 772.5]);
    expect(attendus(TENIR_LA_CAISSE, "le-fond-de-caisse")).toEqual([922.5]);
    expect(attendus(TENIR_LA_CAISSE, "le-comptage")).toEqual([912.5, -10]);
    expect(caisseDuJour(BOUTIQUE).jour.tiroir).toEqual([
      { valeur: 50, nombre: 18 },
      { valeur: 10, nombre: 1 },
      { valeur: 2, nombre: 1 },
      { valeur: 0.5, nombre: 1 },
    ]);
    expect([nomDeLaCoupure(0.5, 2), ditLesCoupures([{ valeur: 0.01, nombre: 1 }])]).toEqual(["pièces de 50 centimes", "1 pièce de 1 centime"]);
  });

  it("le curseur : 3 clients en espèces au plus avant le coffre (150 + 3 × 98,62 = 445,86 €)", () => {
    const e = gardeDuCurseur(TENIR_LA_CAISSE, "avant-le-coffre", 3);
    expect(e.lecture(BOUTIQUE, 3).find((l) => l.fort)!.montant).toBe(Math.round((150 + 3 * 98.62) * 100) / 100);
  });

  it("le laboratoire : 2 passages au coffre, pas 1 (536,25 €), pas 3", () => {
    gardeDuLaboratoire(TENIR_LA_CAISSE, "le-laboratoire-du-coffre");
  });
});

describe("la caisse du trimestre de Noël", () => {
  it("décembre : 231 850 € ÷ 30, 2 318,50 € d'espèces, 5 € de trop, 2 323,50 € au coffre", () => {
    const j = caisseDeNoel(BOUTIQUE);
    expect(attendus(LA_CAISSE_DU_TRIMESTRE_DE_NOEL, "les-especes")).toEqual([Math.round((231_850 / 30) * 100) / 100, 9_274, 2_318.5]);
    expect(attendus(LA_CAISSE_DU_TRIMESTRE_DE_NOEL, "le-tiroir")).toEqual([2_473.5, 5, 2_323.5]);
    expect(j.tiroir.reduce((t, x) => t + x.valeur * x.nombre, 0)).toBeCloseTo(2_473.5, 9);
  });
});
