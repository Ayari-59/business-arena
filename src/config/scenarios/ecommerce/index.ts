import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario E-COMMERCE — « PIXEL & CO », pure player de décoration et
 * petit mobilier, 6 tours trimestriels.
 *
 * Ce que le secteur apporte de propre au commerce en ligne :
 * - la vitrine ne coûte rien, mais LE TRAFIC S'ACHÈTE. Le budget
 *   d'acquisition n'est pas un confort : sans lui, il n'y a pas de
 *   clients du tout. C'est le seul scénario où couper le marketing tue
 *   l'activité au lieu de l'assainir ;
 * - la vraie question du métier n'est pas « quelle est ma marge ? » mais
 *   « ma marge par commande couvre-t-elle ce que m'a coûté ce client ? » ;
 * - la logistique et les retours mangent la marge commande après commande,
 *   invisibles dans le prix affiché ;
 * - Black Friday et Noël concentrent près d'un tiers de l'année sur un
 *   seul tour : il faut avoir le stock ET la capacité de préparation.
 *
 * Calibration (base trimestrielle) : ~4 500 commandes à 68 € de panier,
 * 38 € de coût variable (27 € de marchandise + 11 € de logistique,
 * retours et commissions) → 30 € de marge ; 48 000 € de structure
 * décaissée → seuil ≈ 1 600 commandes AVANT budget d'acquisition — et c'est
 * bien ce budget, absent du seuil, qui décide de l'exercice.
 */
