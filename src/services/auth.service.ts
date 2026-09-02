import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts, organizationMembers, organizations, users } from "@/db/schema";
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
    .onConflictDoNothing()
    .returning({ id: users.id });

  let userId: string;
  if (inserted[0]) {
    userId = inserted[0].id;
  } else {
    const row = (await db.select().from(users).where(eq(users.email, email)))[0];
    if (!row?.passwordHash) return { error: "Un compte existe déjà avec cet e-mail." };
    const match = await bcrypt.compare(args.password, row.passwordHash);
    if (!match) return { error: "Un compte existe déjà avec cet e-mail." };
    const membership = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, row.id));
    if (membership.length > 0) return { error: "Un compte existe déjà avec cet e-mail." };
    userId = row.id;
  }

  if (invite) {
    await db.insert(organizationMembers).values({
      userId,
      organizationId: invite.organizationId,
      role: invite.role,
    }).onConflictDoNothing();
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
    }).onConflictDoNothing();
  }

  await promoteIfBootstrapAdmin(userId, email);
  return { userId };
}

/** Fenêtre glissante et plafond de la limitation des tentatives. */
export const FENETRE_TENTATIVES_MS = 15 * 60 * 1000;
export const MAX_ECHECS = 5;

/** Le même message quel que soit le cas : l'e-mail inconnu n'est pas dit. */
const IDENTIFIANTS_INCORRECTS = "Identifiants incorrects.";

/**
 * Échecs récents pour cet e-mail OU cette adresse. En base, pas en mémoire :
 * Vercel sert depuis plusieurs instances qui ne partagent rien.
 */
async function echecsRecents(email: string, ip: string | null, now: number) {
  const depuis = new Date(now - FENETRE_TENTATIVES_MS);
  const memeOrigine = ip ? or(eq(loginAttempts.email, email), eq(loginAttempts.ip, ip)) : eq(loginAttempts.email, email);
  return db
    .select()
    .from(loginAttempts)
    .where(and(gt(loginAttempts.createdAt, depuis), memeOrigine));
}

export async function loginTeacher(args: {
  email: string;
  password: string;
  /** Adresse d'origine, si connue : la limitation compte aussi par adresse. */
  ip?: string | null;
  now?: number;
}): Promise<
  | { userId: string; sessionVersion: number }
  | { error: string; retryAfterMinutes?: number }
> {
  const email = args.email.trim().toLowerCase();
  const ip = args.ip?.trim() || null;
  const now = args.now ?? Date.now();

  const echecs = await echecsRecents(email, ip, now);
  if (echecs.length >= MAX_ECHECS) {
    const plusAncien = Math.min(...echecs.map((e) => e.createdAt.getTime()));
    const minutes = Math.max(1, Math.ceil((plusAncien + FENETRE_TENTATIVES_MS - now) / 60_000));
    return {
      error: `Trop de tentatives, réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      retryAfterMinutes: minutes,
    };
  }

  const echec = async () => {
    await db.insert(loginAttempts).values({ email, ip, createdAt: new Date(now) });
    return { error: IDENTIFIANTS_INCORRECTS };
  };

  // Un mot de passe trop court ne peut pas être le bon : même message, même
  // compteur, pour ne rien dire de plus qu'à un mot de passe faux.
  if (args.password.length < 8) return echec();
  const row = (await db.select().from(users).where(eq(users.email, email)))[0];
  if (!row?.passwordHash) return echec();
  const ok = await bcrypt.compare(args.password, row.passwordHash);
  if (!ok) return echec();

  // Succès : le compteur repart de zéro pour cet e-mail et cette adresse.
  await db
    .delete(loginAttempts)
    .where(ip ? or(eq(loginAttempts.email, email), eq(loginAttempts.ip, ip)) : eq(loginAttempts.email, email));
  await promoteIfBootstrapAdmin(row.id, email);
  return { userId: row.id, sessionVersion: row.sessionVersion };
}

/**
 * « Se déconnecter partout » : la version de session du compte avance d'un
 * cran, et tout cookie signé pour l'ancienne est refusé. Rend la nouvelle
 * version, pour ne pas fermer la session qui vient de le demander si on veut
 * la garder.
 */
export async function bumpSessionVersion(userId: string): Promise<number> {
  const rows = await db
    .update(users)
    .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId))
    .returning({ v: users.sessionVersion });
  return rows[0]?.v ?? 1;
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
