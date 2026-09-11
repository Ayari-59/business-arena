import type {
  CompanyState,
  EngineScenarioConfig,
  ProductDef,
  SegmentConfig,
  SupplierDef,
} from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario BOUTIQUE — « MAILLE & CO », marque de vêtements en maille,
 * 6 tours trimestriels. Le PREMIER secteur à GAMME du jeu.
 *
 * Maille & Co dessine sa collection et la fait tricoter par des façonniers,
 * puis la vend dans sa boutique de centre-ville et à des comités
 * d'entreprise : on n'y fabrique rien soi-même, on ACHÈTE des pièces
 * confectionnées pour les revendre. Ce que le commerce apporte de propre :
 * - la marge se joue au coefficient multiplicateur, pas à l'atelier ;
 * - le stock est un ACTIF qui dort — la boutique ouvre avec 1 110 pièces en
 *   réserve, donc du BFR dès le tour 1 ;
 * - la saisonnalité est brutale et DIFFÉRENTE d'une référence à l'autre : la
 *   maille se vend l'hiver, les accessoires font plus du double à Noël, le
 *   cardigan lisse la courbe ;
 * - les trois façonniers opposent frontalement prix d'achat, image et délai
 *   de règlement.
 *
 * Ce que la GAMME apporte : le MIX. Le bonnet fait du volume, le pull mérinos
 * fait la marge ; cinq références se disputent la même réserve (7 500 pièces
 * de capacité de traitement par trimestre) au moment du réassort de Noël ; et
 * chaque référence a SON marché — ses segments, sa concurrence.
 *
 * Calibration (base trimestrielle, mix de référence, 4 400 pièces) :
 *   pull col rond      59 € · achat 25 €   + 3,50 € · MCV 30,50 € · 1 500
 *   cardigan           79 € · achat 34 €   + 4 €    · MCV 41 €    ·   700
 *   pull mérinos      129 € · achat 56 €   + 5 €    · MCV 68 €    ·   350
 *   écharpe            35 € · achat 14 €   + 2 €    · MCV 19 €    · 1 000
 *   bonnet             25 € · achat 9,50 € + 1,50 € · MCV 14 €    ·   850
 * CA ≈ 245 000 €, MCV ≈ 129 000 €, 84 000 € de charges de structure décaissées
 * + 4 500 € d'amortissements → résultat d'exploitation ≈ 40 000 € ; MCV
 * moyenne 29,35 € → seuil (84 000 ÷ 29,35) ≈ 2 862 pièces à mix constant. Les concurrents
 * s'alignent sur le prix des passants (55 € le pull) : à ce prix, la marge
 * unitaire tombe à 26,50 € et le seuil monte vers 3 300 pièces.
 */

// --- Les trois clientèles du commerce, déclinées par référence ------------
//
// Chaque référence a SON marché, donc ses propres segments (codes uniques
// sur la gamme : parts de marché et demandes sont indexées par code). Les
// trois archétypes gardent d'une référence à l'autre la même psychologie :
// les fidèles arbitrent sur la qualité, les passants sur le prix, les
// comités d'entreprise achètent au volume et règlent à 45 jours.

type SegmentOver = Pick<SegmentConfig, "code" | "name" | "size" | "refPrice"> &
  Partial<SegmentConfig>;

/** Clientes fidèles : peu sensibles au prix, très sensibles à la qualité. */
const fideles = (s: SegmentOver): SegmentConfig => ({
  growth: 0.02,
  priceElasticity: -0.9,
  minAcceptablePrice: Math.round(s.refPrice * 0.58),
  psychThresholds: [{ threshold: Math.round(s.refPrice * 1.5), penalty: 0.92 }],
  marketingSensitivity: 0.1,
  qualitySensitivity: 0.35,
  loyalty: 0.45,
  priceEffectBounds: { min: 0.35, max: 2.4 },
  paymentDelayDays: 0,
  ...s,
});

/** Passants : très sensibles au prix, aux seuils psychologiques et à l'animation. */
const passage = (s: SegmentOver & { seuils: [number, number] }): SegmentConfig => {
  const { seuils, ...rest } = s;
  return {
    growth: 0.05,
    priceElasticity: -2.1,
    minAcceptablePrice: Math.round(s.refPrice * 0.52),
    psychThresholds: [
      { threshold: seuils[0], penalty: 0.9 },
      { threshold: seuils[1], penalty: 0.94 },
    ],
    marketingSensitivity: 0.28,
    qualitySensitivity: 0.12,
    loyalty: 0.08,
    priceEffectBounds: { min: 0.15, max: 4 },
    paymentDelayDays: 0,
    ...rest,
  };
};

