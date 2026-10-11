import { createHmac, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ltiComptes, organizationMembers, users } from "@/db/schema";
import { NOM_INVITE_PAR_DEFAUT, pseudoAffichable } from "@/config/invite";
import { assertCanAddTeacher } from "@/services/licence.service";
import type { Lancement } from "./lancement";

/**
 * LES PERSONNES VENUES PAR LA PLATEFORME.
 *
 * Le `sub` (l'identifiant de la personne chez la plateforme) n'est JAMAIS gardé en
 * clair : on garde son empreinte HMAC-SHA256, avec le sel propre à la plateforme. Le
 * même `sub` redonne la même empreinte, donc le même compte, à chaque lancement.
 *
 * L'ENSEIGNANT reçoit un compte rattaché à l'organisation de la plateforme, comme un
 * enseignant invité par code : le plafond de la licence s'applique à sa première venue.
 * Son adresse de connexion est technique (il entre par la plateforme, jamais par mot de
 * passe) ; le nom et le courriel envoyés par la plateforme sont gardés, pour lui seul.
 *
 * L'ÉLÈVE reçoit une identité invitée, celle de l'entrée par code : un pseudo (son
 * prénom si la plateforme l'envoie, sinon celui qu'il choisit), rien d'autre. Ni nom
 * de famille, ni courriel.
 *
 * Un compte n'est jamais relié par courriel à un compte existant : la plateforme
 * pourrait annoncer n'importe quelle adresse.
 */

export function hacherSub(sel: string, sub: string): string {
  return createHmac("sha256", sel).update(sub, "utf8").digest("base64url");
}

export class PlafondAtteint extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlafondAtteint";
  }
}

async function ligneDuCompte(plateformeId: string, subHache: string, role: "enseignant" | "eleve") {
  return (
    await db
      .select()
      .from(ltiComptes)
      .where(
        and(
          eq(ltiComptes.plateformeId, plateformeId),
          eq(ltiComptes.subHache, subHache),
          eq(ltiComptes.role, role),
        ),
      )
  )[0];
}

/** Le compte enseignant de cette personne, créé à sa première venue ; lève `PlafondAtteint`. */
export async function compteEnseignant(l: Lancement): Promise<{ userId: string; sessionVersion: number }> {
  const p = l.plateforme;
  const subHache = hacherSub(p.sel, l.sub);
  const nom = (l.nomComplet ?? l.prenom ?? "").trim() || "Enseignant";
  const existant = await ligneDuCompte(p.id, subHache, "enseignant");
  if (existant) {
    await db
      .update(ltiComptes)
      .set({ dernierLancement: new Date(), courriel: l.courriel ?? existant.courriel })
      .where(eq(ltiComptes.id, existant.id));
    // La dernière connexion (migration 0040) : un lancement est une connexion.
    await db
      .update(users)
      .set({ derniereConnexionLe: new Date(), ...(l.nomComplet || l.prenom ? { displayName: nom } : {}) })
      .where(eq(users.id, existant.userId));
    // Rattaché à l'organisation de la plateforme, même s'il en avait été retiré : c'est
    // elle qui le fait entrer. Le plafond s'applique alors comme à une première venue.
    const membre = await db
      .select()
      .from(organizationMembers)
      .where(
        and(eq(organizationMembers.userId, existant.userId), eq(organizationMembers.organizationId, p.organizationId)),
      );
    if (membre.length === 0) {
      try {
        await assertCanAddTeacher(p.organizationId);
      } catch (e) {
        throw new PlafondAtteint(e instanceof Error ? e.message : "Licence insuffisante.");
      }
      await db
        .insert(organizationMembers)
        .values({ userId: existant.userId, organizationId: p.organizationId, role: "teacher" })
        .onConflictDoNothing();
    }
    const [u] = await db.select({ v: users.sessionVersion }).from(users).where(eq(users.id, existant.userId));
    return { userId: existant.userId, sessionVersion: u?.v ?? 1 };
  }

  try {
    await assertCanAddTeacher(p.organizationId);
  } catch (e) {
    throw new PlafondAtteint(e instanceof Error ? e.message : "Licence insuffisante.");
  }
  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email: `lti-${userId}@lti.business-arena.local`,
    displayName: nom.slice(0, 120),
    // Un inscrit venu d'une plateforme (migration 0040, /admin/inscrits). Aucun accord aux
    // nouveautés n'est présumé : la case reste à cocher dans son espace (/teacher/compte),
    // ou par `consentementALaCreation` le jour où le premier lancement la montrera.
    provenance: "lti",
    derniereConnexionLe: new Date(),
  });
  const [lie] = await db
    .insert(ltiComptes)
    .values({ plateformeId: p.id, subHache, role: "enseignant", userId, courriel: l.courriel })
    .onConflictDoNothing()
    .returning();
  if (!lie) {
    // Deux lancements simultanés : l'autre a gagné, on reprend son compte.
    await db.delete(users).where(eq(users.id, userId));
    return compteEnseignant(l);
  }
  await db
    .insert(organizationMembers)
    .values({ userId, organizationId: p.organizationId, role: "teacher" })
    .onConflictDoNothing();
  return { userId, sessionVersion: 1 };
}

/** L'identité invitée de cet élève, créée à sa première venue. */
export async function compteEleve(l: Lancement): Promise<{ userId: string; pseudo: string | null }> {
  const p = l.plateforme;
  const subHache = hacherSub(p.sel, l.sub);
  const existant = await ligneDuCompte(p.id, subHache, "eleve");
  if (existant) {
    await db.update(ltiComptes).set({ dernierLancement: new Date() }).where(eq(ltiComptes.id, existant.id));
    if (l.prenom) {
      await db.update(users).set({ displayName: l.prenom }).where(eq(users.id, existant.userId));
      return { userId: existant.userId, pseudo: l.prenom };
    }
    const [u] = await db.select({ nom: users.displayName }).from(users).where(eq(users.id, existant.userId));
    return { userId: existant.userId, pseudo: pseudoAffichable(u?.nom) };
  }
  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email: `guest-${userId}@guest.business-arena.local`,
    displayName: l.prenom ?? NOM_INVITE_PAR_DEFAUT,
  });
  const [lie] = await db
    .insert(ltiComptes)
    .values({ plateformeId: p.id, subHache, role: "eleve", userId })
    .onConflictDoNothing()
    .returning();
  if (!lie) {
    await db.delete(users).where(eq(users.id, userId));
    return compteEleve(l);
  }
  return { userId, pseudo: l.prenom };
}

/** Ce compte est-il venu par une plateforme LTI, et laquelle ? */
export async function plateformesDuCompte(userId: string): Promise<string[]> {
  const lignes = await db
    .select({ p: ltiComptes.plateformeId })
    .from(ltiComptes)
    .where(eq(ltiComptes.userId, userId));
  return lignes.map((l) => l.p);
}
