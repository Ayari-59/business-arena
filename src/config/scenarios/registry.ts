import type { BotProfile } from "../../engine/bots";
import type { CompanyState, EngineScenarioConfig } from "../../engine/types";
import type { SituationDef } from "./situation-kit";
import {
  ABONNEMENT_KPIS,
  COMMERCE_KPIS,
  ECOMMERCE_KPIS,
  HOTELLERIE_KPIS,
  INDUSTRIE_KPIS,
  RESTAURATION_KPIS,
  SERVICES_KPIS,
  type SectorKpiDef,
} from "./sector-kpis";
import { novaBots, novaCompany, novaScenario } from "./nova";
import { NOVA_SITUATIONS } from "./nova/situations";
import { boutiqueBots, boutiqueCompany, boutiqueScenario } from "./boutique";
import { BOUTIQUE_SITUATIONS } from "./boutique/situations";
import { hotelBots, hotelCompany, hotelScenario } from "./hotel";
import { HOTEL_SITUATIONS } from "./hotel/situations";
import { bistrotBots, bistrotCompany, bistrotScenario } from "./bistrot";
import { BISTROT_SITUATIONS } from "./bistrot/situations";
import { conseilBots, conseilCompany, conseilScenario } from "./conseil";
import { CONSEIL_SITUATIONS } from "./conseil/situations";
import { ecommerceBots, ecommerceCompany, ecommerceScenario } from "./ecommerce";
import { ECOMMERCE_SITUATIONS } from "./ecommerce/situations";
import { fitnessBots, fitnessCompany, fitnessScenario } from "./fitness";
import { FITNESS_SITUATIONS } from "./fitness/situations";

/**
 * Registre des scénarios (doc 01 §4) : un scénario n'est pas du code, c'est
 * une DONNÉE — configuration économique, entreprise de départ, concurrents et
 * situations pédagogiques réunis en une entrée. Ajouter un secteur, c'est
 * ajouter une entrée ici : ni le moteur ni les services ne bougent.
 *
 * Le vocabulaire fait partie du scénario : on ne vend pas des « unités » dans
 * un hôtel, on vend des nuitées. `vocabulary` porte ces mots jusqu'à l'arène.
 */

export type Sector =
  | "industrie"
  | "commerce"
  | "ecommerce"
  | "hotellerie"
  | "restauration"
  | "services"
  | "abonnement";

export const SECTOR_LABELS: Record<Sector, string> = {
  industrie: "Industrie",
  commerce: "Commerce",
  ecommerce: "E-commerce",
  hotellerie: "Hôtellerie",
  restauration: "Restauration",
  services: "Services",
  abonnement: "Abonnement",
};

export interface ScenarioVocabulary {
  /** Ce que l'entreprise vend, au singulier et au pluriel (« nuitée »/« nuitées »). */
  unit: string;
  units: string;
  /** Le verbe de l'activité : « Production », « Approvisionnement », « Service »… */
  productionLabel: string;
  /** Ce que le joueur décide en volume (« Plan de production », « Couverts à servir »). */
  productionPlanLabel: string;
  /** Le prix (« Prix de vente », « Prix moyen par nuitée », « Ticket moyen »). */
  priceLabel: string;
  /** Ce que devient l'invendu (« Stock », « Capacité perdue »). */
  leftoverLabel: string;

  // --- Panneau de capacité : un hôtel n'a pas de « machines » ---------------
  /** Titre du panneau (« Capacité de production », « Capacité d'accueil »). */
  capacityPanelTitle: string;
  /** Le plafond PHYSIQUE (« Capacité machine », « Chambres ouvertes »). */
  capacityLabel: string;
  /** Le même en un mot, pour la ligne « Goulot » (« Machine », « Chambres »). */
  capacityBottleneckLabel: string;
  /** Le conseil donné quand le plafond physique est la contrainte active. */
  capacityBottleneckHint: string;
  /** Le plafond HUMAIN (« Capacité main-d'œuvre », « Capacité brigade »). */
  laborLabel: string;
  /** Le conseil donné quand la main-d'œuvre est la contrainte active. */
  laborBottleneckHint: string;
  /** Ce que la capacité compte par tour (« enceintes/tour », « nuitées/tour »). */
  perRoundLabel: string;
}

export interface ScenarioDefinition {
  code: string;
  title: string;
  sector: Sector;
  /** Une phrase : ce que l'élève dirige. */
  tagline: string;
  /** Le pitch affiché à l'enseignant au moment de choisir. */
  summary: string;
  /** Nom de l'entreprise que dirige le joueur (partie solo). */
  playerTeamName: string;
  vocabulary: ScenarioVocabulary;
  scenario: EngineScenarioConfig;
  company: (
    id: string,
    name: string,
    controller: "human" | "bot",
    botProfile?: BotProfile,
  ) => CompanyState;
  bots: { id: string; name: string; profile: BotProfile }[];
  situations: SituationDef[];
  /**
   * Les indicateurs du métier. Le compte de résultat est le même partout,
   * mais on ne pilote pas un hôtel avec les chiffres d'un atelier.
   */
  kpis: SectorKpiDef[];
}

