import { getGuestUserId } from "@/lib/guest";
import { enregistrerActivite, type GesteCorrige } from "@/services/activites.service";

/**
 * LE GESTE CORRIGÉ, NOTÉ DANS LE SUIVI DE LA CLASSE (migration 0057 ; services/activites.service.ts).
 *
 * Les actions du bureau, de l'enquête et du scénario l'appellent après la correction, avec le retour
 * qu'elles viennent de calculer. L'élève est celui du cookie d'invité : sans invité ou sans classe,
 * rien ne s'écrit, et rien ne se voit. Une écriture qui échoue ne casse jamais la correction : elle est
 * journalisée, et l'élève reçoit sa correction comme si de rien n'était.
 *
 * Ce module n'est pas une action serveur (aucune directive) : le navigateur ne peut pas l'appeler.
 */
export async function noterDansLaClasse(geste: GesteCorrige): Promise<void> {
  if ("refus" in geste.retour) return;
  try {
    const userId = await getGuestUserId();
    if (userId) await enregistrerActivite(userId, geste);
  } catch (e) {
    console.error("[noterDansLaClasse]", e);
  }
}
