import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers, organizations, users } from "@/db/schema";

/**
 * Authentification enseignant v0.1 (ADR-08) : email + mot de passe (bcrypt).
 * Chaque enseignant inscrit crée son organisation (établissement) et en
 * devient org_admin. Magic link et SSO : évolutions.
 */

export async function registerTeacher(args: {
  email: string;
  password: string;
  displayName: string;
  schoolName: string;
}): Promise<{ userId: string } | { error: string }> {
  const email = args.email.trim().toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing[0]) return { error: "Un compte existe déjà avec cet e-mail." };
  if (args.password.length < 8) return { error: "Mot de passe : 8 caractères minimum." };

  const passwordHash = await bcrypt.hash(args.password, 10);
  const inserted = await db
    .insert(users)
    .values({ email, passwordHash, displayName: args.displayName.trim() || "Enseignant" })
    .returning({ id: users.id });
  const userId = inserted[0]!.id;

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
  return { userId: row.id };
}

/** Organisation « école » de l'enseignant (la première dont il est membre). */
export async function getTeacherOrgId(userId: string): Promise<string | null> {
  const row = (
    await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(
        and(eq(organizationMembers.userId, userId), eq(organizationMembers.role, "org_admin")),
      )
  )[0];
  return row?.organizationId ?? null;
}
