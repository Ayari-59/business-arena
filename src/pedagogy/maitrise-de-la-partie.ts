/**
 * DEUX INDICES QUI NE MESURENT PAS LA MÊME CHOSE.
 *
 * L'IPG dit ce que l'ENTREPRISE a fait : résultat, trésorerie, part de
 * marché, RSE, pilotage. La maîtrise dit ce que l'ÉLÈVE a compris : ses
 * diagnostics et ses réponses aux situations, moins le coût des indices
 * ouverts.
 *
 * Ils étaient fondus en un seul chiffre affiché en permanence, où la part
 * pédagogique pesait 5 % des pondérations. Un élève optimise ce qu'on lui
 * montre : c'était donc le trimestre de l'entreprise, et la compréhension
 * passait pour un détail. Les séparer rétablit la vérité de chacun, sans
 * imposer de les pondérer — cet arbitrage appartient à l'enseignant, et le
 * relevé de notes le dit déjà en servant les deux côte à côte.
 *
 * Module PUR : il ne lit que des situations déjà débriefées.
 */

/** Ce qu'il faut savoir d'une situation pour en tirer la maîtrise. */
export interface SituationMesurable {
  /** L'équipe a rendu son diagnostic : sans cela, rien n'est mesuré. */
  rendered: boolean;
  /** Score final 0..1, disponible seulement après débriefing. */
  debrief: { finalScore: number } | null;
}

export interface MaitriseDeLaPartie {
  /** Moyenne des scores finaux, de 0 à 1. */
  valeur: number;
  /** La même sur 20, arrondie au quart de point, comme le relevé de notes. */
  sur20: number;
  /** Nombre de situations qui la fondent. */
  mesurees: number;
}

/**
 * La maîtrise de la partie, ou `null` tant que rien n'a été rendu ET
 * débriefé.
 *
 * UNE SITUATION NON RENDUE N'EST PAS UN ZÉRO. C'est la règle déjà tenue par
 * le carnet d'usage et le relevé de notes : un silence se compte à part, et
 * c'est l'enseignant qui décide s'il vaut zéro. L'afficher comme une note
 * basse à l'élève trancherait cette question à sa place, en pleine partie.
 */
export function maitriseDeLaPartie(
  situations: readonly SituationMesurable[],
): MaitriseDeLaPartie | null {
  const scores = situations
    .filter((s) => s.rendered && s.debrief !== null)
    .map((s) => s.debrief!.finalScore)
    .filter((n) => Number.isFinite(n));
  if (scores.length === 0) return null;
  const valeur = scores.reduce((t, n) => t + n, 0) / scores.length;
  return {
    valeur,
    sur20: Math.round(valeur * 20 * 4) / 4,
    mesurees: scores.length,
  };
}
