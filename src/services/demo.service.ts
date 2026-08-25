import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers, organizations, users } from "@/db/schema";
import {
  closeCurrentRound,
  createClassGame,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import {
  chooseModel,
  getTeamSituations,
  submitDiagnosis,
  unlockHint,
} from "@/services/pedagogy.service";
import { createCompetition, joinCompetition } from "@/services/competition.service";
import { createInvite } from "@/services/admin.service";
import { situationByCode } from "@/config/scenarios/nova/situations";
import type { RoundDecisions } from "@/engine/types";

/**
 * Monde démo : un établissement complet et VIVANT pour présenter le produit —
 * direction, enseignant, partie de classe jouée sur 3 tours (avec diagnostics,
 * choix de modèles et indices pour une équipe : les vues pédagogiques et le
 * BPI ont des données), concours prêt à lancer. Idempotent : ne recrée rien
 * si le compte direction existe déjà.
 *
 * L'admin GÉNÉRAL n'a volontairement pas de compte démo : ce rôle contrôle
 * les réglages globaux — il reste réservé aux e-mails d'ADMIN_EMAILS.
 */

export const DEMO_ACCOUNTS = {
  orgAdmin: { email: "direction@demo.business-arena.fr", name: "Mme Direction (démo)" },
  teacher: { email: "prof@demo.business-arena.fr", name: "M. Professeur (démo)" },
  password: "Demo2026!",
} as const;

const DEMO_ORG_NAME = "Lycée Démo Business Arena";

const STUDENTS = [
  { email: "lea@demo.business-arena.fr", name: "Léa (démo)" },
  { email: "hugo@demo.business-arena.fr", name: "Hugo (démo)" },
  { email: "ines@demo.business-arena.fr", name: "Inès (démo)" },
  { email: "sam@demo.business-arena.fr", name: "Sam (démo)" },
] as const;

/** Décisions par équipe : trois styles contrastés pour un classement lisible. */
const TEAM_DECISIONS: RoundDecisions[] = [
  { price: 59, productionPlan: 5200, marketingBudget: 6000, qualityBudget: 3000, maintenanceBudget: 4000 },
  { price: 52, productionPlan: 6500, marketingBudget: 10000, qualityBudget: 0, maintenanceBudget: 4000 },
  { price: 76, productionPlan: 3500, marketingBudget: 5000, qualityBudget: 9000, maintenanceBudget: 4000 },
];

async function ensureUser(email: string, displayName: string, passwordHash: string): Promise<string> {
  const existing = (await db.select().from(users).where(eq(users.email, email)))[0];
  if (existing) return existing.id;
  const inserted = await db
    .insert(users)
    .values({ email, displayName, passwordHash })
    .returning({ id: users.id });
  return inserted[0]!.id;
}

export interface DemoWorld {
  created: boolean;
  organizationId: string;
  orgAdminEmail: string;
  teacherEmail: string;
  password: string;
  gameJoinCode: string | null;
  competitionJoinCode: string | null;
}

export async function isDemoSeeded(): Promise<boolean> {
  return (
    (await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_ACCOUNTS.orgAdmin.email)))
      .length > 0
  );
}

