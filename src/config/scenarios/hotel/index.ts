import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario HÔTEL — « L'ESCALE », hôtel 3 étoiles de 60 chambres en ville
 * moyenne, 6 tours trimestriels.
 *
 * Ce que le secteur apporte de propre à l'hôtellerie :
 * - la chambre vide de ce soir ne se rattrape JAMAIS. C'est l'activité
 *   périssable par excellence : la capacité non vendue est perdue, pas
 *   stockée (drapeau `perishable`) ;
 * - d'où le yield management : mieux vaut brader une chambre que la
 *   laisser vide, tant que le prix couvre le coût variable (21 € ici) ;
 * - des charges de structure ÉCRASANTES (158 000 €/tour) face à une marge
 *   unitaire élevée (74 €) : sous le seuil, l'hôtel saigne quel que soit le
 *   soin apporté au service ; au-dessus, chaque nuitée tombe presque
 *   entière en résultat ;
 * - la commission des plateformes de réservation ronge la marge à chaque
 *   nuitée vendue par leur intermédiaire.
 *
 * Calibration (base trimestrielle) : 60 chambres × 90 nuits = 5 400 nuitées
 * offertes ; prix moyen 95 €, coût variable 21 € → marge 74 €/nuitée ;
 * 158 000 € de structure décaissée → seuil ≈ 2 140 nuitées (40 % d'occupation),
 * et ~2 800 (52 %) une fois marketing et entretien financés.
 */
const rawHotel = {
  code: "hotel",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  // La nuitée invendue est perdue : rien ne se reporte au tour suivant.
  perishable: true,
  market: {
    segments: [
      {
        code: "affaires",
        name: "Clientèle affaires (semaine, note de frais)",
        size: 3300,
        growth: 0.03,
        // la note de frais regarde peu le prix, mais l'entreprise plafonne
        priceElasticity: -0.7,
        refPrice: 115,
        minAcceptablePrice: 62,
        psychThresholds: [{ threshold: 120, penalty: 0.88 }],
        marketingSensitivity: 0.08,
        qualitySensitivity: 0.45,
        loyalty: 0.5,
        priceEffectBounds: { min: 0.35, max: 2.2 },
        // les entreprises règlent à 30 jours sur facture centralisée
        paymentDelayDays: 30,
        // l'activité affaires s'effondre en plein été
        seasonality: [1.1, 1.15, 0.5, 1.05, 1.1, 1.15],
      },
      {
        code: "loisirs",
        name: "Tourisme loisirs (week-ends et vacances)",
        size: 5000,
        growth: 0.05,
        priceElasticity: -1.75,
        refPrice: 88,
        minAcceptablePrice: 45,
        psychThresholds: [{ threshold: 100, penalty: 0.92 }],
        marketingSensitivity: 0.3,
        qualitySensitivity: 0.28,
        loyalty: 0.12,
        priceEffectBounds: { min: 0.25, max: 3.2 },
        paymentDelayDays: 0,
        // le tourisme, lui, explose l'été
        seasonality: [0.6, 1.0, 2.0, 0.7, 0.6, 1.0],
      },
      {
        code: "groupes",
        name: "Groupes & séminaires (contrat négocié, 45 j)",
        size: 2700,
        growth: 0.04,
        priceElasticity: -1.5,
        refPrice: 78,
        minAcceptablePrice: 48,
        psychThresholds: [],
        marketingSensitivity: 0.1,
        qualitySensitivity: 0.3,
        loyalty: 0.45,
        priceEffectBounds: { min: 0.25, max: 2.8 },
        paymentDelayDays: 45,
        // séminaires au printemps et à l'automne, jamais en août
        seasonality: [1.2, 1.3, 0.3, 1.2, 1.2, 1.3],
      },
    ],
    seasonality: [0.8, 1.05, 1.35, 0.85, 0.8, 1.05],
    outsideAttraction: 0.5,
    competitionIntensity: 1.7,
  },
  product: {
    code: "nuitee",
    // petit-déjeuner, blanchisserie du linge, produits d'accueil
    materialCostPerUnit: 12,
    // commission de distribution (plateformes), énergie, ménage externalisé
    otherVariableCostPerUnit: 9,
    // 0,75 h de travail (étage + réception) par nuitée vendue
    hoursPerUnit: 0.75,
  },
  production: {
    // « qualité » = entretien des chambres, literie, accueil
    qualitySensitivity: 0.22,
    qualityScale: 9000,
    // la réputation d'un hôtel bouge lentement : forte inertie
    qualityInertia: 0.7,
    maintenanceReference: 9000,
    availabilityDecay: 0.06,
  },
  marketing: { scale: 16000 },
  finance: {
    loanAnnualRate: 0.042, // adossé aux murs : le taux est bas
    overdraftAnnualRate: 0.12,
    overdraftLimit: 60000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    loanDurationRounds: 40, // crédit immobilier : 10 ans
    maxCapitalIncreaseTotal: 250000,
    depreciationPerRound: 28000, // les murs et l'agencement pèsent lourd
  },
  treasury: {
    discountAnnualRate: 0.065,
    discountMaxShare: 0.6,
    factoringFeeRate: 0.022,
    forcedFactoringFeeRate: 0.055,
    // 2 %/an : de quoi valoriser le surplus, jamais de quoi financer
    // un découvert à 9 %. L'arbitrage doit rester perdant à l'envers.
    placementAnnualRate: 0.02,
  },
  // structure ≈ 186 000 €/tour : 158 000 décaissés (salaires des équipes,
  // énergie, taxe de séjour, assurances, abonnements) + 28 000 d'amortissements
  fixedCostsPerRound: 158000,
  suppliers: [
    {
      code: "integre",
      name: "Blanchisserie et petit-déjeuner intégrés",
      narrative:
        "Vous gérez tout en interne : coût maîtrisé, qualité constante, fournisseurs réglés à 30 jours.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 30,
      supplyRiskProbability: 0.03,
      supplyRiskAvailabilityHit: 0.92,
    },
    {
      code: "externalise",
      name: "Tout externalisé (prestataire discount)",
      narrative:
        "Un prestataire reprend blanchisserie et petits-déjeuners pour 15 % de moins, payable à 60 jours. Mais la qualité suit sa cadence, pas la vôtre, et les clients le notent.",
      costMultiplier: 0.85,
      qualityBonus: -0.07,
      paymentDelayDays: 60,
      supplyRiskProbability: 0.11,
      supplyRiskAvailabilityHit: 0.82,
    },
    {
      code: "terroir",
      name: "Petit-déjeuner terroir & linge premium",
      narrative:
        "Produits locaux au buffet, linge haut de gamme : 25 % plus cher, réglé comptant aux producteurs. C'est ce dont les clients parlent dans leurs avis.",
      costMultiplier: 1.25,
      qualityBonus: 0.11,
      paymentDelayDays: 0,
      supplyRiskProbability: 0.05,
      supplyRiskAvailabilityHit: 0.9,
    },
  ],
  insurance: {
    premiumPerRound: 2200,
    coveredEventCodes: ["hotel_degat_des_eaux"],
    formulas: [
      {
        code: "basic",
        name: "Multirisque hôtelière",
        premiumPerRound: 2200,
        coveredEventCodes: ["hotel_degat_des_eaux"],
      },
      {
        code: "extended",
        name: "Multirisque + perte d'exploitation",
        premiumPerRound: 4200,
        coveredEventCodes: ["hotel_degat_des_eaux", "hotel_panne_chaudiere"],
      },
      {
        code: "premium",
        name: "Tous risques établissement",
        premiumPerRound: 7000,
        coveredEventCodes: [
          "hotel_degat_des_eaux",
          "hotel_panne_chaudiere",
          "hotel_cyber_reservation",
        ],
      },
    ],
  },
  investment: {
    // rénover et rouvrir une chambre condamnée : ~9 000 € par chambre,
    // soit 100 € par nuitée de capacité trimestrielle (90 nuits)
    costPerCapacityUnit: 100,
    depreciationRounds: 40,
    maxPerRound: 900, // 10 chambres par trimestre au maximum
  },
  studies: {
    marketCost: 2600,
    priceCost: 2200,
    financeCost: 1600,
    projectCost: 2400,
  },
  orderOffers: [
    {
      code: "hotel_offer_congres",
      title: "Congrès régional de cardiologie",
      narrative:
        "Le palais des congrès vous adresse les participants de son congrès d'automne. Facturation centralisée, règlement à l'échéance du contrat.",
      units: 900,
      price: 84,
      paymentDelayDays: 60,
    },
    {
      code: "hotel_offer_tour_operateur",
      title: "Tour-opérateur · allotement",
      narrative:
        "Un tour-opérateur bloque un allotement et le paie dès la réservation. Le prix est bas, l'encaissement immédiat et l'occupation garantie.",
      units: 1200,
      price: 61,
      paymentDelayDays: 0,
    },
    {
      code: "hotel_offer_chantier",
      title: "Compagnons du chantier de la ligne TGV",
      narrative:
        "Une entreprise de travaux publics loge ses compagnons pendant le chantier de la ligne nouvelle, sur facture au siège. Longue durée, peu de ménage, aucun petit-déjeuner soigné.",
      units: 1400,
      price: 68,
      paymentDelayDays: 45,
    },
    {
      code: "hotel_offer_seminaire",
      title: "Séminaire d'entreprise clé en main",
      narrative:
        "Un groupe industriel privatise deux étages pour son séminaire : votre meilleur tarif de l'année, que la direction financière fera patienter.",
      units: 700,
      price: 112,
      paymentDelayDays: 90,
    },
    {
      code: "hotel_offer_compagnie_aerienne",
      title: "Équipages d'une compagnie aérienne",
      narrative:
        "Une compagnie cherche à loger ses équipages en escale, sous contrat cadre. Arrivées tardives, départs à l'aube, facture centralisée.",
      units: 1000,
      price: 72,
      paymentDelayDays: 60,
    },
    {
      code: "hotel_offer_plateforme_flash",
      title: "Vente flash sur plateforme",
      narrative:
        "Une plateforme vous ouvre une vente flash, encaissée presque aussitôt. Vous remplissez, au prix de votre image tarifaire.",
      units: 800,
      price: 58,
      paymentDelayDays: 0,
    },
  ],
  hr: {
    // réception, étages, petit-déjeuner, maintenance, direction
    salaryPerEmployeePerRound: 8600,
    includedHeadcount: 14,
    hiringCost: 2600,
    firingCost: 6500,
    trainingScale: 4000,
    trainingSensitivity: 0.06,
    maxProductivity: 1.3,
    moraleSensitivity: 0.6,
    attritionThreshold: 0.95,
    maxHiresPerRound: 4,
    maxHeadcount: 26,
  },
  events: [
    {
      code: "hotel_evenement_local",
      scope: "market",
      probability: 0.05,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.22 }],
    },
    {
      code: "hotel_avis_negatif",
      scope: "company",
      probability: 0.05,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 0.9 }],
    },
    {
      code: "hotel_commission_ota",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.16 }],
    },
    {
      code: "hotel_greve_transports",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand:affaires", op: "mul", value: 0.72 }],
    },
    {
      code: "hotel_panne_chaudiere",
      scope: "company",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.8 }],
    },
    {
      code: "hotel_meteo_radieuse",
      scope: "market",
      probability: 0.04,
      duration: 1,
      modifiers: [{ target: "demand:loisirs", op: "mul", value: 1.28 }],
    },
    {
      code: "hotel_energie",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.22 }],
    },
    {
      code: "hotel_credit_resserre",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.45 }],
    },
    // Cartes « équipe » et cartes enseignant : jamais tirées par le PRNG.
    // APPENDRE en fin de liste (le PRNG consomme un tirage par événement).
    {
      code: "hotel_degat_des_eaux",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [
        { target: "availability", op: "mul", value: 0.68 },
        { target: "material_cost", op: "mul", value: 1.12 },
      ],
    },
    {
      code: "hotel_cyber_reservation",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.75 }],
    },
    {
      code: "hotel_etoile_supplementaire",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 1.06 }],
    },
    {
      code: "hotel_banque_conciliante",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "hotel_groupe_impromptu",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 400 }],
    },
    {
      code: "hotel_festival",
      scope: "market",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.3 }],
    },
  ],
  // L'énergie flambe au tour 4 : la facture explose juste après la saison
  // haute, quand on croyait l'exercice sauvé.
  scriptedEvents: [{ round: 4, eventCode: "hotel_energie" }],
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
      operatingIncome: { min: -70000, target: 55000 },
      revenue: { min: 180000, target: 400000 },
      netTreasury: { min: -90000, target: 120000 },
      returnOnEquity: { min: -0.1, target: 0.05 },
      // le taux d'OCCUPATION : l'indicateur roi de l'hôtellerie
      marketShareTarget: 0.3,
      utilizationTarget: 0.72,
    },
  },
} satisfies EngineScenarioConfig;

