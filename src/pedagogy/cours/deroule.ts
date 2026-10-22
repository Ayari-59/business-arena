import { enEcriture } from "./correcteur";
import { soldes, type Ecriture } from "./etats";
import type { Cas } from "../../config/cours/cas";
import type { Chapitre, EtatDuCours } from "../../config/cours/types";

/**
 * LE DÉROULÉ D'UN CHAPITRE : où en est le journal à chaque étape.
 *
 * Une écriture validée est versée au journal sous sa forme corrigée (les comptes
 * et montants attendus) : l'élève qui a écrit 215 au lieu de 2154, accepté, ne
 * fausse pas la suite ; le bilan qu'il construit plus loin se compare à un seul
 * journal, le même pour toute la classe.
 */

/** Les écritures des étapes qui précèdent l'étape `index` (exclue). */
export function journalAvant(chapitre: Chapitre, cas: Cas, index: number): Ecriture[] {
  return chapitre.etapes.slice(0, index).flatMap((e) => (e.type === "ecriture" ? [enEcriture(e.ecriture(cas))] : []));
}

export function etatAvant(chapitre: Chapitre, cas: Cas, index: number): EtatDuCours {
  return { soldes: soldes(journalAvant(chapitre, cas, index)) };
}

/** L'état une fois l'étape `index` passée (son écriture comprise, si elle en a une). */
export function etatApres(chapitre: Chapitre, cas: Cas, index: number): EtatDuCours {
  return etatAvant(chapitre, cas, index + 1);
}

/** L'index d'une étape par son identifiant. */
export function indexDeLEtape(chapitre: Chapitre, id: string): number {
  const i = chapitre.etapes.findIndex((e) => e.id === id);
  if (i < 0) throw new Error(`Étape inconnue : ${id}`);
  return i;
}
