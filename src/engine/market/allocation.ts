/**
 * Allocation concurrentielle (doc 02 §3.3) : modèle de part d'attraction
 * Share(c) = A(c)^γ / (Σ A(k)^γ + outside^γ).
 * Le « concurrent extérieur » représente le reste du marché : la demande
 * totale n'est jamais intégralement servie par les joueurs si outside > 0.
 */
export function allocateShares(
  attractions: number[],
  gamma: number,
  outsideAttraction: number,
): number[] {
  const powered = attractions.map((a) => (a > 0 ? Math.pow(a, gamma) : 0));
  const outside = outsideAttraction > 0 ? Math.pow(outsideAttraction, gamma) : 0;
  const total = powered.reduce((s, x) => s + x, 0) + outside;
  if (total <= 0) return attractions.map(() => 0);
  return powered.map((x) => x / total);
}
