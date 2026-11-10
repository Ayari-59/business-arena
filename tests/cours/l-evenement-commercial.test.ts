import { describe, expect, it } from "vitest";
import { L_EVENEMENT_COMMERCIAL } from "../../src/config/cours/chapitres/l-evenement-commercial";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { UN_INVITE_POUR_LA_MATINALE } from "../../src/config/cours/situations/par-chapitre/un-invite-pour-la-matinale";
import type { EtapeTri } from "../../src/config/cours/types";
import { CABINET, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-du-terrain-d-atlas";

/**
 * L'ÉVÉNEMENT COMMERCIAL : BUDGET, BILAN ET SUIVI DES CONTACTS (BTS NDRC, blocs 1 et 3, palier 3), CHEZ
 * ATLAS CONSEIL, ET SON CAS : UN INVITÉ POUR LA MATINALE ?
 *
 * Refait à la main : 17 200 € de stands, 37 200 € de coût complet ; une marge de première année de
 * (12 536 + 4 600) ÷ 2 = 8 568 €, 5 contrats pour payer les salons, 28 560 € de valeur vie, 2 contrats ; 93 €,
 * 930 € et 18 600 € par visiteur, rendez-vous et contrat, 19 920 € de gain ; le pipeline (9 920 € et
 * 12 320 €) ; les matinales (2,5 comptes, 4 800 € le compte, 59 400 €) ; le salon qui les égale à 17 % de
 * rendez-vous. Le cas : l'intervenant à 2 500 €, payé par 3 prospects de plus.
 */

const ch = L_EVENEMENT_COMMERCIAL;
const c = (x: number) => Math.round(x * 100) / 100 + 0;

describe("l'événement commercial, chez le cabinet du monde du cours", () => {
  it("se joue chez ATLAS CONSEIL, au palier 3 du BTS NDRC, blocs 1 et 3, au programme, avec ses voisins", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier]).toEqual(["ndrc", 3]);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 1 · Relation client et négociation-vente", "BTS NDRC Bloc 3 · Relation client et animation de réseaux"]);
    gardeDuProgramme(ch, PROGRAMME.ndrc[3]!);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(UN_INVITE_POUR_LA_MATINALE);
    expect(SITUATIONS).toContain(UN_INVITE_POUR_LA_MATINALE);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDeTexte(ch);
  });

  it("le budget et le rétroplanning", () => {
    expect(attendus(ch, "le-budget")).toEqual([8_400 + 3_200 + 1_800 + 2_600 + 1_200, 17_200 + 20_000, c((20_000 / 37_200) * 100)]);
    expect(attendus(ch, "le-budget")).toEqual([17_200, 37_200, 53.76]);
    const tri = ch.etapes.find((e) => e.id === "le-retroplanning") as EtapeTri;
    expect(tri.elements(CABINET).map((x) => x.categorie)).toEqual(["trois-mois-avant", "trois-mois-avant", "un-mois-avant", "un-mois-avant", "la-semaine-du-salon", "la-semaine-du-salon", "apres-le-salon", "apres-le-salon"]);
  });

  it("le point mort : le pari, le curseur, puis le calcul sur une année et sur la valeur vie", () => {
    expect(juste(ch, "predire-le-point-mort")).toEqual(["Environ 5"]);
    gardeDuCurseur(ch, "les-contrats-qui-paient", Math.ceil(37_200 / 8_568));
    expect(attendus(ch, "le-point-mort")).toEqual([8_568, 5, 28_560, 2]);
  });

  it("le bilan et le suivi des contacts", () => {
    expect(attendus(ch, "le-bilan")).toEqual([37_200 / 400, 37_200 / 40, 37_200 / 2, 2 * 28_560, 2 * 28_560 - 37_200]);
    expect(attendus(ch, "le-suivi-des-contacts")).toEqual([49_600 * 0.2, 49_600 * 0.2 + 48_000 * 0.05, 0.8]);
  });

  it("les matinales : le pari, le laboratoire, le bilan attendu et la décision", () => {
    expect(juste(ch, "predire-la-matinale")).toEqual(["Plus que les salons"]);
    const l = gardeDuLaboratoire(ch, "le-laboratoire-de-l-evenement");
    expect(l.depart).toEqual({ visiteurs: 400, rendezVous: 10, signature: 25 });
    expect(l.d.solution).toEqual({ visiteurs: 400, rendezVous: 17, signature: 25 });
    expect(l.auDepart["Salons moins matinales"]).toBe(19_920 - 59_400);
    expect(l.aLaSolution["Gain des salons"]).toBe(c(3.4 * 28_560 - 37_200));
    expect(l.d.atteint({ visiteurs: 400, rendezVous: 16, signature: 25 })).toBe(false);
    expect(attendus(ch, "les-matinales")).toEqual([30, 2.5, 200, 4_800, 2.5 * 28_560 - 12_000]);
    expect(juste(ch, "refaire-le-salon")).toEqual(["Les matinales, qui gagnent plus pour moins cher"]);
  });
});

describe("son cas : un invité pour la matinale ?", () => {
  const s = UN_INVITE_POUR_LA_MATINALE;

  it("tient comme un cas dédié, et la réponse ne se devine pas à sa longueur", () => {
    gardeDuCas(s, ch);
  });

  it("le budget, les prospects qui paient l'intervenant et le bilan attendu, refaits à la main", () => {
    expect(attendus(s, "le-budget")).toEqual([8_500, c(8_500 / 45), 200]);
    // Un prospect présent vaut 1/2 × 1/3 × 1/4 × 28 560 = 1 190 € ; 2 500 € ÷ 1 190 € = 2,1, soit 3 prospects de plus.
    gardeDuCurseur(s, "les-prospects-qui-paient", 33);
    // Les comptes au centième, 1,88 : le reste du bilan part de ce chiffre affiché.
    const comptes = c((45 * 0.5 * 0.25) / 3);
    expect(attendus(s, "le-bilan-attendu")).toEqual([comptes, c(8_500 / comptes), c(comptes * 28_560 - 8_500), c(comptes * 28_560 - 8_500 - (1.25 * 28_560 - 6_000))]);
    expect(attendus(s, "le-bilan-attendu")).toEqual([1.88, 4_521.28, 45_192.8, 15_492.8]);
    expect(juste(s, "reponse")).toEqual(["L'inviter : 3 prospects de plus suffisent à le payer"]);
  });
});
