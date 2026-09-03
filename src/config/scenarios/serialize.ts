import type { BotProfile } from "../../engine/bots";
import type { CompanyState, EngineScenarioConfig } from "../../engine/types";
import type { ScenarioDefinition, ScenarioVocabulary, Sector } from "./registry";
import type { SituationDef } from "./situation-kit";
import type { SectorKpiDef } from "./sector-kpis";
import { parseScenarioConfig } from "./schema";

/**
 * Sérialisation code ↔ données d'une `ScenarioDefinition`.
 *
 * Une définition de scénario contient une FONCTION (`company()`), donc elle
 * n'est pas directement stockable en base. Un scénario ENSEIGNANT doit pourtant
 * vivre en base comme pure donnée. Ce module fait le pont dans les deux sens :
 *
 * - `serializeDefinition` transforme une définition (code) en `StoredScenarioDefinition`
 *   (données pures) : elle capture l'état initial de l'entreprise en appelant
 *   `company()` une fois avec une identité sonde, puis retire cette identité.
 *   Les 9 secteurs intégrés suivent tous ce patron (identité plaquée sur un
 *   état constant), donc la capture est fidèle.
 * - `hydrateDefinition` reconstruit une définition complète depuis les données :
 *   `company()` redevient une fonction qui replaque l'identité sur un clone de
 *   l'état stocké. La config moteur est RE-VALIDÉE par `parseScenarioConfig`
 *   (frontière du snapshot : une base corrompue ne doit jamais atteindre le moteur).
 */

/** État initial d'entreprise SANS l'identité (id/nom/contrôleur/profil bot). */
export type StoredInitialCompany = Omit<
  CompanyState,
  "id" | "name" | "controller" | "botProfile"
>;

/** Une `ScenarioDefinition` réduite à des données stockables (sans la fonction `company`). */
export interface StoredScenarioDefinition {
  code: string;
  title: string;
  sector: Sector;
  tagline: string;
  briefing: string;
  context: string;
  dilemma: ScenarioDefinition["dilemma"];
  playerTeamName: string;
  vocabulary: ScenarioVocabulary;
  scenario: EngineScenarioConfig;
  initialCompany: StoredInitialCompany;
  bots: { id: string; name: string; profile: BotProfile }[];
  situations: SituationDef[];
  kpis: SectorKpiDef[];
}

const PROBE = "__probe__";

export function serializeDefinition(def: ScenarioDefinition): StoredScenarioDefinition {
  // Identité sonde : on l'écarte aussitôt pour ne garder que l'état constant.
  const probe = def.company(PROBE, PROBE, "human");
  const { id: _id, name: _name, controller: _controller, botProfile: _bot, ...initialCompany } =
    probe;
  return {
    code: def.code,
    title: def.title,
    sector: def.sector,
    tagline: def.tagline,
    briefing: def.briefing,
    context: def.context,
    dilemma: def.dilemma,
    playerTeamName: def.playerTeamName,
    vocabulary: def.vocabulary,
    scenario: def.scenario,
    initialCompany,
    bots: def.bots,
    situations: def.situations,
    kpis: def.kpis,
  };
}

export function hydrateDefinition(stored: StoredScenarioDefinition): ScenarioDefinition {
  // La config moteur repasse la validation zod : c'est la seule partie que le
  // moteur consomme, et une base ne fait pas foi comme le code.
  const scenario = parseScenarioConfig(stored.scenario);
  return {
    code: stored.code,
    title: stored.title,
    sector: stored.sector,
    tagline: stored.tagline,
    briefing: stored.briefing,
    context: stored.context,
    dilemma: stored.dilemma,
    playerTeamName: stored.playerTeamName,
    vocabulary: stored.vocabulary,
    scenario,
    company: (id, name, controller, botProfile) => ({
      ...structuredClone(stored.initialCompany),
      id,
      name,
      controller,
      botProfile,
    }),
    bots: stored.bots,
    situations: stored.situations,
    kpis: stored.kpis,
  };
}

/**
 * Valide un enregistrement `definition` (jsonb) chargé depuis la base et le
 * transforme en `StoredScenarioDefinition` typé. La garantie forte porte sur la
 * config moteur (`parseScenarioConfig`) ; l'habillage est vérifié
 * structurellement (présence des champs). Jette si la forme est invalide.
 */
export function parseStoredScenario(raw: unknown): StoredScenarioDefinition {
  if (!raw || typeof raw !== "object") {
    throw new Error("Scénario stocké illisible : objet attendu");
  }
  const r = raw as Record<string, unknown>;
  const requiredStrings = ["code", "title", "sector", "tagline", "briefing", "context", "playerTeamName"] as const;
  for (const key of requiredStrings) {
    if (typeof r[key] !== "string") {
      throw new Error(`Scénario stocké invalide : champ « ${key} » manquant ou non textuel`);
    }
  }
  if (!r.initialCompany || typeof r.initialCompany !== "object") {
    throw new Error("Scénario stocké invalide : état initial d'entreprise manquant");
  }
  if (!Array.isArray(r.bots) || !Array.isArray(r.situations) || !Array.isArray(r.kpis)) {
    throw new Error("Scénario stocké invalide : bots/situations/KPI attendus en listes");
  }
  // Frontière du moteur : la config est re-validée strictement.
  const scenario = parseScenarioConfig(r.scenario);
  return { ...(r as unknown as StoredScenarioDefinition), scenario };
}
