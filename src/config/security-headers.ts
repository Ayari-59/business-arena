/**
 * Les en-têtes de sécurité HTTP, servis sur toutes les réponses.
 *
 * Mesuré en production : aucun d'eux n'était présent, et X-Powered-By
 * annonçait la pile. Le site pouvait être embarqué dans une iframe tierce
 * (clickjacking), un navigateur pouvait deviner un type de contenu, et le
 * référent partait entier vers n'importe quel lien externe.
 *
 * Deux sources se partagent ces en-têtes :
 * - les cinq en-têtes statiques (ci-dessous) ne dépendent pas de la requête ;
 *   next.config.ts les pose sur « /(.*) », fichiers statiques compris ;
 * - la CSP porte un nonce tiré à chaque requête : le proxy (src/proxy.ts) la
 *   pose, car un nonce ne peut pas être figé dans une configuration statique.
 *
 * Ce fichier est lu par next.config.ts (chemin relatif : la configuration ne
 * connaît pas l'alias « @ »), par le proxy et par le test qui les garde.
 */

/**
 * Ce que le site charge réellement, inventorié avant d'écrire la politique :
 *
 * - scripts : les bundles de Next (« self »), plus des scripts INLINE — ceux
 *   que Next injecte (données de rendu serveur `self.__next_f.push`, rejeu de
 *   formulaire) et deux que le layout pose (amorce du thème, enregistrement du
 *   service worker). Chacun porte désormais le nonce de la requête ; Next
 *   l'appose lui-même sur ses scripts, le layout sur les siens.
 *   'strict-dynamic' étend la confiance aux scripts chargés par un script déjà
 *   de confiance. Plus de 'unsafe-inline' : un script injecté sans le nonce
 *   (le vecteur XSS) est refusé. En développement, React s'appuie sur eval.
 * - styles : Tailwind en feuille (« self ») et des styles inline posés par
 *   React (`style={{…}}`). Un nonce ne couvre pas un attribut `style=` ;
 *   'unsafe-inline' y reste, faute de pouvoir réécrire toutes les vues.
 * - polices : aucune police externe, tout vient du système.
 * - images : le logo et les icônes (« self »), les data: et blob: URI.
 * - connexions : les appels fetch du polling de tour, vers l'origine.
 * - service worker : /sw.js, même origine ; manifeste PWA, même origine.
 * - aucun script, style, image ni police d'un tiers.
 *
 * En développement, Turbopack a besoin d'eval et d'un WebSocket de
 * rechargement : ces deux permissions n'existent qu'à ce moment-là.
 */
export function contentSecurityPolicy(
  nonce: string,
  env: string | undefined = process.env.NODE_ENV,
): string {
  const dev = env !== "production";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
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
 * La CSP est désormais bloquante (elle l'était en Report-Only le temps d'une
 * observation). Le nonce ferme la porte aux scripts inline injectés ; pour la
 * repasser en observation, renommer en « Content-Security-Policy-Report-Only ».
 */
export const CSP_HEADER_NAME = "Content-Security-Policy";

export interface HeaderPair {
  key: string;
  value: string;
}

/**
 * Les cinq en-têtes de sécurité statiques (sans la CSP, portée par le proxy).
 * Posés partout par next.config, fichiers statiques compris.
 */
export function securityHeaders(): HeaderPair[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // Deux ans, sous-domaines compris, candidat à la liste de préchargement.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ];
}
