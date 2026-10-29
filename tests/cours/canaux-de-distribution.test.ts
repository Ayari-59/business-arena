import { describe, expect, it } from "vitest";
import { CANAUX_DE_DISTRIBUTION, DISTRIBUTIONS } from "../../src/config/cours/chapitres/canaux-de-distribution";
import { PROGRAMME } from "../../src/config/cours/registre";
import { L_INTERMEDIAIRE_VEUT_PAYER_PLUS_TARD, intermediairePaiePlusTard } from "../../src/config/cours/situations/par-chapitre/l-intermediaire-veut-payer-plus-tard";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-du-marche";

/**
 * LES CANAUX DE DISTRIBUTION (bac STMG mercatique, palier 1), SUR LES DEUX CANAUX DE NOVA DU MONDE
 * DU COURS, ET SON CAS : L'INTERMÉDIAIRE VEUT PAYER PLUS TARD.
 *
 * Refait à la main sur nova-gestion.ts : de janvier à mars, 1 270 + 1 130 + 1 418 = 3 818 enceintes
 * vendues en ligne, 3 × 320 = 960 à CampusTech, toutes à 59 € ; 60 jours convenus, 20 jours de
 * retard ; l'emprunt à 5 %, la TVA à 20 %, l'année de 360 jours ; 38 € de coût variable.
 */

const c = (x: number) => Math.round(x * 100) / 100;
const DU = 960 * 59;
const attente = (montant: number, jours: number) => c((montant * 1.2 * 0.05 * jours) / 360);

describe("les canaux de distribution", () => {
  it("au programme du bac STMG, chez NOVA seule, et son cas lui est dédié", () => {
    expect(PROGRAMME.stmg[1]).toContain(CANAUX_DE_DISTRIBUTION.titre);
    expect([...DISTRIBUTIONS]).toEqual(["nova"]);
    gardeDuCas(L_INTERMEDIAIRE_VEUT_PAYER_PLUS_TARD, CANAUX_DE_DISTRIBUTION);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(CANAUX_DE_DISTRIBUTION);
  });

  it("CampusTech : 20,1 % des ventes, 56 640 € dus, 566,40 € d'attente, 0,59 € par enceinte", () => {
    expect(attendus(CANAUX_DE_DISTRIBUTION, "part")).toEqual([Math.round((960 / 4_778) * 1_000) / 10, DU]);
    expect(attendus(CANAUX_DE_DISTRIBUTION, "cout")).toEqual([attente(DU, 60), c(attente(DU, 60) / 960)]);
    expect(attente(DU, 60)).toBe(566.4);
    expect(juste(CANAUX_DE_DISTRIBUTION, "avantage")).toEqual(["Il lui apporte des clients qu'elle n'atteindrait pas seule"]);
  });

  it("le curseur : à 60 jours, l'attente coûte 1 % du chiffre d'affaires du canal ; à 61, plus", () => {
    const e = gardeDuCurseur(CANAUX_DE_DISTRIBUTION, "le-delai-acceptable", 60);
    expect(e.droites(NOVA).produit(0)).toBe(c(0.01 * DU));
    expect(e.droites(NOVA).cout(61)).toBe(attente(DU, 61));
  });

  it("le laboratoire : 17 % de remise laissent 48,97 − 38 − 0,49 = 10,48 € ; 18 % ne laissent que 9,90 €", () => {
    const e = gardeDuLaboratoire(CANAUX_DE_DISTRIBUTION, "le-laboratoire-de-la-remise");
    expect(e.defi(NOVA).solution).toEqual({ remise: 17 });
    expect(c(c(59 * 0.83) - 38 - attente(c(59 * 0.83), 60))).toBe(10.48);
    expect(c(c(59 * 0.82) - 38 - attente(c(59 * 0.82), 60))).toBe(9.9);
  });
});

describe("l'intermédiaire veut payer plus tard", () => {
  it("90 jours : 849,60 € d'attente, 283,20 € de plus ; la loi plafonne le délai convenu à 60 jours", () => {
    const r = intermediairePaiePlusTard(NOVA);
    expect([r.du, r.delaiDemande, r.coutDuDelaiDemande, r.surcout, r.permis]).toEqual([DU, 90, attente(DU, 90), c(attente(DU, 90) - attente(DU, 60)), false]);
    expect([r.margeUnitaire, r.coutParUniteApres, r.margeQuiReste]).toEqual([21, c(attente(DU, 90) / 960), c(21 - c(attente(DU, 90) / 960))]);
    expect(juste(L_INTERMEDIAIRE_VEUT_PAYER_PLUS_TARD, "reponse")).toEqual(["Refusons : la loi plafonne le délai convenu à 60 jours"]);
  });
});
