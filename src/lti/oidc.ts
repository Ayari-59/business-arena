import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { ltiNonces } from "@/db/schema";
import { adressesDeLOutil } from "./constantes";
import { plateformeActive, purgerExpires, type Plateforme } from "./plateformes";

/**
 * LA CONNEXION OIDC (« login initiation »), PREMIER TEMPS D'UN LANCEMENT.
 *
 * La plateforme appelle l'outil avec son émetteur et un indice de connexion ; l'outil
 * tire un `state` et un `nonce`, les garde en base (dix minutes, usage unique) et
 * renvoie le navigateur vers l'authentification de la plateforme. Celle-ci reviendra
 * avec un `id_token` qui porte ce nonce, posté au lancement.
 *
 * Le `state` part AUSSI en cookie (SameSite=None ; Secure ; HttpOnly) : quand le
 * navigateur le renvoie, le lancement exige qu'il corresponde. Quand il ne le renvoie
 * pas (cookies tiers bloqués, Safari), la vérification en base suffit : le state posté
 * doit être celui qui a été tiré pour ce nonce, non encore consommé.
 */

export const COOKIE_STATE = "ba_lti_state";
export const DUREE_CONNEXION_S = 10 * 60;

export class ConnexionRefusee extends Error {
  constructor(
    readonly motif: string,
    readonly issuer: string | null = null,
    readonly plateformeId: string | null = null,
  ) {
    super(motif);
    this.name = "ConnexionRefusee";
  }
}

/** Deux hôtes égaux à « www. » près : l'apex redirige vers www en production. */
const memeSite = (a: string, b: string) => a.replace(/^www\./, "") === b.replace(/^www\./, "");

export interface ParametresConnexion {
  iss?: string | null;
  login_hint?: string | null;
  target_link_uri?: string | null;
  lti_message_hint?: string | null;
  client_id?: string | null;
  lti_deployment_id?: string | null;
}

export async function initierConnexion(
  p: ParametresConnexion,
  origine: string,
  now: Date = new Date(),
): Promise<{ redirection: string; state: string; plateforme: Plateforme }> {
  const iss = p.iss?.trim() ?? "";
  if (!iss) throw new ConnexionRefusee("iss absent");
  if (!p.login_hint) throw new ConnexionRefusee("login_hint absent", iss);
  const trouvee = await plateformeActive(iss, p.client_id?.trim() || null);
  if (trouvee === "ambigue") throw new ConnexionRefusee("plusieurs plateformes pour cet émetteur, client_id absent", iss);
  if (!trouvee) throw new ConnexionRefusee("émetteur inconnu ou plateforme désactivée", iss);
  const plateforme = trouvee;
  if (p.lti_deployment_id && !plateforme.deploymentIds.includes(p.lti_deployment_id)) {
    throw new ConnexionRefusee("deployment_id non inscrit", iss, plateforme.id);
  }
  // La cible annoncée doit être l'outil lui-même : on ne suit jamais une adresse tierce.
  if (p.target_link_uri) {
    let cible: URL | null = null;
    try {
      cible = new URL(p.target_link_uri);
    } catch {
      cible = null;
    }
    if (!cible || !memeSite(cible.host, new URL(origine).host)) {
      throw new ConnexionRefusee("target_link_uri hors de l'outil", iss, plateforme.id);
    }
  }

  await purgerExpires(now);
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  await db.insert(ltiNonces).values({
    state,
    nonce,
    plateformeId: plateforme.id,
    expireLe: new Date(now.getTime() + DUREE_CONNEXION_S * 1000),
  });

  const url = new URL(plateforme.urlAuthentification);
  const parametres: Record<string, string> = {
    scope: "openid",
    response_type: "id_token",
    response_mode: "form_post",
    prompt: "none",
    client_id: plateforme.clientId,
    redirect_uri: adressesDeLOutil(origine).lancement,
    login_hint: p.login_hint,
    state,
    nonce,
  };
  if (p.lti_message_hint) parametres.lti_message_hint = p.lti_message_hint;
  for (const [k, v] of Object.entries(parametres)) url.searchParams.set(k, v);
  return { redirection: url.toString(), state, plateforme };
}
