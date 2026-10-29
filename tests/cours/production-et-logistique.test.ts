import { describe, expect, it } from "vitest";
import { CE_QUE_COUTE_UNE_LIVRAISON } from "../../src/config/cours/chapitres/ce-que-coute-une-livraison";
import { LE_STOCK_DE_SECURITE } from "../../src/config/cours/chapitres/le-stock-de-securite";
import { LE_TAUX_DE_REMPLISSAGE } from "../../src/config/cours/chapitres/le-taux-de-remplissage";
import { LIVRER_A_TEMPS } from "../../src/config/cours/chapitres/livrer-a-temps";
import { ORGANISER_L_ACTIVITE } from "../../src/config/cours/chapitres/organiser-l-activite";
import { PRODUIRE } from "../../src/config/cours/chapitres/produire";
import { PRODUIRE_BIEN } from "../../src/config/cours/chapitres/produire-bien";
import { ANNEE_N, ANNEE_N_PLUS_1, CAPACITES_DU_COURS } from "../../src/config/cours/monde/nova-capacite";
import { VENTES_A_CAMPUSTECH } from "../../src/config/cours/monde/nova-gestion";
import { PROGRAMME } from "../../src/config/cours/registre";
import { COMBIEN_CHARGER_PENDANT_LA_PANNE } from "../../src/config/cours/situations/par-chapitre/combien-charger-pendant-la-panne";
import { DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS } from "../../src/config/cours/situations/par-chapitre/deux-embauches-pour-produire-plus";
import { LA_COMMANDE_EXCEPTIONNELLE } from "../../src/config/cours/situations/par-chapitre/la-commande-exceptionnelle";
import { LA_MOITIE_DU_BUDGET_QUALITE } from "../../src/config/cours/situations/par-chapitre/la-moitie-du-budget-qualite";
import { LE_GAZOLE_QUI_AUGMENTE } from "../../src/config/cours/situations/par-chapitre/le-gazole-qui-augmente";
import { LE_LOT_DE_LA_BOURSE_DE_FRET } from "../../src/config/cours/situations/par-chapitre/le-lot-de-la-bourse-de-fret";
import { LE_POINT_DE_COMMANDE_AVANT_LE_PIC } from "../../src/config/cours/situations/par-chapitre/le-point-de-commande-avant-le-pic";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * LA PRODUCTION ET LA LOGISTIQUE SUR LE MONDE DU COURS (lot M5) : PRODUIRE, PRODUIRE BIEN, ORGANISER
 * L'ACTIVITÉ, LE STOCK DE SÉCURITÉ, CE QUE COÛTE UNE LIVRAISON, LE TAUX DE REMPLISSAGE, LIVRER À
 * TEMPS, ET LEURS CAS, chez NOVA.
 *
 * Refait à la main sur les fiches de NOVA : 4 postes de 1 750 enceintes par trimestre (7 000) ;
 * 4 opérateurs de 540 heures à 0,3 heure l'enceinte (1 800 chacun, 7 200) ; 1 875 € bruts et 42 % de
 * cotisations (2 662,50 € par mois, 31 950 € par an) ; 3 000 € de recrutement, 2 mois de délai ; la
 * demande de N (4 778, 6 081, 5 810, 6 940) et de N + 1 (5 800, 7 400, 6 200, 7 800) ; 21 € de marge ;
 * la courbe de la prévention (8 %, 5 %, 3,5 %, 2 % à 0, 8 000, 16 000 et 32 000 €), le contrôle
 * (6 000 €, 80 %), 20 € la retouche, 100 € le retour, 3 ventes perdues par client déçu ; 22 € le kit ;
 * les 320 enceintes de CampusTech par mois. Et les hypothèses du lot : 48 enceintes par palette, le
 * porteur de 12 palettes (190 € et 210 €), le petit porteur de 8 (150 € et 210 €), 240 km à 0,45 €,
 * la messagerie à 85 €, 58 jours de montage, 6 jours de délai, 3 jours de sécurité, 1,50 € de
 * stockage par enceinte et par trimestre.
 */

