import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario BOUTIQUE — « MAILLE & CO », concept store de prêt-à-porter
 * indépendant, 6 tours trimestriels.
 *
 * Ce que le secteur apporte de propre au commerce de détail :
 * - on n'a rien à fabriquer, on ACHÈTE pour revendre : la marge se joue au
 *   coefficient multiplicateur, pas à l'atelier ;
 * - le stock est un ACTIF qui dort — la boutique démarre d'ailleurs avec
 *   1 200 articles en rayon, donc du BFR dès le tour 1 ;
 * - la saisonnalité est brutale (Noël pèse près d'un tour et demi de
 *   ventes ordinaires) : rater son approvisionnement de T4, c'est rater
 *   l'exercice ;
 * - les trois circuits d'achat (grossiste, déstockeur, créateur) opposent
 *   frontalement prix d'achat, image et délai de règlement.
 *
 * Calibration (base trimestrielle) : ~4 400 articles vendus à 45 €, coût
 * d'achat 18 € + 3,50 € de frais variables → 23,50 € de marge unitaire ;
 * 84 000 € de charges de structure décaissées → seuil ≈ 3 575 articles.
 */
const rawBoutique = {
  code: "boutique",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "fideles",
        name: "Clientes fidèles (carte de fidélité)",
        size: 5000,
        growth: 0.02,
        priceElasticity: -0.9,
        refPrice: 52,
        minAcceptablePrice: 30,
        psychThresholds: [{ threshold: 80, penalty: 0.92 }],
        marketingSensitivity: 0.1,
        qualitySensitivity: 0.35,
        loyalty: 0.45,
        priceEffectBounds: { min: 0.35, max: 2.4 },
        paymentDelayDays: 0,
      },
      {
        code: "chalands",
        name: "Chalands de passage (sensibles au prix)",
        size: 11000,
        growth: 0.05,
        priceElasticity: -2.1,
        refPrice: 42,
        minAcceptablePrice: 22,
        psychThresholds: [
          { threshold: 40, penalty: 0.9 },
          { threshold: 50, penalty: 0.94 },
        ],
        marketingSensitivity: 0.28,
        qualitySensitivity: 0.12,
        loyalty: 0.08,
        priceEffectBounds: { min: 0.15, max: 4 },
        paymentDelayDays: 0,
      },
      {
        code: "entreprises",
        name: "Comités d'entreprise (règlement à 45 j)",
        size: 6000,
        growth: 0.06,
        priceElasticity: -1.3,
        refPrice: 46,
        minAcceptablePrice: 28,
        psychThresholds: [],
        marketingSensitivity: 0.06,
        qualitySensitivity: 0.25,
        loyalty: 0.4,
        priceEffectBounds: { min: 0.3, max: 2.6 },
        paymentDelayDays: 45,
        // les CE commandent pour les fêtes : le gros de leur budget part au T4
        seasonality: [0.6, 0.8, 0.9, 1.9, 0.6, 0.8],
      },
    ],
    // Noël écrase tout : T4 vaut près d'une fois et demie un trimestre ordinaire
    seasonality: [0.95, 1.0, 1.05, 1.45, 0.95, 1.0],
    outsideAttraction: 0.6,
    competitionIntensity: 1.8,
  },
  product: {
    code: "article-mode",
    // coût d'achat marchandises : le nerf du commerce (coefficient ≈ 2,5)
    materialCostPerUnit: 18,
    // sacs, cintres, commissions carte bancaire, logistique retour
    otherVariableCostPerUnit: 3.5,
    hoursPerUnit: 0.12,
  },
  production: {
    // « qualité » = soin de la sélection et du merchandising
    qualitySensitivity: 0.18,
    qualityScale: 5000,
    qualityInertia: 0.55,
    // « maintenance » = entretien de la boutique et de la vitrine
    maintenanceReference: 3000,
    availabilityDecay: 0.05,
  },
  marketing: { scale: 9000 },
  finance: {
    loanAnnualRate: 0.052,
    overdraftAnnualRate: 0.13,
    overdraftLimit: 25000,
    taxRate: 0.25,
    // le commerce paie ses fournisseurs à 45 jours (usage de la profession)
    supplierPaymentDelayDays: 45,
    loanDurationRounds: 20,
    maxCapitalIncreaseTotal: 80000,
    depreciationPerRound: 4500,
  },
  treasury: {
    discountAnnualRate: 0.07,
    discountMaxShare: 0.6,
    factoringFeeRate: 0.025,
    forcedFactoringFeeRate: 0.06,
  },
  // structure ≈ 88 500 €/tour : 84 000 décaissés (loyer, salaires, énergie,
  // assurances, honoraires) + 4 500 d'amortissements de l'agencement
  fixedCostsPerRound: 84000,
  suppliers: [
    {
      code: "grossiste",
      name: "Grossiste de la place",
      narrative:
        "Le circuit classique : catalogue large, qualité constante, règlement à 45 jours. Aucune surprise, aucune envolée.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 45,
      supplyRiskProbability: 0.03,
      supplyRiskAvailabilityHit: 0.9,
    },
    {
      code: "destockeur",
      name: "Déstockeur (fins de série)",
      narrative:
        "Des fins de série à −18 % sur le prix d'achat, mais payées comptant à l'enlèvement et sans garantie de réassort : ce qui part est parti.",
      costMultiplier: 0.82,
      qualityBonus: -0.06,
      paymentDelayDays: 0,
      supplyRiskProbability: 0.12,
      supplyRiskAvailabilityHit: 0.78,
    },
    {
      code: "createur",
      name: "Créateurs en direct",
      narrative:
        "Des pièces exclusives payées 22 % plus cher, réglées à 30 jours. Elles font la réputation de la boutique et la fidélité des clientes.",
      costMultiplier: 1.22,
      qualityBonus: 0.09,
      paymentDelayDays: 30,
      supplyRiskProbability: 0.05,
      supplyRiskAvailabilityHit: 0.88,
    },
  ],
  insurance: {
    premiumPerRound: 900,
    coveredEventCodes: ["boutique_degat_des_eaux"],
    formulas: [
      {
        code: "basic",
        name: "Multirisque commerce",
        premiumPerRound: 900,
        coveredEventCodes: ["boutique_degat_des_eaux"],
      },
      {
        code: "extended",
        name: "Multirisque + perte d'exploitation",
        premiumPerRound: 1800,
        coveredEventCodes: ["boutique_degat_des_eaux", "boutique_rupture_appro"],
      },
      {
        code: "premium",
        name: "Tous risques commerce connecté",
        premiumPerRound: 3200,
        coveredEventCodes: [
          "boutique_degat_des_eaux",
          "boutique_rupture_appro",
          "boutique_demarque",
        ],
      },
    ],
  },
  investment: {
    // agrandir la réserve et le linéaire : +1 unité de capacité de traitement
    costPerCapacityUnit: 14,
    depreciationRounds: 20,
    maxPerRound: 2500,
  },
  studies: {
    marketCost: 1200,
    priceCost: 900,
    financeCost: 700,
    projectCost: 1000,
  },
  orderOffers: [
    {
      code: "boutique_offer_ce_noel",
      title: "Comité d'entreprise · dotation de Noël",
      narrative:
        "Le CSE d'une clinique privée veut 600 pièces à 41 € pour ses dotations de fin d'année. Mandat administratif : règlement à 60 jours.",
      units: 600,
      price: 41,
      paymentDelayDays: 60,
    },
    {
      code: "boutique_offer_vide_dressing",
      title: "Vide-dressing du centre-ville",
      narrative:
        "L'association des commerçants organise un week-end vide-dressing : 500 pièces à 29 €, encaissement immédiat. Le prix est cassé, la caisse se remplit.",
      units: 500,
      price: 29,
      paymentDelayDays: 0,
    },
    {
      code: "boutique_offer_hotel_uniformes",
      title: "Groupe hôtelier · tenues d'accueil",
      narrative:
        "Un groupe hôtelier habille ses réceptions : 800 pièces à 44 €, payées à 60 jours après validation du service achats.",
      units: 800,
      price: 44,
      paymentDelayDays: 60,
    },
    {
      code: "boutique_offer_marketplace",
      title: "Marketplace · opération flash",
      narrative:
        "Une marketplace vous ouvre un créneau flash : 700 pièces à 31 €, virement sous 48 h. Marge mince, trésorerie immédiate.",
      units: 700,
      price: 31,
      paymentDelayDays: 0,
    },
    {
      code: "boutique_offer_boutique_hotel",
      title: "Corner en boutique d'hôtel",
      narrative:
        "Un palace vous propose un corner saisonnier : 450 pièces à 58 €, votre meilleur prix, mais réglées à 90 jours comme tous ses fournisseurs.",
      units: 450,
      price: 58,
      paymentDelayDays: 90,
    },
    {
      code: "boutique_offer_destockage",
      title: "Déstockeur · reprise de collection",
      narrative:
        "Un déstockeur reprend 900 pièces à 26 € l'unité, enlèvement et paiement comptant. Vous ne gagnez presque rien, mais la réserve se vide.",
      units: 900,
      price: 26,
      paymentDelayDays: 0,
    },
  ],
  hr: {
    salaryPerEmployeePerRound: 7200,
    includedHeadcount: 6,
    hiringCost: 2200,
    firingCost: 4800,
    trainingScale: 2500,
    trainingSensitivity: 0.05,
    maxProductivity: 1.25,
    moraleSensitivity: 0.5,
    attritionThreshold: 0.95,
    maxHiresPerRound: 3,
    maxHeadcount: 12,
  },
  events: [
    {
      code: "boutique_travaux_voirie",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 0.82 }],
    },
    {
      code: "boutique_influenceur",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand:chalands", op: "mul", value: 1.3 }],
    },
    {
      code: "boutique_demarque",
      scope: "company",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.09 }],
    },
    {
      code: "boutique_rupture_appro",
      scope: "company",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.84 }],
    },
    {
      code: "boutique_ecommerce",
      scope: "market",
      probability: 0.04,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 0.9 }],
    },
    {
      code: "boutique_coton",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.18 }],
    },
    {
      code: "boutique_credit_resserre",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    {
      code: "boutique_pretexte_fete",
      scope: "market",
      probability: 0.04,
      duration: 1,
      modifiers: [{ target: "demand:fideles", op: "mul", value: 1.22 }],
    },
    // Cartes « équipe » et cartes enseignant : jamais tirées par le PRNG.
    // APPENDRE en fin de liste (le PRNG consomme un tirage par événement).
    {
      code: "boutique_degat_des_eaux",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [
        { target: "availability", op: "mul", value: 0.7 },
        { target: "material_cost", op: "mul", value: 1.1 },
      ],
    },
    {
      code: "boutique_vitrine_primee",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 1.08 }],
    },
    {
      code: "boutique_banque_conciliante",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "boutique_commande_ce",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 500 }],
    },
    {
      code: "boutique_rue_pietonne",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 1.16 }],
    },
  ],
  // Le coton flambe au tour 5 : la marge d'achat se comprime juste après Noël,
  // quand la trésorerie a déjà tout donné dans le réassort.
  scriptedEvents: [{ round: 5, eventCode: "boutique_coton" }],
  scoring: {
    weights: {
      economic: 0.3,
      financial: 0.2,
      commercial: 0.15,
      operational: 0.1,
      profitability: 0.1,
      strategy: 0.1,
      decisionMastery: 0.05,
    },
    benchmarks: {
      operatingIncome: { min: -35000, target: 32000 },
      revenue: { min: 90000, target: 235000 },
      netTreasury: { min: -45000, target: 55000 },
      returnOnEquity: { min: -0.1, target: 0.07 },
      marketShareTarget: 0.28,
      utilizationTarget: 0.8,
    },
  },
} satisfies EngineScenarioConfig;

