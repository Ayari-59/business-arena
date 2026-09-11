/**
 * Mapping des situations aux étapes d'apprentissage.
 * Spécifie pour chaque situation:
 * - requiredLearningSteps: étapes qui doivent être complétées avant d'accéder
 * - grantedLearningSteps: étapes débloquées après débriefage
 *
 * Stratégie:
 * - "prise_de_poste" (première situation du scénario) : pas de prérequis
 * - "contexte_marche" : requiert core + market, débloque market steps
 * - "decision_strategique" : requiert finance + strategy, débloque strategy steps
 * - "alerte_comptable" : requiert finance, renforce finance mastery
 * - "tresorerie_dormante" : requiert finance_03+, débloque finance_04
 */

export interface SituationLearningMapping {
  situationCode: string;
  requiredLearningSteps?: string[];
  grantedLearningSteps?: string[];
}

export const SITUATION_LEARNING_MAP: SituationLearningMapping[] = [
  // ============ PRISE DE POSTE ============
  // Première situation = accès libre, déverrouille core_01
  {
    situationCode: "boutique_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },
  {
    situationCode: "hotel_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },
  {
    situationCode: "transport_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },
  {
    situationCode: "batiment_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },
  {
    situationCode: "ecommerce_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },
  {
    situationCode: "bistrot_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },
  {
    situationCode: "fitness_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },
  {
    situationCode: "conseil_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },
  {
    situationCode: "nova_t1_reprise",
    grantedLearningSteps: ["core_01"],
  },

  // ============ DECISION STRATEGIQUE / PRIX ET VOLUME ============
  // Requiert core_01, débloque core_02
  {
    situationCode: "boutique_t2_circuit",
    requiredLearningSteps: ["core_01"],
    grantedLearningSteps: ["core_02"],
  },
  {
    situationCode: "hotel_t2_overbooking",
    requiredLearningSteps: ["core_01"],
    grantedLearningSteps: ["core_02"],
  },
  {
    situationCode: "transport_t2_routes",
    requiredLearningSteps: ["core_01"],
    grantedLearningSteps: ["core_02"],
  },
  {
    situationCode: "batiment_t2_chantiers",
    requiredLearningSteps: ["core_01"],
    grantedLearningSteps: ["core_02"],
  },
  {
    situationCode: "ecommerce_t2_marketplace",
    requiredLearningSteps: ["core_01"],
    grantedLearningSteps: ["core_02"],
  },
  {
    situationCode: "bistrot_t2_terrasse",
    requiredLearningSteps: ["core_01"],
    grantedLearningSteps: ["core_02"],
  },
  {
    situationCode: "fitness_t2_services",
    requiredLearningSteps: ["core_01"],
    grantedLearningSteps: ["core_02"],
  },
  {
    situationCode: "conseil_t2_tarification",
    requiredLearningSteps: ["core_01"],
    grantedLearningSteps: ["core_02"],
  },

  // ============ CONTEXTE MARCHE ============
  // Requiert core_02 + market_01, débloque market_02
  {
    situationCode: "boutique_t4_noel",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "boutique_t5_coton",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "hotel_t4_tourisme",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "hotel_t5_competition",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "transport_t4_ralentissement",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "batiment_t4_regulation",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "ecommerce_t4_saturation",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "bistrot_t4_tendance",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "fitness_t4_sport",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },

  // ============ GESTION DE VOLUME / PRODUCTION ============
  // Requiert core_02, débloque core_03
  {
    situationCode: "boutique_t3_soldes",
    requiredLearningSteps: ["core_02"],
    grantedLearningSteps: ["core_03"],
  },
  {
    situationCode: "hotel_t3_occupation",
    requiredLearningSteps: ["core_02"],
    grantedLearningSteps: ["core_03"],
  },
  {
    situationCode: "transport_t3_renouvellement",
    requiredLearningSteps: ["core_02"],
    grantedLearningSteps: ["core_03"],
  },
  {
    situationCode: "batiment_t3_stock",
    requiredLearningSteps: ["core_02"],
    grantedLearningSteps: ["core_03"],
  },
  {
    situationCode: "ecommerce_t3_promo",
    requiredLearningSteps: ["core_02"],
    grantedLearningSteps: ["core_03"],
  },
  {
    situationCode: "bistrot_t3_menu",
    requiredLearningSteps: ["core_02"],
    grantedLearningSteps: ["core_03"],
  },
  {
    situationCode: "fitness_t3_cours",
    requiredLearningSteps: ["core_02"],
    grantedLearningSteps: ["core_03"],
  },

  // ============ ALERTE COMPTABLE (below_breakeven, profitable_illiquid) ============
  // Requiert finance_02, enseigne finance concepts
  {
    situationCode: "boutique_detect_below_breakeven",
    requiredLearningSteps: ["finance_02"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "boutique_detect_profitable_illiquid",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "hotel_detect_below_breakeven",
    requiredLearningSteps: ["finance_02"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "hotel_detect_profitable_illiquid",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "transport_detect_below_breakeven",
    requiredLearningSteps: ["finance_02"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "batiment_detect_below_breakeven",
    requiredLearningSteps: ["finance_02"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "ecommerce_detect_below_breakeven",
    requiredLearningSteps: ["finance_02"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "bistrot_detect_below_breakeven",
    requiredLearningSteps: ["finance_02"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "fitness_detect_below_breakeven",
    requiredLearningSteps: ["finance_02"],
    grantedLearningSteps: [],
  },
  {
    situationCode: "conseil_detect_below_breakeven",
    requiredLearningSteps: ["finance_02"],
    grantedLearningSteps: [],
  },

  // ============ TRESORERIE DORMANTE (idle_cash) ============
  // Requiert finance_03, débloque finance_04
  {
    situationCode: "boutique_t6_capitaux",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "boutique_detect_idle_cash",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "hotel_t6_tresorerie",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "hotel_detect_idle_cash",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "transport_t6_reserve",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "batiment_t6_investissement",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "ecommerce_t6_croissance",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "bistrot_t6_expansion",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "fitness_t6_developpement",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },
  {
    situationCode: "conseil_t6_placement",
    requiredLearningSteps: ["finance_03"],
    grantedLearningSteps: ["finance_04"],
  },

  // ============ STRATEGIQUES AVANCEES ============
  // Certaines situations strategy/contexte avancées requièrent plusieurs prérequis
  {
    situationCode: "nova_t2_segmentation",
    requiredLearningSteps: ["core_02", "market_01"],
    grantedLearningSteps: ["market_02"],
  },
  {
    situationCode: "nova_t3_production",
    requiredLearningSteps: ["core_03"],
    grantedLearningSteps: ["strategy_01"],
  },
  {
    situationCode: "nova_t4_contexte",
    requiredLearningSteps: ["market_02"],
    grantedLearningSteps: ["market_03"],
  },
];

/**
 * Récupère le mapping pour une situation donnée.
 */
export function getSituationLearningMapping(situationCode: string): SituationLearningMapping | undefined {
  return SITUATION_LEARNING_MAP.find((m) => m.situationCode === situationCode);
}
