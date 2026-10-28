/*
 * SERVICE WORKER : LE STATIQUE SEULEMENT.
 *
 * L'ancienne version gardait toute réponse GET de même origine, pages comprises :
 * relevés de notes, exports CSV, noms et numéros d'étudiant restaient dans le
 * cache du navigateur, même après la déconnexion, sur des postes partagés.
 *
 * Désormais, seul le statique public est gardé : les fichiers de build
 * (`/_next/static/`), les icônes et les images publiques. Jamais une page HTML,
 * jamais une réponse RSC, jamais un téléchargement, jamais une réponse marquée
 * `no-store` ou `private`. Tout le reste passe par le réseau, sans copie.
 *
 * Changer `CACHE_NAME` purge, à l'activation, les caches des versions
 * précédentes (dont ceux qui contiennent encore des pages).
 *
 * La logique est faite de fonctions pures, testées par
 * `tests/unit/service-worker.test.ts`.
 */
const CACHE_NAME = "ba-v3-statique";
const PRECACHE = ["/icon-192.png", "/icon-512.png"];

/** Les dossiers publics qui ne contiennent que des images de décor. */
const DOSSIERS_D_IMAGES = ["/scenes/", "/brand/", "/apercus/", "/guides/"];
const EXTENSION_IMAGE = /\.(?:png|webp|svg|jpe?g|gif|ico|avif)$/i;
const ICONES_A_LA_RACINE = /^\/(?:icon-[\w-]+|apple-touch-icon|favicon-[\w-]+)\.png$/;

/** Ce chemin désigne-t-il un fichier statique public, qu'on peut garder ? */
function estUnCheminStatique(pathname) {
  if (pathname.startsWith("/_next/static/")) return true;
  if (ICONES_A_LA_RACINE.test(pathname)) return true;
  return (
    DOSSIERS_D_IMAGES.some((d) => pathname.startsWith(d)) && EXTENSION_IMAGE.test(pathname)
  );
}

/** La requête peut-elle être servie par le cache ? Ni page, ni RSC, ni autre origine. */
function requeteCachable(request, origine) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== origine) return false;
  // Une navigation est toujours une page, quel que soit son chemin.
  if (request.mode === "navigate") return false;
  // Les requêtes RSC (navigation côté client) portent l'en-tête `RSC` ou `_rsc`.
  if (request.headers.get("RSC") !== null || url.searchParams.has("_rsc")) return false;
  return estUnCheminStatique(url.pathname);
}

/** La réponse peut-elle être gardée ? Elle doit dire elle-même qu'elle est publique. */
function reponseCachable(response) {
  if (!response || !response.ok || response.type !== "basic") return false;
  const cacheControl = (response.headers.get("Cache-Control") || "").toLowerCase();
  if (/(?:^|[\s,])(?:no-store|private|no-cache)(?:$|[\s,=])/.test(cacheControl)) return false;
  if (/attachment/i.test(response.headers.get("Content-Disposition") || "")) return false;
  const type = (response.headers.get("Content-Type") || "").toLowerCase();
  if (type.startsWith("text/html") || type.startsWith("text/x-component")) return false;
  if (type.startsWith("text/csv") || type.includes("spreadsheet")) return false;
  return true;
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

/** À la déconnexion, la page demande de tout vider (voir `src/lib/purge-hors-ligne.ts`). */
self.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "purger") return;
  const purge = caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
  if (e.waitUntil) e.waitUntil(purge);
});

self.addEventListener("fetch", (e) => {
  // Hors statique : on ne s'en mêle pas, le navigateur va au réseau sans copie.
  if (!requeteCachable(e.request, self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (reponseCachable(res)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || Response.error()))
  );
});
