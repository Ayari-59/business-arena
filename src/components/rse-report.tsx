import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import type { RseReport, RseReportIndicator } from "@/scoring/rse-report";

/**
 * RAPPORT EXTRA-FINANCIER (Lot 3) — synthèse façon DPEF, INDICATIVE et non
 * normée, dérivée de tous les tours joués. Affiché une fois, sur le dernier
 * tour clos. L'empreinte carbone est un proxy pédagogique (points, pas des
 * tCO₂e) : la mention le dit explicitement.
 */

function formatIndicator(i: RseReportIndicator): string {
  switch (i.format) {
    case "euro":
      return formatEuro(i.value);
    case "percent":
      return formatPercent(i.value);
    case "count":
      return String(Math.round(i.value));
    case "units":
      return formatUnits(i.value);
    case "index":
      return i.value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
    case "ratio":
      return i.value.toLocaleString("fr-FR", { maximumFractionDigits: 3 });
  }
}

const TREND_LABEL: Record<RseReport["carbon"]["trend"], { text: string; className: string }> = {
  amélioration: { text: "↓ en amélioration", className: "text-emerald-300" },
  stable: { text: "→ stable", className: "text-slate-400" },
  dégradation: { text: "↑ en dégradation", className: "text-amber-300" },
};

function Pillar({ title, items }: { title: string; items: RseReportIndicator[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950 p-1.5 sm:p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <dl className="space-y-1.5">
        {items.map((i) => (
          <div key={i.label} className="flex items-baseline justify-between gap-3 text-xs">
            <dt className="text-slate-400">
              {i.label}
              {i.hint ? <span className="text-slate-600"> · {i.hint}</span> : null}
            </dt>
            <dd className="shrink-0 tabular-nums font-semibold text-slate-200">
              {formatIndicator(i)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function RseReportPanel({ report }: { report: RseReport }) {
  if (!report.available) return null;
  const trend = TREND_LABEL[report.carbon.trend];
  return (
    <section
      aria-label="Rapport extra-financier"
      className="rounded-xl border border-emerald-400/20 bg-slate-900 p-1.5 sm:p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-200">🌍 Rapport extra-financier</h2>
        <span className="tabular-nums text-lg font-semibold text-emerald-300">
          {report.latestScore}
          <span className="text-xs text-slate-400"> / 100</span>
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Synthèse sur {report.roundsCovered} tour{report.roundsCovered > 1 ? "s" : ""} · engagement RSE
        cumulé {formatEuro(report.engagementTotal)}
      </p>

      {report.highlights.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {report.highlights.map((h) => (
            <span
              key={h}
              className="rounded-full border border-white/10 bg-slate-950 px-2 py-0.5 text-xs text-slate-300"
            >
              {h}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-emerald-400/10 bg-slate-950 p-1.5 sm:p-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Empreinte carbone (indice indicatif)
          </h3>
          <span className={`text-xs font-semibold ${trend.className}`}>{trend.text}</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="tabular-nums text-base font-semibold text-slate-100">
              {Math.round(report.carbon.totalPoints).toLocaleString("fr-FR")}
            </p>
            <p className="text-xs text-slate-500">points cumulés</p>
          </div>
          <div>
            <p className="tabular-nums text-base font-semibold text-slate-100">
              {report.carbon.perUnit.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500">points / unité</p>
          </div>
          <div>
            <p className="tabular-nums text-base font-semibold text-emerald-300">
              {formatPercent(report.carbon.avoidedShare)}
            </p>
            <p className="text-xs text-slate-500">évité (process propre)</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Pillar title="Environnement" items={report.pillars.environment} />
        <Pillar title="Social" items={report.pillars.social} />
        <Pillar title="Gouvernance" items={report.pillars.governance} />
      </div>

      <p className="mt-3 text-xs leading-snug text-slate-500">
        Synthèse <strong>indicative et simplifiée</strong>, à visée pédagogique : elle s&apos;inspire
        d&apos;une déclaration de performance extra-financière sans en suivre une norme officielle.
        L&apos;empreinte carbone est un <strong>proxy</strong> (points, non des tCO₂e).
      </p>
    </section>
  );
}
