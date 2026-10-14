import { describe, expect, it } from "vitest";
import {
  APRES,
  AVANT,
  BASE,
  CAPTURE,
  D,
  GARDE_NORDAL,
  IMPREVUS,
  MCV,
  PERTE_DEREFERENCEMENT,
  PRIX_NET,
  PROFILS,
  REMISE,
  SEUIL_ROTATION,
  TRAINE_NORDAL,
  VALEUR_GONDOLE,
  VALEUR_POINT,
  VOL_NORDAL,
  hasard,
  margePromo,
  operationType,
  placeDuTrimestre,
  PLAFOND_LEGAL,
  saison,
  simuler,
  volumeAnnuel,
} from "../../src/engine/episodes/promotion-qui-coute";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/promotion-qui-coute";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_PROMOTION } from "../../src/pedagogy/episodes/promotion-qui-coute";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La promotion qui remplit les caddies » enseigne qu'une promotion
 * se juge sur sa marge incrémentale, pas sur son pic de ventes : les packs de
 * plus sont pris aux autres références et aux semaines suivantes, la remise
 * porte sur tout ce qui se serait vendu sans elle, la fréquence habitue au prix
 * promotionnel, le plafond légal borne ce qui est possible, et un test avec
 * témoins dit avant de généraliser si une remise recrute. Ces tests
 * verrouillent les classements qui le disent, et la cohérence des chiffres
 * donnés au joueur avec les constantes du modèle.
 */

const MEILLEUR = [2, 0, 0, 1, 1, 2];
const REFLEXE = [0, 1, 1, 0, 0, 0];
const ATTENTISTE = [1, 1, 3, 0, 3, 3];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne, à la décision d. */
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
const source = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
/** Un nombre écrit comme les sources l'écrivent : espace simple entre les milliers. */
const fr = (v: number, d = 0) =>
  v
    .toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })
    .replace(/[  ]/g, " ");
const euros2 = (v: number) => `${fr(v, 2)} €`;

