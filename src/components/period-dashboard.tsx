import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import { KpiCard } from "@/components/kpi-card";
import { EventCard } from "@/components/event-card";
import { cardByCode } from "@/config/events/cards";
import { BpiPanel } from "@/components/bpi-panel";
import { RevenueChart, TreasuryChart, MarketShareChart } from "@/components/charts";
import { StudyReportsPanel } from "@/components/study-reports";
import { FinancialStatements } from "@/components/financial-statements";
import { RatioGauges } from "@/components/ratio-gauges";
import { SalesHistory } from "@/components/sales-history";
import { CompetitiveBenchmark } from "@/components/competitive-benchmark";
import { DashboardTabs } from "@/components/dashboard-tabs";
import type { KpiFormat } from "@/config/scenarios/sector-kpis";
import type { GameView } from "@/services/game-view.service";

type Period = GameView["periods"][number];

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

/**
 * Le tableau de bord complet d'UN tour : synthèse, marché, finance. Piloté par
 * un `period` (résultat, prévision, indicateurs, benchmark de ce tour-là) et
 * non plus par le seul dernier tour — c'est ce qui permet à chaque période de
 * l'accordéon de rouvrir son propre tableau de bord.
 *
 * `standing` : n'affiche le classement (BPI), les rapports d'études payées et
 * l'historique des ventes que pour le tour le plus récent — ce sont des vues
 * cumulées/de position, qui n'ont de sens qu'« à aujourd'hui » et feraient
 * double emploi répétées sur chaque tour passé.
 */
