import type { ReactNode } from "react";
import { OuvreLeTiroirVise } from "@/components/ouvre-le-tiroir-vise";
import { Repliable } from "@/components/repliable";
import {
  ancreDeLaFamille,
  ancreDuSecteur,
  PREFIXE_D_ANCRE_DE_FAMILLE,
  teinteDuSecteur,
  type EntrepriseDuCatalogue,
} from "@/config/episodes/catalogue";
import type { Secteur } from "@/config/episodes/familles";

/**
 * LE CATALOGUE DES ÉPISODES, EN TIROIRS (page des épisodes et page des fiches).
 *
 * « Arvel Distribution découpé par thème, et les autres par métier » : le
 * rangement vient de `catalogueDesEpisodes` (config/episodes/catalogue.ts) ; ce
 * composant le dessine, de la même façon sur les deux pages, et chaque page
 * fournit sa carte (`carte`), inchangée.
 *
 *   · EN TÊTE, UN SOMMAIRE COURT : l'entreprise rangée par thème et ses thèmes,
 *     puis les autres métiers. Chaque lien vise une ancre, et l'ancre ouvre son
 *     tiroir (`OuvreLeTiroirVise`).
 *   · LES TIROIRS sont le repli commun du site (`Repliable` : le chevron de
 *     16 px en tête, qui pivote avec SON repli, lot P5), fermés à l'arrivée.
 *     Leur résumé dit ce qu'il range : le titre, le nombre, une phrase (un
 *     thème) ou l'entreprise (un métier).
 *   · LA TEINTE DU MÉTIER (jetons `--secteur-*`, lus de `SECTEURS`) se pose dans
 *     une pastille, à côté d'un nom toujours écrit : l'identité ne tient jamais
 *     à la couleur seule. Aucun orange : ouvrir un tiroir n'est pas une action
 *     qui engage.
 */

type Carte = (code: string, niveauDuTitre: 3 | 4) => ReactNode;

/** La pastille du métier : un point plein de sa teinte, jamais seul (le nom suit). */
function Pastille({ secteur, grande = false }: { secteur: Secteur; grande?: boolean }) {
  return (
    <span
      aria-hidden
      data-pastille-metier={secteur.code}
      className={`inline-block shrink-0 rounded-full ${grande ? "h-3.5 w-3.5" : "h-2.5 w-2.5"}`}
      style={{ backgroundColor: teinteDuSecteur(secteur) }}
    />
  );
}

/**
 * LES TIROIRS SE SUIVENT ENTRE DEUX FILETS, SANS CADRE : les cartes des épisodes
 * sont déjà des cadres, et un cadre ne se pose pas dans un cadre (lot 6E).
 */
const LISTE_DE_TIROIRS =
  "mt-6 border-b border-[var(--filet-carte)] [&>section]:border-t [&>section]:border-[var(--filet-carte)]";

const PUCE =
  "inline-flex items-center gap-2 rounded-full border border-slate-700 px-3.5 py-1.5 text-sm text-slate-200 hover:border-slate-500 hover:text-slate-50";

