import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA MAÎTRISE DES NOTIONS SE MESURE, ELLE NE S'EXPOSE PAS.
 *
 * Constaté en production (P4, E2) : « Maîtrise des notions » affichait 2 puis
 * 1 sans qu'aucun élève ait répondu. Au débriefing, une ligne de progression
 * était créée pour chaque membre et chaque notion, réponse ou non, et la
 * barre avait un plancher de 3 %.
 *
 * Ici, sur base réelle : une équipe répond, l'autre non. Après clôture, seul
 * l'élève qui a répondu a des lignes de progression, et seulement sur les
 * notions de sa situation ; la vue enseignant sépare ce qui est exposé de ce
 * qui est mesuré.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { concepts, learningProgress, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { closeCurrentRound, createClassGame, joinGameByCode } from "@/services/game.service";
import {
  getTeacherPedagogyView,
  getTeamSituations,
  submitDiagnosis,
} from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";

let prof: string;
let gameId: string;
let repondant: string;
let muet: string;
let notionsDeLaSituation: string[] = [];

beforeAll(async () => {
  const r = await registerTeacher({
    email: "notions@lycee.test",
    password: "motdepasse!",
    displayName: "M. Notions",
    schoolName: "Lycée des Notions",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: (await getTeacherOrgId(prof))!,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 0,
  });
  gameId = partie.gameId;

  const inserted = await db
    .insert(users)
    .values([
      { email: "repond@test.local", displayName: "Élève qui répond" },
      { email: "muet@test.local", displayName: "Élève muet" },
    ])
    .returning({ id: users.id });
  repondant = inserted[0]!.id;
  muet = inserted[1]!.id;
  for (const id of [repondant, muet]) {
    const j = await joinGameByCode({ code: partie.joinCode, userId: id });
    if ("error" in j) throw new Error(j.error);
  }
});

describe("avant tout débriefing", () => {
  it("la vue enseignant expose les notions du tour, et ne mesure rien", async () => {
    const vue = (await getTeacherPedagogyView(gameId, prof))!;
    expect(vue.conceptsExposed.length).toBeGreaterThan(0);
    expect(vue.conceptMastery).toEqual([]);
  });
});

describe("après clôture, une équipe ayant répondu et l'autre non", () => {
  beforeAll(async () => {
    const { current } = await getTeamSituations(gameId, repondant);
    const def = situationByCode.get(current[0]!.code)!;
    notionsDeLaSituation = def.conceptCodes;
    await submitDiagnosis({
      instanceId: current[0]!.instanceId,
      userId: repondant,
      selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
    });
    await closeCurrentRound({ gameId, teacherId: prof });
  });

  it("l'élève muet n'a aucune ligne de progression", async () => {
    const lignes = await db.select().from(learningProgress).where(eq(learningProgress.userId, muet));
    expect(lignes).toEqual([]);
  });

  it("l'élève qui a répondu en a une par notion de sa situation, et pas d'autre", async () => {
    const lignes = await db
      .select({ conceptId: learningProgress.conceptId })
      .from(learningProgress)
      .where(eq(learningProgress.userId, repondant));
    const codes = await db.select({ id: concepts.id, code: concepts.code }).from(concepts);
    const codeById = new Map(codes.map((c) => [c.id, c.code]));
    const mesurees = lignes.map((l) => codeById.get(l.conceptId)).sort();
    const attendues = [...notionsDeLaSituation].filter((c) => codeById.size && codes.some((x) => x.code === c)).sort();
    expect(mesurees).toEqual(attendues);
  });

  it("la vue enseignant ne mesure que ces notions, pour un seul élève", async () => {
    const vue = (await getTeacherPedagogyView(gameId, prof))!;
    expect(vue.conceptMastery.length).toBe(notionsDeLaSituation.length);
    for (const c of vue.conceptMastery) {
      expect(notionsDeLaSituation).toContain(c.code);
      expect(c.students).toBe(1);
    }
  });
});

describe("l'affichage enseignant", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "app", "teacher", "games", "[gameId]", "page.tsx"),
    "utf8",
  );

  it("sépare « Notions exposées ce tour » et « Maîtrise mesurée », sans plancher visuel", () => {
    expect(source).toContain("Notions exposées ce tour");
    expect(source).toContain("Maîtrise mesurée");
    expect(source).toContain("Aucune situation rendue");
    expect(source).not.toContain("Math.max(3,");
  });
});
