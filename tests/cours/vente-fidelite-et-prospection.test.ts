import { describe, expect, it } from "vitest";
import { LE_CLIENT_QUI_REVIENT } from "../../src/config/cours/chapitres/le-client-qui-revient";
import { UN_NOUVEAU_CLIENT } from "../../src/config/cours/chapitres/un-nouveau-client";
import { PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { LES_TRAVAUX_DE_L_ETE, travauxDeLEte } from "../../src/config/cours/situations/par-chapitre/les-travaux-de-l-ete";
import { UNE_CAMPAGNE_PLUS_FORTE, campagnePlusForte } from "../../src/config/cours/situations/par-chapitre/une-campagne-plus-forte";
import { BOUTIQUE, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * LE CLIENT QUI REVIENT ET CE QUE RAPPORTE UN NOUVEAU CLIENT (bac pro MCV, palier 2), SUR LA
 * BOUTIQUE DU MONDE DU COURS, ET LEURS CAS : LES TRAVAUX DE L'ÉTÉ, UNE CAMPAGNE PLUS FORTE.
 *
 * Refait à la main sur la fiche de MAILLE & CO : les clientes fidèles de janvier (340 passages,
 * 38 825 € hors taxes, 19 640 € de marge), les passants (3 160 entrées, 600 passages, 19 310 € de
 * marge) ; les hypothèses du cours : 5 % de départs par mois, 15 nouvelles cartes, les offres de
 * l'agence (500 entrées pour 2 000 €, 650 pour 4 000 €).
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;

describe("les deux chapitres du bac pro MCV et leurs cas", () => {
  it("portent les titres du programme, au palier 2, et des blocs du bac pro MCV qui se résolvent", () => {
    expect(PARCOURS.find((p) => p.code === "vente")!.formation).toBe("bac-pro-mcv");
    for (const ch of [LE_CLIENT_QUI_REVIENT, UN_NOUVEAU_CLIENT]) {
      expect([ch.parcours, ch.palier]).toEqual(["vente", 2]);
      gardeDuProgramme(ch, PROGRAMME.vente[2]!, () => "bac-pro-mcv", /^Bac pro MCV /);
    }
    expect(LE_CLIENT_QUI_REVIENT.blocs).toEqual(["Bac pro MCV Bloc 3 · Fidéliser la clientèle et développer la relation client"]);
    expect(UN_NOUVEAU_CLIENT.blocs).toEqual(["Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale"]);
  });

  it("chaque cas est dédié à son chapitre", () => {
    gardeDuCas(LES_TRAVAUX_DE_L_ETE, LE_CLIENT_QUI_REVIENT);
    gardeDuCas(UNE_CAMPAGNE_PLUS_FORTE, UN_NOUVEAU_CLIENT);
  });
});

describe("le client qui revient et le client qui part", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LE_CLIENT_QUI_REVIENT);
  });

  it("février : 17 parties, 323 revenues, 338 en fin de mois ; 95 % reviennent ; 57,76 € par passage", () => {
    expect(attendus(LE_CLIENT_QUI_REVIENT, "partis")).toEqual([Math.round(340 * 0.05), 340 - 17, 323 + 15]);
    expect(attendus(LE_CLIENT_QUI_REVIENT, "poids-des-gardes")).toEqual([Math.round((323 / 340) * 1_000) / 10, Math.round((323 / 338) * 1_000) / 10]);
    expect(attendus(LE_CLIENT_QUI_REVIENT, "garde-toute-l-annee")).toEqual([c(19_640 / 340), c(12 * 57.76)]);
    expect(attendus(LE_CLIENT_QUI_REVIENT, "parti-apres-le-premier")).toEqual([c(11 * 57.76)]);
    expect(juste(LE_CLIENT_QUI_REVIENT, "ce-que-dit-le-fichier")).toEqual(["Le fichier baisse : les départs dépassent les nouvelles cartes"]);
  });

  it("le curseur : 17 nouvelles cartes, autant que de départs, tiennent le fichier à 340", () => {
    gardeDuCurseur(LE_CLIENT_QUI_REVIENT, "remplacer-les-departs", 17);
  });

  it("le laboratoire : 4 % de départs par mois au plus gardent 340 clientes en décembre", () => {
    const e = gardeDuLaboratoire(LE_CLIENT_QUI_REVIENT, "le-laboratoire-de-la-fidelite");
    expect(e.defi(BOUTIQUE).solution).toEqual({ taux: 4 });
  });
});

