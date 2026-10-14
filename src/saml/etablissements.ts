import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { organizations, samlEtablissements } from "@/db/schema";

/**
 * LES ÉTABLISSEMENTS RATTACHÉS : QUEL IdP (ET/OU QUEL schacHomeOrganization) MÈNE À
 * QUELLE ORGANISATION, DONC À QUELLE LICENCE.
 *
 * Le propriétaire rattache chaque établissement client à son organisation dans
 * /admin/renater. Trois formes de rattachement, de la plus précise à la plus large :
 *   1. un IdP ET un établissement (schacHomeOrganization) : l'IdP mutualisé qui sert
 *      plusieurs établissements, chacun vers son organisation ;
 *   2. un IdP seul : tout ce qui vient de cet IdP ;
 *   3. un établissement seul : tout IdP de la fédération qui l'affirme DANS SES PORTÉES
 *      (attributs.ts ne garde l'établissement que s'il l'est).
 * Le premier qui correspond l'emporte, dans cet ordre.
 */

export interface Rattachement {
  id: string;
  idpEntityId: string | null;
  schac: string | null;
  organizationId: string;
  organisation: string;
  nom: string;
}

export async function rattachementDe(idpEntityId: string, etablissement: string | null): Promise<Rattachement | null> {
  const lignes = await db
    .select({
      id: samlEtablissements.id,
      idpEntityId: samlEtablissements.idpEntityId,
      schac: samlEtablissements.schac,
      organizationId: samlEtablissements.organizationId,
      organisation: organizations.name,
      nom: samlEtablissements.nom,
    })
    .from(samlEtablissements)
    .innerJoin(organizations, eq(organizations.id, samlEtablissements.organizationId))
    .where(
      or(
        eq(samlEtablissements.idpEntityId, idpEntityId),
        etablissement ? and(isNull(samlEtablissements.idpEntityId), eq(samlEtablissements.schac, etablissement)) : undefined,
      ),
    );
  const exact = lignes.find((l) => l.idpEntityId === idpEntityId && etablissement !== null && l.schac === etablissement);
  const parIdp = lignes.find((l) => l.idpEntityId === idpEntityId && l.schac === null);
  const parSchac = lignes.find((l) => l.idpEntityId === null && etablissement !== null && l.schac === etablissement);
  return exact ?? parIdp ?? parSchac ?? null;
}

export class RattachementRefuse extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RattachementRefuse";
  }
}

export async function rattacher(args: {
  idpEntityId: string | null;
  schac: string | null;
  organizationId: string;
  nom: string;
  adminId: string | null;
}): Promise<void> {
  const idp = args.idpEntityId?.trim() || null;
  const schac = args.schac?.trim().toLowerCase() || null;
  if (!idp && !schac) throw new RattachementRefuse("Indiquez l'IdP de l'établissement, son domaine (schacHomeOrganization), ou les deux.");
  const [org] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, args.organizationId));
  if (!org) throw new RattachementRefuse("Organisation introuvable.");
  const existant = await db
    .select({ id: samlEtablissements.id })
    .from(samlEtablissements)
    .where(
      and(
        idp ? eq(samlEtablissements.idpEntityId, idp) : isNull(samlEtablissements.idpEntityId),
        schac ? eq(samlEtablissements.schac, schac) : isNull(samlEtablissements.schac),
      ),
    );
  if (existant.length > 0) throw new RattachementRefuse("Cet établissement est déjà rattaché : retirez d'abord l'ancien rattachement.");
  await db.insert(samlEtablissements).values({
    idpEntityId: idp,
    schac,
    organizationId: args.organizationId,
    nom: (args.nom.trim() || schac || idp || "Établissement").slice(0, 200),
    creePar: args.adminId,
  });
}

export async function retirerRattachement(id: string): Promise<void> {
  await db.delete(samlEtablissements).where(eq(samlEtablissements.id, id));
}

export async function listerRattachements(): Promise<Rattachement[]> {
  return db
    .select({
      id: samlEtablissements.id,
      idpEntityId: samlEtablissements.idpEntityId,
      schac: samlEtablissements.schac,
      organizationId: samlEtablissements.organizationId,
      organisation: organizations.name,
      nom: samlEtablissements.nom,
    })
    .from(samlEtablissements)
    .innerJoin(organizations, eq(organizations.id, samlEtablissements.organizationId))
    .orderBy(asc(samlEtablissements.nom));
}

/** Les IdP déjà rattachés (pour marquer la liste de l'agrégat). */
export async function idpsRattaches(entityIds: string[]): Promise<Set<string>> {
  if (entityIds.length === 0) return new Set();
  const lignes = await db
    .select({ idp: samlEtablissements.idpEntityId })
    .from(samlEtablissements)
    .where(inArray(samlEtablissements.idpEntityId, entityIds));
  return new Set(lignes.map((l) => l.idp).filter((v): v is string => !!v));
}
