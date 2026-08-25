import { BPI_DIMENSIONS, DIMENSION_LABELS, type BpiDimension } from "@/scoring/bpi";

/** Décomposition du BPI de l'équipe : 7 barres 0-100 (moyenne des tours joués). */
export function BpiPanel({
  dimensions,
}: {
  dimensions: Partial<Record<BpiDimension, number>>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Votre profil de performance</h2>
      <ul className="space-y-2">
        {BPI_DIMENSIONS.map((dimension) => {
          const value = dimensions[dimension];
          if (value === undefined) return null;
          return (
            <li key={dimension} className="text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>{DIMENSION_LABELS[dimension]}</span>
                <span className="tabular-nums text-slate-400">{Math.round(value)}</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-slate-950">
                <div
                  className="h-1.5 rounded-full bg-[#3987e5]"
                  style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
