import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Deux clôtures du même tour n'en font qu'une.
 *
 * Un double clic (ou un rejeu après un délai réseau) envoyait deux fois le
 * formulaire « Clore le tour ». La seconde requête arrivait après que la
 * première avait ouvert le tour suivant, et le clôturait à son tour : deux
 * tours simulés pour un seul geste, sans décision des élèves.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, rounds } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { closeCurrentRound, createClassGame } from "@/services/game.service";

let teacherId: string;
let orgId: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "double@lycee.test",
    password: "motdepasse!",
    displayName: "M. Double",
    schoolName: "Lycée du Double Clic",
  });
  if ("error" in r) throw new Error(r.error);
  teacherId = r.userId;
  orgId = (await getTeacherOrgId(teacherId))!;
});

async function tourCourant(gameId: string): Promise<number> {
  return (await db.select().from(games).where(eq(games.id, gameId)))[0]!.currentRound;
}

describe("clôture idempotente", () => {
  it("le second envoi pour le même tour ne simule rien de plus", async () => {
    const { gameId } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      scenarioCode: "conseil",
    });
    expect(await tourCourant(gameId)).toBe(1);

    const premiere = await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    expect(premiere).toMatchObject({ roundIndex: 1, finished: false, alreadyClosed: false });
    expect(await tourCourant(gameId)).toBe(2);

    // Le même formulaire, renvoyé : il vise le tour 1, déjà clos.
    const seconde = await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    expect(seconde).toMatchObject({ roundIndex: 1, alreadyClosed: true });
    expect(await tourCourant(gameId)).toBe(2);

    const tour2 = (
      await db.select().from(rounds).where(eq(rounds.gameId, gameId))
    ).find((r) => r.index === 2)!;
    expect(tour2.status).toBe("open");
  });

  it("sans tour attendu, la clôture avance comme avant", async () => {
    const { gameId } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      scenarioCode: "conseil",
    });
    const r = await closeCurrentRound({ gameId, teacherId });
    expect(r).toMatchObject({ roundIndex: 1, alreadyClosed: false });
    expect(await tourCourant(gameId)).toBe(2);
  });

  it("un tour attendu inexistant est refusé", async () => {
    const { gameId } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      scenarioCode: "conseil",
    });
    await expect(closeCurrentRound({ gameId, teacherId, expectedRound: 99 })).rejects.toThrow(
      /Tour introuvable/,
    );
  });
});
