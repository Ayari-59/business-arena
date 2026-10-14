import type { CompanyState, EngineScenarioConfig, ProductDef } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";
import { conseilBots, conseilCompany, conseilScenario } from "../conseil";

/**
 * Scénario SERVICES · GAMME — « ATLAS CONSEIL » en trois offres : l'audit et
 * la conformité, la transformation et la stratégie, et une offre de
 * cybersécurité qui n'existe qu'à l'état de projet, 6 tours trimestriels.
 *
 * Le cabinet d'origine vend « la journée » à un taux moyen. Ici, chaque offre
 * a son taux, ses clients et ses frais, et toutes se partagent les mêmes
 * consultants : 12 personnes, 60 jours ouvrés, 720 jours à vendre par
 * trimestre, quelle que soit l'offre. Le MIX des journées vendues décide du
 * taux journalier moyen autant que le taux d'occupation, et une offre neuve
 * se bâtit avant de se vendre : la pratique cyber demande 30 000 € de
 * méthodes, de certifications et de recrutement de compétences avant la
 * première mission, et pas avant le tour 2.
 *
 * Calibration (base trimestrielle) : 720 jours vendables ; audit 560 €
 * (marge 470 €), transformation 780 € (marge 665 €), cyber 850 € (marge
 * 750 €) ; 198 000 € de structure décaissée → seuil ≈ 380 jours au mix
 * usuel (53 % d'occupation), contre 421 en un seul taux moyen.
 */

const conseilSegments = conseilScenario.market.segments;
const grandsComptes = conseilSegments.find((s) => s.code === "grands_comptes")!;
const pme = conseilSegments.find((s) => s.code === "pme")!;
const secteurPublic = conseilSegments.find((s) => s.code === "public")!;

/**
 * Le marché de l'audit, cœur de gamme : les PME régionales et le secteur
 * public du cabinet d'origine, aux mêmes ressorts. C'est aussi le marché
 * « du scénario » (`market`) : celui que lisent les affichages mono-produit et
 * le prix de référence des bots.
 */
const AUDIT_MARKET = {
  segments: [{ ...pme, size: 780 }, { ...secteurPublic, size: 440 }],
  seasonality: conseilScenario.market.seasonality,
  outsideAttraction: conseilScenario.market.outsideAttraction,
  competitionIntensity: conseilScenario.market.competitionIntensity,
};