const rawEcommerce = {
  code: "ecommerce",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "acquisition",
        name: "Nouveaux clients (trafic payant)",
        size: 10800,
        growth: 0.08,
        priceElasticity: -2.3,
        refPrice: 62,
        minAcceptablePrice: 30,
        psychThresholds: [
          { threshold: 50, penalty: 0.9 },
          { threshold: 100, penalty: 0.93 },
        ],
        // le trafic S'ACHÈTE : c'est le segment le plus sensible au budget
        marketingSensitivity: 1.25,
        qualitySensitivity: 0.15,
        loyalty: 0.02,
        priceEffectBounds: { min: 0.15, max: 4 },
        paymentDelayDays: 0,
      },
      {
        code: "fideles",
        name: "Clients récurrents (base installée)",
        size: 5760,
        growth: 0.05,
        priceElasticity: -0.9,
        refPrice: 78,
        minAcceptablePrice: 40,
        psychThresholds: [{ threshold: 100, penalty: 0.92 }],
        // ceux-là reviennent seuls : aucun euro d'acquisition à repayer
        marketingSensitivity: 0.08,
        qualitySensitivity: 0.5,
        loyalty: 0.55,
        priceEffectBounds: { min: 0.35, max: 2.4 },
        paymentDelayDays: 0,
      },
      {
        code: "marketplace",
        name: "Marketplaces tierces (commission)",
        size: 6720,
        growth: 0.06,
        priceElasticity: -2.6,
        refPrice: 58,
        minAcceptablePrice: 28,
        psychThresholds: [],
        marketingSensitivity: 0.05,
        qualitySensitivity: 0.2,
        loyalty: 0.1,
        priceEffectBounds: { min: 0.12, max: 4 },
        paymentDelayDays: 30,
      },
    ],
    // Black Friday et Noël : le T4 vaut plus d'une fois et demie un trimestre
    seasonality: [0.9, 0.95, 0.85, 1.6, 0.9, 0.95],
    outsideAttraction: 2.2,
    competitionIntensity: 2.1,
  },
  product: {
    code: "commande",
    // coût d'achat des marchandises expédiées
    materialCostPerUnit: 27,
    // préparation, emballage, transport, retours et commission de paiement
    otherVariableCostPerUnit: 11,
    hoursPerUnit: 0.25,
  },
  production: {
    // « qualité » = photos, fiches produit, service client, délai de livraison
    qualitySensitivity: 0.26,
    qualityScale: 8000,
    qualityInertia: 0.5,
    // « maintenance » = plateforme technique, entrepôt, outils logistiques
    maintenanceReference: 5000,
    availabilityDecay: 0.06,
  },
  // L'acquisition est le poste central du métier : l'échelle est haute.
  marketing: { scale: 30000 },
  finance: {
    loanAnnualRate: 0.062,
    overdraftAnnualRate: 0.14,
    overdraftLimit: 35000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 45,
    loanDurationRounds: 16,
    maxCapitalIncreaseTotal: 200000,
    depreciationPerRound: 5000,
  },
  treasury: {
    discountAnnualRate: 0.075,
    discountMaxShare: 0.5,
    factoringFeeRate: 0.03,
    forcedFactoringFeeRate: 0.07,
  },
  // structure ≈ 53 000 €/tour : 48 000 décaissés (équipe, entrepôt, plateforme,
  // abonnements logiciels) + 5 000 d'amortissements — HORS acquisition
  fixedCostsPerRound: 48000,
  suppliers: [
    {
      code: "grossiste_ue",
      name: "Grossiste européen",
      narrative:
        "Stock disponible en Europe, réassort sous une semaine, règlement à 45 jours. Le socle fiable du catalogue.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 45,
      supplyRiskProbability: 0.04,
      supplyRiskAvailabilityHit: 0.9,
    },
    {
      code: "import_direct",
      name: "Import direct conteneur",
      narrative:
        "20 % de moins sur la marchandise, payée à la commande, six semaines de mer et aucun réassort d'urgence possible.",
      costMultiplier: 0.8,
      qualityBonus: -0.07,
      paymentDelayDays: 0,
      supplyRiskProbability: 0.14,
      supplyRiskAvailabilityHit: 0.75,
    },
    {
      code: "createurs_fr",
      name: "Créateurs français en dropshipping",
      narrative:
        "26 % plus cher, expédié directement par l'atelier, réglé à 15 jours. Zéro stock à porter, et un discours qui fait revenir les clients.",
      costMultiplier: 1.26,
      qualityBonus: 0.12,
      paymentDelayDays: 15,
      supplyRiskProbability: 0.06,
      supplyRiskAvailabilityHit: 0.88,
    },
  ],
  insurance: {
    premiumPerRound: 1400,
    coveredEventCodes: ["ecom_cyberattaque"],
    formulas: [
      {
        code: "basic",
        name: "Cyber-risques essentiels",
        premiumPerRound: 1400,
        coveredEventCodes: ["ecom_cyberattaque"],
      },
      {
        code: "extended",
        name: "Cyber + perte d'exploitation",
        premiumPerRound: 2900,
        coveredEventCodes: ["ecom_cyberattaque", "ecom_entrepot"],
      },
      {
        code: "premium",
        name: "Tous risques e-commerce",
        premiumPerRound: 5200,
        coveredEventCodes: ["ecom_cyberattaque", "ecom_entrepot", "ecom_transporteur"],
      },
    ],
  },
  investment: {
    // mécaniser la préparation de commandes : ~7 € par commande de capacité
    costPerCapacityUnit: 7,
    depreciationRounds: 16,
    maxPerRound: 3000,
  },
  studies: {
    marketCost: 1600,
    priceCost: 1400,
    financeCost: 900,
    projectCost: 1300,
  },
  orderOffers: [
    {
      code: "ecom_offer_coffrets_ce",
      title: "Coffrets pour un comité d'entreprise",
      narrative:
        "Un grand groupe commande 900 coffrets à 58 € pour ses salariés. Facturation unique au siège, règlement à 60 jours.",
      units: 900,
      price: 58,
      paymentDelayDays: 60,
    },
    {
      code: "ecom_offer_flash_marketplace",
      title: "Opération flash sur marketplace",
      narrative:
        "Une marketplace vous met en tête de gondole 72 h : 1 200 commandes à 44 €, virement hebdomadaire. Le volume est là, la marge est mince.",
      units: 1200,
      price: 44,
      paymentDelayDays: 0,
    },
    {
      code: "ecom_offer_hotelier",
      title: "Équipement d'un groupe hôtelier",
      narrative:
        "Un groupe rééquipe 40 chambres : 800 références à 74 €, payées à 90 jours après réception. Votre plus belle marge de l'année, dans trois mois.",
      units: 800,
      price: 74,
      paymentDelayDays: 90,
    },
    {
      code: "ecom_offer_destockage",
      title: "Déstockage de fin de collection",
      narrative:
        "Un soldeur reprend 1 400 pièces à 33 €, enlèvement et paiement comptant. Vous ne gagnez presque rien, mais l'entrepôt respire.",
      units: 1400,
      price: 33,
      paymentDelayDays: 0,
    },
    {
      code: "ecom_offer_abonnement_box",
      title: "Partenariat box par abonnement",
      narrative:
        "Un éditeur de box mensuelles intègre vos produits : 1 000 unités à 51 €, réglées à 45 jours. Récurrent, prévisible, peu margé.",
      units: 1000,
      price: 51,
      paymentDelayDays: 45,
    },
    {
      code: "ecom_offer_influenceur",
      title: "Collection capsule avec une créatrice",
      narrative:
        "Une créatrice suivie par 400 000 personnes signe une capsule : 600 commandes à 88 €, encaissées comptant. Prix fort, notoriété en prime.",
      units: 600,
      price: 88,
      paymentDelayDays: 0,
    },
  ],
  hr: {
    salaryPerEmployeePerRound: 8200,
    includedHeadcount: 5,
    hiringCost: 3000,
    firingCost: 5500,
    trainingScale: 3000,
    trainingSensitivity: 0.06,
    maxProductivity: 1.3,
    moraleSensitivity: 0.5,
    attritionThreshold: 0.95,
    maxHiresPerRound: 3,
    maxHeadcount: 14,
  },
  events: [
    {
      code: "ecom_algo_publicitaire",
      scope: "market",
      probability: 0.06,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand:acquisition", op: "mul", value: 0.72 }],
    },
    {
      code: "ecom_vague_retours",
      scope: "company",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.16 }],
    },
    {
      code: "ecom_transporteur",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.8 }],
    },
    {
      code: "ecom_influenceur",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.26 }],
    },
    {
      code: "ecom_marketplace_commission",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand:marketplace", op: "mul", value: 0.82 }],
    },
    {
      code: "ecom_frais_port",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.2 }],
    },
    {
      code: "ecom_credit_resserre",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    {
      code: "ecom_rupture_appro",
      scope: "company",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.82 }],
    },
    // Cartes « équipe » et cartes enseignant : jamais tirées par le PRNG.
    // APPENDRE en fin de liste (le PRNG consomme un tirage par événement).
    {
      code: "ecom_cyberattaque",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.62 }],
    },
    {
      code: "ecom_entrepot",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [
        { target: "availability", op: "mul", value: 0.7 },
        { target: "material_cost", op: "mul", value: 1.12 },
      ],
    },
    {
      code: "ecom_presse",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 1.07 }],
    },
    {
      code: "ecom_banque_conciliante",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "ecom_commande_b2b",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 700 }],
    },
    {
      code: "ecom_black_friday",
      scope: "market",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.45 }],
    },
  ],
  // Les frais de port explosent au tour 5 : la marge par commande se comprime
  // juste après le pic, quand le stock a déjà été payé.
  scriptedEvents: [{ round: 5, eventCode: "ecom_frais_port" }],
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
      operatingIncome: { min: -60000, target: 45000 },
      revenue: { min: 120000, target: 300000 },
      netTreasury: { min: -55000, target: 70000 },
      returnOnEquity: { min: -0.1, target: 0.08 },
      marketShareTarget: 0.24,
      utilizationTarget: 0.78,
    },
  },
} satisfies EngineScenarioConfig;

