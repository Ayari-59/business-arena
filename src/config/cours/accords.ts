import type { Cas } from "./cas";

/**
 * LES ACCORDS AVEC L'UNITÉ DE L'ENTREPRISE.
 *
 * Le vocabulaire des scénarios donne l'unité (« enceinte », « couvert ») sans son genre ;
 * les textes du cours s'accordent pourtant avec elle : « chaque nuitée vendue », « un
 * couvert de plus ». Un test exige que toute unité de l'arène figure dans l'une des deux
 * listes : une entreprise nouvelle ne parle pas faux sans qu'on le voie.
 */

export const UNITES_FEMININES: ReadonlySet<string> = new Set(["commande", "enceinte", "nuitée", "palette"]);
export const UNITES_MASCULINES: ReadonlySet<string> = new Set(["adhérent", "article", "couvert", "jour-conseil", "mètre carré"]);

const feminine = (c: Pick<Cas, "unite">) => UNITES_FEMININES.has(c.unite);

/** Le mot au masculin singulier, accordé avec l'unité : « vendu », « dernier », « un », « chacun ». */
export const accord = (c: Pick<Cas, "unite">, mot: string) => {
  if (!feminine(c)) return mot;
  // « dernier » fait « dernière » : l'accent de la finale en -er.
  return mot.endsWith("er") ? `${mot.slice(0, -2)}ère` : `${mot}e`;
};

/** Le mot au masculin singulier, accordé au pluriel avec l'unité : « vendus » ou « vendues ». */
export const accordPluriel = (c: Pick<Cas, "unite">, mot: string) => `${accord(c, mot)}s`;

/** Le pronom qui reprend l'unité : « il » ou « elle ». */
export const pronom = (c: Pick<Cas, "unite">) => (feminine(c) ? "elle" : "il");
