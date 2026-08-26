import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario NOVA (doc 07) — enceinte portable « NOVA One », 6 tours
 * trimestriels, niveaux DÉCOUVERTE → GESTION.
 *
 * Toutes les valeurs économiques du jeu vivent ICI (jamais dans le moteur).
 * La dramaturgie (doc 07 §2) est portée par : la saisonnalité (pic T4),
 * l'arrivée de CampusTech au tour 3 (compte-clé payé à 60 j → BFR),
 * la hausse matières scriptée au tour 5, et les événements aléatoires.
 * Les invariants de calibration (doc 07 §4) sont testés dans
 * tests/scenarios/nova.test.ts — toute retouche de ces valeurs doit
 * les laisser verts.
 */
const rawNova = {
  code: "nova",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "etudiants",
        name: "Étudiants (sensibles au prix)",
        size: 14000,
        growth: 0.06,
        priceElasticity: -2.2,
        refPrice: 59,
        minAcceptablePrice: 35,
        psychThresholds: [
          { threshold: 50, penalty: 0.9 },
          { threshold: 60, penalty: 0.93 },
        ],
        marketingSensitivity: 0.25,
        qualitySensitivity: 0.1,
        loyalty: 0.1,
        priceEffectBounds: { min: 0.15, max: 4 },
        paymentDelayDays: 0,
      },
      {
        code: "passionnes",
        name: "Passionnés (sensibles à la qualité)",
        size: 6000,
        growth: 0.03,
        priceElasticity: -0.7,
        refPrice: 79,
        minAcceptablePrice: 55,
        psychThresholds: [{ threshold: 100, penalty: 0.9 }],
        marketingSensitivity: 0.12,
        qualitySensitivity: 0.5,
        loyalty: 0.35,
        priceEffectBounds: { min: 0.3, max: 2.5 },
        paymentDelayDays: 0,
      },
      {
        code: "campustech",
        name: "CampusTech (chaîne de magasins, 80 j)",
        size: 12000,
        growth: 0.04,
        priceElasticity: -1.2,
        refPrice: 55,
        minAcceptablePrice: 40,
        psychThresholds: [],
        marketingSensitivity: 0.05,
        qualitySensitivity: 0.25,
        loyalty: 0.5,
        priceEffectBounds: { min: 0.3, max: 2.2 },
        paymentDelayDays: 80,
        // le compte-clé démarre au tour 3 et passe sa grosse commande au pic T4 (doc 07 §2)
        seasonality: [0, 0, 0.25, 1.4, 1, 1],
      },
    ],
    seasonality: [0.9, 0.95, 1.0, 1.35, 0.9, 1.0],
    outsideAttraction: 0.55,
    competitionIntensity: 1.6,
  },
  product: {
    code: "nova-one",
    materialCostPerUnit: 22,
    otherVariableCostPerUnit: 16, // MOD 11 € + énergie/divers 5 €
    hoursPerUnit: 0.3,
  },
  production: {
    qualitySensitivity: 0.15,
    qualityScale: 6000,
    qualityInertia: 0.6,
    maintenanceReference: 4000,
    availabilityDecay: 0.05,
  },
  marketing: { scale: 12000 },
  finance: {
    loanAnnualRate: 0.05,
    overdraftAnnualRate: 0.12,
    overdraftLimit: 30000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 22,
    // les emprunts se contractent sur 16 trimestres, amortissement constant
    loanDurationRounds: 16,
    // les associés suivent jusqu'à 100 000 € sur la partie — pas au-delà :
    // l'apport illimité fausserait le jeu de trésorerie
    maxCapitalIncreaseTotal: 100000,
    depreciationPerRound: 5000,
  },
  // structure totale ≈ 96 000 €/tour : 91 000 décaissés + 5 000 d'amortissements
  fixedCostsPerRound: 91000,
  // Le deck d'événements (§19) : chaque entrée est une CARTE (habillage dans
  // src/config/events/cards.ts). Probabilités faibles : 1 à 2 cartes par
  // partie en moyenne, en plus des cartes scriptées.
  events: [
    {
      code: "raw_material_spike",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.2 }],
    },
    {
      code: "machine_breakdown",
      scope: "company",
      probability: 0.05,
      minRound: 3,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.85 }],
    },
    {
      code: "viral_campaign",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.08 }],
    },
    {
      code: "competitor_bankruptcy",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 1.12 }],
    },
    {
      code: "economic_downturn",
      scope: "market",
      probability: 0.03,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 0.9 }],
    },
    {
      code: "student_fair",
      scope: "market",
      probability: 0.04,
      duration: 1,
      modifiers: [{ target: "demand:etudiants", op: "mul", value: 1.25 }],
    },
    {
      code: "premium_trend",
      scope: "market",
      probability: 0.04,
      duration: 1,
      modifiers: [{ target: "demand:passionnes", op: "mul", value: 1.3 }],
    },
    {
      code: "rate_hike",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    {
      code: "rate_cut",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.6 }],
    },
    {
      code: "supplier_discount",
      scope: "market",
      probability: 0.03,
      duration: 1,
      modifiers: [{ target: "material_cost", op: "mul", value: 0.9 }],
    },
    {
      code: "supplier_dispute",
      scope: "company",
      probability: 0.03,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.15 }],
    },
    {
      code: "cold_wave",
      scope: "market",
      probability: 0.03,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.9 }],
    },
    // Cartes « équipe » : jamais tirées par le PRNG (probability 0), jouées
    // uniquement par l'enseignant contre une équipe (tirage physique en classe)
    {
      code: "team_overtime",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 1.08 }],
    },
    {
      code: "local_supplier_deal",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "material_cost", op: "mul", value: 0.92 }],
    },
    {
      code: "banker_goodwill",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.7 }],
    },
    {
      code: "bank_penalties",
      scope: "company",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.4 }],
    },
    // Cartes ajoutées (toutes probability 0, tirage enseignant uniquement ;
    // APPENDRE en fin de liste : le PRNG consomme un tirage par événement,
    // insérer au milieu décalerait les tirages seedés existants)
    {
      code: "export_market",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 1.15 }],
    },
    {
      code: "natural_disaster",
      scope: "market",
      probability: 0,
      duration: 1,
      modifiers: [
        { target: "availability", op: "mul", value: 0.72 },
        { target: "material_cost", op: "mul", value: 1.12 },
      ],
    },
    {
      code: "big_order",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "order", op: "add", value: 600 }],
    },
    {
      code: "cyberattack",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.88 }],
    },
    {
      // Commande à prix serré : tient dans la capacité, mais la marge se
      // calcule (55 € vs coût variable ~38 €) — coûts pertinents.
      code: "tight_order",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [
        { target: "order", op: "add", value: 500 },
        { target: "order_price", op: "add", value: 55 },
      ],
    },
    {
      // Commande XXL : dépasse la capacité — sous-traiter (52 €/u) ou avoir
      // investi avant. L'arbitrage investissement/sous-traitance en une carte.
      code: "xxl_order",
      scope: "company",
      probability: 0,
      duration: 1,
      modifiers: [
        { target: "order", op: "add", value: 2500 },
        { target: "order_price", op: "add", value: 61 },
        { target: "order_subcontract", op: "add", value: 2500 },
      ],
    },
  ],
  // Fournisseurs (doc 02 §5bis) : 3 fournisseurs avec des profils distincts.
  // Le standard est le référent (coût = 22 €, délai = 22 j, pas de risque).
  // Le low-cost baisse de 15 % mais expose à des ruptures et dégrade la qualité.
  // Le premium augmente de 10 % mais apporte un bonus qualité et paie plus vite.
  suppliers: [
    {
      code: "standard",
      name: "Fournisseur standard",
      narrative:
        "Votre fournisseur historique : des composants fiables à prix de marché, livrés sous 22 jours.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 22,
      supplyRiskProbability: 0,
      supplyRiskAvailabilityHit: 1,
    },
    {
      code: "lowcost",
      name: "AsiaComponents",
      narrative:
        "Composants importés, 15 % moins chers — mais des lots irréguliers et un risque de rupture qui peut bloquer votre chaîne.",
      costMultiplier: 0.85,
      qualityBonus: -0.03,
      paymentDelayDays: 45,
      supplyRiskProbability: 0.15,
      supplyRiskAvailabilityHit: 0.75,
    },
    {
      code: "premium",
      name: "EuroParts Premium",
      narrative:
        "Composants européens certifiés, qualité supérieure et livraison express — la fiabilité a un prix.",
      costMultiplier: 1.1,
      qualityBonus: 0.05,
      paymentDelayDays: 15,
      supplyRiskProbability: 0,
      supplyRiskAvailabilityHit: 1,
    },
  ],
  // Assurance (§ nouvelles décisions) : 3 formules à couverture croissante.
  // L'arbitrage est gradué : basique couvre le minimum, étendue ajoute les
  // pannes et le fournisseur, tous risques couvre aussi la conjoncture.
  insurance: {
    premiumPerRound: 2500,
    coveredEventCodes: ["natural_disaster", "cold_wave"],
    formulas: [
      {
        code: "basic",
        name: "Basique",
        premiumPerRound: 1500,
        coveredEventCodes: ["natural_disaster", "cold_wave"],
      },
      {
        code: "extended",
        name: "Étendue",
        premiumPerRound: 3500,
        coveredEventCodes: [
          "natural_disaster",
          "cold_wave",
          "machine_breakdown",
          "supplier_dispute",
          "cyberattack",
        ],
      },
      {
        code: "allrisk",
        name: "Tous risques",
        premiumPerRound: 5500,
        coveredEventCodes: [
          "natural_disaster",
          "cold_wave",
          "machine_breakdown",
          "supplier_dispute",
          "cyberattack",
          "rate_hike",
          "raw_material_spike",
        ],
      },
    ],
  },
  // RH (niveaux Arbitrage+) : 4 opérateurs inclus dans les 91 000 € de
  // structure. À effectif complet, l'atelier machine (7 000 u) est le goulot :
  // l'embauche compense les départs et prépare l'investissement capacitaire.
  // Trésorerie : escompte (6 %/an, 60 % du poste clients max) contre
  // affacturage (2,5 % du montant, illimité) — deux coûts, deux logiques.
  // Au-delà du plafond de découvert : affacturage forcé à 5 % (punitif).
  treasury: {
    discountAnnualRate: 0.06,
    discountMaxShare: 0.6,
    factoringFeeRate: 0.025,
    forcedFactoringFeeRate: 0.05,
  },
  // Investissement capacitaire : 20 €/unité de capacité trimestrielle,
  // amorti sur 16 trimestres, mise en service au tour suivant.
  investment: {
    costPerCapacityUnit: 20,
    depreciationRounds: 16,
    maxPerRound: 2000,
  },
  // Sous-traitance : unités finies à 52 € (coût variable interne ≈ 38 €) —
  // la marge d'une commande sous-traitée se calcule, elle ne se devine pas.
  subcontracting: { unitCost: 52 },
  // Études achetables : des données riches pour décider — mais l'information
  // a un prix, et il se lit au seuil de rentabilité comme les autres charges.
  studies: {
    marketCost: 1500, // demande par segment, parts et prix des concurrents
    priceCost: 1000, // élasticités estimées, seuils psychologiques, positionnement
    financeCost: 800, // ratios complets, structure des coûts, comparaison sectorielle
    projectCost: 1200, // VAN/TRI de l'investissement, arbitrage de la commande du tour
  },
  // Commandes exceptionnelles ENTRE CHAQUE TOUR : l'offre du tour est TIRÉE
  // dans ce pool à la graine de la partie (orderOfferForRound) — la même pour
  // toutes les équipes, mais deux parties ne voient pas la même séquence.
  // L'alternance des archétypes est garantie par le tirage : tours impairs =
  // règlement à crédit (export à forte marge, le CA dort en créances, le BFR
  // gonfle), tours pairs = comptant à marge mince (du cash tout de suite).
  // Coût variable interne : 38 €/u.
  orderOffers: [
    {
      code: "offer_export_nordics",
      title: "Distributeur scandinave",
      narrative:
        "Un distributeur hi-fi d'Oslo veut référencer NOVA : 700 enceintes à 74 € pièce. Conditions du contrat : règlement à 90 jours, comme tout l'export.",
      units: 700,
      price: 74,
      paymentDelayDays: 90,
    },
    {
      code: "offer_flash_marketplace",
      title: "Vente flash marketplace",
      narrative:
        "Une grande marketplace vous propose une opération flash : 600 unités à 45 € pièce, virement immédiat à l'expédition. Le prix est serré — le cash, lui, est là.",
      units: 600,
      price: 45,
      paymentDelayDays: 0,
    },
    {
      code: "offer_export_dach",
      title: "Chaîne hi-fi allemande",
      narrative:
        "Une chaîne de magasins allemande commande 900 unités à 70 € pour ses corners audio. Paiement à 90 jours fin de mois — l'usage outre-Rhin.",
      units: 900,
      price: 70,
      paymentDelayDays: 90,
    },
    {
      code: "offer_lycees",
      title: "Appel d'offres lycées",
      narrative:
        "Un groupement de lycées équipe ses salles : 800 unités à 47 €, mandat administratif payé comptant à la livraison. Marge mince, encaissement immédiat.",
      units: 800,
      price: 47,
      paymentDelayDays: 0,
    },
    {
      code: "offer_export_japan",
      title: "Importateur japonais",
      narrative:
        "Un importateur de Tokyo teste le marché avec 600 unités à 78 € — votre meilleur prix jamais proposé. Lettre de crédit réglée à 90 jours.",
      units: 600,
      price: 78,
      paymentDelayDays: 90,
    },
    {
      code: "offer_destockeur",
      title: "Déstockeur européen",
      narrative:
        "Un déstockeur reprend 1 000 unités à 44 € pièce, enlèvement et paiement comptant sous 48 h. Presque pas de marge — mais la caisse respire.",
      units: 1000,
      price: 44,
      paymentDelayDays: 0,
    },
    {
      code: "offer_duty_free",
      title: "Boutiques duty-free",
      narrative:
        "Un opérateur de boutiques d'aéroport référence NOVA pour la saison : 500 unités à 76 €. Règlement à 60 jours, conditions du contrat cadre.",
      units: 500,
      price: 76,
      paymentDelayDays: 60,
    },
    {
      code: "offer_campus_uk",
      title: "Réseau de campus britanniques",
      narrative:
        "Un distributeur équipe les boutiques de campus outre-Manche : 800 unités à 71 €. Paiement à 90 jours — et en plus, il faudra suivre la livraison.",
      units: 800,
      price: 71,
      paymentDelayDays: 90,
    },
    {
      code: "offer_coffrets_noel",
      title: "Coffrets cadeaux e-commerce",
      narrative:
        "Un e-commerçant monte des coffrets cadeaux : 700 unités à 46 €, payées comptant à l'expédition. Le prix est tiré, le virement est immédiat.",
      units: 700,
      price: 46,
      paymentDelayDays: 0,
    },
    {
      code: "offer_comite_entreprise",
      title: "Comité d'entreprise",
      narrative:
        "Le CSE d'un grand groupe commande 400 unités à 52 € pour ses salariés, réglées comptant. Volume modeste, marge correcte, zéro attente.",
      units: 400,
      price: 52,
      paymentDelayDays: 0,
    },
  ],
  hr: {
    salaryPerEmployeePerRound: 8000,
    includedHeadcount: 4,
    hiringCost: 3000,
    firingCost: 6000,
    trainingScale: 3000,
    trainingSensitivity: 0.05,
    maxProductivity: 1.25,
    moraleSensitivity: 0.5,
    attritionThreshold: 0.95,
    maxHiresPerRound: 3,
    maxHeadcount: 10,
  },
  scriptedEvents: [{ round: 5, eventCode: "raw_material_spike" }],
  // Scoring BPI (doc 08 §1) : pondérations imposées, bornes calibrées sur les
  // trajectoires de référence (snapshot doré) — min → 0 point, cible → 100.
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
      operatingIncome: { min: -50000, target: 45000 },
      revenue: { min: 150000, target: 400000 },
      netTreasury: { min: -60000, target: 80000 },
      returnOnEquity: { min: -0.1, target: 0.06 },
      marketShareTarget: 0.32,
      utilizationTarget: 0.85,
    },
  },
} satisfies EngineScenarioConfig;