export function PeriodDashboard({
  view,
  period,
  standing,
}: {
  view: GameView;
  period: Period;
  standing: boolean;
}) {
  const r = period.result;
  // Trajectoire arrêtée à ce tour : chaque période montre les graphiques tels
  // qu'ils étaient à sa clôture, pas l'état final recopié à l'identique.
  const history = view.history.filter((h) => h.round <= period.round);
  const treasuryTone = r.functionalBalance.netTreasury < 0 ? "critical" : "neutral";

  function trend(
    current: number,
    key: "revenue" | "netIncome" | "netTreasury",
  ): { direction: "up" | "down" | "flat"; label: string } | undefined {
    if (history.length < 2) return undefined;
    const prev = history.at(-2)![key];
    if (prev === 0) return undefined;
    const pct = (current - prev) / Math.abs(prev);
    const dir = pct > 0.005 ? "up" : pct < -0.005 ? "down" : "flat";
    return { direction: dir, label: formatPercent(Math.abs(pct)) };
  }

  return (
    <DashboardTabs>
      {{
        synthese: (
          <div className="space-y-6">
            <section aria-label="Indicateurs clés" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                label="Chiffre d'affaires"
                value={formatEuro(r.incomeStatement.revenue)}
                hint={`Part de marché : ${formatPercent(r.market.totalShare)}`}
                trend={trend(r.incomeStatement.revenue, "revenue")}
                sparklineData={history.map((h) => h.revenue)}
              />
              <KpiCard
                label="Résultat net"
                value={formatEuro(r.incomeStatement.netIncome)}
                tone={r.incomeStatement.netIncome >= 0 ? "good" : "critical"}
                hint={`Seuil de rentabilité : ${Number.isFinite(r.breakeven.breakEvenUnits) ? `${formatUnits(r.breakeven.breakEvenUnits)} ${view.vocabulary.units}` : "inatteignable"}`}
                trend={trend(r.incomeStatement.netIncome, "netIncome")}
                sparklineData={history.map((h) => h.netIncome)}
              />
              <KpiCard
                label="Trésorerie nette"
                value={formatEuro(r.functionalBalance.netTreasury)}
                tone={treasuryTone}
                hint={`FRNG ${formatEuro(r.functionalBalance.frng)} − BFR ${formatEuro(r.functionalBalance.bfr)}`}
                trend={trend(r.functionalBalance.netTreasury, "netTreasury")}
                sparklineData={history.map((h) => h.netTreasury)}
              />
              <KpiCard
                label={view.vocabulary.productionLabel}
                value={`${formatUnits(r.production.produced)} ${view.vocabulary.units}`}
                hint={`Utilisation : ${formatPercent(r.production.utilizationRate)}`}
              />
            </section>

            {history.length > 0 ? (
              <section className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-900 p-4 lg:col-span-2">
                  <RevenueChart history={history} roundsCount={view.roundsCount} />
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                    <TreasuryChart history={history} roundsCount={view.roundsCount} />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                    <MarketShareChart
                      segments={Object.entries(r.market.bySegment)
                        .filter(([, d]) => d.potential > 0)
                        .map(([code, d]) => ({
                          name: view.segmentNames[code] ?? code,
                          share: d.share,
                        }))}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {standing ? (
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
                          {row.defaillant ? (
                            <span
                              className="ml-2 rounded-full border border-red-400/40 bg-red-950/40 px-2 py-0.5 text-xs font-semibold text-red-300"
                              title="Entreprise défaillante : deux tours de cessation de paiements. Activité gelée jusqu'à recapitalisation."
                            >
                              ⚠️ Défaillante
                            </span>
                          ) : null}
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
                    Le BPI (0-100) pondère 6 dimensions : économique 30 %, financière 20 %,
                    commerciale 15 %, pilotage 20 %, rentabilité 10 %, maîtrise décisionnelle
                    5 %. La performance financière suit la variation du résultat (une perte
                    plafonne à 20) ; le pilotage ne récompense que les décisions vraiment
                    prises. Les derniers tours pèsent plus lourd.
                  </p>
                </div>
                {view.playerDimensions ? <BpiPanel dimensions={view.playerDimensions} /> : null}
              </section>
            ) : (
              <p className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-xs text-slate-500">
                Le classement BPI reflète la position actuelle : il se consulte sur le tour le
                plus récent.
              </p>
            )}
          </div>
        ),

        marche: (
          <div className="space-y-6">
            {period.sectorKpis.length > 0 ? (
              <section aria-label="Indicateurs du métier">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  📐 Indicateurs du métier
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {period.sectorKpis.map((k) => (
                    <div
                      key={k.key}
                      className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5"
                    >
                      <p className="text-xs uppercase tracking-wide text-slate-500">{k.label}</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-100">
                        {formatKpi(k.value, k.format)}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-slate-500">{k.hint}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

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

            {period.competitiveBenchmark ? (
              <CompetitiveBenchmark benchmark={period.competitiveBenchmark} />
            ) : null}

            {period.events.length > 0 ? (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Cartes tirées ce tour
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {period.events.map((code, i) => (
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

            {period.forecastReview ? (
              <div className="rounded-lg border border-sky-400/25 bg-sky-950/20 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  🏦 Votre plan face au réalisé
                </h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="pb-1 pr-3 font-medium" />
                        <th className="pb-1 pr-3 text-right font-medium">Prévu</th>
                        <th className="pb-1 pr-3 text-right font-medium">Réalisé</th>
                        <th className="pb-1 pr-3 text-right font-medium">Écart</th>
                        <th className="pb-1 text-right font-medium">Écart relatif</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {period.forecastReview.lines.map((line) => {
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
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
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
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  L&apos;écart vaut mieux que la prévision : il dit ce que vous n&apos;aviez pas
                  vu. Un écart qui se répète dans le même sens n&apos;est pas de la malchance,
                  c&apos;est un biais dans votre modèle.
                </p>
              </div>
            ) : null}

            {standing && view.studyReports ? <StudyReportsPanel reports={view.studyReports} /> : null}
          </div>
        ),

        finance: (
          <div className="space-y-4">
            <FinancialStatements
              result={r}
              price={period.decisions?.price ?? null}
              materialCostPerUnit={view.costFacts.materialCostPerUnit}
              otherVariableCostPerUnit={view.costFacts.otherVariableCostPerUnit}
              vocabulary={view.vocabulary}
            />

            {r.ratios && r.ratios.profitability !== undefined ? (
              <RatioGauges
                profitability={r.ratios.profitability}
                roce={r.ratios.returnOnCapitalEmployed}
                roe={r.ratios.returnOnEquity}
                leverage={r.ratios.leverage}
                debtToEquity={r.ratios.debtToEquity}
                assetTurnover={r.ratios.assetTurnover}
              />
            ) : null}

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
              <div className="rounded-lg border border-amber-400/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
                <p>
                  🏗️ Investissement : +{formatUnits(r.investment.capacityUnits)} u de
                  capacité ({formatEuro(r.investment.outlay)}), en service au prochain tour.
                </p>
                {r.investment.bought && r.investment.bought.length > 0 ? (
                  <p className="mt-1 text-slate-300">
                    Achat : {r.investment.bought.map((b: { quantity: number; typeName: string; unitCost: number }) =>
                      `${b.quantity} × ${b.typeName} (${formatEuro(b.unitCost)}/u)`
                    ).join(", ")}
                  </p>
                ) : null}
                {r.investment.sold && r.investment.sold.length > 0 ? (
                  <p className="mt-1 text-slate-300">
                    Cession : {r.investment.sold.map((s: { quantity: number; typeName: string; salePrice: number }) =>
                      `${s.quantity} × ${s.typeName} (${formatEuro(s.salePrice)})`
                    ).join(", ")}
                    {r.investment.disposalLoss && r.investment.disposalLoss > 0.5
                      ? ` · perte de cession ${formatEuro(r.investment.disposalLoss)}`
                      : ""}
                  </p>
                ) : null}
              </div>
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

            {standing && view.salesHistory.rounds.length > 0 ? (
              <SalesHistory history={view.salesHistory} vocabulary={view.vocabulary} />
            ) : null}
          </div>
        ),
      }}
    </DashboardTabs>
  );
}
