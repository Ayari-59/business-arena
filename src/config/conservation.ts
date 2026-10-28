/**
 * LES DURÉES DE CONSERVATION, DÉCISIONS DU PROPRIÉTAIRE (octobre 2026).
 *
 * Un seul fichier pour toutes les durées : la purge de chaque nuit
 * (services/purge.service.ts, lancée par /api/cron/purge) les applique, et les
 * mentions légales (app/mentions-legales/page.tsx) les citent d'ici. Changer une
 * durée ici change donc à la fois ce que fait la purge et ce que dit la page.
 *
 * Chaque durée se compte en jours, sauf la première (en heures). Une année vaut
 * 365 jours et un mois 30 jours : la purge tourne une fois par nuit, un jour
 * d'écart sur une année n'a pas d'effet pratique.
 */

const JOUR_MS = 24 * 60 * 60 * 1000;
const AN = 365;

/**
 * Les tentatives de connexion échouées (e-mail et adresse IP) : 24 heures. Elles
 * ne servent qu'à freiner les essais de mot de passe, sur une fenêtre de quelques
 * minutes (services/auth.service.ts) ; au-delà d'une journée, elles n'ont plus d'usage.
 */
export const TENTATIVES_DE_CONNEXION_HEURES = 24;

/**
 * L'adresse IP d'une partie solo (`games.creator_ip`) : 7 jours. Elle ne sert qu'à
 * plafonner les parties créées depuis une même adresse sur une heure, contre les
 * abus ; passé une semaine, seule l'adresse est effacée, la partie reste.
 */
export const IP_DES_PARTIES_SOLO_JOURS = 7;

/**
 * Les élèves sans compte (identités invitées, pseudo et cookie) : 12 mois sans
 * activité. Le cookie invité dure lui aussi 12 mois : passé ce délai, plus aucun
 * appareil ne retrouve l'identité.
 */
export const INVITES_INACTIFS_JOURS = AN;

/**
 * Les parties et les résultats des élèves (décisions, scores, classements,
 * situations, parties d'épisodes) : 1 an après la fin de la partie, c'est-à-dire
 * après sa dernière activité (création, dernier tour clos, dernière décision).
 * Une année scolaire entière, débriefing et relevé de notes compris.
 */
export const PARTIES_ET_RESULTATS_JOURS = AN;

/**
 * Les examens (nom, numéro d'étudiant, note de chaque candidat) : 1 an après
 * l'examen, c'est-à-dire après sa fermeture ou la dernière copie remise. Le temps
 * d'un éventuel recours sur la note.
 */
export const EXAMENS_JOURS = AN;

/**
 * Les comptes enseignants sans connexion : 3 ans. Un e-mail d'avertissement part
 * un mois avant (AVERTISSEMENT_AVANT_SUPPRESSION_JOURS) ; une connexion entre les
 * deux garde le compte.
 */
export const ENSEIGNANTS_INACTIFS_JOURS = 3 * AN;

/** Le délai entre l'e-mail d'avertissement et la suppression du compte enseignant : un mois. */
export const AVERTISSEMENT_AVANT_SUPPRESSION_JOURS = 30;

/**
 * Les demandes de devis, de rendez-vous et d'orientation : 3 ans après le
 * dernier contact (la demande, son traitement, ou la date du rendez-vous).
 */
export const DEMANDES_JOURS = 3 * AN;

/** Une durée en jours, dite en années entières (pour les textes : « 3 ans »). */
export const enAnnees = (j: number): number => Math.round(j / AN);

/** Une durée en jours, en millisecondes. */
export const jours = (n: number): number => n * JOUR_MS;

/** Une durée en heures, en millisecondes. */
export const heures = (n: number): number => n * 60 * 60 * 1000;

/** Le mot à taper dans la page pour confirmer une suppression définitive (compte, établissement, élève). */
export const MOT_DE_SUPPRESSION = "SUPPRIMER";
