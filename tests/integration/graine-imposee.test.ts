import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * LA GRAINE IMPOSÉE, ET CE QU'ELLE PROTÈGE.
 *
 * Toutes les parties réelles tirent leur graine au hasard, et c'est ce qu'on
 * veut : deux classes ne vivent pas la même partie. Le monde de démonstration
 * est l'exception, pour une raison pratique — une prise vidéo ratée doit se
 * refaire à l'identique, et une capture de documentation ne doit pas vieillir
 * au premier reseed.
 *
 * Deux gardes, donc : la graine imposée est bien celle qui est écrite, et
 * l'absence de graine reste un tirage.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { createClassGame } from "@/services/game.service";

let teacherId: string;
let orgId: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "graine@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Graine",
    schoolName: "Lycée de la Reprise",
  });
  if ("error" in r) throw new Error(r.error);
  teacherId = r.userId;
  orgId = (await getTeacherOrgId(teacherId))!;
});

const graineDe = async (gameId: string) =>
  Number((await db.select({ seed: games.seed }).from(games).where(eq(games.id, gameId)))[0]!.seed);

const creer = (seed?: number) =>
  createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    variableWorld: false,
    scenarioCode: "nova",
    seed,
  });

describe("la graine d'une partie", () => {
  it("est celle qu'on impose, deux fois de suite", async () => {
    const a = await creer(20_250_921);
    const b = await creer(20_250_921);
    expect(await graineDe(a.gameId)).toBe(20_250_921);
    expect(await graineDe(b.gameId)).toBe(20_250_921);
  });

  it("reste tirée au hasard quand personne ne l'impose", async () => {
    // C'est le cas de toutes les parties réelles : deux classes ne doivent pas
    // vivre la même partie parce qu'on a ajouté une option pour la démo.
    const graines = new Set<number>();
    for (let i = 0; i < 4; i++) graines.add(await graineDe((await creer()).gameId));
    expect(graines.size).toBeGreaterThan(1);
  });

  it("le monde démo l'impose, et fige aussi le monde et le secteur", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/services/demo.service.ts", "utf8");
    expect(source).toContain("seed: GRAINE_DEMO");
    // Sans ces deux-là, la graine ne suffit pas : la conjoncture varierait, et
    // un changement de scénario par défaut déplacerait le monde démo.
    expect(source).toContain("variableWorld: false");
    expect(source).toContain("scenarioCode: SCENARIO_DEMO");
  });
});
