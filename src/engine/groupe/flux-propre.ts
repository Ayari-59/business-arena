import { createRng, deriveRoundSeed, type SeededRng } from "../random";

/**
 * LE FLUX ALÉATOIRE PROPRE D'UNE CIBLE (niveau 7).
 *
 * L'état caché d'un site, le cours d'une devise, un risque pays se tirent sur
 * un flux dérivé de la graine de la partie et de la clé de la cible, jamais
 * sur celui du tour : un rachat, un audit ou une cible de plus ne décalent
 * aucun autre tirage de la partie, et la même cible, dans la même partie,
 * garde le même état quel que soit le tour où on la regarde.
 */
export function fluxPropre(graine: number, cle: string): SeededRng {
  // FNV-1a 32 bits de la clé, mêlé à la graine.
  let h = 0x811c9dc5;
  for (let i = 0; i < cle.length; i++) {
    h ^= cle.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return createRng(deriveRoundSeed((graine ^ h) >>> 0, 0x5eed));
}

/** Tirage uniforme dans une fourchette. */
export const dansLaFourchette = (u: number, f: { min: number; max: number }): number => f.min + (f.max - f.min) * u;
