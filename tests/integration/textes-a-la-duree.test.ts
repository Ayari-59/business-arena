import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * LE TEXTE QUE L'ÉLÈVE LIT EST CELUI DE SA PARTIE, PAR LES SERVICES.
 *
 * La garde de config (tests/scenarios/textes-a-la-duree.test.ts) rend les
 * situations à chaque durée ; celle-ci vérifie que les chemins qui les servent
 * passent bien par ce rendu : la vue de l'équipe (récit, questions, options),
 * l'indice débloqué, et le référentiel semé, qui reste au trimestre parce
 * qu'une même ligne sert à toutes les durées.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, situations, users } from "@/db/schema";
import { createSoloGame, setQuizMode } from "@/services/game.service";
import { getTeamSituations, unlockHint } from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";
import type { Periodicity } from "@/config/scenarios/periodicity";

const parties: Partial<Record<Periodicity, string>> = {};
let userId: string;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ email: "duree@test.local", displayName: "Adhérente" })
    .returning({ id: users.id });
  userId = u!.id;
  for (const p of ["month", "quarter", "year"] as const) {
    const gameId = await createSoloGame(userId, p, 3, undefined, false, "fitness");
    const game = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
    await setQuizMode({ gameId, teacherId: game.createdBy, mode: "full" });
    parties[p] = gameId;
  }
});

const ouverture = async (p: Periodicity) => {
  const { current } = await getTeamSituations(parties[p]!, userId);
  const vue = current.find((s) => s.code === "fitness_t1_recurrent");
  expect(vue, p).toBeDefined();
  return vue!;
};

describe("VOLT FITNESS : la vue de l'équipe dit les montants de sa partie", () => {
  it("au mois, 35 € par mois et 30 € de marge, et plus un trimestre", async () => {
    const vue = await ouverture("month");
    expect(vue.narrative).toContain("1 600 adhérents qui paient 35 € par mois");
    expect(vue.quizQuestions.map((q) => q.prompt).join(" ")).toContain("Un abonnement à 35 € le mois coûte 5 € en variable");
    expect(vue.quizQuestions.flatMap((q) => q.options.map((o) => o.label))).toContain("30 € par mois, et autant à chaque mois où il reste");
    expect(JSON.stringify(vue)).not.toMatch(/trimestr|\{\{/);
  });

  it("à l'année, 420 € par an", async () => {
    const vue = await ouverture("year");
    expect(vue.narrative).toContain("1 600 adhérents qui paient 420 € par an");
    expect(JSON.stringify(vue)).not.toMatch(/trimestr|\{\{/);
  });

  it("au trimestre, le texte du registre, inchangé", async () => {
    const vue = await ouverture("quarter");
    const registre = situationByCode.get("fitness_t1_recurrent")!;
    expect(vue.narrative).toBe(registre.narrative);
    expect(vue.problem).toBe(registre.problem);
    expect(vue.narrative).toContain("105 € par trimestre");
  });
});

describe("l'indice se lit à la durée de la partie", () => {
  it("l'indice débloqué au mois dit 35 − 5 = 30 € par mois", async () => {
    const vue = await ouverture("month");
    const textes: string[] = [];
    for (let i = 0; i < 3; i++) textes.push((await unlockHint({ instanceId: vue.instanceId, userId })).text);
    expect(textes[2]).toBe("Chaque adhérent laisse 35 − 5 = 30 € par mois pour couvrir cette structure.");
  });
});

describe("le référentiel semé reste au trimestre", () => {
  it("une même ligne sert à toutes les durées : elle porte le texte du registre, sans jeton", async () => {
    const [ligne] = await db.select().from(situations).where(eq(situations.code, "fitness_t1_recurrent"));
    expect(ligne!.narrativeKey).toBe(situationByCode.get("fitness_t1_recurrent")!.narrative);
    expect(ligne!.narrativeKey).not.toContain("{{");
  });
});
