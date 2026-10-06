import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import { COMMUNICATION_AXIS_LABELS } from "@/engine/market/communication";
import { KpiCard } from "@/components/kpi-card";
import { lectureBancaire } from "@/components/lecture-bancaire";
import { ligneTresorerie } from "@/components/ligne-tresorerie";
import { CourrierRecommande, grilleDeCourriers } from "@/components/courrier";
import { courrierParCode } from "@/config/courriers/registre";
import { BpiPanel } from "@/components/bpi-panel";
import { RevenueChart, TreasuryChart, MarketShareChart } from "@/components/charts";
import { StudyReportsPanel } from "@/components/study-reports";
import { FinancialStatements } from "@/components/financial-statements";
import { RatioGauges } from "@/components/ratio-gauges";
import { TableauDesReferences } from "@/components/tableau-des-references";
import { SalesHistory } from "@/components/sales-history";
import { CompetitiveBenchmark } from "@/components/competitive-benchmark";
import { RseReportPanel } from "@/components/rse-report";
import { DashboardTabs } from "@/components/dashboard-tabs";
import type { KpiFormat } from "@/config/scenarios/sector-kpis";
import type { GameView } from "@/services/game-view.service";
import type { RseIndex, RsePillar } from "@/scoring/rse";
import { ReussitesDuTour } from "@/components/reussites-du-tour";
import { Tiroir } from "@/components/tiroir";
import { Icone, type NomDIcone } from "@/components/icone";
import { RevelationDuTour } from "@/components/revelation-du-tour";
import { periodLabel } from "@/config/scenarios/periodicity";
import { reussitesFranchies, lireLeTour } from "@/scoring/reussites";

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
 * UNE LIGNE DE CONSTAT : ce que le tour a produit, en une phrase, derrière son
 * pictogramme.
 *
 * L'onglet Finance empilait une dizaine de ces lignes, chacune dans sa
 * couleur — ciel pour l'assurance, violet pour les RH, sarcelle pour la
 * trésorerie, orange, rose, ambre — et un emoji en tête. Neuf teintes pour
 * neuf sujets, c'était demander à l'élève d'apprendre un code que rien
 * n'expliquait, et noyer les deux seules couleurs qui disent quelque chose :
 * le rouge d'une perte et l'ambre d'une vigilance. Le sujet se dit désormais
 * par le pictogramme, en laiton ; la couleur du cadre ne sert plus qu'à
 * l'état, et une ligne sans histoire reste en encre neutre.
 */
const TONS_DE_CONSTAT = {
  neutre: { cadre: "border-white/5 bg-slate-950 text-slate-300", picto: "text-amber-400" },
  vigilance: { cadre: "border-amber-400/30 bg-amber-950/30 text-amber-200", picto: "" },
  perte: { cadre: "border-red-400/30 bg-red-950/30 text-red-200", picto: "" },
} as const;

