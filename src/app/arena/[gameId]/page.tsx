import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { formatEuro } from "@/lib/format";
import { getGameView } from "@/services/game.service";
import { getTeamSituations } from "@/services/pedagogy.service";
import { SituationCard, SituationDebrief } from "@/components/situation-panel";
import { periodLabel } from "@/config/scenarios/periodicity";
import { EventCard } from "@/components/event-card";
import { cardByCode } from "@/config/events/cards";
import { DecisionForm } from "@/components/decision-form";
import { TeamNameForm } from "@/components/team-name-form";
import { DilemmaCard, ParametersPanels } from "@/components/decision-context";
import { PeriodDashboard } from "@/components/period-dashboard";
import { PeriodDecisionsRecap } from "@/components/period-decisions-recap";
import { SegmentedTabs } from "@/components/segmented-tabs";
import { RoundStatusPoller } from "@/components/round-status-poller";
import { RoundStatusBanner } from "@/components/round-status-banner";
import { EventBanner } from "@/components/event-banner";
import { surtitreDePartie } from "@/config/scenarios/presentation";
import { SECTOR_ICONS, SECTOR_COLORS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { libelleStatut, statutDesSituations } from "@/config/situation-rendu";

export const dynamic = "force-dynamic";

function appositive(tagline: string): string {
  const trimmed = tagline.trim().replace(/\.$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export default async function ArenaPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const userId = await getGuestUserId();
  if (!userId) notFound();
  const view = await getGameView(gameId, userId);
  if (!view) notFound();
  const situations = await getTeamSituations(gameId, userId);
  const statutSituations = statutDesSituations(situations.current);

  const finished = view.status === "finished";
  // Chaque période est une pièce de l'accordéon. Les tours RÉSOLUS forment la
  // pile d'historique (repliée, sauf le plus récent) ; le tour OUVERT est la
  // période active, dépliée, où l'on lit la situation et rend ses décisions.
  const periods = view.periods;
  const latestRound = periods.at(-1)?.round ?? null;
  const debriefByRound = new Map(
    situations.debriefedByRound.map((dr) => [dr.roundIndex, dr]),
  );
  const mostRecentDebriefedRound = situations.debriefedByRound[0]?.roundIndex ?? null;
  const hasActivePeriod = !finished;

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 pt-6 pb-12">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${SECTOR_COLORS[view.sector].bg}`}>
            {SECTOR_ICONS[view.sector]}
          </span>
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] ${SECTOR_COLORS[view.sector].accent}`}>
              {surtitreDePartie(view.intro.title, view.playerTeamName)}
            </p>
            <h1 className="text-2xl font-bold text-slate-50">{view.playerTeamName}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/profile" className="text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
            Mon profil
          </Link>
          <Link href="/notions" className="text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
            Fiches notions
          </Link>
          <p className={`rounded-full border border-white/10 px-3 py-1 text-xs ${SECTOR_COLORS[view.sector].accent}`}>
            {SECTOR_ICONS[view.sector]} {SECTOR_LABELS[view.sector]}
          </p>
          <p
            className="rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-300"
            title="Niveau de difficulté de la partie"
          >
            Niveau {view.difficulty.level} · {view.difficulty.name}
          </p>
          {latestRound !== null && view.ranking.length > 1 ? (() => {
            const me = view.ranking.find((row) => row.isPlayer);
            return me ? (
              <p className="rounded-full border border-amber-400/30 bg-amber-400/5 px-3 py-1 text-xs tabular-nums text-amber-300" title="Votre position au classement BPI">
                #{me.rank}/{view.ranking.length} · BPI {me.bpi.toFixed(0)}
              </p>
            ) : null;
          })() : null}
          <p className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
            {finished
              ? "Partie terminée"
              : `${periodLabel(view.roundDays, view.currentRound)} / ${view.roundsCount}`}
          </p>
        </div>
      </header>

      {/* ── Status banner ── */}
      <div className="mt-6">
        <RoundStatusBanner
          currentRound={view.currentRound}
          roundsCount={view.roundsCount}
          roundDays={view.roundDays}
          pendingDecisions={view.pendingDecisions !== null}
          kind={view.kind}
          finished={finished}
          situations={statutSituations}
        />
      </div>

      {/* ── Cartes annoncées : visibles quelle que soit la période dépliée ── */}
      {!finished && view.announcedEventCards.length > 0 ? (
        <div className="mt-4">
          <EventBanner cards={view.announcedEventCards} />
        </div>
      ) : null}

      {/* ── Team naming ── */}
      {view.peutSeNommer ? (
        <div className="mt-6">
          <TeamNameForm gameId={gameId} nomActuel={view.playerTeamName} />
        </div>
      ) : null}

      {/* ── Victory / End screen ── */}
      {finished ? (
        <section className="mt-6 rounded-xl border border-amber-400/30 bg-slate-900 p-6 text-center">
          <h2 className="text-xl font-bold text-amber-300">
            {view.ranking.find((row) => row.isPlayer)?.rank === 1
              ? `🏆 Victoire ! ${view.playerTeamName} domine le marché.`
              : "Partie terminée. Analysez votre trajectoire période par période ci-dessous."}
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
      ) : null}

      {/* ══════════════════════════════════════════════════════════════════
          ACCORDÉON DE PÉRIODES
          Chaque tour clos se replie sur une ligne de synthèse (CA, résultat,
          trésorerie) et se rouvre sur son tableau de bord complet + son
          débriefing. Le tour en cours est la période active, toujours ouverte.
          ══════════════════════════════════════════════════════════════════ */}
      <div className="mt-6 space-y-4">
        {periods.length > 0 ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {finished ? "Vos périodes" : "Périodes passées"}
          </p>
        ) : null}

        {periods.map((p) => {
          const isLatest = p.round === latestRound;
          const dr = debriefByRound.get(p.round);
          const netIncome = p.result.incomeStatement.netIncome;
          const netTreasury = p.result.functionalBalance.netTreasury;
          return (
            <details
              key={p.round}
              open={isLatest}
              className="group rounded-xl border border-white/10 bg-slate-950/40 [&[open]]:border-white/20"
            >
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <span className="text-slate-500 transition-transform group-open:rotate-90">▸</span>
                  📊 {periodLabel(view.roundDays, p.round)}
                  <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-sky-300">
                    tour clos
                  </span>
                  {isLatest && !finished ? (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      résultats livrés
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-slate-400">
                  <span>CA {formatEuro(p.result.incomeStatement.revenue)}</span>
                  <span className={netIncome >= 0 ? "text-emerald-300" : "text-red-300"}>
                    Résultat {formatEuro(netIncome)}
                  </span>
                  <span className={netTreasury >= 0 ? "text-slate-300" : "text-red-300"}>
                    Tréso {formatEuro(netTreasury)}
                  </span>
                </span>
              </summary>
              <div className="border-t border-white/10 p-4 sm:p-5">
                {/* Les trois facettes d'une période close : ce qu'on a analysé
                    (Situation + correction), ce qu'on a décidé, ce qui en est
                    ressorti. Les onglets ne s'opposent pas à l'accordéon — il
                    situe la période, ils en montrent une face à la fois. */}
                <SegmentedTabs
                  defaultKey={isLatest ? "resultats" : "situation"}
                  tabs={[
                    { key: "situation", label: "Situation", icon: "📋" },
                    { key: "decisions", label: "Décisions", icon: "✏️" },
                    { key: "resultats", label: "Résultats", icon: "📊" },
                  ]}
                >
                  {{
                    situation: dr ? (
                      <section className="space-y-4">
                        <p className="text-xs text-slate-500">
                          La situation posée ce tour-là et sa correction.
                        </p>
                        {dr.situations.map((s) => (
                          <SituationDebrief
                            key={s.instanceId}
                            situation={s}
                            gameId={view.gameId}
                            retakeable={
                              situations.missedPolicy === "retake50" &&
                              p.round === mostRecentDebriefedRound
                            }
                          />
                        ))}
                      </section>
                    ) : null,
                    decisions: p.decisions ? (
                      <PeriodDecisionsRecap decisions={p.decisions} vocabulary={view.vocabulary} />
                    ) : null,
                    resultats: <PeriodDashboard view={view} period={p} standing={isLatest} />,
                  }}
                </SegmentedTabs>
              </div>
            </details>
          );
        })}

        {/* ── Période active : le tour en cours, ouvert ── */}
        {hasActivePeriod ? (
          <section className="rounded-xl border-2 border-amber-400/40 bg-slate-950/40">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/20 px-4 py-3 sm:px-5">
              <span className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                ✏️ {periodLabel(view.roundDays, view.currentRound)}
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-amber-300">
                  tour en cours
                </span>
              </span>
              <span className="text-xs text-slate-500">
                Trois onglets : la situation à lire, vos décisions à rendre, et les
                résultats — à venir une fois le tour clos.
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {/* Le tour en cours porte les mêmes onglets que les tours clos, dès
                  le premier tour : Situation (à lire), Décisions (à rendre) et
                  Résultats — ce dernier vide tant que le tour n'est pas clos.
                  Défaut sur « Situation » : on lit l'énoncé avant de décider. */}
              <SegmentedTabs
                defaultKey="situation"
                syncAnchors={["situation", "decisions"]}
                tabs={[
                  { key: "situation", label: "Situation", icon: "📋" },
                  { key: "decisions", label: "Décisions", icon: "✏️" },
                  { key: "resultats", label: "Résultats", icon: "📊" },
                ]}
              >
                {{
                  situation: (
              <div id="situation" className="space-y-6">
                {/* Briefing / Introduction (tour 1) */}
                {periods.length === 0 ? (
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

                {view.roundBriefing ? (
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

                {/* Events */}
                {view.announcedEventCards.length > 0 ? (
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

                {view.seasonNotes.length > 0 ? (
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

                {/* Pedagogical situations */}
                {situations.current.length > 0 && statutSituations ? (
                  <section className="space-y-4">
                    <p
                      className={`rounded-lg border px-4 py-2 text-sm ${
                        statutSituations.manques.length === 0
                          ? "border-emerald-400/30 bg-emerald-950/20 text-emerald-300"
                          : "border-amber-400/30 bg-amber-950/20 text-amber-300"
                      }`}
                    >
                      {statutSituations.manques.length === 0 ? "✓ " : "⚠ "}
                      {libelleStatut(statutSituations)}
                    </p>
                    {situations.current.map((s) => (
                      <SituationCard key={s.instanceId} gameId={view.gameId} situation={s} />
                    ))}
                  </section>
                ) : null}

                {/* Analytical hints */}
                {(() => {
                  const allHints = [...new Map(
                    situations.current
                      .flatMap((s) => s.analyticalHints)
                      .map((h) => [h.code, h] as const)
                  ).values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
                  return allHints.length > 0 ? (
                    <section className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-200">
                        Points clés à examiner
                      </h2>
                      <p className="text-xs text-slate-400">
                        Les variables et notions à observer pour analyser les situations de ce tour.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {allHints.map((h) => (
                          <div key={h.code} className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{h.name}</p>
                            <p className="mt-1 text-xs text-slate-400">{h.objective}</p>
                            {h.keyPoints.length > 0 ? (
                              <ul className="mt-2 space-y-0.5">
                                {h.keyPoints.map((kp) => (
                                  <li key={kp} className="text-sm text-slate-300">· {kp}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null;
                })()}

                {/* Action levers */}
                {(() => {
                  const FIELD_LABELS: Record<string, string> = {
                    price: "Prix de vente",
                    productionPlan: "Plan de production",
                    marketingBudget: "Budget marketing",
                    qualityBudget: "Budget qualité",
                    maintenanceBudget: "Budget maintenance",
                  };
                  const DIRECTION_ICONS: Record<string, string> = { up: "↑", down: "↓", review: "⟳" };
                  const byField = new Map<string, { direction: string; hints: string[] }>();
                  for (const s of situations.current) {
                    for (const lever of s.decisionLevers ?? []) {
                      const existing = byField.get(lever.field);
                      if (!existing) {
                        byField.set(lever.field, { direction: lever.direction, hints: [lever.hint] });
                      } else {
                        existing.hints.push(lever.hint);
                        if (existing.direction !== lever.direction) existing.direction = "review";
                      }
                    }
                  }
                  const levers = [...byField.entries()].map(([field, { direction, hints: fieldHints }]) => ({
                    field, direction, hints: fieldHints, label: FIELD_LABELS[field] ?? field,
                  }));
                  return levers.length > 0 ? (
                    <section className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-200">
                        Leviers d&apos;action
                      </h2>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {levers.map((l) => (
                          <div key={l.field} className="flex gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5">
                            <span className="mt-0.5 text-base leading-none text-amber-400">{DIRECTION_ICONS[l.direction]}</span>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-slate-200">{l.label}</span>
                              {l.hints.map((h, i) => (
                                <p key={i} className="mt-0.5 text-xs text-slate-400">{h}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null;
                })()}
              </div>
                  ),
                  decisions: (
                    <section id="decisions" className="rounded-xl border border-amber-400/20 bg-slate-900 p-6">
                <div className="mb-4 border-b border-white/10 pb-3">
                  <h2 className="text-sm font-semibold text-slate-200">
                    Vos décisions · {periodLabel(view.roundDays, view.currentRound).toLowerCase()}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Une fois rendues et le tour clos, elles produiront les résultats de cette
                    période — et la période suivante s&apos;ouvrira.
                  </p>
                </div>
                <DecisionForm
                  gameId={view.gameId}
                  roundIndex={view.currentRound}
                  vocabulary={view.vocabulary}
                  periodName={periodLabel(view.roundDays, view.currentRound).toLowerCase()}
                  defaults={view.pendingDecisions ?? view.lastDecisions ?? view.startingDecisions}
                  proposed={view.proposedDecisions}
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
                  equipmentOffer={view.equipmentOffer}
                  capacityFacts={view.capacityFacts}
                />
              </section>
                  ),
                  resultats: (
                    <div className="rounded-xl border border-white/10 bg-slate-900 p-8 text-center">
                      <p className="text-sm text-slate-400">
                        📊 Les résultats de ce tour n&apos;existent pas encore.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Ils s&apos;afficheront ici une fois le tour clos — et ouvriront la période suivante.
                      </p>
                    </div>
                  ),
                }}
              </SegmentedTabs>
            </div>
          </section>
        ) : null}
      </div>

      {/* ── RoundStatusPoller ── */}
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
