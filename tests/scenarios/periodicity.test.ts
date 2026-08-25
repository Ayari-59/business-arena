import { describe, expect, it } from "vitest";
import {
  applyPeriodicity,
  applyPeriodicityToCompany,
  periodLabel,
  periodicityFromRoundDays,
} from "../../src/config/scenarios/periodicity";
import { novaBots, novaCompany, novaScenario } from "../../src/config/scenarios/nova";
import { botDecisions, type BotProfile } from "../../src/engine/bots";
import { runGame, soldUnits } from "../../src/engine/simulation/runGame";
import { parseScenarioConfig } from "../../src/config/scenarios/schema";

describe("périodicité (ADR-01) : redimensionnement du scénario", () => {
  it("mensuel : flux ÷ 3, croissance composée, délais inchangés", () => {
    const monthly = applyPeriodicity(novaScenario, "month");
    expect(monthly.roundDays).toBe(30);
    expect(monthly.fixedCostsPerRound).toBeCloseTo(novaScenario.fixedCostsPerRound / 3, 6);
    expect(monthly.finance.depreciationPerRound).toBeCloseTo(5000 / 3, 6);
    const seg = monthly.market.segments[0]!;
    const base = novaScenario.market.segments[0]!;
    expect(seg.size).toBeCloseTo(base.size / 3, 6);
    // croissance composée : (1+g)^(1/3) − 1, telle que 3 mois ≈ 1 trimestre
    expect(Math.pow(1 + seg.growth, 3)).toBeCloseTo(1 + base.growth, 9);
    expect(seg.paymentDelayDays).toBe(base.paymentDelayDays); // délais absolus inchangés
    expect(monthly.finance.loanAnnualRate).toBe(novaScenario.finance.loanAnnualRate);
  });

  it("annuel : flux × 4 ; trimestre : identité stricte", () => {
    const yearly = applyPeriodicity(novaScenario, "year");
    expect(yearly.fixedCostsPerRound).toBeCloseTo(novaScenario.fixedCostsPerRound * 4, 6);
    expect(applyPeriodicity(novaScenario, "quarter")).toBe(novaScenario);
  });

  it("le scénario redimensionné reste valide (zod) et l'état entreprise suit", () => {
    for (const p of ["month", "year"] as const) {
      expect(() => parseScenarioConfig(applyPeriodicity(novaScenario, p))).not.toThrow();
      const c = applyPeriodicityToCompany(novaCompany("x", "X", "human"), p);
      expect(c.machineCapacity).toBeCloseTo(7000 * (p === "month" ? 1 / 3 : 4), 6);
      expect(c.finance.equity).toBe(150000); // le bilan (stock de valeur) ne change pas
    }
  });

  it("libellés de périodes", () => {
    expect(periodLabel(30, 2)).toBe("Mois 2");
    expect(periodLabel(90, 4)).toBe("Trimestre 4");
    expect(periodLabel(360, 1)).toBe("Année 1");
    expect(periodicityFromRoundDays(90)).toBe("quarter");
  });
});

describe("périodicité : parties complètes jouables au mois et à l'année", () => {
  for (const p of ["month", "year"] as const) {
    it(`NOVA en ${p} : 6 tours sans déséquilibre comptable ni faillite au tour 1`, () => {
      const scenario = applyPeriodicity(novaScenario, p);
      const companies = [
        applyPeriodicityToCompany(novaCompany("player", "NOVA", "bot", "balanced"), p),
        ...novaBots.map((b) =>
          applyPeriodicityToCompany(novaCompany(b.id, b.name, "bot", b.profile), p),
        ),
      ];
      const run = runGame({
        scenario,
        initialCompanies: companies,
        providers: Object.fromEntries(
          companies.map((c) => [
            c.id,
            (ctx: Parameters<Parameters<typeof runGame>[0]["providers"][string]>[0]) =>
              botDecisions(c.botProfile as BotProfile, {
                scenario,
                state: ctx.state,
                roundIndex: ctx.roundIndex,
                lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
              }),
          ]),
        ),
        seed: 20260101,
      });
      // le moteur lève une erreur si un bilan ne s'équilibre pas : arriver au bout suffit,
      // on vérifie en plus l'invariant TN et l'absence de faillite immédiate
      expect(run.rounds).toHaveLength(6);
      const first = run.rounds[0]!.results["player"]!;
      expect(first.functionalBalance.netTreasury).toBeGreaterThan(
        -scenario.finance.overdraftLimit,
      );
      for (const round of run.rounds) {
        const r = round.results["player"]!;
        expect(r.functionalBalance.netTreasury).toBeCloseTo(
          r.balanceSheet.cash - r.balanceSheet.overdraft,
          4,
        );
      }
    });
  }
});
