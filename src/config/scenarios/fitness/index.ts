import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario ABONNEMENT — « VOLT FITNESS », salle de sport de 1 200 m²,
 * 6 tours trimestriels.
 *
 * Ce que le secteur apporte de propre au modèle par abonnement :
 * - le client ne s'achète pas une fois, il se GARDE. Un adhérent conservé
 *   rapporte trimestre après trimestre sans rien coûter de plus ; un
 *   adhérent perdu doit être remplacé au prix fort. C'est le seul
 *   scénario où le taux d'attrition pilote le résultat ;
 * - le chiffre d'affaires est RÉCURRENT et prévisible, ce qui rend la
 *   saisonnalité d'autant plus brutale : janvier remplit la salle, l'été
 *   la vide, et les charges ne bougent pas d'un euro entre les deux ;
 * - la capacité est double : la surface accueille 2 200 adhérents, mais
 *   l'équipe ne peut en encadrer que ~2 420. Sur-vendre des abonnements
 *   dégrade l'expérience — donc la rétention. Le piège se referme seul.
 *
 * Calibration (base trimestrielle) : ~1 600 adhérents à 105 € le trimestre
 * (35 €/mois), 15 € de coût variable → 90 € de marge ; 78 000 € de
 * structure décaissée → seuil ≈ 870 adhérents, soit 40 % de la capacité.
 */
