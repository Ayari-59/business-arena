/**
 * CE QUE VA COÛTER CE QU'ON S'APPRÊTE À DÉCIDER.
 *
 * L'écran annonçait un taux et laissait l'élève saisir un montant. Il voyait
 * donc « 5 %/an » et tapait « 80 000 », sans jamais rencontrer le chiffre qui
 * l'intéresse : ce que ces 80 000 € vont lui prendre, et combien il devra
 * rendre à chaque tour. C'est la différence entre saisir un paramètre et
 * prendre une décision, et c'est précisément ce que la simulation cherche à
 * faire travailler.
 *
 * TOUT CE QUI EST CALCULÉ ICI EST CALQUÉ SUR LE MOTEUR, et un test le vérifie
 * en faisant tourner une vraie simulation : un chiffrage qui diverge de ce qui
 * sera prélevé serait pire que pas de chiffrage du tout.
 *
 * Les règles reprises (voir `engine/simulation` et `engine/finance/statements`) :
 *  · l'échéance d'un tour amortit le capital à parts égales sur la durée ;
 *  · les intérêts d'un tour se calculent sur la dette À L'OUVERTURE, au prorata
 *    de la durée du tour (roundDays / 360) ;
 *  · un emprunt contracté pendant un tour entre donc en dette à sa clôture :
 *    il ne porte intérêt qu'à partir du tour SUIVANT ;
 *  · l'escompte prélève des agios au prorata du tour, l'affacturage une
 *    commission sur le montant, sans prorata.
 */

/** Le dénominateur de l'année bancaire, celui du moteur. */
const JOURS_DANS_L_ANNEE = 360;

export interface EcheancierEmprunt {
  /** Capital remboursé à chaque tour, échéance obligatoire. */
  echeanceParTour: number;
  /** Intérêts cumulés sur toute la durée du contrat. */
  interets: number;
  /** Capital + intérêts : ce que l'emprunt aura coûté en tout. */
  totalARembourser: number;
  /** Nombre de tours pendant lesquels l'échéance sera prélevée. */
  tours: number;
}

/**
 * L'échéancier d'un emprunt qu'on s'apprête à contracter.
 *
 * On déroule les tours plutôt que d'appliquer une formule fermée : la règle du
 * moteur (intérêts sur la dette d'ouverture, emprunt qui n'entre qu'à la
 * clôture) se lit alors directement, et le jour où elle change, c'est ici que
 * ça se voit.
 */
export function echeancierEmprunt(args: {
  montant: number;
  dureeEnTours: number;
  tauxAnnuel: number;
  joursDuTour: number;
}): EcheancierEmprunt {
  const montant = Math.max(0, args.montant);
  const tours = Math.max(1, Math.trunc(args.dureeEnTours));
  const fractionDAnnee = args.joursDuTour / JOURS_DANS_L_ANNEE;
  const echeanceParTour = montant / tours;

  // L'emprunt n'est en dette qu'à la clôture du tour où on le contracte : le
  // premier tour intéressé est le suivant, dette encore entière.
  let restant = montant;
  let interets = 0;
  for (let tour = 0; tour < tours; tour++) {
    interets += restant * args.tauxAnnuel * fractionDAnnee;
    restant = Math.max(0, restant - echeanceParTour);
  }

  return {
    echeanceParTour,
    interets,
    totalARembourser: montant + interets,
    tours,
  };
}

export interface CoutDeMobilisation {
  /** Ce que l'opération prélève. */
  cout: number;
  /** Ce qui tombe réellement en caisse. */
  net: number;
}

/** Escompte : des agios au prorata de la durée du tour. */
export function coutDeLEscompte(args: {
  montant: number;
  tauxAnnuel: number;
  joursDuTour: number;
}): CoutDeMobilisation {
  const montant = Math.max(0, args.montant);
  const cout = montant * args.tauxAnnuel * (args.joursDuTour / JOURS_DANS_L_ANNEE);
  return { cout, net: montant - cout };
}

/** Affacturage : une commission sur le montant cédé, sans prorata de durée. */
export function coutDeLAffacturage(args: {
  montant: number;
  commission: number;
}): CoutDeMobilisation {
  const montant = Math.max(0, args.montant);
  const cout = montant * args.commission;
  return { cout, net: montant - cout };
}

/** Le cumul des études cochées : ce que l'information aura coûté ce tour-ci. */
export function totalDesEtudes(prixCoches: readonly number[]): number {
  return prixCoches.reduce((total, prix) => total + Math.max(0, prix), 0);
}
