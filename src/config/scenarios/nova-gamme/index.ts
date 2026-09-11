import type {
  CompanyState,
  EngineScenarioConfig,
  ProductDef,
  SupplierDef,
} from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";
import { novaBots, novaScenario } from "../nova";

/**
 * Scénario NOVA · GAMME — le fabricant d'enceintes en trois références,
 * 6 tours trimestriels. Le scénario NOVA d'origine reste intact : c'est lui
 * que jouent les ateliers STMG et lui qui porte l'instantané doré du moteur.
 * Celui-ci est le NOVA des ateliers de gestion (GEA, CG, DCG) : même atelier,
 * même finance, mais trois produits qui se disputent la même capacité.
 *
 *   NOVA Go      34 € · matières 10 € + 9 €  · MCV 15 € · 0,18 h · l'entrée de gamme
 *   NOVA One     59 € · matières 22 € + 16 € · MCV 21 € · 0,30 h · le cœur de gamme
 *   NOVA Studio 129 € · matières 48 € + 22 € · MCV 59 € · 0,50 h · le haut de gamme, à développer
 *
 * Ce que la gamme apporte à NOVA : le MIX. L'atelier sort 7 000 enceintes par
 * trimestre, quelle que soit la référence ; une Studio y rapporte presque
 * cinq fois plus qu'une Go. Mais le marché du Studio est petit et exigeant,
 * celui du Go est large, volatil et double à Noël. Quand la demande dépasse
 * l'atelier au tour 4, la question n'est plus « combien produire » mais
 * « quoi produire » : c'est le facteur rare, et il se calcule à la marge par
 * unité de capacité.
 *
 * Chaque référence a SON marché (segments, concurrence, saison) et SON
 * catalogue de composants. Le One garde le marché et les fournisseurs du
 * NOVA d'origine ; la moitié de ses passionnés, les audiophiles, n'achètent
 * que la Studio — qui n'existe qu'à l'état de prototype à la reprise et se
 * développe à coups de R&D.
 */

// --- Les composants, référence par référence -------------------------------

const STANDARD: SupplierDef = {
  code: "standard",
  name: "Fournisseur standard",
  narrative:
    "Votre fournisseur historique : des composants fiables à prix de marché, livrés sous 22 jours, pour toute la gamme.",
  costMultiplier: 1,
  qualityBonus: 0,
  paymentDelayDays: 22,
  supplyRiskProbability: 0,
  supplyRiskAvailabilityHit: 1,
};

const ASIA: SupplierDef = {
  code: "lowcost",
  name: "AsiaComponents",
  narrative:
    "Composants importés, 15 % moins chers, mais des lots irréguliers et un risque de rupture qui peut bloquer la ligne de cette référence.",
  costMultiplier: 0.85,
  qualityBonus: -0.03,
  paymentDelayDays: 45,
  supplyRiskProbability: 0.15,
  supplyRiskAvailabilityHit: 0.75,
};

/** Sur l'entrée de gamme, l'import est encore moins cher : les kits Go sont simples à sourcer. */
const ASIA_GO: SupplierDef = {
  ...ASIA,
  narrative:
    "Kits d'entrée de gamme importés, 20 % moins chers, mais des lots irréguliers et un risque de rupture qui peut bloquer la ligne Go.",
  costMultiplier: 0.8,
  qualityBonus: -0.04,
};

const EUROPARTS: SupplierDef = {
  code: "premium",
  name: "EuroParts Premium",
  narrative:
    "Composants européens certifiés, qualité supérieure et livraison express : la fiabilité a un prix.",
  costMultiplier: 1.1,
  qualityBonus: 0.05,
  paymentDelayDays: 15,
  supplyRiskProbability: 0,
  supplyRiskAvailabilityHit: 1,
};

/** Le fournisseur des haut-parleurs du Studio : un acousticien, pas un grossiste. */
const ACOUSTIKA: SupplierDef = {
  code: "acoustika",
  name: "Acoustika",
  narrative:
    "Un spécialiste des transducteurs de studio : des haut-parleurs appairés à la main, 18 % plus chers, et une réputation qui se voit dans les tests.",
  costMultiplier: 1.18,
  qualityBonus: 0.08,
  paymentDelayDays: 30,
  supplyRiskProbability: 0,
  supplyRiskAvailabilityHit: 1,
};

const COMPOSANTS_GO: SupplierDef[] = [STANDARD, ASIA_GO];
/** Le catalogue du One : celui du NOVA d'origine, et celui des affichages mono-produit. */
const COMPOSANTS_ONE: SupplierDef[] = [STANDARD, ASIA, EUROPARTS];
/** Pas d'import low-cost sur le Studio : ses clients écoutent la différence. */
const COMPOSANTS_STUDIO: SupplierDef[] = [STANDARD, EUROPARTS, ACOUSTIKA];

// --- La gamme ---------------------------------------------------------------

const novaSegments = novaScenario.market.segments;
const etudiants = novaSegments.find((s) => s.code === "etudiants")!;
const passionnes = novaSegments.find((s) => s.code === "passionnes")!;
const campustech = novaSegments.find((s) => s.code === "campustech")!;

