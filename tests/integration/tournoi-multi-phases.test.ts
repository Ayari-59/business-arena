import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * UN TOURNOI À TROIS PHASES, DE BOUT EN BOUT.
 *
 * Le concours n'allait qu'en deux temps : des poules, puis la finale. Un
 * tournoi de campus en veut trois — préliminaires, demi-finales, finale — et
 * rien n'obligeait la table des phases à s'arrêter à deux. Ce parcours joue
 * huit équipes jusqu'au podium en passant par une phase intermédiaire, et
 * vérifie qu'à chaque tour les éliminées le sont et les survivantes retirées
 * au sort.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { competitionEntries, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import { closeCurrentRound, submitTeamDecisions } from "@/services/game.service";
import {
  createCompetition,
  finishCompetition,
  getCompetitionView,
  joinCompetition,
  startFinal,
  startIntermediateStage,
  startQualification,
} from "@/services/competition.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

const EQUIPES = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel"];

let organizerId: string;
let competitionId: string;
const joueurs: string[] = [];

/** Joue jusqu'au bout toutes les parties de la phase en cours. */
async function jouerLaPhase(): Promise<void> {
  const view = await getCompetitionView(competitionId);
  const phase = view!.stages.find((s) => s.status === "running")!;
  for (const g of phase.games) {
    for (let tour = 1; tour <= g.roundsCount; tour++) {
      for (const userId of joueurs) {
        await submitTeamDecisions({ gameId: g.gameId, userId, payload: DECISIONS }).catch(() => {
          /* joueur absent de cette partie */
        });
      }
      await closeCurrentRound({ gameId: g.gameId, teacherId: organizerId });
    }
  }
}

async function statuts(): Promise<Record<string, number>> {
  const entries = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.competitionId, competitionId));
  return entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
}

beforeAll(async () => {
  const result = await registerTeacher({
    email: "orga@tournoi.fr",
    password: "motdepasse!",
    displayName: "Mme Martin",
    schoolName: "IUT GEA",
  });
  if ("error" in result) throw new Error(result.error);
  organizerId = result.userId;
  const created = await createCompetition({
    organizerId,
    organizationId: (await getTeacherOrgId(organizerId))!,
    name: "Tournoi du campus",
    periodicity: "quarter",
    groupSize: 2,
    advancePerGroup: 1,
  });
  competitionId = created.competitionId;
  for (const equipe of EQUIPES) {
    const inserted = await db
      .insert(users)
      .values({ email: `${equipe.toLowerCase()}@tournoi.local`, displayName: equipe })
      .returning({ id: users.id });
    const userId = inserted[0]!.id;
    joueurs.push(userId);
    await joinCompetition({ code: created.joinCode, userId, teamLabel: equipe });
  }
});

describe("préliminaires, demi-finales, finale", () => {
  it("les préliminaires tirent quatre poules de deux", async () => {
    const { groups } = await startQualification({ competitionId, organizerId });
    expect(groups).toBe(4);
    await jouerLaPhase();
  });

  it("la phase intermédiaire retire au sort les quatre qualifiées", async () => {
    const avant = await getCompetitionView(competitionId);
    const poulesPreliminaires = avant!.stages[0]!.games.map((g) =>
      g.standings.map((s) => s.entryId).sort(),
    );

    const { groups, survivors } = await startIntermediateStage({
      competitionId,
      organizerId,
      groupSize: 2,
      advancePerGroup: 1,
      nom: "Demi-finales",
    });
    expect(groups).toBe(2);
    expect(survivors).toHaveLength(4);
    // Une seule équipe sort de chaque poule préliminaire.
    for (const poule of poulesPreliminaires) {
      expect(poule.filter((label) => survivors.includes(label))).toHaveLength(1);
    }
    expect(await statuts()).toEqual({ active: 4, eliminated: 4 });

    const view = await getCompetitionView(competitionId);
    expect(view!.stages[0]!.status).toBe("finished");
    const demi = view!.stages[1]!;
    expect(demi.index).toBe(2);
    expect(demi.kind).toBe("semifinal");
    expect(demi.format).toMatchObject({ teamsPerGame: 2, advanceCount: 1, nom: "Demi-finales" });
    expect(demi.status).toBe("running");
    expect(demi.games).toHaveLength(2);
    await jouerLaPhase();
  });

  it("la finale n'oppose que les deux rescapées des demi-finales", async () => {
    const avant = await getCompetitionView(competitionId);
    const poulesDemi = avant!.stages[1]!.games.map((g) => g.standings.map((s) => s.entryId).sort());

    const { finalists } = await startFinal({ competitionId, organizerId });
    expect(finalists).toHaveLength(2);
    for (const poule of poulesDemi) {
      expect(poule.filter((label) => finalists.includes(label))).toHaveLength(1);
    }
    expect(await statuts()).toEqual({ active: 2, eliminated: 6 });

    const view = await getCompetitionView(competitionId);
    const finale = view!.stages[2]!;
    expect(finale.kind).toBe("final");
    expect(finale.index).toBe(3);
    expect(view!.stages[1]!.status).toBe("finished");
    await jouerLaPhase();
  });

  it("une quatrième phase est refusée : la finale ne se prolonge pas", async () => {
    await expect(
      startIntermediateStage({
        competitionId,
        organizerId,
        groupSize: 2,
        advancePerGroup: 1,
      }),
    ).rejects.toThrow(/finale/i);
  });

  it("le concours se clôt sur le podium des deux finalistes", async () => {
    const { podium } = await finishCompetition({ competitionId, organizerId });
    expect(podium).toHaveLength(2);
    const view = await getCompetitionView(competitionId);
    expect(view!.status).toBe("finished");
    expect(view!.stages).toHaveLength(3);
    expect(await statuts()).toEqual({ winner: 1, eliminated: 7 });
  });
});