/** Comités d'entreprise : achat au volume, règlement à 45 jours, budget de fin d'année. */
const entreprises = (s: SegmentOver): SegmentConfig => ({
  growth: 0.06,
  priceElasticity: -1.3,
  minAcceptablePrice: Math.round(s.refPrice * 0.6),
  psychThresholds: [],
  marketingSensitivity: 0.06,
  qualitySensitivity: 0.25,
  loyalty: 0.4,
  priceEffectBounds: { min: 0.3, max: 2.6 },
  paymentDelayDays: 45,
  // les CE commandent pour les fêtes : le gros de leur budget part au T4
  seasonality: [0.6, 0.8, 0.9, 1.9, 0.6, 0.8],
  ...s,
});

// --- La gamme ------------------------------------------------------------

/**
 * Le marché du pull col rond, cœur de gamme. C'est aussi le marché « du
 * scénario » (`market`) : celui que lisent les affichages mono-produit, les
 * bots pour leur prix de référence et les gardes de calibration. Le moteur,
 * lui, ne simule que les marchés des produits.
 */
const PULL_MARKET = {
  segments: [
    fideles({ code: "pull_fideles", name: "Clientes fidèles · pull col rond", size: 2200, refPrice: 62 }),
    passage({
      code: "pull_passage",
      name: "Passants · pull col rond",
      size: 4000,
      refPrice: 55,
      seuils: [50, 60],
    }),
    entreprises({ code: "pull_ce", name: "Comités d'entreprise · pull col rond", size: 1300, refPrice: 58 }),
  ],
  // La maille se vend l'hiver : Noël vaut une fois et demie un trimestre
  // ordinaire, l'été en vaut à peine les deux tiers.
  seasonality: [1.0, 0.7, 1.0, 1.5, 1.0, 0.7],
  outsideAttraction: 0.6,
  competitionIntensity: 1.8,
};

// ---------------------------------------------------------------------------
// LES FAÇONNIERS. Le tricoteur du mérinos n'est pas celui des bonnets : chaque
// référence a son catalogue, et le premier de chaque catalogue est son
// façonnier de référence (coût ×1, celui des textes). Les multiplicateurs
// s'appliquent au coût d'achat de LA référence.
// ---------------------------------------------------------------------------
const FACONNIER_REFERENCE: SupplierDef = {
  code: "grossiste",
  name: "Façonnier de référence",
  narrative:
    "Le tricoteur historique de la marque : qualité constante, réassort en six semaines, règlement à 45 jours. Aucune surprise, aucune envolée.",
  costMultiplier: 1,
  qualityBonus: 0,
  paymentDelayDays: 45,
  supplyRiskProbability: 0.03,
  supplyRiskAvailabilityHit: 0.9,
};
const DESTOCKEUR_PULLS: SupplierDef = {
  code: "destockeur",
  name: "Fins de série d'un tricoteur portugais",
  narrative:
    "Des fins de série à −18 % sur le prix d'achat, mais payées comptant à l'enlèvement et sans garantie de réassort : ce qui part est parti.",
  costMultiplier: 0.82,
  qualityBonus: -0.06,
  paymentDelayDays: 0,
  supplyRiskProbability: 0.12,
  supplyRiskAvailabilityHit: 0.78,
};
const ATELIER_LOCAL: SupplierDef = {
  code: "createur",
  name: "Atelier de tricotage local",
  narrative:
    "Des pièces tricotées à trente kilomètres, étiquetées « fabriqué en France », payées 22 % plus cher et réglées à 30 jours. Elles font la réputation de la marque et la fidélité des clientes.",
  costMultiplier: 1.22,
  qualityBonus: 0.09,
  paymentDelayDays: 30,
  supplyRiskProbability: 0.05,
  supplyRiskAvailabilityHit: 0.88,
};
const FILATURE_MERINOS: SupplierDef = {
  code: "filature",
  name: "Filature mérinos italienne",
  narrative:
    "Le mérinos extra-fin d'une filature de Biella, tricoté sur place : 15 % plus cher, réglé à 30 jours, et la pièce que les clientes fidèles reconnaissent au toucher.",
  costMultiplier: 1.15,
  qualityBonus: 0.12,
  paymentDelayDays: 30,
  supplyRiskProbability: 0.04,
  supplyRiskAvailabilityHit: 0.85,
};
const TRICOTEUR_ACCESSOIRES: SupplierDef = {
  code: "accessoiriste",
  name: "Tricoteur d'accessoires du Nord",
  narrative:
    "Un atelier spécialisé dans les bonnets et les écharpes, en grande série : 10 % moins cher, réglé à 30 jours, une maille un peu plus lâche et un carnet de commandes qui déborde avant Noël.",
  costMultiplier: 0.9,
  qualityBonus: -0.02,
  paymentDelayDays: 30,
  supplyRiskProbability: 0.08,
  supplyRiskAvailabilityHit: 0.85,
};
const DESTOCKEUR_ACCESSOIRES: SupplierDef = {
  code: "destockeur",
  name: "Fins de série d'accessoires",
  narrative:
    "Des lots de bonnets et d'écharpes de la saison passée à −22 %, payés comptant, aux coloris qu'il reste : pour le volume de Noël, pas pour la vitrine.",
  costMultiplier: 0.78,
  qualityBonus: -0.08,
  paymentDelayDays: 0,
  supplyRiskProbability: 0.15,
  supplyRiskAvailabilityHit: 0.75,
};

