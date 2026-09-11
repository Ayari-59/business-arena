import type { CompanyState, EngineScenarioConfig, ProductDef } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";
import { bistrotBots, bistrotCompany, bistrotScenario } from "../bistrot";

/**
 * Scénario RESTAURANT · GAMME — « LA TABLE D'AUGUSTIN » en quatre offres :
 * la formule du midi, la carte du soir, les banquets et repas d'entreprise,
 * et une activité traiteur qui n'existe qu'à l'état de projet, 6 tours
 * trimestriels.
 *
 * Le bistrot d'origine vend « le couvert » à un ticket moyen. Ici, chaque
 * offre a son ticket, sa clientèle, son ratio matières et son temps de
 * brigade, et toutes se partagent la même cuisine (9 000 couverts par
 * trimestre) et la même brigade (dix personnes, 4 550 heures). Le MIX des
 * couverts servis décide du ticket moyen et de la marge autant que le
 * remplissage, et une offre neuve se bâtit avant de se vendre : le traiteur
 * demande 18 000 € de matériel de transport, de conditionnement et
 * d'agrément avant le premier buffet, et pas avant le tour 2.
 *
 * Calibration (base trimestrielle) : 9 000 couverts en cuisine ; midi 27 €
 * (marge 17,50 €), soir 38 € (marge 23 €), banquets 33 € (marge 20,50 €),
 * traiteur 27 € (marge 15 €) ; 90 000 € de structure décaissée → seuil
 * ≈ 4 400 couverts au mix usuel, contre 4 500 en un seul ticket moyen : la
 * formule du midi fait le volume, la carte du soir fait la marge.
 */

const bistrotSegments = bistrotScenario.market.segments;
const midiAffaires = bistrotSegments.find((s) => s.code === "midi_affaires")!;
const soirLocaux = bistrotSegments.find((s) => s.code === "soir_locaux")!;
const groupes = bistrotSegments.find((s) => s.code === "groupes")!;

/**
 * Le marché de la formule du midi, cœur de gamme : les déjeuners d'affaires
 * du bistrot d'origine et les habitués du quartier. C'est aussi le marché
 * « du scénario » (`market`) : celui que lisent les affichages mono-produit et
 * le prix de référence des bots.
 */
const MIDI_MARKET = {
  segments: [
    { ...midiAffaires, size: 7800 },
    {
      code: "midi_habitues",
      name: "Habitués du quartier (retraités, commerçants)",
      size: 2000,
      growth: 0.02,
      priceElasticity: -1.3,
      refPrice: 25,
      minAcceptablePrice: 15,
      psychThresholds: [{ threshold: 28, penalty: 0.9 }],
      marketingSensitivity: 0.1,
      qualitySensitivity: 0.3,
      loyalty: 0.5,
      priceEffectBounds: { min: 0.25, max: 3 },
      paymentDelayDays: 0,
      seasonality: [1.0, 1.05, 0.75, 1.0, 1.0, 1.05],
    },
  ],
  seasonality: [0.95, 1.05, 0.7, 1.1, 0.95, 1.05],
  outsideAttraction: bistrotScenario.market.outsideAttraction,
  competitionIntensity: bistrotScenario.market.competitionIntensity,
};

