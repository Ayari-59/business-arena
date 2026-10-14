/**
 * LA PAGE OÙ REVENIR APRÈS LA CONNEXION (paramètre `retour`).
 *
 * Elle voyage dans l'adresse du bouton (« revenir à /join?code=K7M2PR »), puis en base
 * avec la demande d'authentification. Elle n'est suivie que si c'est un CHEMIN INTERNE :
 * commençant par une seule barre, sans schéma, sans hôte, sans barre oblique inverse ni
 * caractère de contrôle, hors des routes techniques (/api/). Tout le reste est ignoré
 * (la connexion aboutit alors à la page par défaut) : jamais de redirection ouverte.
 */

const LONGUEUR_MAX = 300;
const ORIGINE_FICTIVE = "https://retour.invalid";

export function retourInterne(brut: string | null | undefined): string | null {
  if (typeof brut !== "string") return null;
  const v = brut;
  if (!v || v !== v.trim() || v.length > LONGUEUR_MAX) return null;
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(v)) return null;
  let url: URL;
  try {
    url = new URL(v, ORIGINE_FICTIVE);
  } catch {
    return null;
  }
  if (url.origin !== ORIGINE_FICTIVE) return null;
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}
