import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  hasard,
  risqueRetrait,
  simuler,
} from "../../src/engine/episodes/site-qui-ne-vend-pas";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/site-qui-ne-vend-pas";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_NUMERIQUE } from "../../src/pedagogy/episodes/site-qui-ne-vend-pas";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le site qui ne vend pas » enseigne trois choses : corriger
 * l'étape où l'on perd les clients rapporte plus qu'acheter des visites, des
 * équipes qui perdent à votre succès le freinent tant que leurs incitations
 * ne changent pas, et un changement se teste avant de se généraliser. Ces
 * tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 0, 1, 1, 1, 1];
const TRAFIC = [0, 2, 0, 0, 0, 2];
const ATTENTISTE = [3, 3, 3, 3, 3, 3];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));

describe("le modèle du site de commande", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.visites).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.visites,
      6,
    );
    expect(hasard(5)).toBe(hasard(5));
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
      for (const i of hasard(g).imprevus) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("réparer l'entonnoir fait passer la conversion au-dessus de 1,5 % ; l'attente la laisse sous 1 %", () => {
    expect(simuler(MEILLEUR, 3).semaines[13]!.conversion).toBeGreaterThan(0.015);
    expect(simuler(ATTENTISTE, 3).semaines[13]!.conversion).toBeLessThan(0.01);
    for (const g of GRAINES_DU_BILAN) {
      for (const s of simuler(TRAFIC, g).semaines.slice(1)) {
        expect(s!.commandes).toBeGreaterThan(20);
        expect(s!.commandes).toBeLessThan(260);
      }
    }
  });

  it("la publicité achetée gonfle les visites, pas la conversion", () => {
    const pub = simuler([0, 3, 3, 3, 3, 3], 4).semaines[5]!;
    const rien = simuler(ATTENTISTE, 4).semaines[5]!;
    expect(pub.visites).toBeGreaterThan(rien.visites * 1.15);
    expect(pub.conversion).toBeLessThan(rien.conversion);
  });

  it("le retrait en deux heures rate bien plus souvent quand les comptoirs n'y gagnent rien", () => {
    expect(risqueRetrait(MEILLEUR)).toBeLessThan(risqueRetrait([1, 3, 1, 1, 1, 1]));
    const rates = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).retraitRate).length;
    expect(rates([1, 3, 1, 1, 1, 1])).toBeGreaterThan(rates(MEILLEUR) + 5);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : corriger les blocages est de loin le meilleur choix ; publicité et refonte font pire qu'attendre", () => {
    const r = rejeu(MEILLEUR, D.entonnoir);
    expect(classement(MEILLEUR, D.entonnoir)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu);
    expect(r[2]!.attendu).toBeLessThan(r[3]!.attendu);
  });

  it("D2 : attribuer la vente aux agences est le meilleur choix, et vaut plus une fois l'entonnoir réparé", () => {
    expect(classement(MEILLEUR, D.agences)[0]).toBe(0);
    expect(classement(MEILLEUR, D.agences).at(-1)).toBe(2);
    const gain = (chemin: readonly number[]) => {
      const r = rejeu(chemin, D.agences);
      return r[0]!.attendu - r[3]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([3, 0, 1, 1, 1, 1]) + 5000);
  });

  it("D3 : tester le tunnel est le meilleur pari, le petit correctif le plus sûr, le déploiement aveugle un mauvais choix", () => {
    const r = rejeu(MEILLEUR, D.tunnel);
    expect(classement(MEILLEUR, D.tunnel)[0]).toBe(1);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[2]!.p10);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.p10).toBeLessThan(r[3]!.p10);
  });

  it("D4 : relancer les comptes inscrits bat la publicité, et tripler la publicité est le pire", () => {
    const c = classement(MEILLEUR, D.publicite);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
  });

  it("D5 : le retrait en agence est le meilleur choix si les comptoirs y gagnent ; la remise est la pire", () => {
    const c = classement(MEILLEUR, D.printemps);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    // Sans attribution, le retrait ne vaut presque plus rien de plus que ne rien lancer.
    const sans = rejeu([1, 3, 1, 1, 1, 1], D.printemps);
    const avec = rejeu(MEILLEUR, D.printemps);
    expect(avec[1]!.attendu - avec[3]!.attendu).toBeGreaterThan(
      sans[1]!.attendu - sans[3]!.attendu + 5000,
    );
    expect(sans[1]!.p10).toBeLessThan(sans[3]!.p10);
  });

  it("D6 : présenter l'entonnoir bat la rallonge, l'attente et surtout la coupe", () => {
    const r = rejeu(MEILLEUR, D.comite);
    expect(classement(MEILLEUR, D.comite)[0]).toBe(1);
    expect(classement(MEILLEUR, D.comite).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
  });

  it("réparer l'entonnoir et aligner les agences bat l'achat de trafic et l'attentisme, en moyenne", () => {
    const [methode, trafic, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(attentiste! + 50000);
    expect(attentiste).toBeGreaterThan(trafic!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["entonnoir", "artisans"],
      ["cannibalisation"],
      ["abandons"],
      ["canaux"],
      ["retraits"],
      ["dossier"],
    ],
    jours: JOURS,
    diagnostic: "entonnoir",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 80,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_NUMERIQUE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a acheté du trafic partout, propose de réparer l'entonnoir plutôt que le remplir", () => {
    const p = partie(TRAFIC);
    const c = EPISODE_NUMERIQUE.comportements(p, analyser(EPISODE_NUMERIQUE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_NUMERIQUE.axe(c).titre).toBe("Réparer l'entonnoir plutôt que le remplir");
  });

  it("à qui a décidé sans enquêter, propose de mesurer l'entonnoir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_NUMERIQUE.comportements(p, analyser(EPISODE_NUMERIQUE, p).trimestre);
    expect(EPISODE_NUMERIQUE.axe(c).titre).toBe("Mesurer l'entonnoir avant d'agir");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_NUMERIQUE.bilan.titre(simuler(MEILLEUR, 2))).toMatch(/au-dessus du budget/);
    expect(EPISODE_NUMERIQUE.bilan.titre(simuler(ATTENTISTE, 2))).toMatch(/sous le budget/);
  });

  it("le comité laissé à lui-même répond selon le hasard, et coupe parfois", () => {
    const reponses = GRAINES_DU_BILAN.map(
      (g) => EPISODE_NUMERIQUE.reactions(D.comite, 3, g)![0]!.texte,
    );
    expect(new Set(reponses).size).toBe(2);
    expect(EPISODE_NUMERIQUE.reactions(D.comite, 1, 1)).toBeNull();
  });
});
