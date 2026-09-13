import type { HautFait } from "@/scoring/hauts-faits";

/**
 * Ce que l'équipe vient de réussir, dit au tour où ça arrive.
 *
 * Discret par construction : une ou deux lignes en tête des résultats, jamais
 * une fanfare. Ce sont des constats lus dans les chiffres du tour — ils
 * n'ajoutent aucun point et ne pèsent sur rien.
 */
export function HautsFaits({ faits }: { faits: readonly HautFait[] }) {
  if (faits.length === 0) return null;
  return (
    <ul className="space-y-1.5" aria-label="Ce que vous avez réussi ce tour-ci">
      {faits.map((f) => (
        <li
          key={f.code}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg border border-emerald-400/25 bg-emerald-950/20 px-3 py-2"
        >
          <span aria-hidden className="text-sm">
            ★
          </span>
          <span className="text-sm font-semibold text-emerald-200">{f.titre}</span>
          <span className="text-xs text-slate-400">{f.detail}</span>
        </li>
      ))}
    </ul>
  );
}
