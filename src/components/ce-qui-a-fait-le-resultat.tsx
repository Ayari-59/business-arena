import { formatEuro } from "@/lib/format";
import type { CauseDuResultat, DecompositionDuResultat } from "@/components/lecture-du-resultat";

/**
 * « CE QUI A FAIT LE RÉSULTAT » : LA CASCADE ET LES CAUSES, EN UN COUP D'ŒIL.
 *
 * Posé sous le chiffre du verdict (le rituel de fin de tour, la synthèse d'un
 * tour clos) : le chiffre, PUIS la cause, PUIS la place — la règle du rituel
 * tient. Ce n'est pas un tableau de bord : cinq barres et trois phrases, rien
 * à manipuler.
 *
 * LA PALETTE DES DONNÉES (charte) : le chiffre d'affaires en bleu donnée, ce
 * qui s'en retranche en gris ardoise, et le résultat dans SA couleur de
 * résultat, vert ou rouge francs, sans dilution. Une barre ne dit jamais rien
 * seule : chaque marche porte son libellé et son montant écrits.
 *
 * Le composant ne calcule rien : la cascade et les causes viennent de
 * `lecture-du-resultat.ts`, qui les lit dans les comptes du tour.
 */
export function CeQuiAFaitLeResultat({
  decomposition,
  causes,
  forme = "rituel",
}: {
  decomposition: DecompositionDuResultat;
  causes: readonly CauseDuResultat[];
  /** Le rituel plein écran (centré, plus grand) ou la synthèse d'un tour clos. */
  forme?: "rituel" | "synthese";
}) {
  const { marches } = decomposition;
  // L'axe : de la plus basse à la plus haute des bornes, zéro compris.
  const bornes = marches.flatMap((m) => [m.debut, m.fin]);
  const bas = Math.min(0, ...bornes);
  const haut = Math.max(0, ...bornes);
  const echelle = haut - bas || 1;
  const rituel = forme === "rituel";
  // Au rituel, les DEUX causes les plus fortes : l'écran du marché qui répond
  // doit garder son action dans la fenêtre. La synthèse d'un tour clos, qu'on
  // lit à loisir, en porte jusqu'à trois.
  const retenues = rituel ? causes.slice(0, 2) : causes;

  return (
    <section
      aria-label="Ce qui a fait le résultat"
      data-ce-qui-a-fait-le-resultat=""
      className={`grid gap-x-8 gap-y-4 text-left ${causes.length > 0 ? "md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" : ""}`}
    >
      <div className="min-w-0">
        <p className="libelle font-semibold text-slate-200">
          Ce qui a fait le résultat
        </p>
        <ol className="mt-2 space-y-1">
          {marches.map((m) => {
            const gauche = ((Math.min(m.debut, m.fin) - bas) / echelle) * 100;
            const largeur = Math.max(0.6, (Math.abs(m.fin - m.debut) / echelle) * 100);
            const resultat = m.cle === "resultat";
            const teinte = resultat
              ? m.montant >= 0
                ? "bg-emerald-400"
                : "bg-red-400"
              : m.cle === "ca"
                ? "bg-[var(--donnee)]"
                : "bg-[var(--donnee-2)]";
            return (
              <li
                key={m.cle}
                data-marche={m.cle}
                // Trois colonnes de largeur FIXE pour le libellé et le montant :
                // toutes les barres partagent le même rail, donc la même échelle.
                className={`grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_6rem] items-center gap-x-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_6.25rem] ${
                  rituel ? "text-sm" : "text-xs sm:text-sm"
                } ${resultat ? "pt-1.5" : ""}`}
              >
                <span
                  className={`leading-tight ${resultat ? "font-semibold text-slate-50" : "text-slate-300"}`}
                >
                  {m.libelle}
                </span>
                <span aria-hidden className="relative h-2.5 rounded-md bg-white/[0.06]">
                  <span
                    className={`cascade-barre absolute top-0 ${teinte}`}
                    style={{ left: `${gauche}%`, width: `${largeur}%` }}
                  />
                </span>
                <span
                  className={`whitespace-nowrap text-right tabular-nums ${
                    resultat
                      ? `font-semibold ${m.montant >= 0 ? "text-emerald-300" : "text-red-300"}`
                      : "text-slate-100"
                  }`}
                >
                  {m.cle === "ca" || resultat ? "" : "− "}
                  {formatEuro(m.cle === "ca" || resultat ? m.montant : Math.abs(m.montant))}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {retenues.length > 0 ? (
        <div className="min-w-0">
          <p className="libelle font-semibold text-slate-200">
            Les causes les plus fortes
          </p>
          <ul
            className={`mt-2 space-y-2 leading-snug text-slate-200 ${rituel ? "text-sm sm:text-base" : "text-sm"}`}
          >
            {retenues.map((c) => (
              <li key={c.cle} data-cause={c.cle}>
                <strong className="font-semibold text-slate-50">{c.titre}</strong> : {c.texte}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
