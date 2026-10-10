import { Sparkline } from "@/components/charts";

/** Carte KPI (stat tile) : un libellé, la valeur (le sens est sur elle), trend optionnel. */
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
  // LOT P3 : LE SENS EST SUR LE CHIFFRE. La tuile portait une bande pleine à
  // gauche : verte ou rouge pour un résultat, à la teinte du métier sinon —
  // une arête de métier de plus sur l'écran d'un tour clos, et un rouge qui
  // cernait la tuile d'un tour en perte. C'est une INFORMATION (un libellé et
  // sa valeur) : la valeur dit seule le gain ou la perte, en vert ou en rouge
  // francs.
  const valueColor =
    tone === "good" ? "text-emerald-400" : tone === "critical" ? "text-red-400" : "text-slate-50";
  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-400"
      : trend?.direction === "down"
        ? "text-red-400"
        : "text-slate-400";
  const trendArrow = trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "→";

  return (
    // LOT 6E : UNE TUILE, PAS UN CADRE. Elle est posée dans le panneau d'un tour
    // clos : son filet faisait un cadre dans un cadre. Elle se lit à son voile
    // (lot P3 : plus de bande de couleur).
    <div className="relative overflow-hidden rounded-xl bg-slate-950/40 p-3 sm:p-5">
      <p className="libelle">{label}</p>
      {/* La tendance passe à la ligne plutôt que de sortir du cadre : sur un
          téléphone, deux tuiles côte à côte laissent 150 px à « −27 709 € ↓
          225,9 % », et le pourcentage débordait de la tuile, coupé net. */}
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
        {trend ? (
          <span className={`whitespace-nowrap text-xs font-medium ${trendColor}`}>
            {trendArrow} {trend.label}
          </span>
        ) : null}
        {sparklineData && sparklineData.length >= 2 ? <Sparkline data={sparklineData} /> : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
