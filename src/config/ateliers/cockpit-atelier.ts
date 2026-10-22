import type { AtelierDefinition } from "./types";
import { scenarioByCode } from "../scenarios/registry";
import { cockpitSpec, type ClasseurSpec } from "./cockpit";
import { DIFFICULTY_PRESETS } from "../difficulty";
import { partieDeLAtelier } from "./partie-de-l-atelier";

/**
 * Le cockpit d'un atelier : le scénario du registre, les tours que l'atelier
 * joue, et le marché tel qu'il sera dimensionné pour sa classe (équipes et
 * concurrents pilotés). Aucune partie n'est nécessaire : c'est le classeur
 * qu'on distribue avec le dossier élève, avant la première séance. Un
 * niveau qui n'ouvre pas la R&D joue les références livrées prêtes : le
 * cockpit prévoit la même partie que celle qui sera créée.
 */
export function cockpitAtelier(atelier: AtelierDefinition): ClasseurSpec {
  const scenario = scenarioByCode(atelier.reglages.scenarioCode);
  // À une autre durée de tour que le trimestre, le cockpit prévoit la partie
  // composée (`partieDeLAtelier`) : sa durée de tour, son calendrier, son marché
  // déjà dimensionné pour la classe. Au trimestre, le registre, comme avant.
  const partie = partieDeLAtelier(atelier);
  return cockpitSpec({
    scenario,
    ...(partie !== scenario ? { config: partie.scenario } : {}),
    tours: Array.from({ length: atelier.reglages.tours }, (_, i) => i + 1),
    concurrents: atelier.reglages.equipes + atelier.reglages.bots,
    niveau: atelier.reglages.niveau,
    sansRd: !(
      DIFFICULTY_PRESETS.find((p) => p.level === atelier.reglages.niveau)
        ?.decisions.rd ?? false
    ),
  });
}