const c2 = (x: number) => Math.round(x * 100) / 100 + 0;
const LOT: Chapitre[] = [PRODUIRE, PRODUIRE_BIEN, ORGANISER_L_ACTIVITE, LE_STOCK_DE_SECURITE, CE_QUE_COUTE_UNE_LIVRAISON, LE_TAUX_DE_REMPLISSAGE, LIVRER_A_TEMPS];
const CAS = [
  DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS,
  LA_MOITIE_DU_BUDGET_QUALITE,
  LA_COMMANDE_EXCEPTIONNELLE,
  LE_POINT_DE_COMMANDE_AVANT_LE_PIC,
  LE_GAZOLE_QUI_AUGMENTE,
  LE_LOT_DE_LA_BOURSE_DE_FRET,
  COMBIEN_CHARGER_PENDANT_LA_PANNE,
];
const CHAPITRE_DU_CAS = [PRODUIRE, PRODUIRE_BIEN, ORGANISER_L_ACTIVITE, LE_STOCK_DE_SECURITE, CE_QUE_COUTE_UNE_LIVRAISON, LE_TAUX_DE_REMPLISSAGE, LIVRER_A_TEMPS];

describe("les chapitres du lot et leurs cas, dans leurs parcours", () => {
  it("portent les titres du programme, au palier 1, chez NOVA seule, et leurs cas leur sont dédiés", () => {
    gardeDuProgramme(PRODUIRE, PROGRAMME["stmg-management"][1]!);
    gardeDuProgramme(PRODUIRE_BIEN, PROGRAMME["stmg-management"][1]!);
    gardeDuProgramme(ORGANISER_L_ACTIVITE, PROGRAMME["seconde-mg"][1]!);
    for (const ch of [LE_STOCK_DE_SECURITE, CE_QUE_COUTE_UNE_LIVRAISON, LE_TAUX_DE_REMPLISSAGE, LIVRER_A_TEMPS]) gardeDuProgramme(ch, PROGRAMME.logistique[1]!);
    CAS.forEach((s, i) => gardeDuCas(s, CHAPITRE_DU_CAS[i]!));
  });

  it("la bonne réponse d'un choix n'est jamais la plus longue", () => {
    for (const ch of [...LOT, ...CAS]) {
      const servi = chapitreDuCas(ch, NOVA);
      for (const e of servi.etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((x) => x.juste)!;
        expect(bonne.texte.length, `${ch.code} / ${e.id}`).toBeLessThan(Math.max(...o.filter((x) => !x.juste).map((x) => x.texte.length)));
      }
    }
  });

  it("le lot relit les fiches de NOVA, sans second jeu de chiffres", () => {
    const f = CAPACITES_DU_COURS.nova!;
    expect(f.anneeN).toBe(ANNEE_N);
    expect(f.anneeNPlus1).toBe(ANNEE_N_PLUS_1);
    expect(VENTES_A_CAMPUSTECH[0]).toBe(320);
  });
});

