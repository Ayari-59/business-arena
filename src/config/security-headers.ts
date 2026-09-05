/**
 * Les en-têtes de sécurité HTTP, servis sur toutes les réponses.
 *
 * Mesuré en production : aucun d'eux n'était présent, et X-Powered-By
 * annonçait la pile. Le site pouvait être embarqué dans une iframe tierce
 * (clickjacking), un navigateur pouvait deviner un type de contenu, et le
 * référent partait entier vers n'importe quel lien externe.
 *
 * Tous ces en-têtes — CSP comprise — sont STATIQUES : ils ne dépendent pas de
 * la requête, et next.config.ts les pose sur « /(.*) », fichiers statiques
 * compris. On a renoncé à la CSP à nonce par requête : le nonce imposait un
 * middleware (proxy) exécuté à chaque requête ET un rendu dynamique de TOUTES
 * les pages (le layout lisait le nonce dans les en-têtes), ce qui multipliait
 * les invocations de fonction — y compris pour le trafic public et les robots.
 * La CSP reste active (bloquante), mais tolère les scripts inline
 * ('unsafe-inline'), ce qui rend de nouveau les pages vitrines éligibles au
 * cache statique.
 *
 * Ce fichier est lu par next.config.ts (chemin relatif : la configuration ne
 * connaît pas l'alias « @ ») et par le test qui les garde.
 */

/**
 * Ce que le site charge réellement, inventorié avant d'écrire la politique :
 *
 * - scripts : les bundles de Next (« self »), plus des scripts INLINE — ceux
 *   que Next injecte (données de rendu serveur `self.__next_f.push`, rejeu de
 *   formulaire) et deux que le layout pose (amorce du thème, enregistrement du
 *   service worker). Ils sont couverts par 'unsafe-inline'. Aucun hôte tiers.
 *   En développement, React s'appuie sur eval.
 * - styles : Tailwind en feuille (« self ») et des styles inline posés par
 *   React (`style={{…}}`) → 'unsafe-inline'.
 * - polices : aucune police externe, tout vient du système.
 * - images : le logo et les icônes (« self »), les data: et blob: URI.
 * - connexions : les appels fetch du polling de tour, vers l'origine.
 * - service worker : /sw.js, même origine ; manifeste PWA, même origine.
 * - aucun script, style, image ni police d'un tiers.
 *
 * En développement, Turbopack a besoin d'eval et d'un WebSocket de
 * rechargement : ces deux permissions n'existent qu'à ce moment-là.
 */
export function contentSecurityPolicy(env: string | undefined = process.env.NODE_ENV): string {
  const dev = env !== "production";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  return directives.join("; ");
}

/**
 * La CSP est bloquante. Pour la repasser en observation (par ex. avant de
 * durcir à nouveau), renommer en « Content-Security-Policy-Report-Only ».
 */
export const CSP_HEADER_NAME = "Content-Security-Policy";

export interface HeaderPair {
  key: string;
  value: string;
}

/**
 * Les en-têtes de sécurité statiques, CSP comprise. Posés partout par
 * next.config sur « /(.*) », fichiers statiques compris. Aucun ne dépend de la
 * requête : le rendu statique des pages reste possible.
 */
export function securityHeaders(): HeaderPair[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // Deux ans, sous-domaines compris, candidat à la liste de préchargement.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: CSP_HEADER_NAME, value: contentSecurityPolicy() },
  ];
}