/**
 * Le marché du NOVA One, cœur de gamme : les étudiants et CampusTech du NOVA
 * d'origine, aux mêmes ressorts. C'est aussi le marché « du scénario » (`market`) :
 * celui que lisent les affichages mono-produit, le prix de référence des bots
 * et les gardes de calibration.
 */
const ONE_MARKET = {
  // Les étudiants et CampusTech du NOVA d'origine, tels quels ; et la moitié
  // de ses passionnés, qui achètent un One tant que la Studio n'existe pas —
  // l'autre moitié, les audiophiles, n'achètera QUE la Studio, une fois
  // développée. Les étudiants restent le plus gros segment : c'est lui qui
  // fixe le prix de référence.
  segments: [etudiants, { ...passionnes, size: 5000 }, campustech],
  seasonality: [0.9, 0.95, 1.0, 1.35, 0.9, 1.0],
  outsideAttraction: 0.55,
  competitionIntensity: 1.6,
};

const GAMME: ProductDef[] = [
  {
    code: "nova-go",
    name: "NOVA Go",
    // l'enceinte de poche : un kit simple, une marge mince, du volume
    materialCostPerUnit: 10,
    otherVariableCostPerUnit: 9, // MOD 6 € + énergie/divers 3 €
    hoursPerUnit: 0.18,
    suppliers: COMPOSANTS_GO,
    market: {
      segments: [
        {
          code: "lyceens",
          name: "Lycéens et cadeaux (très sensibles au prix)",
          size: 3000,
          growth: 0.05,
          priceElasticity: -2.4,
          refPrice: 34,
          minAcceptablePrice: 22,
          psychThresholds: [
            { threshold: 30, penalty: 0.9 },
            { threshold: 40, penalty: 0.92 },
          ],
          marketingSensitivity: 0.3,
          qualitySensitivity: 0.08,
          loyalty: 0.05,
          priceEffectBounds: { min: 0.15, max: 4 },
          paymentDelayDays: 0,
          // l'enceinte qu'on offre : la demande double à Noël
          seasonality: [0.8, 0.7, 0.9, 1.9, 0.8, 0.9],
        },
        {
          code: "gms",
          name: "Grande distribution (centrale d'achat, 60 j)",
          size: 2200,
          growth: 0.04,
          priceElasticity: -1.4,
          refPrice: 31,
          minAcceptablePrice: 24,
          psychThresholds: [],
          marketingSensitivity: 0.05,
          qualitySensitivity: 0.15,
          loyalty: 0.5,
          priceEffectBounds: { min: 0.3, max: 2.2 },
          paymentDelayDays: 60,
          seasonality: [0.7, 0.8, 1.0, 1.6, 0.8, 1.0],
        },
      ],
      seasonality: [0.9, 0.9, 1.0, 1.3, 0.9, 1.0],
      outsideAttraction: 0.6,
      competitionIntensity: 1.8,
    },
  },
  {
    code: "nova-one",
    name: "NOVA One",
    materialCostPerUnit: 22,
    otherVariableCostPerUnit: 16, // MOD 11 € + énergie/divers 5 €
    hoursPerUnit: 0.3,
    suppliers: COMPOSANTS_ONE,
    market: ONE_MARKET,
  },
  {
    code: "nova-studio",
    name: "NOVA Studio",
    // l'enceinte de référence : transducteurs appairés, finition, une MCV de 59 €
    materialCostPerUnit: 48,
    otherVariableCostPerUnit: 22, // MOD 16 € + énergie/divers 6 €
    hoursPerUnit: 0.5,
    suppliers: COMPOSANTS_STUDIO,
    // La montée en gamme se paie avant de rapporter : la Studio n'existe
    // qu'à l'état de prototype à la reprise. 25 000 € de R&D (un bon quart
    // d'un trimestre de charges de structure) avant de la vendre, et
    // pas avant le tour 2 : lancée au tour 2 si tout est engagé dès le tour 1,
    // au tour 3 en étalant. Une décision de valeur actuelle nette grandeur nature, avec
    // Noël au tour 4 comme horizon.
    development: { cost: 25000, availableFromRound: 2 },
    market: {
      segments: [
        {
          ...passionnes,
          code: "audiophiles",
          name: "Audiophiles (haut de gamme, sensibles à la qualité)",
          size: 3400,
          refPrice: 129,
          minAcceptablePrice: 90,
          psychThresholds: [{ threshold: 150, penalty: 0.9 }],
        },
        {
          code: "studios",
          name: "Studios et podcasteurs (30 j)",
          size: 2400,
          growth: 0.08,
          priceElasticity: -0.9,
          refPrice: 139,
          minAcceptablePrice: 95,
          psychThresholds: [{ threshold: 150, penalty: 0.93 }],
          marketingSensitivity: 0.1,
          qualitySensitivity: 0.45,
          loyalty: 0.4,
          priceEffectBounds: { min: 0.3, max: 2.5 },
          paymentDelayDays: 30,
          // un marché professionnel : pas de Noël, une croissance régulière
          seasonality: [0.9, 1.0, 1.05, 1.1, 1.05, 1.1],
        },
      ],
      seasonality: [0.9, 0.95, 1.0, 1.25, 0.95, 1.05],
      outsideAttraction: 0.5,
      competitionIntensity: 1.4,
    },
  },
];

