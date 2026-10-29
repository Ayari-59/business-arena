/**
 * Les en-têtes de sécurité HTTP, servis sur toutes les réponses.
 *
 * Mesuré en production : aucun d'eux n'était présent, et X-Powered-By
 * annonçait la pile. Le site pouvait être embarqué dans une iframe tierce
 * (clickjacking), un navigateur pouvait deviner un type de contenu, et le
 * référent partait entier vers n'importe quel lien externe.
 *
 * DEUX CSP, SELON LA ZONE (audit d'octobre 2026, P2-6).
 *
 * - Les zones déjà rendues à chaque requête — espace enseignant, administration,
 *   arène, établissement, examen, concours, profil — reçoivent du proxy une CSP à
 *   NONCE, sans 'unsafe-inline' pour les scripts : c'est là que sont les données
 *   (noms d'élèves, notes, exports). Ces pages étaient déjà dynamiques : le nonce ne
 *   leur retire aucun cache. Le layout ne lit PAS le nonce (sinon toutes les pages du
 *   site deviendraient dynamiques) : son seul script inline est autorisé par son
 *   empreinte (`EMPREINTE_DU_SCRIPT_DU_SITE`), les scripts de Next par le nonce, que
 *   Next pose de lui-même en lisant la CSP de la requête.
 * - Les pages publiques gardent la CSP STATIQUE de next.config, qui tolère les
 *   scripts inline : elles sont prérendues (accueil en ISR, notions, parcours…), et
 *   un HTML prérendu ne peut pas porter un nonce par requête. Une empreinte n'y
 *   suffirait pas non plus : Next y pose ses données de rendu en scripts inline
 *   (`self.__next_f.push`), différents à chaque page et à chaque régénération.
 *   Passer tout le site au nonce rendrait chacune de ces pages dynamique.
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
 * LE SCRIPT INLINE DU LAYOUT : l'enregistrement du service worker et l'invite
 * d'installation. Une constante, pour que son empreinte (dans la CSP à nonce) et le
 * texte posé par le layout ne puissent pas diverger : le test les recalcule.
 */
export const SCRIPT_DU_SITE =
  'if("serviceWorker"in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")});window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__bip=e;window.dispatchEvent(new Event("bip-ready"))})';

/** sha256 en base64 de `SCRIPT_DU_SITE` (vérifié par tests/unit/csp-a-nonce.test.ts). */
export const EMPREINTE_DU_SCRIPT_DU_SITE = "sha256-mBkcUMJtvnQyrI4oCrct3tEA4vAPBZ555scwf1SOfh8=";

/**
 * Les zones à CSP à nonce : les premiers segments d'adresse dont toutes les pages sont
 * rendues à chaque requête. Le proxy les sert (son `matcher` les reprend, en littéral).
 */
export const ZONES_A_NONCE = ["teacher", "admin", "arena", "etablissement", "org", "examen", "compete", "profile"] as const;

/** Les pages PRÉRENDUES de ces zones : elles gardent la CSP statique. */
export const PAGES_STATIQUES_DES_ZONES_A_NONCE = ["/etablissement/sans-offre"] as const;

const ZONE = new RegExp(`^/(?:${ZONES_A_NONCE.join("|")})(?:/|$)`);

/** Cette adresse reçoit-elle la CSP à nonce (du proxy) plutôt que la statique ? */
export function sousNonce(chemin: string): boolean {
  const c = chemin.replace(/\/+$/, "") || "/";
  return ZONE.test(chemin) && !(PAGES_STATIQUES_DES_ZONES_A_NONCE as readonly string[]).includes(c);
}

/** La CSP à nonce : la statique, sauf script-src, sans 'unsafe-inline'. */
export function cspANonce(nonce: string, env: string | undefined = process.env.NODE_ENV): string {
  const dev = env !== "production";
  return contentSecurityPolicy(env)
    .split("; ")
    .map((d) =>
      d.startsWith("script-src ")
        ? `script-src 'self' 'nonce-${nonce}' '${EMPREINTE_DU_SCRIPT_DU_SITE}'${dev ? " 'unsafe-eval'" : ""}`
        : d,
    )
    .join("; ");
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
  return [...entetesCommuns(), ...entetesDeCadre(), ...entetesDeCspStatique()];
}

/** Ce qui vaut pour TOUTES les réponses, routes LTI comprises. */
export function entetesCommuns(): HeaderPair[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // Deux ans, sous-domaines compris, candidat à la liste de préchargement.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ];
}

/**
 * L'iframe interdite et la CSP du site : partout SAUF sous /api/lti/.
 *
 * Les routes LTI (lti/html.ts) servent des écrans que la plateforme d'enseignement
 * affiche dans sa propre page (sélection de contenu, inscription dynamique) et qui
 * postent vers elle (retour de la sélection). Elles posent leur propre CSP, plus stricte
 * sur tout le reste (default-src 'none', script à nonce), qui n'ouvre l'intégration qu'à
 * l'origine de LA plateforme et le formulaire qu'à son adresse de retour. Mesuré sur le
 * build : une CSP posée par une route est ÉCRASÉE par celle de next.config ; la règle
 * globale doit donc s'écarter de ce seul préfixe, plutôt que d'y être contredite.
 */
export function entetesDeCadre(): HeaderPair[] {
  return [{ key: "X-Frame-Options", value: "DENY" }];
}

/** La CSP statique, posée par next.config hors /api/lti/ et hors des zones à nonce. */
export function entetesDeCspStatique(): HeaderPair[] {
  return [{ key: CSP_HEADER_NAME, value: contentSecurityPolicy() }];
}

/** Toutes les routes sauf /api/lti/… (path-to-regexp, lu par next.config). */
export const SOURCE_HORS_LTI = "/((?!api/lti/).*)";

/**
 * Toutes les routes sauf /api/lti/… et les zones à nonce (dont la CSP vient du proxy),
 * en gardant leurs pages prérendues. Une expression de path-to-regexp : groupes non
 * capturants seulement.
 */
export const SOURCE_CSP_STATIQUE = `/((?!api/lti/)(?!(?!(?:${PAGES_STATIQUES_DES_ZONES_A_NONCE.map((p) => p.slice(1)).join("|")})$)(?:${ZONES_A_NONCE.join("|")})(?:/|$)).*)`;
