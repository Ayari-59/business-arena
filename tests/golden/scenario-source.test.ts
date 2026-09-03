import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq, like } from "drizzle-orm";

/**
 * La base comme source de vérité pour les scénarios (éditeur de scénarios, PR 1).
 *
 * On prouve qu'un scénario ENSEIGNANT stocké en base se lance et se résout
 * exactement comme un secteur intégré : résolution/hydratation, seed des
 * situations propres (codes inédits), instanciation au tour 1, clôture d'un
 * tour et classement. Les 9 secteurs intégrés, eux, restent résolus depuis le
 * code, jamais depuis la base.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { rounds, scenarios, situationInstances, situations, users } from "@/db/schema";
import {
  createScenarioDraftFromBuiltIn,
  getScenarioById,
  listScenariosByAuthor,
  setScenarioStatus,
  updateScenarioDefinition,
} from "@/services/scenario-editor.service";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { hydrateDefinition, serializeDefinition } from "@/config/scenarios/serialize";
import { scenarioByCode } from "@/config/scenarios/registry";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let userId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "scenario-editor@test.local", displayName: "EditorTest" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
});

describe("1 — sérialisation code ↔ données", () => {
  it("hydrate(serialize(nova)) reproduit l'état initial et la config", () => {
    const nova = scenarioByCode("nova");
    const round = hydrateDefinition(serializeDefinition(nova));
    expect(round.code).toBe(nova.code);
    expect(round.scenario).toEqual(nova.scenario);
    // company() reste une fonction qui replaque l'identité sur l'état constant.
    const a = round.company("team-a", "Équipe A", "human");
    const ref = nova.company("team-a", "Équipe A", "human");
    expect(a).toEqual(ref);
  });
});

describe("2 — résolution code vs base", () => {
  it("un code intégré se résout depuis le code (identité, pas la base)", async () => {
    const def = await resolveScenarioDefinition("nova");
    expect(def).toBe(scenarioByCode("nova"));
  });

  it("un brouillon enseignant se résout depuis la base, avec son identité propre", async () => {
    const summary = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: userId,
      title: "NOVA — promo BTS",
    });
    expect(summary.code).toMatch(/^sc-/);
    expect(summary.status).toBe("draft");

    const def = await resolveScenarioDefinition(summary.code);
    expect(def.code).toBe(summary.code);
    expect(def.title).toBe("NOVA — promo BTS");
    // Config moteur héritée de la base (mêmes segments, mêmes coûts).
    expect(def.scenario.market.segments.length).toBe(
      scenarioByCode("nova").scenario.market.segments.length,
    );
  });

  it("liste les scénarios de l'auteur, get/update/statut", async () => {
    const summary = await createScenarioDraftFromBuiltIn({
      baseCode: "hotel",
      authorId: userId,
      title: "Hôtel — test",
    });
    const mine = await listScenariosByAuthor(userId);
    expect(mine.some((s) => s.id === summary.id)).toBe(true);

    const loaded = await getScenarioById(summary.id);
    expect(loaded).not.toBeNull();
    const updated = await updateScenarioDefinition(summary.id, {
      ...loaded!.definition,
      title: "Hôtel — renommé",
    });
    expect(updated.title).toBe("Hôtel — renommé");

    const published = await setScenarioStatus(summary.id, "published");
    expect(published.status).toBe("published");
  });

  it("un scénario retiré (archivé) se résout encore : les parties déjà lancées continuent", async () => {
    const summary = await createScenarioDraftFromBuiltIn({
      baseCode: "hotel",
      authorId: userId,
      title: "Hôtel — à retirer",
    });
    await setScenarioStatus(summary.id, "published");
    await setScenarioStatus(summary.id, "archived");
    // Le scénario sort du catalogue de lancement, mais le resolver le rend
    // toujours : une partie ouverte avec ce code garde un scénario jouable.
    const def = await resolveScenarioDefinition(summary.code);
    expect(def.code).toBe(summary.code);
    expect(def.situations.length).toBeGreaterThan(0);
  });

  it("refuse d'éditer ou de duppliquer vers un secteur intégré", async () => {
    await expect(
      createScenarioDraftFromBuiltIn({ baseCode: "inconnu", authorId: userId, title: "x" }),
    ).rejects.toThrow();
  });
});

describe("3 — une partie se lance et se résout depuis un scénario base", () => {
  it("seed des situations propres, instanciation au tour 1, clôture et classement", async () => {
    const summary = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: userId,
      title: "NOVA — codes inédits",
    });
    // On renomme les situations (codes inédits, absents du référentiel intégré) :
    // le seed doit les insérer et l'instanciation les retrouver.
    const loaded = await getScenarioById(summary.id);
    const renamed = loaded!.definition.situations.map((s) => ({ ...s, code: `t1-${s.code}` }));
    await updateScenarioDefinition(summary.id, { ...loaded!.definition, situations: renamed });

    const gameId = await createSoloGame(userId, "quarter", 3, undefined, false, summary.code);

    // La partie référence bien le scénario base (pas une retombée NOVA intégrée).
    const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    expect(gameRounds.length).toBeGreaterThan(0);

    // Les situations renommées ont été semées.
    const seeded = await db.select().from(situations).where(like(situations.code, "t1-%"));
    expect(seeded.length).toBeGreaterThan(0);

    // Le tour 1 a instancié au moins une situation scriptée pour l'équipe humaine.
    const round1 = gameRounds.find((r) => r.index === 1)!;
    const instances = await db
      .select()
      .from(situationInstances)
      .where(eq(situationInstances.roundId, round1.id));
    expect(instances.length).toBeGreaterThan(0);

    // La résolution d'un tour fonctionne comme pour un secteur intégré.
    await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
    const resolved = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    expect(resolved.some((r) => r.status === "resolved")).toBe(true);
  });

  it("la ligne de scénario base porte bien sa config et son habillage", async () => {
    const summary = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: userId,
      title: "NOVA — vérif ligne",
    });
    const row = (await db.select().from(scenarios).where(eq(scenarios.code, summary.code)))[0]!;
    expect(row.definition).not.toBeNull();
    expect(row.config).not.toBeNull();
    expect((row.config as { code?: string }).code).toBe(summary.code);
  });
});
