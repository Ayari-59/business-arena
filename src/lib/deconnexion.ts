import { cookies } from "next/headers";
import { clearSession } from "@/lib/session";
import { COOKIE_INVITE } from "@/lib/cookie-invite";
import { COOKIE_CONTEXTE } from "@/lti/contexte";

/**
 * TOUT CE QUI DIT « QUI EST DEVANT L'ÉCRAN », EFFACÉ À LA DÉCONNEXION.
 *
 * Effacer la seule session laissait deux cookies : `ba_guest`, qui peut porter
 * l'identité de l'enseignant (l'examen le pose), et `ba_lti`, le contexte du
 * dernier lancement depuis l'ENT. La personne suivante sur le poste les
 * héritait. On les efface tous les trois.
 */
export async function fermerLaSessionDeLAppareil(): Promise<void> {
  await clearSession();
  const store = await cookies();
  store.delete(COOKIE_INVITE);
  store.delete(COOKIE_CONTEXTE);
}
