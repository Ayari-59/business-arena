import { licenceEnCours } from "@/services/licence.service";
import { getTeacherOrgId } from "@/services/auth.service";

/**
 * Droits d'accès effectifs.
 *
 * L'ANCIEN PALIER GRATUIT (« freemium ») EST RETIRÉ. Il bornait, depuis un réglage de
 * /admin, les tours, les concours, le relevé et l'IA de qui n'avait pas de licence ; il
 * ne correspondait plus à la grille (config/tarifs.ts) et pouvait poser des murs qu'elle
 * ne vend pas. Le réglage enregistré en base (`settings.freeTier`) n'est plus lu.
 *
 * Ce qui reste :
 *  · `plan` : « full » quand une licence de l'arène (Classe, Programme ou Campus) est en cours. Ce
 *    qu'elle ouvre se vérifie dans services/acces.service.ts (niveaux, classe, concours,
 *    dossier enseignant, relevé) ;
 *  · `ai` : toujours vrai. L'assistant IA n'est pas vendu ; il ne dépend que de son
 *    propre réglage dans /admin et d'une clé côté serveur (services/ai.service.ts).
 *
 * Une partie ne s'arrête plus jamais avant la fin de son scénario faute de licence.
 */
export interface Entitlements {
  plan: "full" | "free";
  ai: boolean;
}

/** Droits d'un établissement (ou d'un accès sans établissement). */
export async function entitlementsForOrg(organizationId: string | null): Promise<Entitlements> {
  if (organizationId) {
    try {
      if (await licenceEnCours(organizationId, "arene")) return { plan: "full", ai: true };
    } catch (e) {
      // On ne DÉBLOQUE pas sur incident.
      console.error("[entitlements] lecture de la licence échouée :", e);
    }
  }
  return { plan: "free", ai: true };
}

/** Droits d'un utilisateur, via l'établissement auquel il est rattaché. */
export async function entitlementsForUser(userId: string): Promise<Entitlements> {
  const organizationId = await getTeacherOrgId(userId);
  return entitlementsForOrg(organizationId);
}
