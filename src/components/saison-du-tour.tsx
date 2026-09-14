/**
 * LA SAISON DU TOUR — un coefficient qui change la décision, pas une note de
 * bas de page.
 *
 * Il a longtemps tenu dans une ligne bleu pâle, en bas de l'écran : « Saison du
 * tour : Marché ×0,94 (basse saison) · Comités d'entreprise ×0,6 (basse
 * saison) ». Trois défauts dans une seule phrase.
 *
 *  1. ELLE NE SE VOYAIT PAS. Le bleu discret la rangeait avec les mentions
 *     légales, alors qu'elle porte le multiplicateur de la demande du tour —
 *     c'est-à-dire ce qui décide du volume à produire.
 *  2. ×0,94 N'EST PAS LISIBLE. Un élève de première année ne convertit pas un
 *     coefficient en pourcentage de tête. Le chiffre est maintenant traduit :
 *     « 6 % de demande en moins ce tour ».
 *  3. TOUT ÉTAIT SUR LE MÊME PLAN. Le coefficient d'ensemble et celui d'une
 *     clientèle particulière se suivaient, séparés par un point médian. Le
 *     premier commande, les autres nuancent.
 *
 * La couleur suit le sens : une saison qui gonfle la demande est un vent
 * favorable (vert), une saison qui la réduit est un vent contraire (ambre — une
 * difficulté du jeu, pas une erreur de l'élève).
 */

/** « +15 % », « −6 % » : le coefficient dit en langue de l'élève. */
export function ecartSaison(coef: number): string {
  const pct = Math.round((coef - 1) * 100);
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)} %`;
}

const coefficient = (coef: number) =>
  `×${coef.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}`;

export function SaisonDuTour({ notes }: { notes: { name: string; coef: number }[] }) {
  if (notes.length === 0) return null;

  // La première note est la plus large — le marché du scénario, ou la première
  // référence de la gamme. Elle commande le ton de l'encart ; les suivantes
  // sont des clientèles ou des références particulières.
  const [tete, ...detail] = notes;
  const haute = tete!.coef > 1;

  return (
    <section
      className={`rounded-lg border border-white/10 border-l-2 bg-slate-900 px-3 py-3 sm:px-4 ${
        haute ? "border-l-emerald-400/70" : "border-l-amber-400/70"
      }`}
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span aria-hidden className="text-base leading-none">
          {haute ? "☀️" : "🌧️"}
        </span>
        Saison du tour
        <span className={haute ? "text-emerald-300" : "text-amber-300"}>
          {haute ? "haute saison" : "basse saison"}
        </span>
      </p>

      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={`text-2xl font-semibold tabular-nums ${
            haute ? "text-emerald-300" : "text-amber-300"
          }`}
        >
          {coefficient(tete!.coef)}
        </span>
        <span className="text-sm text-slate-300">{tete!.name}</span>
      </p>
      <p className="mt-0.5 text-sm leading-snug text-slate-400">
        {Math.abs(Math.round((tete!.coef - 1) * 100))} % de demande en{" "}
        {haute ? "plus" : "moins"} ce tour, à prix et à effort de vente
        inchangés.
      </p>

      {detail.length > 0 ? (
        <ul className="mt-2.5 space-y-1 border-t border-white/5 pt-2">
          {detail.map((n) => (
            <li key={n.name} className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="min-w-0 text-slate-300">{n.name}</span>
              <span className="shrink-0 whitespace-nowrap tabular-nums text-slate-400">
                {coefficient(n.coef)}
              </span>
              <span
                className={`shrink-0 whitespace-nowrap tabular-nums ${
                  n.coef > 1 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {ecartSaison(n.coef)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