describe("produire", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => gardesDeTexte(PRODUIRE));

  it("la capacité de N + 1 : 7 000 par trimestre, 28 000 sur l'année, 26 000 montées, 92,9 %", () => {
    const outil = 4 * 1_750;
    const equipe = (4 * 540) / 0.3;
    expect([outil, equipe]).toEqual([7_000, 7_200]);
    const production = [5_800, 7_400, 6_200, 7_800].reduce((t, d) => t + Math.min(d, outil, equipe), 0);
    expect(attendus(PRODUIRE, "capacite")).toEqual([4 * 7_000, production, Math.round((production / 28_000) * 1000) / 10]);
    expect(production).toBe(26_000);
    expect(juste(PRODUIRE, "ce-qui-bride")).toEqual(["Les postes de la ligne"]);
  });

  it("la productivité : 6 500 enceintes par opérateur, 8 640 heures, 3,01 enceintes par heure", () => {
    expect(attendus(PRODUIRE, "productivite")).toEqual([26_000 / 4, 4 * 540 * 4, Math.round((26_000 / 8_640) * 100) / 100]);
    expect(attendus(PRODUIRE, "productivite")[2]).toBe(3.01);
  });

  it("un opérateur de plus : l'équipe monte 9 000, la production reste à 26 000, le résultat baisse de 34 950 €", () => {
    const cout = 3_000 + 1_875 * 1.42 * 12;
    expect(attendus(PRODUIRE, "une-embauche")).toEqual([5 * 1_800, 26_000, -cout]);
    expect(cout).toBe(34_950);
    expect(juste(PRODUIRE, "embaucher")).toEqual(["Non : il ne ferait rien produire"]);
  });

  it("le curseur : 1 750 enceintes par opérateur suffisent à suivre la ligne", () => {
    gardeDuCurseur(PRODUIRE, "ce-que-doit-monter-un-operateur", 7_000 / 4);
  });

  it("le laboratoire : 4 opérateurs laissent le plus de marge, l'équipe payée (418 200 €)", () => {
    const e = gardeDuLaboratoire(PRODUIRE, "le-laboratoire-de-l-effectif");
    expect(e.defi(NOVA).solution).toEqual({ operateurs: 4 });
    const reste = (o: number) => [5_800, 7_400, 6_200, 7_800].reduce((t, d) => t + Math.min(d, 7_000, o * 1_800), 0) * 21 - o * 31_950;
    expect([3, 4, 5].map(reste)).toEqual([357_750, 418_200, 386_250]);
    expect(e.lecture(NOVA, { operateurs: 4 }).at(-1)!.montant).toBe(418_200);
  });

  it("le cas des deux embauches : 10 800 de capacité d'équipe, rien de plus monté, 69 900 € de moins", () => {
    gardesDeTexte(DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS);
    expect(attendus(DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS, "la-capacite")).toEqual([6 * 1_800, 7_000, 0]);
    expect(attendus(DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS, "le-cout")).toEqual([2 * 34_950, -69_900]);
    expect(juste(DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS, "reponse")).toEqual(["Ne pas embaucher : les postes brident"]);
  });
});

describe("produire bien", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => gardesDeTexte(PRODUIRE_BIEN));

  it("à 16 000 € de prévention : 910 défauts, 728 retouchés, 182 partis chez le client", () => {
    expect(attendus(PRODUIRE_BIEN, "les-defauts")).toEqual([26_000 * 0.035, 910 * 0.8, 910 * 0.2].map(c2));
    expect(attendus(PRODUIRE_BIEN, "les-defauts")).toEqual([910, 728, 182]);
  });

  it("les coûts : 14 560 € de retouches, 18 200 € de retours, 54 760 € de qualité", () => {
    expect(attendus(PRODUIRE_BIEN, "la-non-qualite")).toEqual([728 * 20, 182 * 100, 16_000 + 6_000 + 14_560 + 18_200]);
    expect(juste(PRODUIRE_BIEN, "ou-coute-un-defaut")).toEqual(["Chez le client"]);
  });

  it("le curseur : 223 défauts évités paient 8 000 € de prévention (36 € le défaut)", () => {
    expect(0.8 * 20 + 0.2 * 100).toBe(36);
    gardeDuCurseur(PRODUIRE_BIEN, "les-defauts-a-eviter", Math.ceil(8_000 / 36));
  });

  it("le laboratoire : 32 000 € de prévention laissent le meilleur résultat, 482 728 €", () => {
    const e = gardeDuLaboratoire(PRODUIRE_BIEN, "le-laboratoire-de-la-prevention");
    expect(e.defi(NOVA).solution).toEqual({ prevention: 32_000 });
    // À 32 000 € : 2 % de défauts, 520 défauts, 416 retouchés, 104 partis, 312 ventes perdues.
    const resultat = (26_000 - 104 * 3) * 21 - (32_000 + 6_000 + 416 * 20 + 104 * 100);
    expect(resultat).toBe(482_728);
    expect(e.lecture(NOVA, { prevention: 32_000 }).at(-1)!.montant).toBe(resultat);
    // Au budget actuel : 182 partis, 546 ventes perdues.
    expect(e.lecture(NOVA, { prevention: 16_000 }).at(-1)!.montant).toBe((26_000 - 546) * 21 - 54_760);
  });

  it("le cas de la moitié du budget : 1 300 défauts, 260 partis, 46 800 € de non-qualité, le résultat baisse de 10 954 €", () => {
    gardesDeTexte(LA_MOITIE_DU_BUDGET_QUALITE);
    expect(attendus(LA_MOITIE_DU_BUDGET_QUALITE, "les-defauts")).toEqual([26_000 * 0.05, 260, 1_040 * 20 + 260 * 100]);
    const nonQualite = 46_800 - 32_760;
    const marge = (780 - 546) * 21;
    expect(attendus(LA_MOITIE_DU_BUDGET_QUALITE, "le-bilan")).toEqual([nonQualite, marge, 8_000 - nonQualite - marge]);
    expect(8_000 - nonQualite - marge).toBe(-10_954);
    expect(juste(LA_MOITIE_DU_BUDGET_QUALITE, "reponse")).toEqual(["Garder le budget actuel"]);
  });
});

