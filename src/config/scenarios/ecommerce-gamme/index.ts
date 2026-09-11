import type { CompanyState, EngineScenarioConfig, ProductDef, SegmentConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";
import { ecommerceBots, ecommerceCompany, ecommerceScenario } from "../ecommerce";

/**
 * Scénario E-COMMERCE · GAMME — « PIXEL & CO » en quatre rayons : la
 * décoration et le textile, le petit mobilier, les luminaires, et une
 * collection de créateurs qui n'existe qu'à l'état de projet, 6 tours
 * trimestriels.
 *
 * Le pure player d'origine vend « la commande » à un panier moyen. Ici,
 * chaque rayon a son panier, sa marge, ses frais de port (un fauteuil ne
 * s'expédie pas comme un coussin), ses clientèles et sa place de marché à
 * commission, et tous se partagent le même entrepôt (7 000 commandes par
 * trimestre), la même équipe et le même budget d'acquisition. Le MIX des
 * commandes décide du panier moyen autant que le trafic, et une collection
 * neuve se bâtit avant de se vendre : la capsule de créateurs demande
 * 20 000 € de développement (sourcing, shooting, exclusivités) avant la
 * première commande, et pas avant le tour 2.
 *
 * Calibration (base trimestrielle) : 7 000 commandes en entrepôt ;
 * décoration 46 € (marge 19 €), mobilier 125 € (marge 48 €), luminaires
 * 78 € (marge 36 €), capsule 88 € (marge 40 €) ; 48 000 € de structure
 * décaissée → seuil ≈ 1 500 commandes au mix usuel AVANT budget
 * d'acquisition, contre 1 600 en un seul panier moyen : la décoration fait
 * le volume, le mobilier fait la marge, et chaque rayon a son coût
 * d'acquisition.
 */

const ecomSegments = ecommerceScenario.market.segments;
const acquisition = ecomSegments.find((s) => s.code === "acquisition")!;
const fideles = ecomSegments.find((s) => s.code === "fideles")!;
const marketplace = ecomSegments.find((s) => s.code === "marketplace")!;

/** Les trois clientèles du pure player d'origine, déclinées par rayon. */
function clienteles(
  rayon: string,
  o: {
    trafic: { size: number; refPrice: number; min: number; psych: number };
    fideles: { size: number; refPrice: number; min: number; psych: number };
    marketplace?: { size: number; refPrice: number; min: number; commission: number };
    elasticite?: number;
    qualite?: number;
  },
): SegmentConfig[] {
  const segments: SegmentConfig[] = [
    {
      ...acquisition,
      code: `${rayon}_trafic`,
      name: `${acquisition.name} · ${rayon}`,
      size: o.trafic.size,
      priceElasticity: o.elasticite ?? acquisition.priceElasticity,
      refPrice: o.trafic.refPrice,
      minAcceptablePrice: o.trafic.min,
      psychThresholds: [{ threshold: o.trafic.psych, penalty: 0.9 }],
    },
    {
      ...fideles,
      code: `${rayon}_fideles`,
      name: `${fideles.name} · ${rayon}`,
      size: o.fideles.size,
      qualitySensitivity: o.qualite ?? fideles.qualitySensitivity,
      refPrice: o.fideles.refPrice,
      minAcceptablePrice: o.fideles.min,
      psychThresholds: [{ threshold: o.fideles.psych, penalty: 0.92 }],
    },
  ];
  if (o.marketplace) {
    segments.push({
      ...marketplace,
      code: `${rayon}_marketplace`,
      name: `${marketplace.name} · ${rayon}`,
      size: o.marketplace.size,
      refPrice: o.marketplace.refPrice,
      minAcceptablePrice: o.marketplace.min,
      commissionRate: o.marketplace.commission,
    });
  }
  return segments;
}

/**
 * Le marché de la décoration, cœur de gamme : les trois clientèles du pure
 * player d'origine, à un panier plus petit. C'est aussi le marché « du
 * scénario » (`market`) : celui que lisent les affichages mono-produit et le
 * prix de référence des bots.
 */
const DECO_MARKET = {
  segments: clienteles("deco", {
    trafic: { size: 5600, refPrice: 46, min: 22, psych: 50 },
    fideles: { size: 2800, refPrice: 58, min: 30, psych: 60 },
    marketplace: { size: 3200, refPrice: 46, min: 20, commission: 0.12 },
  }),
  seasonality: ecommerceScenario.market.seasonality,
  outsideAttraction: ecommerceScenario.market.outsideAttraction,
  competitionIntensity: ecommerceScenario.market.competitionIntensity,
};

const GAMME: ProductDef[] = [
  {
    code: "decoration",
    name: "Décoration et textile",
    // petits colis : la marchandise et un port léger
    materialCostPerUnit: 18,
    otherVariableCostPerUnit: 9,
    hoursPerUnit: 0.2,
    market: DECO_MARKET,
  },
  {
    code: "mobilier",
    name: "Petit mobilier",
    // volumineux : un port et une préparation qui coûtent, une marge qui paie
    materialCostPerUnit: 55,
    otherVariableCostPerUnit: 22,
    hoursPerUnit: 0.4,
    market: {
      segments: clienteles("mobilier", {
        trafic: { size: 2600, refPrice: 125, min: 60, psych: 150 },
        fideles: { size: 1400, refPrice: 145, min: 75, psych: 160 },
        // les places de marché prélèvent davantage sur le mobilier
        marketplace: { size: 1800, refPrice: 125, min: 55, commission: 0.15 },
        elasticite: -2.0,
        qualite: 0.55,
      }),
      seasonality: [0.95, 1.0, 0.8, 1.45, 0.95, 1.0],
      outsideAttraction: 2.0,
      competitionIntensity: 1.9,
    },
  },
  {
    code: "luminaires",
    name: "Luminaires",
    materialCostPerUnit: 30,
    otherVariableCostPerUnit: 12,
    hoursPerUnit: 0.3,
    market: {
      segments: clienteles("luminaires", {
        trafic: { size: 3200, refPrice: 78, min: 38, psych: 90 },
        fideles: { size: 1600, refPrice: 92, min: 48, psych: 100 },
        marketplace: { size: 2000, refPrice: 78, min: 34, commission: 0.12 },
        elasticite: -2.2,
      }),
      // l'automne et l'hiver : on éclaire quand les jours raccourcissent
      seasonality: [0.85, 0.9, 0.85, 1.7, 0.95, 0.9],
      outsideAttraction: 2.1,
      competitionIntensity: 2.0,
    },
  },
  {
    code: "capsule",
    name: "Collection de créateurs",
    // expédiée par les ateliers, sans stock à porter : un port et un emballage soignés
    materialCostPerUnit: 38,
    otherVariableCostPerUnit: 10,
    hoursPerUnit: 0.25,
    // Une collection se bâtit avant de se vendre : sourcing des créateurs,
    // exclusivités, shooting. 20 000 € de R&D avant la première commande,
    // et pas avant le tour 2.
    development: { cost: 20000, availableFromRound: 2 },
    market: {
      segments: [
        {
          ...fideles,
          code: "capsule_fideles",
          name: "Base installée · en quête d'exclusivité",
          size: 1800,
          growth: 0.06,
          priceElasticity: -0.8,
          refPrice: 96,
          minAcceptablePrice: 50,
          psychThresholds: [{ threshold: 100, penalty: 0.92 }],
          marketingSensitivity: 0.3,
          qualitySensitivity: 0.7,
          loyalty: 0.5,
        },
        {
          ...acquisition,
          code: "capsule_trafic",
          name: "Nouveaux clients · réseaux et créateurs",
          size: 1600,
          growth: 0.08,
          priceElasticity: -1.8,
          refPrice: 88,
          minAcceptablePrice: 45,
          psychThresholds: [{ threshold: 100, penalty: 0.9 }],
          marketingSensitivity: 1.0,
        },
      ],
      // la capsule vit du bouche-à-oreille et des fêtes
      seasonality: [0.9, 1.0, 0.85, 1.5, 0.95, 1.0],
      outsideAttraction: 1.6,
      competitionIntensity: 1.6,
    },
  },
];

/**
 * Les offres de commande du pure player d'origine, sous d'autres codes : elles
 * portent sur le cœur de gamme (la décoration), aux mêmes conditions.
 */
/**
 * La référence de chaque commande, et son prix quand la référence n'est pas
 * celle du mono : le groupe hôtelier rééquipe ses chambres en mobilier (108 € la commande,
 * contre 125 € au prix usuel), la créatrice signe des luminaires, le reste est
 * de la décoration.
 */
const CIBLES: Record<string, { productCode: string; price?: number }> = {
  ecom_offer_coffrets_ce: { productCode: "decoration" },
  ecom_offer_flash_marketplace: { productCode: "decoration" },
  ecom_offer_hotelier: { productCode: "mobilier", price: 108 },
  ecom_offer_destockage: { productCode: "decoration" },
  ecom_offer_abonnement_box: { productCode: "decoration" },
  ecom_offer_influenceur: { productCode: "luminaires" },
};

const ORDER_OFFERS = (ecommerceScenario.orderOffers ?? []).map((o) => {
  const cible = CIBLES[o.code];
  if (!cible) throw new Error(`Commande exceptionnelle sans référence : ${o.code}`);
  return {
    ...o,
    ...cible,
    code: o.code.replace(/^ecom_offer_/, "ecomg_offer_"),
  };
});

const rawEcommerceGamme = {
  ...ecommerceScenario,
  code: "ecommerce-gamme",
  version: "0.1.0",
  market: DECO_MARKET,
  // Le produit « de référence » des affichages mono-produit : le cœur de gamme.
  product: {
    code: "decoration",
    materialCostPerUnit: 18,
    otherVariableCostPerUnit: 9,
    hoursPerUnit: 0.2,
  },
  products: GAMME,
  orderOffers: ORDER_OFFERS,
  // Le levier R&D : au-delà du coût de développement, la R&D élève le niveau
  // technique d'un rayon (fiches, photos, sélection) — jusqu'à +12 % de
  // qualité perçue, avec retard, et qui s'érode de moitié par tour sans
  // entretien. Échelle : 8 000 € par trimestre donnent environ +4 % à l'équilibre.
  rd: { techScale: 8000, techSensitivity: 0.08, techMax: 0.12, techInertia: 0.5 },
  // Le levier communication : la notoriété de PIXEL & CO porte les quatre
  // rayons (jusqu'à +25 %, avec retard, qui s'use sans entretien), et un
  // axe. Le prix parle au trafic payant et aux places de marché, la qualité
  // à la base installée, l'image à la capsule.
  communication: {
    brandScale: 12000,
    brandSensitivity: 0.18,
    brandMax: 0.25,
    brandInertia: 0.5,
    axisFit: 1.3,
    axisMisfit: 0.7,
    axisSwitchDecay: 0.6,
  },
  scoring: {
    weights: ecommerceScenario.scoring.weights,
    benchmarks: {
      ...ecommerceScenario.scoring.benchmarks,
      revenue: { min: 130000, target: 340000 },
    },
  },
} satisfies EngineScenarioConfig;

/** Config PIXEL & CO · gamme validée à l'import. */
export const ecommerceGammeScenario: EngineScenarioConfig = parseScenarioConfig(rawEcommerceGamme);

/** Le stock d'ouverture, rayon par rayon : 54 000 € de marchandise, comme le pure player d'origine. */
const STOCK_OUVERTURE: Record<string, { quantity: number; unitCost: number }> = {
  decoration: { quantity: 1200, unitCost: 18 },
  mobilier: { quantity: 240, unitCost: 55 },
  luminaires: { quantity: 640, unitCost: 30 },
  capsule: { quantity: 0, unitCost: 0 },
};

/**
 * État initial d'une entreprise PIXEL & CO · gamme : celui du pure player
 * d'origine (un entrepôt loué, cinq personnes, un prêt d'amorçage), et son
 * stock réparti par rayon.
 */
export function ecommerceGammeCompany(
  id: string,
  name: string,
  controller: "human" | "bot",
  botProfile?: BotProfile,
): CompanyState {
  const base = ecommerceCompany(id, name, controller, botProfile);
  const quantite = Object.values(STOCK_OUVERTURE).reduce((s, x) => s + x.quantity, 0);
  const valeur = Object.values(STOCK_OUVERTURE).reduce((s, x) => s + x.quantity * x.unitCost, 0);
  return {
    ...base,
    finishedGoods: { quantity: quantite, unitCost: valeur / quantite },
    finishedGoodsByProduct: Object.fromEntries(
      GAMME.map((p) => [p.code, { ...STOCK_OUVERTURE[p.code]! }]),
    ),
  };
}

/** Les mêmes pure players concurrents : ils vendent eux aussi les quatre rayons. */
export const ecommerceGammeBots: { id: string; name: string; profile: BotProfile }[] = ecommerceBots;
