import type { SegmentConfig } from "../types";

/** Prix de rupture par défaut : trois fois le prix usuel du segment. */
const RUPTURE_PAR_DEFAUT = 3;

/**
 * Ce qui reste de l'attraction quand le prix s'envole : 1 tant qu'on est sous
 * le début du décrochage, 0 au prix de rupture, et une pente entre les deux.
 *
 * Le décrochage commence une unité de ratio avant la rupture — à 3 (le
 * défaut), rien ne bouge jusqu'à DEUX fois le prix usuel. C'est ce qui rend le
 * correctif sans effet sur une partie normale : aucune équipe raisonnable, ni
 * aucun bot, ne va au-delà.
 */
function extinction(ratio: number, rupture: number): number {
  const debut = Math.max(1, rupture - 1);
  if (ratio <= debut) return 1;
  if (ratio >= rupture) return 0;
  return (rupture - ratio) / (rupture - debut);
}

/**
 * Effet prix (doc 02 §3.2) : élasticité autour du prix de référence du segment,
 * pénalités psychologiques au franchissement de seuils, méfiance sous le prix
 * plancher d'acceptabilité. Borné par les bornes documentées du scénario.
 *
 * ET UNE CLIENTÈLE QUI FINIT PAR PARTIR. Les deux gardes précédentes se
 * retournaient contre le jeu au-dessus d'un certain prix :
 *
 *  - `priceEffectBounds.min` RELÈVE l'attraction au lieu de la laisser
 *    tomber. À dix fois le prix usuel, l'effet brut valait 0,006 chez les
 *    étudiants de NOVA ; le plancher le remontait à 0,15.
 *  - une élasticité faible — les passionnés à −0,7 — laissait de toute façon
 *    un cinquième de l'attraction au même prix, plancher ou pas.
 *
 * Résultat : multiplier ses prix par dix vendait encore 918 unités et
 * rapportait 296 000 € là où le prix juste en perdait 17 500. C'était la
 * stratégie la plus rentable du jeu, et elle n'enseignait rien.
 *
 * Le prix de rupture ferme cette porte comme le ferait un vrai marché :
 * au-delà, on n'achète plus, quelle que soit son élasticité. L'extinction
 * s'applique APRÈS les bornes, sans quoi le plancher relèverait ce qu'elle
 * vient d'éteindre.
 */
export function priceEffect(price: number, segment: SegmentConfig): number {
  if (price <= 0) return 0;
  const ratio = price / segment.refPrice;
  let effect = Math.pow(ratio, segment.priceElasticity);
  for (const { threshold, penalty } of segment.psychThresholds) {
    if (price > threshold) effect *= penalty;
  }
  if (price < segment.minAcceptablePrice) {
    // prix trop bas = méfiance : l'attraction décroît linéairement avec l'écart
    effect *= Math.max(0, price / segment.minAcceptablePrice);
  }
  const { min, max } = segment.priceEffectBounds;
  const borne = Math.min(max, Math.max(min, effect));
  return borne * extinction(ratio, segment.walkAwayPriceRatio ?? RUPTURE_PAR_DEFAUT);
}

/** Effet marketing à rendements décroissants (doc 02 §3.2). */
export function marketingEffect(
  budget: number,
  segment: SegmentConfig,
  scale: number,
): number {
  const base = budget <= 0 ? 1 : 1 + segment.marketingSensitivity * Math.log(1 + budget / scale);
  // Porte marketing : sans budget, le segment ne garde qu'une part de son
  // attraction ; la porte s'ouvre vite avec le budget rapporté à l'échelle
  // (aux deux tiers pour un sixième de l'échelle, en grand au tiers). Seul
  // le budget quasi nul est puni : c'est le trafic qu'on n'achète pas.
  // Absente : rien ne change, un scénario historique reste identique au bit
  // près.
  if (segment.marketingGate === undefined) return base;
  const gate = segment.marketingGate;
  const ouverture = gate + (1 - gate) * (1 - Math.exp((-6 * Math.max(0, budget)) / scale));
  return base * ouverture;
}

/** Effet qualité perçue (référence = 1). */
export function qualityEffect(perceivedQuality: number, segment: SegmentConfig): number {
  if (perceivedQuality <= 0) return 0;
  return Math.pow(perceivedQuality, segment.qualitySensitivity);
}

/** Effet fidélité : la part acquise au tour précédent protège (doc 02 §3.2). */
export function loyaltyEffect(lastShare: number, segment: SegmentConfig): number {
  return 1 + segment.loyalty * Math.max(0, Math.min(1, lastShare));
}

/** Score d'attraction global d'une offre pour un segment. */
export function attractionScore(args: {
  price: number;
  marketingBudget: number;
  perceivedQuality: number;
  lastShare: number;
  segment: SegmentConfig;
  marketingScale: number;
  /**
   * Facteur image RSE (Lot 2), ≥ 1 (1 = neutre). Capital de marque lent, à
   * l'inverse du marketing : il tient au capital d'ouverture, donc aux
   * engagements des tours PASSÉS. Défaut 1 pour tout appelant sans RSE.
   */
  imageFactor?: number;
}): number {
  const { price, marketingBudget, perceivedQuality, lastShare, segment, marketingScale } = args;
  return (
    priceEffect(price, segment) *
    marketingEffect(marketingBudget, segment, marketingScale) *
    qualityEffect(perceivedQuality, segment) *
    loyaltyEffect(lastShare, segment) *
    Math.max(0, args.imageFactor ?? 1)
  );
}
