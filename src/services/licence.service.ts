import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orgLicences, organizationMembers, organizations } from "@/db/schema";

/**
 * La licence d'établissement : ce qui est vendu, et ce qui est refusé.
 *
 * Un lycée n'achète pas un abonnement par carte bancaire. Il émet un bon de
 * commande, reçoit une facture et paie par mandat administratif, parfois deux
 * mois plus tard. Le produit enregistre donc les termes convenus, il ne les
 * encaisse pas : le prix et la référence sont là pour retrouver la vente, pas
 * pour la conclure.
 *
 * TROIS DÉCISIONS, ET CHACUNE PROTÈGE QUELQU'UN.
 *
 * L'absence de licence vaut ACCÈS LIBRE. Une frontière qui se refermerait
 * d'elle-même sur les établissements existants, sur une démonstration ou sur
 * un essai serait une régression déguisée en modèle économique. La limite
 * n'existe que là où une vente l'a définie.
 *
 * Une licence expirée n'interrompt JAMAIS une classe en cours. Elle empêche
 * d'ouvrir une NOUVELLE partie, et laisse terminer celles qui tournent. Un
 * trimestre commencé se finit : couper au milieu punirait les élèves d'un
 * retard de mandatement qui ne les concerne pas.
 *
 * Le plafond porte sur les ENSEIGNANTS, pas sur les élèves. C'est l'unité que
 * l'établissement reconnaît sur un devis, elle est stable dans l'année, et
 * compter les élèves reviendrait à facturer une classe qui gonfle.
 */

export type LicenceState = "libre" | "active" | "bientot_expiree" | "expiree" | "a_venir";

export interface OrgLicence {
  id: string;
  label: string;
  startsAt: Date;
  endsAt: Date;
  maxTeachers: number | null;
  reference: string | null;
  amountCents: number | null;
}

export interface LicenceStatus {
  state: LicenceState;
  licence: OrgLicence | null;
  /** Enseignants et administrateurs rattachés : ce que le plafond compte. */
  teachers: number;
  /** Jours restants, négatif si la période est passée. Null sans licence. */
  daysLeft: number | null;
  /** Ce qui est refusé aujourd'hui, en une phrase adressée à un humain. */
  blocking: string | null;
}

/** Seuil d'alerte : de quoi lancer un renouvellement sans courir. */
const ALERTE_JOURS = 30;

const jours = (de: Date, a: Date) =>
  Math.ceil((a.getTime() - de.getTime()) / (24 * 60 * 60 * 1000));

/** La licence en cours d'un établissement, ou la plus récente s'il n'y en a pas. */
export async function getLicenceStatus(
  organizationId: string,
  now: Date = new Date(),
): Promise<LicenceStatus> {
  const rows = await db
    .select()
    .from(orgLicences)
    .where(eq(orgLicences.organizationId, organizationId))
    .orderBy(desc(orgLicences.endsAt));

  const membres = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, organizationId));
  const teachers = membres.filter((m) => m.role !== "student").length;

  if (rows.length === 0) {
    return { state: "libre", licence: null, teachers, daysLeft: null, blocking: null };
  }

  // Celle qui couvre aujourd'hui ; à défaut, la plus récente, pour que
  // l'établissement voie ce qui vient d'expirer plutôt que rien.
  const courante = rows.find((r) => r.startsAt <= now && now <= r.endsAt) ?? rows[0]!;
  const licence: OrgLicence = {
    id: courante.id,
    label: courante.label,
    startsAt: courante.startsAt,
    endsAt: courante.endsAt,
    maxTeachers: courante.maxTeachers,
    reference: courante.reference,
    amountCents: courante.amountCents,
  };
  const daysLeft = jours(now, courante.endsAt);

  if (now < courante.startsAt) {
    return {
      state: "a_venir",
      licence,
      teachers,
      daysLeft,
      blocking: `La licence « ${courante.label} » ne commence que le ${courante.startsAt.toLocaleDateString("fr-FR")}.`,
    };
  }
  if (now > courante.endsAt) {
    return {
      state: "expiree",
      licence,
      teachers,
      daysLeft,
      blocking: `La licence « ${courante.label} » a expiré le ${courante.endsAt.toLocaleDateString("fr-FR")}. Les parties en cours se terminent normalement ; le renouvellement rouvre la création.`,
    };
  }
  if (courante.maxTeachers !== null && teachers > courante.maxTeachers) {
    return {
      state: "active",
      licence,
      teachers,
      daysLeft,
      blocking: `La licence couvre ${courante.maxTeachers} enseignants et l'établissement en compte ${teachers}.`,
    };
  }
  return {
    state: daysLeft <= ALERTE_JOURS ? "bientot_expiree" : "active",
    licence,
    teachers,
    daysLeft,
    blocking: null,
  };
}