const GAMME: ProductDef[] = [
  {
    code: "audit",
    name: "Audit et conformité",
    // la journée du cabinet d'origine : frais de mission et sous-traitance d'appoint
    materialCostPerUnit: 55,
    otherVariableCostPerUnit: 35,
    hoursPerUnit: 1,
    market: AUDIT_MARKET,
  },
  {
    code: "transformation",
    name: "Transformation et stratégie",
    // des missions chez le client, loin, longtemps : plus de frais, plus d'experts d'appoint
    materialCostPerUnit: 70,
    otherVariableCostPerUnit: 45,
    hoursPerUnit: 1,
    market: {
      segments: [
        { ...grandsComptes, size: 560 },
        {
          code: "eti",
          name: "ETI en croissance (missions de 40 j, 45 j)",
          size: 260,
          growth: 0.05,
          priceElasticity: -1.0,
          refPrice: 690,
          minAcceptablePrice: 420,
          psychThresholds: [{ threshold: 750, penalty: 0.9 }],
          marketingSensitivity: 0.15,
          qualitySensitivity: 0.45,
          loyalty: 0.35,
          priceEffectBounds: { min: 0.3, max: 2.5 },
          paymentDelayDays: 45,
          seasonality: [1.2, 1.1, 0.6, 1.1, 1.1, 1.1],
        },
      ],
      seasonality: [1.15, 1.1, 0.6, 1.1, 1.05, 1.1],
      outsideAttraction: 0.45,
      competitionIntensity: 1.5,
    },
  },
  {
    code: "cyber",
    name: "Cybersécurité et conformité numérique",
    materialCostPerUnit: 60,
    otherVariableCostPerUnit: 40,
    hoursPerUnit: 1,
    // Une offre se bâtit avant de se vendre : méthodes, certifications,
    // compétences. 30 000 € de R&D (un bon septième d'un trimestre de
    // structure) avant la première mission, et pas avant le tour 2.
    development: { cost: 30000, availableFromRound: 2 },
    market: {
      segments: [
        {
          code: "dsi",
          name: "DSI et RSSI (audits et plans de sécurité, 30 j)",
          size: 320,
          growth: 0.1,
          priceElasticity: -0.8,
          refPrice: 850,
          minAcceptablePrice: 520,
          psychThresholds: [{ threshold: 900, penalty: 0.92 }],
          marketingSensitivity: 0.12,
          qualitySensitivity: 0.55,
          loyalty: 0.4,
          priceEffectBounds: { min: 0.3, max: 2.5 },
          paymentDelayDays: 30,
          // un marché qui ne connaît pas l'été des décideurs
          seasonality: [1.1, 1.0, 0.85, 1.05, 1.1, 1.1],
        },
        {
          code: "collectivites_num",
          name: "Collectivités et établissements publics (mise en conformité, 60 j)",
          size: 220,
          growth: 0.08,
          priceElasticity: -1.3,
          refPrice: 720,
          minAcceptablePrice: 450,
          psychThresholds: [{ threshold: 750, penalty: 0.9 }],
          marketingSensitivity: 0.1,
          qualitySensitivity: 0.35,
          loyalty: 0.3,
          priceEffectBounds: { min: 0.3, max: 2.5 },
          paymentDelayDays: 60,
          seasonality: [1.3, 1.1, 0.5, 1.0, 1.3, 1.1],
        },
      ],
      seasonality: [1.15, 1.05, 0.75, 1.05, 1.1, 1.1],
      outsideAttraction: 0.4,
      competitionIntensity: 1.3,
    },
  },
];

/**
 * Les offres de commande du cabinet d'origine, sous d'autres codes : elles
 * portent sur le cœur de gamme (l'audit), aux mêmes conditions.
 */
/**
 * La référence de chaque commande, et son prix quand la référence n'est pas
 * celle du mono : le programme de transformation et la due diligence sont de la
 * transformation, le reste de l'audit et de la conformité.
 */
const CIBLES: Record<string, { productCode: string; price?: number }> = {
  conseil_offer_transformation: { productCode: "transformation" },
  conseil_offer_appel_offres: { productCode: "audit" },
  conseil_offer_due_diligence: { productCode: "transformation" },
  conseil_offer_formation: { productCode: "audit" },
  conseil_offer_assistance: { productCode: "audit" },
  conseil_offer_audit_flash: { productCode: "audit" },
};

const ORDER_OFFERS = (conseilScenario.orderOffers ?? []).map((o) => {
  const cible = CIBLES[o.code];
  if (!cible) throw new Error(`Commande exceptionnelle sans référence : ${o.code}`);
  return {
    ...o,
    ...cible,
    code: o.code.replace(/^conseil_offer_/, "conseilg_offer_"),
  };
});

