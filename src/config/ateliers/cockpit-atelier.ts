import type { AtelierDefinition } from "./types";
import { scenarioByCode } from "../scenarios/registry";
import { cockpitSpec, type ClasseurSpec } from "./cockpit";

/**
 * Le cockpit d'un atelier : le scénario du registre, les tours que l'atelier
 * joue, et le marché tel qu'il sera dimensionné pour sa classe (équipes et
 * concurrents pilotés). Aucune partie n'est nécessaire : c'est le classeur
 * qu'on distribue avec le dossier élève, avant la première séance.
 */
export function cockpitAtelier(atelier: AtelierDefinition): ClasseurSpec {
  const scenario = scenarioByCode(atelier.reglages.scenarioCode);
  return cockpitSpec({
    scenario,
    tours: Array.from({ length: atelier.reglages.tours }, (_, i) => i + 1),
    concurrents: atelier.reglages.equipes + atelier.reglages.bots,
  });
}
