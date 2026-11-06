import { describe, expect, it } from "vitest";
import type { EtapeDeClassement } from "../../src/config/cours/bureaux/types";
import { LA_NOTE_DE_L_ANALYSTE as e, grilleDesChiffresJustes } from "../../src/config/cours/enquetes/la-note-de-l-analyste";
import { noteDeLAnalyste } from "../../src/config/cours/monde/note-de-l-analyste";
import { gardesDuBureau } from "../helpers/activites-du-lot-c";

/**
 * L'ENQUÊTE « LA NOTE DE L'ANALYSTE » (monde/note-de-l-analyste.ts) : les chiffres justes de
 * l'obligation et de l'action refaits à la main, ceux de l'analyste aussi, puis les gardes du lot C.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const n = noteDeLAnalyste();

describe("la note de l'analyste : chaque chiffre à la main", () => {
  it("neuf affirmations, trois justes, six fausses de six natures", () => {
    expect(n.affirmations).toHaveLength(9);
    expect(n.affirmations.filter((a) => a.nature === "juste").map((a) => a.code)).toEqual(["emission", "action", "esperance"]);
    expect(new Set(n.affirmations.filter((a) => a.nature !== "juste").map((a) => a.nature)).size).toBe(6);
  });

  it("l'obligation : 40 € de coupon, 964,54 € à 5 % sur 4 ans, 5,42 % de rendement actuariel à 950 €", () => {
    expect(n.coupon).toBe(1_000 * 0.04);
    const va = (t: number) => c(40 * ((1 - (1 + t) ** -4) / t) + 1_000 * (1 + t) ** -4);
    expect(n.coursAuTauxDuMarche).toBe(va(0.05));
    // Le rendement actuariel : le taux qui fait valoir 950 € aux flux qui restent.
    expect(Math.abs(va(n.rendementActuariel) - 950)).toBeLessThan(0.05);
    expect(n.rendementActuarielEnPourcent).toBe(5.42);
    expect(n.rendementCourant).toBe(40 / 950);
  });

  it("ce que l'analyste a écrit : 38 € sur le cours, 1 000 € au taux nominal", () => {
    expect(n.analyste.couponSurLeCours).toBe(950 * 0.04);
    expect(n.analyste.coursAuTauxNominal).toBe(1_000);
  });

  it("l'action : 1,20 € ÷ (9 % − 3 %) = 20 € ; à 10 %, 17,14 €", () => {
    expect(n.coursDeLAction).toBe(c(1.2 / (0.09 - 0.03)));
    expect(n.apresLaHausse).toBe(c(1.2 / (0.1 - 0.03)));
  });

  it("le risque : 9 % d'espérance, 99 de variance, 9,95 points d'écart-type", () => {
    expect(n.risque.esperance).toBe(c(0.25 * -6 + 0.5 * 10 + 0.25 * 22));
    expect(n.risque.variance).toBe(c(0.25 * 15 ** 2 + 0.5 * 1 ** 2 + 0.25 * 13 ** 2));
    expect(n.ecartTypeArrondi).toBe(c(Math.sqrt(99)));
    expect(grilleDesChiffresJustes().lignes.map((l) => l.cellules[0]!.valeur)).toEqual([40, 964.54, 5.42, 17.14, 9.95]);
  });

  it("le tri range chaque affirmation à sa nature", () => {
    const tri = e.etapes[0] as EtapeDeClassement;
    expect(tri.elements.map((x) => x.categorie)).toEqual(n.affirmations.map((a) => a.nature));
    expect(tri.categories.filter((k) => !tri.elements.some((x) => x.categorie === k.code)).length).toBe(2);
  });
});

describe("l'enquête « La note de l'analyste »", () => {
  gardesDuBureau(e, "le-marche-financier");
});
