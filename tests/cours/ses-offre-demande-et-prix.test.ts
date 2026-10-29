import { describe, expect, it } from "vitest";
import { blocOfficiel } from "../../src/config/ateliers/referentiels";
import { ENTREPRISES_DU_MARCHE, L_OFFRE_ET_LA_DEMANDE } from "../../src/config/cours/chapitres/l-offre-et-la-demande";
import { LE_PRIX_D_EQUILIBRE, prixDEquilibre } from "../../src/config/cours/chapitres/le-prix-d-equilibre";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LE_PRIX_DE_FIN_D_ANNEE, prixDeFinDAnnee } from "../../src/config/cours/situations/par-chapitre/le-prix-de-fin-d-annee";
import { METTRE_PLUS_EN_VENTE, miseEnVenteAugmentee } from "../../src/config/cours/situations/par-chapitre/mettre-plus-en-vente";
import { NOVA, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-du-marche";

/**
 * L'OFFRE ET LA DEMANDE, LE PRIX QUI ÉQUILIBRE LE MARCHÉ (seconde SES, palier 1), SUR LE MARCHÉ DE
 * NOVA DU MONDE DU COURS, ET LEURS CAS : METTRE PLUS EN VENTE, LE PRIX DE FIN D'ANNÉE.
 *
 * Refait à la main : la droite de demande du trimestre, 16 755 − 203 × prix, à l'enceinte inférieure
 * (nova-gestion.ts) ; les 4 778 enceintes que la ligne a fabriquées au premier trimestre (1 270 +
 * 1 130 + 1 418 vendues aux particuliers, 3 × 320 à CampusTech) ; la ligne de 7 000 enceintes ; le
 * marché de toutes les enceintes de janvier à juin ; les trois clientèles de la fiche.
 */

const demande = (p: number, coef = 1) => Math.floor(coef * (16_755 - 203 * p) + 1e-9);
const OFFRE = 1_270 + 1_130 + 1_418 + 3 * 320;

describe("les deux chapitres et leurs cas, dans le parcours", () => {
  it("portent les titres du programme de seconde SES, chez NOVA seule", () => {
    for (const ch of [L_OFFRE_ET_LA_DEMANDE, LE_PRIX_D_EQUILIBRE]) {
      expect([ch.parcours, ch.palier]).toEqual(["seconde-ses", 1]);
      expect(PROGRAMME["seconde-ses"]![1]).toContain(ch.titre);
      expect(ch.blocs).toEqual(["2de SES · Comment se forment les prix sur un marché ?"]);
    }
    expect(blocOfficiel("2de SES · Comment se forment les prix sur un marché ?", "seconde-ses")).toBe("Comment se forment les prix sur un marché ?");
    expect([...ENTREPRISES_DU_MARCHE]).toEqual(["nova"]);
    gardeDuCas(METTRE_PLUS_EN_VENTE, L_OFFRE_ET_LA_DEMANDE);
    gardeDuCas(LE_PRIX_DE_FIN_D_ANNEE, LE_PRIX_D_EQUILIBRE);
  });
});

describe("l'offre et la demande sur un marché", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(L_OFFRE_ET_LA_DEMANDE);
  });

  it("les clientèles : 9 000, 5 600 et 3 500 achetées, 1 295, 1 755 et 1 728 demandées à NOVA ; les étudiants réagissent le plus", () => {
    const t = etape(L_OFFRE_ET_LA_DEMANDE, "intro", "lecture").tableau!(NOVA);
    expect(t.lignes.map((l) => l.libelle)).toEqual(["Étudiants", "Familles", "Mélomanes"]);
    const q = (n: number) => n.toLocaleString("fr-FR");
    expect(t.lignes.map((l) => l.valeurs)).toEqual([
      [q(9_000), q(9_555 - 140 * 59)],
      [q(5_600), q(5_000 - 55 * 59)],
      [q(3_500), q(2_200 - 8 * 59)],
    ]);
    expect(juste(L_OFFRE_ET_LA_DEMANDE, "qui-reagit-au-prix")).toEqual(["Étudiants"]);
    expect(juste(L_OFFRE_ET_LA_DEMANDE, "ce-qui-fait-varier")).toEqual(["Mettre plus d'enceintes en vente"]);
  });

  it("la saison : 43 000 enceintes sur le semestre, 3 600 d'écart entre juin et février", () => {
    expect(attendus(L_OFFRE_ET_LA_DEMANDE, "la-saison")).toEqual([6_000 + 5_600 + 6_500 + 7_400 + 8_300 + 9_200, 9_200 - 5_600]);
  });

  it("le trimestre : 4 778 demandées à 59 €, 4 778 mises en vente et échangées, rien ne reste (toute la demande de N servie)", () => {
    expect([OFFRE, demande(59)]).toEqual([4_778, 4_778]);
    expect(attendus(L_OFFRE_ET_LA_DEMANDE, "l-offre-et-l-echange")).toEqual([OFFRE, 0, 0]);
  });

  it("à trois prix : la loi de la demande ; le prix bas ajoute 1 197 demandées et rien d'échangé", () => {
    expect([demande(53.1), demande(59), demande(64.9)]).toEqual([5_975, 4_778, 3_580]);
    expect(juste(L_OFFRE_ET_LA_DEMANDE, "la-loi-de-la-demande")).toEqual(["Plus le prix est bas, plus la demande reçue est grande"]);
    expect(attendus(L_OFFRE_ET_LA_DEMANDE, "au-prix-bas")).toEqual([5_975 - 4_778, 0]);
  });

  it("le curseur : mettre en vente 4 778 enceintes sert toute la demande ; 4 777 en laissent une", () => {
    const e = gardeDuCurseur(L_OFFRE_ET_LA_DEMANDE, "l-offre-qui-suit", 4_778);
    expect(e.droites(NOVA).cout(0)).toBe(4_778 * 59);
  });

  it("le laboratoire : à 49 €, la ligne de 7 000 enceintes sert toute la demande (6 808) ; à 48 €, 7 011 demandées", () => {
    const e = gardeDuLaboratoire(L_OFFRE_ET_LA_DEMANDE, "le-laboratoire-du-prix");
    expect(e.defi(NOVA).solution).toEqual({ prix: 49 });
    expect([demande(49), demande(48)]).toEqual([6_808, 7_011]);
  });
});

