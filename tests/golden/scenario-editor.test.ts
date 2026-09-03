import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Éditeur de scénarios, PR 2 — service d'édition et gardes d'autorisation.
 *
 * Un scénario enseignant appartient à son auteur : un autre prof ne peut ni le
 * lire, ni l'éditer, ni le supprimer, ni le lancer. On vérifie aussi qu'un
 * secteur intégré n'est jamais éditable, et que l'habillage se met bien à jour.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../integration/helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { scenarios, users } from "@/db/schema";
import {
  canTeacherLaunchScenario,
  createScenarioDraftFromBuiltIn,
  deleteScenario,
  getScenarioById,
  setScenarioStatus,
  updateScenarioDefinition,
} from "@/services/scenario-editor.service";

let alice: string;
let bob: string;

beforeAll(async () => {
  const rows = await db
    .insert(users)
    .values([
      { email: "alice@test.local", displayName: "Alice" },
      { email: "bob@test.local", displayName: "Bob" },
    ])
    .returning({ id: users.id });
  alice = rows[0]!.id;
  bob = rows[1]!.id;
});

describe("propriété d'un scénario enseignant", () => {
  it("get/update/status/delete refusent un autre auteur", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "À Alice",
    });

    expect(await getScenarioById(s.id, bob)).toBeNull();
    expect(await getScenarioById(s.id, alice)).not.toBeNull();

    const loaded = await getScenarioById(s.id, alice);
    await expect(
      updateScenarioDefinition(s.id, loaded!.definition, bob),
    ).rejects.toThrow(/appartient/);
    await expect(setScenarioStatus(s.id, "published", bob)).rejects.toThrow(/appartient/);
    await expect(deleteScenario(s.id, bob)).rejects.toThrow(/appartient/);

    // La ligne existe toujours après les tentatives refusées.
    const stillThere = await db.select().from(scenarios).where(eq(scenarios.id, s.id));
    expect(stillThere).toHaveLength(1);
  });

  it("l'habillage se met à jour et l'identité reste stable", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "hotel",
      authorId: alice,
      title: "Hôtel d'Alice",
    });
    const loaded = await getScenarioById(s.id, alice);
    const updated = await updateScenarioDefinition(
      s.id,
      { ...loaded!.definition, title: "Hôtel renommé", tagline: "Nouvelle accroche" },
      alice,
    );
    expect(updated.title).toBe("Hôtel renommé");
    expect(updated.code).toBe(s.code); // le code de la ligne fait foi, inchangé

    const reread = await getScenarioById(s.id, alice);
    expect(reread!.definition.tagline).toBe("Nouvelle accroche");
    expect(reread!.definition.code).toBe(s.code);
    expect(reread!.definition.scenario.code).toBe(s.code);
  });

  it("supprime un scénario dont on est l'auteur", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "À supprimer",
    });
    await deleteScenario(s.id, alice);
    const rows = await db.select().from(scenarios).where(eq(scenarios.id, s.id));
    expect(rows).toHaveLength(0);
  });
});

describe("autorisation de lancement", () => {
  it("intégré : oui pour tous ; enseignant : oui pour l'auteur, non pour un autre", async () => {
    expect(await canTeacherLaunchScenario("nova", alice)).toBe(true);
    expect(await canTeacherLaunchScenario("nova", bob)).toBe(true);

    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "Le scénario d'Alice",
    });
    expect(await canTeacherLaunchScenario(s.code, alice)).toBe(true);
    expect(await canTeacherLaunchScenario(s.code, bob)).toBe(false);
    expect(await canTeacherLaunchScenario("sc-inexistant", alice)).toBe(false);
  });
});
