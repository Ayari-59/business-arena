import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Monde démo sur Postgres embarqué : génération complète, comptes
 * fonctionnels, partie jouée sur 3 tours avec matière pédagogique,
 * concours en inscriptions, idempotence.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import {
  competitionEntries,
  games,
  orgInvites,
  orgLicences,
  organizations,
  rounds,
  situationInstances,
  users,
} from "@/db/schema";
import {
  DEMO_ACCOUNTS,
  DEMO_REFUSEE_EN_PRODUCTION,
  PLAFOND_ENSEIGNANTS_DEMO,
  fermerLesComptesDeDemo,
  isDemoSeeded,
  renouvelerLeMotDePasseDeDemo,
  seedDemoWorld,
} from "@/services/demo.service";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loginTeacher } from "@/services/auth.service";
import { getOrgDashboard } from "@/services/admin.service";
import { getTeacherGameView, getTeacherGames } from "@/services/game.service";
import { getTeacherPedagogyView } from "@/services/pedagogy.service";

describe("monde démo", () => {
  it("est refusé en production, sauf drapeau explicite", async () => {
    await expect(seedDemoWorld({ NODE_ENV: "production" })).rejects.toThrow(DEMO_REFUSEE_EN_PRODUCTION);
    await expect(renouvelerLeMotDePasseDeDemo({ NODE_ENV: "production" })).rejects.toThrow(
      DEMO_REFUSEE_EN_PRODUCTION,
    );
    expect(await isDemoSeeded()).toBe(false);
  });

  it("aucun mot de passe n'est écrit dans le code de la démo", () => {
    const source = readFileSync(join(process.cwd(), "src/services/demo.service.ts"), "utf8");
    expect(source).not.toMatch(/password:\s*"/);
    expect(source).not.toMatch(/bcrypt\.hash\(\s*"/);
  });

  it("se génère complet : comptes, partie avancée, pédagogie, concours", async () => {
    expect(await isDemoSeeded()).toBe(false);
    const world = await seedDemoWorld();
    expect(world.created).toBe(true);
    expect(world.gameJoinCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(world.competitionJoinCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(await isDemoSeeded()).toBe(true);

    // les deux comptes se connectent avec le mot de passe démo
    expect(world.password).toMatch(/^[\w-]{24}$/);
    const direction = await loginTeacher({
      email: DEMO_ACCOUNTS.orgAdmin.email,
      password: world.password!,
    });
    const prof = await loginTeacher({
      email: DEMO_ACCOUNTS.teacher.email,
      password: world.password!,
    });
    expect("userId" in direction).toBe(true);
    expect("userId" in prof).toBe(true);
    const profId = (prof as { userId: string }).userId;
    const directionId = (direction as { userId: string }).userId;

    // tableau de bord de l'établissement : 2 personnels, 4 élèves, activité
    const dashboard = await getOrgDashboard(directionId);
    expect(dashboard.stats.teachers).toBe(2);
    expect(dashboard.stats.students).toBe(4);
    expect(dashboard.stats.games).toBe(1);
    expect(dashboard.stats.competitions).toBe(1);
    expect(dashboard.teacherInvites.length).toBeGreaterThanOrEqual(1);

    // la partie de classe : 3 tours résolus, tour courant = 4 (la crise)
    const teacherGames = await getTeacherGames(profId);
    expect(teacherGames).toHaveLength(1);
    const game = teacherGames[0]!;
    expect(game.currentRound).toBe(4);
    const view = await getTeacherGameView(game.gameId, profId);
    expect(view!.teams).toHaveLength(4); // 3 équipes + 1 bot
    expect(view!.ranking).toHaveLength(4);

    const resolvedRounds = await db.select().from(rounds).where(eq(rounds.gameId, game.gameId));
    expect(resolvedRounds.filter((r) => r.status === "resolved")).toHaveLength(3);

    // matière pédagogique : situations débriefées + maîtrise + QCM sans faute
    const instances = await db.select().from(situationInstances);
    expect(instances.filter((i) => i.status === "debriefed").length).toBeGreaterThanOrEqual(3);
    const pedagogy = await getTeacherPedagogyView(game.gameId, profId);
    expect(pedagogy!.conceptMastery.length).toBeGreaterThan(0);
    expect(pedagogy!.hintsUsedByTeam.some((t) => t.count > 0)).toBe(true);
    expect(pedagogy!.quizStats.submitted).toBeGreaterThan(0);
    expect(pedagogy!.quizStats.averageScore).toBe(1); // Léa répond juste partout

    // concours en inscriptions avec 4 équipes
    const entries = await db.select().from(competitionEntries);
    expect(entries).toHaveLength(4);
  }, 60_000);

  it("licence plafonnée, élèves sans mot de passe, mot de passe différent à chaque tirage", async () => {
    const licences = await db.select().from(orgLicences);
    expect(licences).toHaveLength(1);
    expect(licences[0]!.maxTeachers).toBe(PLAFOND_ENSEIGNANTS_DEMO);
    const eleves = (await db.select().from(users)).filter((u) => u.email.startsWith("lea@demo"));
    expect(eleves).toHaveLength(1);
    expect(eleves[0]!.passwordHash).toBeNull();
    const a = await renouvelerLeMotDePasseDeDemo();
    const b = await renouvelerLeMotDePasseDeDemo();
    expect(a).not.toBe(b);
    expect("userId" in (await loginTeacher({ email: DEMO_ACCOUNTS.teacher.email, password: b }))).toBe(true);
    expect("userId" in (await loginTeacher({ email: DEMO_ACCOUNTS.teacher.email, password: a }))).toBe(false);
  });

  it("est idempotent : un second appel ne duplique rien", async () => {
    const orgsBefore = (await db.select().from(organizations)).length;
    const usersBefore = (await db.select().from(users)).length;
    const gamesBefore = (await db.select().from(games)).length;
    const again = await seedDemoWorld();
    expect(again.created).toBe(false);
    expect((await db.select().from(organizations)).length).toBe(orgsBefore);
    expect((await db.select().from(users)).length).toBe(usersBefore);
    expect((await db.select().from(games)).length).toBe(gamesBefore);
  });

  it("se ferme : plus de connexion, codes d'invitation désactivés", async () => {
    const mdp = await renouvelerLeMotDePasseDeDemo();
    await fermerLesComptesDeDemo();
    const r = await loginTeacher({ email: DEMO_ACCOUNTS.orgAdmin.email, password: mdp, now: Date.now() + 86_400_000 });
    expect("userId" in r).toBe(false);
    const invites = await db.select().from(orgInvites);
    expect(invites.length).toBeGreaterThan(0);
    expect(invites.every((i) => !i.active)).toBe(true);
  });
});
