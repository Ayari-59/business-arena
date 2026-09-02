import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario BÂTIMENT — « MARTEL & FILS », entreprise de rénovation de quatorze
 * compagnons, 6 tours trimestriels.
 *
 * Ce que le secteur apporte de propre, et qu'aucun des sept autres ne montre :
 * - le BESOIN EN FONDS DE ROULEMENT le plus violent du jeu. L'entreprise
 *   achète les matériaux et paie ses compagnons AVANT de facturer, facture
 *   APRÈS la fin du chantier, et encaisse trente à quatre-vingt-dix jours
 *   plus tard. Elle est l'archétype de l'entreprise rentable qui meurt de
 *   trésorerie ;
 * - le chantier commencé et non terminé est un EN-COURS : du travail déjà
 *   payé, valorisé au coût variable, qui dort au bilan. C'est le seul
 *   scénario où le stock est du travail humain plutôt que de la marchandise ;
 * - la main-d'œuvre et le matériel plafonnent presque au même niveau. Une
 *   équipe qui attend un échafaudage coûte exactement aussi cher qu'une
 *   équipe qui travaille.
 *
 * Calibration (base trimestrielle) : ~1 200 m² à 380 €, 210 € de coût
 * variable → 170 € de marge ; 138 000 € de structure décaissée → seuil
 * ≈ 810 m², soit 54 % d'une capacité de 1 500 m².
 */
