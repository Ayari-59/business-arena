import { describe, expect, it } from "vitest";
import { novaCompany, novaScenario } from "@/config/scenarios/nova";
import { bistrotScenario } from "@/config/scenarios/bistrot";
import { ecommerceScenario } from "@/config/scenarios/ecommerce";
import { conseilScenario } from "@/config/scenarios/conseil";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { applyPeriodicity } from "@/config/scenarios/periodicity";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { arretDeModule, modulesSaisis } from "@/config/modules-saisis";
import { simulateRound } from "@/engine/simulation";
import { bilanDesModules, construireOffreDesModules, refusDesModules } from "@/services/modules-offer";
import { roundDecisionsSchema } from "@/services/decision-schema";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * LES DEUX MODULES GARDÉS, DANS LE MOTEUR : démarches qualité et programmes R&D.
 *
 * Chaque décision est jouée par l'entreprise « a » face à une entreprise « b »
 * qui ne choisit rien, et comparée à la même partie sans la décision : le
 * coût est payé où il faut, l'effet va dans le bon sens, le plafond tient,
 * l'arrêt retire coût et effet. S'y ajoutent les lignes d'emprunt à taux
 * propre, tirées avant le retrait des options de financement, que les parties
 * en cours continuent de rembourser à leur taux.
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
  options: { etatA?: Partial<CompanyState>; tour?: number; scenario?: EngineScenarioConfig } = {},
) {
  const a = { ...novaCompany("a", "A", "human"), ...(options.etatA ?? {}) };
  const b = novaCompany("b", "B", "human");
  return simulateRound({
    scenario: options.scenario ?? novaScenario,
    roundIndex: options.tour ?? 1,
    companies: [a, b],
    decisions: { a: decisionsA, b: BASE },
    activeEvents: [],
    seed: 11,
  });
}
/** La demande que le marché adresse à l'entreprise : ce que l'attraction lui vaut, stock à part. */
const demande = (r: ReturnType<typeof jouer>["results"][string]) =>
  Object.values(r.market.bySegment).reduce((t, s) => t + s.demandForCompany, 0);
const etatDe = (o: ReturnType<typeof jouer>, id = "a") => o.companies.find((c) => c.id === id)!;

describe("les démarches qualité : un niveau acheté, un effet acquis", () => {
  it("le niveau se paie une fois en charge exceptionnelle, et relève l'attractivité dès ce tour", () => {
    const action = novaScenario.qualityActions!.actions.find((a) => a.code === "satisfaction_support")!;
    const sans = jouer(BASE).results.a!;
    const o = jouer({ ...BASE, qualityActions: [{ actionCode: "satisfaction_support", level: 1 }] });
    const r = o.results.a!;
    expect(r.qualityActions?.started).toEqual([
      { actionCode: "satisfaction_support", level: 1, cost: action.levels[0]!.cost },
    ]);
    expect((r.incomeStatement.exceptionalCharge ?? 0) - (sans.incomeStatement.exceptionalCharge ?? 0)).toBeCloseTo(
      action.levels[0]!.cost,
      6,
    );
    expect(demande(r)).toBeGreaterThan(demande(sans));
    expect(etatDe(o).qualityActionsCompleted).toEqual({ satisfaction_support: 1 });
    // Le tour suivant, l'effet reste sans rien payer.
    const t2 = jouer(BASE, { etatA: etatDe(o), tour: 2 }).results.a!;
    expect(t2.qualityActions?.started).toEqual([]);
    expect(t2.qualityActions?.activeEffects.qualityImageBonus).toBe(action.levels[0]!.effects.qualityImageBonus);
  });

  it("un niveau ne se saute pas : le niveau 2 sans le 1 n'est pas acheté", () => {
    const r = jouer({ ...BASE, qualityActions: [{ actionCode: "satisfaction_support", level: 2 }] }).results.a!;
    expect(r.qualityActions).toBeUndefined();
  });
});

describe("les programmes R&D : des tours de travaux, puis un acquis", () => {
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
    expect(r.breakeven.unitVariableCost / sans.breakeven.unitVariableCost).toBeCloseTo(
      1 - emballage.effects.costReduction,
      6,
    );
    expect(demande(r)).toBeGreaterThan(demande(sans));
  });

  it("le plafond de programmes simultanés tient", () => {
    const tous = jouer({ ...BASE, startedRdActionIds: ["rd-materiaux", "rd-process", "rd-emballage"] });
    expect(etatDe(tous).rdActionsInProgress).toHaveLength(2);
  });
});