describe("organiser l'activité", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => gardesDeTexte(ORGANISER_L_ACTIVITE));

  it("au 1er trimestre de N : 7 000 et 7 200, la ligne à 68,3 %, 2 222 enceintes libres, les clients limitent", () => {
    expect(attendus(ORGANISER_L_ACTIVITE, "les-capacites")).toEqual([7_000, 7_200, 7_000]);
    expect(attendus(ORGANISER_L_ACTIVITE, "l-occupation")).toEqual([Math.round((4_778 / 7_000) * 1000) / 10, 7_000 - 4_778]);
    expect(attendus(ORGANISER_L_ACTIVITE, "l-occupation")[0]).toBe(68.3);
    expect(juste(ORGANISER_L_ACTIVITE, "ce-qui-limite")).toEqual(["Les clients"]);
  });

  it("le délai d'un renfort : recruté en janvier, il monte un mois au 1er trimestre (600), trois au 2e (1 800)", () => {
    expect(attendus(ORGANISER_L_ACTIVITE, "le-delai")).toEqual([3 - 2, 600, 1_800]);
  });

  it("le curseur : la plus grande commande en plus est de 2 222 enceintes", () => {
    gardeDuCurseur(ORGANISER_L_ACTIVITE, "la-commande-en-plus", 2_222);
  });

  it("le laboratoire : 5 postes et 5 opérateurs servent les 7 800 enceintes de Noël", () => {
    const e = gardeDuLaboratoire(ORGANISER_L_ACTIVITE, "le-laboratoire-du-renfort");
    expect(e.defi(NOVA).solution).toEqual({ postes: 5, operateurs: 5 });
    expect(Math.min(5 * 1_750, 5 * 1_800)).toBeGreaterThanOrEqual(7_800);
    expect(Math.min(6 * 1_750, 4 * 1_800)).toBeLessThan(7_800);
  });

  it("le cas de la commande exceptionnelle : 1 500 enceintes au 3e trimestre, 1 190 livrables", () => {
    gardesDeTexte(LA_COMMANDE_EXCEPTIONNELLE);
    expect(attendus(LA_COMMANDE_EXCEPTIONNELLE, "ce-qui-reste")).toEqual([7_000, 5_810 + 1_500, 7_000 - 5_810]);
    expect(juste(LA_COMMANDE_EXCEPTIONNELLE, "reponse")).toEqual(["En proposer 1\u202f190, pas plus"]);
  });
});

describe("le stock de sécurité", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => gardesDeTexte(LE_STOCK_DE_SECURITE));

  it("100 kits par jour, 600 pendant le délai, 300 de sécurité, un point de commande à 900", () => {
    expect(attendus(LE_STOCK_DE_SECURITE, "le-point-de-commande")).toEqual([5_800 / 58, 600, 300, 900]);
    expect(juste(LE_STOCK_DE_SECURITE, "commander")).toEqual(["Oui, dès ce soir"]);
    expect(attendus(LE_STOCK_DE_SECURITE, "ce-qu-immobilise-la-securite")).toEqual([300 * 22]);
  });

  it("le curseur : le point de commande couvre 3 jours de retard", () => {
    gardeDuCurseur(LE_STOCK_DE_SECURITE, "le-retard-couvert", (900 - 600) / 100);
  });

  it("le laboratoire : 2 jours de sécurité couvrent un retard de 2 jours, 4 400 € immobilisés", () => {
    const e = gardeDuLaboratoire(LE_STOCK_DE_SECURITE, "le-laboratoire-de-la-securite");
    expect(e.defi(NOVA).solution).toEqual({ securite: 2 });
    expect(e.lecture(NOVA, { securite: 2 }).at(-1)!.montant).toBe(2 * 100 * 22);
    expect(e.lecture(NOVA, { securite: 1 })[1]!.montant).toBe(100);
  });

  it("le cas du pic : 121 kits par jour, un point à 1 089 ; l'ancien laisse 174 kits, 1 jour de retard couvert", () => {
    gardesDeTexte(LE_POINT_DE_COMMANDE_AVANT_LE_PIC);
    const parJour = Math.ceil(7_000 / 58);
    expect(attendus(LE_POINT_DE_COMMANDE_AVANT_LE_PIC, "le-point-du-pic")).toEqual([parJour, parJour * 9]);
    expect(parJour * 9).toBe(1_089);
    expect(attendus(LE_POINT_DE_COMMANDE_AVANT_LE_PIC, "l-ancien-point")).toEqual([900 - 121 * 6, Math.floor(174 / 121)]);
    expect(juste(LE_POINT_DE_COMMANDE_AVANT_LE_PIC, "reponse")).toEqual(["Commander à 1\u202f089 kits"]);
  });
});