/** Config NOVA validée à l'import (jamais de config non parsée en circulation). */
export const novaScenario: EngineScenarioConfig = parseScenarioConfig(rawNova);

/** État initial d'une entreprise NOVA (bilan équilibré : 230 000 € de ressources). */
export function novaCompany(
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
    machineCapacity: 7000,
    availability: 1,
    headcount: 4,
    hoursPerEmployee: 540, // capacité MOD = 4 × 540 / 0,3 = 7 200 u/tour
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    // dette reprise : 80 000 € amortis sur 20 trimestres → 4 000 €/tour
    loans: [{ remaining: 80000, perRound: 4000 }],
    finance: {
      fixedAssetsNet: 205000,
      inventoryValue: 0,
      receivables: 0,
      cash: 25000,
      equity: 150000,
      financialDebt: 80000,
      payables: 0,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/**
 * Concurrents bots de NOVA (doc 07 §1), par ordre d'entrée sur le marché.
 * Une partie à N entreprises prend les N−1 premiers (ou complète les équipes
 * humaines). SoundBox et Auris restent les deux concurrents « canoniques ».
 */
export const novaBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "soundbox", name: "SoundBox", profile: "price_aggressive" },
  { id: "auris", name: "Auris", profile: "premium" },
  { id: "vertex", name: "Vertex Audio", profile: "balanced" },
  { id: "kubo", name: "Kubo", profile: "growth" },
  { id: "practico", name: "Practico", profile: "passive" },
  { id: "onda", name: "Onda Sound", profile: "price_aggressive" },
  { id: "lumen", name: "Lumen Acoustics", profile: "premium" },
];
