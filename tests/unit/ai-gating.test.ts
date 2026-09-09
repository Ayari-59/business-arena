import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_AI_CONFIG, isAiModelId } from "@/config/ai";
import { aiKeyPresent, resolveAiSurface } from "@/services/ai.service";

/**
 * L'assistant IA doit être INERTE par défaut : éteint en config, et surtout
 * indisponible tant qu'aucune clé API n'est configurée — quel que soit le
 * réglage admin. On ne veut ni coût ni appel réseau par surprise.
 */

// La base n'est pas touchée par ces tests : resolveAiSurface court-circuite sur
// l'absence de clé AVANT toute lecture. On la neutralise par sécurité.
vi.mock("@/db", () => ({ db: {} }));

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe("réglages IA", () => {
  it("le défaut est éteint partout, modèle économique", () => {
    expect(DEFAULT_AI_CONFIG.coach).toBe(false);
    expect(DEFAULT_AI_CONFIG.teacherReview).toBe(false);
    expect(DEFAULT_AI_CONFIG.tutor).toBe(false);
    expect(DEFAULT_AI_CONFIG.model).toBe("claude-haiku-4-5");
  });

  it("ne valide que les identifiants de modèle connus", () => {
    expect(isAiModelId("claude-haiku-4-5")).toBe(true);
    expect(isAiModelId("claude-sonnet-5")).toBe(true);
    expect(isAiModelId("claude-opus-5")).toBe(true);
    expect(isAiModelId("gpt-4")).toBe(false);
    expect(isAiModelId(null)).toBe(false);
    expect(isAiModelId(42)).toBe(false);
  });
});

describe("disponibilité de l'IA", () => {
  it("aiKeyPresent suit la variable d'environnement", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(aiKeyPresent()).toBe(false);
    process.env.ANTHROPIC_API_KEY = "sk-test";
    expect(aiKeyPresent()).toBe(true);
  });

  it("sans clé API, aucune surface n'est disponible (repli fermé)", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(await resolveAiSurface("coach")).toBeNull();
    expect(await resolveAiSurface("teacherReview")).toBeNull();
    expect(await resolveAiSurface("tutor")).toBeNull();
  });
});
