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
    aidCleanThreshold: 0.7,
    aidAmount: 1,
    sanctionProbability: 0.2,
    fineAmount: 1,
  },
};

/** Codes des cartes événement RSE (Lot 2C / 2C.2), reliés à leur habillage. */
export const RSE_CARD_CODES = {
  label: "rse_label",
  badBuzz: "rse_bad_buzz",
  subvention: "rse_subvention",
  sanction: "rse_sanction",
} as const;

export interface RseCardDraw {
  code: string;
  /** Durée en tours. */
  duration: number;
  /** Cartes à effet demande (label, bad buzz) : facteur d'attractivité. */
  demandFactor?: number;
  /** Éco-subvention (2C.2) : produit exceptionnel encaissé, en €. */
  aid?: number;
  /** Sanction (2C.2) : charge exceptionnelle décaissée, en €. */
  penalty?: number;
}

/**
 * CARTES ÉVÉNEMENT RSE (Lot 2C / 2C.2) — décision PURE, tirée sur les capitaux
 * d'OUVERTURE. Chaque capital a son upside et le zone tiède de l'image porte
 * ses risques ; les cartes peuvent se cumuler (au plus une par pilier) :
 *
 * IMAGE (rse.budget) :
 * - 🏅 LABEL : capital mûr → bonus de demande durable.
 * - 📢 BAD BUZZ : capital TIÈDE (>0 et < plafond) → malus de demande, un tour.
 * - ⚖️ SANCTION : même zone tiède → risque d'AMENDE (charge exceptionnelle).
 * PROCESS PROPRE (rse.investment) :
 * - 💶 ÉCO-SUBVENTION : capital « propre » mûr → aide (produit exceptionnel).
 *
 * Un capital NUL sur les deux piliers ne déclenche RIEN : qui n'a jamais joué
 * la RSE n'est ni primé ni sanctionné (la RSE reste facultative). Rien avant
 * `minRound` : un bénéfice différé n'existe pas sur un horizon trop court.
 *
 * Montants d'amende/subvention en MULTIPLE de `scale` (échelle marketing du
 * scénario) → auto-calibrés par secteur. `badBuzzRoll` et `sanctionRoll` sont
 * deux tirages seedés INDÉPENDANTS.
 */
export function evaluateRseCards(args: {
  imageCapital: number;
  cleanCapital: number;
  roundIndex: number;
  config: RseEngineConfig["cards"];
  scale: number;
  badBuzzRoll: number;
  sanctionRoll: number;
}): RseCardDraw[] {
  const { imageCapital, cleanCapital, roundIndex, config, scale, badBuzzRoll, sanctionRoll } = args;
  if (roundIndex < config.minRound || (imageCapital <= 0 && cleanCapital <= 0)) return [];
  const cards: RseCardDraw[] = [];

  // Pilier IMAGE.
  if (imageCapital >= config.labelImageThreshold) {
    cards.push({
      code: RSE_CARD_CODES.label,
      demandFactor: 1 + Math.max(0, config.labelDemandBonus),
      duration: Math.max(1, config.labelDuration),
    });
  } else if (imageCapital > 0 && imageCapital < config.badBuzzImageCeiling) {
    // Zone tiède : bad buzz (demande) et sanction (cash) sont deux risques
    // distincts, tirés indépendamment — ils peuvent tomber ensemble ou non.
    if (badBuzzRoll < config.badBuzzProbability) {
      cards.push({
        code: RSE_CARD_CODES.badBuzz,
        demandFactor: Math.max(0, 1 - Math.max(0, config.badBuzzDemandMalus)),
        duration: 1,
      });
    }
    if (sanctionRoll < config.sanctionProbability) {
      cards.push({
        code: RSE_CARD_CODES.sanction,
        penalty: Math.max(0, config.fineAmount) * Math.max(0, scale),
        duration: 1,
      });
    }
  }

  // Pilier PROCESS PROPRE : indépendant de l'image (cumulable avec un label).
  if (cleanCapital >= config.aidCleanThreshold) {
    cards.push({
      code: RSE_CARD_CODES.subvention,
      aid: Math.max(0, config.aidAmount) * Math.max(0, scale),
      duration: 1,
    });
  }

  return cards;
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
