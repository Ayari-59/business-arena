import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import { botDecisions } from "../../src/engine/bots";
import { novaScenario, novaCompany } from "../../src/config/scenarios/nova";
import type { RoundDecisions, SimulationInput, SimulationOutput } from "../../src/engine/types";

/**
 * Tests dorés NOVA : verrouillent le comportement économique du moteur sur le
 * scénario de référence. Toute modification involontaire de la chaîne de
 * simulation casse ces tests. Seed fixe = résultats déterministes au bit près.
 */

const SEED = 42;

const PLAYER_DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  finance: { newLoan: 0, loanRepayment: 0 },
};

function novaInput(overrides: Partial<SimulationInput> = {}): SimulationInput {
  const player = novaCompany("player", "NOVA One", "human");
  const soundbox = novaCompany("soundbox", "SoundBox", "bot", "price_aggressive");
  const auris = novaCompany("auris", "Auris", "bot", "premium");
  return {
    scenario: novaScenario,
    roundIndex: 1,
    companies: [player, soundbox, auris],
    decisions: {
      player: PLAYER_DECISIONS,
      soundbox: botDecisions("price_aggressive", {
        scenario: novaScenario,
        state: soundbox,
        roundIndex: 1,
      }),
      auris: botDecisions("premium", {
        scenario: novaScenario,
        state: auris,
        roundIndex: 1,
      }),
    },
    activeEvents: [],
    seed: SEED,
    ...overrides,
  };
}

