/**
 * LE VOCABULAIRE DE LTI 1.3, ÉCRIT UNE FOIS : les revendications (claims) du jeton, les
 * types de message, les rôles, et les adresses de l'outil.
 */

const LTI = "https://purl.imsglobal.org/spec/lti/claim";
const DL = "https://purl.imsglobal.org/spec/lti-dl/claim";

export const CLAIM = {
  version: `${LTI}/version`,
  typeDeMessage: `${LTI}/message_type`,
  deployment: `${LTI}/deployment_id`,
  roles: `${LTI}/roles`,
  ressource: `${LTI}/resource_link`,
  contexte: `${LTI}/context`,
  cible: `${LTI}/target_link_uri`,
  presentation: `${LTI}/launch_presentation`,
  personnalise: `${LTI}/custom`,
  reglagesDl: `${DL}/deep_linking_settings`,
  contenus: `${DL}/content_items`,
  donneesDl: `${DL}/data`,
  messageDl: `${DL}/msg`,
} as const;

export const VERSION_LTI = "1.3.0";

export const MESSAGE = {
  lancement: "LtiResourceLinkRequest",
  selection: "LtiDeepLinkingRequest",
  reponseSelection: "LtiDeepLinkingResponse",
} as const;

/** La configuration d'outil de l'inscription dynamique (IMS LTI Dynamic Registration). */
export const CONFIGURATION_OUTIL = "https://purl.imsglobal.org/spec/lti-tool-configuration";
export const CONFIGURATION_PLATEFORME = "https://purl.imsglobal.org/spec/lti-platform-configuration";

/** Le paramètre personnalisé qu'une sélection de contenu pose sur l'activité. */
export const PARAMETRE_CIBLE = "ba_cible";

export type RoleLti = "enseignant" | "eleve";

/**
 * Le rôle retenu ici. ENSEIGNANT : Instructor ou Administrator, dans le cours
 * (membership), l'établissement (institution) ou le système ; la forme courte
 * « Instructor » que la norme tolère aussi. Tout le reste, rôles inconnus compris,
 * est un ÉLÈVE : le moindre privilège par défaut.
 */
export function roleRetenu(roles: unknown): RoleLti {
  if (!Array.isArray(roles)) return "eleve";
  const enseignant = roles.some((r) => {
    if (typeof r !== "string") return false;
    if (r === "Instructor" || r === "Administrator") return true;
    return /^http:\/\/purl\.imsglobal\.org\/vocab\/lis\/v2\/(?:membership|institution\/person|system\/person)#(?:Instructor|Administrator)$/.test(
      r,
    );
  });
  return enseignant ? "enseignant" : "eleve";
}

/** Les adresses de l'outil, à partir de l'origine du site. */
export function adressesDeLOutil(origine: string) {
  return {
    connexion: `${origine}/api/lti/connexion`,
    lancement: `${origine}/api/lti/lancement`,
    redirection: `${origine}/api/lti/lancement`,
    selection: `${origine}/api/lti/lancement`,
    jwks: `${origine}/api/lti/jwks`,
    inscription: `${origine}/api/lti/inscription`,
  };
}

/** Le nom de l'outil tel que la plateforme l'affiche. */
export const NOM_DE_L_OUTIL = "Business Arena";

/** Durée de vie d'un jeton d'inscription dynamique. */
export const DUREE_JETON_INSCRIPTION_JOURS = 7;
