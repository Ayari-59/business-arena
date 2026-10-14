/**
 * LA DIFFICULTÉ D'UN ÉPISODE, et s'il départage bien.
 *
 * Chaque décision est mesurée sur le chemin de la meilleure référence, avec
 * 1,5 jour d'enquête, et marque un point par critère rempli :
 *
 *   · le réflexe n'est pas l'option la pire : il ne se reconnaît pas à son coût ;
 *   · une option plus sûre concurrence la meilleure : son pire cas est meilleur,
 *     et elle coûte moins que le prix de la sécurité ;
 *   · la deuxième option est à moins du prix de la sécurité de la meilleure.
 *
 * 0 ou 1 point : facile ; de 2 à 5 : moyen ; 6 et plus : difficile. Les seuils
 * sont ceux du bilan (`prixDeLaSecurite`), proportionnels à l'enjeu.
 *
 * Un épisode DÉPARTAGE MAL quand quatre de ses décisions au moins sont serrées
 * (troisième critère) : un bon et un moins bon manager y obtiennent des
 * qualités proches. Tout est pur ; un test vérifie que le registre suit ces règles.
 */
import { TRACES } from "@/config/episodes/traces";
import type { Difficulte } from "@/config/episodes/difficultes";
import type { Episode } from "@/config/episodes/types";
import { mesurerDecision, prixDeLaSecurite } from "@/pedagogy/episodes/mesures";

/** Le nombre de décisions serrées au-delà duquel un épisode départage mal. */
export const DECISIONS_SERREES_MAX = 3;

export interface DecompteDeDifficulte {
  points: number;
  /** Les décisions dont la deuxième option est à moins du prix de la sécurité de la meilleure. */
  serrees: number;
}

export function decompterLaDifficulte(ep: Episode): DecompteDeDifficulte {
  let points = 0;
  let serrees = 0;
  ep.etapes.forEach((_, d) => {
    const m = mesurerDecision(ep, ep.references[0]!.chemin, d, 1.5);
    const tri = [...m.options].sort((a, b) => b.moyenne - a.moyenne);
    const prix = prixDeLaSecurite(m.meilleure.p10, m.meilleure.p90);
    const reflexes = TRACES[ep.code]!.reflexes.filter(([dd]) => dd === d).map(([, o]) => o);
    const reflexePasLePire =
      reflexes.length > 0 && reflexes.every((o) => m.options[o] !== tri.at(-1));
    const plusSureConcurrente =
      m.plusSure !== m.meilleure &&
      m.plusSure.p10 > m.meilleure.p10 &&
      m.meilleure.moyenne - m.plusSure.moyenne < prix;
    const serree = tri[0]!.moyenne - tri[1]!.moyenne < prix;
    points += Number(reflexePasLePire) + Number(plusSureConcurrente) + Number(serree);
    serrees += Number(serree);
  });
  return { points, serrees };
}

export const difficulteDesPoints = (points: number): Difficulte =>
  points <= 1 ? "facile" : points <= 5 ? "moyen" : "difficile";

export const departageMal = (d: DecompteDeDifficulte) => d.serrees > DECISIONS_SERREES_MAX;
