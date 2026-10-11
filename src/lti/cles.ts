import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type JsonWebKey,
  type KeyObject,
} from "node:crypto";
import { ALGORITHME } from "./jwt";

/**
 * LES CLÉS DE L'OUTIL.
 *
 * Business Arena signe deux choses : la réponse d'une sélection de contenu (deep
 * linking) et, plus tard, les demandes de jeton du service de notes. La clé privée vit
 * dans l'environnement, `LTI_PRIVATE_KEY` (PEM PKCS#8, RSA 2048 bits au moins), et
 * JAMAIS dans le dépôt : `scripts/lti-cle.mts` en tire une et dit où la poser.
 *
 * L'identifiant de clé (`kid`) est l'empreinte de la clé publique (RFC 7638) : il change
 * avec la clé, sans variable de plus à tenir.
 *
 * LA ROTATION : on publie plusieurs clés publiques. Pour changer de clé, l'ancienne clé
 * PUBLIQUE passe dans `LTI_PREVIOUS_PUBLIC_KEYS` (un ou plusieurs blocs PEM à la suite),
 * la nouvelle privée dans `LTI_PRIVATE_KEY` ; les plateformes relisent le JWKS et
 * trouvent les deux le temps que les jetons signés avant expirent.
 *
 * EN DÉVELOPPEMENT ET EN TEST, sans `LTI_PRIVATE_KEY`, une paire est tirée au démarrage
 * du processus et vit en mémoire : rien à configurer, rien à commiter. En PRODUCTION,
 * l'absence de clé ferme LTI (réponse 503) au lieu de signer avec une clé improvisée.
 */

export interface ClesDeLOutil {
  privee: KeyObject;
  kid: string;
  /** Le JWKS publié : la clé courante d'abord, puis les précédentes. */
  publiques: JsonWebKey[];
}

export class LtiNonConfigure extends Error {
  constructor() {
    super("LTI n'est pas configuré : la variable LTI_PRIVATE_KEY manque.");
    this.name = "LtiNonConfigure";
  }
}

/** Une variable d'environnement PEM, telle qu'on la colle (sauts de ligne échappés compris). */
export function normaliserPem(brut: string): string {
  let v = brut.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
  if (!v.includes("-----BEGIN")) {
    try {
      const decode = Buffer.from(v, "base64").toString("utf8");
      if (decode.includes("-----BEGIN")) v = decode;
    } catch {
      /* pas du base64 : on garde la valeur telle quelle, la lecture échouera */
    }
  }
  return v;
}

/** Le JWK public d'une clé RSA, avec son empreinte (RFC 7638) pour `kid`. */
export function jwkPublic(cle: KeyObject): JsonWebKey & { kid: string } {
  const pub = cle.type === "private" ? createPublicKey(cle) : cle;
  const jwk = pub.export({ format: "jwk" }) as JsonWebKey;
  const empreinte = createHash("sha256")
    .update(JSON.stringify({ e: jwk.e, kty: "RSA", n: jwk.n }))
    .digest("base64url");
  return { kty: "RSA", n: jwk.n, e: jwk.e, alg: ALGORITHME, use: "sig", kid: empreinte };
}

function lireClesPrecedentes(brut: string | undefined): JsonWebKey[] {
  if (!brut?.trim()) return [];
  const pem = normaliserPem(brut);
  const blocs = pem.match(/-----BEGIN PUBLIC KEY-----[\s\S]+?-----END PUBLIC KEY-----/g) ?? [];
  const cles: JsonWebKey[] = [];
  for (const bloc of blocs) {
    try {
      const cle = createPublicKey(bloc);
      if (cle.asymmetricKeyType === "rsa") cles.push(jwkPublic(cle));
    } catch {
      console.error("[lti] une clé publique précédente est illisible : ignorée");
    }
  }
  return cles;
}

let cache: { source: string; cles: ClesDeLOutil } | null = null;
let ephemere: KeyObject | null = null;

/** Les clés de l'outil ; lève `LtiNonConfigure` en production sans clé. */
export function clesDeLOutil(env: NodeJS.ProcessEnv = process.env): ClesDeLOutil {
  const brut = env.LTI_PRIVATE_KEY;
  const precedentes = env.LTI_PREVIOUS_PUBLIC_KEYS ?? "";
  if (!brut?.trim()) {
    if (env.NODE_ENV === "production") throw new LtiNonConfigure();
    ephemere ??= generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    const courante = jwkPublic(ephemere);
    return {
      privee: ephemere,
      kid: courante.kid,
      publiques: [courante, ...lireClesPrecedentes(precedentes)],
    };
  }
  const source = `${brut}\u0000${precedentes}`;
  if (cache?.source === source) return cache.cles;
  let privee: KeyObject;
  try {
    privee = createPrivateKey(normaliserPem(brut));
  } catch {
    throw new LtiNonConfigure();
  }
  if (privee.asymmetricKeyType !== "rsa") throw new LtiNonConfigure();
  const courante = jwkPublic(privee);
  const autres = lireClesPrecedentes(precedentes).filter((k) => (k as { kid?: string }).kid !== courante.kid);
  const cles = { privee, kid: courante.kid, publiques: [courante, ...autres] };
  cache = { source, cles };
  return cles;
}

/** LTI est-il prêt à signer ? (pour l'écran d'administration) */
export function etatDesCles(env: NodeJS.ProcessEnv = process.env): { pret: boolean; kid: string | null; nombre: number; ephemere: boolean } {
  try {
    const c = clesDeLOutil(env);
    return { pret: true, kid: c.kid, nombre: c.publiques.length, ephemere: !env.LTI_PRIVATE_KEY?.trim() };
  } catch {
    return { pret: false, kid: null, nombre: 0, ephemere: false };
  }
}
