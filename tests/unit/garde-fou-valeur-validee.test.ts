import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pivotsAConfirmer } from "@/config/decision-source";

/**
 * P1-11 DE LA SÉANCE D'ESSAI : LE GARDE-FOU « VALEURS PROPOSÉES » NE REVIENT PAS SUR UNE
 * VALEUR QUE L'ÉQUIPE A CHOISIE ET VALIDÉE AU TOUR PRÉCÉDENT.
 *
 * Mesuré : Sonora choisit 65 € au tour 1, le garde, et lit à chaque tour 2 à 6 « Vous
 * validez avec les valeurs proposées pour : Prix de vente. C'est un choix ? ».
 */
describe("le garde-fou des valeurs proposées", () => {
  const proposees = { price: 65, productionPlan: 4380 };

  it("se tait sur un prix que l'équipe a validé au tour précédent", () => {
    expect(pivotsAConfirmer({ price: 65, productionPlan: 4500 }, proposees, { price: 65, productionPlan: 4500 })).toEqual([]);
  });

  it("interroge encore sur un volume proposé que l'équipe n'a jamais tranché", () => {
    expect(pivotsAConfirmer({ price: 65, productionPlan: 4380 }, proposees, { price: 65, productionPlan: 4500 })).toEqual([
      "productionPlan",
    ]);
  });

  it("au premier tour, ou après une reconduction, rien ne change", () => {
    expect(pivotsAConfirmer({ price: 65, productionPlan: 4380 }, proposees, null)).toEqual(["price", "productionPlan"]);
  });

  it("la feuille de décision passe à la question ce que l'équipe a validé au tour d'avant", () => {
    const feuille = readFileSync("src/components/decision-form.tsx", "utf8");
    expect(feuille).toMatch(/pivotsAConfirmer\([\s\S]{0,200}valideAuTourPasse,?\s*\)/);
    const page = readFileSync("src/app/arena/[gameId]/page.tsx", "utf8");
    expect(page).toContain("valideAuTourPasse={view.pivotsValidesAuTourPasse}");
  });
});
