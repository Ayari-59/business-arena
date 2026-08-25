import type { SegmentConfig } from "../types";

/**
 * Effet prix (doc 02 §3.2) : élasticité autour du prix de référence du segment,
 * pénalités psychologiques au franchissement de seuils, méfiance sous le prix
 * plancher d'acceptabilité. Borné par les bornes documentées du scénario.
 */
export function priceEffect(price: number, segment: SegmentConfig): number {
  if (price <= 0) return 0;
  let effect = Math.pow(price / segment.refPrice, segment.priceElasticity);
  for (const { threshold, penalty } of segment.psychThresholds) {
    if (price > threshold) effect *= penalty;
  }
  if (price < segment.minAcceptablePrice) {
    // prix trop bas = méfiance : l'attraction décroît linéairement avec l'écart
    effect *= Math.max(0, price / segment.minAcceptablePrice);
  }
  const { min, max } = segment.priceEffectBounds;
  return Math.min(max, Math.max(min, effect));
}

/** Effet marketing à rendements décroissants (doc 02 §3.2). */
export function marketingEffect(
  budget: number,
  segment: SegmentConfig,
  scale: number,
): number {
  if (budget <= 0) return 1;
  return 1 + segment.marketingSensitivity * Math.log(1 + budget / scale);
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
}): number {
  const { price, marketingBudget, perceivedQuality, lastShare, segment, marketingScale } = args;
  return (
    priceEffect(price, segment) *
    marketingEffect(marketingBudget, segment, marketingScale) *
    qualityEffect(perceivedQuality, segment) *
    loyaltyEffect(lastShare, segment)
  );
}
