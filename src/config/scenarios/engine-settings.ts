import { z } from "zod";
import type { EngineScenarioConfig } from "../../engine/types";

/**
 * Réglages de MARCHÉ d'un scénario, éditables par l'enseignant (PR 3).
 *
 * Les paramètres économiques et les poids du BPI réutilisent la machinerie
 * bornée déjà écrite (`applyEconomicOverrides`, `applyScoringWeightOverrides`).
 * Le marché n'en avait pas : on ajoute ici de quoi régler l'intensité
 * concurrentielle du marché et, par segment, la taille de la demande et le prix
 * de référence — les deux leviers les plus lisibles. La structure fine des
 * segments (élasticité, seuils) et les événements restent hors de portée à
 * cette étape.
 *
 * Rien ici ne fait foi comme validation finale : la config repasse
 * `parseScenarioConfig` à l'enregistrement (prix de référence > 0, etc.).
 */

export const marketSegmentSettingSchema = z.object({
  code: z.string(),
  /** Demande de base du segment (unités/tour). */
  size: z.number().min(0).max(10_000_000).optional(),
  /** Prix de référence du segment. */
  refPrice: z.number().min(0).max(1_000_000).optional(),
});

export const marketSettingsSchema = z.object({
  /** Intensité concurrentielle γ du marché (plus haut = concurrence plus dure). */
  competitionIntensity: z.number().min(0).max(50).optional(),
  segments: z.array(marketSegmentSettingSchema).default([]),
});

export type MarketSettings = z.infer<typeof marketSettingsSchema>;

/** Valeurs de marché du scénario, pour préremplir le formulaire. */
export function readMarketForm(config: EngineScenarioConfig): {
  competitionIntensity: number;
  segments: { code: string; name: string; size: number; refPrice: number }[];
} {
  return {
    competitionIntensity: config.market.competitionIntensity,
    segments: config.market.segments.map((s) => ({
      code: s.code,
      name: s.name,
      size: s.size,
      refPrice: s.refPrice,
    })),
  };
}

/**
 * Applique les réglages de marché à la config. Ne touche qu'aux champs fournis ;
 * un segment inconnu est ignoré. Ne valide pas (c'est le rôle de
 * `parseScenarioConfig` en aval).
 */
export function applyMarketSettings(
  config: EngineScenarioConfig,
  settings: MarketSettings,
): EngineScenarioConfig {
  const byCode = new Map(settings.segments.map((s) => [s.code, s]));
  return {
    ...config,
    market: {
      ...config.market,
      competitionIntensity:
        settings.competitionIntensity ?? config.market.competitionIntensity,
      segments: config.market.segments.map((seg) => {
        const edit = byCode.get(seg.code);
        if (!edit) return seg;
        return {
          ...seg,
          size: edit.size ?? seg.size,
          refPrice: edit.refPrice ?? seg.refPrice,
        };
      }),
    },
  };
}
