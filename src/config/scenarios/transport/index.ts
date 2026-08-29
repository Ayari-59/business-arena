import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario TRANSPORT — « ROUTE & CIE », transporteur routier régional de
 * dix-huit chauffeurs, 6 tours trimestriels.
 *
 * Ce que le secteur apporte de propre :
 * - un camion qui part à moitié vide ne se rattrape JAMAIS. La capacité est
 *   périssable comme une nuit d'hôtel, mais elle roule : elle coûte du
 *   gazole, des péages et un chauffeur même quand elle transporte du vide ;
 * - le coût variable est dominé par une matière dont le prix ne se négocie
 *   pas. Une hausse du gazole traverse le compte de résultat sans que
 *   personne dans l'entreprise n'ait rien décidé ;
 * - la flotte pèse un million au bilan et s'amortit vite. C'est le seul
 *   scénario où l'immobilisation écrase tout le reste, et où la question
 *   « renouveler ou réparer » se pose vraiment.
 *
 * Calibration (base trimestrielle) : ~11 000 palettes à 74 €, 43 € de coût
 * variable → 31 € de marge ; 268 000 € de structure décaissée → seuil
 * ≈ 8 650 palettes, soit 54 % d'une capacité de 16 000.
 */
const rawTransport = {
  code: "transport",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  // Une place dans un camion qui roule aujourd'hui est perdue ce soir.
  perishable: true,
  market: {
    segments: [
      {
        code: "industriels",
        name: "Industriels sous contrat (réguliers, 60 j)",
        size: 9000,
        growth: 0.03,
        priceElasticity: -1.1,
        refPrice: 82,
        minAcceptablePrice: 46,
        psychThresholds: [],
        marketingSensitivity: 0.06,
        // ce qu'ils achètent, c'est la ponctualité
        qualitySensitivity: 0.6,
        loyalty: 0.68,
        priceEffectBounds: { min: 0.35, max: 2.4 },
        paymentDelayDays: 60,
        seasonality: [1.05, 1.1, 0.8, 1.2, 1.05, 1.1],
      },
      {
        code: "distribution",
        name: "Grande distribution (volumes, prix serré, 45 j)",
        size: 11000,
        growth: 0.04,
        priceElasticity: -2.2,
        refPrice: 68,
        minAcceptablePrice: 40,
        psychThresholds: [{ threshold: 70, penalty: 0.92 }],
        marketingSensitivity: 0.05,
        qualitySensitivity: 0.35,
        loyalty: 0.45,
        priceEffectBounds: { min: 0.2, max: 3 },
        paymentDelayDays: 45,
        // les pics de fin d'année remplissent les camions
        seasonality: [0.95, 1.05, 0.85, 1.45, 0.95, 1.05],
      },
      {
        code: "affretement",
        name: "Bourse de fret (comptant, prix du jour)",
        size: 6000,
        growth: 0,
        // sur la bourse, dix euros de plus et le lot part chez un autre
        priceElasticity: -3.2,
        refPrice: 58,
        minAcceptablePrice: 34,
        psychThresholds: [],
        marketingSensitivity: 0.02,
        qualitySensitivity: 0.08,
        loyalty: 0.03,
        priceEffectBounds: { min: 0.1, max: 4 },
        paymentDelayDays: 0,
        seasonality: [1, 1.1, 1.2, 1.3, 1, 1.1],
      },
    ],
    seasonality: [1, 1.05, 0.85, 1.3, 1, 1.05],
    outsideAttraction: 0.4,
    competitionIntensity: 2.4,
  },
  product: {
    code: "palette",
    // gazole et péages : la matière première du transporteur
    materialCostPerUnit: 31,
    // entretien, pneumatiques, primes de route, lavage
    otherVariableCostPerUnit: 12,
    // 0,42 h de conduite et de manutention par palette livrée
    hoursPerUnit: 0.42,
  },
  production: {
    // « qualité » = ponctualité, suivi, état du matériel, marchandise intacte
    qualitySensitivity: 0.34,
    qualityScale: 24000,
    // un retard se paie longtemps auprès d'un industriel
    qualityInertia: 0.68,
    // « maintenance » = entretien de la flotte : un camion immobilisé ne roule pas
    maintenanceReference: 18000,
    availabilityDecay: 0.09,
  },
  marketing: { scale: 15000 },
  finance: {
    loanAnnualRate: 0.052,
    overdraftAnnualRate: 0.13,
    overdraftLimit: 110000,
    bank: { memory: 0.6, maxOverdraftSpread: 0.05, minOverdraftShare: 0.4 },
    taxRate: 0.25,
    vatRate: 0.2,
    // le gazole se paie presque comptant, en carte accréditive
    supplierPaymentDelayDays: 15,
    loanDurationRounds: 24,
    maxCapitalIncreaseTotal: 300000,
    // la flotte s'amortit vite, et cela se voit
    depreciationPerRound: 42000,
  },
  treasury: {
    discountAnnualRate: 0.07,
    discountMaxShare: 0.55,
    factoringFeeRate: 0.028,
    forcedFactoringFeeRate: 0.07,
    placementAnnualRate: 0.02,
  },
  // structure ≈ 310 000 €/tour : 268 000 décaissés (salaires des chauffeurs et
  // de l'exploitation, loyers, assurances, taxe à l'essieu) + 42 000
  // d'amortissements de la flotte
  fixedCostsPerRound: 268000,
  suppliers: [
    {
      code: "carte_reseau",
      name: "Carte carburant réseau",
      narrative:
        "Le réseau d'autoroute, disponible partout, réglé à quinze jours. Cher au litre, mais un chauffeur ne cherche jamais où faire le plein.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 15,
      supplyRiskProbability: 0.03,
      supplyRiskAvailabilityHit: 0.95,
    },
    {
      code: "cuve_depot",
      name: "Cuve au dépôt",
      narrative:
        "Vous achetez en gros et vous stockez, payé comptant à la livraison. Le litre est bien moins cher, mais les tournées doivent repasser par le dépôt.",
      costMultiplier: 0.88,
      qualityBonus: -0.05,
      paymentDelayDays: 0,
      supplyRiskProbability: 0.11,
      supplyRiskAvailabilityHit: 0.82,
    },
    {
      code: "contrat_constructeur",
      name: "Contrat constructeur tout compris",
      narrative:
        "Carburant, entretien et véhicule de remplacement dans un seul contrat, réglé à trente jours. Plus cher, mais un camion en panne est remplacé le lendemain.",
      costMultiplier: 1.15,
      qualityBonus: 0.14,
      paymentDelayDays: 30,
      supplyRiskProbability: 0.02,
      supplyRiskAvailabilityHit: 0.97,
    },
  ],
  insurance: {
    premiumPerRound: 9800,
    coveredEventCodes: ["transport_accident"],
    formulas: [
      {
        code: "basic",
        name: "Responsabilité civile et marchandise transportée",
        premiumPerRound: 9800,
        coveredEventCodes: ["transport_accident"],
      },
      {
        code: "extended",
        name: "RC, marchandise et bris de véhicule",
        premiumPerRound: 15600,
        coveredEventCodes: ["transport_accident", "transport_panne_flotte"],
      },
      {
        code: "premium",
        name: "Flotte tous risques et perte d'exploitation",
        premiumPerRound: 24500,
        coveredEventCodes: [
          "transport_accident",
          "transport_panne_flotte",
          "transport_vol_remorque",
        ],
      },
    ],
  },
  investment: {
    // un porteur supplémentaire : ~62 € par palette de capacité trimestrielle
    costPerCapacityUnit: 62,
    depreciationRounds: 24,
    maxPerRound: 4000,
  },
  studies: {
    marketCost: 2400,
    priceCost: 1800,
    financeCost: 1400,
    projectCost: 2000,
  },
  orderOffers: [
    {
      code: "transport_offer_plateforme",
      title: "Plateforme logistique · navettes quotidiennes",
      narrative:
        "Une plateforme cherche un transporteur pour ses navettes du matin, tous les jours ouvrés. Le volume est régulier et il remplit vos retours à vide, mais le prix est celui d'un appel d'offres.",
      units: 5400,
      price: 61,
      paymentDelayDays: 45,
    },
    {
      code: "transport_offer_industriel",
      title: "Industriel · lots complets sous contrat",
      narrative:
        "Un site de production vous confie ses expéditions sortantes. Beau tarif, marchandise fragile, et une pénalité pour chaque livraison en retard.",
      units: 3200,
      price: 88,
      paymentDelayDays: 60,
    },
    {
      code: "transport_offer_bourse",
      title: "Bourse de fret · lots du jour",
      narrative:
        "La bourse propose de quoi remplir vos retours, payé sous quarante-huit heures. Le prix est celui du jour, et il ne se négocie pas.",
      units: 4600,
      price: 52,
      paymentDelayDays: 0,
    },
    {
      code: "transport_offer_ecommerce",
      title: "Pic de fin d'année d'un e-commerçant",
      narrative:
        "Un e-commerçant explose ses volumes sur deux mois et cherche de la capacité tout de suite. Il paie vite parce qu'il n'a pas le choix, mais il saturera vos quais.",
      units: 6800,
      price: 71,
      paymentDelayDays: 30,
    },
    {
      code: "transport_offer_chantier",
      title: "Approvisionnement d'un grand chantier",
      narrative:
        "Un chantier réclame des livraisons calées à l'heure près sur son planning de grue. Tarif confortable, contrainte horaire totale, et un maître d'ouvrage qui mandate lentement.",
      units: 1900,
      price: 104,
      paymentDelayDays: 90,
    },
    {
      code: "transport_offer_frigorifique",
      title: "Tournée sous température dirigée",
      narrative:
        "Un grossiste alimentaire cherche du froid pour ses tournées du week-end. Le meilleur prix à la palette de votre carnet, à condition que la chaîne ne soit jamais rompue.",
      units: 2100,
      price: 118,
      paymentDelayDays: 45,
    },
  ],
  hr: {
    salaryPerEmployeePerRound: 8800,
    includedHeadcount: 18,
    hiringCost: 2800,
    firingCost: 6200,
    trainingScale: 3200,
    trainingSensitivity: 0.06,
    maxProductivity: 1.22,
    moraleSensitivity: 0.75,
    // les chauffeurs manquent : ils partent au premier euro de mieux
    attritionThreshold: 0.98,
    maxHiresPerRound: 4,
    maxHeadcount: 30,
  },
  events: [
    {
      code: "transport_gazole",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.18 }],
    },
    {
      code: "transport_penurie_chauffeurs",
      scope: "market",
      probability: 0.06,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 0.86 }],
    },
    {
      code: "transport_pic_ecommerce",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand:distribution", op: "mul", value: 1.35 }],
    },
    {
      code: "transport_blocage_routier",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.78 }],
    },
    {
      code: "transport_relocalisation",
      scope: "market",
      probability: 0.04,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "demand:industriels", op: "mul", value: 1.22 }],
    },
    {
      code: "transport_guerre_des_prix",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand:affretement", op: "mul", value: 0.75 }],
    },
    {
      code: "transport_credit_resserre",
      scope: "market",
      probability: 0.04,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    // Cartes « équipe » et cartes enseignant : jamais tirées par le PRNG.
    // APPENDRE en fin de liste (le PRNG consomme un tirage par événement).
    {
      code: "transport_accident",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [
        { target: "availability", op: "mul", value: 0.76 },
        { target: "material_cost", op: "mul", value: 1.12 },
      ],
    },
    {
      code: "transport_panne_flotte",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.72 }],
    },
    {
      code: "transport_vol_remorque",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.8 }],
    },
    {
      code: "transport_label_qualite",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 1.07 }],
    },
    {
      code: "transport_banque_conciliante",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "transport_lot_surprise",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 1400 }],
    },
  ],
  // Le gazole prend dix-huit pour cent au tour 3, en plein creux d'été : les
  // charges montent quand les camions roulent le moins.
  scriptedEvents: [{ round: 3, eventCode: "transport_gazole" }],
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
      operatingIncome: { min: -120000, target: 70000 },
      revenue: { min: 520000, target: 950000 },
      netTreasury: { min: -180000, target: 60000 },
      returnOnEquity: { min: -0.12, target: 0.08 },
      marketShareTarget: 0.22,
      utilizationTarget: 0.82,
    },
  },
} satisfies EngineScenarioConfig;

