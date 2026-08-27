import type { StudyReports } from "@/services/game.service";

/**
 * Rapports des études achetées au dernier tour résolu (doc 02 §8bis) :
 * des données riches et variées pour la prise de décision — l'information
 * a été payée, la voici. Composant serveur, purement présentationnel.
 */

const euro = (v: number) =>
  `${Math.round(v).toLocaleString("fr-FR")} €`;
const units = (v: number) => Math.round(v).toLocaleString("fr-FR");
const pct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")} %`;

function Report({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-indigo-400/20 bg-slate-900 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-300">{title}</h4>
      <div className="mt-2 space-y-2 text-xs text-slate-300">{children}</div>
    </article>
  );
}

function Table({
  head,
  rows,
  highlight,
}: {
  head: string[];
  rows: (string | number)[][];
  /** Index de la ligne du joueur, mise en avant plutôt que nommée « (vous) ». */
  highlight?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-slate-500">
            {head.map((h) => (
              <th key={h} className="py-1 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr
              key={i}
              className={`border-t border-white/5 ${
                i === highlight ? "font-semibold text-amber-200" : "text-slate-300"
              }`}
            >
              {cells.map((c, j) => (
                <td key={j} className={`py-1 pr-3 ${j > 0 ? "tabular-nums" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StudyReportsPanel({ reports }: { reports: StudyReports }) {
  return (
    <section className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
        📊 Vos études du tour {reports.round} · {euro(reports.cost)} d&apos;honoraires
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {reports.market ? (
          <Report title="Étude de marché">
            <Table
              head={["Segment", "Demande totale", "Votre part", "Vendues", "Manquées"]}
              rows={reports.market.segments.map((s) => [
                s.name,
                `${units(s.potential)} u`,
                pct(s.yourShare),
                `${units(s.yourSold)} u`,
                `${units(s.yourLost)} u`,
              ])}
            />
            <Table
              head={["Concurrent", "Prix moyen constaté", "Part de marché", "CA", "Résultat net"]}
              highlight={reports.market.competitors.findIndex((c) => c.isPlayer)}
              rows={reports.market.competitors.map((c) => [
                c.name,
                c.avgPrice !== null ? `≈ ${c.avgPrice.toFixed(2).replace(".", ",")} €` : "n.c.",
                pct(c.marketShare),
                euro(c.revenue),
                euro(c.netIncome),
              ])}
            />
          </Report>
        ) : null}
        {reports.price ? (
          <Report title="Analyse de prix">
            <p>
              Votre prix du tour :{" "}
              <strong className="text-slate-100">
                {reports.price.yourPrice.toFixed(2).replace(".", ",")} €
              </strong>
            </p>
            <Table
              head={["Segment", "Prix de réf.", "Élasticité estimée", "Plancher crédible", "Seuils psychologiques"]}
              rows={reports.price.segments.map((s) => [
                s.name,
                `${s.refPrice} €`,
                `≈ ${s.elasticity.toLocaleString("fr-FR")}`,
                `${s.minAcceptablePrice} €`,
                s.thresholds.length > 0 ? s.thresholds.map((t) => `${t} €`).join(", ") : "—",
              ])}
            />
            <p className="text-slate-500">
              Élasticité : une baisse de prix de 1 % fait varier la demande du segment de ce
              pourcentage. Sous le plancher, la méfiance s&apos;installe : trop beau pour être vrai.
            </p>
          </Report>
        ) : null}
        {reports.finance ? (
          <Report title="Étude financière">
            <Table
              head={["Ratio", "Valeur"]}
              rows={[
                ["Profitabilité (résultat / CA)", pct(reports.finance.ratios.profitability)],
                ["Rentabilité économique", pct(reports.finance.ratios.returnOnCapitalEmployed)],
                ["Rentabilité financière (ROE)", pct(reports.finance.ratios.returnOnEquity)],
                ["Endettement (D / CP)", reports.finance.ratios.debtToEquity.toFixed(2).replace(".", ",")],
                ["Rotation des actifs", reports.finance.ratios.assetTurnover.toFixed(2).replace(".", ",")],
              ]}
            />
            <Table
              head={["Coûts", "Valeur"]}
              rows={[
                ["Coût variable unitaire", euro(reports.finance.costs.unitVariableCost)],
                ["Marge sur coût variable / u", euro(reports.finance.costs.unitMargin)],
                ["Seuil de rentabilité", `${units(reports.finance.costs.breakEvenUnits)} u`],
                ["Marge de sécurité", euro(reports.finance.costs.safetyMargin)],
              ]}
            />
            <p className="text-slate-500">
              Secteur ({reports.finance.sector.teams} concurrents) · CA moyen{" "}
              {euro(reports.finance.sector.avgRevenue)}, résultat net moyen{" "}
              {euro(reports.finance.sector.avgNetIncome)}, trésorerie nette moyenne{" "}
              {euro(reports.finance.sector.avgNetTreasury)}.
            </p>
          </Report>
        ) : null}
        {reports.project ? (
          <Report title="Analyse de projet">
            {reports.project.investment ? (
              <>
                <p>
                  Investissement capacitaire étudié :{" "}
                  <strong className="text-slate-100">
                    {units(reports.project.investment.capacityUnits)} u de capacité pour{" "}
                    {euro(reports.project.investment.outlay)}
                  </strong>
                  , amorti sur {units(reports.project.investment.rounds)} tours. Hypothèse de
                  flux : vos {units(reports.project.investment.lostUnits)} ventes manquées du
                  tour × {euro(reports.project.investment.unitMargin)} de marge unitaire.
                </p>
                <Table
                  head={["Critère", "Valeur", "Lecture"]}
                  rows={[
                    [
                      "VAN",
                      euro(reports.project.investment.npv),
                      reports.project.investment.npv > 0
                        ? "positive : le projet crée de la valeur"
                        : "négative : au niveau de demande actuel, s'abstenir",
                    ],
                    [
                      "TRI",
                      reports.project.investment.irr !== null
                        ? `${pct(reports.project.investment.irr)} / tour`
                        : "n.c.",
                      `à comparer au taux de financement (${pct(reports.project.investment.ratePerRound)} / tour)`,
                    ],
                    [
                      "Délai de récupération",
                      reports.project.investment.paybackRounds !== null
                        ? `${Math.ceil(reports.project.investment.paybackRounds)} tours`
                        : "jamais",
                      "au-delà de l'horizon, prudence",
                    ],
                  ]}
                />
              </>
            ) : null}
            {reports.project.currentOffer ? (
              <p className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
                Commande « {reports.project.currentOffer.title} » de ce tour : marge sur coût
                variable totale{" "}
                <strong className="text-slate-100">
                  {euro(reports.project.currentOffer.margin)}
                </strong>
                {reports.project.currentOffer.paymentDelayDays > 0 ? (
                  <>
                    {" "}
                    , mais {reports.project.currentOffer.paymentDelayDays} jours d&apos;attente :
                    coût de portage estimé{" "}
                    {euro(reports.project.currentOffer.carryCost)} au taux du découvert. La
                    marge nette de portage reste{" "}
                    {euro(
                      reports.project.currentOffer.margin - reports.project.currentOffer.carryCost,
                    )}
                    , SI votre banque suit.
                  </>
                ) : (
                  <>, réglée comptant : aucun portage, mais c&apos;est toute la marge.</>
                )}
              </p>
            ) : null}
          </Report>
        ) : null}
      </div>
    </section>
  );
}
