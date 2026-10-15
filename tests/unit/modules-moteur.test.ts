import { describe, expect, it } from "vitest";
import { novaCompany, novaScenario } from "@/config/scenarios/nova";
import { bistrotScenario } from "@/config/scenarios/bistrot";
import { ecommerceScenario } from "@/config/scenarios/ecommerce";
import { conseilScenario } from "@/config/scenarios/conseil";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { applyPeriodicity } from "@/config/scenarios/periodicity";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { DIFFICULTY_PRESETS, presetByLevel } from "@/config/difficulty";
import { champDeModule, arretDeModule, modulesSaisis } from "@/config/modules-saisis";
import { simulateRound } from "@/engine/simulation";
import { criseOfferte, moduleOuvert } from "@/engine/modules/ouverture";
import { contratsDuTour, formationDuTour, MACHINE_ATELIER, PERTE_DE_CRISE } from "@/engine/modules/effets";
import { initMachineFleet } from "@/engine/equipment";
import { bilanDesModules, construireOffreDesModules, refusDesModules } from "@/services/modules-offer";
import { roundDecisionsSchema } from "@/services/decision-schema";
import type { CompanyState, EngineScenarioConfig, RoundDecisions, SimulationInput } from "@/engine/types";

/**
 * LES CORRECTIFS DU MOTEUR (A1 à A5) ET LES SEPT MODULES RENDUS JOUABLES (B1 à B6).
 *
 * Chaque décision est jouée par l'entreprise « a » face à une entreprise « b »
 * qui ne choisit rien, et comparée à la même partie sans la décision : le
 * résultat bouge dans le bon sens et du bon ordre de grandeur, le coût est
 * payé, les plafonds tiennent, l'arrêt retire coût et effet.
 */

const BASE: RoundDecisions = {
  price: 79,
  productionPlan: 5000,
  marketingBudget: 8000,
  qualityBudget: 4000,
  maintenanceBudget: 4000,
};

function jouer(
  decisionsA: RoundDecisions,
  options: {
    etatA?: Partial<CompanyState>;
    tour?: number;
    scenario?: EngineScenarioConfig;
    seed?: number;
    leviers?: SimulationInput["leviers"];
  } = {},
) {
  const a = { ...novaCompany("a", "A", "human"), ...(options.etatA ?? {}) };
  const b = novaCompany("b", "B", "human");
  return simulateRound({
    scenario: options.scenario ?? novaScenario,
    roundIndex: options.tour ?? 1,
    companies: [a, b],
    decisions: { a: decisionsA, b: BASE },
    activeEvents: [],
    seed: options.seed ?? 11,
    ...(options.leviers !== undefined ? { leviers: options.leviers } : {}),
  });
}
const vendus = (r: ReturnType<typeof jouer>["results"][string]) =>
  Object.values(r.market.bySegment).reduce((t, s) => t + s.sold, 0);
const chiffreDuMarche = (r: ReturnType<typeof jouer>["results"][string]) =>
  Object.values(r.market.bySegment).reduce((t, s) => t + s.revenue, 0);
/** La demande que le marché adresse à l'entreprise : ce que l'attraction lui vaut, stock à part. */
const demande = (r: ReturnType<typeof jouer>["results"][string]) =>
  Object.values(r.market.bySegment).reduce((t, s) => t + s.demandForCompany, 0);
const etatDe = (o: ReturnType<typeof jouer>, id = "a") => o.companies.find((c) => c.id === id)!;
const NIVEAU = (n: 1 | 2 | 3 | 4 | 5 | 6) => presetByLevel.get(n)!.decisions;

describe("A1 · la stratégie de prix change le prix FACTURÉ, pas seulement le prix perçu", () => {
  it("une pénétration attire, et coûte sa remise sur chaque unité vendue", () => {
    const sans = jouer(BASE).results.a!;
    const avec = jouer(BASE, { etatA: { activePricingStrategies: ["ps-penetration"] } }).results.a!;
    const penetration = novaScenario.pricingStrategy!.strategies.find((s) => s.id === "ps-penetration")!;
    // Le prix encaissé par unité est le prix décidé × le multiplicateur.
    expect(chiffreDuMarche(avec) / vendus(avec)).toBeCloseTo(BASE.price * penetration.priceMultiplier, 6);
    expect(chiffreDuMarche(sans) / vendus(sans)).toBeCloseTo(BASE.price, 6);
    // Elle attire davantage...
    expect(demande(avec)).toBeGreaterThan(demande(sans));
    // ...et le chiffre d'affaires le dit : le compte de résultat porte le prix facturé.
    expect(avec.incomeStatement.revenue).toBeCloseTo(chiffreDuMarche(avec), 2);
  });

  it("un haut de gamme facture plus cher, sans compter sa marge deux fois", () => {
    const avec = jouer(BASE, { etatA: { activePricingStrategies: ["ps-premium"] } }).results.a!;
    const premium = novaScenario.pricingStrategy!.strategies.find((s) => s.id === "ps-premium")!;
    // Le `marginImpact` du catalogue n'ajoute rien : le prix facturé fait la marge.
    expect(chiffreDuMarche(avec) / vendus(avec)).toBeCloseTo(BASE.price * premium.priceMultiplier, 6);
  });
});

