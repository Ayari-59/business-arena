import { Icone } from "@/components/icone";
import {
  constatDeLaDefaillance,
  remedeALaDefaillance,
  type CadreDeLaDefaillance,
} from "@/config/defaillance";

/**
 * LE BANDEAU DES ENTREPRISES DÉFAILLANTES, CÔTÉ ENSEIGNANT.
 *
 * Il promettait, à tous les niveaux, « une augmentation de capital qui ramène
 * le découvert sous le plafond » : un levier qui n'existe pas aux niveaux 1 à
 * 3, où l'élève lisait au même instant le contraire. Il dit désormais le
 * remède que le bandeau de l'élève dit, lu au même endroit
 * (`config/defaillance.ts`), et le nombre de tours que la partie a réglé.
 */
export function BandeauDesDefaillantes({
  noms,
  cadre,
}: {
  noms: string[];
  cadre: CadreDeLaDefaillance;
}) {
  if (noms.length === 0) return null;
  return (
    <section className="rounded-xl encadre-perte p-3 sm:p-5">
      <h2 className="text-sm font-semibold text-red-300">
        <Icone nom="alerte" className="mr-1.5 h-4 w-4" />
        {noms.length === 1 ? "Une entreprise défaillante" : `${noms.length} entreprises défaillantes`}
      </h2>
      <p className="mt-1 text-xs text-red-200">
        {constatDeLaDefaillance(cadre.toursAvantDefaillance)} La note financière tombe à zéro.{" "}
        {remedeALaDefaillance(cadre, "animateur")}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {noms.map((nom) => (
          <li
            key={nom}
            className="rounded-full encadre-perte px-3 py-1 text-xs font-semibold text-red-200"
          >
            {nom}
          </li>
        ))}
      </ul>
    </section>
  );
}
