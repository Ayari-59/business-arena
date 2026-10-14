import type { CaseDeReussite } from "@/scoring/reussites";
import { Chevron } from "@/components/repliable";

/**
 * VOS RÉUSSITES, EN UNE LIGNE : « 3/9 distinctions ».
 *
 * Une réussite se disait au tour où elle arrivait, puis disparaissait avec
 * lui. La liste qui l'a remplacée alignait ensuite neuf cartes, pointillées
 * pour celles « à viser », semées d'étoiles : 1 200 px sur un téléphone, sous
 * chaque partie, et le vocabulaire d'un jeu mobile là où l'on parle de
 * gestion.
 *
 * C'est maintenant une ligne : le compte, et une médaille d'or par
 * distinction obtenue. Le détail (ce qui a été obtenu, à quel tour, et ce qui
 * reste à viser) se déplie à la demande. Une distinction à viser n'est pas
 * cachée : elle se connaît pour se viser. Mais elle ne prend plus la place
 * d'une carte.
 *
 * LA FORME DIT L'ÉTAT, PAS SEULEMENT LA COULEUR. La médaille est pleine (le
 * disque d'or et son filet) ou vide (un cercle neutre) : un daltonien, une
 * impression en noir et blanc et un écran mal réglé lisent la liste aussi bien
 * qu'un autre. Elle ne promet aucun point : ni score, ni monnaie, ni effet sur
 * la partie.
 */
export function VosReussites({
  cases,
  /** Le nom du tour, dans la langue du scénario : « Trimestre 2 ». */
  nommerLeTour,
}: {
  cases: readonly CaseDeReussite[];
  nommerLeTour: (round: number) => string;
}) {
  if (cases.length === 0) return null;
  const acquises = cases.filter((c) => c.round !== null);

  return (
    <section aria-labelledby="reussites" className="panneau-info px-4 py-3 sm:px-5">
      <details className="group">
        <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
          {/* Le chevron commun, en tête (lot P5) : il était un « › » à droite,
              derrière « le détail ». Le mot reste à droite, comme sur un tiroir. */}
          <Chevron className="-mr-1 text-slate-400" />
          <h2 id="reussites" className="text-sm font-semibold text-slate-200">
            Vos réussites
          </h2>
          <span className="text-sm tabular-nums text-slate-300">
            {acquises.length}/{cases.length} distinctions
          </span>
          {acquises.length > 0 ? (
            <span aria-hidden className="flex items-center gap-1">
              {acquises.map((c) => (
                <span key={c.reussite.code} className="medaille medaille-or" />
              ))}
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <span className="group-open:hidden">le détail</span>
            <span className="hidden group-open:inline">replier</span>
          </span>
        </summary>

        <ul className="mt-3 grid gap-x-6 gap-y-2.5 pt-1 sm:grid-cols-2">
          {cases.map(({ reussite, round }) => {
            const acquise = round !== null;
            return (
              <li key={reussite.code} className="flex gap-2.5">
                <span
                  aria-hidden
                  className={`medaille mt-1 ${acquise ? "medaille-or" : "medaille-a-viser"}`}
                />
                <p className="min-w-0 text-sm leading-relaxed">
                  <span className="font-semibold text-slate-100">{reussite.titre}</span>
                  <span className="text-slate-400">
                    {" · "}
                    {acquise ? (
                      <span className="texte-or font-medium">{nommerLeTour(round)}</span>
                    ) : (
                      // « À viser » plutôt qu'un cadenas : rien n'est
                      // verrouillé, c'est seulement à faire.
                      "à viser"
                    )}
                  </span>
                  <span className="block text-slate-400">
                    {acquise ? reussite.detail : reussite.viser}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}
