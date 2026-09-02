import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/config/scenarios/registry";
import { neutralDecisions } from "@/engine/bots";
import { fleetMaintenanceMultiplier } from "@/engine/simulation";
import { roundDecisionsSchema } from "@/services/decision-schema";
import type { EquipmentTypeDef } from "@/engine/types";

/**
 * Le point de départ d'un tour appartient au secteur joué.
 *
 * Écart réel : le prix et le volume par défaut du tour 1 étaient codés en dur
 * aux valeurs de NOVA, un fabricant d'enceintes à 59 € l'unité produisant
 * 4 800 pièces. Ils servaient à deux endroits, le formulaire de l'élève et le
 * repli du moteur pour une équipe qui n'a rien rendu. Appliqués à ATLAS
 * CONSEIL, ils facturaient la journée de conseil 59 € et planifiaient 4 800
 * jours pour une capacité de 720 : une équipe en retard ne se voyait pas
 * reconduire son tour, elle se voyait attribuer une faillite.
 *
 * Les concurrents pilotés, eux, calculaient déjà tout cela par secteur. Ce
 * test vérifie que le joueur humain part des mêmes bases que son marché.
 */

/** Capacité réellement atteignable : la plus contraignante des deux. */
function capacite(d: (typeof SCENARIOS)[number]) {
  const state = d.company("t", "Test", "human");
  const machine = state.machineCapacity * state.availability;
  const labor =
    (state.headcount * state.hoursPerEmployee * state.productivity) /
    d.scenario.product.hoursPerUnit;
  return Math.min(machine, labor);
}

const depart = (d: (typeof SCENARIOS)[number]) =>
  neutralDecisions({
    scenario: d.scenario,
    state: d.company("t", "Test", "human"),
    roundIndex: 1,
  });

describe("le point de départ d'un tour vient du secteur", () => {
  it("le prix est celui de la clientèle principale, jamais celui d'un autre métier", () => {
    for (const d of SCENARIOS) {
      const principale = [...d.scenario.market.segments].sort((a, b) => b.size - a.size)[0]!;
      expect(depart(d).price, `${d.code}`).toBeCloseTo(principale.refPrice, 6);
    }
    // et les sept ne partent pas tous du même prix, ce qui était le défaut
    const prix = new Set(SCENARIOS.map((d) => Math.round(depart(d).price)));
    expect(prix.size).toBeGreaterThan(4);
  });

  it("le volume par défaut tient dans la capacité de l'entreprise", () => {
    for (const d of SCENARIOS) {
      const plan = depart(d).productionPlan;
      const cap = capacite(d);
      expect(plan, `${d.code} : plan ${Math.round(plan)} pour ${Math.round(cap)} de capacité`)
        .toBeLessThanOrEqual(cap);
      // et il n'est pas nul : proposer zéro n'est pas un point de départ
      expect(plan, `${d.code}`).toBeGreaterThan(0.2 * cap);
    }
  });

  it("les budgets suivent les échelles du scénario", () => {
    for (const d of SCENARIOS) {
      const dep = depart(d);
      expect(dep.marketingBudget, `${d.code}`).toBeCloseTo(0.5 * d.scenario.marketing.scale, 6);
      expect(dep.qualityBudget, `${d.code}`).toBeCloseTo(
        0.5 * d.scenario.production.qualityScale,
        6,
      );
      const state = d.company("t", "Test", "human");
      const maintenanceMul = d.scenario.equipment
        ? fleetMaintenanceMultiplier(
            [...(state.fleet ?? []), ...(state.pendingFleet ?? [])],
            new Map<string, EquipmentTypeDef>(d.scenario.equipment.types.map((t) => [t.code, t])),
          )
        : 1;
      expect(dep.maintenanceBudget, `${d.code}`).toBeCloseTo(
        d.scenario.production.maintenanceReference * maintenanceMul,
        6,
      );
    }
  });

  it("le point de départ passe la validation qui garde le formulaire", () => {
    // Un défaut proposé à l'élève doit être soumettable tel quel : sinon le
    // premier tour est refusé sans qu'il ait rien changé.
    for (const d of SCENARIOS) {
      const dep = depart(d);
      expect(
        roundDecisionsSchema.safeParse({ ...dep, insurance: false }).success,
        `${d.code} : le point de départ est refusé par le schéma`,
      ).toBe(true);
    }
  });
});