export const NOVA_DEFINITION: ScenarioDefinition = {
  code: novaScenario.code,
  title: "NOVA · Prenez les commandes",
  sector: "industrie",
  tagline: "Fabricant d'enceintes portables.",
  summary:
    "Un atelier, quatre opérateurs, deux concurrents déjà installés. Capacité de production, seuil de rentabilité, stock qui immobilise la trésorerie et un prix à tenir face à la casse.",
  playerTeamName: "NOVA",
  vocabulary: {
    unit: "enceinte",
    units: "enceintes",
    productionLabel: "Production",
    productionPlanLabel: "Plan de production",
    priceLabel: "Prix de vente",
    leftoverLabel: "Stock",
    capacityPanelTitle: "Capacité de production",
    capacityLabel: "Capacité machine",
    capacityBottleneckLabel: "Machine",
    capacityBottleneckHint:
      "Vos machines limitent la production : l'investissement capacitaire prend effet au tour suivant.",
    laborLabel: "Capacité main-d'œuvre",
    laborBottleneckHint:
      "Votre main-d'œuvre limite la production : envisagez d'embaucher ou de former vos salariés pour augmenter la productivité.",
    perRoundLabel: "enceintes/tour",
  },
  scenario: novaScenario,
  company: novaCompany,
  bots: novaBots,
  situations: NOVA_SITUATIONS,
  kpis: INDUSTRIE_KPIS,
};

export const BOUTIQUE_DEFINITION: ScenarioDefinition = {
  code: boutiqueScenario.code,
  title: "MAILLE & CO · Tenez la boutique",
  sector: "commerce",
  tagline: "Concept store de prêt-à-porter en centre-ville.",
  summary:
    "Vous n'avez rien à fabriquer : vous achetez pour revendre. Coefficient multiplicateur, choix des circuits d'achat, stock qui dort en réserve et pic de Noël à ne pas manquer.",
  playerTeamName: "MAILLE & CO",
  vocabulary: {
    unit: "article",
    units: "articles",
    productionLabel: "Approvisionnement",
    productionPlanLabel: "Articles à mettre en rayon",
    priceLabel: "Prix de vente moyen",
    leftoverLabel: "Stock en réserve",
    capacityPanelTitle: "Capacité de traitement",
    capacityLabel: "Réserve et linéaire",
    capacityBottleneckLabel: "Réserve",
    capacityBottleneckHint:
      "Votre réserve et votre linéaire limitent ce que la boutique peut écouler : agrandir prend effet au tour suivant.",
    laborLabel: "Capacité de l'équipe",
    laborBottleneckHint:
      "Votre équipe de vente limite le flux en boutique : envisagez d'embaucher ou de former vos vendeuses.",
    perRoundLabel: "articles/tour",
  },
  scenario: boutiqueScenario,
  company: boutiqueCompany,
  bots: boutiqueBots,
  situations: BOUTIQUE_SITUATIONS,
  kpis: COMMERCE_KPIS,
};

export const HOTEL_DEFINITION: ScenarioDefinition = {
  code: hotelScenario.code,
  title: "L'ESCALE · Remplissez l'hôtel",
  sector: "hotellerie",
  tagline: "Hôtel 3 étoiles de 60 chambres en ville moyenne.",
  summary:
    "La chambre vide de ce soir ne se rattrape jamais. Yield management, taux d'occupation d'équilibre, commissions des plateformes et saison qui fait tout basculer.",
  playerTeamName: "L'ESCALE",
  vocabulary: {
    unit: "nuitée",
    units: "nuitées",
    productionLabel: "Ouverture",
    productionPlanLabel: "Nuitées mises en vente",
    priceLabel: "Prix moyen par nuitée",
    leftoverLabel: "Nuitées perdues",
    capacityPanelTitle: "Capacité d'accueil",
    capacityLabel: "Chambres ouvertes",
    capacityBottleneckLabel: "Chambres",
    capacityBottleneckHint:
      "Vos chambres limitent le remplissage : rénover et rouvrir des chambres prend effet au tour suivant.",
    laborLabel: "Capacité des équipes",
    laborBottleneckHint:
      "Vos équipes d'étage et de réception limitent le nombre de chambres exploitables : envisagez d'embaucher ou de former.",
    perRoundLabel: "nuitées/tour",
  },
  scenario: hotelScenario,
  company: hotelCompany,
  bots: hotelBots,
  situations: HOTEL_SITUATIONS,
  kpis: HOTELLERIE_KPIS,
};

