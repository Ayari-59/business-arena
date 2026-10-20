import type { EngineScenarioConfig } from "@/engine/types";

/**
 * LE SCÉNARIO SANS L'AVENIR : les saisons des tours à venir remplacées par
 * celle du tour à jouer. Le joueur ne voit que la saison du tour qu'il joue ; la
 * méthode non plus. Rien d'autre ne change.
 *
 * Il vivait dans `pedagogy/merite/reference.ts`, qui le réexporte : la
 * proposition du formulaire le lit aussi (`services/decision-baseline.ts`, le
 * départ du secteur mis en phase), et le bon gestionnaire lit la proposition.
 * Ici, aucun des deux ne dépend de l'autre pour l'avoir.
 */
export function sansAvenir(scenario: EngineScenarioConfig, roundIndex: number): EngineScenarioConfig {
  const couper = (s: number[]): number[] => {
    const ici = s[roundIndex - 1] ?? s[s.length - 1] ?? 1;
    return s.map((v, i) => (i < roundIndex ? v : ici));
  };
  const segments = (segs: EngineScenarioConfig["market"]["segments"]) =>
    segs.map((g) => (g.seasonality ? { ...g, seasonality: couper(g.seasonality) } : g));
  return {
    ...scenario,
    market: {
      ...scenario.market,
      seasonality: couper(scenario.market.seasonality),
      segments: segments(scenario.market.segments),
    },
    ...(scenario.products
      ? {
          products: scenario.products.map((p) => ({
            ...p,
            market: {
              ...p.market,
              ...(p.market.seasonality ? { seasonality: couper(p.market.seasonality) } : {}),
              segments: segments(p.market.segments),
            },
          })),
        }
      : {}),
  };
}
