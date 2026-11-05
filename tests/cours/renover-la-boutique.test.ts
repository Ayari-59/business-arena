import { describe, expect, it } from "vitest";
import { RENOVER_LA_BOUTIQUE, SOLUTION_DU_LABORATOIRE } from "../../src/config/cours/chapitres/renover-la-boutique";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { UN_PRET_SUR_SEPT_ANS } from "../../src/config/cours/situations/par-chapitre/un-pret-sur-sept-ans";
import { attendus, casDedie, centime, curseur, juste, laboratoire, verifierLesTextes } from "./gardes-de-la-gestion-de-la-boutique";

/**
 * RÉNOVER LA BOUTIQUE, ET SON CAS : UN PRÊT SUR SEPT ANS.
 *
 * Le projet refait à la main : 30 000 € amortis sur 5 ans, 500 articles en plus à 28,30 € de marge (le
 * prix moyen de N − 1 moins le coût d'achat et les autres coûts variables), 1 800 € d'abonnement, 25 %
 * d'impôt, la marge de 5 jours d'un mois comme janvier perdue l'année 1 (44 250 € × 5 ÷ 30), la VAN à
 * 8 %, le taux qui l'annule, l'emprunt à annuités constantes, le crédit-bail. Puis les gardes de texte.
 */

const flux = (articles: number, perte: number) => {
  const normal = (articles * 28.3 - 1_800 - 6_000) * 0.75 + 6_000;
  return [centime((articles * 28.3 - 1_800 - 6_000 - perte) * 0.75 + 6_000), ...Array.from({ length: 4 }, () => centime(normal))];
};
const van = (fl: number[], t: number) => fl.reduce((s, x, i) => s + centime(x * (1 + t) ** -(i + 1)), 0) - 30_000;
const perte5 = (44_250 * 5) / 30;
const perte3 = (44_250 * 3) / 30 + 2_500;

describe("rénover la boutique", () => {
  const ch = RENOVER_LA_BOUTIQUE;
  const fl = flux(500, perte5);

  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, bloc 3, et le cas est le sien", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier, ch.blocs]).toEqual(["mco", 4, ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"]]);
    expect(PROGRAMME.mco[4]).toContain(ch.titre);
    expect(SITUATIONS).toContain(UN_PRET_SUR_SEPT_ANS);
    expect([perte5, fl]).toEqual([7_375, [5_231.25, 10_762.5, 10_762.5, 10_762.5, 10_762.5]]);
  });

  it("les flux, l'année des travaux, le délai de récupération", () => {
    expect(attendus(ch, "les-flux")).toEqual({ "Amortissement annuel": 6_000, "Marge des articles en plus": 14_150, "Résultat en plus avant impôt": 6_350, Impôt: 1_587.5, "Flux net de trésorerie": 10_762.5 });
    expect(attendus(ch, "l-annee-des-travaux")).toEqual({ "Résultat en plus avant impôt, année 1": -1_025, "Impôt, année 1": -256.25, "Flux net de trésorerie, année 1": 5_231.25 });
    const cumul3 = fl[0]! + fl[1]! + fl[2]!;
    expect(attendus(ch, "le-delai")).toEqual({ "Cumul des flux, fin de l'année 3": cumul3, "Reste à récupérer": 30_000 - cumul3, "Délai de récupération (années)": centime(3 + (30_000 - cumul3) / fl[3]!) });
  });

  it("la VAN, le taux qui l'annule, le laboratoire de la borne", () => {
    expect(centime(van(fl, 0.08))).toBe(7_850.02);
    const a = attendus(ch, "la-van");
    expect(a["Valeur actuelle nette"]).toBe(7_850.02);
    expect(a["Indice de profitabilité"]).toBe(centime((7_850.02 + 30_000) / 30_000));
    expect(juste(ch, "predire-la-van")).toBe("Moins que leur somme, mais plus que l'investissement");
    const t = Array.from({ length: 26 }, (_, i) => i).filter((i) => van(fl, i / 100) >= 0).at(-1);
    expect(t).toBe(16);
    expect(curseur(ch, "le-taux-au-curseur").attendu).toBe(16);
    const l = laboratoire(ch, "le-laboratoire-de-la-borne");
    expect(SOLUTION_DU_LABORATOIRE).toEqual({ articles: 405, jours: 3 });
    expect(l.reussi).toEqual([false, true]);
    for (const q of [400, 405, 410]) {
      for (const j of [3, 5]) expect(l.atteint({ articles: q, jours: j }), `${q} ${j}`).toBe(q <= 405 && van(flux(q, j === 3 ? perte3 : perte5), 0.08) >= -0.05);
    }
    expect([van(flux(405, perte3), 0.08) > 0, van(flux(405, perte5), 0.08) < 0]).toEqual([true, true]);
  });

  it("la variante, l'emprunt, le crédit-bail, la décision", () => {
    const v = flux(300, perte5);
    expect(attendus(ch, "la-borne-qui-vend-moins")["Flux net d'une année normale"]).toBe(v[1]);
    expect(attendus(ch, "la-borne-qui-vend-moins")["Valeur actuelle nette"]).toBeLessThan(0);
    const annuite = centime((30_000 * 0.045) / (1 - 1.045 ** -5));
    expect(annuite).toBe(6_833.75);
    expect(attendus(ch, "l-emprunt")).toEqual({ Annuité: annuite, "Intérêts de l'année 1": 1_350, "Capital remboursé l'année 1": centime(annuite - 1_350), "Coût du crédit": centime(5 * annuite - 30_000) });
    expect(attendus(ch, "le-credit-bail")).toEqual({ "Total versé": 36_050, "Surcoût du crédit-bail": 6_050 });
    expect(juste(ch, "le-delai-ne-suffit-pas")).toMatch(/^Le délai dit quand l'argent revient/);
    // Après le dividende de 320 000 €, la trésorerie paie la rénovation et garde plus de deux mois de charges.
    expect(juste(ch, "decider")).toBe(`Investir, et payer sur la trésorerie : il en resterait 74 868,20 €`);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : un prêt sur sept ans", () => {
  const s = UN_PRET_SUR_SEPT_ANS;

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, RENOVER_LA_BOUTIQUE);
    expect(s.commanditaire).toBe("Le gérant");
  });

  it("la VAN à 10 %, les deux prêts, les ventes qu'il faut : refaits à la main", () => {
    const fl = flux(500, perte5);
    const v10 = centime(van(fl, 0.1));
    expect(attendus(s, "la-van-a-dix")["Valeur actuelle nette"]).toBe(v10);
    expect(v10).toBeGreaterThan(0);
    const a7 = centime((30_000 * 0.049) / (1 - 1.049 ** -7));
    // Le tableau à la main : intérêts sur le capital dû, la dernière annuité solde le capital.
    let du = 30_000;
    let cout7 = 0;
    for (let i = 0; i < 7; i++) {
      const interets = centime(du * 0.049);
      cout7 = centime(cout7 + interets);
      du = i === 6 ? 0 : centime(du - centime(a7 - interets));
    }
    expect(attendus(s, "les-deux-prets")).toEqual({ "Annuité sur 7 ans": a7, "Coût du prêt sur 7 ans": cout7, "Coût en plus du prêt long": centime(cout7 - 4_168.75) });
    const n = Array.from({ length: 401 }, (_, i) => 300 + i).find((q) => van(flux(q, perte5), 0.1) >= 0);
    expect(curseur(s, "les-ventes-qu-il-faut").attendu).toBe(n);
    expect(juste(s, "reponse")).toMatch(/^Rénover, avec le prêt sur 5 ans/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