const rawFitness = {
  code: "fitness",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  // Un trimestre d'abonnement non vendu est perdu : on ne rattrape pas
  // janvier en juillet. La capacité d'accueil est périssable.
  perishable: true,
  market: {
    segments: [
      {
        code: "resolutions",
        name: "Bonnes résolutions (janvier, volatils)",
        size: 7000,
        growth: 0.04,
        // ceux-là comparent les prix de toutes les salles de la ville
        priceElasticity: -2.4,
        refPrice: 92,
        minAcceptablePrice: 45,
        psychThresholds: [
          { threshold: 90, penalty: 0.88 },
          { threshold: 120, penalty: 0.92 },
        ],
        marketingSensitivity: 0.4,
        qualitySensitivity: 0.15,
        // ils ne reviennent presque jamais : toute l'attrition est là
        loyalty: 0.05,
        priceEffectBounds: { min: 0.15, max: 4 },
        paymentDelayDays: 0,
        // le pic de janvier, et l'effondrement de l'été
        seasonality: [2.2, 0.7, 0.25, 0.9, 2.2, 0.7],
      },
      {
        code: "reguliers",
        name: "Pratiquants réguliers (base fidèle)",
        size: 5250,
        growth: 0.03,
        priceElasticity: -0.8,
        refPrice: 118,
        minAcceptablePrice: 60,
        psychThresholds: [{ threshold: 150, penalty: 0.9 }],
        marketingSensitivity: 0.08,
        qualitySensitivity: 0.55,
        // le cœur du modèle : ils restent, et ils paient toute l'année
        loyalty: 0.65,
        priceEffectBounds: { min: 0.35, max: 2.2 },
        paymentDelayDays: 0,
        seasonality: [1.1, 1.05, 0.75, 1.05, 1.1, 1.05],
      },
      {
        code: "entreprises",
        name: "Contrats entreprises (45 j)",
        size: 3000,
        growth: 0.07,
        priceElasticity: -1.3,
        refPrice: 100,
        minAcceptablePrice: 55,
        psychThresholds: [],
        marketingSensitivity: 0.06,
        qualitySensitivity: 0.35,
        loyalty: 0.6,
        priceEffectBounds: { min: 0.3, max: 2.4 },
        paymentDelayDays: 45,
        seasonality: [1.3, 1.1, 0.5, 1.2, 1.3, 1.1],
      },
    ],
    seasonality: [1.5, 0.9, 0.5, 1.0, 1.5, 0.9],
    outsideAttraction: 0.5,
    competitionIntensity: 1.8,
  },
  product: {
    code: "abonnement",
    // badge, serviettes, eau, consommables d'entretien par adhérent et par tour
    materialCostPerUnit: 6,
    // énergie liée à la fréquentation, maintenance des machines, frais bancaires
    otherVariableCostPerUnit: 9,
    // 1,5 h d'encadrement et d'accueil par adhérent et par trimestre
    hoursPerUnit: 1.5,
  },
  production: {
    // « qualité » = cours collectifs, coaching, propreté, matériel récent
    qualitySensitivity: 0.28,
    qualityScale: 7000,
    // la réputation d'une salle se construit et se défait en un trimestre
    qualityInertia: 0.5,
    // « maintenance » = entretien des machines : une salle mal tenue se vide
    maintenanceReference: 8000,
    availabilityDecay: 0.07,
  },
  marketing: { scale: 14000 },
  finance: {
    loanAnnualRate: 0.055,
    overdraftAnnualRate: 0.13,
    overdraftLimit: 40000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 30,
    loanDurationRounds: 28,
    maxCapitalIncreaseTotal: 180000,
    // le parc de machines pèse lourd et se renouvelle
    depreciationPerRound: 16000,
  },
  treasury: {
    discountAnnualRate: 0.07,
    discountMaxShare: 0.5,
    factoringFeeRate: 0.025,
    forcedFactoringFeeRate: 0.06,
  },
  // structure ≈ 94 000 €/tour : 78 000 décaissés (loyer du plateau, salaires
  // des coachs et de l'accueil, énergie, assurances) + 16 000 d'amortissements
  fixedCostsPerRound: 78000,
  suppliers: [
    {
      code: "parc_standard",
      name: "Parc machines standard",
      narrative:
        "Matériel de marque courante, contrat d'entretien inclus, réglé à 30 jours. Ce que proposent toutes les salles de la ville.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 30,
      supplyRiskProbability: 0.04,
      supplyRiskAvailabilityHit: 0.9,
    },
    {
      code: "parc_occasion",
      name: "Matériel reconditionné",
      narrative:
        "18 % de moins, payé comptant à l'enlèvement. Les machines tombent en panne plus souvent — et une machine à l'arrêt se remarque tout de suite.",
      costMultiplier: 0.82,
      qualityBonus: -0.08,
      paymentDelayDays: 0,
      supplyRiskProbability: 0.14,
      supplyRiskAvailabilityHit: 0.78,
    },
    {
      code: "parc_premium",
      name: "Matériel haut de gamme connecté",
      narrative:
        "24 % plus cher, réglé à 15 jours. Application, suivi des performances, machines silencieuses : c'est ce qui fait rester les réguliers.",
      costMultiplier: 1.24,
      qualityBonus: 0.13,
      paymentDelayDays: 15,
      supplyRiskProbability: 0.04,
      supplyRiskAvailabilityHit: 0.92,
    },
  ],
  insurance: {
    premiumPerRound: 1600,
    coveredEventCodes: ["fitness_accident"],
    formulas: [
      {
        code: "basic",
        name: "Responsabilité civile exploitant",
        premiumPerRound: 1600,
        coveredEventCodes: ["fitness_accident"],
      },
      {
        code: "extended",
        name: "RC + bris de machines",
        premiumPerRound: 3100,
        coveredEventCodes: ["fitness_accident", "fitness_panne_parc"],
      },
      {
        code: "premium",
        name: "Tous risques établissement sportif",
        premiumPerRound: 5400,
        coveredEventCodes: ["fitness_accident", "fitness_panne_parc", "fitness_degat_des_eaux"],
      },
    ],
  },
  investment: {
    // ouvrir un plateau supplémentaire : ~55 € par place d'adhérent trimestrielle
    costPerCapacityUnit: 55,
    depreciationRounds: 28,
    maxPerRound: 600,
  },
  studies: {
    marketCost: 1500,
    priceCost: 1200,
    financeCost: 900,
    projectCost: 1400,
  },
  orderOffers: [
    {
      code: "fitness_offer_comite",
      title: "Accord-cadre avec un comité d'entreprise",
      narrative:
        "Le CSE d'un hôpital ouvre l'accès à ses 2 000 agents : 350 abonnements à 82 €, facturés au CSE à 60 jours.",
      units: 350,
      price: 82,
      paymentDelayDays: 60,
    },
    {
      code: "fitness_offer_mutuelle",
      title: "Partenariat mutuelle santé",
      narrative:
        "Une mutuelle rembourse l'activité physique à ses adhérents : 500 abonnements à 74 €, réglés à 45 jours. Volume garanti, tarif négocié.",
      units: 500,
      price: 74,
      paymentDelayDays: 45,
    },
    {
      code: "fitness_offer_club_sportif",
      title: "Préparation physique d'un club",
      narrative:
        "Un club de handball loue vos créneaux du matin : 260 abonnements à 128 €, payés comptant au trimestre. Créneaux creux, tarif plein.",
      units: 260,
      price: 128,
      paymentDelayDays: 0,
    },
    {
      code: "fitness_offer_etudiants",
      title: "Campagne campus universitaire",
      narrative:
        "Le BDE négocie un tarif étudiant : 600 abonnements à 58 €, encaissés à l'inscription. Beaucoup de monde, peu de marge, et des vestiaires pleins.",
      units: 600,
      price: 58,
      paymentDelayDays: 0,
    },
    {
      code: "fitness_offer_seniors",
      title: "Programme seniors avec la mairie",
      narrative:
        "La ville finance un programme d'activité adaptée : 320 abonnements à 96 €, mandat administratif à 60 jours. Créneaux d'après-midi, public fidèle.",
      units: 320,
      price: 96,
      paymentDelayDays: 60,
    },
    {
      code: "fitness_offer_coaching",
      title: "Offre coaching premium",
      narrative:
        "Vous lancez une formule avec suivi individuel : 180 abonnements à 195 €, payés comptant. Votre meilleure marge — mais elle mobilise vos coachs.",
      units: 180,
      price: 195,
      paymentDelayDays: 0,
    },
  ],
  hr: {
    salaryPerEmployeePerRound: 7000,
    includedHeadcount: 8,
    hiringCost: 2400,
    firingCost: 5000,
    trainingScale: 2800,
    trainingSensitivity: 0.07,
    maxProductivity: 1.3,
    moraleSensitivity: 0.6,
    attritionThreshold: 0.95,
    maxHiresPerRound: 3,
    maxHeadcount: 16,
  },
  events: [
    {
      code: "fitness_rentree_sportive",
      scope: "market",
      probability: 0.05,
      duration: 1,
      modifiers: [{ target: "demand:resolutions", op: "mul", value: 1.35 }],
    },
    {
      code: "fitness_low_cost",
      scope: "market",
      probability: 0.05,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 0.84 }],
    },
    {
      code: "fitness_panne_parc",
      scope: "company",
      probability: 0.06,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.8 }],
    },
    {
      code: "fitness_coach_star",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand:reguliers", op: "mul", value: 1.3 }],
    },
    {
      code: "fitness_energie",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.28 }],
    },
    {
      code: "fitness_teletravail",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand:entreprises", op: "mul", value: 0.78 }],
    },
    {
      code: "fitness_credit_resserre",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    {
      code: "fitness_canicule",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.88 }],
    },
    // Cartes « équipe » et cartes enseignant : jamais tirées par le PRNG.
    // APPENDRE en fin de liste (le PRNG consomme un tirage par événement).
    {
      code: "fitness_accident",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [
        { target: "availability", op: "mul", value: 0.78 },
        { target: "material_cost", op: "mul", value: 1.14 },
      ],
    },
    {
      code: "fitness_degat_des_eaux",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.66 }],
    },
    {
      code: "fitness_reportage",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 1.08 }],
    },
    {
      code: "fitness_banque_conciliante",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "fitness_contrat_surprise",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 200 }],
    },
    {
      code: "fitness_marathon",
      scope: "market",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.28 }],
    },
  ],
  // L'énergie flambe au tour 3, en plein creux d'été : les charges montent
  // quand la salle est vide. Le pire moment, comme toujours.
  scriptedEvents: [{ round: 3, eventCode: "fitness_energie" }],
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
      operatingIncome: { min: -60000, target: 32000 },
      revenue: { min: 90000, target: 200000 },
      netTreasury: { min: -50000, target: 60000 },
      returnOnEquity: { min: -0.1, target: 0.07 },
      marketShareTarget: 0.28,
      utilizationTarget: 0.72,
    },
  },
} satisfies EngineScenarioConfig;

