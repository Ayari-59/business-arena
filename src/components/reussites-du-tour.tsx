import type { Reussite } from "@/scoring/reussites";

/**
 * Ce que l'équipe vient de réussir, dit au tour où ça arrive.
 *
 * Une ligne, sobre : la médaille d'or et le nom de chaque distinction obtenue
 * ce tour-ci, le détail au survol et pour les lecteurs d'écran. Elle était une
 * pile d'encadrés étoilés : une fanfare, là où l'on veut un constat lu dans
 * les chiffres du tour. Elle n'ajoute aucun point et ne pèse sur rien.
 */
export function ReussitesDuTour({ reussites }: { reussites: readonly Reussite[] }) {
  if (reussites.length === 0) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-surtitre text-slate-400">
        {reussites.length > 1 ? "Distinctions du tour" : "Distinction du tour"}
      </span>
      {reussites.map((f) => (
        <span key={f.code} className="inline-flex items-center gap-1.5" title={f.detail}>
          <span aria-hidden className="medaille medaille-or" />
          <span className="font-semibold text-slate-100">{f.titre}</span>
          <span className="sr-only"> : {f.detail}</span>
        </span>
      ))}
    </p>
  );
}
