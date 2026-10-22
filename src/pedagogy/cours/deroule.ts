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

/**
 * Le chapitre tel qu'il se joue dans cette entreprise : les règlements (les étapes qui
 * portent une échéance) prennent l'ordre de leurs dates, à leurs places. Le fournisseur
 * de NOVA se paie avant l'URSSAF, celui de MAILLE & CO après : le journal reste
 * chronologique dans les deux cas. Les autres fonctions de ce fichier attendent un
 * chapitre ainsi ordonné.
 */
export function chapitreDuCas(chapitre: Chapitre, cas: Cas): Chapitre {
  const places = chapitre.etapes.flatMap((e, i) => (e.type === "ecriture" && e.echeance ? [i] : []));
  const jour = (i: number) => {
    const e = chapitre.etapes[i]!;
    return e.type === "ecriture" && e.echeance ? e.echeance(cas) : 0;
  };
  const triees = [...places].sort((a, b) => jour(a) - jour(b));
  const etapes = [...chapitre.etapes];
  places.forEach((place, k) => (etapes[place] = chapitre.etapes[triees[k]!]!));
  return { ...chapitre, etapes };
}

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