describe("le prix qui équilibre le marché", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LE_PRIX_D_EQUILIBRE);
  });

  it("toute la ligne en vente (7 000) : excédent à 59 € (−2 222), encore à 53,10 € ; pénurie à 47,20 € (+173) ; excédent au milieu, 50,15 €", () => {
    expect(juste(LE_PRIX_D_EQUILIBRE, "penurie-ou-excedent")).toEqual(["En excédent : une partie de l'offre reste invendue"]);
    expect(juste(LE_PRIX_D_EQUILIBRE, "dans-quel-sens")).toEqual(["Baisser le prix"]);
    expect(attendus(LE_PRIX_D_EQUILIBRE, "le-tatonnement")).toEqual([4_778 - 7_000, demande(47.2) - 7_000]);
    expect(demande(47.2)).toBe(7_173);
    expect(juste(LE_PRIX_D_EQUILIBRE, "l-intervalle")).toEqual(["Entre 47,20 € et 53,10 €"]);
    expect(attendus(LE_PRIX_D_EQUILIBRE, "au-milieu")).toEqual([demande(50.15) - 7_000]);
    expect(prixDEquilibre(NOVA).equilibre).toBe("sous-le-milieu");
    expect(juste(LE_PRIX_D_EQUILIBRE, "le-prix-trouve")).toEqual(["Entre 47,20 € et 50,15 €"]);
  });

  it("le curseur : 48 € est le prix le plus haut sans excédent (7 011 demandées) ; à 49 €, 6 808", () => {
    gardeDuCurseur(LE_PRIX_D_EQUILIBRE, "le-prix-sans-excedent", 48);
  });

  it("le laboratoire : 48,10 €, où la demande (6 990) s'écarte le moins des 7 000 ; à 48 €, 7 011", () => {
    const e = gardeDuLaboratoire(LE_PRIX_D_EQUILIBRE, "le-laboratoire-de-l-equilibre");
    expect(e.defi(NOVA).solution).toEqual({ prix: 48.1 });
    expect([demande(48.1), demande(48)]).toEqual([6_990, 7_011]);
  });
});

describe("les cas", () => {
  it("mettre plus en vente : 5 734 mises en vente, 4 778 échangées, 956 sans acheteur ; elle ne vend rien de plus", () => {
    const m = miseEnVenteAugmentee(NOVA);
    expect(m.pose).toBe(Math.round(OFFRE * 1.2));
    expect(attendus(METTRE_PLUS_EN_VENTE, "ce-qui-s-echange")).toEqual([OFFRE, OFFRE]);
    expect(attendus(METTRE_PLUS_EN_VENTE, "ce-qui-reste")).toEqual([0, 5_734 - 4_778]);
    expect(juste(METTRE_PLUS_EN_VENTE, "reponse")).toEqual(["Elle ne vend rien de plus : la demande était servie"]);
  });

  it("le prix de fin d'année : 6 940 demandées à 59 € (× 6 940 ÷ 4 778) pour 7 000 en vente, à 1 % près : garder le prix", () => {
    const p = prixDeFinDAnnee(NOVA);
    expect(p.depart).toMatchObject({ prix: 59, demande: demande(59, 6_940 / 4_778), offre: 7_000 });
    expect(demande(59, 6_940 / 4_778)).toBe(6_940);
    expect(juste(LE_PRIX_DE_FIN_D_ANNEE, "reponse")).toEqual(["Garder 59 €"]);
  });
});
