/**
 * Calibration de scénario (doc 07 §4, doc 09 §5) : joue le scénario avec les
 * stratégies types face aux bots officiels et affiche les trajectoires.
 * Les invariants sont automatisés dans tests/scenarios/ ; ce script sert à
 * RÉGLER les valeurs quand un invariant casse.
 *
 * Usage : npx tsx scripts/calibrate.ts [codeScénario] [graine]
 *   npx tsx scripts/calibrate.ts              → nova, graine par défaut
 *   npx tsx scripts/calibrate.ts hotel        → hôtel, graine par défaut
 *   npx tsx scripts/calibrate.ts bistrot 42   → bistrot, graine 42
 */
import { botDecisions, type BotProfile } from "../src/engine/bots";
import { runGame, soldUnits } from "../src/engine/simulation/runGame";
import { DEFAULT_SCENARIO_CODE, SCENARIOS, scenarioByCode } from "../src/config/scenarios/registry";
import type { CompanyRoundResult, CompanyState } from "../src/engine/types";

const codeArg = process.argv[2];
if (codeArg && !SCENARIOS.some((s) => s.code === codeArg)) {
  console.error(
    `Scénario inconnu « ${codeArg} ». Disponibles : ${SCENARIOS.map((s) => s.code).join(", ")}`,
  );
  process.exit(1);
}
const definition = scenarioByCode(codeArg ?? DEFAULT_SCENARIO_CODE);
const seed = Number(process.argv[3] ?? 20260101);
const strategies: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").padStart(10);

const s = definition.scenario;
const unitVariable = s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit;
console.log(`\n████ ${definition.title} (${definition.code}) ████`);
console.log(
  `coût variable unitaire ${unitVariable.toFixed(2)} € · structure ${s.fixedCostsPerRound.toLocaleString("fr-FR")} €/tour` +
    (s.perishable ? " · activité PÉRISSABLE" : ""),
);

for (const strategy of strategies) {
  const companies: CompanyState[] = [
    definition.company("player", definition.playerTeamName, "bot", strategy),
    ...definition.bots.slice(0, 2).map((b) => definition.company(b.id, b.name, "bot", b.profile)),
  ];
  const lastSold: Record<string, number | undefined> = {};
  const run = runGame({
    scenario: definition.scenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: definition.scenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : lastSold[c.id],
          }),
      ]),
    ),
    seed,
  });

  console.log(`\n━━━ Stratégie joueur : ${strategy} (graine ${seed}) ━━━`);
  console.log("tour |     ventes |         CA |   rés. net |       TN   |       BFR |  stock | événements");
  let cumulative = 0;
  run.rounds.forEach((round, i) => {
    const r = round.results["player"]!;
    cumulative += r.incomeStatement.netIncome;
    const state = round.companies.find((c) => c.id === "player")!;
    console.log(
      `  ${i + 1}  |${fmt(soldUnits(r))} |${fmt(r.incomeStatement.revenue)} |${fmt(
        r.incomeStatement.netIncome,
      )} |${fmt(r.functionalBalance.netTreasury)} |${fmt(r.functionalBalance.bfr)} |${Math.round(
        state.finishedGoods.quantity,
      )
        .toString()
        .padStart(6)} | ${round.newEvents.map((e) => e.code).join(", ")}`,
    );
  });
  console.log(`résultat net cumulé : ${Math.round(cumulative).toLocaleString("fr-FR")} €`);
}
