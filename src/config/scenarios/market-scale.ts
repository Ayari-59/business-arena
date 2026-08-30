import type { EngineScenarioConfig } from "../../engine/types";

/**
 * Dimensionnement du marché selon la taille de la classe.
 *
 * Toutes les entreprises d'une partie se partagent LE MÊME marché : le moteur
 * les simule ensemble et répartit la demande de chaque segment au prorata de
 * leur attraction. C'est ce qui fait la concurrence, et c'est voulu.
 *
 * Mais les scénarios sont calibrés contre trois concurrents, ce que fait le
 * script de calibration : un joueur et deux bots. Avec un gâteau de taille
 * fixe, une classe plus nombreuse le partage en parts plus petites, alors que
 * les charges de structure de chaque entreprise, elles, ne bougent pas. Mesuré
 * sur six tours et trois secteurs : à trois concurrents deux entreprises sur
 * trois finissent dans le vert ; à six, plus aucune ; à huit, le meilleur jeu
 * possible après balayage des prix et des budgets plafonne à un cumul
 * lourdement négatif. Le monde devenait injouable par construction, et aucun
 * talent d'équipe n'y pouvait rien.
 *
 * Le marché est donc dimensionné à la création de la partie : chaque segment
 * voit sa taille multipliée par le nombre de concurrents rapporté aux trois de
 * la calibration. Les parts restent relatives, donc la concurrence reste
 * entière : prendre des clients à une autre équipe reste la seule façon de
 * grandir. Ce qui change est qu'une classe de six équipes n'est plus condamnée
 * d'avance.
 *
 * L'opération ne touche que la TAILLE des segments. Les élasticités, les prix
 * de référence, la saisonnalité et l'attraction du concurrent extérieur sont
 * des propriétés du métier, pas de la classe, et ne bougent pas.
 */

/** Le nombre de concurrents pour lequel les scénarios sont calibrés. */
export const CONCURRENTS_DE_CALIBRATION = 3;

/**
 * Le facteur appliqué à la taille des segments.
 *
 * Il ne descend jamais sous 1 : une partie plus petite que la calibration garde
 * le marché d'origine, sans quoi un duel à deux se jouerait sur un marché
 * rétréci, plus dur que ce que le scénario annonce.
 */
export function facteurDeMarche(concurrents: number): number {
  if (!Number.isFinite(concurrents) || concurrents <= 0) return 1;
  return Math.max(1, concurrents / CONCURRENTS_DE_CALIBRATION);
}

/** Une variante du scénario dimensionnée pour un nombre de concurrents donné. */
export function applyMarketScale(
  scenario: EngineScenarioConfig,
  concurrents: number,
): EngineScenarioConfig {
  const facteur = facteurDeMarche(concurrents);
  if (facteur === 1) return scenario;
  return {
    ...scenario,
    market: {
      ...scenario.market,
      segments: scenario.market.segments.map((s) => ({
        ...s,
        size: Math.round(s.size * facteur),
      })),
    },
  };
}
