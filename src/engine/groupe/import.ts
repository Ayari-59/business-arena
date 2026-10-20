import type { EngineScenarioConfig } from "../types";
import { fluxPropre } from "./flux-propre";
import { saisonDuTour } from "../market/demand";
import type { ImportDuGroupe } from "./types";

/**
 * L'IMPORT, AU NIVEAU 7 (`groupe.import`). Le fournisseur le moins cher à
 * l'unité reste le moins cher au cours de départ, mais :
 *
 *   - son prix est en devise : le coût matières des références qu'il fournit
 *     suit le cours moyen du tour, une marche aléatoire de départ 1 ;
 *   - ses ruptures sont plus fréquentes aux pics (Noël, le grand compte) :
 *     ses délais de livraison ne suivent pas la saison du marché.
 *
 * Tous les tirages se font sur des flux propres (`fluxPropre`), dérivés de la
 * graine : le cours, un par fournisseur ; la rupture, un par entreprise et par
 * tour. Ils ne décalent aucun autre tirage de la partie. Hors niveau 7, le
 * fournisseur garde son risque et son prix du scénario.
 */

/** Le cours de la devise de l'import à la fin de chaque tour, de 0 (départ, 1) à `jusquA`. */
export function coursDeLImport(graine: number, imp: ImportDuGroupe, jusquA: number): number[] {
  const rng = fluxPropre(graine, `import:${imp.code}:change`);
  const cours = [1];
  for (let t = 1; t <= jusquA; t++) {
    // Box-Muller : deux tirages uniformes par tour, toujours dans le même ordre.
    const u1 = Math.max(1e-12, rng.next());
    const u2 = rng.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const s = imp.change.volatilite;
    cours.push(cours[t - 1]! * Math.exp(s * z - (s * s) / 2));
  }
  return cours;
}

/** Le multiplicateur du prix de l'import au tour : le cours moyen du tour. */
export function prixDeLImport(graine: number, imp: ImportDuGroupe, roundIndex: number): number {
  const c = coursDeLImport(graine, imp, roundIndex);
  return (c[roundIndex - 1]! + c[roundIndex]!) / 2;
}

/** La probabilité de rupture du tour : plus forte aux pics de la saison du marché. */
export function probabiliteDeRupture(scenario: EngineScenarioConfig, imp: ImportDuGroupe, roundIndex: number): number {
  // La même lecture que la demande (`saisonDuTour`) : jamais modulo la longueur du
  // tableau. Boucler faisait voir à l'import un pic que la demande ne voyait pas.
  const saison = saisonDuTour(scenario.market.seasonality, roundIndex);
  return saison >= imp.rupture.seuilDePic ? imp.rupture.probabiliteAuxPics : imp.rupture.probabilite;
}

/** L'import rompt-il ce tour pour cette entreprise ? Un tirage sur son flux propre. */
export function ruptureDeLImport(
  scenario: EngineScenarioConfig,
  graine: number,
  imp: ImportDuGroupe,
  roundIndex: number,
  entreprise: string,
): boolean {
  return fluxPropre(graine, `import:${imp.code}:${entreprise}:t${roundIndex}`).next() < probabiliteDeRupture(scenario, imp, roundIndex);
}
