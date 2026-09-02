import { formatEuro, formatPercent } from "@/lib/format";
import type { GameView } from "@/services/game-view.service";

export function CompetitiveBenchmark({
  benchmark,
}: {
  benchmark: NonNullable<GameView["competitiveBenchmark"]>;
}) {
  const playerIdx = benchmark.competitivenessIndex;
  const idxTone =
    playerIdx >= 1.05 ? "text-emerald-400" : playerIdx < 0.95 ? "text-red-400" : "text-slate-100";

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fuchsia-300">
        📊 Benchmark concurrentiel
      </h3>

      <div className="mb-4 flex items-baseline gap-3 rounded-lg border border-fuchsia-400/20 bg-fuchsia-950/20 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Indice de compétitivité-prix
          </p>
          <p className={`text-2xl font-semibold tabular-nums ${idxTone}`}>
            {(playerIdx * 100).toFixed(0)}
          </p>
        </div>
        <p className="text-xs leading-snug text-slate-500">
          {playerIdx >= 1.05
            ? "Votre prix est inférieur au marché : vous captez de la demande, mais marquez-vous assez ?"
            : playerIdx < 0.95
              ? "Votre prix dépasse le marché : vous marquez plus par unité, mais risquez d'en vendre moins."
              : "Votre prix est aligné sur le marché : la bataille se joue sur d'autres leviers."}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-2 pr-3 font-medium">Entreprise</th>
              <th className="pb-2 pr-3 text-right font-medium">Prix moyen</th>
              <th className="pb-2 pr-3 text-right font-medium">Part de marché</th>
              <th className="pb-2 text-right font-medium">Chiffre d&apos;affaires</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {benchmark.competitors.map((c) => (
              <tr
                key={c.name}
                className={`border-t border-white/5 ${c.isPlayer ? "bg-amber-400/5 text-amber-100" : ""}`}
              >
                <td className="py-2 pr-3">
                  {c.name}
                  {c.isPlayer ? (
                    <span className="ml-1.5 text-xs text-amber-400/70">vous</span>
                  ) : null}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {c.avgPrice !== null ? formatEuro(c.avgPrice) : "—"}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatPercent(c.marketShare)}
                </td>
                <td className="py-2 text-right tabular-nums">{formatEuro(c.revenue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 text-xs text-slate-500">
              <td className="pt-2 pr-3">Moyenne du marché</td>
              <td className="pt-2 pr-3 text-right tabular-nums">
                {benchmark.marketAvgPrice > 0 ? formatEuro(benchmark.marketAvgPrice) : "—"}
              </td>
              <td className="pt-2 pr-3" />
              <td className="pt-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        L&apos;indice de compétitivité-prix compare votre prix au marché : au-dessus de
        100, vous êtes moins cher ; en dessous, plus cher. Le prix n&apos;est qu&apos;un levier
        parmi d&apos;autres : marketing, qualité et stock font le reste.
      </p>
    </section>
  );
}
