import { describe, expect, it } from "vitest";
import { botDecisions, type BotProfile } from "../../src/engine/bots";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { novaBots, novaCompany, novaScenario } from "../../src/config/scenarios/nova";

/**
 * Invariants de calibration de NOVA (doc 07 §4) — exécutés sur la graine de
 * référence. Toute retouche du scénario ou du moteur qui casse la dramaturgie
 * pédagogique (notamment la crise de trésorerie du tour 4, §16) casse ces tests.
 */

const NOVA_SEED = 20260101;

function playStrategy(strategy: BotProfile, seed = NOVA_SEED): GameRunResult {
  const companies = [
    novaCompany("player", "NOVA", "bot", strategy),
    ...novaBots.slice(0, 2).map((b) => novaCompany(b.id, b.name, "bot", b.profile)),
  ];
  return runGame({
    scenario: novaScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: Parameters<Parameters<typeof runGame>[0]["providers"][string]>[0]) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: novaScenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
          }),
      ]),
    ),
    seed,
  });
}

const playerRound = (run: GameRunResult, round: number) => run.rounds[round - 1]!.results["player"]!;
const cumulativeNetIncome = (run: GameRunResult) =>
  run.rounds.reduce((sum, r) => sum + r.results["player"]!.incomeStatement.netIncome, 0);

const OVERDRAFT_LIMIT = novaScenario.finance.overdraftLimit;

describe("NOVA — invariant 1 : la stratégie passive est punie, sans mort précoce", () => {
  const run = playStrategy("passive");
  it("perd de l'argent au plus tard au tour 3 (sous le seuil de rentabilité)", () => {
    expect(playerRound(run, 3).incomeStatement.netIncome).toBeLessThan(0);
  });
  it("ne dépasse pas le plafond de découvert avant le tour 4", () => {
    for (let round = 1; round <= 3; round++) {
      expect(playerRound(run, round).functionalBalance.netTreasury).toBeGreaterThan(-OVERDRAFT_LIMIT);
    }
  });
});

describe("NOVA — invariant 2 : au tour 4, la croissance rend bénéficiaire MAIS illiquide (§16)", () => {
  for (const strategy of ["balanced", "growth"] as const) {
    it(`stratégie ${strategy} : résultat net > 0 et trésorerie nette < 0 au tour 4`, () => {
      const r = playerRound(playStrategy(strategy), 4);
      expect(r.incomeStatement.netIncome).toBeGreaterThan(0);
      expect(r.functionalBalance.netTreasury).toBeLessThan(0);
      // et le BFR a bien explosé avec la commande CampusTech (créances à 80 j)
      expect(r.functionalBalance.bfr).toBeGreaterThan(50000);
    });
  }
});

describe("NOVA — invariant 3 : aucune stratégie ne dépasse le découvert avant le tour 4", () => {
  const strategies: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];
  for (const strategy of strategies) {
    it(`stratégie ${strategy}`, () => {
      const run = playStrategy(strategy);
      for (let round = 1; round <= 3; round++) {
        // « Ne dépasse pas » le découvert autorisé : le toucher exactement est
        // permis (le garde-fou V1-4 amène price_aggressive pile au plafond),
        // tolérance de 1 € pour le bruit de calcul flottant.
        expect(playerRound(run, round).functionalBalance.netTreasury).toBeGreaterThan(-OVERDRAFT_LIMIT - 1);
      }
    });
  }
});

describe("NOVA — invariant 4 : une stratégie équilibrée raisonnable est récompensée", () => {
  it("balanced termine la partie avec un résultat cumulé positif", () => {
    // proxy financier en attendant le BPI (étape 10) — cible doc 07 : BPI 55-75
    expect(cumulativeNetIncome(playStrategy("balanced"))).toBeGreaterThan(0);
  });
  it("balanced redevient liquide en fin de partie (la crise du T4 se gère)", () => {
    const run = playStrategy("balanced");
    expect(playerRound(run, 6).functionalBalance.netTreasury).toBeGreaterThan(-OVERDRAFT_LIMIT);
  });
});

describe("NOVA — invariant 5 : les décisions comptent", () => {
  it("écart entre meilleure et pire stratégie ≥ 100 000 € de résultat cumulé", () => {
    const strategies: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];
    const totals = strategies.map((s) => cumulativeNetIncome(playStrategy(s)));
    expect(Math.max(...totals) - Math.min(...totals)).toBeGreaterThan(100000);
  });
});

describe("NOVA — dramaturgie et déterminisme", () => {
  it("la hausse matières scriptée frappe bien le tour 5", () => {
    const run = playStrategy("balanced");
    expect(run.rounds[4]!.newEvents.map((e) => e.code)).toContain("raw_material_spike");
  });
  it("CampusTech n'existe pas avant le tour 3", () => {
    const run = playStrategy("balanced");
    expect(run.rounds[0]!.market.potentialBySegment["campustech"]).toBe(0);
    expect(run.rounds[2]!.market.potentialBySegment["campustech"]).toBeGreaterThan(0);
  });
  it("le pic saisonnier du tour 4 crée des ventes perdues (leçon capacité/prévision)", () => {
    const r = playerRound(playStrategy("balanced"), 4);
    const lost = Object.values(r.market.bySegment).reduce((s, d) => s + d.lost, 0);
    expect(lost).toBeGreaterThan(1000);
  });
  it("rejeu à graine identique ⇒ trajectoire identique (anti-triche, ADR-05)", () => {
    const a = playStrategy("balanced");
    const b = playStrategy("balanced");
    expect(JSON.stringify(a.rounds.at(-1)!.results)).toBe(JSON.stringify(b.rounds.at(-1)!.results));
  });
});

describe("NOVA — instantané doré (doc 09 §3)", () => {
  it("trajectoires de référence figées (tout écart = décision d'équilibrage assumée)", () => {
    const strategies: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];
    const summary = Object.fromEntries(
      strategies.map((strategy) => {
        const run = playStrategy(strategy);
        return [
          strategy,
          run.rounds.map((round) => {
            const r = round.results["player"]!;
            return {
              sold: Math.round(soldUnits(r)),
              revenue: Math.round(r.incomeStatement.revenue),
              netIncome: Math.round(r.incomeStatement.netIncome),
              netTreasury: Math.round(r.functionalBalance.netTreasury),
              bfr: Math.round(r.functionalBalance.bfr),
            };
          }),
        ];
      }),
    );
    expect(summary).toMatchSnapshot();
  });
});
