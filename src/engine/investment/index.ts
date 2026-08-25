/**
 * Outils d'évaluation d'investissement (doc 02 §6.5) — exposés au joueur
 * comme ateliers d'analyse (VAN, TRI, délai de récupération).
 * Convention : flows[0] = flux de l'année 0 (généralement négatif).
 */

export function npv(flows: number[], rate: number): number {
  return flows.reduce((sum, flow, t) => sum + flow / Math.pow(1 + rate, t), 0);
}

/**
 * TRI par bissection sur [-0.99, 10]. Retourne null si aucun changement de
 * signe de la VAN sur l'intervalle (pas de TRI réel exploitable).
 */
export function irr(flows: number[], tolerance = 1e-7, maxIterations = 200): number | null {
  let lo = -0.99;
  let hi = 10;
  let npvLo = npv(flows, lo);
  const npvHi = npv(flows, hi);
  if (npvLo === 0) return lo;
  if (npvHi === 0) return hi;
  if (npvLo * npvHi > 0) return null;
  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const npvMid = npv(flows, mid);
    if (Math.abs(npvMid) < tolerance) return mid;
    if (npvLo * npvMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      npvLo = npvMid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Délai de récupération (non actualisé), en périodes, avec interpolation
 * linéaire dans la période de récupération. Retourne null si jamais récupéré.
 */
export function paybackPeriod(flows: number[]): number | null {
  let cumulative = 0;
  for (let t = 0; t < flows.length; t++) {
    const flow = flows[t] ?? 0;
    const previous = cumulative;
    cumulative += flow;
    if (cumulative >= 0 && t > 0) {
      return flow > 0 ? t - 1 + -previous / flow : t;
    }
  }
  return null;
}
