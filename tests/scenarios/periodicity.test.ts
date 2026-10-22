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
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { DEFAULT_RSE_CONFIG } from "../../src/engine/rse";

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

  it("libellé d'un tour : « Tour N » quelle que soit la durée du tour", () => {
    // Choix produit : l'affichage joueur est unifié sur « tour ». La durée
    // reste un paramètre de la partie (sélecteur), mais ne teinte plus le libellé.
    expect(periodLabel(30, 2)).toBe("Tour 2");
    expect(periodLabel(90, 4)).toBe("Tour 4");
    expect(periodLabel(360, 1)).toBe("Tour 1");
    expect(periodicityFromRoundDays(90)).toBe("quarter");
  });
});

describe("périodicité : parties complètes jouables au mois et à l'année", () => {
  for (const p of ["month", "year"] as const) {
    it(`NOVA en ${p} : 6 tours sans déséquilibre comptable ni faillite au tour 1`, () => {
      const scenario = applyPeriodicity(novaScenario, p);
      const companies = [
        applyPeriodicityToCompany(novaCompany("player", "NOVA", "bot", "balanced"), p),
        ...novaBots.slice(0, 2).map((b) =>
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

/**
 * LE HASARD DU MONDE NE DOIT PAS DÉPENDRE DE LA DURÉE DU TOUR.
 *
 * `probability` est une probabilité de tirage PAR TOUR. Laissée telle quelle,
 * elle fait d'une partie mensuelle un monde trois fois plus agité qu'une partie
 * trimestrielle sur la même année civile (mesuré : 3,1 à 3,6 chocs par an au
 * mois contre 0,60 à 0,80 au trimestre) et d'une partie annuelle un monde
 * presque immobile (0,00 à 0,05). Elle se compose donc comme un taux de perte.
 */
describe("périodicité : la probabilité des événements se compose", () => {
  const annuelle = (p: number, toursParAn: number) => 1 - Math.pow(1 - p, toursParAn);

  it("la chance annuelle de chaque carte est la même aux trois périodicités", () => {
    for (const def of SCENARIOS) {
      const trimestre = def.scenario;
      const mois = applyPeriodicity(trimestre, "month");
      const annee = applyPeriodicity(trimestre, "year");
      for (const [i, e] of trimestre.events.entries()) {
        const repere = `${def.code}/${e.code}`;
        expect(annuelle(mois.events[i]!.probability, 12), repere).toBeCloseTo(
          annuelle(e.probability, 4),
          9,
        );
        expect(annuelle(annee.events[i]!.probability, 1), repere).toBeCloseTo(
          annuelle(e.probability, 4),
          9,
        );
      }
    }
  });

  it("à l'année, la mauvaise presse et l'amende RSE gardent leur chance annuelle ; l'amende vaut un trimestre", () => {
    for (const def of SCENARIOS) {
      const q = (def.scenario.rse ?? DEFAULT_RSE_CONFIG).cards;
      const a = applyPeriodicity(def.scenario, "year").rse!.cards;
      expect(annuelle(a.badBuzzProbability, 1), def.code).toBeCloseTo(annuelle(q.badBuzzProbability, 4), 9);
      expect(annuelle(a.sanctionProbability, 1), def.code).toBeCloseTo(annuelle(q.sanctionProbability, 4), 9);
      // Le cas mord : la chance d'une année dépasse celle d'un trimestre.
      expect(a.badBuzzProbability, def.code).toBeGreaterThan(q.badBuzzProbability);
      // Une amende tirée vaut un trimestre : l'échelle du marketing, elle, compte l'année.
      expect(a.fineAmount * applyPeriodicity(def.scenario, "year").marketing.scale, def.code).toBeCloseTo(
        q.fineAmount * def.scenario.marketing.scale,
        6,
      );
      // Au mois, le calendrier s'en charge (`auCalendrierMensuel`) : ici, rien ne bouge.
      expect(applyPeriodicity(def.scenario, "month").rse, def.code).toEqual(def.scenario.rse);
    }
  });

  it("une carte réservée à l'enseignant (p = 0) n'est jamais tirée, quelle que soit la durée", () => {
    const reservees = SCENARIOS.flatMap((d) => d.scenario.events.filter((e) => e.probability <= 0));
    expect(reservees.length).toBeGreaterThan(0);
    for (const p of ["month", "year"] as const) {
      for (const def of SCENARIOS) {
        const redimensionne = applyPeriodicity(def.scenario, p);
        for (const [i, e] of def.scenario.events.entries()) {
          if (e.probability <= 0) expect(redimensionne.events[i]!.probability).toBe(0);
        }
      }
    }
  });
});
