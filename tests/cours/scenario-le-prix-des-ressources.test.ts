import { describe, expect, it } from "vitest";
import { LE_PRIX_DES_RESSOURCES as sc } from "../../src/config/cours/scenarios/le-prix-des-ressources";
import { van } from "../../src/config/cours/monde/finance";
import { laDette, laStructure, meilleureSuite, resultatDeLaSuite, toutesLesSuites } from "../../src/config/cours/monde/prix-des-ressources";
import { gardesDuScenario } from "../helpers/activites-du-lot-c";

/**
 * LE SCÉNARIO « LE PRIX DES RESSOURCES » (monde/prix-des-ressources.ts) : le coût de chaque dette refait
 * par ses flux, le CMPC de chaque structure à la main, la meilleure suite, puis les gardes du lot C.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;

describe("le prix des ressources : chaque chiffre à la main", () => {
  it("chaque dette : son coût après impôt annule la valeur actuelle de ses flux après impôt", () => {
    const frais = 800;
    const interetsIF = [4_000, 4_000, 4_000, 4_000, 4_000];
    const fluxIF = [80_000 - frais, ...interetsIF.map((i, k) => -i - (k === 4 ? 80_000 : 0) + i * 0.25 + (k === 0 ? frais * 0.25 : 0))];
    expect(Math.abs(van(fluxIF, laDette("in-fine").apresImpot))).toBeLessThan(1);
    const du = [80_000, 64_000, 48_000, 32_000, 16_000];
    const fluxAC = [80_000 - frais, ...du.map((d, k) => -16_000 - d * 0.05 + d * 0.05 * 0.25 + (k === 0 ? frais * 0.25 : 0))];
    expect(Math.abs(van(fluxAC, laDette("amortissement-constant").apresImpot))).toBeLessThan(1);
    // Le placement privé : 800 titres à 98 €, 1 600 € de frais ; 3 600 € de coupons ; prime et frais étalés sur 5 ans.
    const eco = (3_600 + (1_600 + 1_600) / 5) * 0.25;
    const fluxO = [78_400 - 1_600, ...[1, 2, 3, 4, 5].map((k) => -3_600 - (k === 5 ? 80_000 : 0) + eco)];
    expect(Math.abs(van(fluxO, laDette("obligataire").apresImpot))).toBeLessThan(1);
    expect(laDette("in-fine").apresImpot).toBeLessThan(laDette("amortissement-constant").apresImpot);
    expect(laDette("amortissement-constant").apresImpot).toBeLessThan(laDette("obligataire").apresImpot);
  });

  it("le CMPC de chaque structure, pondéré par les montants au bilan", () => {
    const cp = 150_000 + 79_225.96 - 30_000;
    const kd = laDette("in-fine").apresImpot;
    const a12 = laStructure({ dette: "in-fine", fonds: "capital-a-12" });
    expect(a12.leve).toBe(5_000 * 12);
    expect(a12.cmpc).toBeCloseTo(((cp + 60_000) * (0.03 + 1.1 * 0.06) + 68_000 * 0.0375 + 80_000 * kd) / (cp + 60_000 + 68_000 + 80_000), 10);
    const a11 = laStructure({ dette: "in-fine", fonds: "capital-a-11" });
    expect(a11.leve).toBe(5_000 * 11);
    const dp = laStructure({ dette: "in-fine", fonds: "dette-de-plus" });
    expect(dp.kc).toBeCloseTo(0.03 + 1.4 * 0.06, 12);
    expect(dp.cmpc).toBeCloseTo((cp * (0.03 + 1.4 * 0.06) + 68_000 * 0.0375 + 80_000 * kd + 60_000 * 0.06 * 0.75) / (cp + 60_000 + 68_000 + 80_000), 10);
    expect(c(a12.valeurDeLAction)).toBe(c((cp + 60_000) / 20_000));
  });

  it("neuf suites, quatre fins, une meilleure : l'in fine, puis le capital à 12 €", () => {
    expect(toutesLesSuites()).toHaveLength(9);
    expect(new Set(toutesLesSuites().map((s) => resultatDeLaSuite(s).fin)).size).toBe(4);
    expect(meilleureSuite().suite).toEqual({ dette: "in-fine", fonds: "capital-a-12" });
    // Le prix de l'investisseuse paraît moins cher au CMPC, mais ne lève pas tout le besoin.
    const a11 = resultatDeLaSuite({ dette: "in-fine", fonds: "capital-a-11" });
    expect(a11.structure.cmpc).toBeLessThan(meilleureSuite().structure.cmpc);
    expect([a11.couvert, a11.fin]).toEqual([false, "non-couvert"]);
  });
});

describe("le scénario « Le prix des ressources »", () => {
  gardesDuScenario(sc, "arbitrer-les-couts-de-financement");
});
