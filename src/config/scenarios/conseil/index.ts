import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario SERVICES — « ATLAS CONSEIL », cabinet de conseil et bureau
 * d'études de 12 consultants, 6 tours trimestriels.
 *
 * Ce que le secteur apporte de propre aux services intellectuels :
 * - la ressource, c'est le TEMPS des consultants, et il ne se stocke pas.
 *   Une journée non vendue est définitivement perdue : le TAUX
 *   D'OCCUPATION remplace le taux d'utilisation machine et devient le
 *   véritable pilote du résultat ;
 * - la capacité ne s'achète pas, elle se RECRUTE. Pas d'investissement
 *   capacitaire ici : pour produire plus, il faut embaucher — avec le
 *   décalage et le coût que cela suppose ;
 * - le bilan est inversé par rapport à l'industrie : presque aucun actif
 *   immobilisé, mais 180 000 € de créances clients. Le BFR d'un cabinet,
 *   c'est le délai de paiement de ses grands comptes, rien d'autre ;
 * - les charges de structure sont essentiellement des SALAIRES : elles ne
 *   baissent pas quand le carnet se vide. C'est tout le drame du métier.
 *
 * Calibration (base trimestrielle) : 12 consultants × 60 jours ouvrés =
 * 720 jours vendables ; TJM 560 €, 90 € de frais variables → 470 € de
 * marge ; 198 000 € de structure décaissée → seuil ≈ 421 jours (58 %
 * d'occupation), ~65 % une fois la prospection financée.
 */
const rawConseil = {
  code: "conseil",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  // Une journée-consultant non vendue est perdue : rien ne se reporte.
  perishable: true,
  market: {
    segments: [
      {
        code: "grands_comptes",
        name: "Grands comptes (missions longues, 60 j)",
        size: 760,
        growth: 0.04,
        // on ne choisit pas un cabinet sur son tarif à ce niveau
        priceElasticity: -0.7,
        refPrice: 780,
        minAcceptablePrice: 420,
        // sous un certain tarif, le grand compte doute de votre séniorité
        psychThresholds: [{ threshold: 900, penalty: 0.9 }],
        marketingSensitivity: 0.06,
        qualitySensitivity: 0.55,
        loyalty: 0.55,
        priceEffectBounds: { min: 0.4, max: 2 },
        paymentDelayDays: 60,
      },
      {
        code: "pme",
        name: "PME régionales (missions courtes, 30 j)",
        size: 1140,
        growth: 0.06,
        priceElasticity: -1.6,
        refPrice: 560,
        minAcceptablePrice: 300,
        psychThresholds: [{ threshold: 600, penalty: 0.9 }],
        marketingSensitivity: 0.3,
        qualitySensitivity: 0.25,
        loyalty: 0.15,
        priceEffectBounds: { min: 0.2, max: 3.6 },
        paymentDelayDays: 30,
      },
      {
        code: "public",
        name: "Secteur public (appels d'offres, 60 j)",
        size: 700,
        growth: 0.03,
        priceElasticity: -1.5,
        refPrice: 610,
        minAcceptablePrice: 340,
        psychThresholds: [],
        marketingSensitivity: 0.05,
        qualitySensitivity: 0.35,
        loyalty: 0.5,
        priceEffectBounds: { min: 0.3, max: 2.6 },
        paymentDelayDays: 60,
        // les marchés publics se notifient en début d'année civile
        seasonality: [1.5, 1.1, 0.4, 0.9, 1.5, 1.1],
      },
    ],
    // l'été, les décideurs sont en congés : le carnet se vide
    seasonality: [1.05, 1.15, 0.65, 1.15, 1.05, 1.15],
    outsideAttraction: 0.45,
    competitionIntensity: 1.6,
  },
  product: {
    code: "jour-conseil",
    // frais de mission refacturés au forfait : déplacements, hébergement
    materialCostPerUnit: 55,
    // sous-traitance d'appoint (experts indépendants) sur les pics
    otherVariableCostPerUnit: 35,
    // l'unité de capacité EST la journée : 1 jour de consultant = 1 jour vendu
    hoursPerUnit: 1,
  },
  production: {
    // « qualité » = investissement méthodologique, veille, capitalisation
    qualitySensitivity: 0.3,
    qualityScale: 12000,
    // la réputation d'un cabinet se construit lentement
    qualityInertia: 0.68,
    // « maintenance » = outillage, licences logicielles, système d'information
    maintenanceReference: 7000,
    availabilityDecay: 0.05,
  },
  marketing: { scale: 14000 },
  finance: {
    // pas d'actif à nantir : la banque prête plus cher
    loanAnnualRate: 0.065,
    overdraftAnnualRate: 0.13,
    overdraftLimit: 70000,
    // Le plan de trésorerie déposé avec les décisions est la pièce que lit
    // la banque : sans lui, pas d'emprunt, et la fiabilité des plans passés
    // fixe le plafond de découvert consenti et son taux. Un prévisionnel qui
    // ne change rien n'apprend pas à en faire un.
    bank: { memory: 0.6, maxOverdraftSpread: 0.05, minOverdraftShare: 0.4 },
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    loanDurationRounds: 20,
    maxCapitalIncreaseTotal: 150000,
    // cabinet asset-light : très peu d'amortissements
    depreciationPerRound: 6000,
  },
  treasury: {
    discountAnnualRate: 0.07,
    // le poste clients est le SEUL levier de trésorerie d'un cabinet
    discountMaxShare: 0.7,
    factoringFeeRate: 0.025,
    forcedFactoringFeeRate: 0.06,
    // 2 %/an : de quoi valoriser le surplus, jamais de quoi financer
    // un découvert à 9 %. L'arbitrage doit rester perdant à l'envers.
    placementAnnualRate: 0.02,
  },
  // structure ≈ 204 000 €/tour : 198 000 décaissés (151 200 € de salaires
  // chargés pour 12 consultants + 46 800 € de loyer, administratif et
  // licences) + 6 000 d'amortissements
  fixedCostsPerRound: 198000,
  suppliers: [
    {
      code: "integre",
      name: "Tout en interne",
      narrative:
        "Les missions sont réalisées par vos seuls consultants. Coût maîtrisé, méthode homogène, mais aucune souplesse quand le carnet déborde.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 30,
      supplyRiskProbability: 0.03,
      supplyRiskAvailabilityHit: 0.92,
    },
    {
      code: "freelances",
      name: "Réseau de freelances",
      narrative:
        "Des indépendants absorbent les pics pour 12 % de moins, payés à 45 jours. Ils connaissent moins vos méthodes, et le client le sent parfois.",
      costMultiplier: 0.88,
      qualityBonus: -0.05,
      paymentDelayDays: 45,
      supplyRiskProbability: 0.12,
      supplyRiskAvailabilityHit: 0.85,
    },
    {
      code: "experts",
      name: "Experts de renom en cotraitance",
      narrative:
        "Des signatures reconnues cosignent vos livrables : 24 % plus cher, réglés à 15 jours. Elles ouvrent les portes des grands comptes.",
      costMultiplier: 1.24,
      qualityBonus: 0.12,
      paymentDelayDays: 15,
      supplyRiskProbability: 0.05,
      supplyRiskAvailabilityHit: 0.9,
    },
  ],
  insurance: {
    premiumPerRound: 1800,
    coveredEventCodes: ["conseil_litige_client"],
    formulas: [
      {
        code: "basic",
        name: "Responsabilité civile professionnelle",
        premiumPerRound: 1800,
        coveredEventCodes: ["conseil_litige_client"],
      },
      {
        code: "extended",
        name: "RC pro + protection juridique",
        premiumPerRound: 3400,
        coveredEventCodes: ["conseil_litige_client", "conseil_depart_consultant"],
      },
      {
        code: "premium",
        name: "RC pro + cyber + perte d'exploitation",
        premiumPerRound: 5600,
        coveredEventCodes: [
          "conseil_litige_client",
          "conseil_depart_consultant",
          "conseil_cyberattaque",
        ],
      },
    ],
  },
  // PAS de bloc `investment` : dans un cabinet, la capacité ne s'achète pas,
  // elle se recrute. Le levier capacitaire est le bloc `hr`, et lui seul.
  // Équipements typés : 3 niveaux d'aménagement de poste.
  // Capacité initiale = 2 × 250 + 2 × 500 = 1 500 (identique au legacy).
  equipment: {
    types: [
      {
        code: "poste_junior",
        name: "Poste junior",
        capacityPerUnit: 250,
        costPerUnit: 8000,
        depreciationRounds: 12,
        maintenanceMultiplier: 1.3,
        maxPerRound: 4,
        resaleRatio: 0.3,
      },
      {
        code: "poste_confirme",
        name: "Poste confirmé",
        capacityPerUnit: 500,
        costPerUnit: 18000,
        depreciationRounds: 16,
        maintenanceMultiplier: 1.0,
        maxPerRound: 3,
        resaleRatio: 0.45,
      },
      {
        code: "bureau_associe",
        name: "Bureau associé",
        capacityPerUnit: 750,
        costPerUnit: 35000,
        depreciationRounds: 20,
        maintenanceMultiplier: 0.7,
        maxPerRound: 1,
        resaleRatio: 0.55,
      },
    ],
    initialFleet: [
      { typeCode: "poste_junior", count: 2 },
      { typeCode: "poste_confirme", count: 2 },
    ],
  },
  studies: {
    marketCost: 2400,
    priceCost: 2000,
    financeCost: 1500,
    projectCost: 2200,
  },
  orderOffers: [
    {
      code: "conseil_offer_transformation",
      title: "Programme de transformation · groupe industriel",
      narrative:
        "Un groupe industriel vous confie le pilotage de sa transformation. Direction achats oblige : le règlement ne partira qu'après service fait, longtemps après.",
      units: 130,
      price: 720,
      paymentDelayDays: 90,
    },
    {
      code: "conseil_offer_appel_offres",
      title: "Appel d'offres · schéma directeur d'agglomération",
      narrative:
        "La collectivité retient votre proposition pour son schéma directeur. Mandatement administratif, et des pénalités de retard si le livrable glisse.",
      units: 110,
      price: 545,
      paymentDelayDays: 60,
    },
    {
      code: "conseil_offer_due_diligence",
      title: "Due diligence pour un fonds d'investissement",
      narrative:
        "Un fonds d'investissement vous met sous pression jusqu'à la remise du rapport : votre meilleur tarif, payé comptant, mais aucun retard toléré.",
      units: 80,
      price: 890,
      paymentDelayDays: 0,
    },
    {
      code: "conseil_offer_formation",
      title: "Marché-cadre de formation",
      narrative:
        "Un OPCO référence votre catalogue dans son marché-cadre. Le tarif est bas, le volume régulier et la charge prévisible.",
      units: 150,
      price: 430,
      paymentDelayDays: 30,
    },
    {
      code: "conseil_offer_assistance",
      title: "Assistance à maîtrise d'ouvrage de longue durée",
      narrative:
        "Un établissement de santé cherche un assistant à maîtrise d'ouvrage à demeure, facturé au mois. Vos consultants seront mobilisés longtemps.",
      units: 190,
      price: 495,
      paymentDelayDays: 60,
    },
    {
      code: "conseil_offer_audit_flash",
      title: "Audit flash pour une ETI",
      narrative:
        "Une ETI veut un regard extérieur en quelques semaines, avec une équipe de deux. Court, net, encaissé à la restitution.",
      units: 60,
      price: 640,
      paymentDelayDays: 0,
    },
  ],
  hr: {
    // salaire chargé d'un consultant : ~4 200 €/mois → 12 600 €/trimestre
    salaryPerEmployeePerRound: 12600,
    includedHeadcount: 12,
    // recruter un cadre coûte cher : chasse, période d'essai, montée en charge
    hiringCost: 8000,
    firingCost: 15000,
    trainingScale: 5000,
    trainingSensitivity: 0.07,
    maxProductivity: 1.35,
    // un consultant sous-payé part chez le concurrent d'en face
    moraleSensitivity: 0.8,
    attritionThreshold: 0.97,
    maxHiresPerRound: 3,
    maxHeadcount: 24,
  },
  events: [
    {
      code: "conseil_appel_offres_gagne",
      scope: "market",
      probability: 0.05,
      duration: 1,
      modifiers: [{ target: "demand:public", op: "mul", value: 1.4 }],
    },
    {
      code: "conseil_depart_consultant",
      scope: "company",
      probability: 0.06,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 0.86 }],
    },
    {
      code: "conseil_gel_budgets",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 0.85 }],
    },
    {
      code: "conseil_recommandation",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand:grands_comptes", op: "mul", value: 1.35 }],
    },
    {
      code: "conseil_frais_mission",
      scope: "market",
      probability: 0.04,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.18 }],
    },
    {
      code: "conseil_reglementation",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 1.2 }],
    },
    {
      code: "conseil_credit_resserre",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    {
      code: "conseil_cabinet_parisien",
      scope: "market",
      probability: 0.04,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "demand:pme", op: "mul", value: 0.82 }],
    },
    // Cartes « équipe » et cartes enseignant : jamais tirées par le PRNG.
    // APPENDRE en fin de liste (le PRNG consomme un tirage par événement).
    {
      code: "conseil_litige_client",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [
        { target: "availability", op: "mul", value: 0.8 },
        { target: "material_cost", op: "mul", value: 1.15 },
      ],
    },
    {
      code: "conseil_cyberattaque",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.72 }],
    },
    {
      code: "conseil_prix_de_la_profession",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 1.07 }],
    },
    {
      code: "conseil_banque_conciliante",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "conseil_mission_urgente",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 70 }],
    },
    {
      code: "conseil_salon_professionnel",
      scope: "market",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.18 }],
    },
  ],
  // Une réglementation nouvelle au tour 4 ouvre un marché : encore faut-il
  // avoir les consultants disponibles pour le prendre.
  scriptedEvents: [{ round: 4, eventCode: "conseil_reglementation" }],
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
      operatingIncome: { min: -60000, target: 55000 },
      revenue: { min: 130000, target: 330000 },
      netTreasury: { min: -80000, target: 90000 },
      returnOnEquity: { min: -0.1, target: 0.09 },
      marketShareTarget: 0.32,
      // LE taux d'occupation : l'indicateur roi du conseil
      utilizationTarget: 0.78,
    },
  },
} satisfies EngineScenarioConfig;

