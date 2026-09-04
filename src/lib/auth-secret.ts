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
    throw new Error(
      "AUTH_SECRET manquant : refus de signer les cookies avec un secret par défaut en production.",
    );
  }
  return "dev-secret-change-me";
}