/** Le catalogue des pulls et cardigans : celui des affichages mono-produit. */
const FACONNIERS_PULLS: SupplierDef[] = [FACONNIER_REFERENCE, DESTOCKEUR_PULLS, ATELIER_LOCAL];
const FACONNIERS_MERINOS: SupplierDef[] = [FACONNIER_REFERENCE, FILATURE_MERINOS, ATELIER_LOCAL];
const FACONNIERS_ACCESSOIRES: SupplierDef[] = [FACONNIER_REFERENCE, TRICOTEUR_ACCESSOIRES, DESTOCKEUR_ACCESSOIRES];

const GAMME: ProductDef[] = [
  {
    code: "pull-col-rond",
    name: "Pull col rond",
    // coût d'achat au façonnier : le nerf du commerce (coefficient ≈ 2,4)
    materialCostPerUnit: 25,
    // sacs, cintres, commissions carte bancaire, logistique retour
    otherVariableCostPerUnit: 3.5,
    hoursPerUnit: 0.12,
    market: PULL_MARKET,
    suppliers: FACONNIERS_PULLS,
  },
  {
    code: "cardigan",
    name: "Cardigan boutonné",
    materialCostPerUnit: 34,
    otherVariableCostPerUnit: 4,
    hoursPerUnit: 0.15,
    suppliers: FACONNIERS_PULLS,
    market: {
      segments: [
        fideles({ code: "cardigan_fideles", name: "Clientes fidèles · cardigan", size: 1500, refPrice: 84 }),
        passage({
          code: "cardigan_passage",
          name: "Passants · cardigan",
          size: 1800,
          refPrice: 74,
          seuils: [70, 80],
        }),
      ],
      // la pièce de mi-saison : elle lisse la courbe de la boutique
      seasonality: [1.1, 0.9, 1.2, 1.1, 1.1, 0.9],
    },
  },
  {
    code: "pull-merinos",
    name: "Pull mérinos premium",
    materialCostPerUnit: 56,
    otherVariableCostPerUnit: 5,
    hoursPerUnit: 0.2,
    // Pas de fins de série sur le premium : on le fait tricoter, on ne le déstocke pas.
    suppliers: FACONNIERS_MERINOS,
    market: {
      segments: [
        fideles({
          code: "merinos_fideles",
          name: "Clientes fidèles · pull mérinos",
          size: 900,
          refPrice: 135,
          priceElasticity: -0.7,
          qualitySensitivity: 0.45,
        }),
        entreprises({
          code: "merinos_affaires",
          name: "Cadeaux d'affaires · pull mérinos (règlement à 60 j)",
          size: 800,
          refPrice: 125,
          priceElasticity: -1.0,
          qualitySensitivity: 0.4,
          loyalty: 0.3,
          paymentDelayDays: 60,
          seasonality: [0.5, 0.4, 0.9, 2.2, 0.5, 0.4],
        }),
      ],
      // la pièce de fête : elle fait la marge, à Noël surtout
      seasonality: [0.9, 0.6, 1.0, 1.7, 0.9, 0.6],
      competitionIntensity: 1.5,
    },
  },
  {
    code: "echarpe",
    name: "Écharpe",
    materialCostPerUnit: 14,
    otherVariableCostPerUnit: 2,
    hoursPerUnit: 0.06,
    suppliers: FACONNIERS_ACCESSOIRES,
    market: {
      segments: [
        passage({
          code: "echarpe_passage",
          name: "Passants · écharpe",
          size: 3300,
          refPrice: 36,
          seuils: [30, 40],
        }),
        entreprises({
          code: "echarpe_ce",
          name: "Comités d'entreprise · écharpe (dotations de Noël)",
          size: 1700,
          refPrice: 33,
          seasonality: [0.4, 0.3, 0.8, 2.5, 0.4, 0.3],
        }),
      ],
      // l'accessoire de Noël : plus du double au T4, presque rien l'été
      seasonality: [0.9, 0.3, 0.9, 2.1, 0.9, 0.3],
      competitionIntensity: 2.0,
    },
  },
  {
    code: "bonnet",
    name: "Bonnet",
    materialCostPerUnit: 9.5,
    otherVariableCostPerUnit: 1.5,
    hoursPerUnit: 0.05,
    suppliers: FACONNIERS_ACCESSOIRES,
    market: {
      segments: [
        passage({
          code: "bonnet_passage",
          name: "Passants · bonnet",
          size: 3000,
          refPrice: 26,
          seuils: [20, 30],
        }),
        entreprises({
          code: "bonnet_ce",
          name: "Comités d'entreprise · bonnet (dotations de Noël)",
          size: 1500,
          refPrice: 24,
          seasonality: [0.4, 0.3, 0.8, 2.5, 0.4, 0.3],
        }),
      ],
      seasonality: [0.9, 0.2, 0.8, 2.3, 0.9, 0.2],
      competitionIntensity: 2.0,
    },
  },
];

