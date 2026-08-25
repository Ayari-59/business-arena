/** Carte KPI (stat tile) : valeur en ink primaire, contexte en secondaire. */
export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "critical";
}) {
  const valueColor =
    tone === "good" ? "text-emerald-400" : tone === "critical" ? "text-red-400" : "text-slate-50";
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueColor}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
