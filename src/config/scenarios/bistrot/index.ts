import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario RESTAURANT — « LA TABLE D'AUGUSTIN », bistrot de 70 couverts,
 * 6 tours trimestriels.
 *
 * Ce que le secteur apporte de propre à la restauration :
 * - DOUBLE péremption. Le couvert non servi est perdu (la salle ne se
 *   stocke pas), et les denrées préparées non vendues partent à la
 *   poubelle. Sur-préparer coûte deux fois : en marchandise et en marge ;
 * - le RATIO MATIÈRES (food cost) est l'indicateur roi : 10 € de denrées
 *   pour ~33 € de ticket, soit 30 %. Deux points de dérive et l'exercice
 *   bascule ;
 * - la contrainte de capacité est double elle aussi : les places assises
 *   ET les heures de brigade. 0,5 h de travail par couvert : servir plus
 *   suppose d'embaucher, pas seulement d'ajouter des chaises ;
 * - trois circuits d'approvisionnement opposent frontalement prix d'achat
 *   et qualité perçue — le cash & carry sauve le ratio et abîme les avis.
 *
 * Calibration (base trimestrielle) : ~6 000 couverts à ~33 €, 13 € de coût
 * variable → ~20 € de marge ; 90 000 € de structure décaissée → seuil
 * ≈ 4 500 couverts, soit 50 par jour d'ouverture.
 */
