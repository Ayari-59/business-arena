/**
 * Les en-têtes de sécurité HTTP, servis sur toutes les réponses.
 *
 * Mesuré en production : aucun d'eux n'était présent, et X-Powered-By
 * annonçait la pile. Le site pouvait être embarqué dans une iframe tierce
 * (clickjacking), un navigateur pouvait deviner un type de contenu, et le
 * référent partait entier vers n'importe quel lien externe.
 *
 * Ce fichier est lu par next.config.ts (chemin relatif : la configuration
 * ne connaît pas l'alias « @ ») et par le test qui le garde.
 */

/**
 * Ce que le site charge réellement, inventorié avant d'écrire la politique :
 *
 * - scripts : les bundles de Next (« self »), plus des scripts INLINE que Next
 *   injecte lui-même (données de rendu serveur, `self.__next_f.push`) et deux
 *   que le layout pose (amorce du thème, enregistrement du service worker).
 *   Sans nonce, ils exigent 'unsafe-inline'. Un nonce demande un middleware
 *   qui n'existe pas encore : c'est la prochaine étape, documentée ici, pas
 *   un oubli.
 * - styles : Tailwind en feuille (« self ») et des styles inline posés par
 *   React (`style={{…}}`) : 'unsafe-inline'.
 * - polices : aucune police externe, tout vient du système.
 * - images : le logo et les icônes (« self »), les data: URI éventuels.
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
 * Passage en mode bloquant : après une semaine sans violation remontée dans
 * la console des navigateurs (message « [Report Only] »), renommer la clé
 * ci-dessous en « Content-Security-Policy ». Rien d'autre à changer.
 */
export const CSP_HEADER_NAME = "Content-Security-Policy-Report-Only";

export interface HeaderPair {
  key: string;
  value: string;
}

export function securityHeaders(env: string | undefined = process.env.NODE_ENV): HeaderPair[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // Deux ans, sous-domaines compris, candidat à la liste de préchargement.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: CSP_HEADER_NAME, value: contentSecurityPolicy(env) },
  ];
}
