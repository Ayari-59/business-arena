import { formatEuro, formatPercent } from "@/lib/format";
import type { VarianceOutput } from "@/engine/costs/variance";

/**
 * Variance Analysis Panel: Displays cost and revenue variance decomposition.
 * Cost variances (price/efficiency) are the core; revenue context shows segment impact.
 * Only shown when variances are non-negligible (engine filters at < 1€).
 */
export function VariancePanel({
  variances,
  segmentNames,
}: {
  variances: VarianceOutput;
  segmentNames: Record<string, string>;
}) {
  const cvVar = [
    { label: "Écart de prix matière", value: variances.materialPriceVariance },
    { label: "Écart d'efficacité matière", value: variances.materialEfficiencyVariance },
    { label: "Écart d'efficacité main-d'œuvre", value: variances.laborEfficiencyVariance },
  ];

  const totalFavorable = variances.totalCostVariance <= 0;

  return (
    <div className="rounded-lg border border-amber-400/25 bg-amber-950/20 px-1.5 py-3 sm:p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        📊 Décomposition des écarts de coûts
      </h3>

      {/* Cost Variance Breakdown */}
      <div className="mt-3 space-y-1">
        <p className="text-xs text-slate-400">Écarts de coûts (€ — positif = défavorable)</p>
        <div className="space-y-1 rounded-md bg-slate-950/50 p-2">
          {cvVar.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{item.label}</span>
              <span
                className={`tabular-nums font-medium ${
                  item.value > 0.5 ? "text-red-400" : item.value < -0.5 ? "text-emerald-400" : "text-slate-300"
                }`}
              >
                {item.value >= 0 ? "+" : ""}
                {formatEuro(item.value)}
              </span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">Total écarts de coûts</span>
              <span
                className={`tabular-nums ${
                  totalFavorable ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {variances.totalCostVariance >= 0 ? "+" : ""}
                {formatEuro(variances.totalCostVariance)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-xs text-slate-400">
              <span>Ratio aux coûts réels</span>
              <span className="tabular-nums">
                {formatPercent(variances.costVarianceRatio)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Variance by Segment */}
      {Object.keys(variances.revenueVarianceBySegment).length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-slate-400">Contexte commercial par segment</p>
          <div className="space-y-1 rounded-md bg-slate-950/50 p-2">
            {Object.entries(variances.revenueVarianceBySegment).map(([code, data]) => (
              <div key={code} className="border-t border-white/10 pt-1 first:border-0 first:pt-0">
                <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                  <span>{segmentNames[code] ?? code}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-xs text-slate-400">
                  <span>Variance prix/volume</span>
                  <span className="tabular-nums">
                    {data.totalVariance >= 0 ? "+" : ""}
                    {formatEuro(data.totalVariance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contribution Margin Variance */}
      <div className="mt-3 rounded-md bg-slate-800/30 p-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300">Impact sur la marge de contribution</span>
          <span
            className={`tabular-nums font-semibold ${
              variances.contributionMarginVariance >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {variances.contributionMarginVariance >= 0 ? "+" : ""}
            {formatEuro(variances.contributionMarginVariance)}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Les écarts de coûts (matière et efficacité) pèsent directement sur le résultat. Le contexte
        commercial par segment montre comment prix et volume ont joué : ces variances n'influent pas
        aujourd'hui, mais elles éclairent le diagnostic.
      </p>
    </div>
  );
}
