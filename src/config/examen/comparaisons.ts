/**
 * LES COMPARAISONS ENTRE ÉTABLISSEMENTS (comme Comp-XM), PRÉPARÉES ET RETENUES.
 *
 * Une école veut savoir où se situe sa promotion. La comparaison n'a de sens que sur la
 * même épreuve : le même scénario, le même niveau, la même grille dans la même version.
 * Elle n'est MONTRÉE que lorsqu'elle est significative ET qu'elle ne peut plus désigner
 * personne : à partir de `ETABLISSEMENTS_MINIMUM` établissements et de `CANDIDATS_MINIMUM`
 * candidats notés. En deçà, l'écran le dit, sans chiffre.
 *
 * L'ANONYMAT. Seuls des agrégats sortent : les percentiles des notes et deux effectifs.
 * Ni nom, ni numéro d'étudiant, ni nom d'établissement, ni note isolée ne quittent la
 * requête qui les calcule (services/examen.service.ts). Tant que le seuil n'est pas
 * atteint, même les effectifs ne sont pas montrés : ils diraient qui a déjà passé
 * l'examen.
 *
 * Pur : un échantillon entre (une note et un établissement opaque par copie), un agrégat
 * ou un refus sort.
 */

/** Le nombre d'établissements distincts à partir duquel la comparaison se montre. */
export const ETABLISSEMENTS_MINIMUM = 5;
/** Le nombre de candidats notés à partir duquel la comparaison se montre. */
export const CANDIDATS_MINIMUM = 100;

/** Les percentiles montrés. */
export const PERCENTILES = [10, 25, 50, 75, 90] as const;

export interface CopieComparee {
  /** Un identifiant opaque de l'établissement : il ne sert qu'à compter. */
  etablissement: string;
  note: number;
}

export type Comparaison =
  | {
      disponible: true;
      etablissements: number;
      candidats: number;
      percentiles: { p: (typeof PERCENTILES)[number]; note: number }[];
    }
  | { disponible: false; message: string };

/** « Comparaison nationale : disponible à partir de 5 établissements. » */
export const MESSAGE_COMPARAISON_INDISPONIBLE = `Comparaison nationale : disponible à partir de ${ETABLISSEMENTS_MINIMUM} établissements.`;

/** Le percentile d'une série triée (interpolation linéaire entre rangs). */
export function percentile(tries: readonly number[], p: number): number {
  if (tries.length === 0) return 0;
  const r = (p / 100) * (tries.length - 1);
  const bas = Math.floor(r);
  const haut = Math.ceil(r);
  const v = tries[bas]! + (tries[haut]! - tries[bas]!) * (r - bas);
  return Math.round(v * 10) / 10;
}

/**
 * LA COMPARAISON D'UN ÉCHANTILLON : percentiles et effectifs, ou le message d'attente.
 * Les seuils sont réglables pour les tests ; le produit lit les constantes.
 */
export function comparer(
  echantillon: readonly CopieComparee[],
  seuils: { etablissements: number; candidats: number } = {
    etablissements: ETABLISSEMENTS_MINIMUM,
    candidats: CANDIDATS_MINIMUM,
  },
): Comparaison {
  const notes = echantillon.filter((c) => Number.isFinite(c.note));
  const etablissements = new Set(notes.map((c) => c.etablissement)).size;
  if (etablissements < seuils.etablissements || notes.length < seuils.candidats) {
    return {
      disponible: false,
      message: `Comparaison nationale : disponible à partir de ${seuils.etablissements} établissements.`,
    };
  }
  const tries = notes.map((c) => c.note).sort((a, b) => a - b);
  return {
    disponible: true,
    etablissements,
    candidats: notes.length,
    percentiles: PERCENTILES.map((p) => ({ p, note: percentile(tries, p) })),
  };
}

/** La clé d'une épreuve comparable : scénario × niveau × grille (et sa version). */
export const cleDeComparaison = (e: {
  scenarioCode: string;
  niveau: number;
  grilleCode: string;
  grilleVersion: number;
}): string => `${e.scenarioCode}:${e.niveau}:${e.grilleCode}:${e.grilleVersion}`;
