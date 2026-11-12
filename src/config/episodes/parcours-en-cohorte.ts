/**
 * LE PARCOURS EN COHORTE : 8 SEMAINES, TEL QUE LE GUIDE D'ANIMATION LE DÉROULE.
 *
 * Il ne se lisait que sur /ecoles, écrit dans la page. La page des entreprises ne disait ni durée ni
 * déroulé (audit de l'offre du 11 novembre 2026, P1-4) : le propriétaire a décidé qu'elle dise le
 * même parcours. Il s'écrit donc une fois, ici, et /ecoles comme /entreprises/offre le lisent.
 * Le nombre de semaines se tire des étapes, jamais écrit à côté d'elles. Une espace insécable
 * (`\u00a0`) tient chaque nombre à son unité : « 20 minutes » ne se coupe pas en fin de ligne.
 */

export interface EtapeDuParcours {
  /** La semaine où l'étape commence, et celle où elle finit (la même pour une étape d'une semaine). */
  de: number;
  a: number;
  /** « Semaine 1 », « Semaines 2 à 7 », « Toutes les 2 semaines ». */
  quand: string;
  quoi: string;
  texte: string;
}

export const PARCOURS_EN_COHORTE: readonly EtapeDuParcours[] = [
  {
    de: 1,
    a: 1,
    quand: "Semaine 1",
    quoi: "Le lancement",
    texte: "1\u00a0h\u00a030 : chacun rejoint la cohorte par un code, et joue l'épisode d'entrée.",
  },
  {
    de: 2,
    a: 7,
    quand: "Semaines 2 à 7",
    quoi: "Un épisode par semaine",
    texte: "En autonomie, choisi d'après son propre bilan : 20\u00a0minutes, sur ordinateur ou téléphone.",
  },
  {
    de: 2,
    a: 8,
    quand: "Toutes les 2\u00a0semaines",
    quoi: "Un débrief de 1\u00a0h",
    texte:
      "Tout le groupe a joué le même trimestre sous les mêmes aléas : on discute des 2\u00a0décisions qui l'ont le plus partagé.",
  },
  {
    de: 8,
    a: 8,
    quand: "Semaine 8",
    quoi: "La clôture",
    texte:
      "Un dernier épisode, puis chacun lit son profil, qui compare ses premiers épisodes aux plus récents, et choisit une compétence à travailler.",
  },
];

/** La durée du parcours, en semaines : la dernière semaine d'une étape. */
export const SEMAINES_DU_PARCOURS = Math.max(...PARCOURS_EN_COHORTE.map((e) => e.a));

/** Le temps de chaque participant, tel que le guide d'animation le compte. */
export const TEMPS_DU_PARCOURS = "environ 8\u00a0h\u00a030 par participant, dont 3\u00a0h en autonomie";