describe("A2 · la crise : sur tout le chiffre d'affaires, seulement si le module est offert, sur son propre flux", () => {
  const GRAINES = Array.from({ length: 40 }, (_, i) => 100 + i);

  it("la règle de niveau est la même pour l'offre et pour le moteur", () => {
    for (const p of DIFFICULTY_PRESETS) {
      const offre = construireOffreDesModules({ scenario: novaScenario, etat: {}, tour: 1, leviers: p.decisions });
      const offerte = offre?.some((m) => m.decision === "activeCrisisPlanIds") ?? false;
      expect(criseOfferte(p.decisions), `niveau ${p.level}`).toBe(offerte);
      expect(moduleOuvert("activeCrisisPlanIds", p.decisions)).toBe(offerte);
    }
    // Sans niveau connu (rejeu, test, calibration), aucune crise n'est tirée.
    expect(criseOfferte(undefined)).toBe(false);
  });

  it("aucune crise sans le module offert, même avec le catalogue dans le scénario", () => {
    for (const seed of GRAINES) {
      expect(jouer(BASE, { seed }).results.a!.crisisEvent, `graine ${seed}`).toBeUndefined();
      expect(jouer(BASE, { seed, leviers: NIVEAU(3) }).results.a!.crisisEvent).toBeUndefined();
    }
  });

  it("au niveau qui l'offre, une crise emporte une part du chiffre d'affaires TOTAL, un plan la réduit", () => {
    let crises = 0;
    for (const seed of GRAINES) {
      const sans = jouer(BASE, { seed }).results.a!;
      const sortie = jouer(BASE, { seed, leviers: NIVEAU(6) });
      const r = sortie.results.a!;
      // Le tirage de crise ne décale aucun autre tirage : le marché est le même.
      expect(r.market).toEqual(sans.market);
      expect(sortie.newEvents).toEqual(jouer(BASE, { seed }).newEvents);
      if (!r.crisisEvent) {
        expect(r.incomeStatement).toEqual(sans.incomeStatement);
        continue;
      }
      crises++;
      expect(r.crisisRevenueLoss).toBeCloseTo(sans.incomeStatement.revenue * PERTE_DE_CRISE, 4);
      expect(r.incomeStatement.revenue).toBeCloseTo(sans.incomeStatement.revenue - r.crisisRevenueLoss!, 4);
      // Avec le plan qui couvre ce type de crise : la perte fond de sa protection.
      const plan = novaScenario.crisisManagement!.plans.find((p) => p.crisisType === r.crisisEvent!.type);
      if (!plan) continue;
      const protege = jouer(BASE, { seed, leviers: NIVEAU(6), etatA: { activeCrisisPlans: [plan.id] } }).results.a!;
      expect(protege.crisisRevenueLoss!).toBeCloseTo(r.crisisRevenueLoss! * (1 - plan.effects.revenueProtection), 4);
      expect(protege.crisisCost).toBe(plan.preparationCostPerRound + plan.activationCost);
    }
    expect(crises).toBeGreaterThan(0);
  });
});

