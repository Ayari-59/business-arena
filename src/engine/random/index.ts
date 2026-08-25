/**
 * PRNG seedé (mulberry32) — SEULE source d'aléa du moteur (ADR-05).
 * Même graine ⇒ même séquence, base du déterminisme, du rejeu et de l'anti-triche.
 */
export interface SeededRng {
  /** Nombre pseudo-aléatoire uniforme dans [0, 1). */
  next(): number;
}

export function createRng(seed: number): SeededRng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Dérive une graine de tour à partir de la graine de partie (indépendance des tours). */
export function deriveRoundSeed(gameSeed: number, roundIndex: number): number {
  // mélange entier simple et stable (aucune source d'aléa ou d'horloge système)
  let h = (gameSeed ^ (roundIndex * 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
