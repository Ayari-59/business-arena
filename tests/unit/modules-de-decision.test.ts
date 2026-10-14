import { describe, expect, it } from "vitest";
import { roundDecisionsSchema } from "@/services/decision-schema";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { novaCompany, novaScenario } from "@/config/scenarios/nova";
import { ecommerceScenario } from "@/config/scenarios/ecommerce";
import { bistrotScenario } from "@/config/scenarios/bistrot";
import { conseilScenario } from "@/config/scenarios/conseil";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { presetByLevel } from "@/config/difficulty";
import { decisionsSaisies } from "@/config/decisions-saisies";
import { champDeModule, modulesSaisis } from "@/config/modules-saisis";
import { carryOverDecisions } from "@/services/decision.service";
import {
  bilanDesModules,
  construireOffreDesModules,
  refusDesModules,
  type OffreDesModules,
} from "@/services/modules-offer";
import { simulateRound } from "@/engine/simulation";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * LES MODULES DU SCÉNARIO, DE LA FEUILLE AU MOTEUR.
 *
 * Six vagues avaient ajouté des catalogues optionnels au moteur sans qu'aucun
 * joueur puisse les choisir. Chaque maillon de la chaîne est gardé ici : le
 * formulaire qui les lit, le schéma qui les laisse passer (un `z.object`
 * supprime en silence ce qu'il ne connaît pas), le snapshot qui les garde,
 * l'offre qui ne propose que ce qui est ouvert, le serveur qui refuse le reste,
 * et le moteur qui les compte.
 */

const BASE: RoundDecisions = {
  price: 79,
  productionPlan: 5000,
  marketingBudget: 8000,
  qualityBudget: 4000,
  maintenanceBudget: 4000,
};

const MODULES: Partial<RoundDecisions> = {
  qualityActions: [{ actionCode: "amelioration_composants", level: 1 }],
  hsActions: [{ actionCode: "evacuation" }],
  trainingEnrollments: [{ programId: "formation-lean", enrolledCount: 3 }],
  activeCommercialActionIds: ["promo-lancement"],
  activeContractIds: ["contrat-matiere"],
  activeCapacityOptionIds: ["equipeNuit"],
  enteredMarketIds: ["europe"],
  startedInnovationIds: ["gamme-premium"],
  activeRseActionIds: ["rse-energie"],
  activePricingStrategyIds: ["ps-premium"],
  activeHRPolicyIds: ["hr-flex"],
  activeCrisisPlanIds: ["cm-cyber"],
  activatePartnershipIds: ["part-distrib"],
  startDigitalProjectIds: ["dt-crm"],
  activeBrandActionIds: ["bm-campagne"],
};

describe("(a) le schéma des décisions garde les choix de module", () => {
  it("chaque champ de module passe tel quel", () => {
    const lu = roundDecisionsSchema.parse({ ...BASE, ...MODULES });
    for (const [cle, valeur] of Object.entries(MODULES)) {
      expect(lu[cle as keyof typeof lu], cle).toEqual(valeur);
    }
  });

  it("une liste démesurée est refusée", () => {
    const trop = Array.from({ length: 21 }, (_, i) => `x${i}`);
    expect(roundDecisionsSchema.safeParse({ ...BASE, activePricingStrategyIds: trop }).success).toBe(false);
  });

  it("sans module, rien n'est ajouté", () => {
    const lu = roundDecisionsSchema.parse(BASE);
    expect(Object.keys(lu).sort()).toEqual(Object.keys(BASE).sort());
  });
});

describe("(b) le snapshot du scénario garde ses catalogues", () => {
  /** Les clés de chaque élément de catalogue, telles que les types moteur les déclarent. */
  const CLES: Record<string, { liste: string; cles: string[] }> = {
    qualityActions: { liste: "actions", cles: ["code", "label", "levels"] },
    healthSafetyActions: { liste: "actions", cles: ["code", "label", "laborCost", "effects"] },
    trainingPrograms: {
      liste: "programs",
      cles: ["id", "label", "domaine", "durationRounds", "costPerEmployee", "maxEmployeesPerRound", "effects"],
    },
    commercialActions: {
      liste: "actions",
      cles: ["id", "label", "type", "isRecurring", "durationRounds", "costPerRound", "effects"],
    },
    supplierNegotiation: {
      liste: "contracts",
      cles: ["id", "label", "supplierType", "volumeThreshold", "discountRate", "contractDurationRounds", "supplyRiskReduction"],
    },
    capacityExpansion: {
      liste: "options",
      cles: ["id", "label", "type", "capacityBonus", "costPerRound", "setupCost", "minProductionLevel", "maxRounds"],
    },
    internationalMarkets: {
      liste: "markets",
      cles: ["id", "label", "region", "demandMultiplier", "baseEntryRound", "entryInvestment", "exchangeRateVolatility", "tariffRate", "localAdaptationCost"],
    },
    productInnovation: {
      liste: "innovations",
      cles: ["id", "label", "type", "developmentRounds", "devCostPerRound", "launchCost", "effects"],
    },
    rseProgram: { liste: "actions", cles: ["id", "label", "category", "costPerRound", "implementationRounds", "effects"] },
    pricingStrategy: {
      liste: "strategies",
      cles: ["id", "label", "type", "priceMultiplier", "demandImpact", "marginImpact", "imageImpact", "minRound"],
    },
    advancedHR: { liste: "policies", cles: ["id", "label", "type", "costPerRound", "implementationRounds", "effects"] },
    crisisManagement: {
      liste: "plans",
      cles: ["id", "label", "crisisType", "preparationCostPerRound", "activationCost", "effects"],
    },
    partnerships: {
      liste: "options",
      cles: ["id", "label", "type", "entryFee", "royaltiesPerRound", "minRound", "durationRounds", "effects"],
    },
    digitalTransformation: {
      liste: "projects",
      cles: ["id", "label", "type", "implementationRounds", "costPerRound", "maintenanceCostPerRound", "effects"],
    },
    brandManagement: {
      liste: "actions",
      cles: ["id", "label", "type", "costPerRound", "durationRounds", "isRecurring", "effects"],
    },
  };
  const SCENARIOS: [string, EngineScenarioConfig, string[]][] = [
    ["nova", novaScenario, Object.keys(CLES)],
    ["ecommerce", ecommerceScenario, Object.keys(CLES)],
    ["bistrot", bistrotScenario, Object.keys(CLES).filter((k) => k !== "internationalMarkets")],
    ["conseil", conseilScenario, Object.keys(CLES).filter((k) => !["qualityActions", "supplierNegotiation"].includes(k))],
  ];

  for (const [code, scenario, attendus] of SCENARIOS) {
    it(`${code} : chaque catalogue survit à l'aller-retour en base, champ par champ`, () => {
      // Le snapshot est figé en JSON à la création, puis relu par parseScenarioConfig.
      const relu = parseScenarioConfig(JSON.parse(JSON.stringify(scenario)));
      for (const bloc of attendus) {
        const { liste, cles } = CLES[bloc]!;
        const avant = (scenario as unknown as Record<string, Record<string, unknown[]>>)[bloc];
        const apres = (relu as unknown as Record<string, Record<string, unknown[]>>)[bloc];
        expect(avant, `${code}.${bloc} absent du scénario`).toBeDefined();
        expect(apres, `${code}.${bloc} perdu au chargement`).toEqual(avant);
        for (const el of apres![liste]!) {
          for (const k of cles) expect(el, `${code}.${bloc}.${liste} : ${k}`).toHaveProperty(k);
        }
      }
    });
  }

  it("le scénario joué (niveau, périodicité) garde les catalogues", () => {
    const joue = composerLeScenarioJoue({
      scenario: novaScenario,
      seed: 1,
      level: 6,
      concurrents: 3,
      periodicity: "quarter",
    });
    expect(joue.pricingStrategy).toEqual(novaScenario.pricingStrategy);
    expect(joue.digitalTransformation).toEqual(novaScenario.digitalTransformation);
    expect(parseScenarioConfig(JSON.parse(JSON.stringify(joue))).brandManagement).toEqual(
      novaScenario.brandManagement,
    );
  });
});

/** Deux entreprises NOVA, la seconde sans module : la différence vient des modules. */
function tour(
  roundIndex: number,
  companies: CompanyState[],
  decisionsA: RoundDecisions,
): ReturnType<typeof simulateRound> {
  return simulateRound({
    scenario: novaScenario,
    roundIndex,
    companies,
    decisions: { a: decisionsA, b: BASE },
    activeEvents: [],
    seed: 11,
  });
}

describe("(c) le moteur compte les modules choisis", () => {
  it("prix, RH avancée et digital : coûts du tour, puis effets au tour suivant", () => {
    const depart = [novaCompany("a", "A", "human"), novaCompany("b", "B", "human")];
    const t1 = tour(1, depart, {
      ...BASE,
      activePricingStrategyIds: ["ps-premium"],
      activeHRPolicyIds: ["hr-flex"],
      startDigitalProjectIds: ["dt-crm"],
    });
    const r1 = t1.results.a!;
    const hr = novaScenario.advancedHR!.policies.find((p) => p.id === "hr-flex")!;
    const crm = novaScenario.digitalTransformation!.projects.find((p) => p.id === "dt-crm")!;
    expect(r1.hrCost).toBe(hr.costPerRound);
    expect(r1.digitalCost).toBe(crm.costPerRound);
    expect(t1.results.b!.hrCost).toBeUndefined();
    expect(t1.results.b!.digitalCost).toBeUndefined();
    // Les modules sont des charges fixes du tour.
    expect(r1.incomeStatement.fixedCosts - t1.results.b!.incomeStatement.fixedCosts).toBeCloseTo(
      hr.costPerRound + crm.costPerRound,
      6,
    );
    const etatA = t1.companies.find((c) => c.id === "a")!;
    expect(etatA.activePricingStrategies).toEqual(["ps-premium"]);
    expect(etatA.activeHRPolicies).toEqual([{ id: "hr-flex", roundsActive: 1 }]);
    expect(etatA.digitalProjectsInProgress).toEqual([{ id: "dt-crm", roundsCompleted: 1 }]);

    // Tour 2 : la stratégie de prix est en vigueur, le projet digital s'achève.
    const t2 = tour(2, t1.companies, BASE);
    const r2 = t2.results.a!;
    const premium = novaScenario.pricingStrategy!.strategies.find((s) => s.id === "ps-premium")!;
    expect(r2.pricingEffects?.priceMultiplier).toBeCloseTo(premium.priceMultiplier, 10);
    expect(r2.digitalCost).toBe(crm.costPerRound + crm.maintenanceCostPerRound);
    expect(r2.digitalEffects?.demandBonus).toBeCloseTo(crm.effects.demandBonus, 10);
    expect(t2.companies.find((c) => c.id === "a")!.completedDigitalProjects).toEqual(["dt-crm"]);
  });

  it("le bilan du tour dit ce qui a été engagé, ce que cela a coûté et l'effet", () => {
    const depart = [novaCompany("a", "A", "human"), novaCompany("b", "B", "human")];
    const decisions = { ...BASE, startDigitalProjectIds: ["dt-crm"], activePricingStrategyIds: ["ps-premium"] };
    const t1 = tour(1, depart, decisions);
    const bilan = bilanDesModules(t1.results.a!, decisions, novaScenario)!;
    const digital = bilan.lignes.find((l) => l.titre === "Transformation digitale")!;
    expect(digital.engage).toEqual(["CRM relation client"]);
    expect(digital.cout).toBe(6000);
    expect(bilan.lignes.find((l) => l.titre === "Stratégie de prix")!.engage).toEqual([
      "Positionnement haut de gamme",
    ]);
    // Une entreprise sans module n'a pas de bilan.
    expect(bilanDesModules(t1.results.b!, BASE, novaScenario)).toBeNull();
  });

  it("une crise ne se dit que si l'équipe a un plan ou un marché à l'export", () => {
    const crise = { type: "cyberAttaque", impactDescription: "" };
    expect(bilanDesModules({ crisisEvent: crise }, BASE, novaScenario)).toBeNull();
    expect(bilanDesModules({ crisisEvent: crise, crisisCost: 4000 }, BASE, novaScenario)!.crise).toBe(
      "Crise ce tour : cyberattaque.",
    );
  });
});

describe("(d) l'offre des modules", () => {
  const offre = (tourJoue: number, etat: Partial<CompanyState> = {}, niveau?: 1 | 2 | 3 | 4 | 5 | 6) =>
    construireOffreDesModules({
      scenario: novaScenario,
      etat,
      tour: tourJoue,
      leviers: niveau ? presetByLevel.get(niveau)!.decisions : null,
    });
  const ids = (o: OffreDesModules | null, decision: string) =>
    o?.find((m) => m.decision === decision)?.elements.map((e) => e.id) ?? [];

  it("filtre par tour minimal", () => {
    expect(ids(offre(1), "activePricingStrategyIds")).toEqual(["ps-premium", "ps-penetration"]);
    expect(ids(offre(2), "activePricingStrategyIds")).toContain("ps-segmentation");
    expect(ids(offre(1), "activatePartnershipIds")).not.toContain("part-techno");
    expect(ids(offre(2), "activatePartnershipIds")).toContain("part-techno");
    // L'export : le tour d'entrée du marché est son tour minimal.
    expect(offre(1)?.some((m) => m.decision === "enteredMarketIds")).toBe(false);
    expect(ids(offre(2), "enteredMarketIds")).toEqual(["europe"]);
    expect(ids(offre(4), "enteredMarketIds")).toEqual(["europe", "asie"]);
  });

  it("n'offre que les catalogues présents dans le scénario", () => {
    const sansModule: EngineScenarioConfig = { ...novaScenario };
    for (const k of [
      "qualityActions",
      "healthSafetyActions",
      "capacityExpansion",
      "internationalMarkets",
      "productInnovation",
      "rseProgram",
      "pricingStrategy",
      "crisisManagement",
      "partnerships",
      "digitalTransformation",
      "brandManagement",
    ] as const)
      delete sansModule[k];
    expect(construireOffreDesModules({ scenario: sansModule, etat: {}, tour: 3 })).toBeNull();
    const seulementLaMarque = { ...sansModule, brandManagement: novaScenario.brandManagement };
    expect(construireOffreDesModules({ scenario: seulementLaMarque, etat: {}, tour: 3 })!.map((m) => m.decision)).toEqual([
      "activeBrandActionIds",
    ]);
    // Bistrot n'a pas d'export : pas de section, même au dernier tour.
    expect(
      construireOffreDesModules({ scenario: bistrotScenario, etat: {}, tour: 8 })!.some(
        (m) => m.decision === "enteredMarketIds",
      ),
    ).toBe(false);
  });

  it("n'offre jamais les modules sans effet appliqué ni les catalogues sans moteur", () => {
    const decisions = (offre(8) ?? []).map((m) => m.decision);
    for (const absent of ["trainingEnrollments", "activeCommercialActionIds", "activeContractIds", "activeHRPolicyIds"]) {
      expect(decisions).not.toContain(absent);
    }
    // Le co-achat ne porte qu'une réduction de coûts que le moteur ne lit pas.
    expect(ids(offre(8), "activatePartnershipIds")).not.toContain("part-sourcing");
  });

  it("suit le niveau de la partie", () => {
    expect(offre(3, {}, 1)).toBeNull();
    expect(offre(3, {}, 2)!.map((m) => m.decision)).toEqual(["qualityActions"]);
    expect(offre(3, {}, 6)!.length).toBeGreaterThan(5);
  });

  it("met à part ce qui tourne déjà et déduit les places prises", () => {
    const o = offre(3, {
      activePricingStrategies: ["ps-premium"],
      // L'ERP (trois tours) occupe sa place ; le CRM (deux tours) s'achève ce tour et la libère.
      digitalProjectsInProgress: [
        { id: "dt-erp", roundsCompleted: 1 },
        { id: "dt-crm", roundsCompleted: 1 },
      ],
      qualityActionsCompleted: { amelioration_composants: 1 },
    })!;
    const prix = o.find((m) => m.decision === "activePricingStrategyIds")!;
    expect(prix.elements.map((e) => e.id)).not.toContain("ps-premium");
    expect(prix.enCours).toEqual([{ libelle: "Positionnement haut de gamme", etat: "en vigueur" }]);
    expect(prix.plafond).toBe(novaScenario.pricingStrategy!.maxActiveStrategies - 1);
    const digital = o.find((m) => m.decision === "startDigitalProjectIds")!;
    expect(digital.elements.map((e) => e.id)).not.toContain("dt-crm");
    expect(digital.plafond).toBe(novaScenario.digitalTransformation!.maxSimultaneousProjects - 1);
    const qualite = o.find((m) => m.decision === "qualityActions")!;
    expect(qualite.elements.find((e) => e.id === "amelioration_composants")!.valeur).toBe("2");
  });

  it("chaque élément porte un libellé, un coût, une durée et des effets", () => {
    for (const m of offre(8)!) {
      for (const el of m.elements) {
        expect(el.libelle.length, el.id).toBeGreaterThan(0);
        expect(el.effets.length, el.id).toBeGreaterThan(0);
        expect(el.duree, el.id).not.toBeNull();
        expect(el.champ).toBe(champDeModule(m.decision, el.id));
      }
    }
  });
});

describe("la lecture du formulaire et le jugement du serveur", () => {
  it("les cases cochées deviennent des décisions, par le même lecteur des deux côtés", () => {
    const f = new FormData();
    f.set("price", "79");
    f.set("productionPlan", "5000");
    f.set(champDeModule("activePricingStrategyIds", "ps-premium"), "ps-premium");
    f.set(champDeModule("startDigitalProjectIds", "dt-crm"), "dt-crm");
    f.set(champDeModule("qualityActions", "amelioration_composants"), "1");
    f.set(champDeModule("hsActions", "evacuation"), "evacuation");
    const { decisions } = decisionsSaisies(f);
    expect(decisions.activePricingStrategyIds).toEqual(["ps-premium"]);
    expect(decisions.startDigitalProjectIds).toEqual(["dt-crm"]);
    expect(decisions.qualityActions).toEqual([{ actionCode: "amelioration_composants", level: 1 }]);
    expect(decisions.hsActions).toEqual([{ actionCode: "evacuation" }]);
    expect(roundDecisionsSchema.parse(decisions).startDigitalProjectIds).toEqual(["dt-crm"]);
    // Rien coché : aucune clé de module.
    expect(modulesSaisis(new FormData().entries())).toEqual({});
  });

  it("refuse un choix hors de l'offre, un plafond dépassé, un module non proposé", () => {
    const o = construireOffreDesModules({ scenario: novaScenario, etat: {}, tour: 1 });
    expect(refusDesModules({ activePricingStrategyIds: ["ps-premium"] }, o)).toEqual([]);
    // Tour minimal non atteint.
    expect(refusDesModules({ activePricingStrategyIds: ["ps-segmentation"] }, o)).toHaveLength(1);
    // Plafond : la marque prend deux nouvelles actions par tour.
    const marque = refusDesModules({ activeBrandActionIds: ["bm-campagne", "bm-ambassadeurs", "bm-label"] }, o);
    expect(marque.map((e) => e.champ)).toEqual([champDeModule("activeBrandActionIds", "bm-label")]);
    // Un niveau qualité qui n'est pas le suivant.
    expect(refusDesModules({ qualityActions: [{ actionCode: "amelioration_composants", level: 2 }] }, o)).toHaveLength(1);
    // Un module que l'écran ne propose pas.
    expect(refusDesModules({ activeHRPolicyIds: ["hr-flex"] }, o)).toHaveLength(1);
    // Une partie sans module refuse tout choix de module.
    expect(refusDesModules({ activeBrandActionIds: ["bm-campagne"] }, null)).toHaveLength(1);
  });

  it("la reconduction d'un tour non rendu ne relance aucun module", () => {
    const reconduit = carryOverDecisions({ ...BASE, ...MODULES } as RoundDecisions);
    for (const cle of Object.keys(MODULES)) {
      expect(reconduit[cle as keyof RoundDecisions], cle).toBeUndefined();
    }
  });
});