describe("ce que coûte une livraison", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => gardesDeTexte(CE_QUE_COUTE_UNE_LIVRAISON));

  it("la tournée : 400 € de journée, 108 € de route, 508 € ; 7 palettes à 72,57 €, 1,59 € l'enceinte", () => {
    expect(attendus(CE_QUE_COUTE_UNE_LIVRAISON, "la-tournee")).toEqual([190 + 210, 240 * 0.45, 508]);
    expect(attendus(CE_QUE_COUTE_UNE_LIVRAISON, "par-palette")).toEqual([Math.ceil(320 / 48), c2(508 / 7), c2(508 / 320)]);
    expect(juste(CE_QUE_COUTE_UNE_LIVRAISON, "tournee-ou-messagerie")).toEqual(["La tournée"]);
  });

  it("le curseur : dès 6 palettes, la tournée coûte moins que la messagerie", () => {
    gardeDuCurseur(CE_QUE_COUTE_UNE_LIVRAISON, "les-palettes-qui-paient", Math.ceil(508 / 85));
  });

  it("le laboratoire : une seule tournée par mois, 508 €, face à 595 € et 680 € en messagerie", () => {
    const e = gardeDuLaboratoire(CE_QUE_COUTE_UNE_LIVRAISON, "le-laboratoire-de-la-livraison");
    expect(e.defi(NOVA).solution).toEqual({ mode: 1, fois: 1 });
    expect(e.lecture(NOVA, { mode: 0, fois: 1 }).at(-1)!.montant).toBe(7 * 85);
    expect(e.lecture(NOVA, { mode: 0, fois: 2 }).at(-1)!.montant).toBe(2 * 4 * 85);
  });

  it("le cas du gazole : 144 € de route, 544 €, encore 51 € de moins que la messagerie, jusqu'à 0,81 € le kilomètre", () => {
    gardesDeTexte(LE_GAZOLE_QUI_AUGMENTE);
    expect(attendus(LE_GAZOLE_QUI_AUGMENTE, "la-route-plus-chere")).toEqual([240 * 0.6, 400 + 144, 595 - 544]);
    expect(attendus(LE_GAZOLE_QUI_AUGMENTE, "jusqu-ou")).toEqual([Math.floor(((595 - 400) / 240) * 100) / 100]);
    expect(juste(LE_GAZOLE_QUI_AUGMENTE, "reponse")).toEqual(["Garder la tournée"]);
  });
});

