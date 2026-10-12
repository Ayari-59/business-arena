/**
 * LE VOCABULAIRE DU SERVICE DE NOTES (IMS LTI Assignment and Grade Services 1.3), écrit
 * une fois : la revendication du lancement, les portées, les types de contenu.
 */

const PORTEE = "https://purl.imsglobal.org/spec/lti-ags/scope";

export const PORTEES_AGS = {
  /** Lire, créer et modifier les colonnes du carnet de notes. */
  colonnes: `${PORTEE}/lineitem`,
  /** Lire les colonnes seulement. */
  colonnesEnLecture: `${PORTEE}/lineitem.readonly`,
  /** Lire les résultats (demandée, jamais utilisée pour l'instant). */
  resultats: `${PORTEE}/result.readonly`,
  /** Poser une note (un « score »). */
  notes: `${PORTEE}/score`,
} as const;

/** Les portées que l'outil demande à l'inscription dynamique. */
export const PORTEES_DEMANDEES: readonly string[] = [PORTEES_AGS.colonnes, PORTEES_AGS.resultats, PORTEES_AGS.notes];

/** La revendication du lancement qui porte le service de notes. */
export const CLAIM_AGS = "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint";

export const TYPE = {
  score: "application/vnd.ims.lis.v1.score+json",
  colonne: "application/vnd.ims.lis.v2.lineitem+json",
  colonnes: "application/vnd.ims.lis.v2.lineitemcontainer+json",
} as const;

/** La note maximale d'une copie : l'examen est noté sur 100. */
export const NOTE_MAXIMALE = 100;

/** Le préfixe des libellés et des commentaires vus dans le carnet de notes. */
export const MARQUE = "Business Arena";

/** L'étiquette posée sur les colonnes créées par l'outil (`tag`). */
export const ETIQUETTE = "business-arena";
