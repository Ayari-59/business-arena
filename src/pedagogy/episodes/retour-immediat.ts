/**
 * LE RETOUR IMMÉDIAT DU NIVEAU DÉCOUVERTE.
 *
 * Juste après une décision, ce qu'elle a changé au trimestre par rapport à
 * l'option « ne rien changer » de l'étape, les décisions à venir supposées
 * neutres. C'est un retour sur CE hasard-ci : le bilan dira ensuite ce que la
 * décision vaut en moyenne sur trente tirages. Tout est pur.
 */
import type { Episode } from "@/config/episodes/types";

export interface EffetDuChoix {
  /** L'option à laquelle on compare : celle qui ne change rien. */
  reference: number;
  /** Le résultat du trimestre avec ce choix, moins celui avec la référence. */
  ecart: number;
}

/** `null` quand le choix est justement de ne rien changer. */
export function effetDuChoix(
  ep: Pick<Episode, "neutre" | "simuler">,
  decisions: readonly number[],
  etape: number,
  graine: number,
  jours: number,
): EffetDuChoix | null {
  const reference = ep.neutre[etape]!;
  const choix = decisions[etape]!;
  if (choix === reference) return null;
  const chemin = ep.neutre.map((n, k) => (k <= etape ? (decisions[k] ?? n) : n));
  const sans = chemin.map((c, k) => (k === etape ? reference : c));
  return {
    reference,
    ecart: ep.simuler(chemin, graine, jours).objectif - ep.simuler(sans, graine, jours).objectif,
  };
}
