import { describe, expect, it } from "vitest";
import { controleBudgetaire, coutPreetabli, coutStandardDeLHeureMachine } from "../../src/config/cours/monde/ecarts";
import { L_USINE_DE_NOVA, type FicheDeLUsine } from "../../src/config/cours/monde/nova-usine";

/**
 * LE CONTRÔLE BUDGÉTAIRE DE L'USINE DU COURS (monde/ecarts.ts), REFAIT À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur la fiche, sans les fonctions du modèle ; les
 * valeurs absolues de l'usine de NOVA sont épinglées (un changement de la fiche se voit), et
 * chaque décomposition doit retomber sur son total, centime compris.
 */

const f = L_USINE_DE_NOVA;
const [nomade, salon] = f.modeles;
const r = f.realise;
const e = controleBudgetaire(f);

describe("le coût préétabli d'une enceinte", () => {
  it("l'heure-machine du centre de montage coûte son variable plus son fixe ÷ l'activité normale", () => {
    expect(coutStandardDeLHeureMachine(f)).toBe(f.centre.coutVariableParHeure + f.centre.chargesFixes / f.centre.activiteNormale);
    expect(coutStandardDeLHeureMachine(f)).toBe(40);
  });

  it("chaque modèle : matière, main-d'œuvre directe, centre, total et marge préétablie", () => {
    for (const m of f.modeles) {
      const c = coutPreetabli(f, m);
      expect(c.matiere).toBe(m.matiereParUnite * f.prixStandardDuKilo);
      expect(c.mainDOeuvre).toBe(m.heuresParUnite * f.tauxHoraireStandard);
      expect(c.centre).toBe(m.heuresMachineParUnite * 40);
      expect(c.total).toBe(c.matiere + c.mainDOeuvre + c.centre);
      expect(c.marge).toBe(m.prixPrevu - c.total);
    }
    expect(coutPreetabli(f, nomade!)).toEqual({ matiere: 12, mainDOeuvre: 10, centre: 10, total: 32, marge: 27 });
    expect(coutPreetabli(f, salon!)).toEqual({ matiere: 30, mainDOeuvre: 25, centre: 20, total: 75, marge: 44 });
  });
});

describe("le budget standard et le préétabli de la production réelle", () => {
  it("le budget standard : la production prévue au coût préétabli", () => {
    expect(e.budgetStandard.total).toBe(12_000 * 32 + 4_000 * 75);
    expect(e.budgetStandard).toEqual({ kilos: 17_600, heures: 8_800, heuresMachine: 5_000, matiere: 264_000, mainDOeuvre: 220_000, centre: 200_000, total: 684_000 });
    // Le budget est bâti sur l'activité normale du centre : il prévoit exactement ses heures-machine.
    expect(e.budgetStandard.heuresMachine).toBe(f.centre.activiteNormale);
  });

  it("le préétabli de la production réelle : les quantités réelles au coût préétabli", () => {
    const qN = r.ventes.nomade.quantite;
    const qS = r.ventes.salon.quantite;
    expect(e.preetabliDuReel.kilos).toBe(qN * 0.8 + qS * 2);
    expect(e.preetabliDuReel.heures).toBe(qN * 0.4 + qS * 1);
    expect(e.preetabliDuReel.heuresMachine).toBe(qN * 0.25 + qS * 0.5);
    expect(e.preetabliDuReel.total).toBe(qN * 32 + qS * 75);
    expect(e.preetabliDuReel).toEqual({ kilos: 18_000, heures: 9_000, heuresMachine: 5_050, matiere: 270_000, mainDOeuvre: 225_000, centre: 202_000, total: 697_000 });
  });

  it("le réel et l'écart global sur coûts", () => {
    expect(e.reel).toEqual({ matiere: 18_500 * 15.4, mainDOeuvre: 8_800 * 26, centre: 213_000 });
    expect(e.reelTotal).toBe(284_900 + 228_800 + 213_000);
    expect(e.ecartGlobalSurCouts).toBe(726_700 - 697_000);
    expect(e.ecartGlobalSurCouts).toBe(e.matiere.global + e.mainDOeuvre.global + e.centre.global);
  });
});

describe("les écarts sur charges directes", () => {
  it("matière : prix sur les kilos réels, quantité au prix standard, leur somme fait l'écart global", () => {
    expect(e.matiere.prix).toBe(7_400);
    expect(e.matiere.prix).toBeCloseTo((15.4 - 15) * 18_500, 6);
    expect(e.matiere.quantite).toBe((18_500 - 18_000) * 15);
    expect(e.matiere.global).toBe(284_900 - 270_000);
    expect(e.matiere.prix + e.matiere.quantite).toBe(e.matiere.global);
  });

  it("main-d'œuvre directe : taux sur les heures réelles, temps au taux standard", () => {
    expect(e.mainDOeuvre.taux).toBe((26 - 25) * 8_800);
    expect(e.mainDOeuvre.temps).toBe((8_800 - 9_000) * 25);
    expect(e.mainDOeuvre.global).toBe(228_800 - 225_000);
    expect(e.mainDOeuvre.taux + e.mainDOeuvre.temps).toBe(e.mainDOeuvre.global);
  });
});

