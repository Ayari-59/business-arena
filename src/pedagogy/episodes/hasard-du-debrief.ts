/**
 * LE HASARD DU DÉBRIEF : le trimestre que tout un groupe joue ensemble.
 *
 * Au débrief, chacun compare son résultat à celui des autres, sous le même
 * hasard. Si ce hasard punit la bonne méthode, ou récompense un réflexe, le
 * résultat enseigne le contraire de la leçon, et l'animateur doit la défendre
 * contre lui. Un hasard convient donc au débrief quand, sous ce tirage :
 *
 *   · la meilleure référence ne finit pas dans le dernier tiers de ses trente
 *     tirages (20e place au plus) : la bonne méthode n'y paraît pas malchanceuse ;
 *   · aucune autre référence ne fait mieux qu'elle ;
 *   · aucun réflexe, pris seul sur son chemin, ne la bat de plus que l'écart
 *     d'égalité de l'épisode : la classe ne voit pas un réflexe payer.
 *
 * Le hasard n° 12 reste celui de chaque épisode qu'il sert bien ; pour les
 * autres, on prend parmi les hasards qui conviennent le plus ordinaire, celui
 * où la bonne méthode finit au plus près du milieu de ses trente tirages.
 * Tout est pur ; un test vérifie que le registre du débrief suit cette règle.
 */
import { GRAINES_DU_BILAN, quantile } from "@/engine/episodes/commun";
import { TRACES } from "@/config/episodes/traces";
import { HASARD_HABITUEL } from "@/config/episodes/debrief";
import type { Episode } from "@/config/episodes/types";
import { egalite } from "@/pedagogy/episodes/mesures";

/** La place la plus basse, sur trente, que la bonne méthode peut occuper sous le hasard du débrief. */
export const PLACE_LA_PLUS_BASSE = 20;

export interface JugementDuHasard {
  graine: number;
  /** La place de la meilleure référence parmi ses trente tirages : 1 est le meilleur. */
  place: number;
  /** Ce qui disqualifie ce hasard pour le débrief ; vide s'il convient. */
  defauts: string[];
}

export function jugerLeHasard(ep: Episode, graine: number): JugementDuHasard {
  const jours = ep.enquete.joursSansPerte;
  const objectif = (c: readonly number[], g: number) => ep.simuler(c, g, jours).objectif;
  const methode = ep.references[0]!.chemin;
  const tirages = GRAINES_DU_BILAN.map((g) => objectif(methode, g));
  const v = objectif(methode, graine);
  const place = tirages.filter((x) => x > v).length + 1;
  const marge = egalite(quantile(tirages, 0.1), quantile(tirages, 0.9));
  const defauts: string[] = [];
  if (place > PLACE_LA_PLUS_BASSE) defauts.push(`la bonne méthode finit ${place}e sur 30`);
  for (const r of ep.references.slice(1)) {
    if (objectif(r.chemin, graine) > v) defauts.push(`« ${r.nom} » fait mieux`);
  }
  for (const [d, o] of TRACES[ep.code]!.reflexes) {
    const chemin = [...methode];
    chemin[d] = o;
    if (objectif(chemin, graine) > v + marge) defauts.push(`le réflexe D${d + 1} option ${o} paie`);
  }
  return { graine, place, defauts };
}

/** Le hasard que la règle choisit pour le débrief d'un épisode. */
export function choisirLeHasard(ep: Episode): number {
  if (jugerLeHasard(ep, HASARD_HABITUEL).defauts.length === 0) return HASARD_HABITUEL;
  const conviennent = GRAINES_DU_BILAN.map((g) => jugerLeHasard(ep, g)).filter(
    (j) => j.defauts.length === 0,
  );
  const milieu = (GRAINES_DU_BILAN.length + 1) / 2;
  const [choisi] = conviennent.sort(
    (a, b) => Math.abs(a.place - milieu) - Math.abs(b.place - milieu) || a.graine - b.graine,
  );
  return choisi?.graine ?? HASARD_HABITUEL;
}