describe("A3 · ce qui tourne s'arrête : plus de coût, plus d'effet, rien de remboursé", () => {
  const arreter = (module: string, id: string): RoundDecisions => ({ ...BASE, stoppedModuleItems: [{ module, id }] });

  it("une stratégie de prix arrêtée ne joue plus dès ce tour et quitte l'état", () => {
    const etatA = { activePricingStrategies: ["ps-premium"] };
    const o = jouer(arreter("activePricingStrategyIds", "ps-premium"), { etatA });
    const r = o.results.a!;
    expect(r.pricingEffects).toBeUndefined();
    expect(chiffreDuMarche(r) / vendus(r)).toBeCloseTo(BASE.price, 6);
    expect(etatDe(o).activePricingStrategies).toBeUndefined();
    expect(r.stoppedModuleItems).toEqual([{ module: "activePricingStrategyIds", id: "ps-premium" }]);
  });

  it("un partenariat arrêté ne paie plus sa redevance et ne rend pas son droit d'entrée", () => {
    const etatA = { activePartnerships: [{ id: "part-distrib", remainingRounds: 3 }] };
    const court = jouer(BASE, { etatA }).results.a!;
    const arrete = jouer(arreter("activatePartnershipIds", "part-distrib"), { etatA }).results.a!;
    expect(court.partnershipCost).toBeGreaterThan(0);
    expect(arrete.partnershipCost).toBeUndefined();
    expect(arrete.partnershipEffects).toBeUndefined();
    expect(arrete.incomeStatement.exceptionalIncome ?? 0).toBe(court.incomeStatement.exceptionalIncome ?? 0);
  });

  it("un marché à l'export fermé ne vend plus et ne coûte plus", () => {
    const etatA = { activeInternationalMarkets: [{ id: "europe", enteredAtRound: 2 }] };
    expect(jouer(BASE, { etatA, tour: 3 }).results.a!.internationalCost).toBeGreaterThan(0);
    const r = jouer(arreter("enteredMarketIds", "europe"), { etatA, tour: 3 }).results.a!;
    expect(r.internationalCost).toBeUndefined();
    expect(r.internationalRevenue).toBeUndefined();
  });

  it("un projet digital arrêté en cours perd ce qu'il a coûté ; un arrêt de ce qui ne tourne pas ne change rien", () => {
    const etatA = { digitalProjectsInProgress: [{ id: "dt-erp", roundsCompleted: 1 }] };
    const o = jouer(arreter("startDigitalProjectIds", "dt-erp"), { etatA, tour: 2 });
    expect(o.results.a!.digitalCost).toBeUndefined();
    expect(etatDe(o).digitalProjectsInProgress).toBeUndefined();
    // Un arrêt sans objet : la partie est celle d'un tour sans arrêt.
    const rien = jouer(arreter("activeRseActionIds", "rse-energie")).results.a!;
    expect(rien.incomeStatement).toEqual(jouer(BASE).results.a!.incomeStatement);
  });

  it("le serveur n'arrête que ce qui tourne, et un arrêt libère sa place", () => {
    const etat = { activePricingStrategies: ["ps-premium", "ps-penetration"] };
    const offre = construireOffreDesModules({ scenario: novaScenario, etat, tour: 2 });
    const prix = offre!.find((m) => m.decision === "activePricingStrategyIds")!;
    expect(prix.plafond).toBe(0);
    // Plus de place... sauf à arrêter l'une des deux.
    expect(refusDesModules({ activePricingStrategyIds: ["ps-segmentation"] }, offre)).toHaveLength(1);
    expect(
      refusDesModules(
        {
          activePricingStrategyIds: ["ps-segmentation"],
          stoppedModuleItems: [{ module: "activePricingStrategyIds", id: "ps-premium" }],
        },
        offre,
      ),
    ).toEqual([]);
    // Arrêter ce qui ne tourne pas, ou ce qui ne s'arrête pas (un contrat) : refparcUse.
    expect(refusDesModules({ stoppedModuleItems: [{ module: "activeRseActionIds", id: "rse-energie" }] }, offre)).toHaveLength(1);
    const avecContrat = construireOffreDesModules({
      scenario: novaScenario,
      etat: { activeSupplierContracts: [{ id: "contrat-matiere", remainingRounds: 2 }] },
      tour: 2,
    });
    expect(
      refusDesModules({ stoppedModuleItems: [{ module: "activeContractIds", id: "contrat-matiere" }] }, avecContrat),
    ).toHaveLength(1);
  });

  it("la case d'arrêt se lit sur le formulaire", () => {
    const f = new FormData();
    f.set(arretDeModule("activePricingStrategyIds", "ps-premium"), "1");
    expect(modulesSaisis(f.entries()).stoppedModuleItems).toEqual([
      { module: "activePricingStrategyIds", id: "ps-premium" },
    ]);
    expect(roundDecisionsSchema.parse({ ...BASE, ...modulesSaisis(f.entries()) }).stoppedModuleItems).toHaveLength(1);
  });
});

describe("A4 · le moteur tient lui-même les tours minimaux", () => {
  it("un marché ne s'ouvre pas avant son tour d'entrée, et ne se paie pas", () => {
    const r = jouer({ ...BASE, enteredMarketIds: ["asie"] }, { tour: 2 });
    expect(r.results.a!.internationalCost).toBeUndefined();
    expect(etatDe(r).activeInternationalMarkets).toBeUndefined();
    const ouvert = jouer({ ...BASE, enteredMarketIds: ["europe"] }, { tour: 2 });
    expect(etatDe(ouvert).activeInternationalMarkets).toEqual([{ id: "europe", enteredAtRound: 2 }]);
  });

  it("une stratégie, un partenariat, une option de financement : pas avant leur tour", () => {
    expect(etatDe(jouer({ ...BASE, activePricingStrategyIds: ["ps-segmentation"] })).activePricingStrategies).toBeUndefined();
    expect(etatDe(jouer({ ...BASE, activatePartnershipIds: ["part-techno"] })).activePartnerships).toBeUndefined();
    const r = jouer({ ...BASE, financingDraws: [{ optionId: "emprunt-equipement", amount: 50000 }] });
    expect(r.results.a!.debt?.financingDrawn).toBeUndefined();
  });
});

