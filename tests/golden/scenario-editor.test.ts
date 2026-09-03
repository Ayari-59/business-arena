import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

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
import { rounds, scenarios, situationInstances, situations, users } from "@/db/schema";
import {
  addSituation,
  canTeacherLaunchScenario,
  createScenarioDraftFromBuiltIn,
  deleteScenario,
  deleteSituation,
  forkScenario,
  getScenarioById,
  importScenario,
  listSharedScenarios,
  runEssaiABlanc,
  setScenarioStatus,
  updateScenarioDefinition,
  updateSituationText,
} from "@/services/scenario-editor.service";
import { applyEconomicOverrides } from "@/config/difficulty";
import { createSoloGame } from "@/services/game.service";
import type { NewSituationInput } from "@/config/scenarios/situation-build";

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

describe("paramètres moteur et essai à blanc", () => {
  it("l'édition de la config se persiste et l'essai à blanc rend un verdict", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — réglé",
    });
    const loaded = await getScenarioById(s.id, alice);
    const nextConfig = applyEconomicOverrides(loaded!.definition.scenario, {
      fixedCostsPerRound: 42000,
    });
    await updateScenarioDefinition(s.id, { ...loaded!.definition, scenario: nextConfig }, alice);

    const reread = await getScenarioById(s.id, alice);
    expect(reread!.definition.scenario.fixedCostsPerRound).toBe(42000);

    const verdict = await runEssaiABlanc(s.id, alice);
    expect(verdict.detail).toHaveLength(5);
    expect(["jouable", "a-surveiller", "injouable"]).toContain(verdict.verdict);
  });

  it("l'essai à blanc refuse un autre auteur", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — privé",
    });
    await expect(runEssaiABlanc(s.id, bob)).rejects.toThrow(/appartient/);
  });
});

describe("édition d'une situation", () => {
  it("le texte d'une situation se met à jour et se relit", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — situations",
    });
    const loaded = await getScenarioById(s.id, alice);
    const cible = loaded!.definition.situations[0]!;

    await updateSituationText(
      s.id,
      cible.code,
      {
        title: "Titre revu",
        narrative: "Récit revu",
        problem: "Problème revu ?",
        diagnosticLabels: cible.diagnosticOptions.map((_, i) => `Option ${i}`),
        hintTexts: cible.hints.map((_, i) => `Indice ${i}`),
        modelExplain: "Correction revue.",
      },
      alice,
    );

    const reread = await getScenarioById(s.id, alice);
    const apres = reread!.definition.situations.find((x) => x.code === cible.code)!;
    expect(apres.title).toBe("Titre revu");
    expect(apres.narrative).toBe("Récit revu");
    // Structure préservée.
    expect(apres.modelRelevance).toEqual(cible.modelRelevance);
    expect(apres.diagnosticOptions.map((o) => o.correct)).toEqual(
      cible.diagnosticOptions.map((o) => o.correct),
    );
  });

  it("refuse l'édition par un autre auteur", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — privé situ",
    });
    const loaded = await getScenarioById(s.id, alice);
    const cible = loaded!.definition.situations[0]!;
    await expect(
      updateSituationText(
        s.id,
        cible.code,
        {
          title: "x",
          narrative: "x",
          problem: "x",
          diagnosticLabels: cible.diagnosticOptions.map(() => "x"),
          hintTexts: cible.hints.map(() => "x"),
          modelExplain: "x",
        },
        bob,
      ),
    ).rejects.toThrow(/appartient/);
  });
});

const nouvelleSituation = (): NewSituationInput => ({
  category: "decision_strategique",
  title: "Situation créée de zéro",
  narrative: "Récit de test.",
  problem: "Question de test ?",
  diagnostic: [
    { label: "Mauvaise", correct: false },
    { label: "Bonne", correct: true },
  ],
  modelRelevance: { cvp_analysis: "optimal", breakeven_analysis: "acceptable" },
  conceptCodes: ["demand_market_share"],
  hints: ["i1", "i2", "i3", "i4", "i5"],
  modelExplain: "Correction de test.",
  trigger: { round: 1 },
  weight: 1,
});

