/**
 * LE COOKIE INVITÉ : son nom et sa durée, au même endroit pour tous ceux qui le posent.
 *
 * Ce fichier n'importe RIEN du serveur (ni `node:crypto`, ni la base) : le
 * `proxy` qui renouvelle le cookie à chaque visite s'exécute avant le rendu et
 * doit pouvoir le lire sans tirer tout `guest.ts` avec lui.
 */
export const COOKIE_INVITE = "ba_guest";

/** Un an, renouvelé à chaque visite : un joueur actif ne le voit jamais expirer. */
export const DUREE_COOKIE_INVITE_S = 60 * 60 * 24 * 365;

export function optionsCookieInvite() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: DUREE_COOKIE_INVITE_S,
    path: "/",
  };
}