describe("A5 · les coûts par tour des modules suivent la durée du tour", () => {
  it("au mois, un coût par tour vaut le tiers ; un coût ponctuel ne bouge pas", () => {
    const mois = applyPeriodicity(novaScenario, "month");
    const marque = (s: EngineScenarioConfig) => s.brandManagement!.actions[0]!;
    expect(marque(mois).costPerRound).toBe(Math.round(marque(novaScenario).costPerRound / 3));
    const part = (s: EngineScenarioConfig) => s.partnerships!.options[0]!;
    expect(part(mois).royaltiesPerRound).toBe(Math.round(part(novaScenario).royaltiesPerRound / 3));
    expect(part(mois).entryFee).toBe(part(novaScenario).entryFee);
    const crise = (s: EngineScenarioConfig) => s.crisisManagement!.plans[0]!;
    expect(crise(mois).preparationCostPerRound).toBe(Math.round(crise(novaScenario).preparationCostPerRound / 3));
    expect(crise(mois).activationCost).toBe(crise(novaScenario).activationCost);
    const formation = (s: EngineScenarioConfig) => s.trainingPrograms!.programs[0]!;
    expect(formation(mois).costPerEmployee).toBe(Math.round(formation(novaScenario).costPerEmployee / 3));
    const marche = (s: EngineScenarioConfig) => s.internationalMarkets!.markets[0]!;
    expect(marche(mois).localAdaptationCost).toBe(Math.round(marche(novaScenario).localAdaptationCost / 3));
    expect(marche(mois).entryInvestment).toBe(marche(novaScenario).entryInvestment);
    // Une option de financement garde sa durée réelle et compose son taux.
    const option = (s: EngineScenarioConfig) => s.financingOptions!.options[0]!;
    expect(option(mois).durationRounds).toBe(option(novaScenario).durationRounds * 3);
    expect(option(mois).interestRatePerRound).toBeCloseTo(Math.pow(1 + option(novaScenario).interestRatePerRound, 1 / 3) - 1, 10);
    // Le volume d'engagement d'un contrat est une production par tour.
    const contrat = (s: EngineScenarioConfig) => s.supplierNegotiation!.contracts[0]!;
    expect(contrat(mois).volumeThreshold).toBe(Math.round(contrat(novaScenario).volumeThreshold / 3));
    // Au trimestre, rien ne change.
    expect(applyPeriodicity(novaScenario, "quarter")).toBe(novaScenario);
  });

  it("les quatre scénarios se chargent à chaque durée de tour (aucune borne du schéma dépassée)", () => {
    for (const s of [novaScenario, ecommerceScenario, bistrotScenario, conseilScenario]) {
      for (const periodicity of ["month", "quarter", "year"] as const) {
        const joue = composerLeScenarioJoue({ scenario: s, seed: 3, level: 6, concurrents: 3, periodicity });
        expect(() => parseScenarioConfig(JSON.parse(JSON.stringify(joue))), `${s.code} ${periodicity}`).not.toThrow();
      }
    }
  });
});

