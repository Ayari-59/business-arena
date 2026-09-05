import { randomInt } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  getLicenceStatus,
  type LicenceStatus,
  type OrgLicence,
} from "@/services/licence.service";
import {
  competitions,
  games,
  orgInvites,
  orgLicences,
  organizationMembers,
  organizations,
  platformSettings,
  players,
  teams,
  users,
} from "@/db/schema";

/**
 * Espace d'administration (hiérarchie ADR-08/ADR-09) :
 * - admin général (users.is_platform_admin) : établissements, réglages
 *   globaux du jeu, statistiques plateforme ;
 * - admin d'établissement (organization_members.role = org_admin) : ses
 *   enseignants (codes d'invitation), ses parties et concours ;
 * - enseignant (role = teacher, ou org_admin) : espace pédagogique existant.
 * Le déploiement multi-établissements passe par les codes d'invitation :
 * jamais de mot de passe provisoire qui circule.
 */

// ---------------------------------------------------------------------------
// Contexte de rôles
// ---------------------------------------------------------------------------

export interface StaffContext {
  userId: string;
  displayName: string;
  isPlatformAdmin: boolean;
  organizations: { organizationId: string; name: string; role: "student" | "teacher" | "org_admin" }[];
}

export async function getStaffContext(userId: string): Promise<StaffContext | null> {
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!user) return null;
  const memberships = await db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
      name: organizations.name,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId));
  return {
    userId,
    displayName: user.displayName,
    isPlatformAdmin: user.isPlatformAdmin,
    organizations: memberships,
  };
}

export async function requirePlatformAdmin(userId: string): Promise<void> {
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!user?.isPlatformAdmin) throw new Error("Réservé à l'administrateur de la plateforme");
}

/** L'organisation administrée par cet utilisateur (org_admin), ou erreur. */
export async function requireOrgAdmin(userId: string): Promise<{ organizationId: string; name: string }> {
  const row = (
    await db
      .select({ organizationId: organizationMembers.organizationId, name: organizations.name })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(
        and(eq(organizationMembers.userId, userId), eq(organizationMembers.role, "org_admin")),
      )
  )[0];
  if (!row) throw new Error("Réservé aux administrateurs d'établissement");
  return row;
}

// ---------------------------------------------------------------------------
// Réglages globaux du jeu
// ---------------------------------------------------------------------------

export interface PlatformConfig {
  /** Autoriser les parties solo publiques depuis la landing. */
  allowPublicPlay: boolean;
  /** Autoriser l'inscription enseignant SANS code d'invitation (auto-service). */
  allowSelfServiceTeachers: boolean;
  /** Message d'annonce affiché sur la landing (vide = aucun). */
  announcement: string;
  /**
   * Adresse à laquelle le formulaire d'orientation écrit. Une adresse par
   * défaut est fournie (voir DEFAULT_CONFIG) pour que la demande d'information
   * soit active sans réglage : sans elle, le bouton disparaît et la page ne
   * rend que sa recommandation. Un administrateur peut la remplacer, ou la
   * vider pour retirer le bouton.
   */
  contactEmail: string;
}

const DEFAULT_CONFIG: PlatformConfig = {
  allowPublicPlay: true,
  allowSelfServiceTeachers: true,
  announcement: "",
  contactEmail: "contact@business-arena.fr",
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  try {
    const row = (await db.select().from(platformSettings).where(eq(platformSettings.id, 1)))[0];
    return { ...DEFAULT_CONFIG, ...((row?.settings as Partial<PlatformConfig>) ?? {}) };
  } catch (e) {
    // Panne base : on NE retombe PAS sur les défauts permissifs. Renvoyer
    // allowPublicPlay/allowSelfServiceTeachers à true en cas d'incident
    // OUVRIRAIT le jeu public et l'auto-inscription enseignant sans contrôle.
    // Repli FERMÉ (et on journalise) : on préfère brider que d'ouvrir par erreur.
    console.error("[getPlatformConfig] lecture de la config plateforme échouée :", e);
    return { ...DEFAULT_CONFIG, allowPublicPlay: false, allowSelfServiceTeachers: false };
  }
}

export async function updatePlatformConfig(
  adminId: string,
  patch: Partial<PlatformConfig>,
): Promise<PlatformConfig> {
  await requirePlatformAdmin(adminId);
  const next = { ...(await getPlatformConfig()), ...patch };
  await db
    .insert(platformSettings)
    .values({ id: 1, settings: next })
    .onConflictDoUpdate({ target: platformSettings.id, set: { settings: next } });
  return next;
}

/**
 * Amorçage de l'admin général : les e-mails listés dans ADMIN_EMAILS
 * (variable d'environnement, séparés par des virgules) sont promus
 * automatiquement à la connexion/inscription.
 */
export async function promoteIfBootstrapAdmin(userId: string, email: string): Promise<void> {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (list.includes(email.toLowerCase())) {
    await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.id, userId));
  }
}

