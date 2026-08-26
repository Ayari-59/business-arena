import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import { getGameView } from "@/services/game.service";
import { getTeamSituations } from "@/services/pedagogy.service";
import { SituationCard, SituationDebrief } from "@/components/situation-panel";
import { novaScenario } from "@/config/scenarios/nova";
import { periodLabel } from "@/config/scenarios/periodicity";
import { KpiCard } from "@/components/kpi-card";
import { EventCard } from "@/components/event-card";
import { cardByCode } from "@/config/events/cards";
import { BpiPanel } from "@/components/bpi-panel";
import { RevenueChart, TreasuryChart } from "@/components/charts";
import { DecisionForm } from "@/components/decision-form";
import { StudyReportsPanel } from "@/components/study-reports";
import { FinancialStatements } from "@/components/financial-statements";
import type { RoundDecisions } from "@/engine/types";

export const dynamic = "force-dynamic";

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
  const situations = await getTeamSituations(gameId, userId);

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
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
            Mon profil
          </Link>
          <Link href="/concepts" className="text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
            Fiches concepts
          </Link>
          <p
            className="rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-300"
            title="Niveau de difficulté de la partie"
          >
            Niveau {view.difficulty.level} · {view.difficulty.name}
          </p>
          <p className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
            {finished
              ? "Partie terminée"
              : `${periodLabel(view.roundDays, view.currentRound)} / ${view.roundsCount}`}
          </p>
        </div>
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
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
                    Cartes tirées ce tour
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {view.lastEvents.map((code, i) => (
                      <EventCard key={code} code={code} delayMs={i * 450} />
                    ))}
                  </div>
                </div>
              ) : null}
              {r.extraOrders ? (
                <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
                  📋 Commande ferme à {formatEuro(r.extraOrders.unitPrice)}/u :{" "}
                  {formatUnits(r.extraOrders.delivered)} u livrées du stock
                  {r.extraOrders.subcontracted > 0
                    ? ` + ${formatUnits(r.extraOrders.subcontracted)} u sous-traitées`
                    : ""}{" "}
                  sur {formatUnits(r.extraOrders.requested)} commandées
                  {r.extraOrders.delivered + r.extraOrders.subcontracted <
                  r.extraOrders.requested
                    ? " — le reste est perdu. L'anticipation a un prix."
                    : ", réglées comptant."}
                </p>
              ) : null}
              {r.orderOffer ? (
                r.orderOffer.accepted ? (
                  <p className="mt-3 rounded-lg border border-sky-400/30 bg-sky-950/30 px-3 py-2 text-xs text-sky-300">
                    📦 {r.orderOffer.title} acceptée :{" "}
                    {formatUnits(r.orderOffer.delivered)} u livrées à{" "}
                    {formatEuro(r.orderOffer.unitPrice)}/u, soit{" "}
                    {formatEuro(r.orderOffer.revenue)} de CA
                    {r.orderOffer.onCredit > 0.5
                      ? ` — dont ${formatEuro(r.orderOffer.onCredit)} en créances à ${r.orderOffer.paymentDelayDays} jours : votre BFR porte cette attente.`
                      : " — réglé comptant : la caisse encaisse, la marge est mince."}
                    {r.orderOffer.delivered < 0.5
                      ? " Stock insuffisant : rien n'a pu être livré."
                      : ""}
                  </p>
                ) : (
                  <p className="mt-3 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                    📦 {r.orderOffer.title} : commande déclinée — un choix aussi.
                  </p>
                )
              ) : null}
              <FinancialStatements
                result={r}
                price={view.lastDecisions?.price ?? null}
                materialCostPerUnit={view.costFacts.materialCostPerUnit}
                otherVariableCostPerUnit={view.costFacts.otherVariableCostPerUnit}
              />
              {view.studyReports ? <StudyReportsPanel reports={view.studyReports} /> : null}
              {r.capital && r.capital.applied < r.capital.requested - 0.5 ? (
                <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
                  🤝 Apport plafonné : {formatEuro(r.capital.applied)} retenus sur{" "}
                  {formatEuro(r.capital.requested)} demandés — l&apos;enveloppe des associés
                  est {r.capital.remainingAfter < 0.5 ? "épuisée" : `réduite à ${formatEuro(r.capital.remainingAfter)}`}.
                  Le capital n&apos;est pas un robinet.
                </p>
              ) : null}
              {r.debt && (r.debt.mandatoryRepayment > 0.5 || r.debt.newLoan > 0.5 || r.debt.earlyRepayment > 0.5) ? (
                <p className="mt-3 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                  🏦 Dette : échéance de {formatEuro(r.debt.mandatoryRepayment)} prélevée
                  {r.debt.earlyRepayment > 0.5
                    ? ` + ${formatEuro(r.debt.earlyRepayment)} d'anticipé`
                    : ""}
                  {r.debt.newLoan > 0.5 ? ` · nouvel emprunt ${formatEuro(r.debt.newLoan)}` : ""}
                  {" — restant dû : "}
                  {formatEuro(r.debt.outstanding)}
                  {r.debt.nextMandatory > 0.5
                    ? ` (prochaine échéance ${formatEuro(r.debt.nextMandatory)})`
                    : ""}
                </p>
              ) : null}
              {r.treasury ? (
                <p
                  className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                    r.treasury.crisis
                      ? "border-red-400/40 bg-red-950/40 text-red-300"
                      : r.treasury.forcedFactored > 0
                        ? "border-orange-400/40 bg-orange-950/30 text-orange-300"
                        : "border-teal-400/30 bg-teal-950/30 text-teal-300"
                  }`}
                >
                  💶 Trésorerie :
                  {r.treasury.discounted > 0.5
                    ? ` escompte ${formatEuro(r.treasury.discounted)} ·`
                    : ""}
                  {r.treasury.factored > 0.5
                    ? ` affacturage ${formatEuro(r.treasury.factored)} ·`
                    : ""}
                  {r.treasury.forcedFactored > 0.5
                    ? ` ⚠️ affacturage FORCÉ par la banque ${formatEuro(r.treasury.forcedFactored)} (découvert au-delà du plafond) ·`
                    : ""}
                  {" coût financier "}
                  {formatEuro(r.treasury.financingCost)}
                  {r.treasury.crisis
                    ? " — 🚨 CRISE DE TRÉSORERIE : plafond dépassé et plus de créances à céder."
                    : ""}
                </p>
              ) : null}
              {r.investment ? (
                <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
                  🏗️ Investissement : +{formatUnits(r.investment.capacityUnits)} u de capacité
                  machine ({formatEuro(r.investment.outlay)}) — en service au prochain tour,
                  amortissement en hausse.
                </p>
              ) : null}
              {r.qualityCosts &&
              (r.qualityCosts.internalFailure > 0.5 || r.qualityCosts.externalFailure > 0.5) ? (
                <p className="mt-3 rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                  🧪 Coûts de la non-qualité : {formatUnits(r.qualityCosts.defectUnits)} u de
                  rebuts ({formatEuro(r.qualityCosts.internalFailure)})
                  {r.qualityCosts.returnedUnits > 0.5
                    ? ` · ${formatUnits(r.qualityCosts.returnedUnits)} u retournées (${formatEuro(r.qualityCosts.externalFailure)})`
                    : ""}{" "}
                  — face à {formatEuro(r.qualityCosts.prevention)} de prévention. Le bon niveau
                  de qualité est un calcul, pas une vertu.
                </p>
              ) : null}
              {r.hr ? (
                <p className="mt-3 rounded-lg border border-violet-400/30 bg-violet-950/30 px-3 py-2 text-xs text-violet-300">
                  👥 RH — effectif {r.hr.headcount}
                  {r.hr.hired > 0 ? ` · +${r.hr.hired} embauche${r.hr.hired > 1 ? "s" : ""} (arrivée au prochain tour)` : ""}
                  {r.hr.fired > 0 ? ` · ${r.hr.fired} licenciement${r.hr.fired > 1 ? "s" : ""}` : ""}
                  {r.hr.departed > 0 ? " · 1 démission (salaires sous le marché !)" : ""}
                  {r.hr.trainingBudget > 0 ? ` · formation ${formatEuro(r.hr.trainingBudget)}` : ""}
                  {" · coût RH du tour : "}
                  {formatEuro(r.hr.cost)}
                </p>
              ) : null}
              {r.insurance ? (
                <p className="mt-3 rounded-lg border border-sky-400/30 bg-sky-950/30 px-3 py-2 text-xs text-sky-300">
                  🛡️ Assurance souscrite ({formatEuro(r.insurance.premium)}).{" "}
                  {r.insurance.neutralizedEvents.length > 0
                    ? `Sinistre couvert ce tour : ${r.insurance.neutralizedEvents
                        .map((c) => cardByCode.get(c)?.title ?? c)
                        .join(", ")} — effets neutralisés pour votre entreprise.`
                    : "Aucun sinistre couvert ce tour — la prime était le prix de la sérénité."}
                </p>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <h2 className="mb-3 text-sm font-semibold text-slate-200">
                  Classement — Business Performance Index
                </h2>
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
                      <span className="tabular-nums">
                        <span className="font-semibold">{row.bpi.toFixed(1)}</span>
                        <span className="ml-2 text-xs text-slate-500">
                          {formatEuro(row.cumulativeNetIncome)} cumulés
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs text-slate-500">
                  Le BPI (0-100) pondère 7 dimensions : économique 30 %, financière 20 %,
                  commerciale 15 %, opérationnelle 10 %, rentabilité 10 %, stratégie 10 %,
                  maîtrise des modèles 5 %. Les derniers tours pèsent plus lourd.
                </p>
              </div>
              {view.playerDimensions ? <BpiPanel dimensions={view.playerDimensions} /> : null}
            </div>
          </section>

          {situations.debriefed.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">
                Analyse du tour écoulé — ce qu&apos;il fallait voir
              </h2>
              {situations.debriefed.map((s) => (
                <SituationDebrief key={s.instanceId} situation={s} />
              ))}
            </section>
          ) : null}
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

      {!finished && view.seasonNotes.length > 0 ? (
        <section className="rounded-xl border border-sky-400/20 bg-slate-900 px-4 py-3 text-sm text-sky-200">
          🌤️ Saison du tour :{" "}
          {view.seasonNotes
            .map(
              (n) =>
                `${n.name} ×${n.coef.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} (${
                  n.coef > 1 ? "haute saison" : "basse saison"
                })`,
            )
            .join(" · ")}
          {" — "}dimensionnez production et stocks en conséquence.
        </section>
      ) : null}

      {!finished && view.announcedEventCards.length > 0 ? (
        <section className="rounded-xl border border-amber-400/30 bg-slate-900 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            ⚡ Votre enseignant a tiré une carte — elle s&apos;appliquera à ce tour
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {view.announcedEventCards.map((card, i) => (
              <EventCard
                key={`${card.code}-${card.teamId ?? "market"}`}
                code={card.code}
                delayMs={i * 450}
                announced
                targetLabel={
                  card.teamId
                    ? card.isMyTeam
                      ? "🎯 Votre équipe"
                      : `→ ${card.teamName ?? "Une autre équipe"}`
                    : "Toute la classe"
                }
                highlight={card.isMyTeam}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Adaptez vos décisions en conséquence : c&apos;est tout l&apos;intérêt d&apos;être prévenu.
          </p>
        </section>
      ) : null}

      {!finished && situations.current.length > 0 ? (
        <section className="space-y-4">
          {situations.current.map((s) => (
            <SituationCard key={s.instanceId} gameId={view.gameId} situation={s} />
          ))}
        </section>
      ) : null}

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
            insuranceOffer={
              view.insuranceOffer
                ? {
                    premium: view.insuranceOffer.premium,
                    coveredLabels: view.insuranceOffer.coveredEventCodes.map(
                      (c) => cardByCode.get(c)?.title ?? c,
                    ),
                  }
                : null
            }
            enabled={view.enabledDecisions}
            investmentOffer={view.investmentOffer}
            debtSchedule={view.debtSchedule}
            treasuryOffer={view.treasuryOffer}
            orderOffer={view.orderOffer}
            studiesOffer={view.studiesOffer}
            capitalAllowance={view.capitalAllowance}
          />
        </section>
      )}
    </main>
  );
}
