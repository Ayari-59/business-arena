import type { BotProfile } from "../../engine/bots";
import type { CompanyState, EngineScenarioConfig } from "../../engine/types";
import type { SituationDef } from "./situation-kit";
import {
  COMMERCE_KPIS,
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

/**
 * Registre des scénarios (doc 01 §4) : un scénario n'est pas du code, c'est
 * une DONNÉE — configuration économique, entreprise de départ, concurrents et
 * situations pédagogiques réunis en une entrée. Ajouter un secteur, c'est
 * ajouter une entrée ici : ni le moteur ni les services ne bougent.
 *
 * Le vocabulaire fait partie du scénario : on ne vend pas des « unités » dans
 * un hôtel, on vend des nuitées. `vocabulary` porte ces mots jusqu'à l'arène.
 */

export type Sector = "industrie" | "commerce" | "hotellerie" | "restauration" | "services";

export const SECTOR_LABELS: Record<Sector, string> = {
  industrie: "Industrie",
  commerce: "Commerce",
  hotellerie: "Hôtellerie",
  restauration: "Restauration",
  services: "Services",
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
  title: "NOVA — Prenez les commandes",
  sector: "industrie",
  tagline: "Fabricant d'enceintes portables.",
  summary:
    "Reprenez NOVA, jeune fabricant d'enceintes portables : 6 tours pour apprendre prix, capacité, seuil de rentabilité et trésorerie.",
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
      "Vos machines limitent la production — l'investissement capacitaire prend effet au tour suivant.",
    laborLabel: "Capacité main-d'œuvre",
    laborBottleneckHint:
      "Votre main-d'œuvre limite la production — envisagez d'embaucher ou de former vos salariés pour augmenter la productivité.",
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
  title: "MAILLE & CO — Tenez la boutique",
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
      "Votre réserve et votre linéaire limitent ce que la boutique peut écouler — agrandir prend effet au tour suivant.",
    laborLabel: "Capacité de l'équipe",
    laborBottleneckHint:
      "Votre équipe de vente limite le flux en boutique — envisagez d'embaucher ou de former vos vendeuses.",
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
  title: "L'ESCALE — Remplissez l'hôtel",
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
      "Vos chambres limitent le remplissage — rénover et rouvrir des chambres prend effet au tour suivant.",
    laborLabel: "Capacité des équipes",
    laborBottleneckHint:
      "Vos équipes d'étage et de réception limitent le nombre de chambres exploitables — envisagez d'embaucher ou de former.",
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
  title: "LA TABLE D'AUGUSTIN — Tenez le service",
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
      "Votre salle limite le nombre de couverts — couvrir la terrasse prend effet au tour suivant.",
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
  title: "ATLAS CONSEIL — Vendez le temps de vos équipes",
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
      "Vos locaux limitent la taille du cabinet — cas rare : la contrainte habituelle est l'effectif.",
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

/** Tous les scénarios jouables, dans l'ordre d'affichage du sélecteur. */
export const SCENARIOS: ScenarioDefinition[] = [
  NOVA_DEFINITION,
  BOUTIQUE_DEFINITION,
  HOTEL_DEFINITION,
  BISTROT_DEFINITION,
  CONSEIL_DEFINITION,
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

/** Le scénario auquel appartient une situation — pour retrouver son vocabulaire. */
export const scenarioCodeBySituationCode = new Map(
  SCENARIOS.flatMap((d) => d.situations.map((s) => [s.code, d.code] as const)),
);
