import type { CompanyState, EngineScenarioConfig, ProductDef } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";
import { hotelBots, hotelScenario } from "../hotel";

/**
 * Scénario HÔTEL · GAMME — « L'ESCALE » en trois chambres : standard,
 * supérieure et suite, dans le même bâtiment de 60 chambres, 6 tours
 * trimestriels.
 *
 * L'hôtel d'origine vend « la nuitée » à un prix moyen. Ici, chaque type de
 * chambre a son prix, sa clientèle et sa marge, et tous se partagent les
 * 5 400 nuitées du trimestre et les mêmes équipes d'étage. C'est le cœur du
 * revenue management : à capacité fixe, le MIX vendu décide du revenu par
 * chambre disponible autant que le remplissage.
 *
 * Le parc est celui de l'hôtel d'origine et la capacité reste un pool : les
 * murs ne cloisonnent pas les types, c'est le marché qui tient le mix. Les
 * suites sont demandées par un millier de nuitées par trimestre, pas plus ;
 * les vendre toutes est une affaire de prix et d'image, pas de béton.
 *
 * Calibration (base trimestrielle) : 5 400 nuitées offertes ; standard 88 €
 * (marge 67 €), supérieure 118 € (marge 92 €), suite 215 € (marge 176 €) ;
 * 158 000 € de structure décaissée → seuil ≈ 1 900 nuitées au mix usuel
 * (35 % d'occupation), contre 2 140 en un seul prix moyen.
 */

const hotelSegments = hotelScenario.market.segments;
const affaires = hotelSegments.find((s) => s.code === "affaires")!;
const loisirs = hotelSegments.find((s) => s.code === "loisirs")!;
const groupes = hotelSegments.find((s) => s.code === "groupes")!;

/**
 * Le marché de la chambre standard, cœur de gamme : le tourisme de loisirs
 * de l'hôtel d'origine (moins ceux qui montent en supérieure) et les groupes,
 * aux mêmes ressorts. C'est aussi le marché « du scénario » (`market`) :
 * celui que lisent les affichages mono-produit et le prix de référence des
 * bots.
 */
const STANDARD_MARKET = {
  segments: [{ ...loisirs, size: 3300 }, { ...groupes, size: 2500 }],
  seasonality: hotelScenario.market.seasonality,
  outsideAttraction: hotelScenario.market.outsideAttraction,
  competitionIntensity: hotelScenario.market.competitionIntensity,
};

const GAMME: ProductDef[] = [
  {
    code: "chambre-standard",
    name: "Chambre standard",
    // la nuitée de l'hôtel d'origine : petit-déjeuner et linge, commission et ménage
    materialCostPerUnit: 12,
    otherVariableCostPerUnit: 9,
    hoursPerUnit: 0.75,
    market: STANDARD_MARKET,
  },
  {
    code: "chambre-superieure",
    name: "Chambre supérieure",
    // literie, accueil et produits d'accueil au-dessus : 4 € de plus, un peu plus de ménage
    materialCostPerUnit: 15,
    otherVariableCostPerUnit: 11,
    hoursPerUnit: 0.85,
    market: {
      segments: [
        {
          // la clientèle affaires de l'hôtel d'origine, qui prend la supérieure
          // sur note de frais : mêmes ressorts, un plafond d'entreprise plus haut
          ...affaires,
          size: 2500,
          refPrice: 118,
          minAcceptablePrice: 68,
          psychThresholds: [{ threshold: 125, penalty: 0.88 }],
        },
        {
          code: "escapades",
          name: "Escapades en couple (week-ends, sensibles au confort)",
          size: 700,
          growth: 0.05,
          priceElasticity: -1.4,
          refPrice: 112,
          minAcceptablePrice: 72,
          psychThresholds: [{ threshold: 120, penalty: 0.9 }],
          marketingSensitivity: 0.25,
          qualitySensitivity: 0.4,
          loyalty: 0.2,
          priceEffectBounds: { min: 0.2, max: 3 },
          paymentDelayDays: 0,
          // les week-ends de printemps et d'automne, l'été un peu moins
          seasonality: [0.8, 1.2, 1.4, 1.1, 0.8, 1.2],
        },
      ],
      seasonality: [0.95, 1.15, 0.9, 1.05, 0.95, 1.15],
      outsideAttraction: 0.5,
      competitionIntensity: 1.5,
    },
  },
  {
    code: "suite",
    name: "Suite",
    // deux pièces, un service à la chambre : le double de linge et d'accueil
    materialCostPerUnit: 24,
    otherVariableCostPerUnit: 15,
    hoursPerUnit: 1.3,
    market: {
      segments: [
        {
          code: "direction",
          name: "Direction et invités d'entreprise (30 j)",
          size: 300,
          growth: 0.03,
          priceElasticity: -0.6,
          refPrice: 215,
          minAcceptablePrice: 125,
          psychThresholds: [{ threshold: 230, penalty: 0.9 }],
          marketingSensitivity: 0.06,
          qualitySensitivity: 0.55,
          loyalty: 0.55,
          priceEffectBounds: { min: 0.35, max: 2 },
          paymentDelayDays: 30,
          seasonality: [1.1, 1.15, 0.5, 1.05, 1.1, 1.15],
        },
        {
          code: "occasions",
          name: "Grandes occasions (noces, anniversaires, sensibles à l'image)",
          size: 300,
          growth: 0.04,
          priceElasticity: -1.2,
          refPrice: 200,
          minAcceptablePrice: 115,
          psychThresholds: [{ threshold: 210, penalty: 0.92 }],
          marketingSensitivity: 0.2,
          qualitySensitivity: 0.5,
          loyalty: 0.15,
          priceEffectBounds: { min: 0.2, max: 3 },
          paymentDelayDays: 0,
          seasonality: [0.7, 1.2, 1.5, 1.0, 0.7, 1.1],
        },
      ],
      seasonality: [0.95, 1.15, 1.0, 1.05, 0.95, 1.15],
      outsideAttraction: 0.45,
      competitionIntensity: 1.3,
    },
  },
];