describe("golden NOVA — tour 1 mono-tour", () => {
  const out = simulateRound(novaInput());
  const player = out.results["player"]!;
  const soundbox = out.results["soundbox"]!;
  const auris = out.results["auris"]!;

  it("déterminisme : deux exécutions identiques au bit près", () => {
    const a = simulateRound(novaInput());
    const b = simulateRound(novaInput());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("chiffre d'affaires du joueur", () => {
    expect(player.incomeStatement.revenue).toBeCloseTo(283200, 0);
  });

  it("volumes vendus du joueur", () => {
    const totalSold = Object.values(player.market.bySegment).reduce(
      (s, seg) => s + seg.sold,
      0,
    );
    expect(totalSold).toBeCloseTo(4800, 0);
  });

  it("coûts variables de production", () => {
    expect(player.incomeStatement.variableProductionCost).toBeCloseTo(182400, 0);
  });

  it("résultat d'exploitation et résultat net", () => {
    expect(player.incomeStatement.operatingIncome).toBeCloseTo(-8200, 0);
    expect(player.incomeStatement.netIncome).toBeCloseTo(-9200, 0);
  });

  it("trésorerie positive au tour 1", () => {
    expect(player.balanceSheet.cash).toBeGreaterThan(40000);
    expect(player.balanceSheet.cash).toBeCloseTo(42613.33, 0);
    expect(player.balanceSheet.overdraft).toBe(0);
  });

  it("FRNG, BFR et trésorerie nette (TN = FRNG - BFR)", () => {
    expect(player.functionalBalance.frng).toBeCloseTo(16800, 0);
    expect(player.functionalBalance.bfr).toBeCloseTo(-25813.33, 0);
    expect(player.functionalBalance.netTreasury).toBeCloseTo(
      player.functionalBalance.frng - player.functionalBalance.bfr,
      6,
    );
  });

  it("capitaux propres après perte", () => {
    expect(player.balanceSheet.equity).toBeCloseTo(140800, 0);
  });

  it("seuil de rentabilité en unités", () => {
    expect(player.breakeven.breakEvenUnits).toBeCloseTo(5190.48, 0);
  });

  it("part de marché du joueur", () => {
    expect(player.market.totalShare).toBeGreaterThan(0.2);
    expect(player.market.totalShare).toBeLessThan(0.4);
  });

  it("production réalisée = plan (capacité suffisante)", () => {
    expect(player.production.produced).toBe(4800);
    expect(player.production.planned).toBe(4800);
  });

  it("SoundBox vend plus (prix bas) mais perd plus", () => {
    expect(soundbox.market.totalShare).toBeGreaterThan(0);
    expect(soundbox.incomeStatement.netIncome).toBeLessThan(player.incomeStatement.netIncome);
  });

  it("Auris a un seuil de rentabilité plus bas (premium, qualité)", () => {
    expect(auris.breakeven.breakEvenUnits).toBeLessThan(player.breakeven.breakEvenUnits);
  });

  it("pas d'événement au tour 1", () => {
    expect(out.events).toHaveLength(0);
    expect(out.newEvents).toHaveLength(0);
  });

  it("le marché total est cohérent (parts ≤ 1, > 0)", () => {
    const totalShares =
      player.market.totalShare + soundbox.market.totalShare + auris.market.totalShare;
    expect(totalShares).toBeGreaterThan(0);
    expect(totalShares).toBeLessThanOrEqual(1.001);
  });

  it("TN = cash - overdraft pour chaque entreprise", () => {
    for (const r of Object.values(out.results)) {
      expect(r.functionalBalance.netTreasury).toBeCloseTo(
        r.balanceSheet.cash - r.balanceSheet.overdraft,
        6,
      );
    }
  });

  it("ratios financiers présents", () => {
    expect(player.ratios).toBeDefined();
    expect(typeof player.ratios).toBe("object");
  });
});

describe("golden NOVA — multi-tour (3 rounds)", () => {
  let rounds: SimulationOutput[];

  it("enchaîne 3 tours sans erreur", () => {
    rounds = [];
    let companies = novaInput().companies;
    let events: SimulationInput["activeEvents"] = [];

    for (let roundIndex = 1; roundIndex <= 3; roundIndex++) {
      const decisions: Record<string, RoundDecisions> = {
        player: PLAYER_DECISIONS,
      };
      for (const c of companies) {
        if (c.controller === "bot") {
          decisions[c.id] = botDecisions(c.botProfile as any, {
            scenario: novaScenario,
            state: c,
            roundIndex,
          });
        }
      }
      const out = simulateRound({
        scenario: novaScenario,
        roundIndex,
        companies,
        decisions,
        activeEvents: events,
        seed: SEED,
      });
      rounds.push(out);
      companies = out.companies;
      events = out.events;
    }
    expect(rounds).toHaveLength(3);
  });

  it("le joueur a un CA constant (même prix × mêmes ventes bornées)", () => {
    for (const out of rounds) {
      expect(out.results["player"]!.incomeStatement.revenue).toBeCloseTo(283200, 0);
    }
  });

  it("la part de marché du joueur évolue entre les tours", () => {
    const shares = rounds.map((r) => r.results["player"]!.market.totalShare);
    expect(shares[0]).not.toBe(shares[2]);
  });

  it("la trésorerie se dégrade tour après tour (pas d'emprunt, perte nette)", () => {
    const cash = rounds.map(
      (r) => r.results["player"]!.balanceSheet.cash - r.results["player"]!.balanceSheet.overdraft,
    );
    expect(cash[0]!).toBeGreaterThan(cash[1]!);
    expect(cash[1]!).toBeGreaterThan(cash[2]!);
  });

  it("les capitaux propres fondent sous les pertes cumulées", () => {
    const equity = rounds.map((r) => r.results["player"]!.balanceSheet.equity);
    expect(equity[0]!).toBeGreaterThan(equity[2]!);
  });

  it("TN = FRNG - BFR à chaque tour pour chaque entreprise", () => {
    for (const out of rounds) {
      for (const r of Object.values(out.results)) {
        expect(r.functionalBalance.netTreasury).toBeCloseTo(
          r.functionalBalance.frng - r.functionalBalance.bfr,
          4,
        );
      }
    }
  });

  it("la dette financière diminue (amortissement constant 4 000 €/tour)", () => {
    const finalPlayer = rounds[2]!.companies.find((c) => c.id === "player")!;
    expect(finalPlayer.finance.financialDebt).toBeCloseTo(68000, 0);
  });

  it("le bilan est équilibré après 3 tours (actif = passif implicite)", () => {
    for (const out of rounds) {
      for (const r of Object.values(out.results)) {
        const totalAssets =
          r.balanceSheet.fixedAssetsNet +
          r.balanceSheet.inventoryValue +
          r.balanceSheet.receivables +
          r.balanceSheet.cash;
        const totalLiabilities =
          r.balanceSheet.equity +
          r.balanceSheet.financialDebt +
          r.balanceSheet.payables +
          r.balanceSheet.overdraft +
          (r.balanceSheet.vatLiability ?? 0);
        expect(totalAssets).toBeCloseTo(totalLiabilities, 2);
      }
    }
  });

  it("snapshot déterministe du tour 3 du joueur", () => {
    const p3 = rounds[2]!.results["player"]!;
    expect(p3).toMatchObject({
      incomeStatement: expect.objectContaining({
        revenue: expect.closeTo(283200, 0),
        netIncome: expect.closeTo(-8740, 0),
      }),
      functionalBalance: expect.objectContaining({
        frng: expect.closeTo(-14930, 0),
      }),
      market: expect.objectContaining({
        totalShare: expect.closeTo(0.1894, 2),
      }),
    });
  });
});