const rawConseilGamme = {
  ...conseilScenario,
  code: "conseil-gamme",
  version: "0.1.0",
  market: AUDIT_MARKET,
  // Le produit « de référence » des affichages mono-produit : le cœur de gamme.
  product: {
    code: "audit",
    materialCostPerUnit: 55,
    otherVariableCostPerUnit: 35,
    hoursPerUnit: 1,
  },
  products: GAMME,
  orderOffers: ORDER_OFFERS,
  // Études de marché — identique au mono.
  studies: {
    marketCost: 2400,
    priceCost: 2000,
    financeCost: 1500,
    projectCost: 2200,
  },
  // Catalogue enrichi (studiesV2) — conseil : les RH sont le cœur du modèle ;
  // comprendre le comportement client et la politique salariale des concurrents
  // est essentiel pour positionner l'offre et attirer les talents.
  studiesV2: {
    categories: [
      {
        code: "comportement",
        label: "Comportement d'achat des donneurs d'ordre",
        cost: 2600,
        description: "Élasticité-prix, sensibilité à la qualité et fidélité des segments clients du conseil.",
        revealsFields: ["priceElasticity", "marketingSensitivity", "qualitySensitivity", "loyalty", "refPrice"],
      },
      {
        code: "remunerations",
        label: "Politique de rémunération des concurrents",
        cost: 2800,
        description: "Effectif et indice de salaire de chaque cabinet concurrent — clé de l'attractivité RH.",
        revealsFields: ["headcount", "salaryIndex"],
      },
      {
        code: "segments",
        label: "Parts de marché par pratique",
        cost: 2200,
        description: "Parts de marché de chaque cabinet sur les segments audit, transformation et cyber.",
        revealsFields: ["totalShare", "bySegment"],
      },
    ],
  },
  // Postes consultants — identiques au mono : les mêmes espaces de travail
  // accueillent les trois pratiques (audit, transformation, cyber).
  equipment: {
    types: [
      {
        code: "poste_junior",
        name: "Poste consultant junior",
        capacityPerUnit: 250,
        costPerUnit: 8000,
        depreciationRounds: 12,
        maintenanceMultiplier: 1.3,
        maxPerRound: 4,
        resaleRatio: 0.3,
      },
      {
        code: "poste_confirme",
        name: "Poste consultant confirmé",
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
  // RH — identique au mono.
  hr: {
    salaryPerEmployeePerRound: 12600,
    includedHeadcount: 12,
    hiringCost: 8000,
    firingCost: 15000,
    trainingScale: 5000,
    trainingSensitivity: 0.07,
    maxProductivity: 1.35,
    moraleSensitivity: 0.8,
    attritionThreshold: 0.97,
    maxHiresPerRound: 3,
    maxHeadcount: 24,
  },
  // Fournisseurs — identique au mono.
  suppliers: [
    {
      code: "standard",
      name: "Déplacements standard",
      narrative:
        "Trains et hôtels à tarif négocié : le mode opératoire habituel du cabinet.",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 30,
      supplyRiskProbability: 0.03,
      supplyRiskAvailabilityHit: 0.92,
    },
    {
      code: "distance",
      name: "Missions à distance",
      narrative:
        "40 % de déplacements en moins, 6 % de marge perçue en moins : les clients voient moins vos équipes, c'est bankable sur des missions techniques, délicat en transformation.",
      costMultiplier: 0.6,
      qualityBonus: -0.06,
      paymentDelayDays: 30,
      supplyRiskProbability: 0.08,
      supplyRiskAvailabilityHit: 0.9,
    },
    {
      code: "presence",
      name: "Présence renforcée",
      narrative:
        "35 % de plus en frais de mission, qualité perçue en hausse : les clients vous voient sur le terrain, la confiance monte et les litiges baissent.",
      costMultiplier: 1.35,
      qualityBonus: 0.08,
      paymentDelayDays: 15,
      supplyRiskProbability: 0.02,
      supplyRiskAvailabilityHit: 0.95,
    },
  ],
  // Investissement — aménagement de bureaux pour développer la capacité des
  // trois pratiques (audit, transformation, cyber). Contrairement au mono,
  // le cabinet gamme peut ouvrir de nouveaux plateaux de travail : ~150 €
  // par jour-consultant de capacité supplémentaire, amorti sur 20 trimestres.
  investment: {
    costPerCapacityUnit: 150,
    depreciationRounds: 20,
    maxPerRound: 120,
  },
  // Le levier R&D : au-delà du coût de développement, la R&D élève le niveau
  // technique d'une offre (méthodes, outils, veille) — jusqu'à +12 % de
  // qualité perçue, avec retard, et qui s'érode de moitié par tour sans
  // entretien. Échelle : 8 000 € par trimestre donnent environ +4 % à l'équilibre.
  rd: { techScale: 8000, techSensitivity: 0.08, techMax: 0.12, techInertia: 0.5 },
  // Grille R&D : trois thèmes structurant la montée en valeur des offres de conseil.
  rdGrid: {
    themes: [
      {
        code: "methodologie",
        label: "Méthodologie & IP",
        levels: [
          {
            level: 1,
            label: "Capitalisation méthodes N1 — playbooks et templates",
            cost: 5000,
            durationRounds: 2,
            effects: { defectReduction: 0.06, demandBonus: 0.02 },
          },
          {
            level: 2,
            label: "Cadre propriétaire N2 — framework ATLAS certifié",
            cost: 12000,
            durationRounds: 3,
            effects: { demandBonus: 0.06 },
            prerequisiteLevel: 1,
          },
          {
            level: 3,
            label: "Offre brevetée N3 — accréditation internationale",
            cost: 22000,
            durationRounds: 4,
            effects: { demandBonus: 0.10 },
            prerequisiteLevel: 2,
          },
        ],
      },
      {
        code: "outils_digitaux",
        label: "Outils digitaux & automatisation",
        levels: [
          {
            level: 1,
            label: "Portail client N1 — suivi de mission en ligne",
            cost: 6000,
            durationRounds: 2,
            effects: { demandBonus: 0.03, materialCostReduction: 0.03 },
          },
          {
            level: 2,
            label: "Analyse de données N2 — dashboards automatisés",
            cost: 14000,
            durationRounds: 2,
            effects: { demandBonus: 0.05, materialCostReduction: 0.04 },
            prerequisiteLevel: 1,
          },
          {
            level: 3,
            label: "IA appliquée N3 — audit assisté par LLM",
            cost: 25000,
            durationRounds: 3,
            effects: { demandBonus: 0.07, materialCostReduction: 0.05 },
            prerequisiteLevel: 2,
          },
        ],
      },
      {
        code: "formation_interne",
        label: "Formation & capital humain",
        levels: [
          {
            level: 1,
            label: "Académie interne N1 — e-learning et ateliers mensuels",
            cost: 4000,
            durationRounds: 2,
            effects: { defectReduction: 0.05, capacityBonus: 0.03 },
          },
          {
            level: 2,
            label: "Certification consultants N2 — parcours 60 h + examen",
            cost: 10000,
            durationRounds: 3,
            effects: { defectReduction: 0.08, demandBonus: 0.03 },
            prerequisiteLevel: 1,
          },
          {
            level: 3,
            label: "Centre d'excellence N3 — pôle R&D et veille sectorielle",
            cost: 20000,
            durationRounds: 3,
            effects: { defectReduction: 0.07, demandBonus: 0.06, capacityBonus: 0.05 },
            prerequisiteLevel: 2,
          },
        ],
      },
    ],
  },
  // Le levier communication : la notoriété d'ATLAS porte les trois offres
  // (jusqu'à +25 %, avec retard, qui s'use sans entretien), et un axe. La
  // qualité parle aux grands comptes et aux DSI, l'image aux clients fidèles,
  // le prix aux PME et aux collectivités.
  communication: {
    brandScale: 7000,
    brandSensitivity: 0.18,
    brandMax: 0.25,
    brandInertia: 0.5,
    axisFit: 1.3,
    axisMisfit: 0.7,
    axisSwitchDecay: 0.6,
  },
  scoring: {
    weights: conseilScenario.scoring.weights,
    benchmarks: {
      ...conseilScenario.scoring.benchmarks,
      revenue: { min: 200000, target: 460000 },
    },
  },
} satisfies EngineScenarioConfig;

/** Config ATLAS CONSEIL · gamme validée à l'import. */
export const conseilGammeScenario: EngineScenarioConfig = parseScenarioConfig(rawConseilGamme);

/**
 * État initial d'une entreprise ATLAS CONSEIL · gamme : celui du cabinet
 * d'origine (douze consultants, 180 000 € de créances, un prêt d'amorçage),
 * et rien à reporter sur aucune offre : une journée ne se stocke pas.
 */
export function conseilGammeCompany(
  id: string,
  name: string,
  controller: "human" | "bot",
  botProfile?: BotProfile,
): CompanyState {
  return {
    ...conseilCompany(id, name, controller, botProfile),
    finishedGoodsByProduct: Object.fromEntries(
      GAMME.map((p) => [p.code, { quantity: 0, unitCost: 0 }]),
    ),
  };
}

/** Les mêmes cabinets concurrents : ils vendent eux aussi les trois offres. */
export const conseilGammeBots: { id: string; name: string; profile: BotProfile }[] = conseilBots;
