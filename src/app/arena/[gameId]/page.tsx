import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import { getGameView } from "@/services/game.service";
import { getTeamSituations } from "@/services/pedagogy.service";
import { SituationCard, SituationDebrief } from "@/components/situation-panel";
import { periodLabel } from "@/config/scenarios/periodicity";
import { KpiCard } from "@/components/kpi-card";
import { EventCard } from "@/components/event-card";
import { cardByCode } from "@/config/events/cards";
import { BpiPanel } from "@/components/bpi-panel";
import { RevenueChart, TreasuryChart } from "@/components/charts";
import { DecisionForm } from "@/components/decision-form";
import { TeamNameForm } from "@/components/team-name-form";
import { StudyReportsPanel } from "@/components/study-reports";
import { FinancialStatements } from "@/components/financial-statements";
import { DilemmaCard, ParametersPanels } from "@/components/decision-context";
import { SalesHistory } from "@/components/sales-history";
import { RoundStatusPoller } from "@/components/round-status-poller";
import { RoundStatusBanner } from "@/components/round-status-banner";
import type { KpiFormat } from "@/config/scenarios/sector-kpis";
import { surtitreDePartie } from "@/config/scenarios/presentation";

export const dynamic = "force-dynamic";

/**
 * La signature du scénario (« Hôtel 3 étoiles de 60 chambres. ») est écrite pour
 * être lue seule, dans le sélecteur de secteur. Reprise en apposition après le
 * nom de l'entreprise, elle a besoin d'une minuscule et d'aucun point final.
 */