/**
 * Les offres de commande du NOVA d'origine, sous d'autres codes : elles
 * portent sur le cœur de gamme (le One), aux mêmes conditions. Les codes
 * restent propres au scénario pour que deux parties ne se confondent pas.
 */
/**
 * La référence de chaque commande, et son prix quand la référence n'est pas
 * celle du mono : les distributeurs et l'export prennent la One (le prix du mono est
 * le sien), les lycées, le déstockeur et les coffrets la Go, à son prix.
 */
const CIBLES: Record<string, { productCode: string; price?: number }> = {
  offer_export_nordics: { productCode: "nova-one" },
  offer_flash_marketplace: { productCode: "nova-one" },
  offer_export_dach: { productCode: "nova-one" },
  offer_lycees: { productCode: "nova-go", price: 30 },
  offer_export_japan: { productCode: "nova-one" },
  offer_destockeur: { productCode: "nova-go", price: 24 },
  offer_duty_free: { productCode: "nova-one" },
  offer_campus_uk: { productCode: "nova-one" },
  offer_coffrets_noel: { productCode: "nova-go", price: 38 },
  offer_comite_entreprise: { productCode: "nova-one" },
};

const ORDER_OFFERS = (novaScenario.orderOffers ?? []).map((o) => {
  const cible = CIBLES[o.code];
  if (!cible) throw new Error(`Commande exceptionnelle sans référence : ${o.code}`);
  return {
    ...o,
    ...cible,
    code: o.code.replace(/^offer_/, "novag_offer_"),
  };
});

const rawNovaGamme = {
  ...novaScenario,
  code: "nova-gamme",
  version: "0.1.0",
  market: ONE_MARKET,
  // Le produit « de référence » des affichages mono-produit : le cœur de gamme.
  product: {
    code: "nova-one",
    materialCostPerUnit: 22,
    otherVariableCostPerUnit: 16,
    hoursPerUnit: 0.3,
  },
  products: GAMME,
  // Le catalogue du scénario est celui du One (affichages mono-produit).
  suppliers: COMPOSANTS_ONE,
  orderOffers: ORDER_OFFERS,
  // Le levier R&D : au-delà du coût de développement, la R&D élève le niveau
  // technique d'une référence — jusqu'à +12 % de qualité perçue, avec retard,
  // et qui s'érode de moitié par tour sans entretien. Échelle : 10 000 € par
  // trimestre donnent environ +4 % à l'équilibre.
  rd: { techScale: 10000, techSensitivity: 0.08, techMax: 0.12, techInertia: 0.5 },
  // Le levier communication : un budget de marque qui bâtit la notoriété de
  // NOVA pour toute la gamme (jusqu'à +25 % d'attraction, avec retard, et qui
  // s'use de moitié par tour sans entretien), et un axe de communication. Le
  // même euro rend 30 % de plus quand l'axe parle à la clientèle, 30 % de
  // moins quand il ne lui parle pas ; changer d'axe use la notoriété de 40 %.
  communication: {
    brandScale: 8000,
    brandSensitivity: 0.18,
    brandMax: 0.25,
    brandInertia: 0.5,
    axisFit: 1.3,
    axisMisfit: 0.7,
    axisSwitchDecay: 0.6,
  },
  scoring: {
    weights: novaScenario.scoring.weights,
    benchmarks: {
      operatingIncome: { min: -50000, target: 60000 },
      revenue: { min: 150000, target: 420000 },
      netTreasury: { min: -60000, target: 80000 },
      returnOnEquity: { min: -0.1, target: 0.08 },
      marketShareTarget: 0.32,
      utilizationTarget: 0.85,
    },
  },
} satisfies EngineScenarioConfig;

/** Config NOVA · gamme validée à l'import. */
export const novaGammeScenario: EngineScenarioConfig = parseScenarioConfig(rawNovaGamme);

/**
 * État initial d'une entreprise NOVA · gamme : celui du NOVA d'origine
 * (bilan équilibré, 230 000 € de ressources, atelier de 7 000 enceintes),
 * sans stock d'ouverture sur aucune des trois références.
 */
export function novaGammeCompany(
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
    hoursPerEmployee: 540, // 2 160 h : 7 200 One, 12 000 Go ou 4 320 Studio
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    finishedGoodsByProduct: Object.fromEntries(
      GAMME.map((p) => [p.code, { quantity: 0, unitCost: 0 }]),
    ),
    fleet: [
      { typeCode: "manual", count: 4, acquiredRound: 0, bookValue: 30000 },
      { typeCode: "semi_auto", count: 2, acquiredRound: 0, bookValue: 42000 },
    ],
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

/** Les mêmes concurrents que NOVA : ils vendent eux aussi toute la gamme. */
export const novaGammeBots: { id: string; name: string; profile: BotProfile }[] = novaBots;