describe("les écarts sur charges indirectes : le centre de montage", () => {
  it("budget, activité, rendement, et leur somme fait l'écart global du centre", () => {
    const budgetFlexible = 120_000 + 16 * 5_200;
    expect(e.centre.budgetFlexible).toBe(budgetFlexible);
    expect(e.centre.budget).toBe(213_000 - budgetFlexible);
    expect(e.centre.activite).toBe(budgetFlexible - 40 * 5_200);
    // L'activité dépasse la normale : les charges fixes sont mieux absorbées, l'écart est favorable.
    expect(e.centre.activite).toBe(-(5_200 - 5_000) * (120_000 / 5_000));
    expect(e.centre.rendement).toBe((5_200 - 5_050) * 40);
    expect(e.centre.global).toBe(213_000 - 202_000);
    expect(e.centre.budget + e.centre.activite + e.centre.rendement).toBe(e.centre.global);
    expect([e.centre.budget, e.centre.activite, e.centre.rendement]).toEqual([9_800, -4_800, 6_000]);
  });

  it("l'imputation rationnelle : les charges fixes au coefficient activité réelle ÷ activité normale", () => {
    expect(e.centre.coefficient).toBe(1.04);
    expect(e.centre.fixesImputes).toBe(120_000 * 1.04);
    // Le coût de la suractivité est le boni d'imputation : fixes imputés − fixes réels du budget.
    expect(e.centre.fixesImputes - f.centre.chargesFixes).toBe(-e.centre.activite);
  });
});

describe("les écarts sur chiffre d'affaires et sur marge", () => {
  it("chiffre d'affaires : écart sur prix et écart sur quantités", () => {
    expect(e.ventes.chiffreDAffairesPrevu).toBe(12_000 * 59 + 4_000 * 119);
    expect(e.ventes.chiffreDAffairesReel).toBe(11_000 * 57 + 4_600 * 121);
    expect(e.ventes.prix).toBe((57 - 59) * 11_000 + (121 - 119) * 4_600);
    expect(e.ventes.quantiteSurChiffreDAffaires).toBe((11_000 - 12_000) * 59 + (4_600 - 4_000) * 119);
    expect(e.ventes.prix + e.ventes.quantiteSurChiffreDAffaires).toBe(e.ventes.ecartDeChiffreDAffaires);
    expect(e.ventes.ecartDeChiffreDAffaires).toBe(-400);
  });

  it("marge : volume à la marge préétablie, qui se partage en quantité globale et composition", () => {
    expect(e.ventes.margePrevue).toBe(12_000 * 27 + 4_000 * 44);
    expect(e.ventes.margeMoyennePrevue).toBe(500_000 / 16_000);
    expect(e.ventes.volume).toBe((11_000 - 12_000) * 27 + (4_600 - 4_000) * 44);
    expect(e.ventes.quantiteGlobale).toBe((15_600 - 16_000) * 31.25);
    // La composition prévue, trois quarts de Nomade, appliquée aux ventes réelles.
    expect(e.ventes.auMixPrevu).toEqual({ nomade: 15_600 * 0.75, salon: 15_600 * 0.25 });
    expect(e.ventes.composition).toBe((11_000 - 11_700) * 27 + (4_600 - 3_900) * 44);
    expect(e.ventes.quantiteGlobale + e.ventes.composition).toBe(e.ventes.volume);
    expect([e.ventes.prix, e.ventes.volume, e.ventes.quantiteGlobale, e.ventes.composition]).toEqual([-12_800, -600, -12_500, 11_900]);
  });
});

describe("du résultat prévu au résultat réel", () => {
  it("les deux résultats et leur écart", () => {
    expect(e.resultatPrevu).toBe(1_184_000 - 684_000 - 150_000);
    expect(e.resultatReel).toBe(1_183_600 - 726_700 - 154_000);
    expect(e.ecartDeResultat).toBe(302_900 - 350_000);
  });

  it("le tableau de passage retombe exactement sur l'écart de résultat", () => {
    const somme = e.passage.reduce((t, l) => t + l.effet, 0);
    expect(Math.round(somme * 100) / 100).toBe(e.ecartDeResultat);
    expect(e.passage.map((l) => l.effet)).toEqual([-12_800, -12_500, 11_900, -7_400, -7_500, -8_800, 5_000, -9_800, 4_800, -6_000, -4_000]);
    // Les ventes au coût préétabli, moins les écarts sur coûts, moins la distribution.
    expect(e.ventes.prix + e.ventes.volume - e.ecartGlobalSurCouts - e.distribution).toBe(e.ecartDeResultat);
  });

  it("une fiche faussée change le chiffre attendu (la garde voit le modèle)", () => {
    const faussee: FicheDeLUsine = { ...f, realise: { ...r, matiere: { ...r.matiere, kilos: 18_600 } } };
    const g = controleBudgetaire(faussee);
    expect(g.matiere.quantite).toBe((18_600 - 18_000) * 15);
    expect(g.passage.reduce((t, l) => t + l.effet, 0)).toBeCloseTo(g.ecartDeResultat, 6);
  });
});
