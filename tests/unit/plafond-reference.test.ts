import { describe, expect, it, vi } from "vitest";

/**
 * LA GESTION DE RÉFÉRENCE DE « MÉRITE OU CHANCE » RESTE SOUS LE PLAFOND.
 *
 * Elle part de la gestion neutre (`neutralDecisions`), qui n'investit pas
 * aujourd'hui : la garde serait muette. On lui fait donc acheter, ici, plus que
 * l'équipe ne fait tourner, et la référence doit le ramener sous le plafond aux
 * niveaux sans embauches, et le laisser passer au niveau 4.
 */
vi.mock("@/engine/bots", async (original) => {
  const vrai = await original<typeof import("@/engine/bots")>();
  return {
    ...vrai,
    neutralDecisions: (ctx: Parameters<typeof vrai.neutralDecisions>[0]) => ({
      ...vrai.neutralDecisions(ctx),
      investment: { equipmentBuy: [{ typeCode: "auto", quantity: 1 }, { typeCode: "manual", quantity: 3 }] },
    }),
  };
});

const { decisionDeReference } = await import("@/pedagogy/merite/reference");
const { depasseLePlafond, plafondDInvestissement } = await import("@/engine/investment/plafond");
const { DIFFICULTY_PRESETS, REPARTITION_AVANT_2026_10_11 } = await import("@/config/difficulty");
const { NOVA_DEFINITION } = await import("@/config/scenarios/registry");

describe("la référence et le plafond", () => {
  const scenario = NOVA_DEFINITION.scenario;
  const state = { ...NOVA_DEFINITION.company("ref", "NOVA", "human"), headcount: 6 };
  const ACHAT = [
    { typeCode: "auto", quantity: 1 },
    { typeCode: "manual", quantity: 3 },
  ];

  for (const p of DIFFICULTY_PRESETS) {
    it(`niveau ${p.level} (répartition actuelle)`, () => {
      const d = decisionDeReference({ scenario, state, roundIndex: 2 }, p.decisions);
      const plafond = plafondDInvestissement(scenario, state, p.decisions, d.hr);
      expect(depasseLePlafond(plafond, d.investment)).toBe(false);
      // Investissement fermé : rien ; ouvert (avec les embauches) : rien n'est retranché.
      expect(d.investment?.equipmentBuy).toEqual(p.decisions.investment ? ACHAT : undefined);
    });
  }

  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level} d'une partie d'avant la répartition : l'achat est ramené sous le plafond`, () => {
      const ouverts = REPARTITION_AVANT_2026_10_11[level];
      const d = decisionDeReference({ scenario, state, roundIndex: 2 }, ouverts);
      const plafond = plafondDInvestissement(scenario, state, ouverts, d.hr);
      expect(plafond.applique).toBe(true);
      expect(depasseLePlafond(plafond, d.investment)).toBe(false);
      // 10 800 − 7 000 = 3 800 : l'automatisée (2 500) et une manuelle (1 000).
      expect(d.investment?.equipmentBuy).toEqual([
        { typeCode: "auto", quantity: 1 },
        { typeCode: "manual", quantity: 1 },
      ]);
    });
  }
});