/**
 * Lève si l'établissement ne peut pas ouvrir une nouvelle partie.
 *
 * Appelé à la CRÉATION seulement : clore un tour, débriefer et exporter les
 * notes restent possibles quoi qu'il arrive. Ce qui a commencé se termine.
 */
export async function assertCanCreateGame(organizationId: string): Promise<void> {
  const statut = await getLicenceStatus(organizationId);
  if (statut.blocking) throw new Error(statut.blocking);
}

/** Lève si accueillir un enseignant de plus dépasserait le plafond vendu. */
export async function assertCanAddTeacher(organizationId: string): Promise<void> {
  const statut = await getLicenceStatus(organizationId);
  const plafond = statut.licence?.maxTeachers;
  if (statut.state === "expiree" || statut.state === "a_venir") {
    throw new Error(statut.blocking ?? "Licence inactive.");
  }
  if (plafond !== null && plafond !== undefined && statut.teachers >= plafond) {
    throw new Error(
      `La licence couvre ${plafond} enseignants, tous rattachés. Le renouvellement ou une extension ouvre une place.`,
    );
  }
}

/** Enregistre les termes vendus à un établissement (espace administrateur). */
export async function setOrgLicence(args: {
  adminId: string;
  organizationId: string;
  label: string;
  startsAt: Date;
  endsAt: Date;
  maxTeachers: number | null;
  reference?: string | null;
  amountCents?: number | null;
}): Promise<{ licenceId: string }> {
  // Dates invalides (champ vide ou malformé → `new Date("")` = Invalid Date) :
  // toute comparaison avec un NaN est fausse, la garde `endsAt <= startsAt`
  // laissait donc passer une licence à dates invalides. On les refuse d'abord.
  if (Number.isNaN(args.startsAt.getTime()) || Number.isNaN(args.endsAt.getTime())) {
    throw new Error("Dates de licence invalides : renseignez un début et une fin valides.");
  }
  if (args.endsAt <= args.startsAt) {
    throw new Error("La fin de la licence doit suivre son début.");
  }
  const inserted = await db
    .insert(orgLicences)
    .values({
      organizationId: args.organizationId,
      label: args.label.trim() || "Licence",
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      maxTeachers: args.maxTeachers,
      reference: args.reference?.trim() || null,
      amountCents: args.amountCents ?? null,
      createdBy: args.adminId,
    })
    .returning({ id: orgLicences.id });
  return { licenceId: inserted[0]!.id };
}

/** Supprime une licence : la vente n'a pas eu lieu, ou s'est trompée d'établissement. */
export async function deleteOrgLicence(licenceId: string): Promise<void> {
  await db.delete(orgLicences).where(eq(orgLicences.id, licenceId));
}

/** Toutes les licences d'un établissement, la plus récente en tête. */
export async function listOrgLicences(organizationId: string): Promise<OrgLicence[]> {
  const rows = await db
    .select()
    .from(orgLicences)
    .where(eq(orgLicences.organizationId, organizationId))
    .orderBy(desc(orgLicences.endsAt));
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    maxTeachers: r.maxTeachers,
    reference: r.reference,
    amountCents: r.amountCents,
  }));
}

/** État des licences de tous les établissements, pour l'espace administrateur. */
