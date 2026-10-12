import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import {
  adressesDeLOutil,
  CONFIGURATION_OUTIL,
  CONFIGURATION_PLATEFORME,
  MESSAGE,
  NOM_DE_L_OUTIL,
} from "./constantes";
import { JwtInvalide } from "./jwt";
import {
  consommerJeton,
  inscrirePlateforme,
  InscriptionRefusee,
  jetonUtilisable,
  noterPlateformeDuJeton,
  rendreJeton,
  type Plateforme,
} from "./plateformes";
import { demanderJson, urlDePlateformeAdmise } from "./reseau";
import { PORTEES_DEMANDEES } from "./ags/constantes";

/**
 * L'INSCRIPTION DYNAMIQUE (IMS LTI Dynamic Registration), celle de Moodle 3.10 et 4.x.
 *
 * L'administrateur de la plateforme colle UNE adresse : celle que /admin/lti fournit,
 * qui porte un jeton d'inscription à usage unique créé pour son organisation. La
 * plateforme l'ouvre en y ajoutant `openid_configuration` (l'adresse de sa
 * configuration) et `registration_token`. L'outil :
 *   1. vérifie le jeton (connu, non utilisé, non expiré) ;
 *   2. lit la configuration de la plateforme (HTTPS ; l'émetteur doit être sur le même
 *      hôte que l'adresse de configuration) ;
 *   3. après confirmation de l'administrateur, consomme le jeton et poste sa propre
 *      configuration au point d'inscription de la plateforme ;
 *   4. enregistre la plateforme (émetteur, client_id rendu, déploiement rendu,
 *      adresses), rattachée à l'organisation du jeton.
 * Un échec chez la plateforme rend le jeton : l'administrateur recommence.
 *
 * Sans jeton valable, rien ne s'inscrit : c'est ce qui empêche n'importe quelle
 * plateforme de se brancher sur l'outil.
 */

export interface ConfigurationPlateforme {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  registration_endpoint: string;
  produit: string | null;
}

export class InscriptionDynamiqueRefusee extends Error {
  constructor(
    readonly motif: string,
    readonly issuer: string | null = null,
  ) {
    super(motif);
    this.name = "InscriptionDynamiqueRefusee";
  }
}

const texte = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Lit et vérifie la configuration OpenID annoncée par la plateforme. */
export async function lireConfiguration(urlConfiguration: string | null): Promise<ConfigurationPlateforme> {
  if (!urlConfiguration) throw new InscriptionDynamiqueRefusee("openid_configuration absent");
  const url = urlDePlateformeAdmise(urlConfiguration);
  if (!url) throw new InscriptionDynamiqueRefusee("openid_configuration hors HTTPS");
  let reponse;
  try {
    reponse = await demanderJson(url.toString());
  } catch (e) {
    throw new InscriptionDynamiqueRefusee(e instanceof JwtInvalide ? e.motif : "configuration de la plateforme injoignable");
  }
  const c = (reponse.json ?? {}) as Record<string, unknown>;
  if (reponse.statut !== 200) throw new InscriptionDynamiqueRefusee("configuration de la plateforme illisible");
  const issuer = texte(c.issuer);
  const champs = {
    authorization_endpoint: texte(c.authorization_endpoint),
    token_endpoint: texte(c.token_endpoint),
    jwks_uri: texte(c.jwks_uri),
    registration_endpoint: texte(c.registration_endpoint),
  };
  if (!issuer || Object.values(champs).some((v) => !v)) {
    throw new InscriptionDynamiqueRefusee("configuration de la plateforme incomplète", issuer);
  }
  const urlIssuer = urlDePlateformeAdmise(issuer);
  if (!urlIssuer || urlIssuer.host !== url.host) {
    throw new InscriptionDynamiqueRefusee("l'émetteur n'est pas sur l'hôte de la configuration", issuer);
  }
  for (const v of Object.values(champs)) {
    if (!urlDePlateformeAdmise(v!)) throw new InscriptionDynamiqueRefusee("adresse de plateforme hors HTTPS", issuer);
  }
  const plateforme = (c[CONFIGURATION_PLATEFORME] ?? {}) as Record<string, unknown>;
  return {
    issuer,
    authorization_endpoint: champs.authorization_endpoint!,
    token_endpoint: champs.token_endpoint!,
    jwks_uri: champs.jwks_uri!,
    registration_endpoint: champs.registration_endpoint!,
    produit: texte(plateforme.product_family_code),
  };
}