function appositive(tagline: string): string {
  const trimmed = tagline.trim().replace(/\.$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** Mise en forme d'un indicateur métier selon son unité. */
function formatKpi(value: number, format: KpiFormat): string {
  switch (format) {
    case "euro":
      return formatEuro(value);
    case "percent":
      return formatPercent(value);
    case "days":
      return `${Math.round(value)} j`;
    case "units":
      return formatUnits(value);
  }
}

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
      {/* ── 1. Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            {surtitreDePartie(view.intro.title, view.playerTeamName)}
          </p>
          <h1 className="text-2xl font-bold text-slate-50">{view.playerTeamName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
            Mon profil
          </Link>
          <Link href="/notions" className="text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
            Fiches notions
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

      {/* ── 2. Bandeau d'état ── */}
      <RoundStatusBanner
        currentRound={view.currentRound}
        roundsCount={view.roundsCount}
        roundDays={view.roundDays}
        pendingDecisions={view.pendingDecisions !== null}
        kind={view.kind}
        finished={finished}
      />

      {/* ── 3. Nommage de l'équipe ── */}
      {view.peutSeNommer ? (
        <TeamNameForm gameId={gameId} nomActuel={view.playerTeamName} />
      ) : null}

      {/* ── 4. Briefing / Introduction ── */}
      {!r ? (
        <section className="space-y-4 rounded-xl border border-white/10 bg-slate-900 p-6 text-slate-300">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {periodLabel(view.roundDays, 1)} · prise en main
            </h2>
            <p className="mt-2 text-sm leading-relaxed">
              Vous reprenez <strong>{view.intro.company}</strong>,{" "}
              {appositive(view.intro.tagline)}. {view.intro.briefing}
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-slate-950 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Ce que vous trouvez en arrivant
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{view.intro.context}</p>
          </div>

          <ParametersPanels
            intro={view.intro}
            vocabulary={view.vocabulary}
            capacityFacts={view.capacityFacts}
          />

          <DilemmaCard
            title="Votre premier arbitrage"
            question={view.intro.dilemma.question}
            routes={view.intro.dilemma.routes}
          />

          <p className="text-sm leading-relaxed">
            Fixez votre {view.vocabulary.priceLabel.toLowerCase()}, votre volume et vos budgets,
            puis observez.
          </p>
        </section>
      ) : null}

      {!finished && view.roundBriefing ? (
        <section className="space-y-4 rounded-xl border border-white/10 bg-slate-900 p-6 text-slate-300">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {periodLabel(view.roundDays, view.currentRound)} · où vous en êtes
            </h2>
            <p className="mt-2 text-sm leading-relaxed">{view.roundBriefing.headline}</p>
          </div>

          <ParametersPanels
            intro={view.intro}
            vocabulary={view.vocabulary}
            capacityFacts={view.capacityFacts}
          />

          <DilemmaCard
            title="L'arbitrage de ce tour"
            question={view.roundBriefing.question}
            routes={view.roundBriefing.routes}
          />
        </section>
      ) : null}

      {/* ── 5. Situations pédagogiques courantes ── */}
      {!finished && situations.current.length > 0 ? (
        <section className="space-y-4">
          {situations.current.map((s) => (
            <SituationCard key={s.instanceId} gameId={view.gameId} situation={s} />
          ))}
        </section>
      ) : null}

      {/* ── 6. Formulaire de décision / Écran de fin ── */}
      {finished ? (
        <section className="rounded-xl border border-amber-400/30 bg-slate-900 p-6 text-center">
          <h2 className="text-xl font-bold text-amber-300">
            {view.ranking.find((row) => row.isPlayer)?.rank === 1
              ? `🏆 Victoire ! ${view.playerTeamName} domine le marché.`
              : "Partie terminée. Analysez votre trajectoire ci-dessus."}
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
        <section id="decisions" className="rounded-xl border border-white/10 bg-slate-900 p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Vos décisions · {periodLabel(view.roundDays, view.currentRound).toLowerCase()}
          </h2>
          <DecisionForm
            gameId={view.gameId}
            roundIndex={view.currentRound}
            vocabulary={view.vocabulary}
            periodName={periodLabel(view.roundDays, view.currentRound).toLowerCase()}
            defaults={view.pendingDecisions ?? view.lastDecisions ?? view.startingDecisions}
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
            distributableReserves={view.distributableReserves}
            investmentOffer={view.investmentOffer}
            debtSchedule={view.debtSchedule}
            treasuryOffer={view.treasuryOffer}
            bankFile={view.bankFile}
            orderOffer={view.orderOffer}
            studiesOffer={view.studiesOffer}
            capitalAllowance={view.capitalAllowance}
            insuranceFormulas={view.insuranceFormulas}
            suppliersOffer={view.suppliersOffer}
            capacityFacts={view.capacityFacts}
          />
        </section>
      )}

      {/* ── 7. Débriefing pédagogique (tour précédent) ── */}
      {r && situations.debriefed.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">
            Analyse du tour écoulé : ce qu&apos;il fallait voir
          </h2>
          {situations.debriefed.map((s) => (
            <SituationDebrief key={s.instanceId} situation={s} />
          ))}
        </section>
      ) : null}

      {/* ── 8. Résumé des performances ── */}
      {r ? (
        <>
          <section aria-label="Indicateurs clés" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Chiffre d'affaires" value={formatEuro(r.incomeStatement.revenue)} hint={`Part de marché : ${formatPercent(r.market.totalShare)}`} />
            <KpiCard
              label="Résultat net"
              value={formatEuro(r.incomeStatement.netIncome)}
              tone={r.incomeStatement.netIncome >= 0 ? "good" : "critical"}
              hint={`Seuil de rentabilité : ${Number.isFinite(r.breakeven.breakEvenUnits) ? `${formatUnits(r.breakeven.breakEvenUnits)} ${view.vocabulary.units}` : "inatteignable"}`}
            />
            <KpiCard
              label="Trésorerie nette"
              value={formatEuro(r.functionalBalance.netTreasury)}
              tone={treasuryTone}
              hint={`FRNG ${formatEuro(r.functionalBalance.frng)} − BFR ${formatEuro(r.functionalBalance.bfr)}`}
            />
            <KpiCard
              label={view.vocabulary.productionLabel}
              value={`${formatUnits(r.production.produced)} ${view.vocabulary.units}`}
              hint={`Utilisation : ${formatPercent(r.production.utilizationRate)}`}
            />
          </section>

          {/* ── 9. Classement ── */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">
                Classement · Business Performance Index
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
          </section>
        </>
      ) : null}

      {/* ── 10. Contexte prospectif ── */}
      {!finished && view.announcedEventCards.length > 0 ? (
        <section className="rounded-xl border border-amber-400/30 bg-slate-900 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            ⚡ Votre enseignant a tiré une carte : elle s&apos;appliquera à ce tour
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
          {". "}Dimensionnez votre volume en conséquence.
        </section>
      ) : null}

      {/* ── 11. Résultats détaillés (repliable) ── */}
      {r ? (
        <details className="group rounded-xl border border-white/10 bg-slate-900">
          <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-slate-200">
            Résultats détaillés
            <span className="ml-2 text-xs text-slate-500 group-open:hidden">▸</span>
            <span className="ml-2 text-xs text-slate-500 hidden group-open:inline">▾</span>
          </summary>
          <div className="space-y-6 px-5 pb-5">
            {view.sectorKpis.length > 0 ? (
              <section aria-label="Indicateurs du métier">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  📐 Indicateurs du métier
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {view.sectorKpis.map((k) => (
                    <div
                      key={k.key}
                      className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5"
                    >
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">{k.label}</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-100">
                        {formatKpi(k.value, k.format)}
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-slate-500">{k.hint}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
                <RevenueChart history={view.history} roundsCount={view.roundsCount} />
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
                <TreasuryChart history={view.history} roundsCount={view.roundsCount} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-200">
                Marché du tour écoulé
              </h3>
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
                          <td className="py-2 pr-3">{view.segmentNames[code] ?? code}</td>
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
            </section>

            {view.lastEvents.length > 0 ? (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Cartes tirées ce tour
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {view.lastEvents.map((code, i) => (
                    <EventCard key={code} code={code} delayMs={i * 450} />
                  ))}
                </div>
              </section>
            ) : null}

            {r.extraOrders ? (
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
                📋 Commande ferme à {formatEuro(r.extraOrders.unitPrice)}/{view.vocabulary.unit} :{" "}
                {formatUnits(r.extraOrders.delivered)} {view.vocabulary.units} livrés
                {r.extraOrders.subcontracted > 0
                  ? ` + ${formatUnits(r.extraOrders.subcontracted)} u sous-traitées`
                  : ""}{" "}
                sur {formatUnits(r.extraOrders.requested)} commandées
                {r.extraOrders.delivered + r.extraOrders.subcontracted <
                r.extraOrders.requested
                  ? ", le reste est perdu. L'anticipation a un prix."
                  : ", réglées comptant."}
              </p>
            ) : null}

            {r.orderOffer ? (
              r.orderOffer.accepted ? (
                <p className="rounded-lg border border-sky-400/30 bg-sky-950/30 px-3 py-2 text-xs text-sky-300">
                  📦 {r.orderOffer.title} acceptée :{" "}
                  {formatUnits(r.orderOffer.delivered)} u livrées à{" "}
                  {formatEuro(r.orderOffer.unitPrice)}/u, soit{" "}
                  {formatEuro(r.orderOffer.revenue)} de CA
                  {r.orderOffer.onCredit > 0.5
                    ? `, dont ${formatEuro(r.orderOffer.onCredit)} en créances à ${r.orderOffer.paymentDelayDays} jours : votre BFR porte cette attente.`
                    : ", réglé comptant : la caisse encaisse, la marge est mince."}
                  {r.orderOffer.delivered < 0.5
                    ? ` ${view.vocabulary.leftoverLabel} insuffisant : rien n'a pu être livré.`
                    : ""}
                </p>
              ) : (
                <p className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                  📦 {r.orderOffer.title} : commande déclinée. Un choix aussi.
                </p>
              )
            ) : null}

            {view.forecastReview ? (
              <div className="rounded-lg border border-sky-400/25 bg-sky-950/20 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  🏦 Votre plan face au réalisé
                </h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="pb-1 pr-3 font-medium" />
                        <th className="pb-1 pr-3 text-right font-medium">Prévu</th>
                        <th className="pb-1 pr-3 text-right font-medium">Réalisé</th>
                        <th className="pb-1 pr-3 text-right font-medium">Écart</th>
                        <th className="pb-1 text-right font-medium">Écart relatif</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {view.forecastReview.lines.map((line) => {
                        const show = (value: number) =>
                          line.format === "euro" ? formatEuro(value) : formatUnits(value);
                        const gap = line.actual - line.forecast;
                        const severe = line.relative !== null && Math.abs(line.relative) > 0.1;
                        return (
                          <tr key={line.label} className="border-t border-white/5">
                            <td className="py-1.5 pr-3">{line.label}</td>
                            <td className="py-1.5 pr-3 text-right tabular-nums text-slate-400">
                              {show(line.forecast)}
                            </td>
                            <td className="py-1.5 pr-3 text-right tabular-nums text-slate-100">
                              {show(line.actual)}
                            </td>
                            <td
                              className={`py-1.5 pr-3 text-right tabular-nums ${
                                severe ? "text-amber-300" : "text-emerald-300"
                              }`}
                            >
                              {gap >= 0 ? "+" : ""}
                              {show(gap)}
                            </td>
                            <td
                              className={`py-1.5 text-right tabular-nums ${
                                severe ? "text-amber-300" : "text-emerald-300"
                              }`}
                            >
                              {line.relative === null
                                ? "—"
                                : `${line.relative >= 0 ? "+" : ""}${formatPercent(line.relative)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {r.bank && r.bank.reliability !== null ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    Votre banque a lu cet écart. Plan jugé juste à{" "}
                    <strong className="text-slate-200">
                      {Math.round(r.bank.reliability * 100)} %
                    </strong>{" "}
                    : sa confiance passe de {Math.round(r.bank.trustBefore * 100)} % à{" "}
                    <strong className="text-slate-200">
                      {Math.round(r.bank.trustAfter * 100)} %
                    </strong>
                    , ce qui fixe le découvert qu&apos;elle vous consentira au tour suivant, et
                    son taux.
                  </p>
                ) : null}
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  L&apos;écart vaut mieux que la prévision : il dit ce que vous n&apos;aviez pas
                  vu. Un écart qui se répète dans le même sens n&apos;est pas de la malchance,
                  c&apos;est un biais dans votre modèle.
                </p>
              </div>
            ) : null}

            {view.studyReports ? <StudyReportsPanel reports={view.studyReports} /> : null}
          </div>
        </details>
      ) : null}

      {/* ── 12. Détails financiers (repliable) ── */}
      {r ? (
        <details className="group rounded-xl border border-white/10 bg-slate-900">
          <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-slate-200">
            Détails financiers
            <span className="ml-2 text-xs text-slate-500 group-open:hidden">▸</span>
            <span className="ml-2 text-xs text-slate-500 hidden group-open:inline">▾</span>
          </summary>
          <div className="space-y-4 px-5 pb-5">
            <FinancialStatements
              result={r}
              price={view.lastDecisions?.price ?? null}
              materialCostPerUnit={view.costFacts.materialCostPerUnit}
              otherVariableCostPerUnit={view.costFacts.otherVariableCostPerUnit}
              vocabulary={view.vocabulary}
            />

            {r.bank && r.bank.loanRequested > 0 && r.bank.loanGranted === 0 ? (
              <p className="rounded-lg border border-rose-400/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
                🏦 Emprunt refusé : {formatEuro(r.bank.loanRequested)} demandés sans plan de
                trésorerie à l&apos;appui. Une banque ne finance pas un besoin qu&apos;on ne
                lui a pas chiffré. L&apos;argent n&apos;est jamais entré en caisse.
              </p>
            ) : null}

            {r.capital && r.capital.applied < r.capital.requested - 0.5 ? (
              <p className="rounded-lg border border-amber-400/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
                🤝 Apport plafonné : {formatEuro(r.capital.applied)} retenus sur{" "}
                {formatEuro(r.capital.requested)} demandés. L&apos;enveloppe des associés
                est {r.capital.remainingAfter < 0.5 ? "épuisée" : `réduite à ${formatEuro(r.capital.remainingAfter)}`}.
                Le capital n&apos;est pas un robinet.
              </p>
            ) : null}

            {r.debt && (r.debt.mandatoryRepayment > 0.5 || r.debt.newLoan > 0.5 || r.debt.earlyRepayment > 0.5) ? (
              <p className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                🏦 Dette : échéance de {formatEuro(r.debt.mandatoryRepayment)} prélevée
                {r.debt.earlyRepayment > 0.5
                  ? ` + ${formatEuro(r.debt.earlyRepayment)} d'anticipé`
                  : ""}
                {r.debt.newLoan > 0.5 ? ` · nouvel emprunt ${formatEuro(r.debt.newLoan)}` : ""}
                {" · restant dû : "}
                {formatEuro(r.debt.outstanding)}
                {r.debt.nextMandatory > 0.5
                  ? ` (prochaine échéance ${formatEuro(r.debt.nextMandatory)})`
                  : ""}
              </p>
            ) : null}

            {r.treasury ? (
              <p
                className={`rounded-lg border px-3 py-2 text-xs ${
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
                {r.treasury.matured > 0.5
                  ? ` · placement arrivé à terme ${formatEuro(r.treasury.matured)} (+${formatEuro(r.treasury.placementIncome)} d'intérêts)`
                  : ""}
                {r.treasury.placed > 0.5
                  ? ` · ${formatEuro(r.treasury.placed)} placés jusqu'au tour suivant`
                  : ""}
                {r.treasury.crisis
                  ? ". 🚨 CRISE DE TRÉSORERIE : plafond dépassé et plus de créances à céder."
                  : ""}
              </p>
            ) : null}

            {r.investment ? (
              <p className="rounded-lg border border-amber-400/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
                🏗️ Investissement : +{formatUnits(r.investment.capacityUnits)} u de
                capacité ({formatEuro(r.investment.outlay)}), en service au prochain tour,
                avec un amortissement en hausse.
              </p>
            ) : null}

            {r.qualityCosts &&
            (r.qualityCosts.internalFailure > 0.5 || r.qualityCosts.externalFailure > 0.5) ? (
              <p className="rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                🧪 Coûts de la non-qualité : {formatUnits(r.qualityCosts.defectUnits)} u de
                rebuts ({formatEuro(r.qualityCosts.internalFailure)})
                {r.qualityCosts.returnedUnits > 0.5
                  ? ` · ${formatUnits(r.qualityCosts.returnedUnits)} u retournées (${formatEuro(r.qualityCosts.externalFailure)})`
                  : ""}{" "}
                , face à {formatEuro(r.qualityCosts.prevention)} de prévention. Le bon niveau
                de qualité est un calcul, pas une vertu.
              </p>
            ) : null}

            {r.hr ? (
              <p className="rounded-lg border border-violet-400/30 bg-violet-950/30 px-3 py-2 text-xs text-violet-300">
                👥 RH · effectif {r.hr.headcount}
                {r.hr.hired > 0 ? ` · +${r.hr.hired} embauche${r.hr.hired > 1 ? "s" : ""} (arrivée au prochain tour)` : ""}
                {r.hr.fired > 0 ? ` · ${r.hr.fired} licenciement${r.hr.fired > 1 ? "s" : ""}` : ""}
                {r.hr.departed > 0 ? " · 1 démission (salaires sous le marché !)" : ""}
                {r.hr.trainingBudget > 0 ? ` · formation ${formatEuro(r.hr.trainingBudget)}` : ""}
                {" · coût RH du tour : "}
                {formatEuro(r.hr.cost)}
              </p>
            ) : null}

            {r.insurance ? (
              <p className="rounded-lg border border-sky-400/30 bg-sky-950/30 px-3 py-2 text-xs text-sky-300">
                🛡️ Assurance souscrite ({formatEuro(r.insurance.premium)}).{" "}
                {r.insurance.neutralizedEvents.length > 0
                  ? `Sinistre couvert ce tour : ${r.insurance.neutralizedEvents
                      .map((c) => cardByCode.get(c)?.title ?? c)
                      .join(", ")}. Effets neutralisés pour votre entreprise.`
                  : "Aucun sinistre couvert ce tour : la prime était le prix de la sérénité."}
              </p>
            ) : null}

            {view.salesHistory.rounds.length > 0 ? (
              <SalesHistory history={view.salesHistory} vocabulary={view.vocabulary} />
            ) : null}
          </div>
        </details>
      ) : null}

      {/* ── RoundStatusPoller (C1) ── */}
      {!finished && view.kind === "class" ? (
        <RoundStatusPoller
          gameId={view.gameId}
          currentRound={view.currentRound}
          roundStatus="open"
          endpoint="round-status"
        />
      ) : null}
    </main>
  );
}