describe("B1 · les actions commerciales agissent enfin", () => {
  it("la décision arrive au moteur : coût payé, attraction en hausse, remise facturée", () => {
    const sans = jouer(BASE).results.a!;
    const o = jouer({ ...BASE, activeCommercialActionIds: ["promo-lancement"] });
    const r = o.results.a!;
    const promo = novaScenario.commercialActions!.actions.find((a) => a.id === "promo-lancement")!;
    expect(r.commercialCost).toBe(promo.costPerRound);
    expect(r.incomeStatement.marketingCost - sans.incomeStatement.marketingCost).toBeCloseTo(promo.costPerRound, 6);
    expect(r.commercialEffects?.demandBonus).toBeCloseTo(promo.effects.demandBonus, 10);
    expect(demande(r)).toBeGreaterThan(demande(sans) * 1.05);
    // La remise : le client paie le prix moins la remise.
    expect(chiffreDuMarche(r) / vendus(r)).toBeCloseTo(BASE.price * (1 + promo.effects.marginImpact), 6);
    // Durée 2 : il reste un tour à courir.
    expect(etatDe(o).activeCommercialActions).toEqual([{ id: "promo-lancement", remainingRounds: 1 }]);
    const t2 = jouer(BASE, { etatA: { activeCommercialActions: [{ id: "promo-lancement", remainingRounds: 1 }] }, tour: 2 });
    expect(t2.results.a!.commercialCost).toBe(promo.costPerRound);
    expect(etatDe(t2).activeCommercialActions).toBeUndefined();
  });

  it("la fidélisation relève la fidélité de la clientèle déjà acquise, et se reconduit", () => {
    const acquis = { lastMarketShare: { etudiants: 0.4, passionnes: 0.4, campustech: 0.4 } };
    const sans = jouer(BASE, { etatA: acquis }).results.a!;
    const o = jouer({ ...BASE, activeCommercialActionIds: ["programme-fidelite"] }, { etatA: acquis });
    expect(demande(o.results.a!)).toBeGreaterThan(demande(sans));
    // Reconduite : l'action repart à son échéance.
    expect(etatDe(o).activeCommercialActions).toEqual([{ id: "programme-fidelite", remainingRounds: 1 }]);
  });

  it("le plafond d'actions menées de front tient", () => {
    const r = jouer({ ...BASE, activeCommercialActionIds: ["promo-lancement", "prospection-b2b", "campagne-digitale"] });
    expect(r.results.a!.commercialCost).toBe(5000 + 4000);
  });
});

describe("B2 · la formation et les politiques RH agissent sur le modèle RH", () => {
  it("la formation : coût par salarié formé, productivité dès ce tour, effectif borné", () => {
    const sans = jouer(BASE).results.a!;
    const o = jouer({ ...BASE, trainingEnrollments: [{ programId: "formation-lean", enrolledCount: 50 }] });
    const r = o.results.a!;
    const lean = novaScenario.trainingPrograms!.programs.find((p) => p.id === "formation-lean")!;
    // On ne forme pas plus de monde qu'il n'y en a : quatre salariés.
    expect(r.trainingCost).toBe(4 * lean.costPerEmployee);
    expect(r.production.laborCapacity / sans.production.laborCapacity).toBeCloseTo(1 + lean.effects.productivityBonus, 6);
    expect(etatDe(o).activeTrainingPrograms).toEqual([
      { programId: "formation-lean", enrolledCount: 4, remainingRounds: lean.durationRounds - 1 },
    ]);
  });

  it("la formation au prorata de l'effectif formé", () => {
    const f = formationDuTour({
      cfg: novaScenario.trainingPrograms,
      enCours: undefined,
      inscriptions: [{ programId: "formation-lean", enrolledCount: 2 }],
      effectif: 4,
    });
    expect(f.effets.productivityBonus).toBeCloseTo(0.06 / 2, 10);
    expect(f.cout).toBe(2 * 800);
  });

  it("une politique RH : coût dès ce tour, effet une fois déployée, sur productivité, heures et embauche", () => {
    const t1 = jouer({ ...BASE, activeHRPolicyIds: ["hr-flex"] });
    const flex = novaScenario.advancedHR!.policies.find((p) => p.id === "hr-flex")!;
    expect(t1.results.a!.hrCost).toBe(flex.costPerRound);
    expect(t1.results.a!.hrEffects).toBeUndefined();
    const embauche = { ...BASE, hr: { hire: 1 } };
    const sans = jouer(embauche, { tour: 2 }).results.a!;
    const t2 = jouer(embauche, { etatA: { activeHRPolicies: [{ id: "hr-flex", roundsActive: 1 }] }, tour: 2 }).results.a!;
    expect(t2.hrEffects?.productivityBonus).toBeCloseTo(flex.effects.productivityBonus, 10);
    expect(t2.production.laborCapacity / sans.production.laborCapacity).toBeCloseTo(
      (1 + flex.effects.productivityBonus) * (1 + flex.effects.absenteeismReduction),
      6,
    );
    expect(sans.hr!.cost - t2.hr!.cost).toBeCloseTo(novaScenario.hr!.hiringCost * flex.effects.recruitmentBonus, 6);
  });

  it("les départs volontaires reculent, jamais en dessous de zéro, et les plafonds cumulés tiennent", () => {
    const sousPaye = { ...BASE, hr: { salaryIndex: 0.9 } };
    expect(jouer(sousPaye).results.a!.hr!.departed).toBe(1);
    const politiques = { activeHRPolicies: [{ id: "hr-bien-etre", roundsActive: 2 }, { id: "hr-flex", roundsActive: 1 }] };
    // 0,95 × (1 − 0,14) = 0,817 : un indice de 0,9 ne fait plus partir personne.
    expect(jouer(sousPaye, { etatA: politiques }).results.a!.hr!.departed).toBe(0);
    // Tout empilé : la productivité gagnée reste sous son plafond.
    const tout = jouer(
      { ...BASE, trainingEnrollments: [{ programId: "formation-lean", enrolledCount: 4 }, { programId: "formation-vente", enrolledCount: 4 }] },
      { etatA: { activeHRPolicies: [{ id: "hr-formation", roundsActive: 2 }, { id: "hr-flex", roundsActive: 1 }] } },
    ).results.a!;
    const sans = jouer(BASE).results.a!;
    expect(tout.production.laborCapacity / sans.production.laborCapacity).toBeLessThanOrEqual(1.3 * 1.3 + 1e-9);
  });

  it("l'arrêt d'une formation retire son coût et son effet", () => {
    const etatA = { activeTrainingPrograms: [{ programId: "formation-lean", enrolledCount: 4, remainingRounds: 2 }] };
    expect(jouer(BASE, { etatA, tour: 2 }).results.a!.trainingCost).toBe(3200);
    const r = jouer({ ...BASE, stoppedModuleItems: [{ module: "trainingEnrollments", id: "formation-lean" }] }, { etatA, tour: 2 });
    expect(r.results.a!.trainingCost).toBeUndefined();
    expect(r.results.a!.production.laborCapacity).toBe(jouer(BASE, { tour: 2 }).results.a!.production.laborCapacity);
  });
});