function Constat({
  icone,
  ton = "neutre",
  children,
}: {
  icone: NomDIcone;
  ton?: keyof typeof TONS_DE_CONSTAT;
  children: React.ReactNode;
}) {
  const t = TONS_DE_CONSTAT[ton];
  return (
    <div className={`flex gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${t.cadre}`}>
      <Icone nom={icone} className={`mt-0.5 h-3.5 w-3.5 ${t.picto}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Indice RSE du tour (Lot 1) : une MESURE, affichée mais sans effet sur la
 * partie. Trois piliers ESG dérivés du résultat ; un pilier « non évalué »
 * (aucun signal dans ce scénario) reste neutre et le dit.
 */
const RSE_PILLARS = [
  { key: "environment", label: "Environnement", bar: "bg-emerald-400" },
  { key: "social", label: "Social", bar: "bg-fuchsia-400" },
  { key: "governance", label: "Gouvernance", bar: "bg-sky-400" },
] as const;

function RseCard({ rse }: { rse: RseIndex }) {
  return (
    <section
      aria-label="Indice RSE du tour"
      className="rounded-xl border border-emerald-400/20 bg-slate-900 p-3 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Icone nom="feuille" className="h-4 w-4 text-amber-400" />
          Indice RSE
        </h2>
        <span className="tabular-nums text-lg font-semibold text-emerald-300">
          {rse.score}
          <span className="text-xs text-slate-400"> / 100</span>
        </span>
      </div>
      <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
        {RSE_PILLARS.map(({ key, label, bar }) => {
          const p = rse[key] as RsePillar;
          return (
            <div key={key} className="flex items-center gap-3 text-xs">
              <span className="w-24 shrink-0 text-slate-400 max-sm:w-[6.5rem]">{label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <span
                  className={`block h-full rounded-full ${p.evaluated ? bar : "bg-slate-600"}`}
                  style={{ width: `${p.score}%` }}
                />
              </span>
              <span className="w-[4.5rem] shrink-0 whitespace-nowrap text-right tabular-nums text-slate-300">
                {p.evaluated ? p.score : <span className="text-slate-400">non évalué</span>}
              </span>
            </div>
          );
        })}
      </div>
      {rse.notes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {rse.notes.map((n) => (
            <span
              key={n}
              className="rounded-full border border-white/10 bg-slate-950 px-2 py-0.5 text-xs text-slate-400"
            >
              {n}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-sm leading-snug text-slate-400 sm:mt-3">
        Elle pèse dans l&apos;IPG (10 % par défaut) ; elle ne joue pas sur le marché.
      </p>
    </section>
  );
}

/**
 * Le tableau de bord complet d'UN tour : synthèse, marché, finance. Piloté par
 * un `period` (résultat, prévision, indicateurs, benchmark de ce tour-là) et
 * non plus par le seul dernier tour — c'est ce qui permet à chaque période de
 * l'accordéon de rouvrir son propre tableau de bord.
 *
 * `standing` : n'affiche le classement (IPG), les rapports d'études payées et
 * l'historique des ventes que pour le tour le plus récent — ce sont des vues
 * cumulées/de position, qui n'ont de sens qu'« à aujourd'hui » et feraient
 * double emploi répétées sur chaque tour passé.
 */
export function PeriodDashboard({
  view,
  period,
  standing,
  courrierResume = false,
}: {
  view: GameView;
  period: Period;
  standing: boolean;
  /**
   * Le courrier du tour en une ligne, sans les lettres. Sur téléphone, le parcours a déjà fait
   * lire ces lettres, en entier, au tour où elles sont tombées : les revoir en grand, au moment
   * des résultats, repoussait les chiffres sous le pli.
   */
  courrierResume?: boolean;
}) {
  const r = period.result;
  // Trajectoire arrêtée à ce tour : chaque période montre les graphiques tels
  // qu'ils étaient à sa clôture, pas l'état final recopié à l'identique.
  const history = view.history.filter((h) => h.round <= period.round);
  const treasuryTone = r.functionalBalance.netTreasury < 0 ? "critical" : "neutral";

  // Ce que l'équipe a franchi À CE TOUR, lu dans les résultats déjà calculés :
  // rien n'est stocké, rien ne pèse sur le score. Les tours suivants sont
  // exclus, sinon le tableau de bord d'un tour ancien se nourrirait de l'avenir.
  const franchies = reussitesFranchies(
    view.periods.map((p) => lireLeTour(p.round, p.result, p.forecastReview)),
    period.round,
  );

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

  // Le tour d'avant, pour dire d'où vient l'écart de résultat. Le tour 1 n'en a
  // pas : le verdict porte alors sur le niveau, pas sur la variation.
  const precedent =
    view.periods.find((p) => p.round === period.round - 1)?.result.incomeStatement ?? null;
  const moi = view.ranking.find((row) => row.isPlayer);

  // Les trois temps de la synthèse : le verdict, les chiffres, l'évolution.
  const verdict = (
    <>
            {/*
              LE VERDICT D'ABORD, LES TABLEAUX ENSUITE. C'est l'onglet ouvert
              par défaut quand un tour se déplie : le premier écran doit
              répondre à « alors, ça a marché ? », que quatre cartes
              d'indicateurs laissaient calculer au lecteur. Les tableaux ne sont
              pas le verdict, ils en sont la preuve — et on ne cherche pas une
              preuve avant de savoir ce qu'on vérifie. Seul le tour le plus
              récent se met en scène : une animation qui rejoue au dépliement
              d'un vieux tour devient un tic.
            */}
            <RevelationDuTour
              periode={periodLabel(view.roundDays, period.round)}
              tour={r.incomeStatement}
              precedent={precedent}
              nouveau={standing}
              rang={standing && moi ? { place: moi.rank, sur: view.ranking.length } : undefined}
              ipg={standing ? view.playerBpi : null}
            />
            <ReussitesDuTour reussites={franchies} />
            {/*
              LE COURRIER D'ABORD. Les lettres reçues par l'entreprise ce
              tour expliquent une part des chiffres qui suivent ; reléguées au
              fond de l'onglet Marché, elles n'étaient jamais lues en solo, où
              personne ne les annonce.
            */}
            {period.events.length > 0 && courrierResume ? (
              <p
                aria-label="Courrier reçu ce tour"
                className="text-sm leading-relaxed text-slate-400"
              >
                <Icone nom="courrier" className="mr-1.5 h-4 w-4 text-amber-400" />
                Courrier du{" "}
                {periodLabel(view.roundDays, period.round).toLowerCase()} :{" "}
                <span className="text-slate-300">
                  {period.events.map((code) => courrierParCode.get(code)?.objet ?? code).join(" · ")}
                </span>
              </p>
            ) : period.events.length > 0 ? (
              <section aria-label="Courrier reçu ce tour">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
                  <Icone nom="courrier" className="h-4 w-4" />
                  Le courrier de ce tour
                </p>
                <div className={grilleDeCourriers(period.events.length)}>
                  {period.events.map((code, i) => (
                    <CourrierRecommande key={code} code={code} delayMs={i * 450} />
                  ))}
                </div>
              </section>
            ) : null}
    </>
  );
  const chiffres = (
    <>
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
                hint={`Seuil de rentabilité : ${r.breakeven.breakEvenUnits != null ? `${formatUnits(r.breakeven.breakEvenUnits)} ${view.vocabulary.units}` : "jamais atteint"}`}
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

            {r.subscription ? (
              <section
                data-testid="portefeuille-tour"
                className="carte px-3 py-3 text-sm"
              >
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Icone nom="recommencer" className="h-3.5 w-3.5 text-amber-400" />
                  Portefeuille d&apos;{view.vocabulary.units}
                </p>
                <div className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  <span className="text-slate-400">En début de tour</span>
                  <span className="text-right text-slate-200">
                    {formatUnits(r.subscription.opening)} {view.vocabulary.units}
                  </span>
                  <span className="text-slate-400">Partis (attrition)</span>
                  <span
                    className={`text-right ${r.subscription.churnRate > 0.2 ? "text-amber-400" : "text-slate-200"}`}
                  >
                    − {formatUnits(r.subscription.churned)} ({formatPercent(r.subscription.churnRate)})
                  </span>
                  {r.subscription.unserved > 0.5 ? (
                    <>
                      <span className="text-slate-400">Restés sans place</span>
                      <span className="text-right text-rose-400">
                        − {formatUnits(r.subscription.unserved)}
                      </span>
                    </>
                  ) : null}
                  <span className="text-slate-400">Nouveaux venus du marché</span>
                  <span className="text-right text-emerald-400">
                    + {formatUnits(r.subscription.newMembers)}
                  </span>
                  <span className="text-slate-400">En fin de tour</span>
                  <span className="text-right font-medium text-slate-100">
                    {formatUnits(r.subscription.closing)} {view.vocabulary.units}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {r.subscription.occupancy > 0.85
                    ? `Occupation ${formatPercent(r.subscription.occupancy)} : la salle sature, et la saturation se paie en départs.`
                    : `Occupation ${formatPercent(r.subscription.occupancy)}. Un ${view.vocabulary.unit} conservé rapporte à nouveau, sans coût de recrutement.`}
                </p>
              </section>
            ) : null}

            <RseCard rse={period.rse} />

            {/* Rapport extra-financier (Lot 3) : pluriannuel, donc affiché une
                seule fois — sur le dernier tour clos (standing). */}
            {standing && view.rseReport.available ? (
              <RseReportPanel report={view.rseReport} />
            ) : null}
    </>
  );
  const evolution = (
    <>
            {/* Les courbes ne disent rien d'un seul point : elles arrivent au deuxième tour.
                Les parts de marché, elles, se lisent dès le premier. */}
            {history.length > 0 ? (
              <section className={history.length > 1 ? "grid gap-3 lg:grid-cols-3" : "grid gap-3"}>
                {history.length > 1 ? (
                  <div className="carte p-3 sm:p-5 lg:col-span-2">
                    <RevenueChart history={history} roundsCount={view.roundsCount} />
                  </div>
                ) : null}
                <div className="space-y-3">
                  {history.length > 1 ? (
                    <div className="carte p-3 sm:p-5">
                      <TreasuryChart history={history} roundsCount={view.roundsCount} />
                    </div>
                  ) : null}
                  <div className="carte p-3 sm:p-5">
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

            {standing && view.ranking.length === 0 && view.classement.parLAnimateur ? (
              // Le rideau est tiré : la vue ne contient pas le classement, elle
              // ne le cache pas. On dit qui l'ouvrira, pour que l'attente ait
              // un sens — et on rappelle ce qui, lui, ne dépend de personne.
              <section className="carte p-3 sm:p-5">
                <h2 className="text-sm font-semibold text-slate-200">
                  Classement · Indice de performance globale
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Votre enseignant le révélera. En attendant, vos résultats et votre indice
                  de performance sont là : c&apos;est votre progression, pas votre place.
                </p>
              </section>
            ) : null}

            {standing && view.ranking.length > 0 ? (
              <section className="grid gap-3 lg:grid-cols-2">
                <div className="carte p-3 sm:p-5">
                  <h2 className="mb-2 text-sm font-semibold text-slate-200">
                    Classement · Indice de performance globale
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
                          <span className="mr-2 text-slate-400">#{row.rank}</span>
                          {row.name}
                          {row.defaillant ? (
                            <span
                              className="ml-2 rounded-full border border-red-400/40 bg-red-950/40 px-2 py-0.5 text-xs font-semibold text-red-300"
                              title="Entreprise défaillante : deux tours de cessation de paiements. Activité gelée jusqu'à recapitalisation."
                            >
                              <Icone nom="alerte" className="mr-1 h-3 w-3" />
                              Défaillante
                            </span>
                          ) : null}
                        </span>
                        <span className="tabular-nums">
                          <span className="font-semibold">{row.bpi.toFixed(1)}</span>
                          <span className="ml-2 text-xs text-slate-400">
                            {formatEuro(row.cumulativeNetIncome)} cumulés
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-3">
                    <Tiroir titre="Comment l'IPG se calcule" ferme>
                      <p className="text-sm leading-relaxed text-slate-400">
                        IPG sur 100 : économique 30 %, financière 20 %, pilotage 20 %,
                        commerciale 15 %, responsabilité sociétale 10 %, maîtrise décisionnelle
                        5 %. Les derniers tours pèsent plus lourd.
                      </p>
                    </Tiroir>
                  </div>
                </div>
                {view.playerDimensions ? <BpiPanel dimensions={view.playerDimensions} /> : null}
              </section>
            ) : (
              <p className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                Le classement IPG se lit sur le tour le plus récent.
              </p>
            )}
    </>
  );
  return (
    <DashboardTabs>
      {{
        synthese: (
          <div className="space-y-3">
            {verdict}
            {chiffres}
            {evolution}
          </div>
        ),

        marche: (
          <div className="space-y-3">
            {period.sectorKpis.length > 0 ? (
              <section aria-label="Indicateurs du métier">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
                  <Icone nom="resultats" className="h-3.5 w-3.5" />
                  Indicateurs du métier
                </h3>
                {/*
                  SUR TÉLÉPHONE, UNE LIGNE PAR INDICATEUR : le nom à gauche, la valeur à droite, et
                  l'explication en dessous, sur une ligne. En deux colonnes, chaque carte portait
                  quatre lignes d'explication dans une colonne de 150 px : trois indicateurs
                  tenaient plus d'un écran.
                */}
                <div className="mt-2 grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                  {period.sectorKpis.map((k) => (
                    <div
                      key={k.key}
                      className="rounded-lg border border-white/5 bg-slate-950 px-2.5 py-2"
                    >
                      <div className="flex items-baseline justify-between gap-3 sm:block">
                        <p className="text-xs uppercase tracking-wide text-slate-400">{k.label}</p>
                        <p className="text-lg font-semibold tabular-nums text-slate-100 sm:mt-0.5">
                          {formatKpi(k.value, k.format)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-sm leading-snug text-slate-400 sm:mt-1">{k.hint}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {r.products && view.gamme ? (
              <TableauDesReferences
                gamme={view.gamme}
                produits={r.products}
                tour={period.round}
                leftoverLabel={view.vocabulary.leftoverLabel}
              />
            ) : null}

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                Marché du tour écoulé
              </h3>
              {r.communication ? (
                <p className="mb-2 text-xs text-slate-400">
                  <Icone nom="communication" className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                  Communication :{" "}
                  {r.communication.axis
                    ? `axe « ${COMMUNICATION_AXIS_LABELS[r.communication.axis].label.toLowerCase()} »`
                    : "aucun axe"}
                  {r.communication.brandBudget > 0 ? ` · marque ${formatEuro(r.communication.brandBudget)}` : ""}
                  {" · notoriété "}
                  {Math.round(r.communication.brandAwareness * 100)} % en fin de tour. L&apos;axe porte (✓) ou
                  dessert (✗) le marketing selon ce que chaque clientèle regarde.
                </p>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-2 font-medium">Segment</th>
                      <th className="pb-2 pr-2 text-right font-medium">Demande</th>
                      <th className="pb-2 pr-2 text-right font-medium">Vendu</th>
                      <th className="pb-2 text-right font-medium">Manqué</th>
                      {r.communication?.axis ? <th className="pb-2 pl-2 text-right font-medium">Axe</th> : null}
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {Object.entries(r.market.bySegment)
                      .filter(([, d]) => d.potential > 0)
                      .map(([code, d]) => (
                        <tr key={code} className="border-t border-white/5">
                          <td className="py-2 pr-2">{view.segmentNames[code] ?? code}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{formatUnits(d.demandForCompany)}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{formatUnits(d.sold)}</td>
                          <td className={`py-2 text-right tabular-nums ${d.lost > 1 ? "text-red-400" : ""}`}>
                            {formatUnits(d.lost)}
                          </td>
                          {r.communication?.axis ? (
                            <td className="py-2 pl-2 text-right text-xs">
                              {(() => {
                                const fit = r.communication!.fitBySegment[code] ?? 1;
                                return fit > 1 ? (
                                  <span className="text-emerald-300">✓ porte</span>
                                ) : fit < 1 ? (
                                  <span className="text-red-400">✗ dessert</span>
                                ) : (
                                  <span className="text-slate-400">· neutre</span>
                                );
                              })()}
                            </td>
                          ) : null}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {period.competitiveBenchmark ? (
              <CompetitiveBenchmark benchmark={period.competitiveBenchmark} />
            ) : null}

            {r.extraOrders ? (
              <Constat icone="fiche">
                Commande ferme à {formatEuro(r.extraOrders.unitPrice)}/{view.vocabulary.unit} :{" "}
                {formatUnits(r.extraOrders.delivered)} {view.vocabulary.units} livrés
                {r.extraOrders.subcontracted > 0
                  ? ` + ${formatUnits(r.extraOrders.subcontracted)} u sous-traitées`
                  : ""}{" "}
                sur {formatUnits(r.extraOrders.requested)} commandées
                {r.extraOrders.delivered + r.extraOrders.subcontracted <
                r.extraOrders.requested
                  ? ", le reste est perdu. L'anticipation a un prix."
                  : ", réglées comptant."}
              </Constat>
            ) : null}

            {r.orderOffer ? (
              r.orderOffer.accepted ? (
                <Constat icone="colis">
                  {r.orderOffer.title} acceptée :{" "}
                  {formatUnits(r.orderOffer.delivered)} u livrées à{" "}
                  {formatEuro(r.orderOffer.unitPrice)}/u, soit{" "}
                  {formatEuro(r.orderOffer.revenue)} de CA
                  {r.orderOffer.onCredit > 0.5
                    ? `, dont ${formatEuro(r.orderOffer.onCredit)} en créances à ${r.orderOffer.paymentDelayDays} jours.`
                    : ", réglé comptant."}
                  {r.orderOffer.delivered < 0.5
                    ? ` ${view.vocabulary.leftoverLabel} insuffisant : rien n'a pu être livré.`
                    : ""}
                </Constat>
              ) : (
                <Constat icone="colis">
                  {r.orderOffer.title} : commande déclinée. Un choix aussi.
                </Constat>
              )
            ) : null}

            {period.forecastReview ? (
              <div className="rounded-lg border border-white/5 bg-slate-950 px-3 py-3 sm:p-4">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
                  <Icone nom="banque" className="h-3.5 w-3.5" />
                  Votre plan face au réalisé
                </h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-1 pr-2 font-medium" />
                        <th className="pb-1 pr-2 text-right font-medium">Prévu</th>
                        <th className="pb-1 pr-2 text-right font-medium">Réalisé</th>
                        <th className="pb-1 pr-2 text-right font-medium">Écart</th>
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
                            <td className="py-1.5 pr-2">{line.label}</td>
                            <td className="py-1.5 pr-2 text-right tabular-nums text-slate-400">
                              {show(line.forecast)}
                            </td>
                            <td className="py-1.5 pr-2 text-right tabular-nums text-slate-100">
                              {show(line.actual)}
                            </td>
                            <td
                              className={`py-1.5 pr-2 text-right tabular-nums ${
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
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Un écart qui se répète dans le même sens n&apos;est pas de la malchance :
                  c&apos;est un biais de votre modèle.
                </p>
              </div>
            ) : null}

            {standing && view.studyReports ? <StudyReportsPanel reports={view.studyReports} /> : null}
          </div>
        ),

        finance: (
          <div className="space-y-3">
            <FinancialStatements
              result={r}
              price={period.decisions?.price ?? null}
              // Gamme : la part « autres coûts variables » est la moyenne des
              // références, pondérée par ce que chacune a mis en rayon, pour
              // rester cohérente avec le coût variable unitaire du seuil.
              otherVariableCostPerUnit={(() => {
                if (!view.gamme || !r.products) return view.costFacts.otherVariableCostPerUnit;
                let poids = 0;
                let somme = 0;
                for (const g of view.gamme) {
                  const produced = r.products[g.code]?.produced ?? 0;
                  poids += produced;
                  somme += produced * g.otherVariableCostPerUnit;
                }
                return poids > 0 ? somme / poids : view.costFacts.otherVariableCostPerUnit;
              })()}
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
              <Constat icone="banque" ton="perte">
                Emprunt refusé : {formatEuro(r.bank.loanRequested)} demandés sans plan de
                trésorerie. L&apos;argent n&apos;est jamais entré en caisse.
              </Constat>
            ) : null}

            {r.capital && r.capital.applied < r.capital.requested - 0.5 ? (
              <Constat icone="accord" ton="vigilance">
                Apport plafonné : {formatEuro(r.capital.applied)} retenus sur{" "}
                {formatEuro(r.capital.requested)} demandés. L&apos;enveloppe des associés
                est {r.capital.remainingAfter < 0.5 ? "épuisée" : `réduite à ${formatEuro(r.capital.remainingAfter)}`}.
              </Constat>
            ) : null}

            {r.debt && (r.debt.mandatoryRepayment > 0.5 || r.debt.newLoan > 0.5 || r.debt.earlyRepayment > 0.5) ? (
              <Constat icone="banque">
                Dette : échéance de {formatEuro(r.debt.mandatoryRepayment)} prélevée
                {r.debt.earlyRepayment > 0.5
                  ? ` + ${formatEuro(r.debt.earlyRepayment)} d'anticipé`
                  : ""}
                {r.debt.newLoan > 0.5 ? ` · nouvel emprunt ${formatEuro(r.debt.newLoan)}` : ""}
                {" · restant dû : "}
                {formatEuro(r.debt.outstanding)}
                {r.debt.nextMandatory > 0.5
                  ? ` (prochaine échéance ${formatEuro(r.debt.nextMandatory)})`
                  : ""}
              </Constat>
            ) : null}

            {r.treasury ? (
              <Constat
                icone={r.treasury.crisis || r.treasury.forcedFactored > 0 ? "alerte" : "tresorerie"}
                ton={r.treasury.crisis ? "perte" : r.treasury.forcedFactored > 0 ? "vigilance" : "neutre"}
              >
                {ligneTresorerie(r.treasury)}
              </Constat>
            ) : null}

            {(() => {
              const lecture = lectureBancaire(r.bank);
              return lecture ? (
                <Constat icone="banque" ton={lecture.ton === "baisse" ? "vigilance" : "neutre"}>
                  {lecture.texte}
                </Constat>
              ) : null;
            })()}

            {r.investment ? (
              <Constat icone="usine">
                <p>
                  Investissement : +{formatUnits(r.investment.capacityUnits)} u de
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
              </Constat>
            ) : null}

            {r.qualityCosts &&
            (r.qualityCosts.internalFailure > 0.5 || r.qualityCosts.externalFailure > 0.5) ? (
              <Constat icone="alerte" ton="perte">
                Coûts de la non-qualité : {formatUnits(r.qualityCosts.defectUnits)} u de
                rebuts ({formatEuro(r.qualityCosts.internalFailure)})
                {r.qualityCosts.returnedUnits > 0.5
                  ? ` · ${formatUnits(r.qualityCosts.returnedUnits)} u retournées (${formatEuro(r.qualityCosts.externalFailure)})`
                  : ""}{" "}
                , face à {formatEuro(r.qualityCosts.prevention)} de prévention. Le bon niveau
                de qualité est un calcul, pas une vertu.
              </Constat>
            ) : null}

            {r.hr ? (
              <Constat icone="equipes">
                RH · effectif {r.hr.headcount}
                {r.hr.hired > 0 ? ` · +${r.hr.hired} embauche${r.hr.hired > 1 ? "s" : ""} (arrivée au prochain tour)` : ""}
                {r.hr.fired > 0 ? ` · ${r.hr.fired} licenciement${r.hr.fired > 1 ? "s" : ""}` : ""}
                {r.hr.departed > 0 ? " · 1 démission (salaires sous le marché !)" : ""}
                {r.hr.trainingBudget > 0 ? ` · formation ${formatEuro(r.hr.trainingBudget)}` : ""}
                {" · coût RH du tour : "}
                {formatEuro(r.hr.cost)}
              </Constat>
            ) : null}

            {r.insurance ? (
              <Constat icone="assurance">
                Assurance souscrite ({formatEuro(r.insurance.premium)}).{" "}
                {r.insurance.neutralizedEvents.length > 0
                  ? `Sinistre couvert ce tour : ${r.insurance.neutralizedEvents
                      .map((c) => courrierParCode.get(c)?.objet ?? c)
                      .join(", ")}. Effets neutralisés.`
                  : "Aucun sinistre couvert ce tour."}
              </Constat>
            ) : null}

            {standing && view.salesHistory.rounds.length > 0 ? (
              <SalesHistory
                history={view.salesHistory}
                vocabulary={view.vocabulary}
                priceLabel={view.gamme ? "Prix moyen" : undefined}
              />
            ) : null}
          </div>
        ),
      }}
    </DashboardTabs>
  );
}
