/**
 * MESURER CE QUE L'ANALYSE COÛTE AU RYTHME DU JEU.
 *
 * Le diagnostic et le choix du modèle s'ajoutent à chaque tour. Savoir s'ils
 * cassent la fluidité demande deux chiffres, par niveau : combien de joueurs
 * RENDENT leur analyse (les autres la laissent de côté), et combien de temps
 * s'écoule entre l'ouverture de la situation et son rendu.
 *
 * Module PUR : il agrège des lignes déjà lues, il ne lit ni base ni horloge.
 *
 * CE QUE LE TEMPS NE DIT PAS. C'est un écart d'horloge entre l'ouverture et le
 * rendu, pas un temps de lecture : un élève qui quitte l'onglet et revient une
 * heure plus tard y compte une heure. D'où la médiane plutôt que la moyenne, et
 * la part des rendus tardifs (plus de trente minutes) donnée à côté.
 */

export interface LigneAnalyse {
  /** Niveau de difficulté de la partie (1-6). */
  niveau: number;
  /** L'équipe a-t-elle rendu son diagnostic ? */
  rendue: boolean;
  /** Minutes entre l'ouverture de la situation et son rendu, si connues. */
  minutes: number | null;
  /** Nombre d'indices débloqués. */
  indices: number;
  /** Score final de la situation (0-1), s'il existe. */
  score: number | null;
}

export interface MesureParNiveau {
  niveau: number;
  situations: number;
  rendues: number;
  /** Part des situations rendues, 0-1. */
  tauxDeRendu: number;
  /** Médiane des minutes jusqu'au rendu (null sans mesure). */
  medianeMinutes: number | null;
  /** Part des rendus qui ont pris plus de trente minutes (probablement une pause). */
  partDeRendusTardifs: number | null;
  indicesParSituation: number;
  scoreMoyen: number | null;
}

/** Au-delà, l'écart est une pause, pas un temps d'analyse. */
export const SEUIL_RENDU_TARDIF_MINUTES = 30;

export function mediane(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  const tri = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(tri.length / 2);
  return tri.length % 2 === 1 ? tri[m]! : (tri[m - 1]! + tri[m]!) / 2;
}

export function agregerParNiveau(lignes: readonly LigneAnalyse[]): MesureParNiveau[] {
  const parNiveau = new Map<number, LigneAnalyse[]>();
  for (const l of lignes) parNiveau.set(l.niveau, [...(parNiveau.get(l.niveau) ?? []), l]);

  return [...parNiveau.entries()]
    .sort(([a], [b]) => a - b)
    .map(([niveau, ls]) => {
      const rendues = ls.filter((l) => l.rendue);
      const minutes = rendues.map((l) => l.minutes).filter((m): m is number => m !== null && m >= 0);
      const scores = rendues.map((l) => l.score).filter((x): x is number => x !== null);
      return {
        niveau,
        situations: ls.length,
        rendues: rendues.length,
        tauxDeRendu: rendues.length / ls.length,
        medianeMinutes: mediane(minutes),
        partDeRendusTardifs:
          minutes.length === 0
            ? null
            : minutes.filter((m) => m > SEUIL_RENDU_TARDIF_MINUTES).length / minutes.length,
        indicesParSituation: ls.reduce((t, l) => t + l.indices, 0) / ls.length,
        scoreMoyen: scores.length === 0 ? null : scores.reduce((t, x) => t + x, 0) / scores.length,
      };
    });
}