describe("ce qui tourne s'arrête : plus de coût, plus d'effet, rien de remboursé", () => {
  const arreter = (module: string, id: string): RoundDecisions => ({ ...BASE, stoppedModuleItems: [{ module, id }] });

  it("un programme R&D arrêté en cours ne coûte plus et quitte l'état", () => {
    const etatA = { rdActionsInProgress: [{ id: "rd-process", roundsCompleted: 1 }] };
    expect(jouer(BASE, { etatA, tour: 2 }).results.a!.rdActionsCost).toBeGreaterThan(0);
    const o = jouer(arreter("startedRdActionIds", "rd-process"), { etatA, tour: 2 });
    expect(o.results.a!.rdActionsCost).toBeUndefined();
    expect(etatDe(o).rdActionsInProgress).toBeUndefined();
    expect(o.results.a!.stoppedModuleItems).toEqual([{ module: "startedRdActionIds", id: "rd-process" }]);
  });

  it("un arrêt de ce qui ne tourne pas, ou d'un module retiré, ne change rien", () => {
    const rien = jouer(arreter("startedRdActionIds", "rd-process")).results.a!;
    expect(rien.incomeStatement).toEqual(jouer(BASE).results.a!.incomeStatement);
    const retire = jouer(arreter("activePricingStrategyIds", "ps-premium"), {
      etatA: { activePricingStrategies: ["ps-premium"] } as Partial<CompanyState>,
    }).results.a!;
    expect(retire.incomeStatement).toEqual(jouer(BASE).results.a!.incomeStatement);
  });

  it("le serveur n'arrête que ce qui tourne, et un arrêt libère sa place", () => {
    const etat = {
      rdActionsInProgress: [
        { id: "rd-materiaux", roundsCompleted: 1 },
        { id: "rd-process", roundsCompleted: 1 },
      ],
    };
    const offre = construireOffreDesModules({ scenario: novaScenario, etat, tour: 2 });
    const rd = offre!.find((m) => m.decision === "startedRdActionIds")!;
    expect(rd.plafond).toBe(0);
    expect(refusDesModules({ startedRdActionIds: ["rd-emballage"] }, offre)).toHaveLength(1);
    expect(
      refusDesModules(
        {
          startedRdActionIds: ["rd-emballage"],
          stoppedModuleItems: [{ module: "startedRdActionIds", id: "rd-process" }],
        },
        offre,
      ),
    ).toEqual([]);
    // Arrêter ce qui ne tourne pas, ou ce qu'un module retiré faisait tourner : refusé.
    expect(
      refusDesModules({ stoppedModuleItems: [{ module: "startedRdActionIds", id: "rd-emballage" }] }, offre),
    ).toHaveLength(1);
    expect(
      refusDesModules({ stoppedModuleItems: [{ module: "activePricingStrategyIds", id: "ps-premium" }] }, offre),
    ).toHaveLength(1);
  });

  it("la case d'arrêt se lit sur le formulaire", () => {
    const f = new FormData();
    f.set(arretDeModule("startedRdActionIds", "rd-process"), "1");
    expect(modulesSaisis(f.entries()).stoppedModuleItems).toEqual([{ module: "startedRdActionIds", id: "rd-process" }]);
    expect(roundDecisionsSchema.parse({ ...BASE, ...modulesSaisis(f.entries()) }).stoppedModuleItems).toHaveLength(1);
  });
});

describe("les coûts par tour des modules suivent la durée du tour", () => {
  it("au mois, un programme R&D coûte le tiers par tour ; un niveau de démarche qualité ne bouge pas", () => {
    const mois = applyPeriodicity(novaScenario, "month");
    const rd = (s: EngineScenarioConfig) => s.rdActions!.actions[0]!;
    expect(rd(mois).costPerRound).toBe(Math.round(rd(novaScenario).costPerRound / 3));
    expect(rd(mois).durationRounds).toBe(rd(novaScenario).durationRounds);
    const niveau = (s: EngineScenarioConfig) => s.qualityActions!.actions[0]!.levels[2]!;
    expect(niveau(mois).cost).toBe(niveau(novaScenario).cost);
    expect(niveau(mois).effects.maintenanceSaving).toBe(Math.round(niveau(novaScenario).effects.maintenanceSaving! / 3));
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

describe("les lignes d'emprunt à taux propre, tirées avant le retrait des options de financement", () => {
  const ligne = { remaining: 90000, perRound: 30000, ratePerRound: 0.015, optionId: "credit-court" };
  const ouverture = novaCompany("a", "A", "human");

  it("se remboursent par échéances et portent intérêt à LEUR taux", () => {
    const sans = jouer(BASE, { tour: 2 });
    const avec = jouer(BASE, {
      tour: 2,
      etatA: {
        loans: [...(ouverture.loans ?? []), ligne],
        // Le tirage est entré en caisse : la dette et la trésorerie montent ensemble.
        finance: {
          ...ouverture.finance,
          cash: ouverture.finance.cash + 90000,
          financialDebt: ouverture.finance.financialDebt + 90000,
        },
      },
    });
    const r = avec.results.a!;
    expect(r.debt?.financingInterest).toBeCloseTo(90000 * 0.015, 6);
    expect(r.debt!.mandatoryRepayment - sans.results.a!.debt!.mandatoryRepayment).toBeCloseTo(30000, 6);
    expect(etatDe(avec).loans!.find((l) => l.optionId === "credit-court")).toEqual({ ...ligne, remaining: 60000 });
  });

  it("aucun nouveau tirage : la décision d'un formulaire d'avant ne passe pas", () => {
    const ancienne = { ...BASE, financingDraws: [{ optionId: "credit-court", amount: 100000 }] };
    expect("financingDraws" in roundDecisionsSchema.parse(ancienne)).toBe(false);
    const r = jouer(ancienne as RoundDecisions).results.a!;
    expect(r.balanceSheet).toEqual(jouer(BASE).results.a!.balanceSheet);
  });
});

describe("le bilan du tour nomme les deux modules, et ce qui a été arrêté", () => {
  it("une démarche qualité engagée, un programme R&D arrêté", () => {
    const decisions: RoundDecisions = {
      ...BASE,
      qualityActions: [{ actionCode: "satisfaction_support", level: 1 }],
      stoppedModuleItems: [{ module: "startedRdActionIds", id: "rd-process" }],
    };
    const r = jouer(decisions, {
      etatA: { rdActionsInProgress: [{ id: "rd-process", roundsCompleted: 1 }] },
      tour: 2,
    }).results.a!;
    const bilan = bilanDesModules(r, decisions, novaScenario)!;
    expect(bilan.lignes.find((l) => l.titre === "Démarches qualité")!.engage).toEqual([
      "Satisfaction client (support technique) · niveau 1",
    ]);
    expect(bilan.lignes.find((l) => l.titre === "Programmes de R&D")!.arrete).toEqual([
      "Optimisation du process de fabrication",
    ]);
  });
});