export const boutiqueScenario: EngineScenarioConfig = parseScenarioConfig(rawBoutique);

/**
 * État initial de la boutique. Contrairement à un industriel, un commerçant
 * OUVRE avec du stock : 1 200 articles à 21,50 € dorment en réserve, et
 * 20 000 € sont dus aux fournisseurs. Le BFR est là dès le premier tour —
 * c'est le point de départ de la leçon.
 */
export function boutiqueCompany(
  id: string,
  name: string,
  controller: "human" | "bot",
  botProfile?: BotProfile,
): CompanyState {
  return {
    id,
    name,
    controller,
    botProfile,
    perceivedQuality: 1,
    // capacité de traitement trimestrielle (réserve, linéaire, caisse)
    machineCapacity: 7500,
    availability: 1,
    headcount: 6,
    hoursPerEmployee: 455,
    productivity: 1,
    finishedGoods: { quantity: 1200, unitCost: 21.5 },
    // emprunt d'installation : 70 000 € sur 20 trimestres → 3 500 €/tour
    loans: [{ remaining: 70000, perRound: 3500 }],
    finance: {
      fixedAssetsNet: 120000,
      inventoryValue: 25800, // 1 200 × 21,50 €
      receivables: 18000,
      cash: 22000,
      equity: 95800,
      financialDebt: 70000,
      payables: 20000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les enseignes concurrentes de la rue commerçante. */
export const boutiqueBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "fastmode", name: "FastMode", profile: "price_aggressive" },
  { id: "atelier-lin", name: "Atelier Lin", profile: "premium" },
  { id: "rue-neuve", name: "Rue Neuve", profile: "balanced" },
  { id: "kiosk", name: "Kiosk", profile: "growth" },
  { id: "mercerie", name: "La Mercerie", profile: "passive" },
  { id: "denim-co", name: "Denim & Co", profile: "price_aggressive" },
  { id: "maison-claire", name: "Maison Claire", profile: "premium" },
];
