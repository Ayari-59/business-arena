/**
 * Calibration de scénario (doc 07 §4, doc 09 §5) : joue le scénario avec les
 * stratégies types face aux bots officiels et affiche les trajectoires.
 * Les invariants sont automatisés dans tests/scenarios/ ; ce script sert à
 * RÉGLER les valeurs quand un invariant casse.
 *
 * Usage : npx tsx scripts/calibrate.ts [seed]
 */
import { botDecisions, type BotProfile } from "../src/engine/bots";
import { runGame, soldUnits } from "../src/engine/simulation/runGame";
import { novaBots, novaCompany, novaScenario } from "../src/config/scenarios/nova";

const seed = Number(process.argv[2] ?? 20260101);
const strategies: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").padStart(10);

for (const strategy of strategies) {
  const companies = [
    novaCompany("player", "NOVA", "bot", strategy),
    ...novaBots.map((b) => novaCompany(b.id, b.name, "bot", b.profile)),
  ];
  const lastSold: Record<string, number | undefined> = {};
  const run = runGame({
    scenario: novaScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: typeof c; roundIndex: number; lastResult?: import("../src/engine/types").CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: novaScenario,
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
