import { describe, expect, it } from "vitest";
import { EPISODES } from "@/pedagogy/episodes/registre";

/**
 * LA BONNE OPTION NE SE TRAHIT PAS PAR SA LONGUEUR.
 *
 * Mesure d'octobre 2026 : dans 98 épisodes sur 113, la meilleure option d'une
 * décision était aussi la plus longue dans plus de deux décisions sur six. Un
 * élève qui prenait toujours l'option la plus détaillée trouvait la méthode
 * sans lire la situation. Les épisodes écrits depuis portaient déjà leur
 * propre garde (deux fois au plus) ; celle-ci vaut pour toute la bibliothèque.
 *
 * La meilleure option est celle de la première référence de l'épisode, le
 * chemin que le bilan donne pour modèle. On compare les titres, ce que l'élève
 * lit d'abord ; le détail porte les chiffres et n'entre pas dans la mesure.
 *
 * Les 98 épisodes concernés ont été rééquilibrés en deux lots (octobre 2026),
 * sans chiffre ni fait nouveau : la bonne option a raccourci son titre et
 * gardé ses précisions dans son détail, ou un piège a reçu l'argument qui le
 * rend tentant. La garde vaut désormais pour toute la bibliothèque, épisodes
 * à venir compris.
 */

/** Le plafond des épisodes récents : la meilleure option est la plus longue deux fois au plus. */
const PLAFOND = 2;

/** Le nombre de décisions où la meilleure option a le titre le plus long (à égalité compris). */
function decisionsTrahies(code: string): number {
  const ep = EPISODES.find((e) => e.code === code)!;
  const meilleur = ep.references[0]!.chemin;
  return ep.etapes.filter((e, d) => {
    const longueurs = e.options.map((o) => o.t.length);
    return longueurs[meilleur[d]!]! >= Math.max(...longueurs);
  }).length;
}

describe("la longueur des options", () => {
  it("dans chaque épisode, la meilleure option n'est la plus longue que deux fois au plus", () => {
    const trahis = EPISODES.map((e) => ({ code: e.code, n: decisionsTrahies(e.code) }))
      .filter((x) => x.n > PLAFOND);
    expect(trahis.map((x) => `${x.code} (${x.n} sur 6)`)).toEqual([]);
  });
});
