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
  // Le levier R&D : au-delà du coût de développement, la R&D élève le niveau
  // technique d'une offre (méthodes, outils, veille) — jusqu'à +12 % de
  // qualité perçue, avec retard, et qui s'érode de moitié par tour sans
  // entretien. Échelle : 8 000 € par trimestre donnent environ +4 % à l'équilibre.
  rd: { techScale: 8000, techSensitivity: 0.08, techMax: 0.12, techInertia: 0.5 },
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
