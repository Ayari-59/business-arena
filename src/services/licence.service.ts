import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orgLicences, organizationMembers } from "@/db/schema";
import {
  OFFRES,
  PARAMETRAGE_DES_OFFRES,
  type OffreDeLArene,
  type ParametrageDeLicence,
} from "@/config/tarifs";

/**
 * La licence d'établissement : ce qui est vendu, et ce qui est refusé.
 *
 * Tout se vend sur devis (config/tarifs.ts). L'établissement émet un bon de
 * commande, reçoit une facture et paie par virement ou mandat administratif,
 * parfois deux mois plus tard. Le produit enregistre donc les termes convenus, il
 * ne les encaisse pas : le prix et la référence sont là pour retrouver la vente,
 * pas pour la conclure.
 *
 * UNE LICENCE PORTE SON PÉRIMÈTRE (migration 0036) : l'arène et/ou les épisodes
 * manager, vendus à part. ET SON PARAMÉTRAGE (migration 0038) : l'offre de l'arène
 * (Classe, Programme, Campus), les entreprises et les niveaux qu'elle ouvre, ses plafonds
 * d'enseignants et de parties en cours (config/tarifs.ts, `PARAMETRAGE_DES_OFFRES`).
 * Ce que chaque licence ouvre se décide dans services/acces.service.ts :
 * sans licence de l'arène en cours, pas de partie de classe ni de concours (« pas
 * d'essai en classe ») ; sans licence qui inclut les épisodes, seules les
 * démonstrations se lancent. Une licence expirée vaut une absence de licence.
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
  /** L'offre de l'arène que la licence ouvre ; null : elle n'ouvre pas l'arène. */
  arene: OffreDeLArene | null;
  /** La licence ouvre-t-elle les épisodes manager non démo ? */
  episodes: boolean;
  /** Les entreprises ouvertes (codes) ; null : toutes. */
  entreprises: string[] | null;
  /** Les niveaux ouverts ; null : tous. */
  niveaux: number[] | null;
  /** Les parties de classe et concours en cours en même temps ; null : sans plafond. */
  maxPartiesEnCours: number | null;
}

/** Le paramétrage de l'arène d'une licence, tel que la règle le lit ; null : pas d'arène. */
export function parametrageDe(l: OrgLicence): ParametrageDeLicence | null {
  if (!l.arene) return null;
  return {
    offre: l.arene,
    entreprises: l.entreprises,
    niveaux: l.niveaux,
    maxEnseignants: l.maxTeachers,
    maxPartiesEnCours: l.maxPartiesEnCours,
  };
}

/** Sur quoi lire l'état : toute licence, celles de l'arène, ou celles qui incluent les épisodes. */
export type PorteeDeLicence = "toutes" | "arene" | "episodes";

type LigneDeLicence = typeof orgLicences.$inferSelect;

export const versLicence = (r: LigneDeLicence): OrgLicence => ({
  id: r.id,
  label: r.label,
  startsAt: r.startsAt,
  endsAt: r.endsAt,
  maxTeachers: r.maxTeachers,
  reference: r.reference,
  amountCents: r.amountCents,
  arene: r.arene ?? null,
  episodes: r.episodes,
  entreprises: r.entreprises ?? null,
  niveaux: r.niveaux ?? null,
  maxPartiesEnCours: r.maxPartiesEnCours ?? null,
});

const couvre = (r: LigneDeLicence, portee: PorteeDeLicence): boolean =>
  portee === "toutes" || (portee === "arene" ? r.arene !== null : r.episodes);

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

/**
 * La licence en cours d'un établissement, ou la plus récente s'il n'y en a pas. `portee`
 * restreint la lecture aux licences de l'arène ou à celles qui incluent les épisodes : un
 * établissement peut avoir une licence Campus en cours et une licence épisodes expirée.
 */