const GAMME: ProductDef[] = [
  {
    code: "formule-midi",
    name: "Formule du midi",
    // entrée-plat ou plat-dessert : moins de denrées, un service rapide
    materialCostPerUnit: 7.5,
    otherVariableCostPerUnit: 2,
    hoursPerUnit: 0.4,
    market: MIDI_MARKET,
  },
  {
    code: "carte-soir",
    name: "Carte du soir",
    // le couvert du bistrot d'origine, en plus soigné : produits, dressage, service à table
    materialCostPerUnit: 12,
    otherVariableCostPerUnit: 3,
    hoursPerUnit: 0.6,
    market: {
      segments: [
        {
          // la clientèle du soir du bistrot d'origine, qui paie la carte deux euros
          // de plus que le ticket moyen : mêmes ressorts
          ...soirLocaux,
          size: 9600,
          refPrice: 38,
          minAcceptablePrice: 21,
        },
        {
          code: "soir_gourmets",
          name: "Gourmets et grandes occasions (sensibles à l'assiette)",
          size: 2600,
          growth: 0.05,
          priceElasticity: -0.9,
          refPrice: 48,
          minAcceptablePrice: 26,
          psychThresholds: [{ threshold: 50, penalty: 0.9 }],
          marketingSensitivity: 0.22,
          qualitySensitivity: 0.55,
          loyalty: 0.18,
          priceEffectBounds: { min: 0.2, max: 3 },
          paymentDelayDays: 0,
          seasonality: [0.85, 1.1, 0.9, 1.3, 0.85, 1.1],
        },
      ],
      seasonality: [0.9, 1.05, 0.9, 1.2, 0.9, 1.05],
      outsideAttraction: 0.5,
      competitionIntensity: 1.6,
    },
  },
  {
    code: "banquets",
    name: "Banquets et repas d'entreprise",
    // menu unique servi en une fois : des denrées maîtrisées, une salle privatisée
    materialCostPerUnit: 10,
    otherVariableCostPerUnit: 2.5,
    hoursPerUnit: 0.45,
    market: {
      segments: [
        {
          // les banquets du bistrot d'origine : menu unique, salle privatisée,
          // deux euros au-dessus du ticket moyen
          ...groupes,
          size: 5000,
          refPrice: 33,
          minAcceptablePrice: 19,
        },
        {
          code: "associations",
          name: "Associations et fêtes de famille",
          size: 1400,
          growth: 0.03,
          priceElasticity: -1.1,
          refPrice: 30,
          minAcceptablePrice: 17,
          psychThresholds: [{ threshold: 34, penalty: 0.9 }],
          marketingSensitivity: 0.1,
          qualitySensitivity: 0.3,
          loyalty: 0.35,
          priceEffectBounds: { min: 0.3, max: 2.6 },
          paymentDelayDays: 0,
          seasonality: [0.8, 1.1, 0.6, 1.5, 0.8, 1.1],
        },
      ],
      seasonality: [0.75, 1.0, 0.55, 1.6, 0.75, 1.0],
      outsideAttraction: 0.45,
      competitionIntensity: 1.4,
    },
  },
  {
    code: "traiteur",
    name: "Traiteur · buffets livrés",
    // produit en cuisine, livré sur place : moins de denrées, du transport et des emballages
    materialCostPerUnit: 8.5,
    otherVariableCostPerUnit: 3.5,
    hoursPerUnit: 0.35,
    // Une offre se bâtit avant de se vendre : véhicule frigorifique, matériel
    // de conditionnement, agrément sanitaire. 18 000 € de R&D (un cinquième
    // d'un trimestre de structure) avant le premier buffet, et pas avant le tour 2.
    development: { cost: 18000, availableFromRound: 2 },
    market: {
      segments: [
        {
          code: "entreprises_traiteur",
          name: "Entreprises du quartier (plateaux et buffets, 45 j)",
          size: 2400,
          growth: 0.06,
          priceElasticity: -1.2,
          refPrice: 27,
          minAcceptablePrice: 15,
          psychThresholds: [{ threshold: 30, penalty: 0.9 }],
          marketingSensitivity: 0.15,
          qualitySensitivity: 0.35,
          loyalty: 0.4,
          priceEffectBounds: { min: 0.25, max: 3 },
          paymentDelayDays: 45,
          seasonality: [1.0, 1.1, 0.55, 1.3, 1.0, 1.1],
        },
        {
          code: "collectivites_traiteur",
          name: "Collectivités et associations (réceptions, 60 j)",
          size: 1400,
          growth: 0.04,
          priceElasticity: -1.4,
          refPrice: 23,
          minAcceptablePrice: 14,
          psychThresholds: [],
          marketingSensitivity: 0.08,
          qualitySensitivity: 0.25,
          loyalty: 0.35,
          priceEffectBounds: { min: 0.3, max: 2.6 },
          paymentDelayDays: 60,
          seasonality: [0.9, 1.1, 0.5, 1.2, 0.9, 1.2],
        },
      ],
      seasonality: [0.95, 1.05, 0.6, 1.25, 0.95, 1.1],
      outsideAttraction: 0.5,
      competitionIntensity: 1.5,
    },
  },
];

