import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LIBELLES_DES_STOCKS } from "../../src/config/scenarios/libelles-des-stocks";
import { SCENARIOS } from "../../src/config/scenarios/registry";

/** Le stock d'une boutique n'est pas fait de produits finis : le libellé suit le métier. */
describe("le libellé des stocks suit le métier joué", () => {
  it("fabricant, commerce, service, bâtiment ont chacun leur mot", () => {
    expect(LIBELLES_DES_STOCKS.industrie.stock).toBe("Stocks de produits finis");
    expect(LIBELLES_DES_STOCKS.commerce.stock).toMatch(/marchandises/);
    expect(LIBELLES_DES_STOCKS.ecommerce.stock).toMatch(/marchandises/);
    expect(LIBELLES_DES_STOCKS.services.stock).toMatch(/[Ee]n-cours/);
    expect(LIBELLES_DES_STOCKS.batiment.stock).toMatch(/[Tt]ravaux en cours/);
    for (const [secteur, l] of Object.entries(LIBELLES_DES_STOCKS)) {
      if (secteur === "industrie") continue;
      expect(l.stock, secteur).not.toMatch(/produits finis/);
    }
  });

  it("chaque scénario a un libellé par son secteur", () => {
    for (const s of SCENARIOS) expect(LIBELLES_DES_STOCKS[s.sector], s.code).toBeDefined();
  });

  it("les états financiers ne figent plus le libellé du fabricant", () => {
    const src = readFileSync("src/components/financial-statements.tsx", "utf8");
    expect(src).not.toMatch(/label="Stocks de produits finis"/);
    expect(src).not.toMatch(/label="Production stockée/);
    expect(src).toMatch(/libellesDuStock\(/);
  });
});

describe("l'estimation du cockpit nomme le stock comme les états", () => {
  it("lignesDuCompte prend le libellé du métier", async () => {
    const { lignesDuCompte } = await import("../../src/components/lecture-des-comptes");
    const cr = { revenue: 1000, productionStocked: 200 } as unknown as Parameters<typeof lignesDuCompte>[0];
    const libelle = (s: Parameters<typeof lignesDuCompte>[1]) =>
      lignesDuCompte(cr, s).find((l) => l.cle === "productionStocked")?.label;
    expect(libelle("industrie")).toBe(LIBELLES_DES_STOCKS.industrie.variation);
    expect(libelle("commerce")).toBe(LIBELLES_DES_STOCKS.commerce.variation);
    expect(libelle("batiment")).toBe(LIBELLES_DES_STOCKS.batiment.variation);
    expect(libelle("services")).toBe(LIBELLES_DES_STOCKS.services.variation);
  });
});
