/**
 * CE QUE LES MODÈLES D'ÉPISODES PARTAGENT : le hasard, et le rejeu.
 *
 * Chaque modèle d'épisode est pur et déterministe : une même graine donne les
 * mêmes tirages, QUELLES QUE SOIENT les décisions. C'est ce qui permet au
 * bilan de rejouer une décision sous le hasard exact que le joueur a connu,
 * puis sous trente autres.
 */

/** Un générateur pseudo-aléatoire de 32 bits, rapide et reproductible. */
export function mulberry32(graine: number) {
  let a = graine;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un tirage de loi normale centrée réduite (Box-Muller). */
export function gauss(r: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Les trente tirages sous lesquels le bilan rejoue chaque décision. */
export const GRAINES_DU_BILAN = Array.from({ length: 30 }, (_, i) => i + 1);

export const moyenne = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
export const quantile = (xs: readonly number[], q: number) => {
  const tries = [...xs].sort((a, b) => a - b);
  return tries[Math.floor(q * (tries.length - 1))]!;
};

export interface Rejeu {
  option: number;
  /** Le résultat moyen sur les trente tirages. */
  attendu: number;
  /** Le résultat dans les 10 % de tirages les moins favorables. */
  p10: number;
}

/** Rejoue chaque option d'une décision sous les trente mêmes tirages, les autres choix inchangés. */
export function rejouerAvec(
  objectif: (chemin: readonly number[], graine: number) => number,
  chemin: readonly number[],
  decision: number,
  nbOptions: number,
): Rejeu[] {
  return Array.from({ length: nbOptions }, (_, option) => {
    const autre = [...chemin];
    autre[decision] = option;
    const valeurs = GRAINES_DU_BILAN.map((g) => objectif(autre, g));
    return { option, attendu: moyenne(valeurs), p10: quantile(valeurs, 0.1) };
  });
}