describe("les chiffres donnés au joueur sont ceux du modèle", () => {
  it("la décomposition de l'opération de mars", () => {
    const p = PROFILS.deuxPlusUnFruits;
    const texte = source(0, "sorties");
    expect(texte).toContain(fr(BASE.celtis.fruits));
    expect(texte).toContain(fr((1 + p.lift) * BASE.celtis.fruits));
    expect(texte).toContain(`+${fr(p.lift * 100)} %`);
    expect(texte).toContain(fr(p.lift * BASE.celtis.fruits));
    for (const part of [p.c, p.s, p.i]) expect(texte).toContain(`${fr(part * 100)} %`);
    expect(p.c + p.s + p.i).toBeCloseTo(1, 9);
  });

  it("le compte d'une opération, et la prévision : −27,1 k€ pour le « 2+1 » de Celtis", () => {
    const texte = source(0, "compte");
    expect(texte).toContain(euros2(PRIX_NET.fruits));
    expect(texte).toContain(euros2(MCV.fruits));
    expect(texte).toContain(euros2(PRIX_NET.brasse));
    expect(texte).toContain(euros2(MCV.brasse));
    expect(texte).toContain(euros2(REMISE.deuxPlusUn * PRIX_NET.fruits));
    expect(texte).toContain(euros2(margePromo("deuxPlusUn", "fruits")));
    // La marge incrémentale de l'opération type, recalculée pas à pas.
    const o = operationType();
    const base = 2 * BASE.celtis.fruits;
    const enPlus = 1.8 * base;
    const vendue = (base + enPlus) * margePromo("deuxPlusUn", "fruits");
    const sans = (base + 0.3 * enPlus + 0.45 * enPlus) * 0.65;
    expect(o.marge).toBeCloseTo(vendue - sans - 3000, 6);
    expect(Math.round(o.marge / 100) / 10).toBe(-27.1);
    expect(EPISODE_PROMOTION.prevision.reel(simuler(MEILLEUR, 3))).toBeCloseTo(-27.116, 3);
    // Le joueur qui arrondit la marge d'un pack en promotion à 0,19 € tombe à moins de 3 k€.
    expect(Math.abs((base + enPlus) * 0.19 - sans - 3000 - o.marge)).toBeLessThan(3000);
  });

  it("le plafond légal de Celtis, et le bilan commercial avant-après", () => {
    const texte = source(0, "plafond");
    expect(texte).toContain(fr(PLAFOND_LEGAL * volumeAnnuel("celtis")));
    expect(texte).toContain(fr(AVANT.celtis));
    expect(texte).toContain(fr(APRES.celtis));
    expect(texte).toContain(fr(placeDuTrimestre("celtis")));
    // Les deux « 2+1 » du plan tiennent tout juste sous le plafond, chez chacune des trois enseignes.
    const plan = (e: "celtis" | "opaline" | "proxival", semaines: number[]) =>
      semaines.reduce((s, w) => s + 2.8 * BASE[e].fruits * saison(w), 0);
    expect(plan("celtis", [3, 4, 9, 10])).toBeLessThan(placeDuTrimestre("celtis"));
    expect(plan("celtis", [3, 4, 9, 10])).toBeGreaterThan(0.98 * placeDuTrimestre("celtis"));
    expect(plan("opaline", [7, 8, 11, 12])).toBeLessThan(placeDuTrimestre("opaline"));
    expect(plan("proxival", [5, 6, 11, 12])).toBeLessThan(placeDuTrimestre("proxival"));
    // Le chiffre d'affaires que les commerciaux mettent en avant.
    const b = 2 * BASE.celtis.fruits;
    const ca = 2.8 * b * PRIX_NET.fruits * (2 / 3) - b * PRIX_NET.fruits;
    expect(source(1, "avantapres")).toContain(`${fr(ca)} €`);
  });

  it("Nordal, l'habitude du prix promotionnel, la tête de gondole et la revue de gamme", () => {
    const fevrier = source(4, "fevrier");
    expect(fevrier).toContain(`${fr(VOL_NORDAL.min * 100)} et ${fr(VOL_NORDAL.max * 100)} %`);
    expect(fevrier).toContain(`${fr(Math.round(16 * TRAINE_NORDAL))} %`);
    expect(fevrier).toContain(`${fr(CAPTURE * 100)} %`);
    expect(Math.round(1 / GARDE_NORDAL)).toBe(7);
    expect(source(5, "habitude", { partPromo: "" })).toContain(
      `${fr(Math.round(VALEUR_POINT / 10) * 10)} €`,
    );
    expect(source(5, "gondole")).toContain(`${fr(Math.round(VALEUR_GONDOLE / 100) * 100)} €`);
    const f = 2.7 * (BASE.celtis.fruits + BASE.celtis.brasse + BASE.celtis.reste) * 1.08 * 2;
    expect(source(5, "place", { placeCeltis: "" })).toContain(`${fr(Math.round(f / 1000) * 1000)}`);
    const revue = source(3, "revue", { rotation: "" });
    expect(revue).toContain(fr(SEUIL_ROTATION));
    expect(revue).toContain(`${fr(Math.round(PERTE_DEREFERENCEMENT / 1000))} k€`);
    // La riposte : la remise porterait sur trois semaines de ventes de Celtis et d'Opaline.
    const base = (["celtis", "opaline"] as const).reduce(
      (s, e) => s + (BASE[e].fruits + BASE[e].brasse + BASE[e].reste) * 1.08 * 3,
      0,
    );
    expect(Math.round(base / 1000) * 1000).toBe(135000);
  });
});

