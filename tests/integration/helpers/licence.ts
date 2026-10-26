import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { setOrgLicence } from "@/services/licence.service";
import type { OffreDeLArene } from "@/config/tarifs";

/**
 * Le périmètre d'une licence de test (migrations 0036 et 0038) : par défaut l'arène en
 * offre Campus (toutes les entreprises, tous les niveaux, sans plafond), SANS les
 * épisodes. Les tests qui ouvrent des épisodes non démo le demandent
 * (`{ episodes: true }`) ; ceux qui vérifient une Classe ou un Programme donnent son
 * paramétrage (`entreprises`, `niveaux`, `maxTeachers`).
 */
export interface PerimetreDeTest {
  arene?: OffreDeLArene | null;
  episodes?: boolean;
  entreprises?: string[] | null;
  niveaux?: number[] | null;
  maxTeachers?: number | null;
  /** L'examen individuel. Absent : la composition par défaut (Campus seulement). */
  examen?: boolean;
}

const parametrage = (p: PerimetreDeTest) => ({
  maxTeachers: p.maxTeachers ?? (p.arene === "classe" ? 1 : null),
  arene: p.arene === undefined ? ("campus" as const) : p.arene,
  episodes: p.episodes ?? false,
  entreprises: p.entreprises ?? null,
  niveaux: p.niveaux ?? null,
  examen: p.examen,
});

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
  perimetre: PerimetreDeTest = {},
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
    ...parametrage(perimetre),
  });
  return { userId: r.userId, orgId };
}

/** Poser une licence en cours sur un établissement déjà créé par le test. */
export async function poserUneLicence(
  organizationId: string,
  adminId: string,
  perimetre: PerimetreDeTest = {},
): Promise<void> {
  await setOrgLicence({
    adminId,
    organizationId,
    label: "Licence de test",
    startsAt: new Date(Date.now() - 10 * JOUR),
    endsAt: new Date(Date.now() + 300 * JOUR),
    ...parametrage(perimetre),
  });
}

/**
 * Rattacher un compte, comme enseignant, à un établissement sous licence : ses parties
 * solo se créent alors à tous les niveaux, comme celles d'un enseignant connecté.
 */
export async function placerSousLicence(userId: string, perimetre: PerimetreDeTest = {}): Promise<void> {
  const { db } = await import("@/db");
  const { organizationMembers, organizations } = await import("@/db/schema");
  compteur += 1;
  const [org] = await db
    .insert(organizations)
    .values({ name: `Établissement sous licence ${compteur}`, slug: `sous-licence-${compteur}-${Date.now()}` })
    .returning({ id: organizations.id });
  await db.insert(organizationMembers).values({ userId, organizationId: org!.id, role: "teacher" });
  await poserUneLicence(org!.id, userId, perimetre);
}

const dejaSousLicence = new Set<string>();

/**
 * L'établissement d'un enseignant, placé sous licence de l'arène la première fois qu'on
 * le demande : pas d'essai en classe, la partie de classe et le concours en ont besoin.
 */
export async function etablissementDeLEnseignantSousLicence(userId: string): Promise<string> {
  const orgId = (await getTeacherOrgId(userId))!;
  if (!dejaSousLicence.has(orgId)) {
    dejaSousLicence.add(orgId);
    await poserUneLicence(orgId, userId);
  }
  return orgId;
}
