import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
  SimulationOutput,
} from "../types";
import { simulateRound } from "./index";

/**
 * Boucle de partie complète (étape 5) : enchaîne les tours en portant l'état
 * et les événements. Pure et déterministe — utilisée par la calibration
 * (doc 07 §4), les tests dorés et le rejeu ; la couche services l'utilisera
 * tour par tour avec les décisions humaines persistées.
 */

export interface DecisionProviderContext {
  scenario: EngineScenarioConfig;
  state: CompanyState;
  roundIndex: number;
  lastResult?: CompanyRoundResult;
}

export type DecisionProvider = (ctx: DecisionProviderContext) => RoundDecisions;

export interface GameRunResult {
  rounds: SimulationOutput[];
  finalCompanies: CompanyState[];
}

export function runGame(args: {
  scenario: EngineScenarioConfig;
  initialCompanies: CompanyState[];
  providers: Record<string, DecisionProvider>;
  seed: number;
}): GameRunResult {
  let companies = args.initialCompanies;
  let events: EventInstance[] = [];
  let lastResults: Record<string, CompanyRoundResult> = {};
  const rounds: SimulationOutput[] = [];

  for (let roundIndex = 1; roundIndex <= args.scenario.roundsCount; roundIndex++) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const state of companies) {
      const provider = args.providers[state.id];
      if (!provider) throw new Error(`Fournisseur de décisions manquant pour ${state.id}`);
      decisions[state.id] = provider({
        scenario: args.scenario,
        state,
        roundIndex,
        lastResult: lastResults[state.id],
      });
    }
    const output = simulateRound({
      scenario: args.scenario,
      roundIndex,
      companies,
      decisions,
      activeEvents: events,
      seed: args.seed,
    });
    rounds.push(output);
    companies = output.companies;
    events = output.events;
    lastResults = output.results;
  }

  return { rounds, finalCompanies: companies };
}

/** Unités vendues par une entreprise sur un tour (agrégat utile aux bots). */
export function soldUnits(result: CompanyRoundResult): number {
  return Object.values(result.market.bySegment).reduce((sum, s) => sum + s.sold, 0);
}
