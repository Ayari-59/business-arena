import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import { getGameView } from "@/services/game.service";
import { novaScenario } from "@/config/scenarios/nova";
import { periodLabel } from "@/config/scenarios/periodicity";
import { KpiCard } from "@/components/kpi-card";
import { RevenueChart, TreasuryChart } from "@/components/charts";
import { DecisionForm } from "@/components/decision-form";
import type { RoundDecisions } from "@/engine/types";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  raw_material_spike: "Hausse du prix des matières premières (+20 %)",
  machine_breakdown: "Panne machine : disponibilité réduite ce tour",
  viral_campaign: "Buzz sur le marché : la demande globale progresse",
};

const defaultDecisions = (roundDays: number): RoundDecisions => {
  const k = roundDays / 90; // les scénarios sont écrits en base trimestrielle
  return {
    price: 59,
    productionPlan: Math.round(4800 * k),
    marketingBudget: Math.round(6000 * k),
    qualityBudget: Math.round(2000 * k),
    maintenanceBudget: Math.round(4000 * k),
    finance: { newLoan: 0, loanRepayment: 0 },
  };
};

const segmentName = (code: string) =>
  novaScenario.market.segments.find((s) => s.code === code)?.name ?? code;

export default async function ArenaPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const userId = await getGuestUserId();
  if (!userId) notFound();
  const view = await getGameView(gameId, userId);
  if (!view) notFound();

  const r = view.lastResult;
  const finished = view.status === "finished";
  const treasuryTone = r && r.functionalBalance.netTreasury < 0 ? "critical" : "neutral";

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena · NOVA</p>
          <h1 className="text-2xl font-bold text-slate-50">{view.playerTeamName}</h1>
        </div>
        <p className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
          {finished
            ? "Partie terminée"
            : `${periodLabel(view.roundDays, view.currentRound)} / ${view.roundsCount}`}
        </p>
      </header>

      {r ? (
        <>
          <section aria-label="Indicateurs clés" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Chiffre d'affaires" value={formatEuro(r.incomeStatement.revenue)} hint={`Part de marché : ${formatPercent(r.market.totalShare)}`} />
            <KpiCard
              label="Résultat net"
              value={formatEuro(r.incomeStatement.netIncome)}
              tone={r.incomeStatement.netIncome >= 0 ? "good" : "critical"}
              hint={`Seuil de rentabilité : ${Number.isFinite(r.breakeven.breakEvenUnits) ? `${formatUnits(r.breakeven.breakEvenUnits)} u` : "inatteignable"}`}
            />
            <KpiCard
              label="Trésorerie nette"
              value={formatEuro(r.functionalBalance.netTreasury)}
              tone={treasuryTone}
              hint={`FRNG ${formatEuro(r.functionalBalance.frng)} − BFR ${formatEuro(r.functionalBalance.bfr)}`}
            />
            <KpiCard
              label="Production"
              value={`${formatUnits(r.production.produced)} u`}
              hint={`Utilisation : ${formatPercent(r.production.utilizationRate)}`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
              <RevenueChart history={view.history} roundsCount={view.roundsCount} />
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
              <TreasuryChart history={view.history} roundsCount={view.roundsCount} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">
                Marché du tour écoulé
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-2 pr-3 font-medium">Segment</th>
                      <th className="pb-2 pr-3 text-right font-medium">Demande</th>
                      <th className="pb-2 pr-3 text-right font-medium">Vendu</th>
                      <th className="pb-2 text-right font-medium">Manqué</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {Object.entries(r.market.bySegment)
                      .filter(([, d]) => d.potential > 0)
                      .map(([code, d]) => (
                        <tr key={code} className="border-t border-white/5">
                          <td className="py-2 pr-3">{segmentName(code)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{formatUnits(d.demandForCompany)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{formatUnits(d.sold)}</td>
                          <td className={`py-2 text-right tabular-nums ${d.lost > 1 ? "text-red-400" : ""}`}>
                            {formatUnits(d.lost)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {view.lastEvents.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {view.lastEvents.map((code) => (
                    <li key={code} className="rounded-lg border border-amber-400/20 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
                      ⚡ {EVENT_LABELS[code] ?? code}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">Classement</h2>
              <ol className="space-y-2">
                {view.ranking.map((row) => (
                  <li
                    key={row.name}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      row.isPlayer ? "bg-amber-400/10 text-amber-200" : "bg-slate-950 text-slate-300"
                    }`}
                  >
                    <span>
                      <span className="mr-2 text-slate-500">#{row.rank}</span>
                      {row.name}
                    </span>
                    <span className="tabular-nums">{formatEuro(row.cumulativeNetIncome)} cumulés</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-slate-500">
                Classement provisoire au résultat net cumulé — le Business Performance Index
                (performance économique, financière, commerciale…) arrive bientôt.
              </p>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-white/10 bg-slate-900 p-6 text-slate-300">
          <h2 className="text-lg font-semibold text-slate-100">
            {periodLabel(view.roundDays, 1)} — prise en main
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Vous reprenez <strong>NOVA</strong>, jeune fabricant de l&apos;enceinte portable NOVA One.
            Atelier d&apos;environ {formatUnits(7000 * (view.roundDays / 90))} unités par tour,
            4 opérateurs, {formatEuro(96000 * (view.roundDays / 90))} de charges de structure
            par tour, un coût variable d&apos;environ 38 €/unité. Deux concurrents vous
            attendent : SoundBox (agressif sur les prix) et Auris (positionnement premium).
            Fixez votre prix, votre production et vos budgets — puis observez.
          </p>
        </section>
      )}

      {finished ? (
        <section className="rounded-xl border border-amber-400/30 bg-slate-900 p-6 text-center">
          <h2 className="text-xl font-bold text-amber-300">
            {view.ranking.find((row) => row.isPlayer)?.rank === 1
              ? "🏆 Victoire ! NOVA domine le marché."
              : "Partie terminée — analysez votre trajectoire ci-dessus."}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Résultat cumulé : {formatEuro(view.ranking.find((row) => row.isPlayer)?.cumulativeNetIncome ?? 0)}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Rejouer
          </Link>
        </section>
      ) : (
        <section className="rounded-xl border border-white/10 bg-slate-900 p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Vos décisions — {periodLabel(view.roundDays, view.currentRound).toLowerCase()}
          </h2>
          {view.kind === "class" && view.pendingDecisions ? (
            <p className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
              ✓ Décisions validées — en attente de la clôture du tour par l&apos;enseignant.
              Vous pouvez encore les modifier ci-dessous. Actualisez la page après la clôture.
            </p>
          ) : null}
          <DecisionForm
            gameId={view.gameId}
            roundIndex={view.currentRound}
            periodName={periodLabel(view.roundDays, view.currentRound).toLowerCase()}
            defaults={view.pendingDecisions ?? view.lastDecisions ?? defaultDecisions(view.roundDays)}
            kind={view.kind}
            alreadySubmitted={view.pendingDecisions !== null}
          />
        </section>
      )}
    </main>
  );
}
