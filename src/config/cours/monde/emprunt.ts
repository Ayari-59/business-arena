import { auCentime, clotureDe, joursCompris, plusDesMois, rangDuJour, type DateDuCours } from "./amortissement";

/**
 * LE MODÈLE DE L'EMPRUNT DU COURS : le tableau d'amortissement (amortissement constant ou
 * échéances constantes), l'emprunt lu à une clôture, les intérêts courus à une date.
 *
 * Des fonctions pures : le contrat et le mode de remboursement sont des paramètres (un laboratoire
 * change le montant, le taux, la durée ou le mode). Le prêt de NOVA est dans
 * monde/exercice-de-nova.ts ; la garde tests/cours/exercice-de-nova.test.ts refait chaque tableau.
 *
 *   · LE TAUX DE LA PÉRIODE est le taux annuel ÷ le nombre d'échéances par an (le taux
 *     proportionnel, celui des contrats du cours) : 5 % l'an, 1,25 % le trimestre.
 *   · AMORTISSEMENT CONSTANT : chaque échéance rembourse capital ÷ nombre d'échéances, et paie
 *     les intérêts de la période sur le capital restant dû avant elle.
 *   · ÉCHÉANCES CONSTANTES : a = capital × i ÷ (1 − (1 + i)^−n), arrondie au centime ; les
 *     intérêts sur le capital restant dû, le capital remboursé est ce qui reste de l'échéance.
 *   · Dans les deux modes, la dernière ligne rembourse exactement ce qui reste dû : le tableau
 *     solde le capital au centime.
 *   · LES INTÉRÊTS COURUS à une date sont ceux de l'échéance suivante, au prorata des jours passés
 *     depuis l'échéance précédente (ou le versement des fonds), jours compris, sur la période :
 *     la convention des jours de monde/amortissement.ts (mois de 30 jours).
 */

export type ModeDeRemboursement = "amortissement-constant" | "echeances-constantes";

export interface ContratDePret {
  capital: number;
  tauxAnnuel: number;
  dureeAns: number;
  echeancesParAn: number;
  /** Le jour où la banque verse les fonds : les intérêts courent dès ce jour. */
  versement: DateDuCours;
  /** La première échéance ; les suivantes tombent le même jour, tous les 12 ÷ echeancesParAn mois. */
  premiereEcheance: DateDuCours;
  mode: ModeDeRemboursement;
}

export interface LigneDEmprunt {
  numero: number;
  date: DateDuCours;
  capitalDebut: number;
  interets: number;
  amortissement: number;
  echeance: number;
  capitalFin: number;
}

export const tauxDeLaPeriode = (c: ContratDePret) => c.tauxAnnuel / c.echeancesParAn;
export const nombreDEcheances = (c: ContratDePret) => c.dureeAns * c.echeancesParAn;

/** L'échéance constante d'un prêt, arrondie au centime. */
export function echeanceConstante(c: Pick<ContratDePret, "capital" | "tauxAnnuel" | "dureeAns" | "echeancesParAn">) {
  const i = c.tauxAnnuel / c.echeancesParAn;
  const n = c.dureeAns * c.echeancesParAn;
  return i === 0 ? auCentime(c.capital / n) : auCentime((c.capital * i) / (1 - (1 + i) ** -n));
}

/** Le tableau d'amortissement complet, dans le mode du contrat ou celui qu'on choisit. */
export function tableauDAmortissement(c: ContratDePret, mode: ModeDeRemboursement = c.mode): LigneDEmprunt[] {
  const n = nombreDEcheances(c);
  const i = tauxDeLaPeriode(c);
  const pas = 12 / c.echeancesParAn;
  const constante = echeanceConstante(c);
  const lignes: LigneDEmprunt[] = [];
  let du = c.capital;
  for (let k = 1; k <= n; k++) {
    const interets = auCentime(du * i);
    let amortissement = mode === "amortissement-constant" ? auCentime(c.capital / n) : auCentime(constante - interets);
    if (k === n) amortissement = du;
    const capitalFin = auCentime(du - amortissement);
    lignes.push({ numero: k, date: plusDesMois(c.premiereEcheance, (k - 1) * pas), capitalDebut: du, interets, amortissement, echeance: auCentime(amortissement + interets), capitalFin });
    du = capitalFin;
  }
  return lignes;
}

