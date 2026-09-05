/**
 * Le secret de signature des cookies (session enseignant, identité invitée).
 *
 * En développement, un repli sur une constante permet de lancer le projet sans
 * configuration. En PRODUCTION, ce repli est refusé : le dépôt est public, la
 * constante est donc connue de tous, et démarrer sans `AUTH_SECRET` laisserait
 * forger n'importe quel cookie — usurper l'identité d'un invité, ou se signer
 * une session `{ role: "teacher" }`. On préfère refuser de servir plutôt que de
 * signer avec un secret public.
 */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    // AUTH_SECRET absent en production : signer avec la constante PUBLIQUE
    // ci-dessous rendrait n'importe quel cookie forgeable (usurpation d'invité,
    // session { role:"teacher" }). On échoue EN MODE FERMÉ — refuser de servir
    // plutôt que servir en clair. La variable est posée en prod ; ce chemin ne
    // doit jamais être atteint en fonctionnement normal, et un déploiement qui
    // l'oublierait échoue bruyamment au lieu d'ouvrir une faille silencieuse.
    throw new Error(
      "[SÉCURITÉ] AUTH_SECRET absent en production : refus de signer avec un " +
        "secret public. Définissez AUTH_SECRET dans les variables d'environnement.",
    );
  }
  return "dev-secret-change-me";
}