const rawBoutique = {
  code: "boutique",
  version: "0.2.0",
  roundsCount: 6,
  roundDays: 90,
  market: PULL_MARKET,
  // Le produit « de référence » des affichages mono-produit : le cœur de gamme.
  product: {
    code: "pull-col-rond",
    materialCostPerUnit: 25,
    otherVariableCostPerUnit: 3.5,
    hoursPerUnit: 0.12,
  },
  products: GAMME,
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
    // Le plan de trésorerie déposé avec les décisions est la pièce que lit
    // la banque : sans lui, pas d'emprunt, et la fiabilité des plans passés
    // fixe le plafond de découvert consenti et son taux. Un prévisionnel qui
    // ne change rien n'apprend pas à en faire un.
    bank: { memory: 0.6, maxOverdraftSpread: 0.05, minOverdraftShare: 0.4 },
    taxRate: 0.25,
    // le commerce paie ses façonniers à 45 jours (usage de la profession)
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
    // 2 %/an : de quoi valoriser le surplus, jamais de quoi financer
    // un découvert à 13 %. L'arbitrage doit rester perdant à l'envers.
    placementAnnualRate: 0.02,
  },
  // structure ≈ 88 500 €/tour : 84 000 décaissés (loyer, salaires, énergie,
  // assurances, honoraires) + 4 500 d'amortissements de l'agencement
  fixedCostsPerRound: 84000,
  suppliers: [
    {
      code: "grossiste",
      name: "Façonnier de référence",
      narrative:
        "Le tricoteur historique de la marque : qualité constante, réassort en six semaines, règlement à 45 jours. Aucune surprise, aucune envolée.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 45,
      supplyRiskProbability: 0.03,
      supplyRiskAvailabilityHit: 0.9,
    },
    {
      code: "destockeur",
      name: "Fins de série d'un tricoteur portugais",
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
      name: "Atelier de tricotage local",
      narrative:
        "Des pièces tricotées à trente kilomètres, étiquetées « fabriqué en France », payées 22 % plus cher et réglées à 30 jours. Elles font la réputation de la marque et la fidélité des clientes.",
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
        premiumPerRound: 2200,
        coveredEventCodes: ["boutique_degat_des_eaux", "boutique_rupture_appro", "boutique_major_breakdown"],
      },
      {
        code: "premium",
        name: "Tous risques commerce connecté",
        premiumPerRound: 3800,
        coveredEventCodes: [
          "boutique_degat_des_eaux",
          "boutique_rupture_appro",
          "boutique_demarque",
          "boutique_major_breakdown",
          "boutique_tech_obsolescence",
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
  // Équipements typés : 3 niveaux de mobilier et de logistique de magasin.
  // Capacité initiale = 1 × 1 500 + 1 × 2 500 + 1 × 3 500 = 7 500 pièces.
  equipment: {
    types: [
      {
        code: "rayonnage_simple",
        name: "Rayonnage simple",
        capacityPerUnit: 1500,
        costPerUnit: 16000,
        depreciationRounds: 16,
        maintenanceMultiplier: 1.3,
        maxPerRound: 4,
        resaleRatio: 0.4,
      },
      {
        code: "gondoles_optimisees",
        name: "Gondoles optimisées",
        capacityPerUnit: 2500,
        costPerUnit: 35000,
        depreciationRounds: 20,
        maintenanceMultiplier: 1.0,
        maxPerRound: 2,
        resaleRatio: 0.5,
      },
      {
        code: "stock_automatise",
        name: "Stock automatisé",
        capacityPerUnit: 3500,
        costPerUnit: 58000,
        depreciationRounds: 24,
        maintenanceMultiplier: 0.7,
        maxPerRound: 1,
        resaleRatio: 0.55,
      },
    ],
    initialFleet: [
      { typeCode: "rayonnage_simple", count: 1 },
      { typeCode: "gondoles_optimisees", count: 1 },
      { typeCode: "stock_automatise", count: 1 },
    ],
  },
  studies: {
    marketCost: 1200,
    priceCost: 900,
    financeCost: 700,
    projectCost: 1000,
  },
  // Les commandes exceptionnelles portent sur le cœur de gamme, le pull col
  // rond (59 € au tarif boutique, 28,50 € de coût variable).
  orderOffers: [
    {
      code: "boutique_offer_ce_noel",
      productCode: "pull-col-rond",
      title: "Comité d'entreprise · dotation de Noël",
      narrative:
        "Le CSE d'une clinique privée veut offrir un pull à chacun de ses salariés pour les fêtes. Belle commande, mais mandat administratif : vous serez payés au rythme de la comptabilité publique.",
      units: 600,
      price: 52,
      paymentDelayDays: 60,
    },
    {
      code: "boutique_offer_vide_dressing",
      productCode: "pull-col-rond",
      title: "Vide-dressing du centre-ville",
      narrative:
        "L'association des commerçants organise un week-end vide-dressing, encaissement immédiat en caisse. Le prix est cassé, la caisse se remplit, la marge s'efface.",
      units: 500,
      price: 38,
      paymentDelayDays: 0,
    },
    {
      code: "boutique_offer_hotel_uniformes",
      productCode: "pull-col-rond",
      title: "Groupe hôtelier · tenues d'accueil",
      narrative:
        "Un groupe hôtelier veut un pull brodé à son chiffre pour les réceptions de ses établissements. Le service achats valide vite, puis paie quand ses procédures le permettent.",
      units: 800,
      price: 54,
      paymentDelayDays: 60,
    },
    {
      code: "boutique_offer_marketplace",
      productCode: "pull-col-rond",
      title: "Marketplace · opération flash",
      narrative:
        "Une marketplace vous ouvre un créneau flash sur sa page d'accueil. Marge mince, virement quasi immédiat.",
      units: 700,
      price: 41,
      paymentDelayDays: 0,
    },
    {
      code: "boutique_offer_boutique_hotel",
      productCode: "cardigan",
      title: "Corner en boutique d'hôtel",
      narrative:
        "Un palace vous propose un corner saisonnier dans son hall : votre meilleur prix de l'année, mais réglé comme il règle tous ses fournisseurs.",
      units: 450,
      price: 74,
      paymentDelayDays: 90,
    },
    {
      code: "boutique_offer_destockage",
      productCode: "pull-col-rond",
      title: "Déstockeur · reprise de collection",
      narrative:
        "Un déstockeur reprend la fin de collection, enlèvement et paiement comptant. Vous ne gagnez presque rien, mais la réserve se vide.",
      units: 900,
      price: 33,
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
      // une influenceuse : ce sont les passants qui poussent la porte
      code: "boutique_influenceur",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 1,
      modifiers: [
        { target: "demand:pull_passage", op: "mul", value: 1.3 },
        { target: "demand:cardigan_passage", op: "mul", value: 1.3 },
        { target: "demand:echarpe_passage", op: "mul", value: 1.3 },
        { target: "demand:bonnet_passage", op: "mul", value: 1.3 },
      ],
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
      // la laine flambe : scriptée au tour 5 (voir scriptedEvents)
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
      // fête des mères anticipée : les fidèles arrivent avec une liste
      code: "boutique_pretexte_fete",
      scope: "market",
      probability: 0.04,
      duration: 1,
      modifiers: [
        { target: "demand:pull_fideles", op: "mul", value: 1.22 },
        { target: "demand:cardigan_fideles", op: "mul", value: 1.22 },
        { target: "demand:merinos_fideles", op: "mul", value: 1.22 },
      ],
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
    // Événements machines (§ équipement) : pannes, obsolescence et
    // opportunités d'équipement. APPENDRE en fin de liste (PRNG).
    {
      code: "boutique_major_breakdown",
      scope: "company",
      probability: 0.03,
      minRound: 4,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 0.7 }],
    },
    {
      code: "boutique_tech_obsolescence",
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
      code: "boutique_used_equipment_deal",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 1.12 }],
    },
  ],
  // La laine flambe au tour 5 : la marge d'achat se comprime juste après Noël,
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
      revenue: { min: 95000, target: 245000 },
      netTreasury: { min: -45000, target: 55000 },
      returnOnEquity: { min: -0.1, target: 0.07 },
      marketShareTarget: 0.28,
      utilizationTarget: 0.8,
    },
  },
} satisfies EngineScenarioConfig;

