import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { presetByLevel } from "@/config/difficulty";
import { botDecisions, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { CHAMPS_DES_MODULES_RETIRES, sansLesModulesRetires } from "@/engine/modules/retires";
import { construireOffreDesModules } from "@/services/modules-offer";
import { roundDecisionsSchema } from "@/services/decision-schema";
import type { CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";

/**
 * UNE PARTIE CRÉÉE AVANT LE RETRAIT DE SEIZE MODULES SE JOUE ENCORE.
 *
 * La fixture est une vraie partie NOVA en gamme, niveau 6, jouée trois tours
 * sur le moteur d'AVANT le retrait (commit 115bed7b) : son snapshot porte les
 * dix-huit catalogues, et l'équipe « e0 » a engagé un élément de chacun
 * (stratégie de prix, marché à l'export, contrat, capacité, partenariat, plan
 * de crise, tirage sur une option de financement…). Elle ne se régénère pas.
 *
 * Ce qui est gardé : le snapshot se charge ; ce que l'état porte des modules
 * retirés ne coûte ni ne fait plus rien, et ne passe pas au tour suivant ; la
 * ligne d'emprunt tirée sur une option de financement se rembourse à SON taux.
 */
const PARTIE = JSON.parse(
  readFileSync(new URL("../fixtures/partie-avant-retrait-des-modules.json", import.meta.url), "utf8"),
) as {
  seed: number;
  prochainTour: number;
  scenario: Record<string, unknown>;
  companies: CompanyState[];
  events: EventInstance[];
};

const RETIRES = [
  "healthSafetyActions",
  "trainingPrograms",
  "advancedHR",
  "maintenanceActions",
  "supplierNegotiation",
  "capacityExpansion",
  "partnerships",
  "crisisManagement",
  "financingOptions",
  "rseProgram",
  "internationalMarkets",
  "productInnovation",
  "pricingStrategy",
  "commercialActions",
  "digitalTransformation",
  "brandManagement",
];

const leviers = presetByLevel.get(6)!.decisions;

function jouerLeTourSuivant(
  scenario: EngineScenarioConfig,
  companies: CompanyState[],
  extraE0: object | ((d: RoundDecisions) => RoundDecisions) = {},
) {
  const decisions: Record<string, RoundDecisions> = {};
  for (const etat of structuredClone(companies)) {
    const profil = (etat.id === "e0" ? "balanced" : (etat.botProfile ?? "balanced")) as BotProfile;
    const d = botDecisions(profil, {
      scenario,
      state: etat,
      roundIndex: PARTIE.prochainTour,
      leviers,
    });
    decisions[etat.id] =
      etat.id !== "e0" ? d : typeof extraE0 === "function" ? extraE0(d) : ({ ...d, ...extraE0 } as RoundDecisions);
  }
  // Le moteur range l'état suivant en partie sur l'état reçu : chaque tour
  // joué part d'une copie, pour que deux tours comparés partent du même état.
  return simulateRound({
    scenario,
    roundIndex: PARTIE.prochainTour,
    companies: structuredClone(companies),
    decisions,
    activeEvents: PARTIE.events,
    seed: PARTIE.seed,
  });
}

describe("une partie créée avant le retrait des modules", () => {
  it("la fixture porte bien les anciens catalogues et des éléments engagés", () => {
    for (const bloc of RETIRES) expect(PARTIE.scenario[bloc], bloc).toBeDefined();
    const e0 = PARTIE.companies.find((c) => c.id === "e0")! as unknown as Record<string, unknown>;
    for (const champ of ["activePricingStrategies", "activeInternationalMarkets", "activeCapacityOptions", "activeCrisisPlans"])
      expect(e0[champ], champ).toBeDefined();
    expect(PARTIE.companies.find((c) => c.id === "e0")!.loans!.some((l) => l.ratePerRound !== undefined)).toBe(true);
  });

  it("son snapshot se charge : les blocs retirés sont écartés, les deux catalogues gardés restent", () => {
    const relu = parseScenarioConfig(PARTIE.scenario) as unknown as Record<string, unknown>;
    for (const bloc of RETIRES) expect(relu[bloc], bloc).toBeUndefined();
    expect(relu.qualityActions).toBeDefined();
    expect(relu.rdActions).toBeDefined();
  });

  it("l'offre ne propose plus que les deux modules gardés, sur l'état engagé", () => {
    const scenario = parseScenarioConfig(PARTIE.scenario);
    const offre = construireOffreDesModules({
      scenario,
      etat: PARTIE.companies.find((c) => c.id === "e0"),
      tour: PARTIE.prochainTour,
      leviers,
    });
    expect(offre!.map((m) => m.decision)).toEqual(["qualityActions", "startedRdActionIds"]);
  });

  it("ce que l'état porte des modules retirés ne coûte ni ne fait plus rien, et ne passe pas au tour suivant", () => {
    const scenario = parseScenarioConfig(PARTIE.scenario);
    // Une décision d'avant, rejouée telle quelle, coche encore des modules retirés.
    const anciennes = {
      activePricingStrategyIds: ["ps-penetration"],
      enteredMarketIds: ["asie"],
      activeCrisisPlanIds: ["cm-qualite"],
      financingDraws: [{ optionId: "emprunt-equipement", amount: 50000 }],
      stoppedModuleItems: [{ module: "activePricingStrategyIds", id: "ps-premium" }],
    };
    const avec = jouerLeTourSuivant(scenario, PARTIE.companies, anciennes);
    const propres = PARTIE.companies.map(sansLesModulesRetires);
    const sans = jouerLeTourSuivant(scenario, propres);
    for (const c of PARTIE.companies) {
      const a = avec.results[c.id]!;
      const s = sans.results[c.id]!;
      expect(a.incomeStatement, c.id).toEqual(s.incomeStatement);
      expect(a.balanceSheet, c.id).toEqual(s.balanceSheet);
      expect(a.market.totalShare, c.id).toEqual(s.market.totalShare);
    }
    for (const etat of avec.companies) {
      const brut = etat as unknown as Record<string, unknown>;
      for (const champ of CHAMPS_DES_MODULES_RETIRES) expect(brut[champ], `${etat.id}.${champ}`).toBeUndefined();
    }
  });

  it("la ligne tirée sur une option de financement se rembourse et porte intérêt à son taux", () => {
    const scenario = parseScenarioConfig(PARTIE.scenario);
    const e0 = PARTIE.companies.find((c) => c.id === "e0")!;
    const ligne = e0.loans!.find((l) => l.ratePerRound !== undefined)!;
    const o = jouerLeTourSuivant(scenario, PARTIE.companies);
    const r = o.results.e0!;
    expect(r.debt?.financingInterest).toBeCloseTo(ligne.remaining * ligne.ratePerRound! * 1, 0);
    const apres = o.companies.find((c) => c.id === "e0")!.loans!.find((l) => l.optionId === ligne.optionId);
    const attendu = ligne.remaining - Math.min(ligne.perRound, ligne.remaining);
    if (attendu > 0.005) expect(apres).toEqual({ ...ligne, remaining: attendu });
    else expect(apres).toBeUndefined();
  });
});

/**
 * LA GRILLE R&D ET LES CATÉGORIES D'EMPRUNT, RETIRÉES APRÈS LES SEIZE MODULES.
 *
 * Aucun écran ni aucun bot ne les a jamais proposées : `rdGrid` (décision
 * `rdGridStart`, état `rdGridActions`) et `finance.loanCategories` (décisions
 * `finance.machineLoan` et `finance.installationLoan`). La même fixture porte
 * les deux blocs dans son snapshot. Ce qui est gardé : le snapshot se charge,
 * et une décision ou un état d'avant qui les porterait ne change rien.
 */
describe("une partie créée avant le retrait de la grille R&D et des catégories d'emprunt", () => {
  const achat = { investment: { equipmentBuy: [{ typeCode: "semi_auto", quantity: 1 }] } };
  // Le plan de trésorerie déposé levait l'ancien verrou des catégories : sans
  // lui, l'emprunt de catégorie était refusé d'office et le test ne prouvait rien.
  const plan = { forecast: { expectedCash: 0 } };

  it("la fixture porte la grille et les catégories, et son snapshot se charge sans elles", () => {
    expect(PARTIE.scenario.rdGrid).toBeDefined();
    expect((PARTIE.scenario.finance as Record<string, unknown>).loanCategories).toBeDefined();
    const relu = parseScenarioConfig(PARTIE.scenario) as unknown as Record<string, unknown>;
    expect(relu.rdGrid).toBeUndefined();
    expect((relu.finance as Record<string, unknown>).loanCategories).toBeUndefined();
  });

  it("le schéma des décisions écarte rdGridStart, machineLoan et installationLoan sans erreur", () => {
    const lu = roundDecisionsSchema.parse({
      price: 80,
      productionPlan: 1000,
      marketingBudget: 0,
      qualityBudget: 0,
      maintenanceBudget: 0,
      rdGridStart: [{ themeCode: "matiere", level: 1 }],
      finance: { newLoan: 1000, machineLoan: 24000, installationLoan: 5000 },
    }) as unknown as Record<string, unknown>;
    expect(lu.rdGridStart).toBeUndefined();
    expect(lu.finance).toEqual({ newLoan: 1000 });
  });

  it("une décision et un état d'avant qui les portent ne changent rien au tour", () => {
    const scenario = parseScenarioConfig(PARTIE.scenario);
    const anciennes = (d: RoundDecisions) =>
      ({
        ...d,
        ...achat,
        ...plan,
        rdGridStart: [
          { themeCode: "matiere", level: 1 },
          { themeCode: "emballage", level: 1 },
        ],
        finance: { ...(d.finance ?? {}), machineLoan: 24000, installationLoan: 5000 },
      }) as RoundDecisions;
    const propres = (d: RoundDecisions) => ({ ...d, ...achat, ...plan }) as RoundDecisions;
    // Un état d'avant où une action de la grille serait achevée.
    const etats = PARTIE.companies.map((c) =>
      c.id === "e0"
        ? ({ ...c, rdGridActions: [{ themeCode: "process", level: 1, remainingRounds: 0, startedRound: 1 }] } as CompanyState)
        : c,
    );
    const avec = jouerLeTourSuivant(scenario, etats, anciennes);
    const sans = jouerLeTourSuivant(scenario, PARTIE.companies, propres);
    for (const c of PARTIE.companies) {
      const a = avec.results[c.id]!;
      const s = sans.results[c.id]!;
      expect(a.incomeStatement, c.id).toEqual(s.incomeStatement);
      expect(a.balanceSheet, c.id).toEqual(s.balanceSheet);
      expect(a.debt, c.id).toEqual(s.debt);
      expect(a.market.totalShare, c.id).toEqual(s.market.totalShare);
    }
    for (const etat of avec.companies) {
      const brut = etat as unknown as Record<string, unknown>;
      expect(brut.rdGridActions, `${etat.id}.rdGridActions`).toBeUndefined();
      expect(etat.loans, `${etat.id}.loans`).toEqual(sans.companies.find((c) => c.id === etat.id)!.loans);
    }
  });
});
