import { createPublicKey, sign as signer, verify as verifier, type JsonWebKey, type KeyObject } from "node:crypto";

/**
 * LES JETONS SIGNÉS (JWT) DE LTI 1.3, ÉCRITS SANS DÉPENDANCE.
 *
 * Une seule famille d'algorithme est acceptée : RS256 (RSA PKCS#1 v1.5 et SHA-256),
 * celle qu'impose l'IMS Security Framework. Tout autre `alg` est refusé AVANT de lire
 * la moindre clé : `none` (un jeton sans signature), `HS256` (qui ferait d'une clé
 * publique un secret partagé), `RS512`, `ES256`… Le choix de l'algorithme n'appartient
 * jamais au jeton.
 *
 * Le module ne fait que de la cryptographie et du format : qui a émis le jeton, à qui
 * il s'adresse et s'il est encore valable se décident dans `lancement.ts`.
 */

export class JwtInvalide extends Error {
  constructor(readonly motif: string) {
    super(motif);
    this.name = "JwtInvalide";
  }
}

export interface JwtDecode {
  entete: Record<string, unknown>;
  charge: Record<string, unknown>;
  /** « entête.charge », la partie signée. */
  signe: string;
  signature: Buffer;
}

const B64URL = /^[A-Za-z0-9_-]*$/;

function lireJson(partie: string, quoi: string): Record<string, unknown> {
  if (!B64URL.test(partie)) throw new JwtInvalide(`${quoi} illisible`);
  let v: unknown;
  try {
    v = JSON.parse(Buffer.from(partie, "base64url").toString("utf8"));
  } catch {
    throw new JwtInvalide(`${quoi} illisible`);
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new JwtInvalide(`${quoi} illisible`);
  return v as Record<string, unknown>;
}

/** Découpe un JWT compact (trois parties) sans rien vérifier. */
export function decoderJwt(jeton: string): JwtDecode {
  if (typeof jeton !== "string" || jeton.length > 64_000) throw new JwtInvalide("jeton absent ou trop long");
  const parties = jeton.split(".");
  if (parties.length !== 3) throw new JwtInvalide("jeton mal formé");
  const [e, c, s] = parties as [string, string, string];
  if (!B64URL.test(s)) throw new JwtInvalide("signature illisible");
  return {
    entete: lireJson(e, "en-tête"),
    charge: lireJson(c, "charge"),
    signe: `${e}.${c}`,
    signature: Buffer.from(s, "base64url"),
  };
}

/** Le seul algorithme accepté. */
export const ALGORITHME = "RS256";

/** Lève si l'en-tête n'annonce pas RS256 (alg `none` compris). */
export function exigerRS256(entete: Record<string, unknown>): void {
  if (entete.alg !== ALGORITHME) {
    throw new JwtInvalide(`algorithme refusé : ${typeof entete.alg === "string" ? entete.alg.slice(0, 20) : "absent"}`);
  }
}

/** Une clé publique RSA tirée d'un JWK ; lève si ce n'en est pas une. */
export function clePubliqueDepuisJwk(jwk: JsonWebKey): KeyObject {
  if (jwk.kty !== "RSA") throw new JwtInvalide("clé de la plateforme : pas une clé RSA");
  if (jwk.alg !== undefined && jwk.alg !== ALGORITHME) {
    throw new JwtInvalide("clé de la plateforme : algorithme autre que RS256");
  }
  if (jwk.use !== undefined && jwk.use !== "sig") throw new JwtInvalide("clé de la plateforme : pas une clé de signature");
  try {
    const cle = createPublicKey({ key: { kty: jwk.kty, n: jwk.n, e: jwk.e }, format: "jwk" });
    if (cle.asymmetricKeyType !== "rsa") throw new Error();
    return cle;
  } catch {
    throw new JwtInvalide("clé de la plateforme illisible");
  }
}

/** Vérifie la signature RS256 d'un jeton déjà découpé. */
export function verifierSignature(decode: JwtDecode, cle: KeyObject): void {
  exigerRS256(decode.entete);
  const ok = verifier("RSA-SHA256", Buffer.from(decode.signe, "utf8"), cle, decode.signature);
  if (!ok) throw new JwtInvalide("signature invalide");
}

/** Signe une charge en RS256, avec l'identifiant de clé `kid`. */
export function signerJwt(
  charge: Record<string, unknown>,
  clePrivee: KeyObject,
  kid: string,
): string {
  const entete = { alg: ALGORITHME, typ: "JWT", kid };
  const e = Buffer.from(JSON.stringify(entete), "utf8").toString("base64url");
  const c = Buffer.from(JSON.stringify(charge), "utf8").toString("base64url");
  const s = signer("RSA-SHA256", Buffer.from(`${e}.${c}`, "utf8"), clePrivee).toString("base64url");
  return `${e}.${c}.${s}`;
}
