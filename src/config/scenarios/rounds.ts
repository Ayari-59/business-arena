import type { EngineScenarioConfig } from "../../engine/types";

/**
 * Le nombre de tours d'une partie.
 *
 * Il venait du scénario et de lui seul : toute partie durait six trimestres,
 * quoi que l'enseignant ait prévu. Un atelier de cinq séances dont la dernière
 * rend compte ne joue que quatre tours, et la partie restait ouverte sur deux
 * tours que personne ne jouerait jamais. Le classement final ne tombait pas, le
 * relevé restait incomplet, et la fiche annonçait un nombre de tours qui n'était
 * ni celui de la partie ni celui des séances.
 *
 * Une partie peut donc être raccourcie à la création. Elle ne peut pas être
 * allongée : les situations pédagogiques et les événements scriptés d'un
 * scénario sont écrits pour un nombre de tours donné, et au-delà les équipes
 * joueraient des tours sans matière.
 */

/** Le nombre de tours retenu : jamais plus que ce que le scénario porte, jamais moins d'un. */
export function toursDeLaPartie(scenario: EngineScenarioConfig, demande: number | undefined): number {
  if (demande === undefined || !Number.isFinite(demande)) return scenario.roundsCount;
  return Math.min(scenario.roundsCount, Math.max(1, Math.trunc(demande)));
}

/** Une variante du scénario jouée sur un nombre de tours choisi. */
export function applyRoundsCount(
  scenario: EngineScenarioConfig,
  demande: number | undefined,
): EngineScenarioConfig {
  const tours = toursDeLaPartie(scenario, demande);
  if (tours === scenario.roundsCount) return scenario;
  return { ...scenario, roundsCount: tours };
}
