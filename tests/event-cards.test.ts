import { describe, expect, it } from "vitest";
import { EVENT_CARDS, TEACHER_DRAWABLE_CODES, cardByCode } from "../src/config/events/cards";
import { novaScenario } from "../src/config/scenarios/nova";

describe("deck de cartes événements", () => {
  it("chaque événement du scénario NOVA a sa carte, et réciproquement", () => {
    const eventCodes = novaScenario.events.map((e) => e.code).sort();
    const cardCodes = EVENT_CARDS.map((c) => c.code).sort();
    expect(cardCodes).toEqual(eventCodes);
  });

  it("les cartes portent récit, effet et concept (jamais de carte muette)", () => {
    for (const card of EVENT_CARDS) {
      expect(card.title.length).toBeGreaterThan(3);
      expect(card.flavor.length).toBeGreaterThan(10);
      expect(card.effectLabel.length).toBeGreaterThan(5);
      expect(card.conceptHint.length).toBeGreaterThan(10);
    }
  });

  it("le tirage manuel exclut les cartes de portée entreprise (équité)", () => {
    const companyScoped = novaScenario.events
      .filter((e) => e.scope === "company")
      .map((e) => e.code);
    for (const code of companyScoped) {
      expect(TEACHER_DRAWABLE_CODES).not.toContain(code);
    }
    expect(TEACHER_DRAWABLE_CODES.length).toBeGreaterThanOrEqual(8);
    for (const code of TEACHER_DRAWABLE_CODES) expect(cardByCode.has(code)).toBe(true);
  });
});