/**
 * Les offres de commande de l'hôtel d'origine, sous d'autres codes : elles
 * portent sur le cœur de gamme (la chambre standard), aux mêmes conditions.
 */
/**
 * La référence de chaque commande, et son prix quand la référence n'est pas
 * celle du mono : le séminaire clé en main loge en supérieure, tout le reste en standard.
 */
const CIBLES: Record<string, { productCode: string; price?: number }> = {
  hotel_offer_congres: { productCode: "chambre-standard" },
  hotel_offer_tour_operateur: { productCode: "chambre-standard" },
  hotel_offer_chantier: { productCode: "chambre-standard" },
  hotel_offer_seminaire: { productCode: "chambre-superieure" },
  hotel_offer_compagnie_aerienne: { productCode: "chambre-standard" },
  hotel_offer_plateforme_flash: { productCode: "chambre-standard" },
};

const ORDER_OFFERS = (hotelScenario.orderOffers ?? []).map((o) => {
  const cible = CIBLES[o.code];
  if (!cible) throw new Error(`Commande exceptionnelle sans référence : ${o.code}`);
  return {
    ...o,
    ...cible,
    code: o.code.replace(/^hotel_offer_/, "hotelg_offer_"),
  };
});

const rawHotelGamme = {
  ...hotelScenario,
  code: "hotel-gamme",
  version: "0.1.0",
  market: STANDARD_MARKET,
  // Le produit « de référence » des affichages mono-produit : le cœur de gamme.
  product: {
    code: "chambre-standard",
    materialCostPerUnit: 12,
    otherVariableCostPerUnit: 9,
    hoursPerUnit: 0.75,
  },
  products: GAMME,
  orderOffers: ORDER_OFFERS,
  // Le levier communication : la notoriété de L'ESCALE porte les trois
  // chambres (jusqu'à +25 %, avec retard, qui s'use sans entretien), et un
  // axe. Le prix parle aux vacanciers et aux groupes, l'image aux habitués
  // d'affaires et aux grandes occasions, la qualité aux escapades.
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
    weights: hotelScenario.scoring.weights,
    benchmarks: {
      ...hotelScenario.scoring.benchmarks,
      revenue: { min: 200000, target: 450000 },
    },
  },
} satisfies EngineScenarioConfig;

/** Config L'ESCALE · gamme validée à l'import. */
export const hotelGammeScenario: EngineScenarioConfig = parseScenarioConfig(rawHotelGamme);

/**
 * État initial d'une entreprise L'ESCALE · gamme : celui de l'hôtel d'origine
 * (60 chambres, 900 000 € de crédit immobilier, quatorze salariés), et rien
 * à reporter sur aucune chambre : une nuitée ne se stocke pas.
 */
export function hotelGammeCompany(
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
    machineCapacity: 5400,
    availability: 1,
    headcount: 14,
    hoursPerEmployee: 455,
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    finishedGoodsByProduct: Object.fromEntries(
      GAMME.map((p) => [p.code, { quantity: 0, unitCost: 0 }]),
    ),
    fleet: [
      { typeCode: "chambre_standard", count: 4, acquiredRound: 0, bookValue: 184000 },
      { typeCode: "chambre_renovee", count: 1, acquiredRound: 0, bookValue: 126000 },
    ],
    loans: [{ remaining: 900000, perRound: 22500 }],
    finance: {
      fixedAssetsNet: 1450000,
      inventoryValue: 0,
      receivables: 62000,
      cash: 64000,
      equity: 660000,
      financialDebt: 900000,
      // 30 jours de blanchisserie et de petits-déjeuners : le délai des énoncés
      payables: 16000,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Les mêmes établissements concurrents : ils vendent eux aussi les trois chambres. */
export const hotelGammeBots: { id: string; name: string; profile: BotProfile }[] = hotelBots;
