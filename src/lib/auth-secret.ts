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
    // AUTH_SECRET absent en production : le repli sur cette constante publique
    // est une faille (cookies forgeable), mais REFUSER de servir (lever) met le
    // site à terre — pire pour l'utilisateur. On retombe donc sur le défaut en
    // le SIGNALANT bruyamment dans les logs, le temps que `AUTH_SECRET` soit
    // défini dans l'environnement. Une fois la variable posée, ce chemin n'est
    // plus jamais atteint.
    console.error(
      "[SÉCURITÉ] AUTH_SECRET absent en production : repli sur un secret PUBLIC. " +
        "Définissez AUTH_SECRET dans les variables d'environnement au plus vite.",
    );
  }
  return "dev-secret-change-me";
}