/** Ce que l'outil déclare à la plateforme. Les données demandées sont les plus courtes. */
export function configurationDeLOutil(origine: string) {
  const a = adressesDeLOutil(origine);
  return {
    application_type: "web",
    response_types: ["id_token"],
    grant_types: ["implicit", "client_credentials"],
    initiate_login_uri: a.connexion,
    redirect_uris: [a.lancement],
    client_name: NOM_DE_L_OUTIL,
    jwks_uri: a.jwks,
    logo_uri: `${origine}/icon.png`,
    token_endpoint_auth_method: "private_key_jwt",
    // Le service de notes (AGS) : créer la colonne d'un examen, lire les résultats, poser
    // les notes (lti/ags). Une plateforme qui ne l'accorde pas reste branchée comme avant.
    scope: PORTEES_DEMANDEES.join(" "),
    [CONFIGURATION_OUTIL]: {
      domain: new URL(origine).host,
      description:
        "Simulation de gestion d'entreprise. Les élèves arrivent dans la partie ou la cohorte choisie par l'enseignant, sans compte ni code. Lancement en nouvelle fenêtre.",
      target_link_uri: a.lancement,
      // Le sub (toujours) et le prénom : rien d'autre. Pas de courriel, pas de nom.
      claims: ["iss", "sub", "given_name"],
      messages: [
        { type: MESSAGE.selection, target_link_uri: a.selection, label: NOM_DE_L_OUTIL },
      ],
    },
  };
}

/** L'organisation à laquelle ce jeton rattachera la plateforme, pour l'écran de confirmation. */
export async function organisationDuJeton(jeton: string): Promise<{ id: string; nom: string } | null> {
  const j = await jetonUtilisable(jeton);
  if (!j) return null;
  const [o] = await db
    .select({ id: organizations.id, nom: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, j.organizationId));
  return o ?? null;
}

/** L'inscription proprement dite (temps 3 et 4). */
export async function inscrire(args: {
  jeton: string;
  urlConfiguration: string | null;
  jetonPlateforme: string | null;
  origine: string;
}): Promise<Plateforme> {
  const config = await lireConfiguration(args.urlConfiguration);
  const pris = await consommerJeton(args.jeton);
  if (!pris) throw new InscriptionDynamiqueRefusee("jeton d'inscription inconnu, expiré ou déjà utilisé", config.issuer);
  try {
    const { statut, json } = await demanderJson(config.registration_endpoint, {
      methode: "POST",
      corps: configurationDeLOutil(args.origine),
      jeton: args.jetonPlateforme ?? undefined,
    });
    const r = (json ?? {}) as Record<string, unknown>;
    const clientId = texte(r.client_id);
    if (statut < 200 || statut >= 300 || !clientId) {
      throw new InscriptionDynamiqueRefusee(`la plateforme a refusé l'inscription (statut ${statut})`, config.issuer);
    }
    const conf = (r[CONFIGURATION_OUTIL] ?? {}) as Record<string, unknown>;
    const deploiement = texte(conf.deployment_id);
    const plateforme = await inscrirePlateforme({
      nom: config.produit ? `${config.produit} · ${new URL(config.issuer).host}` : new URL(config.issuer).host,
      issuer: config.issuer,
      clientId,
      deploymentIds: deploiement ? [deploiement] : [],
      urlAuthentification: config.authorization_endpoint,
      urlJeton: config.token_endpoint,
      urlJwks: config.jwks_uri,
      organizationId: pris.organizationId,
      inscription: "dynamique",
    });
    await noterPlateformeDuJeton(pris.id, plateforme.id);
    return plateforme;
  } catch (e) {
    await rendreJeton(pris.id);
    if (e instanceof InscriptionDynamiqueRefusee) throw e;
    if (e instanceof InscriptionRefusee) throw new InscriptionDynamiqueRefusee(e.message, config.issuer);
    if (e instanceof JwtInvalide) throw new InscriptionDynamiqueRefusee(e.motif, config.issuer);
    throw new InscriptionDynamiqueRefusee("point d'inscription de la plateforme injoignable", config.issuer);
  }
}
