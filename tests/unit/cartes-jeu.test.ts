import { describe, expect, it } from "vitest";
import {
  CARD_CATEGORIES,
  DECKS,
  EVENT_CARDS,
  cardPosition,
  dureeDeLaCarte,
} from "@/config/events/cards";

/**
 * Ce qui fait d'un encart une carte à jouer : une enseigne par catégorie, une
 * numérotation dans son deck, une durée qui se dessine en pastilles.
 */
describe("l'habillage façon jeu de cartes", () => {
  it("chaque catégorie a son enseigne, et quatre enseignes distinctes", () => {
    const glyphs = Object.values(CARD_CATEGORIES).map((c) => c.glyph);
    expect(glyphs).toEqual(["♦", "♠", "♣", "♥"]);
    expect(new Set(glyphs).size).toBe(4);
  });

  it("chaque carte a sa place dans un deck nommé, et une seule", () => {
    for (const card of EVENT_CARDS) {
      const p = cardPosition(card.code);
      expect(p, card.code).not.toBeNull();
      expect(p!.index).toBeGreaterThanOrEqual(1);
      expect(p!.index).toBeLessThanOrEqual(p!.total);
      expect(p!.deck.length).toBeGreaterThan(2);
    }
    // les decks se partagent toutes les cartes, sans doublon ni oubli
    const total = DECKS.reduce((t, d) => t + d.cards.length, 0);
    expect(total).toBe(EVENT_CARDS.length);
    expect(cardPosition("carte_inconnue")).toBeNull();
  });

  it("la numérotation est celle de l'ordre du deck", () => {
    const nova = DECKS.find((d) => d.name === "NOVA")!;
    expect(cardPosition(nova.cards[0]!.code)).toEqual({ deck: "NOVA", index: 1, total: nova.cards.length });
    expect(cardPosition(nova.cards.at(-1)!.code)!.index).toBe(nova.cards.length);
  });

  it("la durée se lit dans l'effet : une pastille par tour", () => {
    expect(dureeDeLaCarte({ effectLabel: "Demande globale −10 % pendant 2 tours" })).toBe(2);
    expect(dureeDeLaCarte({ effectLabel: "Disponibilité machine −15 % ce tour" })).toBe(1);
    expect(dureeDeLaCarte({ effectLabel: "Charges d'intérêts ×1,5 pendant 3 tours" })).toBe(3);
  });
});
