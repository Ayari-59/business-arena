import { Sparkline } from "@/components/charts";

/** Carte KPI (stat tile) : bordure sémantique, valeur en ink primaire, trend optionnel. */
export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  trend,
  sparklineData,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "critical";
  trend?: { direction: "up" | "down" | "flat"; label: string };
  sparklineData?: number[];
}) {
  // Le sens est porté par la bande pleine de gauche : le cadre reste neutre
  // (il était vert ou rouge dilués, des pastels).
  const border = "border-white/10";
  const valueColor =
    tone === "good" ? "text-emerald-400" : tone === "critical" ? "text-red-400" : "text-slate-50";
  const stripe =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "critical"
        ? "bg-red-500"
        : "bg-slate-600";
  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-400"
      : trend?.direction === "down"
        ? "text-red-400"
        : "text-slate-400";
  const trendArrow =
    trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "→";

  return (
    <div className={`relative overflow-hidden rounded-xl border ${border} bg-slate-900 p-3 sm:p-5`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${stripe}`} />
      <p className="pl-2 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      {/* La tendance passe à la ligne plutôt que de sortir du cadre : sur un
          téléphone, deux tuiles côte à côte laissent 150 px à « −27 709 € ↓
          225,9 % », et le pourcentage débordait de la tuile, coupé net. */}
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 pl-2">
        <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
        {trend ? (
          <span className={`whitespace-nowrap text-xs font-medium ${trendColor}`}>
            {trendArrow} {trend.label}
          </span>
        ) : null}
        {sparklineData && sparklineData.length >= 2 ? (
          <Sparkline data={sparklineData} />
        ) : null}
      </div>
      {hint ? <p className="mt-1 pl-2 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