const rawBatiment = {
  code: "batiment",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "particuliers",
        name: "Particuliers (paient vite, comparent tout)",
        size: 2400,
        growth: 0.02,
        // trois devis chez trois entreprises : personne ne signe sans comparer
        priceElasticity: -2.1,
        refPrice: 410,
        minAcceptablePrice: 220,
        psychThresholds: [
          { threshold: 400, penalty: 0.9 },
          { threshold: 500, penalty: 0.93 },
        ],
        marketingSensitivity: 0.3,
        qualitySensitivity: 0.4,
        loyalty: 0.15,
        priceEffectBounds: { min: 0.2, max: 3.5 },
        // acompte à la signature, solde à la réception
        paymentDelayDays: 30,
        // le printemps et l'automne, saisons de la rénovation
        seasonality: [1.25, 1.1, 0.6, 1.15, 1.25, 1.1],
      },
      {
        code: "syndics",
        name: "Syndics de copropriété (gros volumes, 60 j)",
        size: 1900,
        growth: 0.05,
        priceElasticity: -1.4,
        refPrice: 372,
        minAcceptablePrice: 210,
        psychThresholds: [],
        marketingSensitivity: 0.12,
        qualitySensitivity: 0.5,
        // une copropriété satisfaite rappelle la même entreprise
        loyalty: 0.55,
        priceEffectBounds: { min: 0.3, max: 2.6 },
        paymentDelayDays: 60,
        seasonality: [1.1, 1.2, 0.75, 1.05, 1.1, 1.2],
      },
      {
        code: "marches_publics",
        name: "Marchés publics (prix serré, mandat à 90 j)",
        size: 1500,
        growth: 0.03,
        priceElasticity: -2.6,
        refPrice: 318,
        minAcceptablePrice: 180,
        psychThresholds: [],
        marketingSensitivity: 0.04,
        qualitySensitivity: 0.2,
        // le marché se rejoue à chaque appel d'offres
        loyalty: 0.2,
        priceEffectBounds: { min: 0.15, max: 3 },
        // mandatement administratif, plus la retenue de garantie
        paymentDelayDays: 90,
        seasonality: [0.9, 1.15, 0.85, 1.2, 0.9, 1.15],
      },
    ],
    // l'hiver arrête les chantiers extérieurs
    seasonality: [1.15, 1.15, 0.7, 1.1, 1.15, 1.15],
    outsideAttraction: 0.45,
    competitionIntensity: 2.1,
  },
  product: {
    code: "m2_renove",
    // matériaux : cloisons, isolation, revêtements, peinture, sanitaires
    materialCostPerUnit: 168,
    // location de matériel, évacuation des gravats, carburant des fourgons
    otherVariableCostPerUnit: 42,
    // 4,2 h de compagnon par mètre carré entièrement rénové
    hoursPerUnit: 4.2,
  },
  production: {
    // « qualité » = finitions, respect des délais, propreté du chantier
    qualitySensitivity: 0.3,
    qualityScale: 26000,
    // dans le bâtiment la réputation se fait par le bouche-à-oreille : lente
    qualityInertia: 0.72,
    // « maintenance » = entretien du matériel, des fourgons, des échafaudages
    maintenanceReference: 11000,
    availabilityDecay: 0.06,
  },
  marketing: { scale: 16000 },
  finance: {
    loanAnnualRate: 0.058,
    overdraftAnnualRate: 0.14,
    overdraftLimit: 90000,
    // Le plan de trésorerie déposé avec les décisions est la pièce que lit
    // la banque : sans lui, pas d'emprunt, et la fiabilité des plans passés
    // fixe le plafond de découvert consenti et son taux.
    bank: { memory: 0.6, maxOverdraftSpread: 0.05, minOverdraftShare: 0.4 },
    taxRate: 0.25,
    vatRate: 0.2,
    // les négoces de matériaux font crédit, mais pas longtemps
    supplierPaymentDelayDays: 45,
    loanDurationRounds: 24,
    maxCapitalIncreaseTotal: 200000,
    depreciationPerRound: 14000,
  },
  treasury: {
    // c'est le secteur où la mobilisation des créances est vitale
    discountAnnualRate: 0.075,
    discountMaxShare: 0.6,
    factoringFeeRate: 0.03,
    forcedFactoringFeeRate: 0.075,
    placementAnnualRate: 0.02,
  },
  // structure ≈ 152 000 €/tour : 138 000 décaissés (encadrement, dépôt,
  // assurance décennale, véhicules, bureau) + 14 000 d'amortissements
  fixedCostsPerRound: 138000,
  suppliers: [
    {
      code: "negoce_regional",
      name: "Négoce régional",
      narrative:
        "Le négoce du coin, réglé à quarante-cinq jours. Les prix du marché, la livraison sur chantier, et un interlocuteur qui connaît vos équipes.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 45,
      supplyRiskProbability: 0.05,
      supplyRiskAvailabilityHit: 0.9,
    },
    {
      code: "destockeur_materiaux",
      name: "Déstockeur de matériaux",
      narrative:
        "Des lots de fin de série, bien moins chers, payés comptant à l'enlèvement. Les références changent d'une commande à l'autre, et un chantier attend parfois son carrelage.",
      costMultiplier: 0.83,
      qualityBonus: -0.07,
      paymentDelayDays: 0,
      supplyRiskProbability: 0.16,
      supplyRiskAvailabilityHit: 0.74,
    },
    {
      code: "fabricant_direct",
      name: "Achat direct au fabricant",
      narrative:
        "Plus cher, réglé à quinze jours, mais des matériaux tracés et garantis. Les syndics et les architectes le remarquent, et le redemandent.",
      costMultiplier: 1.19,
      qualityBonus: 0.12,
      paymentDelayDays: 15,
      supplyRiskProbability: 0.03,
      supplyRiskAvailabilityHit: 0.94,
    },
  ],
  insurance: {
    premiumPerRound: 4200,
    coveredEventCodes: ["batiment_sinistre_chantier"],
    formulas: [
      {
        code: "basic",
        name: "Responsabilité civile professionnelle",
        premiumPerRound: 4200,
        coveredEventCodes: ["batiment_sinistre_chantier"],
      },
      {
        code: "extended",
        name: "RC professionnelle et matériel de chantier",
        premiumPerRound: 8500,
        coveredEventCodes: ["batiment_sinistre_chantier", "batiment_vol_materiel", "batiment_major_breakdown"],
      },
      {
        code: "premium",
        name: "Décennale renforcée et tous risques chantier",
        premiumPerRound: 13800,
        coveredEventCodes: [
          "batiment_sinistre_chantier",
          "batiment_vol_materiel",
          "batiment_malfacon",
          "batiment_major_breakdown",
          "batiment_tech_obsolescence",
        ],
      },
    ],
  },
  investment: {
    // un fourgon équipé, un échafaudage, une nacelle : ~340 € par m² de
    // capacité trimestrielle supplémentaire
    costPerCapacityUnit: 340,
    depreciationRounds: 24,
    maxPerRound: 400,
  },
  // Équipements typés : 3 niveaux de matériel de chantier.
  // Capacité initiale = 2 × 250 + 1 × 400 + 1 × 600 = 1 500 (identique au legacy).
  equipment: {
    types: [
      {
        code: "outillage_manuel",
        name: "Outillage manuel",
        capacityPerUnit: 250,
        costPerUnit: 35000,
        depreciationRounds: 20,
        maintenanceMultiplier: 1.3,
        maxPerRound: 4,
        resaleRatio: 0.4,
      },
      {
        code: "nacelle_fourgon",
        name: "Nacelle et fourgon",
        capacityPerUnit: 400,
        costPerUnit: 65000,
        depreciationRounds: 24,
        maintenanceMultiplier: 1.0,
        maxPerRound: 2,
        resaleRatio: 0.5,
      },
      {
        code: "mini_grue",
        name: "Mini-grue",
        capacityPerUnit: 600,
        costPerUnit: 130000,
        depreciationRounds: 28,
        maintenanceMultiplier: 0.7,
        maxPerRound: 1,
        resaleRatio: 0.55,
      },
    ],
    initialFleet: [
      { typeCode: "outillage_manuel", count: 2 },
      { typeCode: "nacelle_fourgon", count: 1 },
      { typeCode: "mini_grue", count: 1 },
    ],
  },
  studies: {
    marketCost: 2100,
    priceCost: 1600,
    financeCost: 1300,
    projectCost: 1900,
  },
  orderOffers: [
    {
      code: "batiment_offer_bailleur",
      title: "Bailleur social · réhabilitation d'un immeuble",
      narrative:
        "Un bailleur social réhabilite une résidence entière et cherche une entreprise capable de tenir le planning. Volume comme vous n'en verrez pas deux fois, mandat administratif au bout.",
      units: 900,
      price: 296,
      paymentDelayDays: 90,
    },
    {
      code: "batiment_offer_promoteur",
      title: "Promoteur · finitions d'un programme neuf",
      narrative:
        "Un promoteur a perdu son entreprise de finitions à trois semaines de la livraison. Il paie bien pour être dépanné, mais chaque jour de retard lui coûte des pénalités qu'il vous répercutera.",
      units: 700,
      price: 448,
      paymentDelayDays: 45,
    },
    {
      code: "batiment_offer_syndic_urgence",
      title: "Syndic · réfection après dégât des eaux",
      narrative:
        "Une copropriété doit reprendre les parties communes après un sinistre. L'assurance règle, ce qui rassure sur le paiement, mais elle prend son temps pour instruire.",
      units: 480,
      price: 392,
      paymentDelayDays: 60,
    },
    {
      code: "batiment_offer_collectivite",
      title: "Collectivité · groupe scolaire",
      narrative:
        "La commune rénove son groupe scolaire et impose le calendrier des vacances d'été. Prix tiré, planning intouchable, et le mandatement viendra bien après la rentrée.",
      units: 1100,
      price: 284,
      paymentDelayDays: 90,
    },
    {
      code: "batiment_offer_particulier_haut",
      title: "Rénovation complète d'une maison de maître",
      narrative:
        "Des propriétaires exigeants confient une rénovation soignée, avec un architecte qui passe chaque semaine. Votre plus beau prix au mètre carré, et vos meilleurs compagnons mobilisés longtemps.",
      units: 320,
      price: 520,
      paymentDelayDays: 30,
    },
    {
      code: "batiment_offer_sous_traitance",
      title: "Sous-traitance pour une entreprise générale",
      narrative:
        "Une entreprise générale déborde et vous confie son lot second œuvre. Elle règle vite parce qu'elle a besoin de vous, mais elle vous prend une part de la marge au passage.",
      units: 620,
      price: 318,
      paymentDelayDays: 30,
    },
  ],
  hr: {
    salaryPerEmployeePerRound: 9600,
    includedHeadcount: 14,
    hiringCost: 3200,
    firingCost: 7500,
    trainingScale: 3600,
    trainingSensitivity: 0.08,
    maxProductivity: 1.28,
    moraleSensitivity: 0.7,
    attritionThreshold: 0.96,
    maxHiresPerRound: 3,
    maxHeadcount: 24,
  },
  events: [
    {
      code: "batiment_aide_renovation",
      scope: "market",
      probability: 0.05,
      duration: 2,
      modifiers: [{ target: "demand:particuliers", op: "mul", value: 1.32 }],
    },
    {
      code: "batiment_penurie_materiaux",
      scope: "market",
      probability: 0.06,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.22 }],
    },
    {
      code: "batiment_intemperies",
      scope: "market",
      probability: 0.07,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.82 }],
    },
    {
      code: "batiment_appel_offres",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand:marches_publics", op: "mul", value: 1.4 }],
    },
    {
      code: "batiment_credit_immobilier",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 0.78 }],
    },
    {
      code: "batiment_concurrent_liquide",
      scope: "market",
      probability: 0.04,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 1.18 }],
    },
    {
      code: "batiment_credit_resserre",
      scope: "market",
      probability: 0.04,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    // Cartes « équipe » et cartes enseignant : jamais tirées par le PRNG.
    // APPENDRE en fin de liste (le PRNG consomme un tirage par événement).
    {
      code: "batiment_sinistre_chantier",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [
        { target: "availability", op: "mul", value: 0.74 },
        { target: "material_cost", op: "mul", value: 1.16 },
      ],
    },
    {
      code: "batiment_vol_materiel",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.7 }],
    },
    {
      code: "batiment_malfacon",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.2 }],
    },
    {
      code: "batiment_reference_prestige",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 1.06 }],
    },
    {
      code: "batiment_banque_conciliante",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "batiment_chantier_surprise",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 180 }],
    },
    // Événements machines (§ équipement) : pannes, obsolescence et
    // opportunités d'équipement. APPENDRE en fin de liste (PRNG).
    {
      code: "batiment_major_breakdown",
      scope: "company",
      probability: 0.03,
      minRound: 4,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 0.7 }],
    },
    {
      code: "batiment_tech_obsolescence",
      scope: "company",
      probability: 0.03,
      minRound: 4,
      duration: 2,
      modifiers: [
        { target: "availability", op: "mul", value: 0.9 },
        { target: "material_cost", op: "mul", value: 1.08 },
      ],
    },
    {
      code: "batiment_used_equipment_deal",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 1.12 }],
    },
  ],
  // Le crédit immobilier se resserre au tour 4 : les particuliers reportent
  // leurs travaux au moment même où la saison devrait repartir.
  scriptedEvents: [{ round: 4, eventCode: "batiment_credit_immobilier" }],
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
      operatingIncome: { min: -90000, target: 55000 },
      revenue: { min: 260000, target: 520000 },
      netTreasury: { min: -160000, target: 40000 },
      returnOnEquity: { min: -0.12, target: 0.07 },
      marketShareTarget: 0.24,
      utilizationTarget: 0.8,
    },
  },
} satisfies EngineScenarioConfig;

