import { eq } from "drizzle-orm";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { getLicenceStatus } from "@/services/licence.service";
import { getTeacherOrgId } from "@/services/auth.service";
import {
  DEFAULT_FREE_TIER,
  FULL_ENTITLEMENTS,
  type Entitlements,
  type FreeTier,
} from "@/config/entitlements";

export type { Entitlements } from "@/config/entitlements";

/**
 * Droits d'accès effectifs (freemium).
 *
 * Règle unique : une licence EN COURS (active ou bientôt expirée mais encore
 * valide) ouvre tout ; sinon on retombe sur le palier gratuit réglé en admin.
 * On lit la config plateforme en direct (et non via admin.service) pour éviter
 * un cycle d'imports avec les services de jeu qui appellent cette fonction.
 */

async function freeTier(): Promise<FreeTier> {
  try {
    const row = (await db.select().from(platformSettings).where(eq(platformSettings.id, 1)))[0];
    const stored = (row?.settings as { freeTier?: Partial<FreeTier> } | null)?.freeTier;
    return { ...DEFAULT_FREE_TIER, ...(stored ?? {}) };
  } catch (e) {
    // Panne base : on retombe sur le palier par défaut, qui est OUVERT
    // (freemium éteint). Un incident de lecture ne doit pas transformer le
    // site en paywall et bloquer des utilisateurs par erreur.
    console.error("[entitlements] lecture du palier gratuit échouée :", e);
    return DEFAULT_FREE_TIER;
  }
}

/** Droits d'un établissement (ou d'un accès sans établissement : palier gratuit). */
export async function entitlementsForOrg(organizationId: string | null): Promise<Entitlements> {
  if (organizationId) {
    try {
      const st = await getLicenceStatus(organizationId);
      if (st.state === "active" || st.state === "bientot_expiree") return FULL_ENTITLEMENTS;
    } catch (e) {
      console.error("[entitlements] lecture de la licence échouée :", e);
      // On ne DÉBLOQUE pas sur incident : on continue vers le palier gratuit.
    }
  }
  return { plan: "free", ...(await freeTier()) };
}

/** Droits d'un utilisateur, via l'établissement auquel il est rattaché. */
export async function entitlementsForUser(userId: string): Promise<Entitlements> {
  const organizationId = await getTeacherOrgId(userId);
  return entitlementsForOrg(organizationId);
}
