import { describe, expect, it } from "vitest";
import { LA_LIGNE_EN_CREDIT_BAIL as sc } from "../../src/config/cours/scenarios/la-ligne-en-credit-bail";
import { van } from "../../src/config/cours/monde/finance";
import { CONTRE_OFFRES, creditBailMoinsCher, lectureDe, lectureDeLEmprunt, meilleureSuite, resultatDeLaSuite, toutesLesSuites } from "../../src/config/cours/monde/ligne-en-credit-bail";
import { gardesDuScenario } from "../helpers/activites-du-lot-c";

/**
 * LE SCÉNARIO « LA LIGNE EN CRÉDIT-BAIL » (monde/ligne-en-credit-bail.ts) : les flux du crédit-bail après
 * impôt refaits à la main pour chaque contre-offre, ce que chaque méthode en dit, la meilleure suite, puis
 * les gardes communes du lot C.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
/** Les flux d'un crédit-bail de la ligne, du côté de NOVA, refaits à la main : 150 000 €, amortie sur 6 ans, impôt à 25 %. */
function fluxALaMain(redevance: number, option: number, depot: number) {
  const perdue = (150_000 / 6) * 0.25;
  return [150_000 - depot, ...[1, 2, 3, 4].map(() => -redevance * 0.75 - perdue), -redevance * 0.75 - perdue - option + depot, -perdue + option * 0.25];
}

describe("la ligne en crédit-bail : chaque chiffre à la main", () => {
  it("l'emprunt : 150 000 € en cinq parts, 22 500 € d'intérêts, 3,75 % après impôt", () => {
    const e = lectureDeLEmprunt();
    expect(e.totalPaye).toBe(150_000 + 0.05 * (150_000 + 120_000 + 90_000 + 60_000 + 30_000));
    expect(e.coutApresImpot).toBeCloseTo(0.05 * 0.75, 12);
    expect(e.van).toBe(0);
  });

  it("la VAN de chaque offre, au coût de l'emprunt après impôt, refaite flux par flux", () => {
    const offres = [{ redevance: 33_000, option: 15_000, depot: 0 }, ...Object.values(CONTRE_OFFRES)];
    for (const o of offres) {
      const l = lectureDe(o);
      expect(l.van, JSON.stringify(o)).toBeCloseTo(van(fluxALaMain(o.redevance, o.option, o.depot), 0.0375), 1);
      expect(l.totalPaye).toBe(5 * o.redevance + o.option);
    }
    expect(c(lectureDe().van)).toBe(-3_463.81);
    expect(c(lectureDe(CONTRE_OFFRES.depot).van)).toBe(-605.73);
    expect(c(lectureDe(CONTRE_OFFRES["option-haute"]).van)).toBe(206.62);
    expect(c(lectureDe(CONTRE_OFFRES["option-basse"]).van)).toBe(16.77);
  });

  it("les méthodes se trompent chacune quelque part : la somme payée retient le dépôt et écarte l'option haute", () => {
    const d = lectureDe(CONTRE_OFFRES.depot);
    const h = lectureDe(CONTRE_OFFRES["option-haute"]);
    const b = lectureDe(CONTRE_OFFRES["option-basse"]);
    expect([creditBailMoinsCher("decaissements", d), creditBailMoinsCher("van", d)]).toEqual([true, false]);
    expect([creditBailMoinsCher("decaissements", h), creditBailMoinsCher("van", h)]).toEqual([false, true]);
    expect([creditBailMoinsCher("avant-impot", b), creditBailMoinsCher("van", b)]).toEqual([false, true]);
  });

  it("vingt-sept suites, trois fins, une meilleure : la VAN, l'option haute, signée", () => {
    expect(toutesLesSuites()).toHaveLength(27);
    expect(new Set(toutesLesSuites().map((s) => resultatDeLaSuite(s).fin))).toEqual(new Set(["plus-cher", "economie-manquee", "le-moins-cher"]));
    expect(meilleureSuite().suite).toEqual({ methode: "van", contreOffre: "option-haute", signature: "contre-offre" });
    expect(resultatDeLaSuite({ methode: "decaissements", contreOffre: "depot", signature: "contre-offre" }).fin).toBe("plus-cher");
    expect(resultatDeLaSuite({ methode: "van", contreOffre: "option-haute", signature: "emprunt" }).fin).toBe("economie-manquee");
  });
});

describe("le scénario « La ligne en crédit-bail »", () => {
  gardesDuScenario(sc, "emprunt-ou-credit-bail");
});
