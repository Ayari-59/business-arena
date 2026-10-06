import type { Indicateur, Lecture } from "@/config/episodes/types";

/**
 * LE TABLEAU DE BORD DU MANAGER.
 *
 * Les chiffres que sa direction regarde, ceux que l'épisode déclare. Après
 * une décision, chacun porte l'écart avec la lecture précédente, coloré selon
 * le sens qui est bon : un délai qui MONTE est une mauvaise nouvelle, un
 * chiffre d'affaires qui monte une bonne. Le signe dit le sens ; la couleur
 * ne fait que le confirmer.
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
      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        bon ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
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
    <section aria-labelledby="tableau-titre" className="carte p-4 sm:p-5">
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
                <span className="font-display text-xl font-semibold tabular-nums text-slate-50">
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
                    className={`block h-full rounded-full ${jauge.enRetard ? "bg-amber-400" : "bg-emerald-400"}`}
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
