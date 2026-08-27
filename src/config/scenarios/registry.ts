import type { BotProfile } from "../../engine/bots";
import type { CompanyState, EngineScenarioConfig } from "../../engine/types";
import type { SituationDef } from "./nova/situations";
import { novaBots, novaCompany, novaScenario } from "./nova";
import { NOVA_SITUATIONS } from "./nova/situations";

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
  /** La capacité (« Capacité machine », « Chambres », « Places assises »). */
  capacityLabel: string;
  /** Ce que devient l'invendu (« Stock », « Capacité perdue »). */
  leftoverLabel: string;
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
    capacityLabel: "Capacité machine",
    leftoverLabel: "Stock",
  },
  scenario: novaScenario,
  company: novaCompany,
  bots: novaBots,
  situations: NOVA_SITUATIONS,
};

/** Tous les scénarios jouables, dans l'ordre d'affichage du sélecteur. */
export const SCENARIOS: ScenarioDefinition[] = [NOVA_DEFINITION];

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
