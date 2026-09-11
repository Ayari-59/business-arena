import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scenarios } from "@/db/schema";
import {
  DEFAULT_SCENARIO_CODE,
  isBuiltInScenarioCode,
  scenarioByCode,
  type ScenarioDefinition,
} from "@/config/scenarios/registry";
import { hydrateDefinition, parseStoredScenario } from "@/config/scenarios/serialize";

/**
 * Résolution d'une `ScenarioDefinition` par code, depuis le CODE (9 secteurs
 * intégrés) OU la BASE (scénarios enseignants).
 *
 * `scenarioByCode` (registre) ne connaît que les intégrés et retombe
 * silencieusement sur NOVA pour tout autre code — ce qui masquerait un scénario
 * base. Ce resolver comble le trou : un code intégré passe par le registre
 * (synchrone, inchangé) ; tout autre code est chargé et hydraté depuis la table
 * `scenarios`. C'est le point d'entrée unique de la couche « base comme source
 * de vérité » (éditeur de scénarios, PR 1).
 */
export async function resolveScenarioDefinition(
  code: string | undefined | null,
): Promise<ScenarioDefinition> {
  if (isBuiltInScenarioCode(code)) return scenarioByCode(code);
  // Code absent : on garde la retombée NOVA du registre (partie exotique).
  if (!code) return scenarioByCode(code);

  const rows = await db.select().from(scenarios).where(eq(scenarios.code, code));
  const editable = rows.filter((r) => r.definition != null);
  if (editable.length === 0) {
    // Ni intégré, ni scénario enseignant hydratable : on ne fait pas planter une
    // partie — retombée NOVA, cohérente avec le registre.
    return scenarioByCode(code);
  }
  // Un scénario publié fait foi sur un brouillon ; à statut égal, la version la
  // plus haute. (Un scénario enseignant n'a qu'une version en PR 1 ; ce tri
  // reste correct quand le versioning arrivera.)
  const chosen = editable.sort((a, b) => {
    if (a.status !== b.status) return a.status === "published" ? -1 : 1;
    return b.version.localeCompare(a.version, undefined, { numeric: true });
  })[0]!;
  return hydrateDefinition(parseStoredScenario(chosen.definition));
}

/** Les situations d'un scénario non-intégré, à semer/instancier ; [] pour un intégré. */
export function customSituationsOf(definition: ScenarioDefinition): ScenarioDefinition["situations"] {
  return isBuiltInScenarioCode(definition.code) ? [] : definition.situations;
}

export { DEFAULT_SCENARIO_CODE };
