import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * L'AIDE DU BUDGET QUALITÉ DIT CE QUE LA QUALITÉ RAPPORTE, ET À QUELLE CONDITION.
 *
 * Elle disait : « Prévention : moins de rebuts et de retours, une qualité
 * perçue qui monte. » Vrai, et trompeur : mesuré sur les quinze secteurs au
 * niveau 2, sur douze tours, le budget pré-rempli fait MOINS bien que zéro
 * qualité au prix pré-rempli, partout. La qualité ne se paie qu'en vendant plus
 * cher, et seulement là où la clientèle y tient. L'élève qui suivait l'aide
 * perdait sans savoir pourquoi.
 *
 * La valeur pré-remplie, elle, ne bouge pas : c'est la gestion neutre, étalon
 * de l'examen et du mérite (décision du propriétaire, mesure jointe au lot).
 *
 * Ce test garde le texte rendu au niveau 2 ; `tests/engine/qualite-et-prix`
 * garde que chacune de ses affirmations est vraie dans le moteur.
 */

vi.mock("@/app/arena/[gameId]/actions", () => ({
  playRoundAction: async () => ({ error: null }),
}));

const { DecisionForm } = await import("@/components/decision-form");
const { presetByLevel } = await import("@/config/difficulty");
const { SCENARIOS } = await import("@/config/scenarios/registry");

type Props = Parameters<typeof DecisionForm>[0];

const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");

describe("l'aide du budget qualité, au niveau 2", () => {
  const props: Props = {
    gameId: "partie-test",
    roundIndex: 1,
    periodName: "tour 1",
    defaults: {
      price: 79,
      productionPlan: 1000,
      marketingBudget: 5000,
      qualityBudget: 3000,
      maintenanceBudget: 4686,
    } as Props["defaults"],
    kind: "class",
    alreadySubmitted: false,
    enabled: presetByLevel.get(2)!.decisions,
    vocabulary: SCENARIOS[0]!.vocabulary,
  };
  const lu = texte(renderToStaticMarkup(createElement(DecisionForm, props)));

  it("dit ce qu'elle rapporte : rebuts, retours, qualité perçue qui monte avec retard", () => {
    expect(lu).toContain("moins de rebuts et de retours");
    expect(lu).toMatch(/qualité perçue qui monte lentement/);
  });

  it("dit la condition : elle se paie par le prix, pas à prix inchangé", () => {
    expect(lu).toMatch(/à prix inchangé, le surcroît de clients couvre rarement la dépense/);
    expect(lu).toMatch(/vendre plus cher/);
    // Et seulement là où la clientèle y tient : pas une promesse générale.
    expect(lu).toMatch(/là où ils y tiennent/);
  });
});