describe("le taux de remplissage", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => gardesDeTexte(LE_TAUX_DE_REMPLISSAGE));

  it("7 palettes pour 12 places : 58,3 %, 5 places vides ; 72,57 € la palette, 42,33 € porteur plein", () => {
    expect(attendus(LE_TAUX_DE_REMPLISSAGE, "le-remplissage")).toEqual([7, Math.round((7 / 12) * 1000) / 10, 5]);
    expect(attendus(LE_TAUX_DE_REMPLISSAGE, "la-place-vide")).toEqual([c2(508 / 7), c2(508 / 12), c2(5 * c2(508 / 12))]);
    expect(juste(LE_TAUX_DE_REMPLISSAGE, "pourquoi")).toEqual(["La tournée coûte pareil, pleine ou vide"]);
  });

  it("le curseur : 9 palettes remplissent le porteur aux trois quarts", () => {
    gardeDuCurseur(LE_TAUX_DE_REMPLISSAGE, "remplir-aux-trois-quarts", 12 * 0.75);
  });

  it("le laboratoire : 2 tournées au porteur livrent le trimestre pour 1 016 €, moins que 3 au petit porteur (1 404 €)", () => {
    const e = gardeDuLaboratoire(LE_TAUX_DE_REMPLISSAGE, "le-laboratoire-des-tournees");
    expect(e.defi(NOVA).solution).toEqual({ vehicule: 1, tournees: 2 });
    expect(e.lecture(NOVA, { vehicule: 1, tournees: 2 }).at(-1)!.montant).toBe(2 * 508);
    expect(e.lecture(NOVA, { vehicule: 0, tournees: 3 }).at(-1)!.montant).toBe(3 * (150 + 210 + 108));
    // Une seule tournée au porteur : 960 enceintes, 20 palettes pour 12 places.
    expect(e.lecture(NOVA, { vehicule: 1, tournees: 1 })[1]!.montant).toBe(20 - 12);
  });

  it("le cas du lot de la bourse de fret : 5 palettes dans les 5 places, 175 € moins 13,50 € de détour", () => {
    gardesDeTexte(LE_LOT_DE_LA_BOURSE_DE_FRET);
    expect(attendus(LE_LOT_DE_LA_BOURSE_DE_FRET, "la-place")).toEqual([5, 100]);
    expect(attendus(LE_LOT_DE_LA_BOURSE_DE_FRET, "ce-qu-il-rapporte")).toEqual([5 * 35, 30 * 0.45, 175 - 13.5]);
    expect(juste(LE_LOT_DE_LA_BOURSE_DE_FRET, "reponse")).toEqual(["Prendre le lot"]);
  });
});

describe("livrer à temps", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => gardesDeTexte(LIVRER_A_TEMPS));

  it("27 200 demandées, 26 000 livrées, 1 200 perdues, 95,6 % ; 25 200 € de marge perdue", () => {
    expect(attendus(LIVRER_A_TEMPS, "le-taux-de-service")).toEqual([27_200, 26_000, 1_200, Math.round((26_000 / 27_200) * 1000) / 10]);
    expect(attendus(LIVRER_A_TEMPS, "ce-que-coute-une-commande-perdue")).toEqual([1_200 * 21]);
    expect(juste(LIVRER_A_TEMPS, "quand")).toEqual(["La ligne est pleine au printemps et à Noël"]);
  });

  it("le curseur : 800 enceintes de capacité en plus livreraient Noël", () => {
    gardeDuCurseur(LIVRER_A_TEMPS, "la-capacite-qui-manque", 7_800 - 7_000);
  });

  it("le laboratoire : 400 d'avance au 1er trimestre, 800 au 3e, 23 400 € de gain", () => {
    const e = gardeDuLaboratoire(LIVRER_A_TEMPS, "le-laboratoire-de-l-avance");
    expect(e.defi(NOVA).solution).toEqual({ premier: 400, troisieme: 800 });
    expect(e.lecture(NOVA, { premier: 400, troisieme: 800 }).at(-1)!.montant).toBe(1_200 * 21 - (400 + 800) * 1.5);
    // 600 d'avance au 1er : 200 de trop, qui ne servent à rien (la ligne monte moins au 2e) et coûtent leur stockage.
    expect(e.lecture(NOVA, { premier: 600, troisieme: 800 }).at(-1)!.montant).toBe(1_200 * 21 - (600 + 800) * 1.5);
  });

  it("le cas de la panne : 5 600 enceintes, 200 perdues, 6 200 € ; le 2e trimestre manque déjà de 400", () => {
    gardesDeTexte(COMBIEN_CHARGER_PENDANT_LA_PANNE);
    expect(attendus(COMBIEN_CHARGER_PENDANT_LA_PANNE, "la-ligne-en-panne")).toEqual([7_000 * 0.8, 5_800 - 5_600, 200 * 21 + 2_000]);
    expect(attendus(COMBIEN_CHARGER_PENDANT_LA_PANNE, "le-trimestre-suivant")).toEqual([7_000 - 7_400]);
    expect(juste(COMBIEN_CHARGER_PENDANT_LA_PANNE, "reponse")).toEqual(["Prévenir : 200 commandes ne seront pas livrées"]);
  });
});