export const conseilScenario: EngineScenarioConfig = parseScenarioConfig(rawConseil);

/**
 * État initial d'ATLAS CONSEIL. Le bilan d'un cabinet est l'inverse de celui
 * d'un industriel : presque rien à l'actif immobilisé, aucun stock, mais un
 * poste clients énorme (180 000 €, soit près de deux mois de chiffre
 * d'affaires) qui EST le besoin en fonds de roulement.
 */
export function conseilCompany(
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
    // plafond des locaux : ~25 consultants. La vraie contrainte est l'effectif.
    machineCapacity: 1500,
    availability: 1,
    headcount: 12,
    // 60 jours ouvrés par trimestre, et l'unité de production EST le jour
    hoursPerEmployee: 60,
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    // Parc initial : 2 juniors (16 000 €) + 2 confirmés (36 000 €) = 52 000 €
    // (amorti à ~62 % → ~32 000 € de VNC)
    fleet: [
      { typeCode: "poste_junior", count: 2, acquiredRound: 0, bookValue: 9000 },
      { typeCode: "poste_confirme", count: 2, acquiredRound: 0, bookValue: 23000 },
    ],
    // prêt d'amorçage : 70 000 € sur 20 trimestres → 3 500 €/tour
    loans: [{ remaining: 70000, perRound: 3500 }],
    finance: {
      fixedAssetsNet: 95000,
      inventoryValue: 0,
      receivables: 180000, // deux mois de CA immobilisés : le BFR du conseil
      cash: 40000,
      equity: 205000,
      financialDebt: 70000,
      payables: 40000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les cabinets concurrents de la place. */
export const conseilBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "volt-partners", name: "Volt Partners", profile: "price_aggressive" },
  { id: "meridien", name: "Méridien Stratégie", profile: "premium" },
  { id: "orme-conseil", name: "Orme Conseil", profile: "balanced" },
  { id: "kappa", name: "Kappa Advisory", profile: "growth" },
  { id: "cabinet-roux", name: "Cabinet Roux", profile: "passive" },
  { id: "nexis", name: "Nexis Consulting", profile: "price_aggressive" },
  { id: "haussmann", name: "Haussmann & Associés", profile: "premium" },
];
