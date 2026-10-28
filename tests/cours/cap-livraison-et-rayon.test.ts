import { describe, expect, it } from "vitest";
import { ARTICLES_DE_LA_BOUTIQUE, MAGASINS, RECEVOIR_UNE_LIVRAISON } from "../../src/config/cours/chapitres/recevoir-une-livraison";
import { REMPLIR_LE_RAYON } from "../../src/config/cours/chapitres/remplir-le-rayon";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { ARTICLES_PAR_CARTON, CARTONS_DE_CHAQUE_ECART, CARTONS_MANQUANTS } from "../../src/config/cours/monde/vente-et-caisse";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LES_DEUX_ECARTS, deuxEcarts } from "../../src/config/cours/situations/par-chapitre/les-deux-ecarts";
import { TENIR_JUSQU_AU_REASSORT, reassortAttendu } from "../../src/config/cours/situations/par-chapitre/tenir-jusqu-au-reassort";
import { BOUTIQUE, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * RECEVOIR UNE LIVRAISON ET REMPLIR LE RAYON (CAP EPC, palier 1), SUR LA BOUTIQUE DU MONDE DU COURS,
 * ET LEURS CAS : LES DEUX ÉCARTS, TENIR JUSQU'AU RÉASSORT.
 *
 * Refait à la main sur la fiche de MAILLE & CO : le façonnier livre en janvier 500 pulls col rond,
 * 240 cardigans, 60 pulls mérinos et 200 écharpes (1 000 articles) ; la boutique en avait 1 160 au
 * 1er janvier. Le cardigan : 120 au 1er janvier, 384 demandés en 30 jours, 240 livrés le 12, le
 * façonnier à 21 jours, 75 € HT.
 */

const CAP = /^CAP EPC /;

describe("les deux chapitres du CAP EPC et leurs cas", () => {
  it("portent les titres du programme, au palier 1, et des blocs du CAP EPC qui se résolvent", () => {
    for (const ch of [RECEVOIR_UNE_LIVRAISON, REMPLIR_LE_RAYON]) {
      expect([ch.parcours, ch.palier]).toEqual(["cap-epc", 1]);
      gardeDuProgramme(ch, PROGRAMME["cap-epc"][1]!, () => "cap-epc", CAP);
    }
    expect(RECEVOIR_UNE_LIVRAISON.blocs).toEqual(["CAP EPC Bloc 1 · Recevoir et suivre les commandes"]);
    expect(REMPLIR_LE_RAYON.blocs).toEqual(["CAP EPC Bloc 2 · Mettre en valeur et approvisionner"]);
  });

  it("se jouent à la boutique du cours seule ; chaque référence a son nom de phrase ; les cas sont dédiés", () => {
    expect(MAGASINS).toEqual(["boutique"]);
    expect(Object.keys(ARTICLES_DE_LA_BOUTIQUE).sort()).toEqual(MAILLE_ET_CO.gamme.map((r) => r.code).sort());
    expect([ARTICLES_PAR_CARTON, CARTONS_MANQUANTS, CARTONS_DE_CHAQUE_ECART]).toEqual([10, 1, 1]);
    gardeDuCas(LES_DEUX_ECARTS, RECEVOIR_UNE_LIVRAISON);
    gardeDuCas(TENIR_JUSQU_AU_REASSORT, REMPLIR_LE_RAYON);
  });
});

describe("recevoir une livraison", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(RECEVOIR_UNE_LIVRAISON);
  });

  it("le total, la ligne de l'écart, l'écart, la réserve, le stock après", () => {
    expect(attendus(RECEVOIR_UNE_LIVRAISON, "total-commande")).toEqual([500 + 240 + 60 + 200]);
    expect(juste(RECEVOIR_UNE_LIVRAISON, "la-ligne")).toEqual(["Les pulls col rond"]);
    expect(attendus(RECEVOIR_UNE_LIVRAISON, "l-ecart")).toEqual([10, 990]);
    expect(juste(RECEVOIR_UNE_LIVRAISON, "signer")).toEqual(["Signer en écrivant sur le bon : « 10 pulls col rond manquants »"]);
    expect(attendus(RECEVOIR_UNE_LIVRAISON, "stock-apres")).toEqual([400 + 490, 1_160 + 990]);
    expect(juste(RECEVOIR_UNE_LIVRAISON, "en-trop")).toEqual(["L'écrire sur le bon, et prévenir votre responsable"]);
  });

  it("le curseur : 30 cartons de pulls col rond peuvent manquer (400 + 500 − 300 = 600 demandés)", () => {
    const e = gardeDuCurseur(RECEVOIR_UNE_LIVRAISON, "combien-peuvent-manquer", 30);
    expect(e.droites(BOUTIQUE).produit(31)).toBe(590);
  });

  it("le laboratoire : saisir 490 pulls et en réclamer 10, la seule position juste", () => {
    const e = gardeDuLaboratoire(RECEVOIR_UNE_LIVRAISON, "le-laboratoire-de-la-saisie");
    expect(e.defi(BOUTIQUE).solution).toEqual({ saisis: 490, reclames: 10 });
    expect(e.lecture(BOUTIQUE, { saisis: 500, reclames: 0 }).at(-1)!.montant).toBe(10 * 25);
  });
});