// ---------------------------------------------------------------------------
// Invitations (déploiement multi-établissements)
// ---------------------------------------------------------------------------

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makeCode = (length = 8) =>
  Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

export async function createInvite(args: {
  organizationId: string;
  role: "org_admin" | "teacher";
  createdBy: string;
}): Promise<string> {
  const code = makeCode();
  await db.insert(orgInvites).values({
    organizationId: args.organizationId,
    role: args.role,
    code,
    createdBy: args.createdBy,
  });
  return code;
}

export async function deactivateInvite(args: {
  inviteId: string;
  organizationId: string;
}): Promise<void> {
  await db
    .update(orgInvites)
    .set({ active: false })
    .where(and(eq(orgInvites.id, args.inviteId), eq(orgInvites.organizationId, args.organizationId)));
}

/** Résout un code d'invitation actif (utilisé à l'inscription). */
export async function resolveInvite(
  code: string,
): Promise<{ organizationId: string; role: "org_admin" | "teacher" } | null> {
  const row = (
    await db
      .select()
      .from(orgInvites)
      .where(and(eq(orgInvites.code, code.trim().toUpperCase()), eq(orgInvites.active, true)))
  )[0];
  if (!row || row.role === "student") return null;
  return { organizationId: row.organizationId, role: row.role };
}

// ---------------------------------------------------------------------------
// Vues admin général
// ---------------------------------------------------------------------------

export interface PlatformOverview {
  stats: { organizations: number; users: number; games: number; competitions: number };
  organizations: {
    organizationId: string;
    name: string;
    kind: string;
    members: number;
    teachers: number;
    games: number;
    adminInvites: { id: string; code: string; active: boolean }[];
    /** État de la licence vendue à cet établissement, s'il y en a une. */
    licence: LicenceStatus;
    /** Historique des licences : une vente ne s'efface pas. */
    licences: OrgLicence[];
  }[];
  config: PlatformConfig;
}

export async function getPlatformOverview(adminId: string): Promise<PlatformOverview> {
  await requirePlatformAdmin(adminId);
  const ALERTE_JOURS = 30;
  const jours = (de: Date, a: Date) =>
    Math.ceil((a.getTime() - de.getTime()) / (24 * 60 * 60 * 1000));

  const [
    orgRows,
    userCountRows,
    gameRows,
    competitionCountRows,
    memberRows,
    inviteRows,
    allLicences,
  ] = await Promise.all([
    db.select().from(organizations),
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ id: games.id, organizationId: games.organizationId }).from(games),
    db.select({ count: sql<number>`count(*)::int` }).from(competitions),
    db.select().from(organizationMembers),
    db.select().from(orgInvites),
    db.select().from(orgLicences).orderBy(desc(orgLicences.endsAt)),
  ]);
  const userCount = userCountRows[0]!.count;
  const competitionCount = competitionCountRows[0]!.count;

  const licencesByOrg = new Map<string, typeof allLicences>();
  for (const lic of allLicences) {
    const arr = licencesByOrg.get(lic.organizationId) ?? [];
    arr.push(lic);
    licencesByOrg.set(lic.organizationId, arr);
  }

  const now = new Date();

  return {
    stats: {
      organizations: orgRows.length,
      users: userCount,
      games: gameRows.length,
      competitions: competitionCount,
    },
    organizations: orgRows
      .map((org) => {
        const members = memberRows.filter((m) => m.organizationId === org.id);
        const teachers = members.filter((m) => m.role !== "student").length;
        const orgLicRows = licencesByOrg.get(org.id) ?? [];
        const licences: OrgLicence[] = orgLicRows.map((r) => ({
          id: r.id,
          label: r.label,
          startsAt: r.startsAt,
          endsAt: r.endsAt,
          maxTeachers: r.maxTeachers,
          reference: r.reference,
          amountCents: r.amountCents,
        }));

        let licence: LicenceStatus;
        if (orgLicRows.length === 0) {
          licence = { state: "libre", licence: null, teachers, daysLeft: null, blocking: null };
        } else {
          const courante =
            orgLicRows.find((r) => r.startsAt <= now && now <= r.endsAt) ?? orgLicRows[0]!;
          const lic: OrgLicence = {
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
            licence = {
              state: "a_venir",
              licence: lic,
              teachers,
              daysLeft,
              blocking: `La licence « ${courante.label} » ne commence que le ${courante.startsAt.toLocaleDateString("fr-FR")}.`,
            };
          } else if (now > courante.endsAt) {
            licence = {
              state: "expiree",
              licence: lic,
              teachers,
              daysLeft,
              blocking: `La licence « ${courante.label} » a expiré le ${courante.endsAt.toLocaleDateString("fr-FR")}. Les parties en cours se terminent normalement ; le renouvellement rouvre la création.`,
            };
          } else if (courante.maxTeachers !== null && teachers > courante.maxTeachers) {
            licence = {
              state: "active",
              licence: lic,
              teachers,
              daysLeft,
              blocking: `La licence couvre ${courante.maxTeachers} enseignants et l'établissement en compte ${teachers}.`,
            };
          } else {
            licence = {
              state: daysLeft <= ALERTE_JOURS ? "bientot_expiree" : "active",
              licence: lic,
              teachers,
              daysLeft,
              blocking: null,
            };
          }
        }

        return {
          organizationId: org.id,
          name: org.name,
          kind: org.kind,
          members: members.length,
          teachers,
          games: gameRows.filter((g) => g.organizationId === org.id).length,
          adminInvites: inviteRows
            .filter((inv) => inv.organizationId === org.id && inv.role === "org_admin")
            .map((inv) => ({ id: inv.id, code: inv.code, active: inv.active })),
          licence,
          licences,
        };
      })
      .sort((a, b) => b.games - a.games),
    config: await getPlatformConfig(),
  };
}

