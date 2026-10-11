import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { setOrgLicence } from "@/services/licence.service";

/**
 * UN ÉTABLISSEMENT SOUS LICENCE, POUR LES TESTS QUI JOUENT AU-DELÀ DE LA DÉCOUVERTE.
 *
 * Sans licence en cours, les niveaux 4 à 6 ne se créent plus et seuls les épisodes de
 * démonstration se lancent (services/acces.service.ts). Les tests qui vérifient autre
 * chose à ces niveaux posent donc une licence dans leur base, comme le ferait
 * l'administrateur dans /admin : la règle reste en vigueur, ils jouent sous licence.
 *
 * À appeler dans un fichier qui remplace `@/db` par la base de test.
 */
const JOUR = 24 * 60 * 60 * 1000;
let compteur = 0;

export async function etablissementSousLicence(
  nom = "Sous licence",
): Promise<{ userId: string; orgId: string }> {
  compteur += 1;
  const r = await registerTeacher({
    email: `licence-${compteur}-${Date.now()}@lycee.test`,
    password: "motdepasse!",
    displayName: nom,
    schoolName: `Lycée ${nom} ${compteur}`,
  });
  if ("error" in r) throw new Error(r.error);
  const orgId = (await getTeacherOrgId(r.userId))!;
  await setOrgLicence({
    adminId: r.userId,
    organizationId: orgId,
    label: "Licence de test",
    startsAt: new Date(Date.now() - 10 * JOUR),
    endsAt: new Date(Date.now() + 300 * JOUR),
    maxTeachers: null,
  });
  return { userId: r.userId, orgId };
}

/** Poser une licence en cours sur un établissement déjà créé par le test. */
export async function poserUneLicence(organizationId: string, adminId: string): Promise<void> {
  await setOrgLicence({
    adminId,
    organizationId,
    label: "Licence de test",
    startsAt: new Date(Date.now() - 10 * JOUR),
    endsAt: new Date(Date.now() + 300 * JOUR),
    maxTeachers: null,
  });
}

/**
 * Rattacher un compte, comme enseignant, à un établissement sous licence : ses parties
 * solo se créent alors à tous les niveaux, comme celles d'un enseignant connecté.
 */
export async function placerSousLicence(userId: string): Promise<void> {
  const { db } = await import("@/db");
  const { organizationMembers, organizations } = await import("@/db/schema");
  compteur += 1;
  const [org] = await db
    .insert(organizations)
    .values({ name: `Établissement sous licence ${compteur}`, slug: `sous-licence-${compteur}-${Date.now()}` })
    .returning({ id: organizations.id });
  await db.insert(organizationMembers).values({ userId, organizationId: org!.id, role: "teacher" });
  await poserUneLicence(org!.id, userId);
}
