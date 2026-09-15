import { describe, expect, it } from "vitest";
import {
  EVENT_CARDS,
  TEACHER_DRAWABLE_CODES,
  cardByCode,
  cardsForEventCodes,
  dureeDeLaCarte,
} from "../src/config/events/cards";
import { RSE_CARD_CODES } from "../src/engine/rse";
import { SCENARIOS } from "../src/config/scenarios/registry";

// Les cartes RSE (Lot 2C) sont TRANSVERSES : déclenchées par le moteur sur le
// standing de l'équipe, elles n'appartiennent à aucun scénario et n'ont pas
// d'événement de scénario correspondant. On les tient donc à part de
// l'invariant « une carte ⇔ un événement de scénario ».
const RSE_CODES = new Set<string>(Object.values(RSE_CARD_CODES));

describe("deck de cartes événements", () => {
  it("chaque événement de chaque scénario a sa carte, et réciproquement", () => {
    // Deux scénarios du même métier partagent le même deck : NOVA en une
    // référence et NOVA en trois jouent les mêmes événements, sous les mêmes
    // codes. Un code d'événement ne compte donc qu'une fois.
    const eventCodes = [
      ...new Set(SCENARIOS.flatMap((d) => d.scenario.events.map((e) => e.code))),
    ].sort();
    const cardCodes = EVENT_CARDS.map((c) => c.code)
      .filter((c) => !RSE_CODES.has(c))
      .sort();
    expect(cardCodes).toEqual(eventCodes);
  });

  it("les cartes RSE transverses existent et ciblent l'équipe", () => {
    for (const code of RSE_CODES) {
      const card = cardByCode.get(code);
      expect(card, `carte RSE manquante : ${code}`).toBeDefined();
      expect(card!.scope).toBe("team");
    }
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

/**
 * CE QUE LA CARTE ANNONCE, LE MOTEUR LE FAIT.
 *
 * Le texte de l'effet est écrit à la main ; les modificateurs du moteur sont
 * dans le scénario. Rien ne les reliait : une carte pouvait annoncer +20 % là
 * où le moteur appliquait ×1,15, ou « 1 400 palettes » là où il en ajoutait
 * 900 (constaté sur ROUTE & CIE). Cette garde lit le texte de chaque carte et
 * le confronte à la définition de l'événement :
 *   · la durée (« pendant 2 tours », sinon un tour) est celle du moteur ;
 *   · le pourcentage annoncé (+20 %, −10 %, ×1,5) est l'un des multiplicateurs ;
 *   · la quantité d'une commande ferme est celle ajoutée par le moteur.
 * Une carte sans chiffre lisible échoue aussi : l'élève doit pouvoir calculer.
 */
describe("la carte dit ce que le moteur fait", () => {
  const lire = (label: string) => {
    const pct = label.match(/([+−-])\s?(\d+(?:[.,]\d+)?)\s?%/);
    if (pct) return { genre: "pct" as const, valeur: (pct[1] === "+" ? 1 : -1) * Number(pct[2]!.replace(",", ".")) };
    const mul = label.match(/×\s?(\d+(?:[.,]\d+)?)/);
    if (mul) return { genre: "pct" as const, valeur: Math.round((Number(mul[1]!.replace(",", ".")) - 1) * 100) };
    // « Commande ferme de 900 palettes » ou « +600 unités (échelle trimestre) » :
    // une quantité absolue, celle que le moteur ajoute (base trimestre).
    const commande =
      label.match(/[Cc]ommande ferme de (\d[\d\s\u202f\u00a0]*)/) ??
      label.match(/^\+\s?(\d[\d\s\u202f\u00a0]*)\s[^%]/);
    if (commande) return { genre: "commande" as const, valeur: Number(commande[1]!.replace(/[\s\u202f\u00a0]/g, "")) };
    return null;
  };

  const evenements = new Map<string, { code: string; duration: number; modifiers: { target: string; op: string; value: number }[] }>();
  for (const d of SCENARIOS) for (const ev of d.scenario.events) if (!evenements.has(ev.code)) evenements.set(ev.code, ev);

  for (const [code, ev] of evenements) {
    const card = cardByCode.get(code);
    if (!card) continue; // couvert par « chaque événement a sa carte »
    it(`${code} : durée et effet annoncés = ceux du moteur`, () => {
      expect(dureeDeLaCarte(card), "durée").toBe(ev.duration);
      const annonce = lire(card.effectLabel);
      expect(annonce, `chiffre lisible dans « ${card.effectLabel} »`).not.toBeNull();
      if (annonce!.genre === "pct") {
        const multiplicateurs = ev.modifiers.filter((m) => m.op === "mul").map((m) => Math.round((m.value - 1) * 100));
        expect(multiplicateurs, "un multiplicateur").not.toHaveLength(0);
        expect(multiplicateurs, `« ${card.effectLabel} » vs ${JSON.stringify(ev.modifiers)}`).toContain(annonce!.valeur);
      } else {
        const commande = ev.modifiers.find((m) => m.target === "order" && m.op === "add");
        expect(commande, "une commande ferme dans le moteur").toBeDefined();
        expect(commande!.value, `« ${card.effectLabel} »`).toBe(annonce!.valeur);
      }
    });
  }
});

