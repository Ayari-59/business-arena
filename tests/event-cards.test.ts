import { describe, expect, it } from "vitest";
import {
  EVENT_CARDS,
  TEACHER_DRAWABLE_CODES,
  cardByCode,
  cardsForEventCodes,
} from "../src/config/events/cards";
import { SCENARIOS } from "../src/config/scenarios/registry";

describe("deck de cartes événements", () => {
  it("chaque événement de chaque scénario a sa carte, et réciproquement", () => {
    const eventCodes = SCENARIOS.flatMap((d) => d.scenario.events.map((e) => e.code)).sort();
    const cardCodes = EVENT_CARDS.map((c) => c.code).sort();
    expect(cardCodes).toEqual(eventCodes);
  });

  it("aucun code de carte n'est partagé entre deux secteurs", () => {
    const codes = EVENT_CARDS.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("la portée de la carte reflète la portée de l'événement", () => {
    for (const definition of SCENARIOS) {
      for (const event of definition.scenario.events) {
        const card = cardByCode.get(event.code);
        expect(card, `carte manquante pour ${event.code}`).toBeDefined();
        expect(card!.scope, `portée incohérente pour ${event.code}`).toBe(
          event.scope === "company" ? "team" : "market",
        );
      }
    }
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
    const companyScoped = SCENARIOS.flatMap((d) =>
      d.scenario.events.filter((e) => e.scope === "company").map((e) => e.code),
    );
    for (const code of companyScoped) {
      expect(TEACHER_DRAWABLE_CODES).not.toContain(code);
    }
    expect(TEACHER_DRAWABLE_CODES.length).toBeGreaterThanOrEqual(8);
    for (const code of TEACHER_DRAWABLE_CODES) expect(cardByCode.has(code)).toBe(true);
  });

  it("chaque secteur a son deck : on ne pioche jamais la carte d'un autre", () => {
    for (const definition of SCENARIOS) {
      const codes = definition.scenario.events.map((e) => e.code);
      const deck = cardsForEventCodes(codes);
      expect(deck.map((c) => c.code).sort()).toEqual([...codes].sort());
      // et chaque deck permet d'animer une classe : les deux portées existent
      expect(deck.some((c) => c.scope === "market")).toBe(true);
      expect(deck.some((c) => c.scope === "team")).toBe(true);
    }
  });
});