export const batimentScenario: EngineScenarioConfig = parseScenarioConfig(rawBatiment);

/**
 * État initial de MARTEL & FILS. Le bilan d'un artisan qui tourne bien : un
 * dépôt et du matériel financés à crédit, un poste clients ÉNORME au regard
 * du chiffre d'affaires, et presque rien en caisse. Les 260 m² d'en-cours
 * sont des chantiers commencés, valorisés au coût variable engagé.
 */
export function batimentCompany(
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
    // échafaudages, fourgons, outillage : de quoi tenir 1 500 m² par trimestre
    machineCapacity: 1500,
    availability: 1,
    headcount: 14,
    hoursPerEmployee: 455,
    productivity: 1,
    // chantiers commencés, non facturés : 260 m² au coût variable de 210 €
    finishedGoods: { quantity: 260, unitCost: 210 },
    // Parc initial : 2 outillage (70 000 €) + 1 nacelle (65 000 €) + 1 mini-grue (130 000 €) = 265 000 €
    // (amorti à ~63 % → ~166 000 € de VNC)
    fleet: [
      { typeCode: "outillage_manuel", count: 2, acquiredRound: 0, bookValue: 38000 },
      { typeCode: "nacelle_fourgon", count: 1, acquiredRound: 0, bookValue: 42000 },
      { typeCode: "mini_grue", count: 1, acquiredRound: 0, bookValue: 86000 },
    ],
    // crédit de matériel : 240 000 € sur 24 trimestres → 10 000 €/tour
    loans: [{ remaining: 240000, perRound: 10000 }],
    finance: {
      fixedAssetsNet: 385000,
      inventoryValue: 54600,
      // trois mois de chiffre d'affaires immobilisés : c'est le métier
      receivables: 318000,
      cash: 22000,
      equity: 443600,
      financialDebt: 240000,
      payables: 96000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les entreprises concurrentes du bassin. */
export const batimentBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "renov-express", name: "Rénov'Express", profile: "price_aggressive" },
  { id: "maisons-durand", name: "Maisons Durand", profile: "premium" },
  { id: "batiplus", name: "Batiplus", profile: "balanced" },
  { id: "groupe-verdier", name: "Groupe Verdier", profile: "growth" },
  { id: "artisan-lemoine", name: "Artisan Lemoine", profile: "passive" },
  { id: "eco-habitat", name: "Éco-Habitat", profile: "premium" },
  { id: "sarl-fontaine", name: "SARL Fontaine", profile: "price_aggressive" },
];
