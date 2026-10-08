import type { Indicateur, Lecture } from "@/config/episodes/types";

/**
 * LE TABLEAU DE BORD DU MANAGER.
 *
 * Les chiffres que sa direction regarde, ceux que l'épisode déclare. Après
 * une décision, chacun porte l'écart avec la lecture précédente, coloré selon
 * le sens qui est bon : un délai qui MONTE est une mauvaise nouvelle, un
 * chiffre d'affaires qui monte une bonne. Le signe dit le sens ; la couleur
 * ne fait que le confirmer.
 *
 * C'est un ÉCRAN DE CHIFFRES : il prend la matière du tableau (`ardoise`), le
 * marine de l'arène, à côté du récit qui reste sur le clair. L'œil sait ainsi
 * où regarder pour savoir où l'on en est.
 */
function Ecart({
  apres,
  avant,
  format,
  sensBon,
}: {
  apres: number | null | undefined;
  avant: number | null | undefined;
  format: (v: number) => string;
  sensBon: 1 | -1;
}) {
  if (avant == null || apres == null) return null;
  const d = apres - avant;
  if (Math.abs(d) < 1e-9) return null;
  const bon = sensBon * d > 0;
  return (
    <span
      // L'écart dit un résultat : son signe et sa couleur, francs, sans voile.
      className={`ml-2 text-xs font-semibold tabular-nums ${
        bon ? "text-emerald-300" : "text-rose-300"
      }`}
    >
      {d > 0 ? "+" : "−"}
      {format(Math.abs(d))}
    </span>
  );
}

export function TableauDeBord({
  nom,
  indicateurs,
  semaine,
  lecture,
  avant,
}: {
  nom: string;
  indicateurs: readonly Indicateur[];
  semaine: number;
  lecture: Lecture;
  avant: Lecture | null;
}) {
  return (
    <section aria-labelledby="tableau-titre" className="ardoise carte p-4 sm:p-5">
      <h2
        id="tableau-titre"
        className="text-xs font-semibold uppercase tracking-etiquette text-slate-400"
      >
        {nom} · {semaine ? `fin de semaine ${semaine}` : "aujourd'hui"}
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-1 lg:gap-y-4">
        {indicateurs.map((ind) => {
          const v = lecture[ind.cle];
          const jauge = ind.jauge?.(lecture);
          return (
            <div key={ind.cle} className="min-w-0">
              <dt className="text-sm text-slate-400">{ind.nom}</dt>
              <dd className="mt-0.5 flex flex-wrap items-baseline">
                <span className="font-display text-2xl font-bold tabular-nums text-slate-50">
                  {v == null ? "—" : ind.format(v)}
                </span>
                <Ecart
                  apres={v}
                  avant={avant?.[ind.cle]}
                  format={ind.formatEcart ?? ind.format}
                  sensBon={ind.sensBon}
                />
              </dd>
              <dd className="mt-0.5 text-xs text-slate-400">{ind.aide(semaine, lecture)}</dd>
              {jauge && (
                <dd
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800"
                  aria-label={jauge.enRetard ? "en retard sur l'objectif" : "à l'objectif"}
                >
                  <span
                    // La jauge est une donnée (bleu donnée) ; seul le retard sur
                    // l'objectif, un écart, prend le rouge. L'orange était celui
                    // de l'action, et le vert ne dit pas « à l'objectif ».
                    className={`block h-full rounded-full ${jauge.enRetard ? "bg-red-400" : "bg-[var(--donnee)]"}`}
                    style={{ width: `${100 * jauge.part}%` }}
                  />
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