describe("B3 · les contrats fournisseurs : la remise est réellement déduite", () => {
  it("un contrat matières baisse le coût d'achat, si la production tient le volume promis", () => {
    const contrat = novaScenario.supplierNegotiation!.contracts.find((c) => c.id === "contrat-matiere")!;
    const sans = jouer(BASE).results.a!;
    const r = jouer({ ...BASE, activeContractIds: ["contrat-matiere"] }).results.a!;
    expect(r.breakeven.unitVariableCost).toBeLessThan(sans.breakeven.unitVariableCost);
    expect(r.incomeStatement.variableProductionCost).toBeCloseTo(
      sans.incomeStatement.variableProductionCost - r.supplierNegotiationSaving!,
      4,
    );
    const achatsSans =
      sans.incomeStatement.variableProductionCost - sans.production.produced * novaScenario.product.otherVariableCostPerUnit;
    expect(r.supplierNegotiationSaving! / achatsSans).toBeCloseTo(contrat.discountRate, 6);
    // Sous le volume d'engagement : pas de remise.
    const petit = { ...BASE, productionPlan: contrat.volumeThreshold - 1 };
    expect(jouer({ ...petit, activeContractIds: ["contrat-matiere"] }).results.a!.supplierNegotiationSaving).toBeUndefined();
  });

  it("un contrat énergie porte sur les autres charges variables ; les contrats sécurisent l'approvisionnement", () => {
    const sans = jouer(BASE).results.a!;
    const r = jouer({ ...BASE, activeContractIds: ["contrat-energie"] }).results.a!;
    const autres = sans.production.produced * novaScenario.product.otherVariableCostPerUnit;
    expect(sans.incomeStatement.variableProductionCost - r.incomeStatement.variableProductionCost).toBeCloseTo(autres * 0.05, 4);
    const c = contratsDuTour({ cfg: novaScenario.supplierNegotiation, enCours: undefined, signes: ["contrat-matiere", "contrat-energie"] });
    expect(c.risque).toBeCloseTo(1 - (1 - 0.2) * (1 - 0.1), 10);
  });

  it("un contrat court sa durée, puis s'éteint", () => {
    const o = jouer({ ...BASE, activeContractIds: ["contrat-matiere"] });
    expect(etatDe(o).activeSupplierContracts).toEqual([{ id: "contrat-matiere", remainingRounds: 3 }]);
  });
});

