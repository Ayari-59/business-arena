import type { EngineScenarioConfig } from "../../engine/types";

/**
 * LES AMORTISSEMENTS D'UN TOUR, AU DÉPART DE LA PARTIE.
 *
 * Un scénario qui a un parc typé (`equipment`) amortit chaque équipement sur sa propre
 * durée, à part égale chaque tour (engine/simulation, `equipDepreciation`), et le moteur
 * ignore alors `finance.depreciationPerRound`, qui ne sert qu'à un scénario sans parc.
 * Tous les scénarios du registre ont un parc : l'atelier et les situations affichaient
 * pourtant `depreciationPerRound` (28 000 € à L'ESCALE pour 14 500 € comptés).
 *
 * Ce qu'on affiche est donc ce que le moteur compte au premier tour : le coût d'achat de
 * chaque lot du parc de départ divisé par sa durée d'amortissement. Les achats de la partie
 * s'y ajoutent ensuite, tour après tour.
 */
export function amortissementsDuDepart(s: EngineScenarioConfig): number {
  if (!s.equipment) return s.finance.depreciationPerRound;
  const types = new Map(s.equipment.types.map((t) => [t.code, t]));
  return s.equipment.initialFleet.reduce((total, lot) => {
    const type = types.get(lot.typeCode);
    if (!type) throw new Error(`Amortissements : type d'équipement inconnu « ${lot.typeCode} »`);
    return total + (lot.count * type.costPerUnit) / type.depreciationRounds;
  }, 0);
}
