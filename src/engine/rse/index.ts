import type { RseEngineConfig } from "../types";

/**
 * ENGAGEMENT RSE — LOT 2 : LE LEVIER ET SES EFFETS MOTEUR.
 *
 * Le Lot 1 mesurait la RSE à la lecture, sans rien changer au jeu. Le Lot 2
 * en fait un VRAI ARBITRAGE : la dépense coûte MAINTENANT (charge décaissée du
 * tour, marge en moins) et rapporte PLUS TARD, par un capital qui met des tours
 * à se constituer — et à retomber si on cesse d'entretenir.
 *
 * Deux capitaux, deux effets différés :
 * - le CAPITAL-IMAGE (nourri par `rse.budget`) relève lentement l'attractivité,
 *   à l'inverse du marketing qui agit vite et s'éteint vite : c'est un capital
 *   de marque ;
 * - le CAPITAL « PROCESS PROPRE » (nourri par `rse.investment`) réduit
 *   durablement les rebuts.
 *
 * Le décalage est le cœur pédagogique : sur un horizon trop court, la RSE PEUT
 * rester un mauvais calcul — et c'est voulu. Sans ce risque, « être vertueux »
 * ne serait qu'un bouton « gagner ».
 *
 * Module PUR. Les magnitudes ne sont jamais codées en dur dans le moteur :
 * elles viennent de `scenario.rse` (réglable par l'enseignant, cf.
 * economicOverrides), à défaut de DEFAULT_RSE_CONFIG ci-dessous. La dépense est
 * normalisée par l'échelle marketing du scénario, donc l'effet se calibre tout
 * seul quel que soit l'ordre de grandeur du secteur.
 */

/**
 * Réglages par défaut, utilisés quand le scénario ne porte pas de bloc `rse`.
 * Choisis pour que l'effet soit sensible mais jamais écrasant, et surtout LENT.
 */
export const DEFAULT_RSE_CONFIG: RseEngineConfig = {
  imageDemandSensitivity: 0.2,
  imageInertia: 0.6,
  cleanDefectReductionMax: 0.4,
  cleanInertia: 0.75,
  financingTrustBonus: 0.15,
  socialAttritionRelief: 0.5,
  cards: {
    minRound: 3,
    labelImageThreshold: 0.7,
    labelDemandBonus: 0.15,
    labelDuration: 2,
    badBuzzImageCeiling: 0.25,
    badBuzzProbability: 0.25,
    badBuzzDemandMalus: 0.25,
  },
};

/** Codes des cartes événement RSE (Lot 2C), reliés à leur habillage narratif. */
export const RSE_CARD_CODES = {
  label: "rse_label",
  badBuzz: "rse_bad_buzz",
} as const;

export interface RseCardDraw {
  code: string;
  /** Facteur appliqué à l'attractivité (> 1 = bonus, < 1 = malus). */
  demandFactor: number;
  /** Durée en tours. */
  duration: number;
}

/**
 * CARTES ÉVÉNEMENT RSE (Lot 2C) — décision PURE, tirée sur le capital-image
 * d'OUVERTURE. Deux cartes qui s'excluent (le plafond bad buzz est sous le
 * seuil label) :
 *
 * - 🏅 LABEL : un capital mûr est récompensé par un bonus de demande durable.
 * - 📢 BAD BUZZ : un engagement TIÈDE (capital positif mais faible) expose à un
 *   risque probabiliste — « on ne peut pas s'afficher responsable à moitié ».
 *
 * Un capital NUL ne déclenche RIEN : qui n'a jamais joué la RSE n'est ni primé
 * ni sanctionné (la RSE reste facultative). Rien avant `minRound` : un bénéfice
 * différé n'existe pas sur un horizon trop court.
 *
 * `roll` est UN tirage seedé (0..1) pour la part probabiliste du bad buzz.
 */
export function evaluateRseCards(args: {
  imageCapital: number;
  roundIndex: number;
  config: RseEngineConfig["cards"];
  roll: number;
}): RseCardDraw[] {
  const { imageCapital, roundIndex, config, roll } = args;
  if (roundIndex < config.minRound || imageCapital <= 0) return [];
  if (imageCapital >= config.labelImageThreshold) {
    return [
      {
        code: RSE_CARD_CODES.label,
        demandFactor: 1 + Math.max(0, config.labelDemandBonus),
        duration: Math.max(1, config.labelDuration),
      },
    ];
  }
  if (imageCapital < config.badBuzzImageCeiling && roll < config.badBuzzProbability) {
    return [
      {
        code: RSE_CARD_CODES.badBuzz,
        demandFactor: Math.max(0, 1 - Math.max(0, config.badBuzzDemandMalus)),
        duration: 1,
      },
    ];
  }
  return [];
}

/**
 * Effort normalisé d'une dépense RSE : rendements décroissants, exactement
 * comme l'effet marketing (`1 + s·ln(1 + budget/scale)`). L'échelle est celle
 * du marketing du scénario, ce qui rend l'effort comparable d'un secteur à
 * l'autre sans montant codé en dur.
 */
export function rseEffort(spend: number, scale: number): number {
  if (spend <= 0 || scale <= 0) return 0;
  return Math.log(1 + spend / scale);
}

/**
 * Capital RSE au tour suivant : un stock LISSÉ de l'effort. L'inertie est le
 * report d'un tour sur l'autre — élevée, elle rend le capital lent à monter ET
 * lent à retomber (le propre d'un capital, par opposition à une dépense qui
 * s'évapore dans le tour). Point fixe à effort constant E : le capital tend
 * vers E.
 */
export function updateRseCapital(previous: number, effort: number, inertia: number): number {
  const k = Math.min(1, Math.max(0, inertia));
  return k * Math.max(0, previous) + (1 - k) * Math.max(0, effort);
}

/**
 * Facteur d'attractivité tiré du capital-image (1 = neutre, > 1 = bonus). Se
 * lit sur le capital d'OUVERTURE du tour : l'engagement d'aujourd'hui ne paie
 * qu'aux tours suivants — c'est le bénéfice différé.
 */
export function imageAttractionFactor(imageCapital: number, sensitivity: number): number {
  return 1 + Math.max(0, sensitivity) * Math.max(0, imageCapital);
}

/**
 * Réduction du taux de rebuts par le capital « process propre » : saturante
 * (c/(1+c)) et bornée par `max`. Nulle sans capital, elle s'approche de `max`
 * quand le process est mûr, sans jamais l'atteindre.
 */
export function cleanDefectReduction(cleanCapital: number, max: number): number {
  const c = Math.max(0, cleanCapital);
  return Math.max(0, Math.min(1, max)) * (c / (1 + c));
}

/**
 * FINANCEMENT VERT (Lot 2B) : bonus de confiance bancaire tiré du capital-image
 * (borné à 1, le maximum de confiance). Saturant, comme les autres effets : un
 * capital mûr rassure la banque sans jamais la rendre naïve.
 */
export function financingTrustBonus(imageCapital: number, coef: number): number {
  const c = Math.max(0, imageCapital);
  return Math.max(0, coef) * (c / (1 + c));
}

/**
 * CLIMAT SOCIAL (Lot 2B) : part du seuil d'attrition retirée par le
 * capital-image (0..1, saturant). Plus le capital est mûr, plus l'employeur
 * retient — le salaire peut glisser plus bas avant qu'on démissionne.
 */
export function socialAttritionRelief(imageCapital: number, coef: number): number {
  const c = Math.max(0, imageCapital);
  return Math.max(0, Math.min(1, coef)) * (c / (1 + c));
}
