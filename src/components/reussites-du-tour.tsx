import type { Reussite } from "@/scoring/reussites";

/**
 * Ce que l'équipe vient de réussir, dit au tour où ça arrive.
 *
 * Discret par construction : une ou deux lignes en tête des résultats, jamais
 * une fanfare. Ce sont des constats lus dans les chiffres du tour — ils
 * n'ajoutent aucun point et ne pèsent sur rien.
 */
export function ReussitesDuTour({ reussites }: { reussites: readonly Reussite[] }) {
  if (reussites.length === 0) return null;
  return (
    <ul className="space-y-1.5" aria-label="Ce que vous avez réussi ce tour-ci">
      {reussites.map((f) => (
        <li
          key={f.code}
          className="encadre-distinction flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-3 py-2"
        >
          <span aria-hidden className="texte-or text-sm">
            ★
          </span>
          <span className="text-sm font-semibold text-slate-100">{f.titre}</span>
          <span className="text-xs text-slate-400">{f.detail}</span>
        </li>
      ))}
    </ul>
  );
}
