import { retourInterne } from "@/saml/retour";

/**
 * LE RETOUR APRÈS LA CONNEXION ENSEIGNANT (paramètre `suite`).
 *
 * Constaté en production (audit d'octobre 2026) : `/teacher/animations/mco/dossier`
 * redirigeait vers `/teacher/login` sans rien retenir. Après connexion,
 * l'enseignant arrivait sur l'accueil de son espace, pas sur le dossier ni sur la
 * création de cohorte qu'il avait demandés.
 *
 * La page demandée voyage donc dans l'adresse de connexion
 * (`/teacher/login?suite=%2Fteacher%2Fcohortes%3Fepisode%3D…`). Elle n'est suivie
 * que si c'est un CHEMIN INTERNE, selon la même règle que le retour de la
 * connexion par l'établissement (saml/retour.ts) : une seule barre au début, ni
 * schéma, ni hôte, ni barre oblique inverse, ni caractère de contrôle, hors de
 * /api/. Tout le reste est ignoré : jamais de redirection ouverte.
 *
 * Ce module ne lit ni en-tête ni cookie : il se teste seul, et le proxy comme la
 * page de connexion l'importent sans rien tirer d'autre.
 */

export const PAGE_DE_CONNEXION = "/teacher/login";
export const PARAMETRE_SUITE = "suite";

/**
 * L'en-tête que le proxy pose sur chaque requête de /teacher : le chemin demandé,
 * requête comprise. Une page serveur ne connaît pas son adresse ; elle la lit ici.
 * Un client qui l'enverrait lui-même est écrasé par le proxy, et la valeur reste
 * de toute façon filtrée par `suiteInterne`.
 */
export const ENTETE_CHEMIN_DEMANDE = "x-ba-chemin-demande";

/** La page où aller après la connexion, ou null si elle n'est pas sûre. */
export function suiteInterne(brut: unknown): string | null {
  const chemin = retourInterne(typeof brut === "string" ? brut : null);
  if (!chemin) return null;
  // Revenir à la connexion ferait tourner en rond.
  const sansRequete = chemin.split(/[?#]/)[0] ?? "";
  if (sansRequete === PAGE_DE_CONNEXION || sansRequete.startsWith(`${PAGE_DE_CONNEXION}/`)) return null;
  return chemin;
}

/** L'adresse de la connexion, avec la page où revenir si elle est sûre. */
export function adresseDeConnexion(suite?: unknown): string {
  const chemin = suiteInterne(suite);
  return chemin ? `${PAGE_DE_CONNEXION}?${PARAMETRE_SUITE}=${encodeURIComponent(chemin)}` : PAGE_DE_CONNEXION;
}

/**
 * Le chemin demandé, tel que le proxy le transmet : chemin et requête, sans le
 * paramètre interne `_rsc` des navigations côté client. L'ancre ne parvient pas au
 * serveur ; le navigateur la garde lui-même sur l'adresse de connexion, et le
 * formulaire la rajoute (teacher-auth-forms.tsx).
 */
export function cheminDemande(url: URL): string {
  const params = new URLSearchParams(url.search);
  params.delete("_rsc");
  const requete = params.toString();
  return `${url.pathname}${requete ? `?${requete}` : ""}`;
}