const rawBistrot = {
  code: "bistrot",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  // Le couvert non servi et la denrée préparée non vendue sont perdus.
  perishable: true,
  market: {
    segments: [
      {
        code: "midi_affaires",
        name: "Déjeuners d'affaires (formule du midi)",
        size: 9200,
        growth: 0.03,
        // la formule du midi est un marché de prix : 2 € de plus et on va en face
        priceElasticity: -1.5,
        refPrice: 27,
        minAcceptablePrice: 16,
        psychThresholds: [{ threshold: 30, penalty: 0.88 }],
        marketingSensitivity: 0.12,
        qualitySensitivity: 0.25,
        loyalty: 0.42,
        priceEffectBounds: { min: 0.25, max: 3 },
        paymentDelayDays: 0,
        // creux d'août : les bureaux se vident
        seasonality: [1.05, 1.1, 0.6, 1.05, 1.05, 1.1],
      },
      {
        code: "soir_locaux",
        name: "Dîners clientèle locale",
        size: 11900,
        growth: 0.04,
        priceElasticity: -1.2,
        refPrice: 34,
        minAcceptablePrice: 19,
        psychThresholds: [{ threshold: 40, penalty: 0.9 }],
        marketingSensitivity: 0.26,
        qualitySensitivity: 0.42,
        loyalty: 0.22,
        priceEffectBounds: { min: 0.22, max: 3.4 },
        paymentDelayDays: 0,
      },
      {
        code: "groupes",
        name: "Banquets & repas d'entreprise (30 j)",
        size: 5900,
        growth: 0.05,
        priceElasticity: -1.2,
        refPrice: 31,
        minAcceptablePrice: 18,
        psychThresholds: [],
        marketingSensitivity: 0.08,
        qualitySensitivity: 0.3,
        loyalty: 0.45,
        priceEffectBounds: { min: 0.3, max: 2.6 },
        paymentDelayDays: 30,
        // banquets de fin d'année : tout se joue au T4
        seasonality: [0.7, 0.95, 0.5, 1.85, 0.7, 0.95],
      },
    ],
    seasonality: [0.9, 1.05, 0.85, 1.25, 0.9, 1.05],
    outsideAttraction: 0.55,
    competitionIntensity: 1.9,
  },
  product: {
    code: "couvert",
    // denrées : le ratio matières, indicateur roi de la restauration (≈ 31 %)
    materialCostPerUnit: 10,
    // énergie de cuisson, consommables, commissions des plateformes de livraison
    otherVariableCostPerUnit: 3,
    // 0,5 h de brigade (cuisine + salle) par couvert servi
    hoursPerUnit: 0.5,
  },
  production: {
    // « qualité » = soin de la carte, produits, dressage
    qualitySensitivity: 0.24,
    qualityScale: 4500,
    // en restauration la réputation bouge vite (avis en ligne)
    qualityInertia: 0.45,
    // « maintenance » = entretien du matériel de cuisine et de la salle
    maintenanceReference: 4000,
    availabilityDecay: 0.07,
  },
  marketing: { scale: 7000 },
  finance: {
    loanAnnualRate: 0.058,
    overdraftAnnualRate: 0.14,
    overdraftLimit: 20000,
    // Le plan de trésorerie déposé avec les décisions est la pièce que lit
    // la banque : sans lui, pas d'emprunt, et la fiabilité des plans passés
    // fixe le plafond de découvert consenti et son taux. Un prévisionnel qui
    // ne change rien n'apprend pas à en faire un.
    bank: { memory: 0.6, maxOverdraftSpread: 0.05, minOverdraftShare: 0.4 },
    taxRate: 0.25,
    // les fournisseurs de frais ne font pas crédit longtemps
    supplierPaymentDelayDays: 21,
    loanDurationRounds: 24,
    maxCapitalIncreaseTotal: 90000,
    depreciationPerRound: 6000,
  },
  treasury: {
    discountAnnualRate: 0.075,
    discountMaxShare: 0.5,
    factoringFeeRate: 0.03,
    forcedFactoringFeeRate: 0.07,
    // 2 %/an : de quoi valoriser le surplus, jamais de quoi financer
    // un découvert à 9 %. L'arbitrage doit rester perdant à l'envers.
    placementAnnualRate: 0.02,
  },
  // structure ≈ 96 000 €/tour : 90 000 décaissés (brigade, loyer, énergie,
  // assurances, redevances) + 6 000 d'amortissements de la cuisine
  fixedCostsPerRound: 90000,
  suppliers: [
    {
      code: "grossiste",
      name: "Grossiste alimentaire",
      narrative:
        "Le camion passe trois fois par semaine, la qualité est régulière, la facture tombe à 21 jours. Le choix par défaut de la profession.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 21,
      supplyRiskProbability: 0.04,
      supplyRiskAvailabilityHit: 0.9,
    },
    {
      code: "cash_carry",
      name: "Cash & carry (vous chargez le camion)",
      narrative:
        "14 % de moins sur les denrées, mais payées comptant en caisse et chargées par vos soins. Le ratio matières s'améliore, les avis clients un peu moins.",
      costMultiplier: 0.86,
      qualityBonus: -0.06,
      paymentDelayDays: 0,
      supplyRiskProbability: 0.1,
      supplyRiskAvailabilityHit: 0.84,
    },
    {
      code: "circuit_court",
      name: "Producteurs en circuit court",
      narrative:
        "Maraîcher, éleveur et fromager du coin : 20 % plus cher, réglés à 15 jours. C'est ce que vous écrivez sur l'ardoise, et ce que les clients racontent.",
      costMultiplier: 1.2,
      qualityBonus: 0.1,
      paymentDelayDays: 15,
      supplyRiskProbability: 0.07,
      supplyRiskAvailabilityHit: 0.86,
    },
  ],
  insurance: {
    premiumPerRound: 700,
    coveredEventCodes: ["bistrot_panne_froid"],
    formulas: [
      {
        code: "basic",
        name: "Multirisque restaurant",
        premiumPerRound: 700,
        coveredEventCodes: ["bistrot_panne_froid"],
      },
      {
        code: "extended",
        name: "Multirisque + perte d'exploitation",
        premiumPerRound: 1500,
        coveredEventCodes: ["bistrot_panne_froid", "bistrot_degat_des_eaux"],
      },
      {
        code: "premium",
        name: "Tous risques établissement recevant du public",
        premiumPerRound: 2600,
        coveredEventCodes: [
          "bistrot_panne_froid",
          "bistrot_degat_des_eaux",
          "bistrot_fermeture_administrative",
        ],
      },
    ],
  },
  investment: {
    // couvrir et chauffer la terrasse : ~1 900 € par place gagnée sur le
    // trimestre (156 services) → 12 € par couvert de capacité
    costPerCapacityUnit: 12,
    depreciationRounds: 24,
    maxPerRound: 1500,
  },
  studies: {
    marketCost: 900,
    priceCost: 700,
    financeCost: 600,
    projectCost: 800,
  },
  orderOffers: [
    {
      code: "bistrot_offer_mariage",
      title: "Saison des mariages",
      narrative:
        "Une agence de réception vous confie les mariages de la saison : salle privatisée, menu unique, acompte à la réservation et solde sur facture. Chaque service se joue en une fois, sans rattrapage possible.",
      units: 260,
      price: 46,
      paymentDelayDays: 30,
    },
    {
      code: "bistrot_offer_cantine_entreprise",
      title: "Cantine d'entreprise · contrat de restauration",
      narrative:
        "Une PME voisine envoie ses salariés déjeuner tous les midis, sur une facture unique adressée au siège. Le volume est garanti, la marge tient dans un mouchoir.",
      units: 900,
      price: 21,
      paymentDelayDays: 45,
    },
    {
      code: "bistrot_offer_traiteur",
      title: "Prestation traiteur · inauguration",
      narrative:
        "Une collectivité inaugure sa médiathèque et vous confie les buffets. Vous produisez en cuisine, vous livrez sur place, et le mandat administratif prend son temps.",
      units: 500,
      price: 24,
      paymentDelayDays: 60,
    },
    {
      code: "bistrot_offer_tournage",
      title: "Cantine de tournage",
      narrative:
        "Une production audiovisuelle nourrit son équipe pendant toute la durée du tournage, réglée comptant chaque vendredi. Horaires impossibles, trésorerie parfaite.",
      units: 700,
      price: 28,
      paymentDelayDays: 0,
    },
    {
      code: "bistrot_offer_seminaire",
      title: "Journées d'étude d'un cabinet d'avocats",
      narrative:
        "Un cabinet installe chez vous ses journées d'étude : déjeuners de travail et dîners de gala, votre plus beau ticket. Comptabilité du cabinet oblige, la facture attendra son tour.",
      units: 320,
      price: 52,
      paymentDelayDays: 60,
    },
    {
      code: "bistrot_offer_livraison",
      title: "Opération plateforme de livraison",
      narrative:
        "Une plateforme vous met en avant sur son application et vous vire la recette chaque semaine. La commission est déjà déduite, mais le volume est là.",
      units: 800,
      price: 23,
      paymentDelayDays: 0,
    },
  ],
  hr: {
    salaryPerEmployeePerRound: 7800,
    includedHeadcount: 10,
    hiringCost: 2000,
    firingCost: 4500,
    trainingScale: 2200,
    trainingSensitivity: 0.06,
    maxProductivity: 1.28,
    // la restauration vit une tension salariale permanente
    moraleSensitivity: 0.75,
    attritionThreshold: 0.97,
    maxHiresPerRound: 3,
    maxHeadcount: 18,
  },
  events: [
    {
      code: "bistrot_avis_viral",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand:soir_locaux", op: "mul", value: 1.3 }],
    },
    {
      code: "bistrot_inspection",
      scope: "company",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.82 }],
    },
    {
      code: "bistrot_panne_froid",
      scope: "company",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [
        { target: "availability", op: "mul", value: 0.85 },
        { target: "material_cost", op: "mul", value: 1.14 },
      ],
    },
    {
      code: "bistrot_bureaux_vides",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand:midi_affaires", op: "mul", value: 0.75 }],
    },
    {
      code: "bistrot_commission_livraison",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.1 }],
    },
    {
      code: "bistrot_matieres_premieres",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.24 }],
    },
    {
      code: "bistrot_terrasse",
      scope: "market",
      probability: 0.05,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.15 }],
    },
    {
      code: "bistrot_credit_resserre",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    // Cartes « équipe » et cartes enseignant : jamais tirées par le PRNG.
    // APPENDRE en fin de liste (le PRNG consomme un tirage par événement).
    {
      code: "bistrot_degat_des_eaux",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [
        { target: "availability", op: "mul", value: 0.65 },
        { target: "material_cost", op: "mul", value: 1.1 },
      ],
    },
    {
      code: "bistrot_fermeture_administrative",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.55 }],
    },
    {
      code: "bistrot_guide_gastronomique",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 1.08 }],
    },
    {
      code: "bistrot_banque_conciliante",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "bistrot_banquet_surprise",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 220 }],
    },
    {
      code: "bistrot_festival_ville",
      scope: "market",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.25 }],
    },
  ],
  // Le beurre, la viande et l'énergie flambent au tour 3 : le ratio matières
  // dérape en plein creux d'août, quand la salle est déjà vide.
  scriptedEvents: [{ round: 3, eventCode: "bistrot_matieres_premieres" }],
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
      operatingIncome: { min: -40000, target: 34000 },
      revenue: { min: 90000, target: 225000 },
      netTreasury: { min: -35000, target: 45000 },
      returnOnEquity: { min: -0.1, target: 0.08 },
      marketShareTarget: 0.3,
      utilizationTarget: 0.75,
    },
  },
} satisfies EngineScenarioConfig;

