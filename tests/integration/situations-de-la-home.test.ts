import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, desc, eq } from "drizzle-orm";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { companyStates, games, roundResults, rounds, situationInstances, situations, teams, users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { neutralDecisions } from "@/engine/bots";
import type { CompanyState, EngineTrace, RoundDecisions } from "@/engine/types";
import { placerSousLicence } from "./helpers/licence";
import { ouvrirUnePartieDeNiveau7 } from "./helpers/partie-de-niveau-7";

/**
 * LES SITUATIONS DE NOVA HOME NE S'OUVRENT QUE LÀ OÙ LA HOME EXISTE.
 *
 * Le scénario NOVA gamme se joue des niveaux 4 à 6 ; seul le 7 ajoutait la
 * Home à la gamme. « Une quatrième enceinte ? » s'ouvre au tour 1 d'une partie
 * de niveau 7, jamais au niveau 6. « Sur le marché, la première » s'ouvre au
 * tour 4 à l'équipe dont la Home était en vente au tour 3, et à elle seule.
 *
 * Le niveau 7 est retiré du produit (décision du propriétaire, octobre 2026) :
 * les parties qui s'ouvrent ici sont celles qui existent déjà à ce niveau et
 * continuent de se jouer (`ouvrirUnePartieDeNiveau7`).
 */
const HOME = "nova-home";
let admin: string;

beforeAll(async () => {
  admin = (
    await db.insert(users).values({ email: "home-situations@test.local", displayName: "Administration", isPlatformAdmin: true }).returning({ id: users.id })
  )[0]!.id;
  await placerSousLicence(admin);
});

async function codesOuverts(gameId: string, tour: number): Promise<string[]> {
  const [r] = await db.select().from(rounds).where(and(eq(rounds.gameId, gameId), eq(rounds.index, tour)));
  if (!r) return [];
  const lignes = await db
    .select({ code: situations.code })
    .from(situationInstances)
    .innerJoin(situations, eq(situations.id, situationInstances.situationId))
    .where(eq(situationInstances.roundId, r.id));
  return lignes.map((l) => l.code);
}

async function jouer(gameId: string, tour: number, retouche?: (d: RoundDecisions) => void) {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  const scenario = parseScenarioConfig(game!.scenarioSnapshot);
  const [equipe] = await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  const [etat] = await db.select().from(companyStates).where(eq(companyStates.teamId, equipe!.id)).orderBy(desc(companyStates.roundIndex)).limit(1);
  const d = neutralDecisions({ scenario, state: etat!.state as CompanyState, roundIndex: tour });
  retouche?.(d);
  await resolveCurrentRound({ gameId, userId: admin, playerDecisions: d });
  return equipe!.id;
}

describe("les situations de NOVA Home", () => {
  it("au niveau 6, aucune situation de la Home ; au niveau 7, la quatrième enceinte au tour 1", async () => {
    const six = await createSoloGame(admin, "quarter", 3, 6, false, "nova");
    expect((await codesOuverts(six, 1)).filter((c) => c.startsWith("novag7_"))).toEqual([]);
    const sept = await ouvrirUnePartieDeNiveau7({ userId: admin });
    expect(await codesOuverts(sept, 1)).toContain("novag7_t1_home");
  }, 120_000);

  it("« Sur le marché, la première » s'ouvre au tour 4 quand la Home était en vente au tour 3", async () => {
    const gameId = await ouvrirUnePartieDeNiveau7({ userId: admin });
    // La certification ne glisse pas dans cette partie : la Home est en vente au tour 3.
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    const s = parseScenarioConfig(game!.scenarioSnapshot);
    await db
      .update(games)
      .set({
        scenarioSnapshot: {
          ...s,
          products: s.products!.map((p) =>
            p.code === HOME ? { ...p, development: { ...p.development!, risqueDeRetard: { probabilite: 0, tours: 1 } } } : p,
          ),
        },
      })
      .where(eq(games.id, gameId));
    const equipe = await jouer(gameId, 1, (d) => {
      d.products![HOME]!.rdBudget = 30_000;
    });
    await jouer(gameId, 2, (d) => {
      d.products![HOME]!.rdBudget = 60_000;
    });
    await jouer(gameId, 3, (d) => {
      d.products![HOME]!.productionPlan = 400;
      d.products![HOME]!.marketingBudget = 6_000;
    });
    const [t3] = await db.select().from(rounds).where(and(eq(rounds.gameId, gameId), eq(rounds.index, 3)));
    const [ligne] = await db.select().from(roundResults).where(and(eq(roundResults.roundId, t3!.id), eq(roundResults.teamId, equipe)));
    expect((ligne!.engineTrace as EngineTrace).groupe?.nouveautes?.[HOME]?.auMarche).toBe(true);
    expect(await codesOuverts(gameId, 4)).toContain("novag7_home_en_rayon");
  }, 240_000);
});
