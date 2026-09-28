import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ParametersPanels } from "@/components/decision-context";
import { aideDuBudgetEntretien } from "@/config/entretien";
import { NOVA_DEFINITION } from "@/config/scenarios/registry";

/**
 * LE PLAFOND ANNONCÉ EST CELUI QU'ON A, ET LE BUDGET QUI LE TIENT A UNE ÉCHELLE.
 *
 * Le moteur produit sous `machineCapacity × availability` : la disponibilité
 * s'use dès que le budget d'entretien passe sous le budget de référence du
 * métier, et elle multiplie la capacité. Elle n'apparaissait dans AUCUN écran —
 * le mot n'existait pas dans une seule ligne de composant. Deux conséquences,
 * corrigées ensemble ici :
 *
 *  1. « Votre entreprise » annonçait la capacité NOMINALE. Une équipe descendue
 *     à 82 % lisait un plafond qu'elle ne pouvait plus atteindre, et rien ne lui
 *     disait pourquoi. C'est le défaut déjà corrigé pour le goulot de
 *     main-d'œuvre, sur l'autre plafond.
 *  2. L'aide du budget d'entretien disait « une maintenance insuffisante dégrade
 *     la disponibilité machine » : insuffisante à partir de quoi ? Le seuil est
 *     dans le scénario, et le classeur du cockpit le donnait déjà aux élèves.
 */

const INTRO = {
  title: "NOVA",
  company: "NOVA",
  tagline: "Enceintes portables.",
  briefing: "…",
  context: "…",
  dilemma: { question: "…", routes: [] },
  capacity: 10_000,
  fixedCostsPerRound: 120_000,
  variableCostPerUnit: 18,
  cash: 200_000,
  segments: [
    { name: "Grand public", size: 6_000, refPrice: 59, paymentDelayDays: 0, yourShare: null },
  ],
  competitors: ["Sonora"],
};

const FAITS = {
  machineCapacity: 10_000,
  availability: 1,
  availableMachineCapacity: 10_000,
  maintenanceReference: 4_000,
  laborCapacity: 40_000,
  bottleneck: "machine" as const,
  headcount: 12,
  hoursPerEmployee: 140,
  productivity: 1,
  hoursPerUnit: 0.04,
};

/**
 * Les nombres français sortent avec une espace fine insécable (U+202F) entre
 * les milliers, et l'euro en est précédé de même. Un test qui cherche
 * « 10 000 » avec une espace ordinaire échoue sur du texte pourtant juste : on
 * normalise, comme le fait déjà le parcours en navigateur.
 */
const sansEspacesFines = (t: string) =>
  // React échappe aussi l'apostrophe en `&#x27;` : on la rend telle qu'on la lit.
  t.replace(/[\u00a0\u202f]/g, " ").replace(/&#x27;/g, "'");

const rendu = (faits: typeof FAITS) =>
  sansEspacesFines(
    renderToStaticMarkup(
      createElement(ParametersPanels, {
        intro: INTRO,
        vocabulary: NOVA_DEFINITION.vocabulary,
        capacityFacts: faits,
      } as Parameters<typeof ParametersPanels>[0]),
    ),
  );

describe("la capacité annoncée", () => {
  it("à l'ouverture, c'est la capacité nominale, sans explication à donner", () => {
    const html = rendu(FAITS);
    expect(html).toContain("10 000");
    expect(html).not.toContain("disponibilité");
  });

  it("usée, c'est ce que l'atelier rend vraiment, et la note dit pourquoi", () => {
    const html = rendu({
      ...FAITS,
      availability: 0.82,
      availableMachineCapacity: 8_200,
    });
    // LE POINT : 8 200, et non 10 000.
    expect(html).toContain("8 200");
    expect(html).toContain("82 % de disponibilité");
    // Le plafond d'origine reste dit, sinon la baisse n'a pas de repère.
    expect(html).toContain("10 000 à l'état neuf");
  });
});

describe("l'aide du budget d'entretien", () => {
  it("donne le seuil du métier et l'état de l'atelier", () => {
    const phrase = sansEspacesFines(
      aideDuBudgetEntretien({ maintenanceReference: 4_000, availability: 0.82 }),
    );
    expect(phrase).toContain("4 000 €");
    expect(phrase).toContain("82 %");
    // Et elle dit dans quel sens le seuil joue, des deux côtés.
    expect(phrase).toContain("se dégrade");
    expect(phrase).toContain("se rétablit");
  });

  it("ne réclame rien quand la disponibilité est entière", () => {
    const phrase = sansEspacesFines(
      aideDuBudgetEntretien({ maintenanceReference: 9_000, availability: 1 }),
    );
    expect(phrase).toContain("9 000 €");
    expect(phrase).toContain("entière");
    expect(phrase).not.toContain("remonte");
  });

  it("sans atelier connu, garde une règle vraie plutôt qu'un chiffre inventé", () => {
    expect(aideDuBudgetEntretien(null)).toBe(
      "Une maintenance insuffisante dégrade la disponibilité machine.",
    );
  });
});
