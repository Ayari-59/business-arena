import { OBJECTIF_CA, SEMAINES, type Semaine } from "@/engine/episodes/trimestre-qui-derape";
import { ETAPES } from "@/config/episodes/trimestre-qui-derape";
import { kE, taux } from "./format-episode";

/**
 * LE CHIFFRE D'AFFAIRES, SEMAINE PAR SEMAINE.
 *
 * Une colonne par semaine, de zéro, et la cadence de l'objectif en trait
 * fin : c'est ce que Claire regarderait chaque lundi. Les semaines que la
 * dernière décision a jouées sont en laiton, les autres en gris ; celles qui
 * ne sont pas encore jouées restent vides. Sous l'axe, les repères des
 * décisions ; au-dessus d'une colonne, un point d'exclamation dit qu'un
 * imprévu l'a frappée.
 *
 * Une seule série : pas de légende, le titre la nomme. Les valeurs sont dans
 * l'infobulle (au survol comme au clavier) et dans un tableau pour les
 * lecteurs d'écran.
 */

const CADENCE = OBJECTIF_CA / SEMAINES;
const GRADUATIONS = [50000, 100000];

export interface Repere {
  semaine: number;
  nom: string;
}

/** Les repères des n premières décisions : chacune se prend à la fin de la fenêtre précédente. */
export function reperesDesDecisions(n: number): Repere[] {
  return ETAPES.slice(0, n).map((_, i) => ({
    semaine: i === 0 ? 1 : ETAPES[i - 1]!.jusqua,
    nom: `D${i + 1}`,
  }));
}

export function CourbeDuTrimestre({
  semaines,
  jouees,
  surbrillance,
  reperes = [],
  imprevus = [],
  titre = "Chiffre d'affaires, semaine par semaine",
}: {
  /** Les semaines simulées, indexées de 1 à 13. */
  semaines: readonly (Semaine | null)[];
  /** Jusqu'à quelle semaine le trimestre a été joué. */
  jouees: number;
  /** Les semaines à mettre en avant : celles de la dernière décision. */
  surbrillance?: readonly [number, number];
  reperes?: readonly Repere[];
  imprevus?: readonly { semaine: number; titre: string }[];
  titre?: string;
}) {
  const jouee = (w: number) => w <= jouees;
  const max = Math.max(
    CADENCE * 1.25,
    ...Array.from({ length: jouees }, (_, i) => semaines[i + 1]?.ca ?? 0),
  );
  const hauteur = (v: number) => `${(100 * v) / max}%`;
  const imprevuDe = (w: number) => imprevus.filter((i) => i.semaine === w && jouee(w));

  return (
    <figure className="carte grid gap-3 p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold text-slate-50">{titre}</span>
        <span className="text-sm text-slate-400">objectif : {kE(CADENCE)} par semaine</span>
      </figcaption>

      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-2">
        {/* L'axe des valeurs : deux graduations, en encre discrète. */}
        <div className="relative h-36 sm:h-44" aria-hidden="true">
          {GRADUATIONS.filter((g) => g < max).map((g) => (
            <span
              key={g}
              className="absolute right-0 translate-y-1/2 text-xs tabular-nums text-slate-400"
              style={{ bottom: hauteur(g) }}
            >
              {kE(g)}
            </span>
          ))}
          <span className="absolute bottom-0 right-0 translate-y-1/2 text-xs text-slate-400">
            0
          </span>
        </div>

        <div className="relative h-36 border-b border-slate-600 sm:h-44">
          {GRADUATIONS.filter((g) => g < max).map((g) => (
            <span
              key={g}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-white/5"
              style={{ bottom: hauteur(g) }}
            />
          ))}
          {/* La cadence de l'objectif : un trait plein, plus marqué que la grille. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 z-10 border-t border-slate-400"
            style={{ bottom: hauteur(CADENCE) }}
          />

          <ol className="absolute inset-0 grid grid-cols-13 gap-0.5">
            {Array.from({ length: SEMAINES }, (_, i) => {
              const w = i + 1;
              const s = semaines[w];
              const enAvant = surbrillance && w >= surbrillance[0] && w <= surbrillance[1];
              const ici = imprevuDe(w);
              const bord = w <= 3 ? "left-0" : w >= 11 ? "right-0" : "left-1/2 -translate-x-1/2";
              return (
                <li key={w} className="group relative flex h-full items-end justify-center">
                  {jouee(w) && s ? (
                    <>
                      <span
                        tabIndex={0}
                        aria-label={`Semaine ${w}`}
                        className={`relative block w-full max-w-6 rounded-t outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          enAvant ? "bg-amber-400" : "bg-slate-500"
                        }`}
                        style={{ height: hauteur(s.ca) }}
                      >
                        {ici.length > 0 && (
                          <span
                            aria-hidden="true"
                            className="absolute -top-6 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-slate-700 text-xs font-bold text-slate-50 ring-2 ring-slate-900"
                          >
                            !
                          </span>
                        )}
                      </span>
                      <span
                        role="tooltip"
                        className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden w-max max-w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm shadow-lg group-hover:block group-focus-within:block ${bord}`}
                      >
                        <span className="block font-semibold text-slate-50">Semaine {w}</span>
                        <span className="block tabular-nums text-slate-300">
                          {kE(s.ca)} · marge {taux(s.marge / s.ca)}
                        </span>
                        <span className="block tabular-nums text-slate-400">
                          transformation {taux(s.transfo)}
                        </span>
                        {ici.map((x) => (
                          <span key={x.titre} className="mt-1 block text-slate-200">
                            Imprévu : {x.titre}
                          </span>
                        ))}
                      </span>
                    </>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="block h-1 w-full max-w-6 rounded-t bg-slate-800"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Sous l'axe : les semaines, et les repères des décisions. */}
        <span aria-hidden="true" />
        <div aria-hidden="true" className="grid grid-cols-13 gap-0.5 pt-1.5 text-center">
          {Array.from({ length: SEMAINES }, (_, i) => {
            const w = i + 1;
            const repere = reperes.find((r) => r.semaine === w);
            return (
              <span key={w} className="grid justify-items-center gap-1">
                <span
                  className={`text-xs tabular-nums ${jouee(w) ? "text-slate-300" : "text-slate-400"}`}
                >
                  {w}
                </span>
                {repere && (
                  <span className="rounded bg-slate-700 px-1 text-xs font-semibold text-slate-50">
                    {repere.nom}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      <table className="sr-only">
        <caption>{titre}</caption>
        <thead>
          <tr>
            <th>Semaine</th>
            <th>Chiffre d&apos;affaires</th>
            <th>Taux de marge</th>
            <th>Transformation</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: jouees }, (_, i) => {
            const s = semaines[i + 1];
            if (!s) return null;
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{kE(s.ca)}</td>
                <td>{taux(s.marge / s.ca)}</td>
                <td>{taux(s.transfo)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}