/** Le coût total du crédit : la somme des intérêts du tableau. */
export function coutDuCredit(c: ContratDePret, mode: ModeDeRemboursement = c.mode) {
  return auCentime(tableauDAmortissement(c, mode).reduce((t, l) => t + l.interets, 0));
}

/**
 * LES INTÉRÊTS COURUS À UNE DATE : nés depuis la dernière échéance payée (ou le versement), pas
 * encore prélevés. Ils appartiennent à l'exercice qui se clôt (compte 1688, intérêts courus).
 */
export function interetsCourus(c: ContratDePret, date: DateDuCours, mode: ModeDeRemboursement = c.mode) {
  const tableau = tableauDAmortissement(c, mode);
  const rang = rangDuJour(date);
  const suivante = tableau.find((l) => rangDuJour(l.date) > rang);
  if (!suivante) return { echeanceSuivante: null, depuis: null, jours: 0, joursDeLaPeriode: 0, montant: 0 };
  const precedente = tableau.filter((l) => rangDuJour(l.date) <= rang).at(-1);
  const depuis = precedente ? precedente.date : c.versement;
  // Les jours qui portent intérêt jusqu'à la date, jour compris : de l'échéance précédente à la veille de la suivante.
  const jours = joursCompris(depuis, date);
  const joursDeLaPeriode = rangDuJour(suivante.date) - rangDuJour(depuis);
  return { echeanceSuivante: suivante, depuis, jours, joursDeLaPeriode, montant: auCentime((suivante.interets * jours) / joursDeLaPeriode) };
}

/**
 * L'EMPRUNT LU À LA CLÔTURE D'UN EXERCICE : les échéances payées dans l'exercice, les intérêts
 * payés et le capital remboursé, le capital restant dû, la part à rembourser dans les douze mois,
 * les intérêts courus, et la charge d'intérêts de l'exercice (payés + courus de la fin − courus
 * de l'ouverture, extournés).
 */
export function empruntALaCloture(c: ContratDePret, exercice = 0, mode: ModeDeRemboursement = c.mode) {
  const tableau = tableauDAmortissement(c, mode);
  const debut = rangDuJour({ jour: 1, mois: 1, exercice });
  const fin = rangDuJour(clotureDe(exercice));
  const dansLExercice = tableau.filter((l) => rangDuJour(l.date) >= debut && rangDuJour(l.date) <= fin);
  const avantLaFin = tableau.filter((l) => rangDuJour(l.date) <= fin);
  const dansLesDouzeMois = tableau.filter((l) => rangDuJour(l.date) > fin && rangDuJour(l.date) <= fin + 360);
  const courus = interetsCourus(c, clotureDe(exercice), mode);
  const courusDOuverture = exercice > 0 ? interetsCourus(c, clotureDe(exercice - 1), mode).montant : 0;
  const interetsPayes = auCentime(dansLExercice.reduce((t, l) => t + l.interets, 0));
  const versementDansLExercice = rangDuJour(c.versement) >= debut && rangDuJour(c.versement) <= fin;
  return {
    echeances: dansLExercice,
    interetsPayes,
    capitalRembourse: auCentime(dansLExercice.reduce((t, l) => t + l.amortissement, 0)),
    decaissements: auCentime(dansLExercice.reduce((t, l) => t + l.echeance, 0)),
    capitalRestantDu: rangDuJour(c.versement) > fin ? 0 : auCentime(c.capital - avantLaFin.reduce((t, l) => t + l.amortissement, 0)),
    partAMoinsDUnAn: auCentime(dansLesDouzeMois.reduce((t, l) => t + l.amortissement, 0)),
    interetsCourus: courus,
    chargeDInterets: auCentime(interetsPayes + courus.montant - courusDOuverture),
    fondsVersesDansLExercice: versementDansLExercice,
  };
}
