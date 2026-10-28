/**
 * EFFACER CE QUE LE NAVIGATEUR GARDE HORS LIGNE, À LA DÉCONNEXION.
 *
 * Le service worker (`public/sw.js`) ne garde plus que le statique public, mais
 * un poste qui a connu l'ancienne version peut encore avoir des pages privées
 * en cache. À la déconnexion (enseignant, admin, élève qui libère l'appareil),
 * on vide donc tous les caches et l'on désinscrit le service worker : la
 * personne suivante sur ce poste ne retrouve rien. Le layout le réinscrira à la
 * prochaine page, dans sa version qui ne garde que le statique.
 *
 * Code du navigateur : appelé depuis un gestionnaire `onSubmit`, sans attendre,
 * parce que l'action serveur part dans la foulée. Ne lève jamais.
 */
export async function purgerLeHorsLigne(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.controller?.postMessage({ type: "purger" });
      const inscriptions = await navigator.serviceWorker.getRegistrations();
      await Promise.all(inscriptions.map((r) => r.unregister()));
    }
  } catch {
    /* navigation privée, service worker refusé : rien à purger de ce côté */
  }
  try {
    if ("caches" in window) {
      const noms = await caches.keys();
      await Promise.all(noms.map((n) => caches.delete(n)));
    }
  } catch {
    /* Cache Storage indisponible : rien à purger */
  }
}
