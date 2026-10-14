import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";
import { evenementsDInvestissement } from "../../investissement-par-niveau";

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
 * ≈ 4 500 couverts, soit 70 par jour sur 64 jours d'ouverture : un service
 * plein chaque jour.
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
  // Non-qualité interne : plats ratés / denrées gâchées. ~2 % à qualité et
  // maintenance normales. La maintenance de la cuisine pilote aussi le rebut
  // (unidirectionnel, s = 0,15) : sous-entretenir augmente les plats ratés ;
  // bien entretenir n'apporte pas de bonus. Pas de « retour client » industriel
  // en restauration (externalReturnSensitivity = 0). Support de l'analyse
  // d'écart de rendement matière (P5 / DCG).
  qualityCosts: {
    baseDefectRate: 0.02,
    externalReturnSensitivity: 0,
    maintenanceDefectSensitivity: 0.15,
  },
  qualityActions: {
    maxConcurrentActions: 2,
    actions: [
      {
        code: "maitrise_couts_non_qualite",
        label: "Maîtrise des coûts de non-qualité",
        levels: [
          {
            level: 1,
            label: "Maîtrise des coûts N1 — suivi des gaspillages alimentaires",
            cost: 3000,
            durationRounds: 1,
            effects: { defectRateReduction: 0.10, productionCostReduction: 0.03 },
          },
          {
            level: 2,
            label: "Maîtrise des coûts N2 — tableaux de bord hebdomadaires",
            cost: 5000,
            durationRounds: 1,
            effects: { defectRateReduction: 0.08, productionCostReduction: 0.04 },
            prerequisiteLevel: 1,
          },
          {
            level: 3,
            label: "Maîtrise des coûts N3 — optimisation des commandes fournisseurs",
            cost: 7000,
            durationRounds: 1,
            effects: { defectRateReduction: 0.07, productionCostReduction: 0.05, maintenanceSaving: 500 },
            prerequisiteLevel: 2,
          },
        ],
      },
      {
        code: "amelioration_process",
        label: "Amélioration du process (cuisine)",
        levels: [
          {
            level: 1,
            label: "Process N1 — standardisation des recettes",
            cost: 4000,
            durationRounds: 1,
            effects: { defectRateReduction: 0.12, productionCostReduction: 0.02 },
          },
          {
            level: 2,
            label: "Process N2 — formation aux techniques culinaires",
            cost: 6000,
            durationRounds: 1,
            effects: { defectRateReduction: 0.10, productionCostReduction: 0.03, qualityImageBonus: 0.03 },
            prerequisiteLevel: 1,
          },
          {
            level: 3,
            label: "Process N3 — certification hygiène HACCP renforcée",
            cost: 9000,
            durationRounds: 1,
            effects: { defectRateReduction: 0.08, qualityImageBonus: 0.05, maintenanceSaving: 800 },
            prerequisiteLevel: 2,
          },
        ],
      },
      {
        code: "satisfaction_client",
        label: "Satisfaction client (service en salle)",
        levels: [
          {
            level: 1,
            label: "Satisfaction N1 — grille d'évaluation du service",
            cost: 2000,
            durationRounds: 1,
            effects: { qualityImageBonus: 0.04 },
          },
          {
            level: 2,
            label: "Satisfaction N2 — formation à l'accueil et la fidélisation",
            cost: 4000,
            durationRounds: 1,
            effects: { qualityImageBonus: 0.05, returnRateReduction: 0.10 },
            prerequisiteLevel: 1,
          },
          {
            level: 3,
            label: "Satisfaction N3 — programme de fidélité et suivi avis clients",
            cost: 6000,
            durationRounds: 1,
            effects: { qualityImageBonus: 0.06, returnRateReduction: 0.15 },
            prerequisiteLevel: 2,
          },
        ],
      },
    ],
  },
  marketing: { scale: 7000 },
  finance: {
    loanAnnualRate: 0.058,
    overdraftAnnualRate: 0.14,
    overdraftLimit: 20000,
    // Les conditions du découvert : plafond consenti et taux. Elles suivent une
    // CONFIANCE que la banque lit dans la tenue de la trésorerie : un tour clos
    // en crise ou en affacturage forcé la fait descendre (d'un pas borné, jamais
    // sous un plancher), des tours sains la regagnent — voir `finance/bank.ts`.
    // Ce bloc fixe les conditions de pleine confiance. Ce qui borne vraiment
    // l'emprunt, c'est `maxDebtToEquity`.
    bank: { memory: 0.6, maxOverdraftSpread: 0.05, minOverdraftShare: 0.4 },
    taxRate: 0.25,
    // les fournisseurs de frais ne font pas crédit longtemps
    supplierPaymentDelayDays: 21,
    loanDurationRounds: 24,
    maxCapitalIncreaseTotal: 90000,
    // La banque ne prête pas au-delà de deux fois les capitaux propres.
    maxDebtToEquity: 2,
    depreciationPerRound: 6000,
    // Conditions court terme restauration (paiement comptant majoritaire)
    discountRate: 0.085,      // 8,5 % annuel
    discountableRatio: 0.50,  // 50 % (part des clients pros / événements)
    placementRate: 0.025,     // 2,5 % annuel sur les placements
    loanCategories: {
      machines: {
        // matériel de cuisine : actif nanti, durée allongée
        maxLoanRatio: 0.80,
        durationRounds: 24,    // 6 ans (24 trimestres)
        annualRate: 0.058,
      },
      installations: {
        maxLoanRatio: 0.40,
        durationRounds: 8,
        label: "Qualité, H&S, Environnement, Maintenance, brevets",
      },
    },
  },
  treasury: {
    discountAnnualRate: 0.075,
    discountMaxShare: 0.5,
    factoringFeeRate: 0.03,
    forcedFactoringFeeRate: 0.07,
    // 2 %/an : de quoi valoriser le surplus, jamais de quoi financer
    // un découvert à 14 %. L'arbitrage doit rester perdant à l'envers.
    placementAnnualRate: 0.02,
  },
  // structure ≈ 96 000 €/tour : 90 000 décaissés (72 000 de brigade — dix
  // personnes à 2 400 € chargés par mois — et 18 000 de loyer, d'énergie,
  // d'assurances et de redevances) + 6 000 d'amortissements de la cuisine
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
        premiumPerRound: 1900,
        coveredEventCodes: ["bistrot_panne_froid", "bistrot_degat_des_eaux", "bistrot_major_breakdown"],
      },
      {
        code: "premium",
        name: "Tous risques établissement recevant du public",
        premiumPerRound: 3100,
        coveredEventCodes: [
          "bistrot_panne_froid",
          "bistrot_degat_des_eaux",
          "bistrot_fermeture_administrative",
          "bistrot_major_breakdown",
          "bistrot_tech_obsolescence",
        ],
      },
    ],
  },
  investment: {
    // couvrir et chauffer la terrasse : 48 000 € pour 1 800 couverts de plus
    // par trimestre, amortis sur douze trimestres (la situation du tour 5) →
    // 27 € par couvert de capacité, 1 800 couverts au plus par tour
    costPerCapacityUnit: 27,
    depreciationRounds: 12,
    maxPerRound: 1800,
  },
  // Équipements typés : 3 niveaux de cuisine.
  // Capacité initiale = 2 × 1 500 + 2 × 3 000 = 9 000 (identique au legacy).
  equipment: {
    types: [
      {
        code: "cuisine_traditionnelle",
        name: "Cuisine traditionnelle",
        capacityPerUnit: 1500,
        costPerUnit: 15000,
        depreciationRounds: 20,
        maintenanceMultiplier: 1.3,
        maxPerRound: 4,
        resaleRatio: 0.4,
      },
      {
        code: "cuisine_semi_pro",
        name: "Cuisine semi-professionnelle",
        capacityPerUnit: 3000,
        costPerUnit: 36000,
        depreciationRounds: 24,
        maintenanceMultiplier: 1.0,
        maxPerRound: 2,
        resaleRatio: 0.5,
      },
      {
        code: "cuisine_pro",
        name: "Cuisine professionnelle",
        capacityPerUnit: 5000,
        costPerUnit: 70000,
        depreciationRounds: 28,
        maintenanceMultiplier: 0.7,
        maxPerRound: 1,
        resaleRatio: 0.55,
      },
    ],
    initialFleet: [
      { typeCode: "cuisine_traditionnelle", count: 2 },
      { typeCode: "cuisine_semi_pro", count: 2 },
    ],
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
    // 2 400 € chargés par mois : la brigade d'un bistrot est payée au voisinage
    // du minimum, ce qui laisse à la structure de quoi payer les murs.
    salaryPerEmployeePerRound: 7200,
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
  // RSE (restauration) : sourcing local, réduction du gaspillage alimentaire,
  // bien-être du personnel. L'impact image est fort sur la clientèle de
  // quartier (soir_locaux, midi_employes). imageDemandSensitivity élevé car la
  // réputation locale se construit vite sur les engagements concrets.
  // socialAttritionRelief plus fort : la restauration souffre d'une tension
  // salariale permanente — un employeur engagé retient mieux sa brigade.
  rse: {
    imageDemandSensitivity: 0.28,
    imageInertia: 0.55,
    cleanDefectReductionMax: 0.3,
    cleanInertia: 0.7,
    financingTrustBonus: 0.1,
    socialAttritionRelief: 0.6,
    cards: {
      minRound: 2,
      labelImageThreshold: 0.65,
      labelDemandBonus: 0.2,
      labelDuration: 2,
      badBuzzImageCeiling: 0.3,
      badBuzzProbability: 0.3,
      badBuzzDemandMalus: 0.3,
      aidCleanThreshold: 0.65,
      aidAmount: 0.8,
      sanctionProbability: 0.25,
      fineAmount: 0.8,
    },
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
    // Événements machines (§ équipement) : pannes, obsolescence et
    // opportunités d'équipement. APPENDRE en fin de liste (PRNG).
    {
      code: "bistrot_major_breakdown",
      scope: "company",
      probability: 0.03,
      minRound: 4,
      duration: 2,
      modifiers: [{ target: "availability", op: "mul", value: 0.7 }],
    },
    {
      code: "bistrot_tech_obsolescence",
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
      code: "bistrot_used_equipment_deal",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 1.12 }],
    },
    {
      code: "bistrot_food_truck",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "demand:midi_affaires", op: "mul", value: 0.82 }],
    },
    {
      code: "bistrot_concurrent_etoile",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "demand:soir_locaux", op: "mul", value: 0.85 }],
    },
    {
      code: "bistrot_marche_hebdo",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 1.12 }],
    },
    {
      code: "bistrot_chef_absent",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.8 }],
    },
    {
      code: "bistrot_critique_elogieuse",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 1.1 }],
    },
    // Investissement par niveau : jamais tirés (probabilité nulle), posés par le calendrier du niveau.
    ...evenementsDInvestissement("bistrot"),
  ],
  // Le beurre, la viande et l'énergie flambent au tour 3 : le ratio matières
  // dérape en plein creux d'août, quand la salle est déjà vide.
  commercialActions: {
    maxActionsPerRound: 2,
    actions: [
      {
        id: "menu-decouverte",
        label: "Menu découverte à prix réduit",
        type: "promotion",
        isRecurring: false,
        durationRounds: 2,
        costPerRound: 1500,
        effects: { demandBonus: 0.12, loyaltyBonus: 0.04, marginImpact: -0.08, imageBonus: 0.03, newClientRatio: 0.10 },
      },
      {
        id: "carte-fidelite",
        label: "Carte de fidélité et avantages",
        type: "fidelisation",
        isRecurring: true,
        durationRounds: 1,
        costPerRound: 800,
        effects: { demandBonus: 0.05, loyaltyBonus: 0.12, marginImpact: -0.02, imageBonus: 0.02, newClientRatio: 0 },
      },
      {
        id: "evenement-chef",
        label: "Soirée thématique avec le chef",
        type: "communication",
        isRecurring: false,
        durationRounds: 1,
        costPerRound: 2000,
        effects: { demandBonus: 0.08, loyaltyBonus: 0.06, marginImpact: 0, imageBonus: 0.08, newClientRatio: 0.07 },
      },
    ],
  },
  scriptedEvents: [{ round: 3, eventCode: "bistrot_matieres_premieres" }],
  // Actions de maintenance par machine (bistrot — équipements de cuisine et de salle).
  // Pannes graves en service (four, lave-vaisselle) = impact fort sur la capacité.
  maintenanceActions: {
    types: [
      {
        code: "preventif",
        label: "Entretien préventif",
        levels: [
          {
            level: 1,
            label: "Nettoyage et contrôle",
            laborCost: 300,
            downtimeCost: 150,
            timeHoursN1: 3,
            timeHoursN2: 3,
            timeHoursN3: 2,
            wearReduction: 0.04,
            breakdownRiskReduction: 0.08,
          },
          {
            level: 2,
            label: "Révision des appareils",
            laborCost: 900,
            downtimeCost: 500,
            timeHoursN1: 6,
            timeHoursN2: 5,
            timeHoursN3: 3,
            wearReduction: 0.12,
            breakdownRiskReduction: 0.22,
          },
          {
            level: 3,
            label: "Mise à niveau complète",
            laborCost: 2200,
            downtimeCost: 1400,
            timeHoursN1: 14,
            timeHoursN2: 10,
            timeHoursN3: 7,
            wearReduction: 0.3,
            breakdownRiskReduction: 0.45,
          },
        ],
      },
      {
        code: "curatif",
        label: "Réparation urgente",
        levels: [
          {
            level: 1,
            label: "Dépannage rapide",
            laborCost: 700,
            downtimeCost: 1000,
            timeHoursN1: 5,
            timeHoursN2: 4,
            timeHoursN3: 3,
            capacityRestoration: 0.5,
            wearReduction: 0.08,
          },
          {
            level: 2,
            label: "Réparation complète",
            laborCost: 1800,
            downtimeCost: 2500,
            timeHoursN1: 10,
            timeHoursN2: 8,
            timeHoursN3: 6,
            capacityRestoration: 0.8,
            wearReduction: 0.22,
          },
          {
            level: 3,
            label: "Remplacement d'équipement",
            laborCost: 4000,
            downtimeCost: 5000,
            timeHoursN1: 18,
            timeHoursN2: 14,
            timeHoursN3: 10,
            capacityRestoration: 1.0,
            wearReduction: 0.55,
          },
        ],
      },
    ],
  },
  healthSafetyActions: {
    actions: [
      {
        code: "hygiene_cuisine",
        label: "Audit hygiène cuisine (HACCP)",
        description: "Audit complet des procédures HACCP en cuisine : températures, traçabilité, nettoyage des surfaces.",
        laborCost: 1800,
        timeHoursN1: 8,
        timeHoursN2: 6,
        timeHoursN3: 4,
        effects: {
          accidentRateReduction: 0.12,
          defectReduction: 0.04,
          hrImageBonus: 0.06,
        },
        isRecurring: true,
        durationRounds: 2,
      },
      {
        code: "formation_incendie",
        label: "Formation incendie et évacuation",
        description: "Formation du personnel aux gestes de sécurité incendie, manipulation d'extincteurs et procédures d'évacuation.",
        laborCost: 1200,
        timeHoursN1: 4,
        timeHoursN2: 4,
        timeHoursN3: 2,
        effects: {
          accidentRateReduction: 0.15,
          hrImageBonus: 0.04,
        },
      },
      {
        code: "amenagement_cuisine",
        label: "Aménagement sécurité cuisine (antidérapants, ventilation)",
        description: "Pose de revêtements antidérapants, amélioration de la ventilation et des hottes pour réduire les risques de chute et de brûlure.",
        laborCost: 2000,
        immobilizationCost: 2500,
        timeHoursN1: 12,
        timeHoursN2: 8,
        timeHoursN3: 6,
        effects: {
          attritionReduction: 0.06,
          accidentRateReduction: 0.2,
          productivityBonus: 0.03,
          hrImageBonus: 0.05,
        },
        isRecurring: true,
        durationRounds: 3,
      },
      {
        code: "formation_service",
        label: "Formation gestes et postures (service en salle)",
        description: "Formation ergonomique pour le personnel de salle : port des plateaux, gestes répétitifs, postures.",
        laborCost: 1000,
        timeHoursN1: 4,
        timeHoursN2: 4,
        timeHoursN3: 2,
        effects: {
          attritionReduction: 0.05,
          productivityBonus: 0.02,
          hrImageBonus: 0.04,
        },
      },
      {
        code: "vestiaires_personnel",
        label: "Vestiaires et salle de repos du personnel",
        description: "Réaménagement des vestiaires et création d'un espace de pause pour améliorer les conditions des employés.",
        laborCost: 1200,
        immobilizationCost: 2000,
        timeHoursN1: 4,
        timeHoursN2: 2,
        timeHoursN3: 2,
        effects: {
          attritionReduction: 0.08,
          hrImageBonus: 0.07,
          productivityBonus: 0.02,
        },
        isRecurring: true,
        durationRounds: 3,
      },
    ],
    maxActionsPerRound: 3,
  },
  trainingPrograms: {
    maxConcurrentPrograms: 2,
    programs: [
      {
        id: "formation-culinaire",
        label: "Perfectionnement culinaire",
        domaine: "technique",
        durationRounds: 3,
        costPerEmployee: 1200,
        maxEmployeesPerRound: 4,
        effects: { productivityBonus: 0.05, attritionReduction: 0.03, qualityBonus: 0.08, safetyBonus: 0.01, maintenanceSaving: 0 },
      },
      {
        id: "formation-service",
        label: "Art du service en salle",
        domaine: "commercial",
        durationRounds: 2,
        costPerEmployee: 400,
        maxEmployeesPerRound: 8,
        effects: { productivityBonus: 0.04, attritionReduction: 0.05, qualityBonus: 0.03, safetyBonus: 0, maintenanceSaving: 0 },
      },
      {
        id: "formation-hygiene",
        label: "HACCP et hygiène alimentaire",
        domaine: "rh",
        durationRounds: 1,
        costPerEmployee: 300,
        maxEmployeesPerRound: 15,
        effects: { productivityBonus: 0, attritionReduction: 0.01, qualityBonus: 0.04, safetyBonus: 0.05, maintenanceSaving: 0 },
      },
    ],
  },
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
  supplierNegotiation: {
    maxActiveContracts: 2,
    contracts: [
      { id: "contrat-matiere", label: "Contrat volume produits frais", supplierType: "matiere", volumeThreshold: 2000, discountRate: 0.06, contractDurationRounds: 3, supplyRiskReduction: 0.20 },
      { id: "contrat-energie", label: "Contrat énergie restauration", supplierType: "energie", volumeThreshold: 0, discountRate: 0.04, contractDurationRounds: 5, supplyRiskReduction: 0.05 },
    ],
  },
  capacityExpansion: {
    maxActiveOptions: 1,
    options: [
      { id: "atelier", label: "Extension salle de réception / atelier traiteur", type: "atelier", capacityBonus: 0.30, costPerRound: 8000, setupCost: 25000, minProductionLevel: 0, maxRounds: 99 },
    ],
  },
  productInnovation: {
    maxSimultaneousDev: 1,
    innovations: [
      { id: "gamme-saison", label: "Menu gastronomique saisonnier", type: "gamme", developmentRounds: 2, devCostPerRound: 5000, launchCost: 8000, effects: { priceBonus: 0.15, demandBonus: 0.12, marginBonus: 0.04, cannibalizationRate: 0.06 } },
      { id: "packaging-eco", label: "Packaging éco-responsable emporter", type: "packaging", developmentRounds: 1, devCostPerRound: 3000, launchCost: 4000, effects: { priceBonus: 0.05, demandBonus: 0.08, marginBonus: 0.01, cannibalizationRate: 0.02 } },
    ],
  },
  rseProgram: {
    carbonBudget: 600,
    actions: [
      { id: "rse-energie", label: "Économies d'énergie cuisine", category: "energie", costPerRound: 2000, implementationRounds: 2, effects: { carbonReduction: 0.10, imageBonus: 0.04, employeeSatisfaction: 0.02, energySaving: 1800 } },
      { id: "rse-fournisseurs", label: "Approvisionnement local et bio", category: "fournisseurs", costPerRound: 3000, implementationRounds: 1, effects: { carbonReduction: 0.12, imageBonus: 0.08, employeeSatisfaction: 0.03, energySaving: 0 } },
      { id: "rse-dechets", label: "Réduction gaspillage alimentaire", category: "dechets", costPerRound: 1500, implementationRounds: 2, effects: { carbonReduction: 0.15, imageBonus: 0.05, employeeSatisfaction: 0.02, energySaving: 0 } },
    ],
  },
  pricingStrategy: {
    maxActiveStrategies: 1,
    strategies: [
      { id: "ps-midi-affaires", label: "Menu affaires express midi", type: "segmentation", priceMultiplier: 1.08, demandImpact: 0.06, marginImpact: 0.05, imageImpact: 0.02, minRound: 1 },
      { id: "ps-happy-hour", label: "Happy hour et promotions soirée", type: "dynamique", priceMultiplier: 0.85, demandImpact: 0.14, marginImpact: -0.07, imageImpact: 0, minRound: 1 },
      { id: "ps-gastronomique", label: "Menu gastronomique week-end", type: "premium", priceMultiplier: 1.20, demandImpact: -0.08, marginImpact: 0.15, imageImpact: 0.10, minRound: 2 },
    ],
  },
  advancedHR: {
    maxActivePolicies: 2,
    policies: [
      { id: "hr-poly", label: "Polyvalence serveurs/cuisine", type: "carrieres", costPerRound: 1500, implementationRounds: 1, effects: { attritionReduction: 0.05, productivityBonus: 0.06, recruitmentBonus: 0.03, absenteeismReduction: 0.04 } },
      { id: "hr-horaires", label: "Aménagement des horaires en coupure", type: "bienEtre", costPerRound: 2000, implementationRounds: 1, effects: { attritionReduction: 0.10, productivityBonus: 0.02, recruitmentBonus: 0.08, absenteeismReduction: 0.06 } },
      { id: "hr-commissions", label: "Commissions sur addition", type: "salaires", costPerRound: 3500, implementationRounds: 1, effects: { attritionReduction: 0.04, productivityBonus: 0.10, recruitmentBonus: 0.05, absenteeismReduction: 0.02 } },
    ],
  },
  crisisManagement: {
    crisisEventProbability: 0.2,
    plans: [
      { id: "cm-sanitaire", label: "Protocole sanitaire renforcé", crisisType: "criseSanitaire", preparationCostPerRound: 1500, activationCost: 4000, effects: { revenueProtection: 0.70, recoverySpeedBonus: 0.30, imageProtection: 0.60 } },
      { id: "cm-mauvaise-presse", label: "Cellule communication de crise", crisisType: "rappelProduit", preparationCostPerRound: 1000, activationCost: 3000, effects: { revenueProtection: 0.50, recoverySpeedBonus: 0.20, imageProtection: 0.75 } },
      { id: "cm-approvisionnement", label: "Fournisseurs de secours", crisisType: "ruptureFournisseur", preparationCostPerRound: 2000, activationCost: 5000, effects: { revenueProtection: 0.65, recoverySpeedBonus: 0.25, imageProtection: 0.30 } },
    ],
  },
  partnerships: {
    maxActivePartnerships: 2,
    options: [
      { id: "part-livraison", label: "Partenariat plateforme livraison", type: "franchise", entryFee: 3000, royaltiesPerRound: 1500, durationRounds: 3, minRound: 1, effects: { revenueBonus: 0.10, costReduction: 0, rdBonus: 0, marketAccessBonus: 0.12 } },
      { id: "part-traiteur", label: "Prestations traiteur entreprises", type: "appelOffre", entryFee: 2000, royaltiesPerRound: 1000, durationRounds: 4, minRound: 1, effects: { revenueBonus: 0.08, costReduction: 0.02, rdBonus: 0, marketAccessBonus: 0.06 } },
      { id: "part-producteurs", label: "Circuit court producteurs locaux", type: "codeveloppement", entryFee: 1500, royaltiesPerRound: 800, durationRounds: 5, minRound: 1, effects: { revenueBonus: 0, costReduction: 0.06, rdBonus: 0, marketAccessBonus: 0.03 } },
    ],
  },
  digitalTransformation: {
    maxSimultaneousProjects: 2,
    projects: [
      { id: "dt-caisse", label: "Caisse numérique et gestion tables", type: "erp", costPerRound: 2500, implementationRounds: 1, maintenanceCostPerRound: 400, effects: { efficiencyBonus: 0.08, costReduction: 0.03, demandBonus: 0.02, errorReduction: 0.12 } },
      { id: "dt-reservations", label: "Système réservations en ligne", type: "ecommerce", costPerRound: 1800, implementationRounds: 1, maintenanceCostPerRound: 300, effects: { efficiencyBonus: 0.04, costReduction: 0, demandBonus: 0.08, errorReduction: 0.05 } },
      { id: "dt-stocks", label: "Gestion intelligente des stocks", type: "automatisation", costPerRound: 3000, implementationRounds: 2, maintenanceCostPerRound: 500, effects: { efficiencyBonus: 0.06, costReduction: 0.08, demandBonus: 0, errorReduction: 0.10 } },
    ],
  },
  brandManagement: {
    maxActionsPerRound: 2,
    actions: [
      { id: "bm-reseaux", label: "Animation réseaux sociaux locaux", type: "reputation", costPerRound: 1500, durationRounds: 3, isRecurring: true, effects: { imageBonus: 0.06, loyaltyBonus: 0.05, priceAcceptance: 0.02, crisisRecovery: 0.05 } },
      { id: "bm-guide", label: "Référencement guide gastronomique", type: "certificationLabel", costPerRound: 2500, durationRounds: 2, isRecurring: false, effects: { imageBonus: 0.12, loyaltyBonus: 0.03, priceAcceptance: 0.08, crisisRecovery: 0 } },
      { id: "bm-evenements", label: "Soirées thématiques et événements", type: "nps", costPerRound: 2000, durationRounds: 2, isRecurring: false, effects: { imageBonus: 0.05, loyaltyBonus: 0.10, priceAcceptance: 0.03, crisisRecovery: 0.04 } },
    ],
  },
  financingOptions: {
    options: [
      { id: "credit-fournisseur", label: "Crédit fournisseur", type: "creditLine", maxAmount: 30000, interestRatePerRound: 0.02, durationRounds: 3, availableFromRound: 1 },
      { id: "emprunt-travaux", label: "Emprunt travaux salle", type: "termLoan", maxAmount: 120000, interestRatePerRound: 0.011, durationRounds: 8, availableFromRound: 1 },
    ],
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
    // Parc initial : 2 traditionnelles (30 000 €) + 2 semi-pro (72 000 €) = 102 000 €
    // d'origine, dont il reste 61 % en valeur nette → ~62 000 € de VNC
    fleet: [
      { typeCode: "cuisine_traditionnelle", count: 2, acquiredRound: 0, bookValue: 16000 },
      { typeCode: "cuisine_semi_pro", count: 2, acquiredRound: 0, bookValue: 46000 },
    ],
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