describe("B4 · une intervention de maintenance sur tout l'atelier", () => {
  const ATELIER = (actionCode: string, level: number): RoundDecisions => ({
    ...BASE,
    maintenanceDecisions: [{ machineId: MACHINE_ATELIER, actionCode, level }],
  });

  it("un préventif : coût par équipement, usure en moins sur tout le parc", () => {
    const parcUse = { machineFleet: initMachineFleet(novaCompany("a", "A", "human").fleet!, 2).map((m) => ({ ...m, wear: 0.4 })) };
    const sans = jouer(BASE, { etatA: parcUse, tour: 2 });
    const o = jouer(ATELIER("preventif", 1), { etatA: parcUse, tour: 2 });
    const r = o.results.a!;
    const parc = etatDe(sans).machineFleet!;
    expect(r.maintenanceCost).toEqual({ laborCost: parc.length * 500, downtimeCost: parc.length * 200, actionsCount: parc.length });
    const usure = (e: CompanyState) => e.machineFleet!.reduce((t, m) => t + m.wear, 0);
    expect(usure(etatDe(o))).toBeLessThan(usure(etatDe(sans)));
    expect(r.incomeStatement.fixedCosts - sans.results.a!.incomeStatement.fixedCosts).toBeCloseTo(parc.length * 500, 6);
  });

  it("un curatif remet en service les équipements en panne, dès ce tour", () => {
    const parc = initMachineFleet(novaCompany("a", "A", "human").fleet!, 2).map((m, i) =>
      i < 2 ? { ...m, isOperational: false } : m,
    );
    const etatA = { machineFleet: parc };
    const sans = jouer(BASE, { etatA, tour: 2 }).results.a!;
    const r = jouer(ATELIER("curatif", 3), { etatA, tour: 2 }).results.a!;
    expect(r.maintenanceEffects?.machinesRestored).toBe(2);
    expect(r.production.machineCapacity).toBeGreaterThan(sans.production.machineCapacity);
    expect(r.maintenanceCost?.laborCost).toBe(2 * 5000);
  });

  it("le serveur refuse deux niveaux d'un même type, et l'écran propose l'atelier", () => {
    const offre = construireOffreDesModules({ scenario: novaScenario, etat: novaCompany("a", "A", "human"), tour: 1 });
    const m = offre!.find((x) => x.decision === "maintenanceDecisions")!;
    expect(m.elements.map((e) => e.id)).toContain("preventif.2");
    // Aucun équipement en panne : pas de curatif à proposer.
    expect(m.elements.some((e) => e.id.startsWith("curatif"))).toBe(false);
    const deux = {
      maintenanceDecisions: [
        { machineId: MACHINE_ATELIER, actionCode: "preventif", level: 1 },
        { machineId: MACHINE_ATELIER, actionCode: "preventif", level: 2 },
      ],
    };
    expect(refusDesModules(deux, offre).length).toBeGreaterThan(0);
    const f = new FormData();
    f.set(champDeModule("maintenanceDecisions", "preventif.2"), "preventif.2");
    expect(modulesSaisis(f.entries()).maintenanceDecisions).toEqual([
      { machineId: MACHINE_ATELIER, actionCode: "preventif", level: 2 },
    ]);
  });
});

describe("B5 · les programmes R&D : des tours de travaux, puis un acquis", () => {
  it("un programme se paie sur la ligne R&D, s'achève, puis abaisse le coût et relève l'image", () => {
    const emballage = novaScenario.rdActions!.actions.find((a) => a.id === "rd-emballage")!;
    const t1 = jouer({ ...BASE, startedRdActionIds: ["rd-emballage"] });
    expect(t1.results.a!.rdActionsCost).toBe(emballage.costPerRound);
    expect(t1.results.a!.incomeStatement.rdCost).toBe(emballage.costPerRound);
    expect(etatDe(t1).rdActionsInProgress).toEqual([{ id: "rd-emballage", roundsCompleted: 1 }]);
    const t2 = jouer(BASE, { etatA: { rdActionsInProgress: [{ id: "rd-emballage", roundsCompleted: 1 }] }, tour: 2 });
    expect(t2.results.a!.rdActionsCost).toBe(emballage.costPerRound);
    expect(etatDe(t2).completedRdActions).toEqual(["rd-emballage"]);
    // Tour suivant : achevé, il agit.
    const sans = jouer(BASE, { tour: 3 }).results.a!;
    const r = jouer(BASE, { etatA: { completedRdActions: ["rd-emballage"] }, tour: 3 }).results.a!;
    expect(r.rdActionsCost).toBeUndefined();
    expect(r.breakeven.unitVariableCost / sans.breakeven.unitVariableCost).toBeCloseTo(1 - emballage.effects.costReduction, 6);
    expect(demande(r)).toBeGreaterThan(demande(sans));
  });

  it("le plafond de programmes simultanés tient, et un programme arrêté ne coûte plus", () => {
    const tous = jouer({ ...BASE, startedRdActionIds: ["rd-materiaux", "rd-process", "rd-emballage"] });
    expect(etatDe(tous).rdActionsInProgress).toHaveLength(2);
    const etatA = { rdActionsInProgress: [{ id: "rd-process", roundsCompleted: 1 }] };
    const r = jouer({ ...BASE, stoppedModuleItems: [{ module: "startedRdActionIds", id: "rd-process" }] }, { etatA, tour: 2 });
    expect(r.results.a!.rdActionsCost).toBeUndefined();
    expect(etatDe(r).rdActionsInProgress).toBeUndefined();
  });
});

