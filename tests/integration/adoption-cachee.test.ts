import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, desc, eq } from "drizzle-orm";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { companyStates, games, roundResults, teams, users } from "@/db/schema";
import { getGameView, resolveCurrentRound } from "@/services/game.service";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { NOVA_HOME } from "@/config/groupe/nova";
import { neutralDecisions } from "@/engine/bots";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { placerSousLicence } from "./helpers/licence";
import { ouvrirUnePartieDeNiveau7 } from "./helpers/partie-de-niveau-7";

/**
 * L'ADOPTION DE NOVA HOME RESTE CACHÉE (niveau 7).
 *
 * L'état d'adoption (lent, moyen, rapide) se lit dans la taille et la
 * croissance du segment des foyers connectés, dans la migration, et dans le
 * potentiel noté chaque tour. Tant que l'équipe n'a ni acheté l'étude
 * de marché ni vendu la Home, rien de ce que la partie lui envoie ne doit en
 * dépendre : la même partie, rejouée sous un autre état d'adoption, rend la
 * MÊME vue (scénario envoyé au navigateur et dossier d'estimation compris),
 * avant comme après le premier tour. Après l'étude, la vue le dit.
 *
 * Le niveau 7 est retiré du produit (décision du propriétaire, octobre 2026) :
 * la partie ouverte ici est celle qui existe déjà à ce niveau et continue de se
 * jouer (`ouvrirUnePartieDeNiveau7`).
 */
const HOME = "nova-home";
let admin: string;

beforeAll(async () => {
  admin = (
    await db.insert(users).values({ email: "adoption@test.local", displayName: "Administration", isPlatformAdmin: true }).returning({ id: users.id })
  )[0]!.id;
  await placerSousLicence(admin);
});

/** Le snapshot réécrit à un autre état d'adoption : taille et croissance des foyers, migration. */
function aLEtat(s: EngineScenarioConfig, k: number): EngineScenarioConfig {
  const etat = NOVA_HOME.adoption.etats[k]!;
  return {
    ...s,
    products: s.products!.map((p) =>
      p.code !== HOME
        ? p
        : { ...p, market: { ...p.market, segments: p.market.segments.map((g) => (g.code === "foyers" ? { ...g, size: etat.taille, growth: etat.croissance } : g)) } },
    ),
    groupe: {
      ...s.groupe!,
      nouveautes: s.groupe!.nouveautes!.map((n) => ({
        ...n,
        migration: { ...n.migration, parts: Object.fromEntries(Object.entries(NOVA_HOME.regles.migration.parts).map(([c, x]) => [c, x * etat.migration])) },
      })),
    },
  };
}

async function ecrireLeSnapshot(gameId: string, s: EngineScenarioConfig) {
  await db.update(games).set({ scenarioSnapshot: s }).where(eq(games.id, gameId));
}

/** Les potentiels notés des segments de la Home, réécrits comme sous un autre état. */
async function ecrireLesPotentiels(gameId: string, facteur: number) {
  const equipes = await db.select().from(teams).where(eq(teams.gameId, gameId));
  for (const t of equipes) {
    const lignes = await db.select().from(roundResults).where(eq(roundResults.teamId, t.id));
    for (const l of lignes) {
      const detail = { ...(l.marketDetail as CompanyRoundResult["market"]["bySegment"]) };
      for (const c of ["foyers", "migrants"]) if (detail[c]) detail[c] = { ...detail[c]!, potential: detail[c]!.potential * facteur + 1 };
      await db.update(roundResults).set({ marketDetail: detail }).where(eq(roundResults.id, l.id));
    }
  }
}

async function decisions(gameId: string, tour: number, retouche?: (d: RoundDecisions) => void): Promise<RoundDecisions> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  const scenario = parseScenarioConfig(game!.scenarioSnapshot);
  const [equipe] = await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  const [etat] = await db.select().from(companyStates).where(eq(companyStates.teamId, equipe!.id)).orderBy(desc(companyStates.roundIndex)).limit(1);
  const d = neutralDecisions({ scenario, state: etat!.state as CompanyState, roundIndex: tour });
  retouche?.(d);
  return d;
}

const vue = async (gameId: string) => JSON.stringify(await getGameView(gameId, admin));

describe("l'adoption de NOVA Home reste cachée tant que l'équipe ne l'a pas étudiée", () => {
  it("la vue, le scénario envoyé au navigateur et le dossier d'estimation ne dépendent pas de l'état d'adoption ; l'étude de marché le révèle", async () => {
    const gameId = await ouvrirUnePartieDeNiveau7({ userId: admin });
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    const s = parseScenarioConfig(game!.scenarioSnapshot);
    expect(s.products!.some((p) => p.code === HOME)).toBe(true);

    // Au tour 1, avant tout résultat.
    await ecrireLeSnapshot(gameId, aLEtat(s, 0));
    const lente = await vue(gameId);
    await ecrireLeSnapshot(gameId, aLEtat(s, 2));
    const rapide = await vue(gameId);
    expect(rapide).toEqual(lente);
    // la taille des foyers y est « à découvrir »
    const v1 = JSON.parse(lente) as Awaited<ReturnType<typeof getGameView>>;
    expect(v1!.intro.segments.find((x) => x.name.startsWith("Foyers connectés"))!.size).toBeNull();

    // Après un tour joué sans étude ni Home : les potentiels notés des foyers ne sortent pas.
    await ecrireLeSnapshot(gameId, aLEtat(s, 0));
    await resolveCurrentRound({ gameId, userId: admin, playerDecisions: await decisions(gameId, 1) });
    const apresLente = await vue(gameId);
    await ecrireLeSnapshot(gameId, aLEtat(s, 2));
    await ecrireLesPotentiels(gameId, 4.8);
    const apresRapide = await vue(gameId);
    expect(apresRapide).toEqual(apresLente);

    // L'étude de marché achetée au tour 2 : le rapport donne le potentiel des foyers, et la vue le dit.
    await resolveCurrentRound({
      gameId,
      userId: admin,
      playerDecisions: await decisions(gameId, 2, (d) => {
        d.studies = { ...(d.studies ?? {}), market: true };
      }),
    });
    const etudiee = await getGameView(gameId, admin);
    expect(etudiee!.intro.segments.find((x) => x.name.startsWith("Foyers connectés"))!.size).not.toBeNull();
    expect(etudiee!.studyReports!.market!.segments.find((x) => x.name.startsWith("Foyers connectés"))!.potential).toBeGreaterThan(0);
  }, 180_000);
});
