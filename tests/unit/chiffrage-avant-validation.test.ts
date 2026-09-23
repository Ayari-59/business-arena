import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  coutDeLAffacturage,
  coutDeLEscompte,
  echeancierEmprunt,
  totalDesEtudes,
} from "@/config/cout-du-financement";

/**
 * LE CHIFFRAGE AVANT LA VALIDATION.
 *
 * L'écran annonçait un taux et laissait l'élève saisir un montant : il ne
 * rencontrait jamais le chiffre qui l'intéresse, ce que sa décision allait
 * coûter. Ces gardes tiennent les trois exigences — les nombres viennent du
 * moteur, le taux vient du scénario, et rien ne s'affiche à vide.
 *
 * L'ALIGNEMENT SUR LE MOTEUR est vérifié ailleurs, sur de vraies simulations
 * (tests/engine/chiffrage-du-financement.test.ts). Ici on garde le branchement.
 */

const lire = (chemin: string) => readFileSync(chemin, "utf8");

describe("le calcul", () => {
  it("l'échéance amortit le capital à parts égales", () => {
    const e = echeancierEmprunt({
      montant: 80000,
      dureeEnTours: 8,
      tauxAnnuel: 0.05,
      joursDuTour: 90,
    });
    expect(e.echeanceParTour).toBe(10000);
    // Dette décroissante 80 000 → 10 000 sur huit tours à 5 %/an, tours de 90 jours.
    expect(e.interets).toBeCloseTo(4500, 6);
    expect(e.totalARembourser).toBeCloseTo(84500, 6);
  });

  it("la durée du tour change les intérêts, pas l'échéance", () => {
    const commun = { montant: 60000, dureeEnTours: 6, tauxAnnuel: 0.05 };
    const trimestre = echeancierEmprunt({ ...commun, joursDuTour: 90 });
    const annee = echeancierEmprunt({ ...commun, joursDuTour: 360 });
    expect(annee.echeanceParTour).toBe(trimestre.echeanceParTour);
    // Un tour de douze mois porte quatre fois les intérêts d'un trimestre.
    expect(annee.interets).toBeCloseTo(trimestre.interets * 4, 6);
  });

  it("l'escompte prélève au prorata du tour, l'affacturage non", () => {
    const escompte = coutDeLEscompte({ montant: 50000, tauxAnnuel: 0.06, joursDuTour: 90 });
    expect(escompte.cout).toBeCloseTo(750, 6);
    expect(escompte.net).toBeCloseTo(49250, 6);
    // La commission d'affacturage ne dépend pas de la durée du tour.
    const affacturage = coutDeLAffacturage({ montant: 50000, commission: 0.025 });
    expect(affacturage.cout).toBeCloseTo(1250, 6);
    expect(affacturage.net).toBeCloseTo(48750, 6);
  });

  it("un montant négatif ne rapporte rien", () => {
    expect(coutDeLEscompte({ montant: -1000, tauxAnnuel: 0.06, joursDuTour: 90 }).cout).toBe(0);
    expect(totalDesEtudes([1500, -800])).toBe(1500);
  });
});

describe("le plafond", () => {
  it("le chiffrage porte sur le montant accordé, pas sur celui demandé", () => {
    const e = echeancierEmprunt({
      montant: 200000,
      dureeEnTours: 4,
      tauxAnnuel: 0.05,
      joursDuTour: 90,
      plafond: 80000,
    });
    expect(e.plafonne).toBe(true);
    expect(e.montantAccorde).toBe(80000);
    expect(e.echeanceParTour).toBe(20000);
    // Les intérêts aussi : ceux des 200 000 demandés n'existeront jamais.
    expect(e.interets).toBeCloseTo(2500, 6);
  });

  it("sans plafond déclaré, la demande passe entière", () => {
    const e = echeancierEmprunt({
      montant: 200000,
      dureeEnTours: 4,
      tauxAnnuel: 0.05,
      joursDuTour: 90,
    });
    expect(e.plafonne).toBe(false);
    expect(e.montantAccorde).toBe(200000);
  });

  it("un plafond épuisé ne prête plus rien", () => {
    const e = echeancierEmprunt({
      montant: 50000,
      dureeEnTours: 4,
      tauxAnnuel: 0.05,
      joursDuTour: 90,
      plafond: 0,
    });
    expect(e.montantAccorde).toBe(0);
    expect(e.totalARembourser).toBe(0);
    expect(e.plafonne).toBe(true);
  });
});

describe("le branchement à l'écran", () => {
  const formulaire = lire("src/components/decision-form.tsx");

  it("le formulaire chiffre emprunt, escompte, affacturage et études", () => {
    for (const appel of [
      "echeancierEmprunt(",
      "coutDeLEscompte(",
      "coutDeLAffacturage(",
      "totalDesEtudes(",
    ]) {
      expect(formulaire, appel).toContain(appel);
    }
    // Un encadré de zéros à côté d'un champ vide est un meuble : rien ne
    // s'affiche tant qu'aucun montant n'est saisi.
    expect(formulaire).toContain("renfort.emprunt > 0");
    expect(formulaire).toContain("mobilisation.escompte > 0");
    expect(formulaire).toContain("mobilisation.affacturage > 0");
  });

  it("le plafond d'emprunt est opposé au champ ET au chiffrage", () => {
    // Le moteur rabote en silence : l'écran doit refuser la saisie au-delà, et
    // chiffrer ce qui sera réellement prêté.
    expect(formulaire).toContain("max={loanCapacity ? Math.floor(loanCapacity.remaining) : undefined}");
    expect(formulaire).toContain("plafond: loanCapacity?.remaining ?? null");
    expect(formulaire).toContain("Au-delà du plafond");
    // L'escompte, lui, ne peut PAS annoncer de chiffre : son plafond se calcule
    // sur les ventes du tour, que l'élève est en train de décider.
    expect(formulaire).toContain("du poste clients du tour");
  });

  it("le taux affiché vient du scénario, et non d'une constante", () => {
    // Il était écrit « 5 %/an » en dur : un scénario qui prête à 6 % annonçait 5 %.
    expect(formulaire, "taux codé en dur").not.toMatch(/"5 %\/an/);
    expect(formulaire).toContain("financeOffer.loanAnnualRate");
    // Et la vue le sert depuis l'instantané du scénario.
    const vue = lire("src/services/game-view.service.ts");
    expect(vue).toContain("loanAnnualRate: snapshot.finance.loanAnnualRate");
    expect(vue).toContain("roundDays: snapshot.roundDays");
    expect(lire("src/app/arena/[gameId]/page.tsx")).toContain("financeOffer={view.financeOffer}");
  });
});