export async function seedDemoWorld(): Promise<DemoWorld> {
  // Idempotence : le monde démo existe déjà → ne rien dupliquer
  const already = (
    await db.select().from(users).where(eq(users.email, DEMO_ACCOUNTS.orgAdmin.email))
  )[0];
  if (already) {
    const membership = (
      await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, already.id))
    )[0];
    return {
      created: false,
      organizationId: membership?.organizationId ?? "",
      orgAdminEmail: DEMO_ACCOUNTS.orgAdmin.email,
      teacherEmail: DEMO_ACCOUNTS.teacher.email,
      password: DEMO_ACCOUNTS.password,
      gameJoinCode: null,
      competitionJoinCode: null,
    };
  }

  const passwordHash = await bcrypt.hash(DEMO_ACCOUNTS.password, 10);

  // Établissement + personnel (création directe : indépendant des réglages
  // d'inscription de la plateforme)
  const org = await db
    .insert(organizations)
    .values({ name: DEMO_ORG_NAME, slug: `demo-${Date.now().toString(36)}`, kind: "school" })
    .returning({ id: organizations.id });
  const organizationId = org[0]!.id;

  const orgAdminId = await ensureUser(
    DEMO_ACCOUNTS.orgAdmin.email,
    DEMO_ACCOUNTS.orgAdmin.name,
    passwordHash,
  );
  const teacherId = await ensureUser(
    DEMO_ACCOUNTS.teacher.email,
    DEMO_ACCOUNTS.teacher.name,
    passwordHash,
  );
  await db.insert(organizationMembers).values([
    { userId: orgAdminId, organizationId, role: "org_admin" },
    { userId: teacherId, organizationId, role: "teacher" },
  ]);
  await createInvite({ organizationId, role: "teacher", createdBy: orgAdminId });

  // Élèves (invités nommés, sans mot de passe)
  const studentIds: string[] = [];
  for (const s of STUDENTS) {
    studentIds.push(await ensureUser(s.email, s.name, passwordHash));
  }

  // Partie de classe : 3 équipes + 1 bot, 3 tours joués — le tour 4 (la crise
  // de trésorerie) est le prochain : parfait pour une démonstration en direct
  const { gameId, joinCode } = await createClassGame({
    teacherId,
    organizationId,
    periodicity: "quarter",
    humanTeamsCount: 3,
    botCount: 1,
  });
  for (const [i, studentId] of studentIds.entries()) {
    await joinGameByCode({ code: joinCode, userId: studentId, pseudo: STUDENTS[i]!.name });
  }

  for (let round = 1; round <= 3; round++) {
    // Léa (équipe 1) travaille les situations : diagnostics justes, modèle
    // pertinent, un indice — les vues pédagogiques ont de la matière
    const lea = studentIds[0]!;
    const { current } = await getTeamSituations(gameId, lea);
    for (const situation of current) {
      const def = situationByCode.get(situation.code);
      if (!def) continue;
      await unlockHint({ instanceId: situation.instanceId, userId: lea }).catch(() => {});
      await submitDiagnosis({
        instanceId: situation.instanceId,
        userId: lea,
        selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
        freeText: "Analyse de l'équipe : nous relions les chiffres du tableau de bord au concept en jeu.",
      }).catch(() => {});
      const optimal = Object.entries(def.modelRelevance).find(([, r]) => r === "optimal")?.[0];
      if (optimal) {
        await chooseModel({
          instanceId: situation.instanceId,
          userId: lea,
          modelCode: optimal,
          justification: "Ce modèle répond directement au problème posé par la situation.",
        }).catch(() => {});
      }
    }

    // Décisions des trois équipes (styles contrastés), puis clôture
    for (const [teamIndex, studentId] of [studentIds[0]!, studentIds[1]!, studentIds[2]!].entries()) {
      await submitTeamDecisions({
        gameId,
        userId: studentId,
        payload: TEAM_DECISIONS[teamIndex]!,
      }).catch(() => {});
    }
    await closeCurrentRound({ gameId, teacherId });
  }

  // Concours en phase d'inscriptions : la démo peut lancer le tirage en direct
  const competition = await createCompetition({
    organizerId: teacherId,
    organizationId,
    name: "Championship de démonstration",
    periodicity: "quarter",
    groupSize: 2,
    advancePerGroup: 1,
  });
  const entryLabels = ["Les Requins du BFR", "Marge Attack", "Cash Machine", "Seuil & Fils"];
  for (const [i, studentId] of studentIds.entries()) {
    await joinCompetition({
      code: competition.joinCode,
      userId: studentId,
      teamLabel: entryLabels[i]!,
    });
  }

  return {
    created: true,
    organizationId,
    orgAdminEmail: DEMO_ACCOUNTS.orgAdmin.email,
    teacherEmail: DEMO_ACCOUNTS.teacher.email,
    password: DEMO_ACCOUNTS.password,
    gameJoinCode: joinCode,
    competitionJoinCode: competition.joinCode,
  };
}