describe("les travaux de l'été", () => {
  it("mai : 522 articles et 34 fidèles, 38 855,46 € ; juillet : 931 articles, 50 835,07 € ; mieux vaut mai", () => {
    const k = travauxDeLEte(BOUTIQUE);
    expect(attendus(LES_TRAVAUX_DE_L_ETE, "en-mai")).toEqual([522, c(522 * 29.29), 34, c(34 * 693.12), c(522 * 29.29 + 34 * 693.12)]);
    expect(attendus(LES_TRAVAUX_DE_L_ETE, "en-juillet")).toEqual([931, c(931 * 29.29), 34, c(34 * 693.12), c(931 * 29.29 + 34 * 693.12)]);
    expect(k.quand).toBe("mai");
    expect(juste(LES_TRAVAUX_DE_L_ETE, "reponse")).toEqual(["En mai, quand la boutique vend le moins"]);
  });
});

describe("ce que rapporte un nouveau client", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(UN_NOUVEAU_CLIENT);
  });

  it("2 000 € pour 500 entrées : 19 % de transformation, 95 ventes, 21,05 € la vente, 1 057,10 € laissés", () => {
    expect(attendus(UN_NOUVEAU_CLIENT, "les-ventes")).toEqual([Math.round((600 / 3_160) * 1_000) / 10, Math.round((500 * 600) / 3_160)]);
    expect(attendus(UN_NOUVEAU_CLIENT, "le-cout")).toEqual([c(2_000 / 95)]);
    expect(attendus(UN_NOUVEAU_CLIENT, "la-marge")).toEqual([c(19_310 / 600), c(95 * 32.18), c(95 * 32.18 - 2_000)]);
    expect(juste(UN_NOUVEAU_CLIENT, "paie-t-elle")).toEqual(["Elle paie : chaque vente gagnée rapporte plus qu'elle n'a coûté"]);
    expect(attendus(UN_NOUVEAU_CLIENT, "et-ensuite")).toEqual([19, c(19 * 57.76)]);
  });

  it("le curseur : 63 ventes gagnées paient la campagne (2 000 ÷ 32,18 = 62,15)", () => {
    gardeDuCurseur(UN_NOUVEAU_CLIENT, "combien-de-ventes", 63);
  });

  it("le laboratoire : l'offre à 2 000 €, la seule qui laisse le plus", () => {
    const e = gardeDuLaboratoire(UN_NOUVEAU_CLIENT, "le-laboratoire-de-la-campagne");
    expect(e.defi(BOUTIQUE).solution).toEqual({ budget: 2_000 });
  });
});

describe("une campagne plus forte", () => {
  it("4 000 € : 123 ventes, 32,52 € la vente, 41,86 € de perte ; la campagne du chapitre reste la meilleure", () => {
    const k = campagnePlusForte(BOUTIQUE);
    expect(k.choix).toBe("celle-du-chapitre");
    expect(attendus(UNE_CAMPAGNE_PLUS_FORTE, "les-ventes")).toEqual([Math.round((650 * 600) / 3_160), c(4_000 / 123)]);
    expect(attendus(UNE_CAMPAGNE_PLUS_FORTE, "la-marge")).toEqual([c(123 * 32.18), c(123 * 32.18 - 4_000)]);
    expect(juste(UNE_CAMPAGNE_PLUS_FORTE, "reponse")).toEqual(["Celle du chapitre, sans plus"]);
  });
});