/** Crée un établissement et son premier code d'invitation admin. */
export async function createEstablishment(args: {
  adminId: string;
  name: string;
}): Promise<{ organizationId: string; adminInviteCode: string }> {
  await requirePlatformAdmin(args.adminId);
  const inserted = await db
    .insert(organizations)
    .values({
      name: args.name.trim() || "Nouvel établissement",
      slug: `org-${makeCode(8).toLowerCase()}`,
      kind: "school",
    })
    .returning({ id: organizations.id });
  const organizationId = inserted[0]!.id;
  const adminInviteCode = await createInvite({
    organizationId,
    role: "org_admin",
    createdBy: args.adminId,
  });
  return { organizationId, adminInviteCode };
}

// ---------------------------------------------------------------------------
// Vue admin d'établissement
// ---------------------------------------------------------------------------

export interface OrgDashboard {
  organizationId: string;
  name: string;
  stats: { teachers: number; students: number; games: number; competitions: number };
  teacherInvites: { id: string; code: string; active: boolean }[];
  /** Ce que l'établissement a acheté, et ce qu'il lui reste. */
  licence: LicenceStatus;
  teachers: { userId: string; name: string; email: string; role: string; games: number }[];
  games: { gameId: string; joinCode: string | null; status: string; createdBy: string; createdAt: Date }[];
  competitions: { competitionId: string; name: string; status: string; createdAt: Date }[];
}

export async function getOrgDashboard(userId: string): Promise<OrgDashboard> {
  const { organizationId, name } = await requireOrgAdmin(userId);
  const licence = await getLicenceStatus(organizationId);
  const [memberRows, gameRows, competitionRows, inviteRows] = await Promise.all([
    db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        name: users.displayName,
        email: users.email,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, organizationId)),
    db
      .select()
      .from(games)
      .where(eq(games.organizationId, organizationId))
      .orderBy(desc(games.createdAt)),
    db
      .select()
      .from(competitions)
      .where(eq(competitions.organizationId, organizationId))
      .orderBy(desc(competitions.createdAt)),
    db.select().from(orgInvites).where(eq(orgInvites.organizationId, organizationId)),
  ]);

  // effectif élèves : joueurs distincts des parties de l'établissement
  const teamRows = gameRows.length
    ? await db
        .select({ id: teams.id })
        .from(teams)
        .where(inArray(teams.gameId, gameRows.map((g) => g.id)))
    : [];
  const playerRows = teamRows.length
    ? await db
        .select({ userId: players.userId })
        .from(players)
        .where(inArray(players.teamId, teamRows.map((t) => t.id)))
    : [];
  const staffIds = new Set(memberRows.map((m) => m.userId));
  const studentIds = new Set(playerRows.map((p) => p.userId).filter((id) => !staffIds.has(id)));

  const staff = memberRows.filter((m) => m.role !== "student");
  return {
    organizationId,
    name,
    stats: {
      teachers: staff.length,
      students: studentIds.size,
      games: gameRows.length,
      competitions: competitionRows.length,
    },
    licence,
    teacherInvites: inviteRows
      .filter((i) => i.role === "teacher")
      .map((i) => ({ id: i.id, code: i.code, active: i.active })),
    teachers: staff.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
      games: gameRows.filter((g) => g.createdBy === m.userId).length,
    })),
    games: gameRows.slice(0, 25).map((g) => ({
      gameId: g.id,
      joinCode: g.joinCode,
      status: g.status,
      createdBy: memberRows.find((m) => m.userId === g.createdBy)?.name ?? "?",
      createdAt: g.createdAt,
    })),
    competitions: competitionRows.map((c) => ({
      competitionId: c.id,
      name: c.name,
      status: c.status,
      createdAt: c.createdAt,
    })),
  };
}

export async function renameOrganization(userId: string, name: string): Promise<void> {
  const { organizationId } = await requireOrgAdmin(userId);
  await db
    .update(organizations)
    .set({ name: name.trim() || "Établissement" })
    .where(eq(organizations.id, organizationId));
}
