import type { JsonWebKey } from "node:crypto";
import { JwtInvalide } from "./jwt";

/**
 * CE QUE L'OUTIL VA CHERCHER CHEZ UNE PLATEFORME : ses clés publiques (JWKS), et, à
 * l'inscription dynamique, sa configuration OpenID puis son point d'inscription.
 *
 * HTTPS seulement. Le HTTP en clair n'est admis que vers la machine locale
 * (localhost, 127.0.0.1), hors production ou avec `LTI_HTTP_LOCAL=1` : c'est le
 * simulateur de plateforme des tests, jamais une vraie plateforme.
 */

const HOTES_LOCAUX = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function urlDePlateformeAdmise(brute: string, env: NodeJS.ProcessEnv = process.env): URL | null {
  let url: URL;
  try {
    url = new URL(brute);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol === "https:") return url;
  const localPermis = env.NODE_ENV !== "production" || env.LTI_HTTP_LOCAL === "1";
  if (url.protocol === "http:" && localPermis && HOTES_LOCAUX.has(url.hostname)) return url;
  return null;
}

/** Un GET ou un POST JSON vers une plateforme, borné en temps et en taille. */
export async function demanderJson(
  url: string,
  init: { methode?: "GET" | "POST"; corps?: unknown; jeton?: string } = {},
): Promise<{ statut: number; json: unknown }> {
  const admise = urlDePlateformeAdmise(url);
  if (!admise) throw new JwtInvalide("adresse de plateforme refusée (HTTPS exigé)");
  const reponse = await fetch(admise, {
    method: init.methode ?? "GET",
    headers: {
      accept: "application/json",
      ...(init.corps !== undefined ? { "content-type": "application/json" } : {}),
      ...(init.jeton ? { authorization: `Bearer ${init.jeton}` } : {}),
    },
    body: init.corps !== undefined ? JSON.stringify(init.corps) : undefined,
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const texte = await reponse.text();
  if (texte.length > 256_000) throw new JwtInvalide("réponse de la plateforme trop longue");
  let json: unknown = null;
  try {
    json = texte ? JSON.parse(texte) : null;
  } catch {
    json = null;
  }
  return { statut: reponse.status, json };
}

/* ---------------------------------------------------------------------------
 * LES CLÉS PUBLIQUES D'UNE PLATEFORME, EN CACHE.
 *
 * Relire le JWKS à chaque lancement ferait d'une salle de trente élèves trente appels
 * à la plateforme. On le garde dix minutes ; une clé inconnue (la plateforme vient de
 * tourner sa clé) provoque une relecture immédiate, au plus une toutes les trente
 * secondes, pour qu'un jeton forgé avec un `kid` inventé ne transforme pas l'outil en
 * marteau contre la plateforme.
 * ------------------------------------------------------------------------- */

const DUREE_CACHE_MS = 10 * 60 * 1000;
const RELECTURE_MIN_MS = 30 * 1000;
const cacheJwks = new Map<string, { cles: JsonWebKey[]; lu: number }>();

/** Vide le cache (tests). */
export function viderCacheJwks(): void {
  cacheJwks.clear();
}

async function lireJwks(url: string): Promise<JsonWebKey[]> {
  const { statut, json } = await demanderJson(url);
  const cles = (json as { keys?: unknown } | null)?.keys;
  if (statut !== 200 || !Array.isArray(cles)) throw new JwtInvalide("JWKS de la plateforme illisible");
  return cles.filter((k): k is JsonWebKey => !!k && typeof k === "object");
}

const kidDe = (k: JsonWebKey) => (k as { kid?: unknown }).kid;

/** La clé publique de la plateforme qui porte ce `kid` (ou la seule, sans `kid`). */
export async function cleDeLaPlateforme(
  urlJwks: string,
  kid: string | undefined,
  now: number = Date.now(),
): Promise<JsonWebKey> {
  const choisir = (cles: JsonWebKey[]): JsonWebKey | undefined =>
    kid === undefined ? (cles.length === 1 ? cles[0] : undefined) : cles.find((k) => kidDe(k) === kid);

  const enCache = cacheJwks.get(urlJwks);
  if (enCache && now - enCache.lu < DUREE_CACHE_MS) {
    const trouvee = choisir(enCache.cles);
    if (trouvee) return trouvee;
    if (now - enCache.lu < RELECTURE_MIN_MS) throw new JwtInvalide("clé de signature inconnue de la plateforme");
  }
  const cles = await lireJwks(urlJwks);
  cacheJwks.set(urlJwks, { cles, lu: now });
  const trouvee = choisir(cles);
  if (!trouvee) {
    throw new JwtInvalide(kid === undefined ? "jeton sans kid et JWKS à plusieurs clés" : "clé de signature inconnue de la plateforme");
  }
  return trouvee;
}
