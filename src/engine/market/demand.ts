import type { SegmentConfig } from "../types";

/**
 * Demande potentielle du marché pour un segment au tour t (doc 02 §3.1) :
 * base × croissance^(t-1) × saisonnalité × effet macro (événements).
 */
export function computePotentialDemand(
  segment: SegmentConfig,
  roundIndex: number,
  seasonality: number[],
  demandMultiplier: number,
): number {
  const applicable = segment.seasonality ?? seasonality;
  const season = applicable[roundIndex - 1] ?? 1;
  const growth = Math.pow(1 + segment.growth, roundIndex - 1);
  return segment.size * growth * season * demandMultiplier;
}