export const boutiqueScenario: EngineScenarioConfig = parseScenarioConfig(rawBoutique);

/**
 * Stock d'ouverture, référence par référence, au coût variable d'achat
 * (façonnier + frais) : 1 110 pièces, 27 510 €.
 */
const OPENING_STOCK: Record<string, { quantity: number; unitCost: number }> = {
  "pull-col-rond": { quantity: 400, unitCost: 28.5 },
  cardigan: { quantity: 150, unitCost: 38 },
  "pull-merinos": { quantity: 60, unitCost: 61 },
  echarpe: { quantity: 250, unitCost: 16 },
  bonnet: { quantity: 250, unitCost: 11 },
};
const OPENING_UNITS = Object.values(OPENING_STOCK).reduce((s, l) => s + l.quantity, 0);
const OPENING_VALUE = Object.values(OPENING_STOCK).reduce(
  (s, l) => s + l.quantity * l.unitCost,
  0,
);

/**
 * État initial de la boutique. Contrairement à un industriel, un commerçant
 * OUVRE avec du stock : 1 110 pièces de la collection passée dorment en
 * réserve, et 20 000 € sont dus aux façonniers. Le BFR est là dès le premier
 * tour — c'est le point de départ de la leçon.
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
    // le lot agrégé (lecture mono-produit) et son détail par référence
    finishedGoods: { quantity: OPENING_UNITS, unitCost: OPENING_VALUE / OPENING_UNITS },
    finishedGoodsByProduct: { ...OPENING_STOCK },
    // Parc initial : 1 rayonnage (16 000 €) + 1 gondoles (35 000 €) + 1 automatisé (58 000 €) = 109 000 €
    // (amorti à ~63 % → ~69 000 € de VNC)
    fleet: [
      { typeCode: "rayonnage_simple", count: 1, acquiredRound: 0, bookValue: 9000 },
      { typeCode: "gondoles_optimisees", count: 1, acquiredRound: 0, bookValue: 22000 },
      { typeCode: "stock_automatise", count: 1, acquiredRound: 0, bookValue: 38000 },
    ],
    // emprunt d'installation : 70 000 € sur 20 trimestres → 3 500 €/tour
    loans: [{ remaining: 70000, perRound: 3500 }],
    finance: {
      fixedAssetsNet: 120000,
      inventoryValue: OPENING_VALUE, // 27 510 €
      receivables: 18000,
      cash: 22000,
      equity: 120000 + OPENING_VALUE + 18000 + 22000 - 70000 - 20000, // 97 510 €
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
