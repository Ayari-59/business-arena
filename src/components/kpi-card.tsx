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
  const border =
    tone === "good"
      ? "border-emerald-500/40"
      : tone === "critical"
        ? "border-red-500/40"
        : "border-white/10";
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
    <div className={`relative overflow-hidden rounded-xl border ${border} bg-slate-900 p-4`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${stripe}`} />
      <p className="pl-2 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2 pl-2">
        <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
        {trend ? (
          <span className={`text-xs font-medium ${trendColor}`}>
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
