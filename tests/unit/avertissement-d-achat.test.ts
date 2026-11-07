import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { avertissementDAchat } from "@/config/avertissement-d-achat";
import { avecLEquilibre } from "@/config/scenarios/equilibre";
import { scenarioByCode } from "@/config/scenarios/registry";

/**
 * L'ACHAT QUI DÉPASSE LA TRÉSORERIE EST SIGNALÉ, PAS REFUSÉ (décision du propriétaire,
 * novembre 2026). À l'équilibre 0.2.0, une chambre de L'ESCALE coûte plus que sa
 * trésorerie : payée sans emprunt, elle mène au découvert puis à la défaillance.
 */

vi.mock("@/app/arena/[gameId]/actions", () => ({ playRoundAction: async () => ({ error: null }) }));
const { EquipmentPanel } = await import("@/components/decision-form");

const hotel = scenarioByCode("hotel");
const types = avecLEquilibre(hotel.scenario).equipment!.types.map((t) => ({
  code: t.code,
  name: t.name,
  capacityPerUnit: t.capacityPerUnit,
  costPerUnit: t.costPerUnit,
  depreciationRounds: t.depreciationRounds,
  maintenanceMultiplier: t.maintenanceMultiplier,
  maxPerRound: t.maxPerRound,
  resaleRatio: t.resaleRatio ?? 0.3,
  chargeFixeParTour: t.chargeFixeParTour,
}));
const etat = hotel.company("a", "A", "human");
const tresorerie = etat.finance.cash - etat.finance.overdraft;
const sans = (s: string) => s.replace(/[  ]/g, " ");

function panneau(achats: Record<string, number>, empruntOuvert: boolean, avecTresorerie = true) {
  return sans(
    renderToStaticMarkup(
      createElement(EquipmentPanel, {
        offer: {
          types,
          fleet: types.map((t) => ({ typeCode: t.code, count: 0, bookValue: 0 })),
          pendingFleet: types.map((t) => ({ typeCode: t.code, count: 0 })),
          ...(avecTresorerie ? { tresorerieDisponible: tresorerie } : {}),
        },
        vocabulary: hotel.vocabulary,
        buyQty: achats,
        setBuyQty: () => {},
        sellQty: {},
        setSellQty: () => {},
        empruntOuvert,
      }),
    ),
  );
}

describe("le formulaire prévient d'un achat qui dépasse la trésorerie", () => {
  it("une chambre de L'ESCALE dépasse sa trésorerie : l'avertissement propose l'emprunt", () => {
    const chambre = types[0]!;
    expect(chambre.costPerUnit).toBeGreaterThan(tresorerie);
    const html = panneau({ [chambre.code]: 1 }, true);
    expect(html).toContain(`Cet achat de ${chambre.costPerUnit.toLocaleString("fr-FR").replace(/[  ]/g, " ")} € dépasse votre trésorerie disponible`);
    expect(html).toContain("« Nouvel emprunt »");
    expect(html).toContain("La décision vous appartient.");
    // Prévenir, pas bloquer : la case reste ouverte, sans refus ni borne abaissée.
    expect(html).not.toContain("aria-invalid");
  });

  it("sans emprunt au niveau, il le dit sans le proposer", () => {
    const html = panneau({ [types[0]!.code]: 1 }, false);
    expect(html).toContain("le découvert paiera la différence");
    expect(html).not.toContain("Nouvel emprunt");
  });

  it("rien à dire sans achat, sous la trésorerie, ou sans trésorerie connue", () => {
    expect(panneau({}, true)).not.toContain("dépasse votre trésorerie");
    expect(panneau({ [types[0]!.code]: 1 }, true, false)).not.toContain("dépasse votre trésorerie");
    expect(avertissementDAchat({ cout: 40_000, tresorerie: 50_000, empruntOuvert: true })).toBeNull();
    expect(sans(avertissementDAchat({ cout: 60_000, tresorerie: 50_000, empruntOuvert: true })!)).toContain("60 000 €");
  });
});
