import { describe, expect, it } from "vitest";
import { botDecisions, type BotProfile } from "../../src/engine/bots";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { fitnessBots, fitnessCompany, fitnessScenario } from "../../src/config/scenarios/fitness";
import { FITNESS_SITUATIONS } from "../../src/config/scenarios/fitness/situations";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * VOLT FITNESS — le modèle par ABONNEMENT. La salle porte un portefeuille
 * d'adhérents d'un trimestre à l'autre : une part s'en va (attrition), le
 * reste est servi avant tout nouveau venu et paie à nouveau. Ce que les
 * énoncés racontent (1 600 adhérents, 15 % d'attrition, valeur vie, l'été qui
 * vide, la saturation qui fait partir) doit être ce que le moteur joue.
 *
 * Les invariants : le portefeuille repris, la thèse « l'attrition pilote le
 * résultat » (la qualité qui retient bat le volume qui sature), l'équilibrée
 * gagne, la passive perd, aucune stratégie ne meurt. L'instantané fige la
 * partie de référence.
 */

const SEED = 20260101;
const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function partie(strategie: BotProfile): GameRunResult {
  const companies: CompanyState[] = [
    fitnessCompany("player", "VOLT", "bot", strategie),
    ...fitnessBots.slice(0, 2).map((b) => fitnessCompany(b.id, b.name, "bot", b.profile)),
  ];
  return runGame({
    scenario: fitnessScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: fitnessScenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
          }),
      ]),
    ),
    seed: SEED,
  });
}

const joueur = (run: GameRunResult) => run.rounds.map((r) => r.results["player"]!);
const cumul = (run: GameRunResult) =>
  joueur(run).reduce((t, r) => t + r.incomeStatement.netIncome, 0);
const attritionMoyenne = (run: GameRunResult) =>
  joueur(run).reduce((t, r) => t + r.subscription!.churnRate, 0) / joueur(run).length;

describe("VOLT FITNESS — le portefeuille d'adhérents", () => {
  it("reprend 1 600 adhérents à 105 € qui partent à 15 % par trimestre : ce que dit la situation d'ouverture", () => {
    const sub = fitnessScenario.subscription!;
    expect(fitnessCompany("t", "T", "human").members).toBe(1600);
    expect(sub.baseChurnRate).toBe(0.15);
    expect(sub.refPrice).toBe(105);
    const t1 = FITNESS_SITUATIONS.find((s) => s.code === "fitness_t1_recurrent")!;
    expect(t1.narrative).toContain("1 600 adhérents");
    expect(t1.narrative).toContain("105 €");
    // Valeur vie citée au tour 2 : 90 € de marge ÷ 15 % = 600 €.
    const marge = sub.refPrice - fitnessScenario.product.materialCostPerUnit - fitnessScenario.product.otherVariableCostPerUnit;
    expect(marge).toBe(90);
    expect(Math.round(marge / sub.baseChurnRate)).toBe(600);
  });

  it("le seuil cité est celui de la structure : 105 000 € ÷ 90 € ≈ 1 170 adhérents, 53 % des 2 200 places", () => {
    const seuil = fitnessScenario.fixedCostsPerRound / 90;
    expect(Math.round(seuil / 10) * 10).toBe(1170);
    expect(Math.round((seuil / 2200) * 100)).toBe(53);
    const t1 = FITNESS_SITUATIONS.find((s) => s.code === "fitness_t1_recurrent")!;
    expect(JSON.stringify(t1)).toContain("105 000 €");
    expect(JSON.stringify(t1)).toContain("1 170");
    expect(JSON.stringify(t1)).not.toContain("78 000");
  });

  it("300 adhérents de trop font passer l'attrition de 15 à 16 % ; une salle pleine, à 25 %", () => {
    const t1 = joueur(partie("balanced"))[0]!;
    // Au tour 1 : 1 600 sur 2 200 places, sous le seuil de saturation.
    expect(t1.subscription!.occupancy).toBeCloseTo(1600 / 2200, 6);
    expect(t1.subscription!.churnRate).toBeCloseTo(0.15, 6);
    const sub = fitnessScenario.subscription!;
    const surplus = (occ: number) =>
      sub.baseChurnRate + sub.crowdingChurn * Math.min(1, Math.max(0, (occ - sub.crowdingThreshold) / (1 - sub.crowdingThreshold)));
    expect(Math.round(surplus(1900 / 2200) * 100)).toBe(16);
    expect(Math.round(surplus(1) * 100)).toBe(25);
  });

  it("les adhérents conservés sont servis avant les nouveaux et paient à nouveau", () => {
    const t1 = joueur(partie("balanced"))[0]!;
    const s = t1.subscription!;
    expect(s.opening).toBe(1600);
    expect(s.retained).toBeCloseTo(1600 * 0.85, 6);
    expect(s.unserved).toBe(0);
    expect(s.newMembers).toBeGreaterThan(0);
    expect(s.closing).toBeCloseTo(s.retained + s.newMembers, 6);
    expect(t1.incomeStatement.revenue).toBeGreaterThan(s.retainedRevenue);
    expect(s.retainedRevenue).toBeGreaterThan(1600 * 0.85 * 100);
  });

  it("l'été fait partir davantage : au tour 3, l'attrition est la plus forte de la partie", () => {
    const rounds = joueur(partie("balanced"));
    const churn = rounds.map((r) => r.subscription!.churnRate);
    expect(Math.max(...churn)).toBe(churn[2]);
  });
});

describe("VOLT FITNESS — calibration", () => {
  const parties = Object.fromEntries(STRATEGIES.map((s) => [s, partie(s)])) as Record<BotProfile, GameRunResult>;

  it("aucune stratégie ne meurt", () => {
    for (const s of STRATEGIES) {
      expect(joueur(parties[s]).some((r) => r.defaillant), s).toBe(false);
    }
  });

  it("l'équilibrée gagne, la passive perd", () => {
    expect(cumul(parties.balanced)).toBeGreaterThan(100000);
    expect(cumul(parties.passive)).toBeLessThan(0);
    expect(cumul(parties.passive)).toBeLessThan(cumul(parties.balanced));
  });

  it("la thèse : la qualité qui retient bat le volume qui sature", () => {
    // Le premium garde ses adhérents (attrition la plus basse) et finit
    // devant l'équilibrée, qui remplit la salle et la fait partir.
    expect(attritionMoyenne(parties.premium)).toBeLessThan(attritionMoyenne(parties.balanced));
    expect(cumul(parties.premium)).toBeGreaterThan(cumul(parties.balanced));
    expect(cumul(parties.premium)).toBeGreaterThan(cumul(parties.growth));
  });

  it("instantané de la partie de référence", () => {
    const resume = STRATEGIES.map((s) => ({
      strategie: s,
      cumul: Math.round(cumul(parties[s])),
      portefeuille: joueur(parties[s]).map((r) => Math.round(r.subscription!.closing)),
      attrition: joueur(parties[s]).map((r) => Math.round(r.subscription!.churnRate * 1000) / 10),
    }));
    expect(resume).toMatchSnapshot();
  });
});