describe("les deux écarts", () => {
  it("1 000 sur le bon, 1 000 comptés, 10 pulls col rond manquants, 10 pulls mérinos en trop, 250 € payés pour rien", () => {
    const s = deuxEcarts(BOUTIQUE);
    expect([s.manque.pluriel, s.enTrop.pluriel]).toEqual(["pulls col rond", "pulls mérinos"]);
    expect(attendus(LES_DEUX_ECARTS, "totaux")).toEqual([1_000, 1_000]);
    expect(attendus(LES_DEUX_ECARTS, "lignes")).toEqual([10, 10]);
    expect(attendus(LES_DEUX_ECARTS, "sans-reserve")).toEqual([10 * 25]);
    expect(juste(LES_DEUX_ECARTS, "reponse")).toEqual(["Écrire les deux écarts sur le bon, puis signer"]);
  });
});

describe("remplir le rayon", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(REMPLIR_LE_RAYON);
  });

  it("13 cardigans par jour, 9 jours, 12 jours vides en commandant le 1er, 2 avant la livraison du 12, 1 800 € perdus", () => {
    expect(attendus(REMPLIR_LE_RAYON, "par-jour")).toEqual([Math.round(384 / 30)]);
    expect(attendus(REMPLIR_LE_RAYON, "jours-avant")).toEqual([Math.floor(120 / 13)]);
    expect(attendus(REMPLIR_LE_RAYON, "reassort")).toEqual([21 - 9, 12 - 1 - 9]);
    expect(attendus(REMPLIR_LE_RAYON, "ce-que-coute")).toEqual([384 - 360, 24 * 75]);
    expect(juste(REMPLIR_LE_RAYON, "lire-la-rupture")).toEqual(["La plupart des articles demandés ont été vendus"]);
    expect(juste(REMPLIR_LE_RAYON, "le-geste")).toEqual(["Prévenir votre responsable aujourd'hui, avec vos chiffres"]);
  });

  it("le curseur : 273 cardigans le jour de la commande (13 × 21)", () => {
    gardeDuCurseur(REMPLIR_LE_RAYON, "quand-prevenir", 13 * 21);
  });

  it("le laboratoire : 390 cardigans, 39 cartons, pour les 384 clients de février", () => {
    const e = gardeDuLaboratoire(REMPLIR_LE_RAYON, "le-laboratoire-de-la-commande");
    expect(e.defi(BOUTIQUE).solution).toEqual({ commande: 390 });
    expect(e.leviers(BOUTIQUE)[0]!.depart).toBe(360);
  });
});

describe("tenir jusqu'au réassort", () => {
  it("240 ÷ 13 = 18 jours pour 21 de délai : 3 jours vides, 39 cardigans, 2 925 € en danger, ça ne tient pas", () => {
    const s = reassortAttendu(BOUTIQUE);
    expect(s.aTemps).toBe(false);
    expect(attendus(TENIR_JUSQU_AU_REASSORT, "rythme")).toEqual([13]);
    expect(attendus(TENIR_JUSQU_AU_REASSORT, "jours")).toEqual([Math.floor(240 / 13), 21 - 18]);
    expect(attendus(TENIR_JUSQU_AU_REASSORT, "en-danger")).toEqual([3 * 13, 39 * 75]);
    expect(juste(TENIR_JUSQU_AU_REASSORT, "reponse")).toEqual(["Non, ça ne tient pas : il faut un réassort plus rapide"]);
  });
});
