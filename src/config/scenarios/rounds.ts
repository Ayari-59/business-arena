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

/**
 * Le tour où la demande du secteur culmine.
 *
 * Un scénario n'est pas plat : sa dramaturgie tient dans un tour précis, celui
 * où le compte-clé passe sa commande, où les fêtes remplissent la boutique, où
 * la saison pleine remplit l'hôtel. Raccourcir une partie en deçà de ce tour ne
 * la raccourcit pas, elle la vide : la classe joue le creux et rentre chez elle
 * avant que le secteur n'ait rien montré.
 *
 * Le défaut a été trouvé par un enseignant sur l'animation de découverte, qui
 * jouait trois trimestres d'un secteur dont le marché double au quatrième. Il
 * était réplicable ailleurs : la règle qui raccourcit les parties de premier
 * semestre le recréait pour trois diplômes à la fois.
 */
export function tourDuPic(scenario: EngineScenarioConfig): number {
  const demandeParTour = Array.from({ length: scenario.roundsCount }, (_, r) =>
    scenario.market.segments.reduce((total, segment) => {
      const saison = segment.seasonality?.[r] ?? 1;
      return total + segment.size * saison;
    }, 0) * (scenario.market.seasonality?.[r] ?? 1),
  );
  return demandeParTour.indexOf(Math.max(...demandeParTour)) + 1;
}