export const ecommerceScenario: EngineScenarioConfig = parseScenarioConfig(rawEcommerce);

/**
 * État initial de PIXEL & CO. Un pure player possède peu : un entrepôt loué,
 * des outils, et surtout du STOCK — 2 000 références achetées d'avance, qui
 * sont l'essentiel de son actif et de son besoin de financement.
 */
export function ecommerceCompany(
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
    // capacité de préparation et d'expédition de commandes par trimestre
    machineCapacity: 7000,
    availability: 1,
    headcount: 5,
    hoursPerEmployee: 455,
    productivity: 1,
    finishedGoods: { quantity: 2000, unitCost: 27 },
    // prêt d'amorçage : 90 000 € sur 16 trimestres → 5 625 €/tour
    loans: [{ remaining: 90000, perRound: 5625 }],
    finance: {
      fixedAssetsNet: 85000,
      inventoryValue: 54000, // 2 000 × 27 €
      receivables: 21000,
      cash: 38000,
      equity: 78000,
      financialDebt: 90000,
      payables: 30000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les pure players concurrents. */
export const ecommerceBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "discount-deco", name: "DiscountDéco", profile: "price_aggressive" },
  { id: "atelier-nord", name: "Atelier du Nord", profile: "premium" },
  { id: "maison-shop", name: "MaisonShop", profile: "balanced" },
  { id: "scaleo", name: "Scaleo", profile: "growth" },
  { id: "brocante-web", name: "Brocante.web", profile: "passive" },
  { id: "cargo-deco", name: "Cargo Déco", profile: "price_aggressive" },
  { id: "lumen-home", name: "Lumen Home", profile: "premium" },
];