export const BISTROT_DEFINITION: ScenarioDefinition = {
  code: bistrotScenario.code,
  title: "LA TABLE D'AUGUSTIN · Tenez le service",
  sector: "restauration",
  tagline: "Bistrot de 70 couverts, midi et soir.",
  summary:
    "Le couvert non servi est perdu, et la denrée préparée non vendue part à la poubelle. Ratio matières, double contrainte salle et brigade, banquets de fin d'année.",
  playerTeamName: "LA TABLE D'AUGUSTIN",
  vocabulary: {
    unit: "couvert",
    units: "couverts",
    productionLabel: "Service",
    productionPlanLabel: "Couverts à préparer",
    priceLabel: "Ticket moyen",
    leftoverLabel: "Denrées perdues",
    capacityPanelTitle: "Capacité de service",
    capacityLabel: "Places en salle",
    capacityBottleneckLabel: "Salle",
    capacityBottleneckHint:
      "Votre salle limite le nombre de couverts : couvrir la terrasse prend effet au tour suivant.",
    laborLabel: "Capacité brigade",
    laborBottleneckHint:
      "Votre brigade limite le service : des places libres ne servent à rien sans personnel pour les tenir. Embauchez ou formez.",
    perRoundLabel: "couverts/tour",
  },
  scenario: bistrotScenario,
  company: bistrotCompany,
  bots: bistrotBots,
  situations: BISTROT_SITUATIONS,
  kpis: RESTAURATION_KPIS,
};

export const CONSEIL_DEFINITION: ScenarioDefinition = {
  code: conseilScenario.code,
  title: "ATLAS CONSEIL · Vendez le temps de vos équipes",
  sector: "services",
  tagline: "Cabinet de conseil et bureau d'études, 12 consultants.",
  summary:
    "La journée non vendue est perdue et la capacité ne s'achète pas : elle se recrute. Taux d'occupation, poste clients qui étrangle la trésorerie, salaires qui tombent même carnet vide.",
  playerTeamName: "ATLAS CONSEIL",
  vocabulary: {
    unit: "jour-conseil",
    units: "jours-conseil",
    productionLabel: "Staffing",
    productionPlanLabel: "Jours à staffer",
    priceLabel: "Taux journalier moyen",
    leftoverLabel: "Jours non facturés",
    capacityPanelTitle: "Capacité de staffing",
    capacityLabel: "Capacité des locaux",
    capacityBottleneckLabel: "Locaux",
    capacityBottleneckHint:
      "Vos locaux limitent la taille du cabinet, cas rare : la contrainte habituelle est l'effectif.",
    laborLabel: "Jours-consultants disponibles",
    laborBottleneckHint:
      "Vos consultants SONT la capacité du cabinet : elle ne s'achète pas, elle se recrute. Embaucher produit son effet au tour suivant.",
    perRoundLabel: "jours/tour",
  },
  scenario: conseilScenario,
  company: conseilCompany,
  bots: conseilBots,
  situations: CONSEIL_SITUATIONS,
  kpis: SERVICES_KPIS,
};


export const ECOMMERCE_DEFINITION: ScenarioDefinition = {
  code: ecommerceScenario.code,
  title: "PIXEL & CO · Achetez votre trafic",
  sector: "ecommerce",
  tagline: "Pure player de décoration et petit mobilier.",
  summary:
    "La vitrine ne coûte rien, mais le trafic s'achète. Coût d'acquisition, panier moyen, logistique et retours qui rongent la marge, et un Black Friday qui fait le tiers de l'année.",
  playerTeamName: "PIXEL & CO",
  vocabulary: {
    unit: "commande",
    units: "commandes",
    productionLabel: "Préparation",
    productionPlanLabel: "Commandes à préparer",
    priceLabel: "Panier moyen visé",
    leftoverLabel: "Stock en entrepôt",
    capacityPanelTitle: "Capacité logistique",
    capacityLabel: "Préparation de commandes",
    capacityBottleneckLabel: "Entrepôt",
    capacityBottleneckHint:
      "Votre entrepôt limite les expéditions : mécaniser la préparation prend effet au tour suivant.",
    laborLabel: "Capacité de l'équipe",
    laborBottleneckHint:
      "Votre équipe logistique limite les expéditions : une commande non préparée est une commande annulée. Embauchez ou formez.",
    perRoundLabel: "commandes/tour",
  },
  scenario: ecommerceScenario,
  company: ecommerceCompany,
  bots: ecommerceBots,
  situations: ECOMMERCE_SITUATIONS,
  kpis: ECOMMERCE_KPIS,
};