export async function getLicenceStatus(
  organizationId: string,
  now: Date = new Date(),
  portee: PorteeDeLicence = "toutes",
): Promise<LicenceStatus> {
  const rows = (
    await db
      .select()
      .from(orgLicences)
      .where(eq(orgLicences.organizationId, organizationId))
      .orderBy(desc(orgLicences.endsAt))
  ).filter((r) => couvre(r, portee));

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
  const licence = versLicence(courante);
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
 * Lève si la licence de l'arène de l'établissement, EN COURS, compte plus d'enseignants
 * qu'elle n'en couvre. L'absence de licence, une licence expirée ou à venir, se refusent
 * avant, et avec le même message, dans `verifierLaClasse` (services/acces.service.ts).
 *
 * Appelé à la CRÉATION seulement : clore un tour, débriefer et exporter les
 * notes restent possibles. Ce qui a commencé se termine.
 */
export async function assertCanCreateGame(organizationId: string): Promise<void> {
  const statut = await getLicenceStatus(organizationId, new Date(), "arene");
  if ((statut.state === "active" || statut.state === "bientot_expiree") && statut.blocking) {
    throw new Error(statut.blocking);
  }
}

/** Une licence de cette portée est-elle en cours (active, ou bientôt à renouveler) ? */
export async function licenceEnCours(
  organizationId: string,
  portee: Exclude<PorteeDeLicence, "toutes">,
  now: Date = new Date(),
): Promise<boolean> {
  const st = await getLicenceStatus(organizationId, now, portee);
  return st.state === "active" || st.state === "bientot_expiree";
}

/**
 * La fin de la dernière licence de l'arène de l'établissement, si elle est passée : le
 * relevé de notes reste téléchargeable un temps après (config/tarifs.ts, CONDITIONS).
 */
export async function finDeLaDerniereLicenceDeLArene(organizationId: string): Promise<Date | null> {
  const rows = await db
    .select({ endsAt: orgLicences.endsAt, arene: orgLicences.arene })
    .from(orgLicences)
    .where(eq(orgLicences.organizationId, organizationId))
    .orderBy(desc(orgLicences.endsAt));
  return rows.find((r) => r.arene !== null)?.endsAt ?? null;
}

/** Lève si accueillir un enseignant de plus dépasserait le plafond vendu. */
export async function assertCanAddTeacher(organizationId: string): Promise<void> {
  const statut = await getLicenceStatus(organizationId);
  const plafond = statut.licence?.maxTeachers;
  if (statut.state === "expiree" || statut.state === "a_venir") {
    throw new Error(statut.blocking ?? "Licence inactive.");
  }
  if (plafond !== null && plafond !== undefined && statut.teachers >= plafond) {
    const offre = statut.licence?.arene;
    throw new Error(
      offre === "classe"
        ? `L'offre ${OFFRES.classe.nom} couvre ${plafond} enseignant, déjà rattaché. L'offre ${OFFRES.programme.nom} ouvre l'arène à l'équipe pédagogique et aux intervenants du programme.`
        : `La licence couvre ${plafond} enseignants et intervenants, tous rattachés. Le renouvellement ou une extension ouvre une place.`,
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
  /**
   * Le périmètre vendu. Absent : une licence de l'arène en offre Campus, sans les
   * épisodes, comme les licences d'avant la décision.
   */
  arene?: OffreDeLArene | null;
  episodes?: boolean;
  /**
   * Le paramétrage de l'arène (config/tarifs.ts, `parametrageDeLOffre`) : entreprises et
   * niveaux ouverts (null ou absent : tous), plafond de parties en cours (absent : celui
   * de l'offre). Une licence Classe porte une entreprise et un niveau ; une licence
   * Programme, une entreprise.
   */
  entreprises?: readonly string[] | null;
  niveaux?: readonly number[] | null;
  maxPartiesEnCours?: number | null;
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
  const arene = args.arene === undefined ? "campus" : args.arene;
  const episodes = args.episodes ?? false;
  if (arene === null && !episodes) {
    throw new Error("Une licence ouvre l'arène, les épisodes manager, ou les deux : choisissez.");
  }
  const entreprises = arene ? (args.entreprises ? [...args.entreprises] : null) : null;
  const niveaux = arene ? (args.niveaux ? [...args.niveaux] : null) : null;
  // Une Classe est UN jeu paramétré : une entreprise, un niveau. La garde est ici, au
  // seul endroit qui écrit une licence, plutôt que dans une contrainte de base que les
  // migrations rejouées auraient du mal à porter (drizzle/0038_trois_offres.sql).
  if (arene === "classe" && (entreprises?.length !== 1 || niveaux?.length !== 1)) {
    throw new Error(`Une licence ${OFFRES.classe.nom} porte une entreprise et un niveau.`);
  }
  if (arene === "programme" && entreprises !== null && entreprises.length !== 1) {
    throw new Error(`Une licence ${OFFRES.programme.nom} porte une entreprise.`);
  }
  const maxPartiesEnCours =
    args.maxPartiesEnCours !== undefined
      ? args.maxPartiesEnCours
      : arene
        ? PARAMETRAGE_DES_OFFRES[arene].partiesEnCours
        : null;
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
      arene,
      episodes,
      entreprises,
      niveaux,
      maxPartiesEnCours,
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
  return rows.map(versLicence);
}

/** État des licences de tous les établissements, pour l'espace administrateur. */