describe("B6 · les options de financement passent par le tableau d'emprunts", () => {
  it("un tirage entre en caisse, devient une ligne d'emprunt à son taux, et se rembourse par échéances", () => {
    const option = novaScenario.financingOptions!.options.find((o) => o.id === "credit-court")!;
    const sans = jouer(BASE);
    const o = jouer({ ...BASE, financingDraws: [{ optionId: "credit-court", amount: 100000 }] });
    const r = o.results.a!;
    expect(r.debt?.financingDrawn).toEqual([{ optionId: "credit-court", amount: 100000 }]);
    expect(r.balanceSheet.financialDebt - sans.results.a!.balanceSheet.financialDebt).toBeCloseTo(100000, 6);
    const ligne = etatDe(o).loans!.find((l) => l.optionId === "credit-court")!;
    expect(ligne).toEqual({ remaining: 100000, perRound: 100000 / option.durationRounds, ratePerRound: option.interestRatePerRound, optionId: "credit-court" });
    // Tour suivant : ses intérêts à son taux, son échéance obligatoire.
    const t2 = jouer(BASE, { etatA: etatDe(o), tour: 2 });
    const t2sans = jouer(BASE, { etatA: etatDe(sans), tour: 2 });
    expect(t2.results.a!.debt?.financingInterest).toBeCloseTo(100000 * option.interestRatePerRound, 6);
    expect(t2.results.a!.debt!.mandatoryRepayment - t2sans.results.a!.debt!.mandatoryRepayment).toBeCloseTo(
      100000 / option.durationRounds,
      6,
    );
    const interetOrdinaire = (o2: typeof t2) => o2.results.a!.incomeStatement.interest;
    expect(interetOrdinaire(t2) - interetOrdinaire(t2sans)).toBeCloseTo(100000 * option.interestRatePerRound, 0);
  });

  it("l'enveloppe de l'option et le plafond de la banque bornent le tirage", () => {
    const r = jouer({ ...BASE, financingDraws: [{ optionId: "credit-court", amount: 400000 }] }).results.a!;
    const option = novaScenario.financingOptions!.options.find((o) => o.id === "credit-court")!;
    expect(r.debt!.financingDrawn![0]!.amount).toBe(option.maxAmount);
    // 2 × 150 000 de capitaux propres − 80 000 de dette : 220 000 au plus, emprunt ordinaire compris.
    const r2 = jouer({ ...BASE, finance: { newLoan: 200000 }, financingDraws: [{ optionId: "credit-court", amount: 150000 }] }).results.a!;
    expect(r2.debt!.financingDrawn![0]!.amount).toBeCloseTo(20000, 6);
  });

  it("le serveur juge le montant contre l'enveloppe restante", () => {
    const etat = { ...novaCompany("a", "A", "human"), loans: [{ remaining: 120000, perRound: 30000, ratePerRound: 0.015, optionId: "credit-court" }] };
    const offre = construireOffreDesModules({ scenario: novaScenario, etat, tour: 2 });
    const f = offre!.find((m) => m.decision === "financingDraws")!;
    expect(f.elements.find((e) => e.id === "credit-court")!.saisie!.max).toBe(30000);
    expect(refusDesModules({ financingDraws: [{ optionId: "credit-court", amount: 30001 }] }, offre)).toHaveLength(1);
    expect(refusDesModules({ financingDraws: [{ optionId: "credit-court", amount: 30000 }] }, offre)).toEqual([]);
    expect(f.enCours).toEqual([{ libelle: "Crédit court terme", etat: expect.stringContaining("encours") }]);
  });
});

describe("le bilan du tour nomme les sept modules, et ce qui a été arrêté", () => {
  it("formation, actions commerciales et arrêt d'une stratégie de prix", () => {
    const decisions: RoundDecisions = {
      ...BASE,
      trainingEnrollments: [{ programId: "formation-lean", enrolledCount: 4 }],
      activeCommercialActionIds: ["promo-lancement"],
      stoppedModuleItems: [{ module: "activePricingStrategyIds", id: "ps-premium" }],
    };
    const r = jouer(decisions, { etatA: { activePricingStrategies: ["ps-premium"] } }).results.a!;
    const bilan = bilanDesModules(r, decisions, novaScenario)!;
    expect(bilan.lignes.find((l) => l.titre === "Formation")!.engage).toEqual([
      "Formation Lean Manufacturing · 4 salariés",
    ]);
    expect(bilan.lignes.find((l) => l.titre === "Actions commerciales")!.cout).toBe(5000);
    expect(bilan.lignes.find((l) => l.titre === "Stratégie de prix")!.arrete).toEqual(["Positionnement haut de gamme"]);
  });
});
