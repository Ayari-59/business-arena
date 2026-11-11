import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { ecrireEnUnBloc } from "@/db/en-un-bloc";
import {
  coursAttributionsEnseignant,
  coursAttributionsEtablissement,
  coursClasses,
  coursLiberations,
  organizationMembers,
  organizations,
  users,
} from "@/db/schema";
import { parcoursAChoisir } from "@/config/cours/parcours-de-formation";
import { getTeacherOrgId } from "@/services/auth.service";
import type { Attributions, ModeDeLiberation } from "@/services/chapitres-de-la-classe";

/**
 * LES COURS ATTRIBUÉS PAR L'ADMIN ET LIBÉRÉS PAR L'ENSEIGNANT (décision du propriétaire,
 * novembre 2026 ; migration 0056). Les règles pures sont dans services/chapitres-de-la-classe.ts ;
 * ici, ce qui se lit et s'écrit en base.
 */

/** Les parcours attribués à un enseignant : sa liste, sinon celle de son établissement, sinon null. */
export async function parcoursAttribues(enseignantId: string): Promise<Attributions> {
  const siens = await db
    .select({ parcours: coursAttributionsEnseignant.parcours })
    .from(coursAttributionsEnseignant)
    .where(eq(coursAttributionsEnseignant.userId, enseignantId));
  if (siens.length > 0) return siens.map((r) => r.parcours);
  const org = await getTeacherOrgId(enseignantId);
  if (!org) return null;
  const ceux = await db
    .select({ parcours: coursAttributionsEtablissement.parcours })
    .from(coursAttributionsEtablissement)
    .where(eq(coursAttributionsEtablissement.organizationId, org));
  return ceux.length > 0 ? ceux.map((r) => r.parcours) : null;
}

/** Ne garde que les codes de parcours qu'une classe peut avoir, une fois chacun. */
const parcoursConnus = (codes: readonly string[]) => [...new Set(codes.filter((c) => parcoursAChoisir(c)))];

/** Remplace la liste d'un établissement ; une liste vide l'efface (l'offre seule décide). */
export async function attribuerALEtablissement(organizationId: string, codes: readonly string[]): Promise<void> {
  const parcours = parcoursConnus(codes);
  await ecrireEnUnBloc((client) => [
    client.delete(coursAttributionsEtablissement).where(eq(coursAttributionsEtablissement.organizationId, organizationId)),
    ...(parcours.length > 0 ? [client.insert(coursAttributionsEtablissement).values(parcours.map((p) => ({ organizationId, parcours: p })))] : []),
  ]);
}

/** Remplace la liste d'un enseignant ; une liste vide l'efface (celle de l'établissement reprend). */
export async function attribuerALEnseignant(userId: string, codes: readonly string[]): Promise<void> {
  const parcours = parcoursConnus(codes);
  await ecrireEnUnBloc((client) => [
    client.delete(coursAttributionsEnseignant).where(eq(coursAttributionsEnseignant.userId, userId)),
    ...(parcours.length > 0 ? [client.insert(coursAttributionsEnseignant).values(parcours.map((p) => ({ userId, parcours: p })))] : []),
  ]);
}

/** Pour /admin/cours : chaque établissement, sa liste, et ses enseignants avec la leur. */
export async function attributionsPourLAdmin() {
  const orgs = await db
    .select({ id: organizations.id, nom: organizations.name, kind: organizations.kind })
    .from(organizations)
    .orderBy(organizations.name);
  const scolaires = orgs.filter((o) => o.kind !== "public");
  const ids = scolaires.map((o) => o.id);
  if (ids.length === 0) return [];
  const [listes, membres] = await Promise.all([
    db.select().from(coursAttributionsEtablissement).where(inArray(coursAttributionsEtablissement.organizationId, ids)),
    db
      .select({ organizationId: organizationMembers.organizationId, userId: users.id, nom: users.displayName, email: users.email })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(and(inArray(organizationMembers.organizationId, ids), inArray(organizationMembers.role, ["teacher", "org_admin"]))),
  ]);
  const userIds = membres.map((m) => m.userId);
  const siennes = userIds.length
    ? await db.select().from(coursAttributionsEnseignant).where(inArray(coursAttributionsEnseignant.userId, userIds))
    : [];
  return scolaires.map((o) => ({
    id: o.id,
    nom: o.nom,
    parcours: listes.filter((l) => l.organizationId === o.id).map((l) => l.parcours),
    enseignants: membres
      .filter((m) => m.organizationId === o.id)
      .map((m) => ({
        id: m.userId,
        nom: m.nom,
        email: m.email,
        parcours: siennes.filter((a) => a.userId === m.userId).map((a) => a.parcours),
      })),
  }));
}

/** Les chapitres libérés d'une classe. */
export async function chapitresLiberes(classeId: string): Promise<Set<string>> {
  const lignes = await db
    .select({ chapitre: coursLiberations.chapitre })
    .from(coursLiberations)
    .where(eq(coursLiberations.classeId, classeId));
  return new Set(lignes.map((l) => l.chapitre));
}

/**
 * Les chapitres libérés d'une classe, du plus récemment libéré au plus ancien : « Ma classe » et le
 * suivi de l'enseignant s'ouvrent sur le premier (audit UX du 11 novembre 2026, P1-1 et P1-2).
 */
export async function chapitresLiberesDuPlusRecent(classeId: string): Promise<string[]> {
  const lignes = await db
    .select({ chapitre: coursLiberations.chapitre })
    .from(coursLiberations)
    .where(eq(coursLiberations.classeId, classeId))
    .orderBy(desc(coursLiberations.libereLe), desc(coursLiberations.chapitre));
  return lignes.map((l) => l.chapitre);
}

/** Change le mode de libération d'une classe, par son enseignant seulement. */
export async function changerLaLiberation(args: { enseignantId: string; classeId: string; mode: ModeDeLiberation }): Promise<boolean> {
  const fait = await db
    .update(coursClasses)
    .set({ liberation: args.mode })
    .where(and(eq(coursClasses.id, args.classeId), eq(coursClasses.creePar, args.enseignantId)))
    .returning({ id: coursClasses.id });
  return fait.length > 0;
}

/** Libère ou referme un chapitre d'une classe, par son enseignant seulement. */
export async function libererLeChapitre(args: {
  enseignantId: string;
  classeId: string;
  chapitre: string;
  libere: boolean;
}): Promise<boolean> {
  const [classe] = await db
    .select({ id: coursClasses.id })
    .from(coursClasses)
    .where(and(eq(coursClasses.id, args.classeId), eq(coursClasses.creePar, args.enseignantId)));
  if (!classe) return false;
  if (args.libere) {
    await db.insert(coursLiberations).values({ classeId: classe.id, chapitre: args.chapitre }).onConflictDoNothing();
  } else {
    await db.delete(coursLiberations).where(and(eq(coursLiberations.classeId, classe.id), eq(coursLiberations.chapitre, args.chapitre)));
  }
  return true;
}