export const bistrotScenario: EngineScenarioConfig = parseScenarioConfig(rawBistrot);

/**
 * État initial du bistrot. Restauration = peu de créances (on encaisse au
 * dessert), pas de stock reporté (tout est périssable), mais une cuisine
 * et une licence qui ont coûté cher et un emprunt à rembourser.
 */
export function bistrotCompany(
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
    // 70 places × 2 services × ~64 jours d'ouverture ≈ 9 000 couverts/trimestre
    machineCapacity: 9000,
    availability: 1,
    headcount: 10,
    hoursPerEmployee: 455,
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    // emprunt d'installation : 105 000 € sur 24 trimestres → 4 375 €/tour
    loans: [{ remaining: 105000, perRound: 4375 }],
    finance: {
      fixedAssetsNet: 180000,
      inventoryValue: 0,
      receivables: 12000, // uniquement les banquets et repas d'entreprise
      cash: 25000,
      equity: 92000,
      financialDebt: 105000,
      payables: 20000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les tables concurrentes du quartier. */
export const bistrotBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "brasserie-gare", name: "Brasserie de la Gare", profile: "price_aggressive" },
  { id: "table-marches", name: "La Table des Marchés", profile: "premium" },
  { id: "comptoir-halles", name: "Comptoir des Halles", profile: "balanced" },
  { id: "cantine-moderne", name: "La Cantine Moderne", profile: "growth" },
  { id: "chez-lucien", name: "Chez Lucien", profile: "passive" },
  { id: "pasta-vino", name: "Pasta & Vino", profile: "price_aggressive" },
  { id: "maison-verre", name: "La Maison de Verre", profile: "premium" },
];
