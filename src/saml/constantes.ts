/**
 * LE VOCABULAIRE DE LA CONNEXION PAR L'ÉTABLISSEMENT (SAML 2.0, FÉDÉRATION
 * ÉDUCATION-RECHERCHE DE RENATER), ÉCRIT UNE FOIS.
 */

/** Les deux fédérations de RENATER : celle de TEST, pour la mise au point, et la production. */
export type Federation = "test" | "production";

/**
 * LES ADRESSES DOCUMENTÉES PAR RENATER (services.renater.fr, « Fédération
 * Éducation-Recherche », pages « Métadonnées » et « Service de découverte »).
 *
 * Elles ne sont joignables ni d'ici ni des tests (réseau fermé) : elles sont écrites
 * telles que la documentation de RENATER les donne, et chacune peut être remplacée par
 * une variable d'environnement (voir configuration.ts) si RENATER en change. Le
 * rapport de livraison dit lesquelles vérifier avant la mise en service.
 *
 *   · l'agrégat des IdP (les seuls fournisseurs d'identités, plus léger que l'agrégat
 *     complet) ;
 *   · le service de découverte (WAYF : « Where Are You From ») de chaque fédération.
 */
export const ADRESSES_RENATER: Record<Federation, { metadonnees: string; wayf: string }> = {
  production: {
    metadonnees: "https://pub.federation.renater.fr/metadata/renater/main/main-idps-renater-metadata.xml",
    wayf: "https://discovery.renater.fr/renater/WAYF",
  },
  test: {
    metadonnees: "https://pub.federation.renater.fr/metadata/test/preview/preview-idps-test-metadata.xml",
    wayf: "https://discovery.renater.fr/test/WAYF",
  },
};

/** Le certificat avec lequel RENATER signe ses métadonnées (adresse documentée, à télécharger et à épingler). */
export const CERTIFICAT_DE_SIGNATURE_RENATER =
  "https://pub.federation.renater.fr/metadata/certs/renater-metadata-signing-cert-2016.pem";

/** Les attributs, par leur nom SAML (URI) : ceux que Business Arena demande. */
export const ATTRIBUT = {
  pairwiseId: "urn:oasis:names:tc:SAML:attribute:pairwise-id",
  eduPersonTargetedID: "urn:oid:1.3.6.1.4.1.5923.1.1.1.10",
  eduPersonScopedAffiliation: "urn:oid:1.3.6.1.4.1.5923.1.1.1.9",
  eduPersonAffiliation: "urn:oid:1.3.6.1.4.1.5923.1.1.1.1",
  schacHomeOrganization: "urn:oid:1.3.6.1.4.1.25178.1.2.9",
  displayName: "urn:oid:2.16.840.1.113730.3.1.241",
  mail: "urn:oid:0.9.2342.19200300.100.1.3",
} as const;

/** Les attributs demandés dans les métadonnées : nom court, requis ou non, et pourquoi. */
export const ATTRIBUTS_DEMANDES: { nom: string; uri: string; requis: boolean; pourquoi: string }[] = [
  {
    nom: "pairwise-id",
    uri: ATTRIBUT.pairwiseId,
    requis: true,
    pourquoi: "Identifiant pseudonyme propre à Business Arena : retrouver la personne d'une visite à l'autre.",
  },
  {
    nom: "eduPersonTargetedID",
    uri: ATTRIBUT.eduPersonTargetedID,
    requis: false,
    pourquoi: "Le même identifiant pseudonyme, sous sa forme ancienne, quand pairwise-id n'est pas disponible.",
  },
  {
    nom: "eduPersonScopedAffiliation",
    uri: ATTRIBUT.eduPersonScopedAffiliation,
    requis: true,
    pourquoi: "Étudiant ou personnel : l'un joue, l'autre ouvre l'espace enseignant.",
  },
  {
    nom: "eduPersonAffiliation",
    uri: ATTRIBUT.eduPersonAffiliation,
    requis: false,
    pourquoi: "Le même statut, sans le domaine de l'établissement.",
  },
  {
    nom: "schacHomeOrganization",
    uri: ATTRIBUT.schacHomeOrganization,
    requis: true,
    pourquoi: "L'établissement, pour appliquer sa licence.",
  },
  {
    nom: "displayName",
    uri: ATTRIBUT.displayName,
    requis: false,
    pourquoi: "Personnels seulement : le nom affiché dans l'espace enseignant. Jamais gardé pour un étudiant.",
  },
  {
    nom: "mail",
    uri: ATTRIBUT.mail,
    requis: false,
    pourquoi: "Personnels seulement : pour joindre l'enseignant. Jamais gardé pour un étudiant.",
  },
];

export const NAMEID_PERSISTANT = "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent";

/** Les espaces de noms des métadonnées et des messages. */
export const NS = {
  md: "urn:oasis:names:tc:SAML:2.0:metadata",
  ds: "http://www.w3.org/2000/09/xmldsig#",
  mdui: "urn:oasis:names:tc:SAML:metadata:ui",
  shibmd: "urn:mace:shibboleth:metadata:1.0",
  samlp: "urn:oasis:names:tc:SAML:2.0:protocol",
  saml: "urn:oasis:names:tc:SAML:2.0:assertion",
  idpdisc: "urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol",
  init: "urn:oasis:names:tc:SAML:profiles:SSO:request-init",
} as const;

export const BINDING = {
  redirect: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
  post: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
} as const;

/** Durée de vie d'une demande d'authentification (InResponseTo attendu). */
export const DUREE_REQUETE_S = 10 * 60;
/** Décalage d'horloge toléré avec l'IdP (NotBefore, NotOnOrAfter). */
export const TOLERANCE_HORLOGE_MS = 60 * 1000;
/** L'agrégat est relu au-delà de cet âge. */
export const AGE_MAX_AGREGAT_MS = 6 * 60 * 60 * 1000;
/** Une relecture ratée n'est retentée qu'après ce délai (pas de marteau sur RENATER). */
export const PAUSE_APRES_ECHEC_MS = 5 * 60 * 1000;

/** Le cookie qui relie la réponse au navigateur qui a demandé (SameSite=None, la réponse arrive d'un autre site). */
export const COOKIE_REQUETE = "ba_saml";

/** Les chemins des routes du fournisseur de services. */
export function adressesDuSp(origine: string) {
  return {
    metadonnees: `${origine}/api/saml/metadata`,
    connexion: `${origine}/api/saml/connexion`,
    acs: `${origine}/api/saml/acs`,
  };
}

/** L'identifiant du fournisseur de services (entityID) : stable, il ne dépend que du site. */
export const entityIdDuSp = (site: string) => `${site}/saml`;
