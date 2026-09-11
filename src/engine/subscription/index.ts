import type { SubscriptionConfig } from "../types";

/**
 * Modèle par abonnement : taux d'attrition du portefeuille pour un tour.
 *
 *   base × qualité^(−sQ) × (prix ÷ prixRéf)^(sP) + saturation × excès
 *
 * où l'excès d'occupation vaut max(0, (occupation − seuil) ÷ (1 − seuil)),
 * borné à 1. Le tout est borné à `maxChurnRate` (défaut 0,6) : même une
 * salle sinistrée garde une partie de ses adhérents un trimestre.
 */
export function subscriptionChurnRate(args: {
  config: SubscriptionConfig;
  perceivedQuality: number;
  price: number;
  occupancy: number;
  /** Tour joué (1..N) pour la saisonnalité de l'attrition ; absent = neutre. */
  roundIndex?: number;
}): number {
  const { config, perceivedQuality, price, occupancy } = args;
  const season =
    args.roundIndex !== undefined ? (config.churnSeasonality?.[args.roundIndex - 1] ?? 1) : 1;
  const quality = perceivedQuality > 0 ? Math.pow(perceivedQuality, -config.qualityChurnSensitivity) : 1;
  const priceFactor =
    price > 0 && config.refPrice > 0
      ? Math.pow(price / config.refPrice, config.priceChurnSensitivity)
      : 1;
  const span = 1 - config.crowdingThreshold;
  const excess =
    span > 0
      ? Math.min(1, Math.max(0, (occupancy - config.crowdingThreshold) / span))
      : occupancy > config.crowdingThreshold
        ? 1
        : 0;
  const churn = config.baseChurnRate * season * quality * priceFactor + config.crowdingChurn * excess;
  return Math.min(config.maxChurnRate ?? 0.6, Math.max(0, churn));
}
