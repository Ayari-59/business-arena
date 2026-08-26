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
import { competitionEntries, games, organizations, rounds, situationInstances, users } from "@/db/schema";
import { DEMO_ACCOUNTS, isDemoSeeded, seedDemoWorld } from "@/services/demo.service";
import { loginTeacher } from "@/services/auth.service";
import { getOrgDashboard } from "@/services/admin.service";
import { getTeacherGameView, getTeacherGames } from "@/services/game.service";
import { getTeacherPedagogyView } from "@/services/pedagogy.service";

describe("monde démo", () => {
  it("se génère complet : comptes, partie avancée, pédagogie, concours", async () => {
    expect(await isDemoSeeded()).toBe(false);
    const world = await seedDemoWorld();
    expect(world.created).toBe(true);
    expect(world.gameJoinCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(world.competitionJoinCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(await isDemoSeeded()).toBe(true);

    // les deux comptes se connectent avec le mot de passe démo
    const direction = await loginTeacher({
      email: DEMO_ACCOUNTS.orgAdmin.email,
      password: DEMO_ACCOUNTS.password,
    });
    const prof = await loginTeacher({
      email: DEMO_ACCOUNTS.teacher.email,
      password: DEMO_ACCOUNTS.password,
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
});