describe("création d'une situation de zéro", () => {
  it("s'ajoute, se sème et s'instancie au tour 1 quand la partie se lance", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — situation neuve",
    });
    const { code } = await addSituation(s.id, nouvelleSituation(), alice);
    expect(code).toMatch(/^sc-situ-/);

    const reread = await getScenarioById(s.id, alice);
    expect(reread!.definition.situations.some((x) => x.code === code)).toBe(true);

    const gameId = await createSoloGame(alice, "quarter", 3, undefined, false, s.code);
    // La situation neuve a été semée.
    const seeded = await db.select().from(situations).where(eq(situations.code, code));
    expect(seeded).toHaveLength(1);
    // Et instanciée au tour 1.
    const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    const round1 = gameRounds.find((r) => r.index === 1)!;
    const instances = await db
      .select()
      .from(situationInstances)
      .where(
        and(
          eq(situationInstances.roundId, round1.id),
          eq(situationInstances.situationId, seeded[0]!.id),
        ),
      );
    expect(instances.length).toBeGreaterThan(0);
  });

  it("se supprime, et refuse un modèle sans « optimal » ou un autre auteur", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — suppression situ",
    });
    const { code } = await addSituation(s.id, nouvelleSituation(), alice);
    await deleteSituation(s.id, code, alice);
    const reread = await getScenarioById(s.id, alice);
    expect(reread!.definition.situations.some((x) => x.code === code)).toBe(false);

    const sansOptimal = { ...nouvelleSituation(), modelRelevance: { cvp_analysis: "acceptable" as const } };
    await expect(addSituation(s.id, sansOptimal, alice)).rejects.toThrow(/optimal/);
    await expect(addSituation(s.id, nouvelleSituation(), bob)).rejects.toThrow(/appartient/);
  });
});

describe("partage, fork et import", () => {
  it("un scénario publié apparaît dans la banque partagée des autres, pas de son auteur", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — à partager",
    });
    // Brouillon : invisible pour tous dans la banque.
    expect((await listSharedScenarios(bob)).some((x) => x.id === s.id)).toBe(false);
    await setScenarioStatus(s.id, "published", alice);
    // Publié : visible pour bob (avec le nom d'auteur), pas pour alice.
    const pourBob = await listSharedScenarios(bob);
    const vu = pourBob.find((x) => x.id === s.id);
    expect(vu).toBeDefined();
    expect(vu!.authorName).toBe("Alice");
    expect((await listSharedScenarios(alice)).some((x) => x.id === s.id)).toBe(false);
  });

  it("forker un scénario publié en crée une copie possédée par le forkeur", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — publié pour fork",
    });
    await setScenarioStatus(s.id, "published", alice);
    const fork = await forkScenario(s.id, bob, "Ma copie");
    expect(fork.code).not.toBe(s.code);
    expect(fork.status).toBe("draft");
    const chezBob = await getScenarioById(fork.id, bob);
    expect(chezBob).not.toBeNull();
    expect(chezBob!.summary.authorId).toBe(bob);
    expect(await canTeacherLaunchScenario(fork.code, bob)).toBe(true);
  });

  it("forker le brouillon d'un autre est refusé", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "nova",
      authorId: alice,
      title: "NOVA — brouillon privé",
    });
    await expect(forkScenario(s.id, bob, "vol")).rejects.toThrow(/pas partagé/);
  });

  it("l'import d'un JSON exporté crée un brouillon possédé, et refuse un JSON invalide", async () => {
    const s = await createScenarioDraftFromBuiltIn({
      baseCode: "hotel",
      authorId: alice,
      title: "Hôtel — export",
    });
    const exported = (await getScenarioById(s.id, alice))!.definition;
    const imported = await importScenario(exported, bob, "Hôtel importé");
    expect(imported.code).not.toBe(s.code);
    const chezBob = await getScenarioById(imported.id, bob);
    expect(chezBob!.summary.authorId).toBe(bob);
    expect(chezBob!.definition.sector).toBe(exported.sector);

    await expect(importScenario({ pas: "un scénario" }, bob, "x")).rejects.toThrow();
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
