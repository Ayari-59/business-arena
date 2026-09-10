import type { CommunicationAxis, EngineScenarioConfig, SegmentConfig } from "../types";

/**
 * LA COMMUNICATION : la marque et l'axe (levier `communication`).
 *
 * Deux idées, toutes deux hors du budget lui-même. La première : une marque
 * se construit — le budget de marque bâtit une NOTORIÉTÉ, stock à inertie
 * qui bénéficie à toute la gamme au tour suivant et s'use si l'on cesse. La
 * seconde, celle qui change la donne : le même euro rend plus ou moins selon
 * l'AXE qu'on lui donne. Une communication sur le prix parle aux clientèles
 * qui arbitrent sur le prix, une communication sur la qualité à celles qui la
 * regardent ; face à une clientèle qui n'y est pas sensible, l'axe dessert.
 * Et il faut être crédible : promettre le prix en vendant cher fait fuir.
 *
 * Fonctions PURES ; sans bloc `communication`, le moteur ne les appelle pas.
 */

export type CommunicationConfig = NonNullable<EngineScenarioConfig["communication"]>;

export const COMMUNICATION_AXES: readonly CommunicationAxis[] = ["prix", "qualite", "innovation", "image"];

export const COMMUNICATION_AXIS_LABELS: Record<CommunicationAxis, { label: string; hint: string }> = {
  prix: {
    label: "Le prix",
    hint: "Parle aux clientèles qui comparent les étiquettes ; n'est crédible que si votre prix est vraiment bas.",
  },
  qualite: {
    label: "La qualité",
    hint: "Parle aux clientèles qui regardent la qualité avant le prix ; laisse froides celles qui ne comparent que les prix.",
  },
  innovation: {
    label: "L'innovation",
    hint: "Parle aux clientèles curieuses des nouveautés, à condition d'avoir quelque chose de neuf à montrer : une référence lancée, un niveau technique.",
  },
  image: {
    label: "L'image de marque",
    hint: "Parle aux clientèles fidèles, qui achètent une marque autant qu'un produit ; les clientèles de passage n'en ont cure.",
  },
};

export interface AxisContext {
  /** Prix pratiqué sur le segment (crédibilité de l'axe prix). */
  price: number;
  /** Niveau technique de la référence (l'axe innovation a-t-il quelque chose à montrer ?). */
  techLevel: number;
  /** La référence a-t-elle été lancée récemment (nouveauté) ? */
  freshlyLaunched: boolean;
}

/** L'adéquation « brute » d'un axe à un segment : réceptif, indifférent, ou rebuté. */
export function axisAffinity(
  axis: CommunicationAxis,
  segment: SegmentConfig,
  ctx: AxisContext,
): "fit" | "neutral" | "misfit" {
  const explicit = segment.axisAffinity?.[axis];
  if (explicit) {
    // Un axe prix promis sur un prix élevé n'est jamais crédible, quoi qu'en
    // dise le scénario du segment.
    if (axis === "prix" && ctx.price > segment.refPrice * 1.1) return "misfit";
    return explicit;
  }
  switch (axis) {
    case "prix": {
      if (ctx.price > segment.refPrice * 1.1) return "misfit";
      const e = Math.abs(segment.priceElasticity);
      return e >= 1.5 ? "fit" : e <= 1 ? "misfit" : "neutral";
    }
    case "qualite":
      return segment.qualitySensitivity >= 0.3
        ? "fit"
        : segment.qualitySensitivity <= 0.12
          ? "misfit"
          : "neutral";
    case "innovation": {
      // Sans nouveauté à montrer, l'axe sonne creux pour tout le monde.
      if (ctx.techLevel <= 0 && !ctx.freshlyLaunched) return "misfit";
      return segment.qualitySensitivity >= 0.2 ? "fit" : "neutral";
    }
    case "image":
      return segment.loyalty >= 0.3 ? "fit" : segment.loyalty <= 0.1 ? "misfit" : "neutral";
  }
}

/** Le facteur d'adéquation de l'axe (1 sans axe ou indifférence). */
export function axisFitFactor(
  axis: CommunicationAxis | undefined,
  segment: SegmentConfig,
  ctx: AxisContext,
  cfg: CommunicationConfig,
): number {
  if (!axis) return 1;
  const a = axisAffinity(axis, segment, ctx);
  return a === "fit" ? cfg.axisFit : a === "misfit" ? cfg.axisMisfit : 1;
}

/**
 * La notoriété de fin de tour : lissage vers la cible que le budget de
 * marque du tour justifie (rendements décroissants, plafonnée), après usure
 * si l'axe a changé — une marque qui change de discours repart de plus bas.
 */
export function updateBrandAwareness(
  previous: number,
  brandBudget: number,
  axisChanged: boolean,
  cfg: CommunicationConfig,
): number {
  const base = axisChanged ? previous * cfg.axisSwitchDecay : previous;
  const target = Math.min(
    cfg.brandMax,
    cfg.brandSensitivity * Math.log(1 + Math.max(0, brandBudget) / cfg.brandScale),
  );
  return cfg.brandInertia * base + (1 - cfg.brandInertia) * target;
}

/**
 * L'effet de la notoriété d'OUVERTURE sur l'attraction d'un segment : un
 * facteur ≥ 0, neutre à 1, porté ou desservi par l'adéquation de l'axe comme
 * le marketing spécifique.
 */
export function brandFactor(awareness: number, fit: number): number {
  return Math.max(0, 1 + Math.max(0, awareness) * fit);
}