export const FITNESS_DEFINITION: ScenarioDefinition = {
  code: fitnessScenario.code,
  title: "VOLT FITNESS · Gardez vos adhérents",
  sector: "abonnement",
  tagline: "Salle de sport de 1 200 m² en périphérie.",
  summary:
    "Le client ne s'achète pas une fois, il se garde. Taux d'attrition, valeur vie client, revenus récurrents, et une saison qui remplit la salle en janvier pour la vider en juillet.",
  playerTeamName: "VOLT FITNESS",
  vocabulary: {
    unit: "adhérent",
    units: "adhérents",
    productionLabel: "Adhésions",
    productionPlanLabel: "Adhérents à accueillir",
    priceLabel: "Abonnement trimestriel",
    leftoverLabel: "Places non vendues",
    capacityPanelTitle: "Capacité d'accueil",
    capacityLabel: "Places sur le plateau",
    capacityBottleneckLabel: "Plateau",
    capacityBottleneckHint:
      "Votre surface limite le nombre d'adhérents : ouvrir un plateau supplémentaire prend effet au tour suivant.",
    laborLabel: "Capacité d'encadrement",
    laborBottleneckHint:
      "Vos coachs limitent l'accueil : sur-vendre des abonnements sans encadrement dégrade l'expérience, donc la rétention. Embauchez avant de vendre.",
    perRoundLabel: "adhérents/tour",
  },
  scenario: fitnessScenario,
  company: fitnessCompany,
  bots: fitnessBots,
  situations: FITNESS_SITUATIONS,
  kpis: ABONNEMENT_KPIS,
};

/** Tous les scénarios jouables, dans l'ordre d'affichage du sélecteur. */
export const SCENARIOS: ScenarioDefinition[] = [
  NOVA_DEFINITION,
  BOUTIQUE_DEFINITION,
  HOTEL_DEFINITION,
  BISTROT_DEFINITION,
  CONSEIL_DEFINITION,
  ECOMMERCE_DEFINITION,
  FITNESS_DEFINITION,
];

export const DEFAULT_SCENARIO_CODE = NOVA_DEFINITION.code;

const byCode = new Map(SCENARIOS.map((s) => [s.code, s]));

/**
 * Définition d'un code de scénario. Un code inconnu (partie créée avec une
 * version antérieure, snapshot exotique) retombe sur NOVA plutôt que de faire
 * planter une partie en cours.
 */
export function scenarioByCode(code: string | undefined | null): ScenarioDefinition {
  return (code ? byCode.get(code) : undefined) ?? NOVA_DEFINITION;
}

/** Toutes les situations, tous scénarios confondus (référentiel à semer). */
export const ALL_SITUATIONS: SituationDef[] = SCENARIOS.flatMap((s) => s.situations);

export const situationByCode = new Map(ALL_SITUATIONS.map((s) => [s.code, s]));

/**
 * Valeurs économiques d'un scénario, mises en forme pour l'affichage en
 * filigrane du panneau enseignant. `null` = levier que ce scénario n'ouvre
 * pas (pas de bloc trésorerie, pas d'échéancier d'emprunt).
 */
export function economicDefaults(d: ScenarioDefinition): Record<string, string | null> {
  const s = d.scenario;
  const pct = (v: number | undefined) =>
    v === undefined ? null : (v * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const num = (v: number | undefined) =>
    v === undefined ? null : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  // Délai client représentatif : le plus long des segments qui font crédit.
  // Ceux payés comptant ne sont pas concernés par le réglage.
  const creditDelays = s.market.segments
    .map((seg) => seg.paymentDelayDays)
    .filter((v) => v > 0);
  return {
    taxRate: pct(s.finance.taxRate),
    vatRate: pct(s.finance.vatRate ?? 0),
    customerPaymentDelayDays: num(creditDelays.length ? Math.max(...creditDelays) : 0),
    supplierPaymentDelayDays: num(s.finance.supplierPaymentDelayDays),
    loanAnnualRate: pct(s.finance.loanAnnualRate),
    loanDurationRounds: num(s.finance.loanDurationRounds),
    overdraftAnnualRate: pct(s.finance.overdraftAnnualRate),
    overdraftLimit: num(s.finance.overdraftLimit),
    discountMaxShare: pct(s.treasury?.discountMaxShare),
    factoringFeeRate: pct(s.treasury?.factoringFeeRate),
    fixedCostsPerRound: num(s.fixedCostsPerRound),
    materialCostPerUnit: num(s.product.materialCostPerUnit),
    otherVariableCostPerUnit: num(s.product.otherVariableCostPerUnit),
    depreciationPerRound: num(s.finance.depreciationPerRound),
    baseDefectRate: pct(s.qualityCosts?.baseDefectRate ?? 0),
  };
}

/** Le scénario auquel appartient une situation — pour retrouver son vocabulaire. */
export const scenarioCodeBySituationCode = new Map(
  SCENARIOS.flatMap((d) => d.situations.map((s) => [s.code, d.code] as const)),
);
