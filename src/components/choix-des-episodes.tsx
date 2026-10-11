import { Repliable } from "@/components/repliable";
import { catalogueDesEpisodes, teinteDuSecteur } from "@/config/episodes/catalogue";
import { estUneDemo, MARQUE_DEMO } from "@/config/episodes/demos";
import { compter } from "@/lib/format";
import { episodeParCode } from "@/pedagogy/episodes/registre";

/**
 * LE CHOIX DES ÉPISODES D'UNE COHORTE : UNE LISTE À COCHER, RANGÉE COMME LE CATALOGUE.
 *
 * Plus de cent épisodes : à plat, la liste ne se lirait pas. Elle reprend donc le
 * rangement du catalogue (`catalogueDesEpisodes`, config/episodes/catalogue.ts) :
 * un repli par entreprise, le repli commun du site (`Repliable`, son chevron de
 * 16 px), fermé à l'arrivée ; dedans, les familles en sous-titres et une case par
 * épisode, son numéro et son titre. La teinte du métier se pose dans un point, à
 * côté du nom toujours écrit.
 *
 * Aucune couleur d'action hors de la case cochée (la couleur d'accent native du
 * champ en saisie). Un épisode reçu par l'adresse (`?episode=…`, depuis sa fiche
 * enseignant) arrive coché, son repli ouvert.
 */
export function ChoixDesEpisodes({ preselection }: { preselection: string | null }) {
  const entreprises = catalogueDesEpisodes();
  return (
    <fieldset className="grid gap-2" data-choix-des-episodes="">
      <legend className="text-sm font-semibold text-slate-200">Les épisodes</legend>
      <p className="text-sm text-slate-400">
        Cochez ceux que vos élèves joueront. Ils les ouvrent sous la licence de votre
        établissement, à tous les niveaux ; les autres leur restent fermés.
      </p>
      <div className="mt-1 border-b border-[var(--filet-carte)] [&>details]:border-t [&>details]:border-[var(--filet-carte)]">
        {entreprises.map((e) => {
          const ouvert =
            !!preselection && e.familles.some((f) => f.episodes.includes(preselection));
          return (
            <Repliable
              key={e.secteur.code}
              className="py-3"
              classeResume="min-w-0 flex-1"
              ouvert={ouvert}
              resume={
                <span className="flex flex-wrap items-baseline gap-x-2" data-entreprise={e.secteur.code}>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: teinteDuSecteur(e.secteur) }}
                    />
                    {e.secteur.nom}
                  </span>
                  <span className="text-sm text-slate-400">
                    {e.secteur.entreprise} · {compter(e.nombre, "épisode")}
                  </span>
                </span>
              }
            >
              {e.familles.map(({ famille, episodes }) => (
                <fieldset key={famille.code} className="mt-3">
                  <legend className="text-sm font-semibold text-slate-200">{famille.titre}</legend>
                  <ul className="mt-1 grid gap-x-4 sm:grid-cols-2">
                    {episodes.map((code) => {
                      const ep = episodeParCode(code);
                      if (!ep) return null;
                      return (
                        <li key={code} className="min-w-0">
                          <label className="flex cursor-pointer items-start gap-2 py-1.5 text-sm text-slate-300 pointer-coarse:min-h-11">
                            <input
                              type="checkbox"
                              name="episodes"
                              value={code}
                              defaultChecked={code === preselection}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
                            />
                            <span className="min-w-0">
                              <span className="tabular-nums text-slate-400">{ep.numero}</span>{" "}
                              {ep.titre}
                              {estUneDemo(code) ? (
                                <span className="text-slate-400"> · {MARQUE_DEMO}</span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              ))}
            </Repliable>
          );
        })}
      </div>
    </fieldset>
  );
}
