/**
 * LE PLAFOND PAR DESTINATAIRE DES FORMULAIRES PUBLICS (audit d'octobre 2026, P2-4).
 *
 * Rendez-vous téléphonique, demande de devis, demande de simulation : chacun écrit à
 * l'adresse saisie, ou lui répond. Le plafond par adresse d'origine se contourne en
 * changeant d'IP ; celui-ci compte les demandes faites AU NOM d'une même adresse e-mail,
 * d'où qu'elles viennent, sur 24 heures glissantes. Trois suffisent à un enseignant qui
 * se reprend ; au-delà, c'est un tiers qu'on fait écrire.
 */
export const PLAFOND_PAR_DESTINATAIRE_PAR_JOUR = 3;
export const FENETRE_PAR_DESTINATAIRE_MS = 24 * 60 * 60 * 1000;
export const REFUS_PAR_DESTINATAIRE =
  "Trop de demandes pour cette adresse e-mail aujourd'hui : réessayez demain, ou écrivez-nous.";
