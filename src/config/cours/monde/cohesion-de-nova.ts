import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { HAUT_VERDASSE } from "./haut-verdasse";
import { HAUT_VERDASSE_HANDBALL } from "./haut-verdasse-handball";
import { ABSENCES_DE_L_ANNEE } from "./organisation-du-travail-de-nova";

/**
 * LE MONDE DU COURS : FÉDÉRER LES ACTEURS DE NOVA, CULTURE, STYLE DE DIRECTION, GROUPE, MOTIVATION ET
 * QUALITÉ DE VIE AU TRAVAIL (enseignement commun de terminale STMG, question 2.1, lot C).
 *
 * CE QUI VIENT DES FICHES : les 24 jours d'absence imprévue de l'équipe dans l'année
 * (organisation-du-travail-de-nova.ts) ; les agents de la communauté de communes et les bénévoles du
 * club (haut-verdasse.ts, haut-verdasse-handball.ts), pour comparer les statuts.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · UN JOUR D'ABSENCE coûte à NOVA 400 € : les heures supplémentaires de ceux qui remplacent et la
 *     production ralentie (les polyvalents évitent l'arrêt de la ligne, pas le ralentissement) ;
 *   · LES ACTIONS DE QUALITÉ DE VIE AU TRAVAIL que l'équipe a proposées, chacune avec son coût de l'année
 *     et les jours d'absence qu'elle évite (les médecins du travail l'estiment) : des sièges assis-debout
 *     et des tapis anti-fatigue (2 400 €, 8 jours), une pause de plus l'après-midi avec rotation des
 *     postes (1 600 €, 5 jours), un groupe d'expression chaque mois (600 €, 2 jours), une salle de repos
 *     rénovée (3 000 €, 3 jours).
 */

export const ENTREPRISES_DE_LA_COHESION = ENTREPRISES_DE_LA_DIRECTION;

export const COUT_D_UN_JOUR_D_ABSENCE = 400;

export const ACTIONS_QVT: readonly { nom: string; cout: number; joursEvites: number }[] = [
  { nom: "des sièges assis-debout et des tapis anti-fatigue", cout: 2_400, joursEvites: 8 },
  { nom: "une pause de plus l'après-midi, avec rotation des postes", cout: 1_600, joursEvites: 5 },
  { nom: "un groupe d'expression chaque mois", cout: 600, joursEvites: 2 },
  { nom: "une salle de repos rénovée", cout: 3_000, joursEvites: 3 },
];

/** Les n premières actions de la liste : leur coût, les jours évités, ce qu'ils valent, et le gain. */
export function qualiteDeVie(n: number) {
  const a = ACTIONS_QVT.slice(0, n);
  const cout = a.reduce((t, x) => t + x.cout, 0);
  const joursEvites = a.reduce((t, x) => t + x.joursEvites, 0);
  const economie = joursEvites * COUT_D_UN_JOUR_D_ABSENCE;
  return { n, cout, joursEvites, absencesRestantes: ABSENCES_DE_L_ANNEE - joursEvites, economie, gain: auCentime(economie - cout) };
}

/** Le nombre d'actions, dans l'ordre de la liste, qui rapporte le plus. */
export function actionsQuiRapportentLePlus() {
  let meilleur = 0;
  for (let n = 1; n <= ACTIONS_QVT.length; n++) if (qualiteDeVie(n).gain > qualiteDeVie(meilleur).gain) meilleur = n;
  return meilleur;
}

/** Une action seule : ce qu'elle coûte, ce qu'elle évite, ce qu'elle laisse. */
export function actionSeule(i: number) {
  const a = ACTIONS_QVT[i]!;
  const economie = a.joursEvites * COUT_D_UN_JOUR_D_ABSENCE;
  return { ...a, economie, gain: auCentime(economie - a.cout) };
}

/** Les statuts que le management doit prendre en compte, dans les organisations du territoire. */
export const STATUTS = { agents: HAUT_VERDASSE.agents.effectif, communaute: HAUT_VERDASSE.nom, club: HAUT_VERDASSE_HANDBALL.nom } as const;
