import { auCentime, type DateDuCours } from "./amortissement";
import { echeanceConstante, empruntALaCloture, tableauDAmortissement, type LigneDEmprunt } from "./emprunt";
import { EXERCICE_DE_NOVA, type FicheDeLExercice } from "./exercice-de-nova";

/**
 * LE MONDE DU BUREAU « LE PRÊT DE L'ANNÉE » (comptabilité générale, palier 3 ; la suite du chapitre
 * « L'emprunt et ses intérêts »).
 *
 * Le prêt est celui de la fiche de l'exercice N (exercice-de-nova.ts, CONTRAT_DE_PRET : 80 000 € à 5 %
 * l'an sur 5 ans, versés le 3 janvier, une échéance par trimestre en amortissement constant), lu par le
 * modèle du cours (emprunt.ts). Rien n'est recopié : le tableau, les intérêts courus et l'emprunt au
 * 31 décembre se calculent ici comme au chapitre.
 *
 * CE QUI EST NEUF EST UNE HYPOTHÈSE DU BUREAU, nommée ci-dessous :
 *   · le jour où l'élève ouvre la pile, avant la clôture des comptes de N ;
 *   · l'erreur du président, qui a passé lui-même le versement et la première échéance : il a porté
 *     toute l'échéance au débit du 164, intérêts compris ;
 *   · la proposition de la banque de passer le reste du prêt en échéances constantes, au même taux.
 * La garde tests/cours/bureau-le-pret-de-l-annee.test.ts refait chaque chiffre à la main.
 */

/** LE JOUR DU BUREAU (hypothèse) : le 5 janvier N+1, la pile de l'année attend la clôture de N. */
export const JOUR_DU_BUREAU: DateDuCours = { jour: 5, mois: 1, exercice: 1 };

/**
 * L'ERREUR DU PRÉSIDENT (hypothèse) : l'échéance n° 1, prélevée le 3 avril, a été passée en entier au
 * débit du 164 ; le 6611 n'a reçu aucun intérêt. Les échéances n° 2 et n° 3 attendent dans la pile.
 */
export const ECHEANCE_MAL_PASSEE = 1;
export const ECHEANCES_A_PASSER = [2, 3] as const;

/**
 * LA PROPOSITION DE LA BANQUE (hypothèse) : à partir de l'échéance d'avril N+1, rembourser ce qui reste
 * dû par une échéance constante, au même taux et à la même fin de contrat. L'échéance de janvier N+1,
 * déjà prélevée, ne change pas. L'avenant se signerait en janvier N+1 : il ne touche pas les comptes de N.
 */
export const PREMIERE_ECHEANCE_DE_L_AVENANT = 5;

/** Le prêt de l'année, tel que le bureau le contrôle. */
export function pretDeLAnnee(f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const contrat = f.pret;
  const tableau = tableauDAmortissement(contrat);
  const annee = empruntALaCloture(contrat);
  const e = (k: number): LigneDEmprunt => tableau[k - 1]!;
  const mal = e(ECHEANCE_MAL_PASSEE);
  const courus = annee.interetsCourus;
  const suivante = courus.echeanceSuivante!;
  // Ce que le compte 164 porte avant le travail : le versement, moins toute l'échéance n° 1.
  const soldeDu164Avant = auCentime(contrat.capital - mal.echeance);
  // La proposition de la banque : le capital dû avant l'échéance d'avril N+1, en échéances constantes sur les trimestres restants.
  const premiereDeLAvenant = e(PREMIERE_ECHEANCE_DE_L_AVENANT);
  const restantes = tableau.length - PREMIERE_ECHEANCE_DE_L_AVENANT + 1;
  const constante = echeanceConstante({ capital: premiereDeLAvenant.capitalDebut, tauxAnnuel: contrat.tauxAnnuel, dureeAns: restantes / contrat.echeancesParAn, echeancesParAn: contrat.echeancesParAn });
  return {
    contrat,
    tableau,
    e,
    annee,
    courus,
    suivante,
    /** Le capital remboursé à chaque échéance. */
    capital: mal.amortissement,
    /** Le taux du trimestre. */
    i: contrat.tauxAnnuel / contrat.echeancesParAn,
    mal,
    soldeDu164Avant,
    /** Les intérêts que le président a laissés dans le 164 : ce que la correction ramène au 6611. */
    correction: mal.interets,
    partAPlusDUnAn: auCentime(annee.capitalRestantDu - annee.partAMoinsDUnAn),
    premiereDeLAvenant,
    restantes,
    constante,
  };
}
