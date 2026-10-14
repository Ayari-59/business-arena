import { SITE_URL } from "@/config/site";

/** Le cookie qui relie le départ vers Google et le retour. */
export const COOKIE_ETAT = "google_oauth_state";

/**
 * L'adresse de retour déclarée chez Google : celle du site en production,
 * celle du poste en développement. Elle doit être EXACTEMENT celle inscrite
 * dans « URI de redirection autorisés » du client OAuth.
 */
export function adresseDeRetour(request: Request): string {
  const origine = new URL(request.url).origin;
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origine);
  return `${local ? origine : SITE_URL}/api/google/callback`;
}
