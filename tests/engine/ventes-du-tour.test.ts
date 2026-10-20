import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { neutralDecisions, ventesDuTour } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { difficulteDeLaGraine } from "@/pedagogy/examen/lot";
import type { CompanyState } from "@/engine/types";

/**
 * LES VENTES D'UN TOUR, UN SEUL CALCUL.
 *
 * En abonnement, les adhérents conservés sont des ventes du tour. Quatre
 * appelants les ajoutaient chacun à la main (la clôture, l'étalon de
 * l'examen, le rejeu du mérite, la boucle de partie), et le banc de l'audit,
 * qui recopiait le calcul, les avait oubliés : la gestion neutre de la salle
 * de sport y tombait défaillante au quatrième tour dans toutes les graines,
 * alors qu'elle finit largement bénéficiaire en partie réelle. Une seule
 * fonction du moteur porte désormais la convention (`ventesDuTour`).
 *
 * Ce que ce fichier garde : la fonction compte les adhérents conservés, la
 * gestion neutre de l'examen qui la lit ne fait pas faillite à la salle de
 * sport, et les quatre appelants passent par elle.
 */

describe("ventesDuTour", () => {
  it("compte les adhérents conservés avec les ventes du marché", () => {
    const def = scenarioByCode("fitness");
    const scenario = composerLeScenarioJoue({
      scenario: def.scenario,
      seed: 4242,
      variableWorld: true,
      level: 2,
      concurrents: 1,
      periodicity: "quarter",
    });
    let etat: CompanyState = applyPeriodicityToCompany(def.company("a", def.playerTeamName, "human"), "quarter", {
      abonnement: true,
    });
    const tour = (roundIndex: number) => {
      const sortie = simulateRound({
        scenario,
        roundIndex,
        companies: [etat],
        decisions: { a: neutralDecisions({ scenario, state: etat, roundIndex }) },
        activeEvents: [],
        seed: 4242,
      });
      etat = sortie.companies[0]!;
      return sortie.results["a"]!;
    };
    tour(1);
    const r = tour(2);
    const marche = Object.values(r.market.bySegment).reduce((s, d) => s + d.sold, 0);
    const conserves = r.subscription?.retained ?? 0;
    // Le cas mord : il y a des adhérents conservés à compter.
    expect(conserves).toBeGreaterThan(0);
    expect(ventesDuTour(r.market.bySegment, r.subscription)).toBe(marche + conserves);
    // Hors abonnement, les seules ventes du marché.
    expect(ventesDuTour(r.market.bySegment)).toBe(marche);
  });

  it("la gestion neutre de l'examen, qui la lit, ne fait pas faillite à la salle de sport", () => {
    const reglages = {
      definition: scenarioByCode("fitness"),
      niveau: 2,
      tours: 6,
      bots: 2,
      periodicite: "quarter" as const,
    };
    for (const graine of [8_919, 20_260_101]) {
      expect(difficulteDeLaGraine(reglages, graine).resultat).toBeGreaterThan(0);
    }
  });

  it("les appelants passent par elle, sans recompter les adhérents à la main", () => {
    for (const fichier of [
      "src/services/round-resolution.service.ts",
      "src/pedagogy/examen/lot.ts",
      "src/pedagogy/merite/rejeu.ts",
      "src/engine/simulation/runGame.ts",
    ]) {
      const source = readFileSync(fichier, "utf8");
      expect(source, fichier).toContain("ventesDuTour(");
      expect(source, fichier).not.toMatch(/\.retained\b/);
    }
  });
});