export function CatalogueDesEpisodes({
  entreprises,
  carte,
  unite,
}: {
  entreprises: readonly EntrepriseDuCatalogue[];
  carte: Carte;
  /** Ce que la page range, au singulier et au pluriel : « épisode », « fiche ». */
  unite: { un: string; plusieurs: string };
}) {
  const compte = (n: number) => `${n} ${n > 1 ? unite.plusieurs : unite.un}`;
  const parTheme = entreprises.filter((e) => e.rangement === "themes");
  const parMetier = entreprises.filter((e) => e.rangement === "metier");
  const grille = "mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3";
  return (
    <div data-catalogue-des-episodes="">
      <OuvreLeTiroirVise prefixeDeFamille={PREFIXE_D_ANCRE_DE_FAMILLE} />
      <nav aria-label="Sommaire du catalogue" className="mt-8 space-y-6">
        {parTheme.map((e) => (
          <div key={e.secteur.code}>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <a
                href={`#${ancreDuSecteur(e.secteur.code)}`}
                className="inline-flex items-center gap-2 font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                <Pastille secteur={e.secteur} />
                {e.secteur.entreprise}
              </a>
              <span className="text-sm text-slate-400">
                {e.secteur.nom} · <span className="tabular-nums">{compte(e.nombre)}</span>, par
                thème
              </span>
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {e.familles.map(({ famille, episodes }) => (
                <li key={famille.code}>
                  <a href={`#${ancreDeLaFamille(famille.code)}`} className={PUCE}>
                    {famille.titre}
                    <span className="tabular-nums text-slate-400">{episodes.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {parMetier.length > 0 ? (
          <div>
            <p className="font-semibold text-slate-100">Les autres métiers</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {parMetier.map((e) => (
                <li key={e.secteur.code}>
                  <a href={`#${ancreDuSecteur(e.secteur.code)}`} className={PUCE}>
                    <Pastille secteur={e.secteur} />
                    {e.secteur.nom}
                    {/* Sur téléphone, la puce tient sur une ligne : l'entreprise est dans le tiroir. */}
                    <span className="hidden text-slate-400 sm:inline">{e.secteur.entreprise}</span>
                    <span className="tabular-nums text-slate-400">{e.nombre}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      {parTheme.map((e) => (
        <section
          key={e.secteur.code}
          id={ancreDuSecteur(e.secteur.code)}
          aria-labelledby={`titre-${ancreDuSecteur(e.secteur.code)}`}
          data-rangement="themes"
          className="mt-14 scroll-mt-24"
        >
          <h2
            id={`titre-${ancreDuSecteur(e.secteur.code)}`}
            className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl"
          >
            <Pastille secteur={e.secteur} grande />
            {e.secteur.entreprise}
          </h2>
          <p className="mt-2 text-base text-slate-400">
            {e.secteur.nom} · <span className="tabular-nums">{compte(e.nombre)}</span>, rangés par
            thème
          </p>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-slate-400">
            {e.secteur.texte}
          </p>
          <div className={LISTE_DE_TIROIRS}>
            {e.familles.map(({ famille, episodes }) => (
              <section
                key={famille.code}
                id={ancreDeLaFamille(famille.code)}
                aria-label={famille.titre}
                data-tiroir-de-theme={famille.code}
                className="scroll-mt-24"
              >
                <Repliable
                  className="py-4"
                  classeResume="min-w-0 flex-1"
                  resume={
                    <>
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <span className="font-titre text-lg font-semibold text-slate-50">
                          {famille.titre}
                        </span>
                        <span className="text-sm tabular-nums text-slate-400">
                          {compte(episodes.length)}
                        </span>
                      </span>
                      {/* Sur téléphone, le résumé tient en une ou deux lignes : la phrase
                          du thème passe dans le tiroir. */}
                      <span className="mt-0.5 hidden text-sm leading-relaxed text-slate-400 sm:block">
                        {famille.texte}
                      </span>
                    </>
                  }
                >
                  <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:hidden">
                    {famille.texte}
                  </p>
                  <ul className={grille}>{episodes.map((code) => carte(code, 3))}</ul>
                </Repliable>
              </section>
            ))}
          </div>
        </section>
      ))}

      {parMetier.length > 0 ? (
        <section aria-labelledby="titre-autres-metiers" className="mt-14">
          <h2
            id="titre-autres-metiers"
            className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl"
          >
            Les autres métiers
          </h2>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-slate-400">
            Un tiroir par métier, une entreprise par métier ; dans chacun, les {unite.plusieurs}{" "}
            sont groupés par famille.
          </p>
          <div className={LISTE_DE_TIROIRS}>
            {parMetier.map((e) => (
              <section
                key={e.secteur.code}
                id={ancreDuSecteur(e.secteur.code)}
                aria-label={`${e.secteur.nom}, ${e.secteur.entreprise}`}
                data-tiroir-de-metier={e.secteur.code}
                className="scroll-mt-24"
              >
                <Repliable
                  className="py-4"
                  classeResume="min-w-0 flex-1"
                  resume={
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span className="inline-flex items-center gap-2 font-titre text-lg font-semibold text-slate-50">
                        <Pastille secteur={e.secteur} />
                        {e.secteur.nom}
                      </span>
                      <span className="text-sm text-slate-400">
                        {e.secteur.entreprise} ·{" "}
                        <span className="tabular-nums">{compte(e.nombre)}</span>
                      </span>
                    </span>
                  }
                >
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
                    {e.secteur.texte}
                  </p>
                  {e.familles.map(({ famille, episodes }) => (
                    <div
                      key={famille.code}
                      id={ancreDeLaFamille(famille.code)}
                      className="mt-8 scroll-mt-24"
                    >
                      <h3 className="text-xl font-semibold tracking-tight text-slate-50">
                        {famille.titre}
                      </h3>
                      <p className="mt-1 max-w-2xl text-base leading-relaxed text-slate-400">
                        <span className="tabular-nums">{compte(episodes.length)}</span> ·{" "}
                        {famille.texte}
                      </p>
                      <ul className={grille}>{episodes.map((code) => carte(code, 4))}</ul>
                    </div>
                  ))}
                </Repliable>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
