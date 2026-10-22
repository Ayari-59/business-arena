import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, desc, eq } from "drizzle-orm";

/**
 * UNE PARTIE DE DOUZE TOURS, DE BOUT EN BOUT (décision du propriétaire : au trimestre,
 * jusqu'à douze tours ; au-delà des tours écrits, des tours de gestion).
 *
 * Créée par le vrai pipeline, jouée jusqu'au bout, close et classée : douze tours en
 * base, « Le grand oral » au douzième et non au sixième, et le rejeu du bilan qui la
 * retrouve au centime (il recompose le monde prolongé comme la création). Puis son
 * verdict « mérite ou chance ».
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { companyStates, gameRankings, games, rounds, situationInstances, situations, teams, users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { TOURS_MAX_AU_TRIMESTRE } from "@/config/scenarios/rounds";
import { MOIS_MAX, MOIS_PAR_DEFAUT } from "@/config/scenarios/calendrier-mensuel";
import { scenarioByCode } from "@/config/scenarios/registry";
import { neutralDecisions } from "@/engine/bots";
import type { CompanyState } from "@/engine/types";
import { rejouer } from "@/pedagogy/merite/rejeu";
import { ecartAvecLaPartie, lirePartieARejouer, meriteDeLaPartie, type PartieLue } from "@/services/merite.service";
import { placerSousLicence } from "./helpers/licence";

let userId: string;

beforeAll(async () => {
  userId = (
    await db.insert(users).values({ email: "partie-longue@test.local", displayName: "Joueur" }).returning({ id: users.id })
  )[0]!.id;
  await placerSousLicence(userId);
});

async function jouerJusquauBout(gameId: string): Promise<number> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  const scenario = parseScenarioConfig(game!.scenarioSnapshot);
  const [equipe] = await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  for (let tour = 1; tour <= scenario.roundsCount; tour += 1) {
    const [etat] = await db
      .select()
      .from(companyStates)
      .where(eq(companyStates.teamId, equipe!.id))
      .orderBy(desc(companyStates.roundIndex))
      .limit(1);
    const decisions = neutralDecisions({ scenario, state: etat!.state as CompanyState, roundIndex: tour });
    await resolveCurrentRound({ gameId, userId, playerDecisions: { ...decisions, finance: { newLoan: 0, loanRepayment: 0 } } });
  }
  return scenario.roundsCount;
}

describe("une partie de NOVA en douze tours, au trimestre", () => {
  let gameId: string;

  beforeAll(async () => {
    gameId = await createSoloGame(userId, "quarter", 3, 3, true, "nova", TOURS_MAX_AU_TRIMESTRE);
  }, 60_000);

  it("se joue jusqu'au bout : douze tours en base, une partie close et classée", async () => {
    expect(await jouerJusquauBout(gameId)).toBe(TOURS_MAX_AU_TRIMESTRE);
    const tours = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    expect(tours).toHaveLength(TOURS_MAX_AU_TRIMESTRE);
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    expect(game!.status).toBe("finished");
    const classement = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
    expect(classement.length).toBeGreaterThan(0);
    for (const r of classement) {
      const detail = r.detail as { roundBpis: number[] };
      expect(detail.roundBpis).toHaveLength(TOURS_MAX_AU_TRIMESTRE);
    }
  }, 240_000);

  it("« Le grand oral » s'ouvre au douzième tour, pas au sixième ; les autres situations écrites, à leur tour", async () => {
    const ouvertes = await db
      .select({ code: situations.code, tour: rounds.index })
      .from(situationInstances)
      .innerJoin(situations, eq(situations.id, situationInstances.situationId))
      .innerJoin(rounds, eq(rounds.id, situationInstances.roundId))
      .where(and(eq(rounds.gameId, gameId), eq(situationInstances.origin, "scripted")));
    const oral = scenarioByCode("nova").situations.find((s) => "round" in s.trigger && s.trigger.finDePartie)!;
    expect(ouvertes.filter((o) => o.code === oral.code).map((o) => o.tour)).toEqual([TOURS_MAX_AU_TRIMESTRE]);
    // Après les tours écrits, aucune situation à tour fixe d'autre que lui.
    const ecrits = scenarioByCode("nova").scenario.roundsCount;
    expect(ouvertes.filter((o) => o.tour > ecrits && o.code !== oral.code)).toEqual([]);
  });

  it("le rejeu du bilan la retrouve au centime, puis le verdict tombe", async () => {
    const lue = (await lirePartieARejouer(gameId)) as PartieLue;
    expect(typeof lue, String(lue)).toBe("object");
    expect(ecartAvecLaPartie(lue, rejouer(lue.partie, lue.partie.graine))).toBeNull();
    const m = await meriteDeLaPartie(gameId);
    expect(m.etat).toBe("verdict");
  }, 600_000);
});

describe("au-delà de ce que la périodicité permet : refusée avec la raison", () => {
  it("à l'année, douze tours", async () => {
    await expect(createSoloGame(userId, "year", 3, 3, true, "nova", TOURS_MAX_AU_TRIMESTRE)).rejects.toThrow(
      /seul le trimestre/,
    );
  });
  it(`au mois, ${MOIS_MAX + 1} mois`, async () => {
    await expect(createSoloGame(userId, "month", 3, 3, true, "nova", MOIS_MAX + 1)).rejects.toThrow(
      new RegExp(`${MOIS_MAX} mois au plus`),
    );
  });
});

/** Les situations à tour fixe ouvertes dans la partie : code et tour. */
async function situationsEcrites(gameId: string): Promise<{ code: string; tour: number }[]> {
  return db
    .select({ code: situations.code, tour: rounds.index })
    .from(situationInstances)
    .innerJoin(situations, eq(situations.id, situationInstances.situationId))
    .innerJoin(rounds, eq(rounds.id, situationInstances.roundId))
    .where(and(eq(rounds.gameId, gameId), eq(situationInstances.origin, "scripted")));
}

