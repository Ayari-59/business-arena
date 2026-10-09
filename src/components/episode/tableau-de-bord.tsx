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
  serre = false,
}: {
  apres: number | null | undefined;
  avant: number | null | undefined;
  format: (v: number) => string;
  sensBon: 1 | -1;
  /** Dans la ligne repliée : sans marge, au corps du texte voisin. */
  serre?: boolean;
}) {
  if (avant == null || apres == null) return null;
  const d = apres - avant;
  if (Math.abs(d) < 1e-9) return null;
  const bon = sensBon * d > 0;
  return (
    <span
      // L'écart dit un résultat : son signe et sa couleur, francs, sans voile.
      className={`${serre ? "" : "ml-2"} text-xs font-semibold tabular-nums ${
        bon ? "text-emerald-300" : "text-red-300"
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
  nu = false,
}: {
  nom: string;
  indicateurs: readonly Indicateur[];
  semaine: number;
  lecture: Lecture;
  avant: Lecture | null;
  /** Déplié depuis la ligne collante : sans cadre ni titre, la ligne les porte. */
  nu?: boolean;
}) {
  return (
    <section
      aria-labelledby={nu ? undefined : "tableau-titre"}
      aria-label={nu ? nom : undefined}
      className={nu ? "pt-3" : "ardoise carte p-4 sm:p-5"}
    >
      {nu ? null : (
        <h2
          id="tableau-titre"
          className="text-xs font-semibold uppercase tracking-etiquette text-slate-400"
        >
          {nom} · {semaine ? `fin de semaine ${semaine}` : "aujourd'hui"}
        </h2>
      )}
      <dl
        className={`grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-1 lg:gap-y-4 ${nu ? "" : "mt-3"}`}
      >
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
                    // La jauge est l'avancement de CETTE entreprise : elle
                    // prend la teinte de son métier (lot 5A) ; seul le retard
                    // sur l'objectif, un écart, prend le rouge. L'orange était
                    // celui de l'action, et le vert ne dit pas « à l'objectif ».
                    className={`block h-full rounded-full ${jauge.enRetard ? "bg-red-400" : "bg-[color:var(--metier,var(--donnee))]"}`}
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

/**
 * LE TABLEAU DE BORD, EN UNE LIGNE COLLANTE (téléphone).
 *
 * Sur téléphone, le panneau marine passait AU-DESSUS du récit : on voyait un
 * tableau de chiffres avant le titre de l'épisode, puis, à chaque étape, une
 * lisière de 12 px sous l'en-tête ; on décidait sans voir ses chiffres. Le
 * récit passe désormais en premier, et le panneau devient une ligne collée
 * sous l'en-tête : chaque indicateur, sa valeur et son écart signé (vert ou
 * rouge francs), qu'on fait glisser du doigt. Toucher la ligne déplie le
 * panneau entier, aides comprises.
 */
export function LigneDuTableau({
  nom,
  indicateurs,
  semaine,
  lecture,
  avant,
  haut = 0,
}: {
  nom: string;
  indicateurs: readonly Indicateur[];
  semaine: number;
  lecture: Lecture;
  avant: Lecture | null;
  /** Où coller la ligne : sous l'en-tête du site, mesuré par la page. */
  haut?: number;
}) {
  return (
    <details
      data-ligne-du-tableau=""
      style={{ top: haut }}
      className="ardoise group sticky z-20 -mx-4 mb-5 border-b border-white/10 bg-slate-950 text-slate-100 sm:-mx-6 lg:hidden print:hidden"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-4 py-1.5 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="sr-only">
          {nom} · {semaine ? `fin de semaine ${semaine}` : "aujourd'hui"} :
        </span>
        <span className="flex min-w-0 flex-1 gap-x-4 overflow-x-auto whitespace-nowrap text-sm tabular-nums [scrollbar-width:none]">
          {indicateurs.map((ind) => {
            const v = lecture[ind.cle];
            return (
              <span key={ind.cle} className="flex shrink-0 items-baseline gap-1.5">
                <span className="max-w-[9rem] truncate text-xs text-slate-400">{ind.nom}</span>
                <span className="font-semibold text-slate-50">
                  {v == null ? "—" : ind.format(v)}
                </span>
                <Ecart
                  apres={v}
                  avant={avant?.[ind.cle]}
                  format={ind.formatEcart ?? ind.format}
                  sensBon={ind.sensBon}
                  serre
                />
              </span>
            );
          })}
        </span>
        <span
          aria-hidden
          className="shrink-0 text-slate-400 transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <div className="max-h-[60dvh] overflow-y-auto border-t border-white/10 px-4 pb-4 sm:px-6">
        <TableauDeBord
          nom={nom}
          indicateurs={indicateurs}
          semaine={semaine}
          lecture={lecture}
          avant={avant}
          nu
        />
      </div>
    </details>
  );
}