export const hotelScenario: EngineScenarioConfig = parseScenarioConfig(rawHotel);

/**
 * État initial de L'ESCALE. Un hôtel, c'est d'abord un ACTIF LOURD financé
 * par de la dette longue : 1,45 M€ de murs et d'agencement, 900 000 € de
 * crédit immobilier. Aucun stock (rien ne se stocke), peu de créances.
 */
export function hotelCompany(
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
    // 60 chambres × 90 nuits = 5 400 nuitées offertes par trimestre
    machineCapacity: 5400,
    availability: 1,
    headcount: 14,
    hoursPerEmployee: 455,
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    // crédit immobilier : 900 000 € sur 40 trimestres → 22 500 €/tour
    loans: [{ remaining: 900000, perRound: 22500 }],
    finance: {
      fixedAssetsNet: 1450000,
      inventoryValue: 0,
      receivables: 62000,
      cash: 88000,
      equity: 660000,
      financialDebt: 900000,
      payables: 40000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les établissements concurrents de la place. */
export const hotelBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "ibis-nord", name: "Le Comptoir", profile: "price_aggressive" },
  { id: "grand-hotel", name: "Grand Hôtel Terminus", profile: "premium" },
  { id: "logis-gare", name: "Logis de la Gare", profile: "balanced" },
  { id: "cap-ouest", name: "Cap Ouest", profile: "growth" },
  { id: "villa-rose", name: "Villa Rose", profile: "passive" },
  { id: "bord-eau", name: "Bord de l'Eau", profile: "price_aggressive" },
  { id: "maison-blanche", name: "La Maison Blanche", profile: "premium" },
];
