import { createHmac, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers, samlComptes, users } from "@/db/schema";
import { NOM_INVITE_PAR_DEFAUT } from "@/config/invite";
import { assertCanAddTeacher } from "@/services/licence.service";
import type { RoleFedere } from "./attributs";
import type { IdentiteFederee } from "./reponse";

/**
 * LES PERSONNES VENUES PAR LA FÉDÉRATION (même philosophie que lti/comptes.ts).
 *
 * L'identifiant pseudonyme n'est JAMAIS gardé en clair : on garde son empreinte
 * HMAC-SHA256, avec le sel propre à l'IdP (saml_idps.sel). Le même identifiant redonne
 * la même empreinte, donc le même compte, sur tout appareil.
 *
 * L'ENSEIGNANT (ou le personnel) d'un établissement rattaché reçoit un compte de son
 * organisation, comme un enseignant invité par code : le plafond de la licence
 * s'applique à sa première venue (`assertCanAddTeacher`). Son adresse de connexion est
 * technique (il entre par son établissement, jamais par mot de passe) ; son nom et son
 * courriel sont gardés s'ils sont transmis, pour lui seul.
 *
 * L'ÉTUDIANT reçoit une identité de joueur PERSISTANTE : un compte invité minimal (le
 * pseudo qu'il choisira en rejoignant une partie), retrouvé par l'identifiant fédéré sur
 * n'importe quel appareil. Ni nom, ni courriel : ils ne sont même pas lus.
 *
 * Un compte n'est jamais relié par courriel à un compte existant : l'IdP pourrait
 * annoncer n'importe quelle adresse.
 */

export function hacherIdentifiant(sel: string, identifiant: string): string {
  return createHmac("sha256", sel).update(identifiant, "utf8").digest("base64url");
}

export class PlafondAtteint extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlafondAtteint";
  }
}

async function ligneDuCompte(idp: string, hache: string, role: RoleFedere) {
  return (
    await db
      .select()
      .from(samlComptes)
      .where(and(eq(samlComptes.idpEntityId, idp), eq(samlComptes.identifiantHache, hache), eq(samlComptes.role, role)))
  )[0];
}

async function rattacherALOrganisation(userId: string, organizationId: string): Promise<void> {
  const membre = await db
    .select()
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, organizationId)));
  if (membre.length > 0) return;
  try {
    await assertCanAddTeacher(organizationId);
  } catch (e) {
    throw new PlafondAtteint(e instanceof Error ? e.message : "Licence insuffisante.");
  }
  await db.insert(organizationMembers).values({ userId, organizationId, role: "teacher" }).onConflictDoNothing();
}

/** Le compte enseignant de cette personne dans cette organisation, créé à sa première venue ; lève `PlafondAtteint`. */
export async function compteEnseignant(
  p: IdentiteFederee,
  organizationId: string,
): Promise<{ userId: string; sessionVersion: number }> {
  const hache = hacherIdentifiant(p.idp.sel, p.identifiant);
  const existant = await ligneDuCompte(p.idp.entityId, hache, "enseignant");
  if (existant) {
    await db
      .update(samlComptes)
      .set({ derniereVenue: new Date(), courriel: p.courriel ?? existant.courriel, organizationId })
      .where(eq(samlComptes.id, existant.id));
    if (p.nom) await db.update(users).set({ displayName: p.nom }).where(eq(users.id, existant.userId));
    // Rattaché à l'organisation de son établissement, même s'il en avait été retiré :
    // c'est elle qui le fait entrer. Le plafond s'applique alors comme à une première venue.
    await rattacherALOrganisation(existant.userId, organizationId);
    const [u] = await db.select({ v: users.sessionVersion }).from(users).where(eq(users.id, existant.userId));
    return { userId: existant.userId, sessionVersion: u?.v ?? 1 };
  }

  try {
    await assertCanAddTeacher(organizationId);
  } catch (e) {
    throw new PlafondAtteint(e instanceof Error ? e.message : "Licence insuffisante.");
  }
  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email: `saml-${userId}@saml.business-arena.local`,
    displayName: (p.nom ?? "Enseignant").slice(0, 120),
  });
  const [lie] = await db
    .insert(samlComptes)
    .values({
      idpEntityId: p.idp.entityId,
      identifiantHache: hache,
      role: "enseignant",
      userId,
      organizationId,
      courriel: p.courriel,
    })
    .onConflictDoNothing()
    .returning();
  if (!lie) {
    // Deux connexions simultanées : l'autre a gagné, on reprend son compte.
    await db.delete(users).where(eq(users.id, userId));
    return compteEnseignant(p, organizationId);
  }
  await db.insert(organizationMembers).values({ userId, organizationId, role: "teacher" }).onConflictDoNothing();
  return { userId, sessionVersion: 1 };
}

/** L'identité de joueur persistante de cet étudiant, créée à sa première venue. */
export async function identiteEtudiante(p: Pick<IdentiteFederee, "idp" | "identifiant">): Promise<string> {
  const hache = hacherIdentifiant(p.idp.sel, p.identifiant);
  const existant = await ligneDuCompte(p.idp.entityId, hache, "etudiant");
  if (existant) {
    await db.update(samlComptes).set({ derniereVenue: new Date() }).where(eq(samlComptes.id, existant.id));
    return existant.userId;
  }
  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email: `guest-${userId}@guest.business-arena.local`,
    displayName: NOM_INVITE_PAR_DEFAUT,
  });
  const [lie] = await db
    .insert(samlComptes)
    .values({ idpEntityId: p.idp.entityId, identifiantHache: hache, role: "etudiant", userId })
    .onConflictDoNothing()
    .returning();
  if (!lie) {
    await db.delete(users).where(eq(users.id, userId));
    return identiteEtudiante(p);
  }
  return userId;
}

/** Ce compte est-il une identité étudiante venue par la fédération ? (la page « Vos parties et cohortes ») */
export async function compteFedereEtudiant(userId: string): Promise<{ idp: string } | null> {
  const [l] = await db
    .select({ idp: samlComptes.idpEntityId })
    .from(samlComptes)
    .where(and(eq(samlComptes.userId, userId), eq(samlComptes.role, "etudiant")));
  return l ?? null;
}
