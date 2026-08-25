import { createRng } from "../engine/random";

/**
 * Moteur de compétition (doc 04) — module PUR.
 * Un concours est un arbre de phases qui engendrent des parties ordinaires :
 * ce module ne fait que composer les groupes (tirage seedé, auditable),
 * agréger les classements et propager les qualifiés. Le moteur économique
 * n'est jamais modifié.
 */

/**
 * Composition des groupes de qualification : mélange déterministe (PRNG seedé,
 * rejouable — anti-contestation) puis découpage en groupes de `groupSize`,
 * avec rééquilibrage pour ne jamais laisser un groupe à 1 seul participant.
 */
export function composeGroups<T>(entries: T[], groupSize: number, seed: number): T[][] {
  if (entries.length === 0) return [];
  const size = Math.max(2, groupSize);
  const rng = createRng(seed);
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  const groupCount = Math.max(1, Math.floor(shuffled.length / size));
  const groups: T[][] = Array.from({ length: groupCount }, () => []);
  shuffled.forEach((entry, i) => groups[i % groupCount]!.push(entry));
  return groups;
}

export interface GroupStanding {
  entryId: string;
  bpi: number;
  /** Départage (doc 04) : dimension financière puis trésorerie finale. */
  financial: number;
  lastTreasury: number;
}

const compareStandings = (a: GroupStanding, b: GroupStanding) =>
  b.bpi - a.bpi || b.financial - a.financial || b.lastTreasury - a.lastTreasury;

/**
 * Qualifiés pour la phase suivante : les `advancePerGroup` premiers de chaque
 * groupe, puis complément éventuel par les meilleurs BPI restants (« meilleurs
 * seconds ») jusqu'à `targetCount` si fourni.
 */
export function qualifiers(
  groups: GroupStanding[][],
  advancePerGroup: number,
  targetCount?: number,
): string[] {
  const qualified: GroupStanding[] = [];
  const rest: GroupStanding[] = [];
  for (const group of groups) {
    const sorted = [...group].sort(compareStandings);
    qualified.push(...sorted.slice(0, advancePerGroup));
    rest.push(...sorted.slice(advancePerGroup));
  }
  if (targetCount !== undefined && qualified.length < targetCount) {
    rest.sort(compareStandings);
    qualified.push(...rest.slice(0, targetCount - qualified.length));
  }
  return qualified
    .sort(compareStandings)
    .slice(0, targetCount ?? qualified.length)
    .map((s) => s.entryId);
}

/** Podium final : classement complet d'un groupe unique (la finale). */
export function podium(final: GroupStanding[]): string[] {
  return [...final].sort(compareStandings).map((s) => s.entryId);
}