/**
 * Les offres de commande du bistrot d'origine, sous d'autres codes : elles
 * portent sur le cœur de gamme (la formule du midi), aux mêmes conditions.
 */
/**
 * La référence de chaque commande, et son prix quand la référence n'est pas
 * celle du mono : mariages et buffets d'inauguration sont des banquets, la cantine, le
 * tournage et la livraison de la formule du midi, les journées d'étude de la
 * carte du soir.
 */
const CIBLES: Record<string, { productCode: string; price?: number }> = {
  bistrot_offer_mariage: { productCode: "banquets" },
  bistrot_offer_cantine_entreprise: { productCode: "formule-midi" },
  bistrot_offer_traiteur: { productCode: "banquets" },
  bistrot_offer_tournage: { productCode: "formule-midi" },
  bistrot_offer_seminaire: { productCode: "carte-soir" },
  bistrot_offer_livraison: { productCode: "formule-midi" },
};

const ORDER_OFFERS = (bistrotScenario.orderOffers ?? []).map((o) => {
  const cible = CIBLES[o.code];
  if (!cible) throw new Error(`Commande exceptionnelle sans référence : ${o.code}`);
  return {
    ...o,
    ...cible,
    code: o.code.replace(/^bistrot_offer_/, "bistrotg_offer_"),
  };
});

const rawBistrotGamme = {
  ...bistrotScenario,
  code: "bistrot-gamme",
  version: "0.1.0",
  market: MIDI_MARKET,
  // Le produit « de référence » des affichages mono-produit : le cœur de gamme.
  product: {
    code: "formule-midi",
    materialCostPerUnit: 7.5,
    otherVariableCostPerUnit: 2,
    hoursPerUnit: 0.4,
  },
  products: GAMME,
  orderOffers: ORDER_OFFERS,
  // Le levier R&D : au-delà du coût de développement, la R&D élève le niveau
  // technique d'une offre (carte retravaillée, techniques, formation de la
  // brigade) — jusqu'à +12 % de qualité perçue, avec retard, et qui s'érode de
  // moitié par tour sans entretien. Échelle : 5 000 € par trimestre donnent
  // environ +4 % à l'équilibre.
  rd: { techScale: 5000, techSensitivity: 0.08, techMax: 0.12, techInertia: 0.5 },
  // Le levier communication : la réputation de la maison porte les quatre
  // offres (jusqu'à +25 %, avec retard, qui s'use vite en restauration), et
  // un axe. La qualité parle aux gourmets, l'image aux habitués et aux
  // grandes occasions, le prix aux déjeuners d'affaires et aux collectivités.
  communication: {
    brandScale: 6000,
    brandSensitivity: 0.18,
    brandMax: 0.25,
    brandInertia: 0.45,
    axisFit: 1.3,
    axisMisfit: 0.7,
    axisSwitchDecay: 0.6,
  },
  scoring: {
    weights: bistrotScenario.scoring.weights,
    benchmarks: {
      ...bistrotScenario.scoring.benchmarks,
      revenue: { min: 100000, target: 260000 },
    },
  },
} satisfies EngineScenarioConfig;

/** Config LA TABLE D'AUGUSTIN · gamme validée à l'import. */
export const bistrotGammeScenario: EngineScenarioConfig = parseScenarioConfig(rawBistrotGamme);

/**
 * État initial d'une entreprise LA TABLE D'AUGUSTIN · gamme : celui du bistrot
 * d'origine (70 couverts, deux cuisines, une brigade de dix, un emprunt
 * d'installation), et rien à reporter sur aucune offre : rien ne se garde.
 */
export function bistrotGammeCompany(
  id: string,
  name: string,
  controller: "human" | "bot",
  botProfile?: BotProfile,
): CompanyState {
  return {
    ...bistrotCompany(id, name, controller, botProfile),
    finishedGoodsByProduct: Object.fromEntries(
      GAMME.map((p) => [p.code, { quantity: 0, unitCost: 0 }]),
    ),
  };
}

/** Les mêmes tables concurrentes : elles servent elles aussi les quatre offres. */
export const bistrotGammeBots: { id: string; name: string; profile: BotProfile }[] = bistrotBots;
