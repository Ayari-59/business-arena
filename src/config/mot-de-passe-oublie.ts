/**
 * LE MOT DE PASSE OUBLIÉ DES ENSEIGNANTS : durées, plafonds et textes
 * (services/mot-de-passe-oublie.service.ts).
 */

const MINUTE = 60 * 1000;

/** Un lien de réinitialisation vaut une heure, et sert une seule fois. */
export const DUREE_DU_JETON_DE_REINITIALISATION_MS = 60 * MINUTE;
/** La même durée, dite dans les textes : lue de la constante, jamais écrite à la main. */
export const DUREE_DU_JETON_DITE = (() => {
  const minutes = Math.round(DUREE_DU_JETON_DE_REINITIALISATION_MS / MINUTE);
  return minutes === 60 ? "une heure" : `${minutes} minutes`;
})();

/**
 * Le plafond par ADRESSE D'ORIGINE (`garderLesTentatives`, sur la fenêtre de quinze minutes
 * de la reprise) : chaque demande compte, puisque chacune peut faire partir un courriel.
 */
export const MAX_DEMANDES_DE_REINITIALISATION_PAR_ADRESSE = 5;

/** Ce que la table des échecs range sous ce geste. */
export const MARQUEUR_MOT_DE_PASSE_OUBLIE = "mot-de-passe-oublie";

/**
 * LE MÊME MESSAGE, QUE LE COMPTE EXISTE OU NON. Il ne dit pas non plus si un courriel est
 * réellement parti (plafond par destinataire atteint, compte RENATER ou LTI sans mot de passe).
 */
export const REPONSE_A_LA_DEMANDE =
  "Si un compte enseignant avec mot de passe existe pour cette adresse, un lien de réinitialisation vient d'y être envoyé. " +
  `Il reste valable ${DUREE_DU_JETON_DITE} et ne sert qu'une fois. Pensez à regarder dans les indésirables.`;

/**
 * Les comptes ouverts par l'établissement n'ont pas de mot de passe ici : la page le dit. Tant que la
 * connexion par l'établissement (RENATER) n'est pas proposée (saml/configuration.ts,
 * `connexionEtablissementProposee` ; config/connexion-etablissement.ts), la page ne renvoie pas vers
 * elle : elle ne parle que de la plateforme de cours.
 */
export function comptesSansMotDePasse(connexionEtablissement: boolean): string {
  return connexionEtablissement
    ? "Vous vous connectez par votre établissement (RENATER) ou depuis votre plateforme de cours (Moodle, LTI) ? " +
        "Votre compte n'a pas de mot de passe sur Business Arena : aucun lien ne vous sera envoyé. " +
        "Utilisez la connexion par l'établissement ou ouvrez Business Arena depuis votre cours."
    : "Vous ouvrez Business Arena depuis votre plateforme de cours (Moodle, LTI) ? " +
        "Votre compte n'a pas de mot de passe sur Business Arena : aucun lien ne vous sera envoyé. " +
        "Ouvrez Business Arena depuis votre cours.";
}
