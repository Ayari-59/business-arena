import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prixMoyenAuMarche } from "@/lib/prix-moyen-au-marche";

/**
 * LE PRIX MOYEN DE « LES CAUSES LES PLUS FORTES » (séance d'essai, P1-1).
 *
 * Sonora vendait à 65 € et lisait « Prix : 84 € contre 66 € en moyenne sur le
 * marché » : le chiffre d'affaires, commande exceptionnelle comprise, était
 * divisé par les seules ventes au marché. Vu rouge sur l'ancienne formule
 * (84,00 au lieu de 65,00), vert après.
 */
describe("le prix moyen au marché", () => {
  // 3 000 enceintes au marché à 65 €, plus une commande exceptionnelle de
  // 1 000 enceintes à 57 € que le chiffre d'affaires de la ligne compte aussi.
  const ligne = {
    revenue: 3_000 * 65 + 1_000 * 57,
    marketDetail: {
      grand_public: { sold: 2_000, revenue: 2_000 * 65 },
      pro: { sold: 1_000, revenue: 1_000 * 65 },
    },
  };

  it("est le chiffre d'affaires du marché divisé par les ventes au marché", () => {
    expect(prixMoyenAuMarche(ligne)).toBe(65);
  });

  it("ne compte pas la commande exceptionnelle", () => {
    expect(prixMoyenAuMarche(ligne)).not.toBe(ligne.revenue / 3_000);
  });

  it("retombe sur le chiffre d'affaires de la ligne pour une partie ancienne sans chiffre par segment", () => {
    expect(prixMoyenAuMarche({ revenue: 130_000, marketDetail: { a: { sold: 2_000 } } })).toBe(65);
  });

  it("n'a pas de prix sans ventes", () => {
    expect(prixMoyenAuMarche({ revenue: 0, marketDetail: { a: { sold: 0, revenue: 0 } } })).toBeNull();
    expect(prixMoyenAuMarche({ revenue: 0, marketDetail: null })).toBeNull();
  });

  it("est celui du benchmark et de l'étude des concurrents", () => {
    const vue = readFileSync(join(process.cwd(), "src/services/game-view.service.ts"), "utf8");
    expect(vue.match(/avgPrice: prixMoyenAuMarche\(row\)/g)?.length).toBe(2);
    expect(vue).not.toMatch(/avgPrice: units > 1 \? Number\(row\.revenue\) \/ units/);
  });
});
