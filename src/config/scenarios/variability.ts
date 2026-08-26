import type { EngineScenarioConfig } from "../../engine/types";
import { createRng } from "../../engine/random";

/**
 * Monde variable (doc 02 §9bis) : à la création d'une partie, une variante du
 * scénario est dérivée de la GRAINE de la partie — même graine, même monde
 * (déterminisme conservé), mais deux parties diffèrent. La dramaturgie
 * (pic T4, arrivée de CampusTech, hausse matières scriptée) et tous les
 * chiffres cités par les textes pédagogiques (prix 59 €, coût variable 38 €,
 * sous-traitant 52 €, investissement 20 €/u, taux 5 %) sont INTANGIBLES :
 * seule la texture économique bouge, dans des bornes calibrées.
 *
 * Paramètres perturbés (multiplicateurs tirés une fois, dans l'ordre — pour
 * garder la stabilité, tout nouveau tirage s'AJOUTE EN FIN de liste) :
 *  - taille des segments ±5 %, croissance ±20 % (relatif)
 *  - amplitude de la saisonnalité GLOBALE ±15 % autour de 1 (la forme et les
 *    saisonnalités par segment — CampusTech — ne bougent pas)
 *  - échelle marketing ±10 %, attraction du marché extérieur ±10 %
 *  - délai fournisseurs ±15 % (arrondi au jour)
 *  - charges de structure ±2 %
 *  - prime d'assurance ±10 %, prix des études ±10 %
 *  - probabilités des événements aléatoires ×0,8..1,3 (une proba 0 RESTE 0 :
 *    cartes enseignant et tirages seedés intacts)
 */
export function applyScenarioVariability(
  scenario: EngineScenarioConfig,
  seed: number,
): EngineScenarioConfig {
  // graine dédiée, décorrélée des tirages d'événements (deriveRoundSeed)
  const rng = createRng(((seed ^ 0x5eed_c0de) * 2654435761) >>> 0);
  const between = (min: number, max: number) => min + rng.next() * (max - min);

  const segments = scenario.market.segments.map((s) => ({
    ...s,
    size: s.size * between(0.95, 1.05),
    growth: s.growth * between(0.8, 1.2),
  }));
  const seasonAmplitude = between(0.85, 1.15);
  const seasonality = scenario.market.seasonality.map(
    (c) => 1 + (c - 1) * seasonAmplitude,
  );
  const marketingScale = scenario.marketing.scale * between(0.9, 1.1);
  const outsideAttraction = scenario.market.outsideAttraction * between(0.9, 1.1);
  const supplierDelay = Math.round(
    scenario.finance.supplierPaymentDelayDays * between(0.85, 1.15),
  );
  const fixedCosts = scenario.fixedCostsPerRound * between(0.98, 1.02);
  const insuranceFactor = between(0.9, 1.1);
  const studiesFactor = between(0.9, 1.1);
  const eventFactor = between(0.8, 1.3);

  return {
    ...scenario,
    market: {
      ...scenario.market,
      segments,
      seasonality,
      outsideAttraction,
    },
    marketing: { scale: marketingScale },
    finance: {
      ...scenario.finance,
      supplierPaymentDelayDays: supplierDelay,
    },
    fixedCostsPerRound: fixedCosts,
    ...(scenario.insurance
      ? {
          insurance: {
            ...scenario.insurance,
            premiumPerRound: Math.round(scenario.insurance.premiumPerRound * insuranceFactor),
          },
        }
      : {}),
    ...(scenario.studies
      ? {
          studies: {
            marketCost: Math.round(scenario.studies.marketCost * studiesFactor),
            priceCost: Math.round(scenario.studies.priceCost * studiesFactor),
            financeCost: Math.round(scenario.studies.financeCost * studiesFactor),
            projectCost: Math.round(scenario.studies.projectCost * studiesFactor),
          },
        }
      : {}),
    events: scenario.events.map((e) => ({
      ...e,
      probability: e.probability === 0 ? 0 : Math.min(0.25, e.probability * eventFactor),
    })),
  };
}