describe("une partie au mois, sur le calendrier", () => {
  it(`le bistrot sans autre choix : ${MOIS_PAR_DEFAUT} mois depuis janvier, une situation au premier mois de chaque trimestre, rejeu au centime`, async () => {
    const gameId = await createSoloGame(userId, "month", 3, 3, true, "bistrot");
    expect(await jouerJusquauBout(gameId)).toBe(MOIS_PAR_DEFAUT);
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    expect(game!.status).toBe("finished");
    expect((game!.scenarioSnapshot as { moisDeDepart?: number }).moisDeDepart).toBe(1);
    const ouvertes = await situationsEcrites(gameId);
    expect([...new Set(ouvertes.map((o) => o.tour))].sort((a, b) => a - b)).toEqual([1, 4, 7, 10]);
    const lue = (await lirePartieARejouer(gameId)) as PartieLue;
    expect(typeof lue, String(lue)).toBe("object");
    expect(lue.mondeRetire).toBe(true);
    expect(ecartAvecLaPartie(lue, rejouer(lue.partie, lue.partie.graine))).toBeNull();
    expect((await meriteDeLaPartie(gameId)).etat).toBe("verdict");
  }, 600_000);

  it("le bistrot de juin à novembre : les trimestres 2, 3 et 4 en juin, juillet et octobre ; la flambée des denrées en juillet, trois mois", async () => {
    const gameId = await createSoloGame(userId, "month", 3, 3, false, "bistrot", 6, null, { moisDeDepart: 6 });
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    const scenario = parseScenarioConfig(game!.scenarioSnapshot);
    expect(scenario.roundsCount).toBe(6);
    const flambee = scenario.scriptedEvents.find((s) => s.eventCode === "bistrot_matieres_premieres")!;
    expect(flambee.round).toBe(2);
    expect(scenario.events.find((e) => e.code === "bistrot_matieres_premieres")!.duration).toBe(
      3 * scenarioByCode("bistrot").scenario.events.find((e) => e.code === "bistrot_matieres_premieres")!.duration,
    );
    await jouerJusquauBout(gameId);
    const ouvertes = await situationsEcrites(gameId);
    expect([...new Set(ouvertes.map((o) => o.tour))].sort((a, b) => a - b)).toEqual([1, 2, 5]);
  }, 600_000);
});