describe("le modèle des promotions", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.ventes).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.ventes,
      6,
    );
    expect(simuler(MEILLEUR, 12).volNordal).toBe(simuler(ATTENTISTE, 12).volNordal);
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

  it("le Brassé recrute environ une fois sur deux", () => {
    const n = GRAINES_DU_BILAN.filter((g) => hasard(g).recrute).length;
    expect(n).toBeGreaterThanOrEqual(10);
    expect(n).toBeLessThanOrEqual(20);
  });

  it("le plafond légal borne le doublement : les centrales refusent ce qui dépasse", () => {
    const t = simuler(REFLEXE, 4);
    expect(t.plafondDepasse).toBe(true);
    expect(t.ops.filter((b) => b.acceptee === 0).length).toBeGreaterThanOrEqual(3);
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const x = simuler(c, g, JOURS);
        expect(x.partPromo).toBeLessThanOrEqual(PLAFOND_LEGAL + 0.02);
        for (const s of x.semaines.slice(1)) {
          expect(s!.plafond).toBeLessThanOrEqual(1 + 1e-9);
          expect(s!.ventes).toBeGreaterThan(10000);
          expect(s!.ventes).toBeLessThan(150000);
          expect(s!.service).toBeGreaterThan(0.85);
        }
        expect(x.objectif).toBeGreaterThan(-300000);
        expect(x.objectif).toBeLessThan(60000);
      }
    }
  });

  it("le « 2+1 » confirmé en juillet fait déréférencer le Brassé ; l'opération qui recrute le sauve", () => {
    const deref = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).dereference).length;
    expect(deref(ATTENTISTE)).toBe(30);
    expect(deref(MEILLEUR)).toBeLessThanOrEqual(3);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : recentrer sur le Brassé ; doubler est le pire ; la remise douce sur les fruits est la plus sûre", () => {
    const c = classement(MEILLEUR, D.plan);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.plan, 2, 1)).toBeGreaterThan(40000);
    expect(ecart(MEILLEUR, D.plan, 2, 3)).toBeGreaterThan(8000);
    // Espérance et robustesse : le Brassé est un pari, la remise douce sur les fruits ne l'est pas.
    const r = rejeu(MEILLEUR, D.plan);
    expect(r[3]!.p10).toBeGreaterThan(r[2]!.p10);
  });

  it("D2 : tester avec des témoins avant de généraliser ; l'avant-après ne suffit pas", () => {
    const c = classement(MEILLEUR, D.mesure);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(2);
    expect(ecart(MEILLEUR, D.mesure, 0, 1)).toBeGreaterThan(3000);
    // L'interaction : la mesure fait valoir la décision de juillet qui la suit.
    const sansTest = [2, 1, 0, 1, 1, 2];
    expect(ecart(MEILLEUR, D.juillet, 1, 2)).toBeGreaterThan(
      ecart(sansTest, D.juillet, 1, 2) + 5000,
    );
  });

  it("D3 : la prévision partagée bat les volumes des commerciaux, avec ou sans marge", () => {
    const c = classement(MEILLEUR, D.usine);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.usine, 0, 1)).toBeGreaterThan(3000);
    expect(ecart(MEILLEUR, D.usine, 0, 3)).toBeGreaterThan(8000);
  });

  it("D4 : suivre la mesure ; confirmer le « 2+1 » est le pire, tout annuler coûte aussi", () => {
    const c = classement(MEILLEUR, D.juillet);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.juillet, 1, 0)).toBeGreaterThan(80000);
    expect(ecart(MEILLEUR, D.juillet, 1, 3)).toBeGreaterThan(25000);
  });

  it("D5 : tenir le rayon sans baisser les prix ; riposter en « 2+1 » est le pire", () => {
    const c = classement(MEILLEUR, D.nordal);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.nordal, 1, 0)).toBeGreaterThan(60000);
    expect(ecart(MEILLEUR, D.nordal, 1, 3)).toBeGreaterThan(5000);
  });

  it("D6 : refuser la remise et échanger des dégustations contre la tête de gondole", () => {
    const c = classement(MEILLEUR, D.fin);
    expect(c[0]).toBe(2);
    expect(ecart(MEILLEUR, D.fin, 2, 0)).toBeGreaterThan(25000);
    expect(ecart(MEILLEUR, D.fin, 2, 3)).toBeGreaterThan(10000);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_PROMOTION, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}, option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option === o && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    for (const [d, o] of REFLEXES) expect(REFERENCES[0].chemin[d]).not.toBe(o);
  });

  it("juger sur la marge bat nettement le doublement et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(100000);
    expect(methode! - attentiste!).toBeGreaterThan(100000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["sorties", "compte"],
      ["temoins"],
      ["annonces"],
      ["chiffrage"],
      ["fevrier"],
      ["place", "habitude"],
    ],
    jours: 2.5,
    diagnostic: "decomposition",
    reevaluation: { choix: "maintient", principal: null },
    prevision: -27,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PROMOTION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a doublé et riposté, propose de juger une promotion sur sa marge", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_PROMOTION.comportements(p, analyser(EPISODE_PROMOTION, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PROMOTION.axe(c).titre).toBe(
      "Juger une promotion sur sa marge, pas sur son volume",
    );
  });

  it("à qui a décidé sans enquêter, propose de décomposer le pic", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PROMOTION.comportements(p, analyser(EPISODE_PROMOTION, p).trimestre);
    expect(EPISODE_PROMOTION.axe(c).titre).toBe("Décomposer le pic avant de le juger");
  });

  it("calibre la prévision sur la marge de l'opération type", () => {
    const t = simuler(MEILLEUR, 11, 2.5);
    expect(EPISODE_PROMOTION.comportements(partie(MEILLEUR), t)[3]!.score).toBe(1);
    const volume = EPISODE_PROMOTION.comportements(partie(MEILLEUR, { prevision: 27 }), t);
    expect(volume[3]!.score).toBe(0);
    expect(EPISODE_PROMOTION.comportements(partie(MEILLEUR), t)[4]!.score).toBe(1);
    expect(EPISODE_PROMOTION.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/plan signé/);
  });
});
