// Sans dépendance : les pages lisent l'état (saml/configuration.ts, `connexionEtablissementProposee`)
// et passent ici un booléen ; les gardes lisent les deux versions sans configurer SAML.

/**
 * LA CONNEXION PAR L'ÉTABLISSEMENT (RENATER), DITE COMME ELLE EST (chantier « petits points de
 * novembre », 11 novembre 2026).
 *
 * Le bouton « Se connecter avec mon établissement » ne paraît que sur la fédération de PRODUCTION
 * (audit du 10 novembre 2026, production P1-2 ; components/connexion-etablissement.tsx). La page
 * /integration et le guide du référent le décrivaient pourtant comme présent (la page du mot de passe
 * oublié aussi : config/mot-de-passe-oublie.ts). Ils lisent maintenant l'état : tant que la connexion
 * n'est pas proposée, ils la disent prévue, ouverte une fois l'inscription de Business Arena à la
 * fédération faite, et disent comment on entre aujourd'hui ; le jour où SAML_FEDERATION passe à
 * « production », ils disent le bouton, sans autre changement. Les pages prérendues le sont au build :
 * un changement de variable demande un nouveau déploiement, qui les reconstruit.
 */

/** Le libellé du bouton, tel que l'écran l'écrit. */
export const BOUTON_DE_L_ETABLISSEMENT = "Se connecter avec mon établissement";

/** Les trois écrans où le bouton paraît. */
const OU_PARAIT_LE_BOUTON = "sur la page de connexion des enseignants, sur l'entrée par code et sur l'invitation d'une cohorte";

/** Comment on entre tant que la connexion n'est pas ouverte. */
export const ON_ENTRE_AUJOURD_HUI = "Aujourd'hui, on entre par le code donné par l'enseignant, ou par son compte enseignant.";

export interface ConnexionDite {
  /** Le premier paragraphe de la section RENATER de /integration. */
  integration: string;
  /** Ce qui précède la liste de ce que la connexion ouvre, sur /integration ; null quand elle est ouverte. */
  avantLaListe: string | null;
  /** La phrase du guide du référent, à l'étape RENATER (jeton `{{connexionEtablissement}}`). */
  guide: string;
}

export function connexionEtablissementDite(proposee: boolean): ConnexionDite {
  if (proposee) {
    return {
      integration: `Disponible pour les établissements de la Fédération Éducation-Recherche : universités, écoles et organismes reliés à RENATER. Sur la page de connexion des enseignants, sur l'entrée par code et sur l'invitation d'une cohorte, un bouton « ${BOUTON_DE_L_ETABLISSEMENT} » mène au service de découverte de RENATER. On y choisit son établissement, on s'identifie chez lui avec ses identifiants habituels, et l'on revient sur Business Arena.`,
      avantLaListe: null,
      guide: `Sur la page de connexion des enseignants, sur l'entrée par code et sur l'invitation d'une cohorte, le bouton « ${BOUTON_DE_L_ETABLISSEMENT} » mène au service de découverte de RENATER.`,
    };
  }
  return {
    integration: `Prévue pour les établissements de la Fédération Éducation-Recherche : universités, écoles et organismes reliés à RENATER. Elle s'ouvrira une fois l'inscription de Business Arena à la fédération faite : un bouton « ${BOUTON_DE_L_ETABLISSEMENT} » paraîtra alors ${OU_PARAIT_LE_BOUTON}, et mènera au service de découverte de RENATER. ${ON_ENTRE_AUJOURD_HUI}`,
    avantLaListe: "Une fois la connexion ouverte :",
    guide: `La connexion est prévue : elle s'ouvrira une fois l'inscription de Business Arena à la fédération faite, et le bouton « ${BOUTON_DE_L_ETABLISSEMENT} » paraîtra alors ${OU_PARAIT_LE_BOUTON}. ${ON_ENTRE_AUJOURD_HUI}`,
  };
}

