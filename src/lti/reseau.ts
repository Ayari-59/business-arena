import type { JsonWebKey } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
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

/**
 * LES ADRESSES QU'UNE PLATEFORME NE PEUT PAS AVOIR (audit, P2-1) : boucle locale,
 * réseaux privés, liens locaux, partage d'opérateur, multidiffusion, réservées. Une
 * adresse de plateforme qui y mène ferait appeler par le serveur ses propres
 * services internes (métadonnées de l'hébergeur, base, administration).
 */
export function adresseIpInterdite(ip: string): boolean {
  const v4 = (a: string): boolean => {
    const o = a.split(".").map(Number);
    if (o.length !== 4 || o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
    const [a0, a1] = o as [number, number, number, number];
    return (
      a0 === 0 ||
      a0 === 10 ||
      a0 === 127 ||
      (a0 === 100 && a1 >= 64 && a1 <= 127) ||
      (a0 === 169 && a1 === 254) ||
      (a0 === 172 && a1 >= 16 && a1 <= 31) ||
      (a0 === 192 && a1 === 0 && o[2] === 0) ||
      (a0 === 192 && a1 === 168) ||
      (a0 === 198 && (a1 === 18 || a1 === 19)) ||
      a0 >= 224
    );
  };
  const nue = ip.replace(/^\[|\]$/g, "").toLowerCase();
  const famille = isIP(nue);
  if (famille === 4) return v4(nue);
  if (famille !== 6) return true;
  // Une adresse IPv4 écrite en IPv6 (::ffff:10.0.0.1) se juge comme IPv4.
  const mappee = nue.match(/^(?:0*:)*:?ffff:(\d+\.\d+\.\d+\.\d+)$/) ?? nue.match(/^64:ff9b::(\d+\.\d+\.\d+\.\d+)$/);
  if (mappee) return v4(mappee[1]!);
  if (nue === "::" || nue === "::1") return true;
  const premier = parseInt(nue.split(":")[0] || "0", 16);
  return (
    (premier & 0xfe00) === 0xfc00 || // fc00::/7, adresses uniques locales
    (premier & 0xffc0) === 0xfe80 || // fe80::/10, liens locaux
    (premier & 0xff00) === 0xff00 || // ff00::/8, multidiffusion
    nue.startsWith("::ffff:") ||
    nue.startsWith("2001:db8:")
  );
}

/**
 * L'hôte de la plateforme mène-t-il à une adresse publique ? Résolu par le DNS : un
 * nom public peut pointer vers une adresse privée. La machine locale reste permise
 * là où `urlDePlateformeAdmise` la permet (le simulateur des tests).
 */
async function hoteAdmis(url: URL, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const localPermis = env.NODE_ENV !== "production" || env.LTI_HTTP_LOCAL === "1";
  if (localPermis && HOTES_LOCAUX.has(url.hostname)) return true;
  const hote = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hote)) return !adresseIpInterdite(hote);
  try {
    const adresses = await lookup(hote, { all: true, verbatim: true });
    return adresses.length > 0 && adresses.every((a) => !adresseIpInterdite(a.address));
  } catch {
    return false;
  }
}

/** Un GET ou un POST JSON vers une plateforme, borné en temps et en taille. */
export async function demanderJson(
  url: string,
  init: { methode?: "GET" | "POST"; corps?: unknown; jeton?: string } = {},
): Promise<{ statut: number; json: unknown }> {
  const admise = urlDePlateformeAdmise(url);
  if (!admise) throw new JwtInvalide("adresse de plateforme refusée (HTTPS exigé)");
  if (!(await hoteAdmis(admise))) throw new JwtInvalide("adresse de plateforme refusée");
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
