import { FAMILLES, SECTEURS, type Famille, type Secteur } from "./familles";

/**
 * LE CATALOGUE DES ÉPISODES : CE QUE LES DEUX PAGES RANGENT, ET COMMENT.
 *
 * Demande du propriétaire (octobre 2026) : « Arvel Distribution découpé par
 * thème, et les autres par métier. » La page des épisodes et celle des fiches
 * enseignant posaient plus de cent cartes à plat, secteur après secteur ; elles
 * se rangent désormais dans des TIROIRS, fermés à l'arrivée :
 *
 *   · un secteur marqué `parTheme` (le négoce d'Arvel Distribution, près de la
 *     moitié des épisodes) garde sa section, et chacune de ses familles y
 *     devient un tiroir de thème ;
 *   · chacun des autres secteurs tient dans UN tiroir, celui de son métier, où
 *     ses familles ne sont que des sous-titres (pas de tiroir dans un tiroir).
 *
 * Une seule source : les secteurs, les familles et leur ordre restent ceux de
 * `familles.ts`, que la recommandation, le profil, les cohortes et la
 * navigation lisent aussi. Ce module ne fait que les regrouper, et il le fait
 * pour les deux pages, qui ne gardent que leurs propres cartes (`retenir`).
 */

export type Rangement = "themes" | "metier";

export interface FamilleDuCatalogue {
  famille: Famille;
  /** Les codes retenus de la famille, dans l'ordre de la famille. */
  episodes: readonly string[];
}

export interface EntrepriseDuCatalogue {
  secteur: Secteur;
  /** Des tiroirs de thème (une famille par tiroir) ou un seul tiroir de métier. */
  rangement: Rangement;
  familles: readonly FamilleDuCatalogue[];
  /** Le nombre d'épisodes retenus du secteur. */
  nombre: number;
}

/**
 * Le catalogue, dans l'ordre de `SECTEURS` puis de `FAMILLES`. Une famille sans
 * épisode retenu ne s'affiche pas, un secteur sans famille non plus : la page
 * des fiches enseignant ne montre que les épisodes qui ont une fiche.
 */
export function catalogueDesEpisodes(
  retenir: (code: string) => boolean = () => true,
): readonly EntrepriseDuCatalogue[] {
  return SECTEURS.map((secteur) => {
    const familles = FAMILLES.filter((f) => f.secteur === secteur.code)
      .map((famille) => ({ famille, episodes: famille.episodes.filter(retenir) }))
      .filter((f) => f.episodes.length > 0);
    return {
      secteur,
      rangement: (secteur.parTheme ? "themes" : "metier") as Rangement,
      familles,
      nombre: familles.reduce((n, f) => n + f.episodes.length, 0),
    };
  }).filter((e) => e.familles.length > 0);
}

/**
 * LES ANCRES, INCHANGÉES. Un secteur se vise par `#secteur-<code>`, une famille
 * par son code nu (`#vendre`, `#hotel-remplir`) : ce sont les adresses de la page
 * d'avant, qui ont pu être copiées. `#famille-<code>` est accepté en plus (voir
 * `ouvre-le-tiroir-vise.tsx`), sans être un second identifiant dans la page.
 */
export const ancreDuSecteur = (code: string): string => `secteur-${code}`;
export const ancreDeLaFamille = (code: string): string => code;
export const PREFIXE_D_ANCRE_DE_FAMILLE = "famille-";

/** La teinte d'un secteur, en jeton CSS (`--secteur-*`, globals.css). */
export const teinteDuSecteur = (secteur: Secteur): string => `var(--secteur-${secteur.teinte})`;
