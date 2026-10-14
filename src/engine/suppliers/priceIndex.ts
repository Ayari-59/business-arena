/**
 * Indice de cours flottant des fournisseurs (inspiration StratiRAC).
 *
 * Le cours suit une marche aléatoire avec :
 *   - une dérive tendancielle (`trend`) par tour,
 *   - un choc gaussien approximé (`volatility` × bruit uniforme centré),
 *   - une inertie (`momentum`) qui donne de la persistance aux chocs,
 *   - un plancher et un plafond (`minMultiplier`, `maxMultiplier`).
 *
 * DÉTERMINISME : le calcul rejoue la séquence complète depuis le tour 1
 * jusqu'au tour demandé, à partir d'une graine dérivée de la graine de
 * partie et du code du fournisseur. Aucun état persisté n'est nécessaire —
 * `computePriceIndexMultiplier(seed, supplierCode, cfg, n)` renvoie
 * toujours la même valeur pour les mêmes paramètres.
 *
 * Le PRNG utilisé est le mulberry32 déjà présent dans le moteur, via un
 * flux DÉDIÉ : les tirages de l'indice ne consomment pas le flux principal
 * et n'altèrent aucun résultat existant.
 */

import { createRng, deriveRoundSeed } from "../random";

export interface PriceIndexConfig {
  volatility: number;
  trend: number;
  momentum: number;
  minMultiplier: number;
  maxMultiplier: number;
}

/**
 * Approximation d'une variable normale centrée réduite par la méthode de
 * Box-Muller simplifiée (deux uniformes → une normale approchée).
 * Retourne une valeur typiquement dans [−3, 3].
 */
function normalApprox(u1: number, u2: number): number {
  // Box-Muller : transforme deux uniformes en une normale
  // (évite Math.log(0) avec max sur u1)
  const safe = Math.max(u1, 1e-10);
  return Math.sqrt(-2 * Math.log(safe)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Dérive une graine stable à partir de la graine de partie et du code
 * fournisseur (simple djb2 sur les caractères du code).
 */
function supplierSeed(gameSeed: number, supplierCode: string): number {
  let h = 5381;
  for (let i = 0; i < supplierCode.length; i++) {
    h = (Math.imul(h, 33) ^ supplierCode.charCodeAt(i)) >>> 0;
  }
  return (gameSeed ^ h ^ 0x504943) >>> 0;
}

/**
 * Calcule le multiplicateur de l'indice de cours pour le tour `roundIndex`.
 *
 * @param gameSeed    Graine de la partie (SimulationInput.seed).
 * @param supplierCode Code du fournisseur (pour isoler son flux aléatoire).
 * @param cfg         Configuration de l'indice déclarée sur le fournisseur.
 * @param roundIndex  Tour courant (1..N).
 * @returns Multiplicateur à appliquer au coût matières du fournisseur.
 */
export function computePriceIndexMultiplier(
  gameSeed: number,
  supplierCode: string,
  cfg: PriceIndexConfig,
  roundIndex: number,
): number {
  const seed = supplierSeed(gameSeed, supplierCode);
  const rng = createRng(deriveRoundSeed(seed, 0));

  // Marche aléatoire AR(1) : choc(t) = momentum × choc(t-1) + ε(t)
  // valeur(t) = clamp(valeur(t-1) × (1 + trend + choc(t)), min, max)
  let value = 1.0;
  let lastShock = 0.0;
  for (let r = 1; r <= roundIndex; r++) {
    const u1 = rng.next();
    const u2 = rng.next();
    const noise = normalApprox(u1, u2) * cfg.volatility;
    const shock = cfg.momentum * lastShock + (1 - cfg.momentum) * noise;
    value = value * (1 + cfg.trend + shock);
    value = Math.max(cfg.minMultiplier, Math.min(cfg.maxMultiplier, value));
    lastShock = shock;
  }
  return value;
}
