import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers, organizations, users } from "@/db/schema";
import {
  getPlatformConfig,
  promoteIfBootstrapAdmin,
  resolveInvite,
} from "@/services/admin.service";
import { assertCanAddTeacher } from "@/services/licence.service";

/**
 * Authentification du personnel (ADR-08) : e-mail + mot de passe (bcrypt).
 * Trois chemins d'inscription :
 * - avec un code d'invitation d'établissement → rejoint cet établissement
 *   avec le rôle du code (org_admin ou teacher) — c'est le canal de
 *   déploiement multi-établissements ;
 * - sans code (auto-service, si autorisé par l'admin plateforme) → crée son
 *   propre établissement et en devient org_admin ;
 * - les e-mails listés dans ADMIN_EMAILS deviennent admin général.
 */

export async function registerTeacher(args: {
  email: string;
  password: string;
  displayName: string;
  schoolName: string;
  inviteCode?: string;
}): Promise<{ userId: string } | { error: string }> {
  const email = args.email.trim().toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing[0]) return { error: "Un compte existe déjà avec cet e-mail." };
  if (args.password.length < 8) return { error: "Mot de passe : 8 caractères minimum." };

  const invite = args.inviteCode?.trim() ? await resolveInvite(args.inviteCode) : null;
  if (args.inviteCode?.trim() && !invite) {
    return { error: "Code d'invitation inconnu ou désactivé." };
  }
  if (!invite) {
    const config = await getPlatformConfig();
    if (!config.allowSelfServiceTeachers) {
      return {
        error:
          "Les inscriptions libres sont fermées : demandez un code d'invitation à votre établissement.",
      };
    }
  }

  // Le plafond de la licence se vérifie AVANT de créer le compte : refuser
  // après aurait laissé un utilisateur orphelin, sans établissement, et
  // l'e-mail définitivement pris.
  if (invite) {
    try {
      await assertCanAddTeacher(invite.organizationId);
    } catch (erreur) {
      return { error: erreur instanceof Error ? erreur.message : "Licence insuffisante." };
    }
  }

  const passwordHash = await bcrypt.hash(args.password, 10);
  const inserted = await db
    .insert(users)
    .values({ email, passwordHash, displayName: args.displayName.trim() || "Enseignant" })
    .returning({ id: users.id });
  const userId = inserted[0]!.id;

  if (invite) {
    await db.insert(organizationMembers).values({
      userId,
      organizationId: invite.organizationId,
      role: invite.role,
    });
  } else {
    const org = await db
      .insert(organizations)
      .values({
        name: args.schoolName.trim() || "Mon établissement",
        slug: `org-${randomUUID().slice(0, 8)}`,
        kind: "school",
      })
      .returning({ id: organizations.id });
    await db.insert(organizationMembers).values({
      userId,
      organizationId: org[0]!.id,
      role: "org_admin",
    });
  }

  await promoteIfBootstrapAdmin(userId, email);
  return { userId };
}

export async function loginTeacher(args: {
  email: string;
  password: string;
}): Promise<{ userId: string } | { error: string }> {
  const email = args.email.trim().toLowerCase();
  const row = (await db.select().from(users).where(eq(users.email, email)))[0];
  if (!row?.passwordHash) return { error: "Identifiants incorrects." };
  const ok = await bcrypt.compare(args.password, row.passwordHash);
  if (!ok) return { error: "Identifiants incorrects." };
  await promoteIfBootstrapAdmin(row.id, email);
  return { userId: row.id };
}

/** Établissement de rattachement d'un membre du personnel (org_admin OU teacher). */
export async function getTeacherOrgId(userId: string): Promise<string | null> {
  const rows = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId));
  const staff = rows.filter((r) => r.role === "org_admin" || r.role === "teacher");
  // priorité au rattachement org_admin (son propre établissement)
  return (staff.find((r) => r.role === "org_admin") ?? staff[0])?.organizationId ?? null;
}