export const transportScenario: EngineScenarioConfig = parseScenarioConfig(rawTransport);

/**
 * État initial de ROUTE & CIE. Le bilan d'un transporteur : la flotte écrase
 * tout, elle est financée à crédit, et le poste clients pèse presque autant
 * que le chiffre d'affaires d'un trimestre. Aucun stock : on ne stocke pas
 * des places dans un camion qui roule.
 */
export function transportCompany(
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
    // douze porteurs et leurs remorques : 16 000 palettes par trimestre
    machineCapacity: 16000,
    availability: 1,
    headcount: 18,
    hoursPerEmployee: 455,
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    // crédit de flotte : 780 000 € sur 24 trimestres → 32 500 €/tour
    loans: [{ remaining: 780000, perRound: 32500 }],
    finance: {
      fixedAssetsNet: 1150000,
      inventoryValue: 0,
      receivables: 420000,
      cash: 38000,
      equity: 696000,
      financialDebt: 780000,
      payables: 132000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les transporteurs concurrents de la région. */
export const transportBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "trans-eclair", name: "Trans'Éclair", profile: "price_aggressive" },
  { id: "logistica", name: "Logistica", profile: "premium" },
  { id: "roulages-du-nord", name: "Roulages du Nord", profile: "balanced" },
  { id: "cap-fret", name: "Cap Fret", profile: "growth" },
  { id: "transports-bellec", name: "Transports Bellec", profile: "passive" },
  { id: "via-directe", name: "Via Directe", profile: "premium" },
  { id: "fret-express", name: "Fret Express", profile: "price_aggressive" },
];