export const fitnessScenario: EngineScenarioConfig = parseScenarioConfig(rawFitness);

/**
 * État initial de VOLT FITNESS. Une salle, c'est un PARC DE MACHINES financé
 * à crédit : 640 000 € d'actif immobilisé, 420 000 € de dette. Aucun stock —
 * on ne stocke pas des abonnements — et peu de créances : les adhérents
 * paient d'avance, seuls les contrats entreprises font crédit.
 */
export function fitnessCompany(
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
    // 1 200 m² : la surface permet d'accueillir 2 200 adhérents
    machineCapacity: 2200,
    availability: 1,
    headcount: 8,
    hoursPerEmployee: 455,
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    // crédit d'équipement : 420 000 € sur 28 trimestres → 15 000 €/tour
    loans: [{ remaining: 420000, perRound: 15000 }],
    finance: {
      fixedAssetsNet: 640000,
      inventoryValue: 0,
      receivables: 24000, // uniquement les contrats entreprises
      cash: 46000,
      equity: 272000,
      financialDebt: 420000,
      payables: 18000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les salles concurrentes de l'agglomération. */
export const fitnessBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "basic-gym", name: "Basic Gym", profile: "price_aggressive" },
  { id: "studio-forme", name: "Studio Forme", profile: "premium" },
  { id: "energy-club", name: "Energy Club", profile: "balanced" },
  { id: "movefit", name: "MoveFit", profile: "growth" },
  { id: "salle-municipale", name: "Halle Municipale", profile: "passive" },
  { id: "fit24", name: "Fit24", profile: "price_aggressive" },
  { id: "atelier-corps", name: "L'Atelier du Corps", profile: "premium" },
];
