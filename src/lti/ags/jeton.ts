import { randomBytes } from "node:crypto";
import { clesDeLOutil, type ClesDeLOutil } from "../cles";
import { signerJwt } from "../jwt";
import { urlDePlateformeAdmise } from "../reseau";

/**
 * LE JETON DU SERVICE DE NOTES (OAuth 2, `client_credentials`, RFC 7523).
 *
 * L'outil se présente à la plateforme par une ASSERTION : un JWT signé de SA clé (celle
 * de lti/cles.ts, publiée dans son JWKS, la même qui signe la sélection de contenu), qui
 * dit « je suis ce client_id » (iss = sub = client_id), à l'adresse de jeton de la
 * plateforme (aud), pour cinq minutes, avec un identifiant à usage unique (jti). La
 * plateforme vérifie la signature avec la clé publique de l'outil et rend un jeton
 * d'accès, borné aux portées demandées.
 *
 * Le jeton se garde EN MÉMOIRE, par plateforme et par jeu de portées, jusqu'à une minute
 * avant son expiration : publier les notes d'une promotion de trente candidats ne
 * demande qu'un jeton. Il n'est jamais écrit en base ni au journal.
 */

export const DUREE_ASSERTION_S = 300;
/** La marge avant expiration : un jeton qui expire dans la minute n'est plus servi. */
export const MARGE_S = 60;
/** Quand la plateforme ne dit pas la durée de son jeton. */
const DUREE_PAR_DEFAUT_S = 3600;

export class JetonRefuse extends Error {
  constructor(
    readonly statut: number | "reseau",
    message: string,
  ) {
    super(message);
    this.name = "JetonRefuse";
  }
}

/** L'assertion signée qui accompagne la demande de jeton. */
export function assertionClientCredentials(args: {
  clientId: string;
  urlJeton: string;
  maintenant?: Date;
  cles?: ClesDeLOutil;
  jti?: string;
}): string {
  const cles = args.cles ?? clesDeLOutil();
  const iat = Math.floor((args.maintenant ?? new Date()).getTime() / 1000);
  return signerJwt(
    {
      iss: args.clientId,
      sub: args.clientId,
      aud: args.urlJeton,
      iat,
      exp: iat + DUREE_ASSERTION_S,
      jti: args.jti ?? randomBytes(16).toString("base64url"),
    },
    cles.privee,
    cles.kid,
  );
}

/** Ce que la plateforme répond : le statut HTTP et le JSON (ou null). */
export type PosterFormulaire = (url: string, corps: URLSearchParams) => Promise<{ statut: number; json: unknown }>;

/** La demande de jeton par le réseau : formulaire encodé, HTTPS, bornée en temps et en taille. */
export const posterFormulaire: PosterFormulaire = async (url, corps) => {
  const admise = urlDePlateformeAdmise(url);
  if (!admise) throw new JetonRefuse(400, "adresse de jeton refusée (HTTPS exigé)");
  const reponse = await fetch(admise, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: corps.toString(),
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const texte = await reponse.text();
  let json: unknown = null;
  try {
    json = texte && texte.length <= 64_000 ? JSON.parse(texte) : null;
  } catch {
    json = null;
  }
  return { statut: reponse.status, json };
};

interface EnCache {
  jeton: string;
  /** En millisecondes. */
  expire: number;
}

const cache = new Map<string, EnCache>();

const cleDuCache = (plateformeId: string, portees: readonly string[]) => `${plateformeId}\u0000${[...portees].sort().join(" ")}`;

/** Vide le cache (tests), ou oublie un jeton que la plateforme vient de refuser. */
export function oublierLeJeton(plateformeId?: string, portees?: readonly string[]): void {
  if (!plateformeId) return cache.clear();
  if (portees) cache.delete(cleDuCache(plateformeId, portees));
  else for (const k of [...cache.keys()]) if (k.startsWith(`${plateformeId}\u0000`)) cache.delete(k);
}

/** Le jeton d'accès pour ces portées : celui du cache s'il vaut encore, sinon un neuf. */
export async function jetonDeService(args: {
  plateforme: { id: string; clientId: string; urlJeton: string };
  portees: readonly string[];
  maintenant?: () => number;
  poster?: PosterFormulaire;
  cles?: ClesDeLOutil;
}): Promise<string> {
  const maintenant = args.maintenant ?? Date.now;
  const cle = cleDuCache(args.plateforme.id, args.portees);
  const connu = cache.get(cle);
  if (connu && connu.expire - MARGE_S * 1000 > maintenant()) return connu.jeton;

  const assertion = assertionClientCredentials({
    clientId: args.plateforme.clientId,
    urlJeton: args.plateforme.urlJeton,
    maintenant: new Date(maintenant()),
    cles: args.cles,
  });
  const corps = new URLSearchParams({
    grant_type: "client_credentials",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: assertion,
    scope: [...args.portees].sort().join(" "),
  });
  let reponse;
  try {
    reponse = await (args.poster ?? posterFormulaire)(args.plateforme.urlJeton, corps);
  } catch (e) {
    if (e instanceof JetonRefuse) throw e;
    throw new JetonRefuse("reseau", "adresse de jeton injoignable");
  }
  const j = (reponse.json ?? {}) as Record<string, unknown>;
  const jeton = typeof j.access_token === "string" && j.access_token.length <= 8_000 ? j.access_token : null;
  if (reponse.statut < 200 || reponse.statut >= 300 || !jeton) {
    throw new JetonRefuse(reponse.statut >= 200 && reponse.statut < 300 ? 502 : reponse.statut, "jeton refusé par la plateforme");
  }
  const duree = typeof j.expires_in === "number" && j.expires_in > 0 ? Math.min(j.expires_in, 24 * 3600) : DUREE_PAR_DEFAUT_S;
  cache.set(cle, { jeton, expire: maintenant() + duree * 1000 });
  return jeton;
}
