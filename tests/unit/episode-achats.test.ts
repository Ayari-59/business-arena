import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceIndexation,
  hasard,
  risqueVallet,
  simuler,
} from "../../src/engine/episodes/fournisseur-qui-augmente";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/fournisseur-qui-augmente";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_ACHATS } from "../../src/pedagogy/episodes/fournisseur-qui-augmente";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le fournisseur qui augmente » enseigne trois choses : on ne
 * négocie qu'avec une solution de repli visible, une hausse se décompose et
 * sa part énergie s'indexe, et le prix facial d'un fournisseur n'est pas son
 * coût complet. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 0, 0, 0];
const BASCULER = [2, 2, 2, 1, 0, 3];
const ATTENTISTE = [3, 3, 2, 2, 2, 2];
const JOURS = 2;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
const plusSur = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;

describe("le modèle de la famille plâtrerie-isolation", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12, 1).semaines[1]!.margeSemaine).toBeCloseTo(
      simuler(BASCULER, 12, 1).semaines[1]!.margeSemaine,
      6,
    );
    expect(simuler(MEILLEUR, 12).gazFin).toBe(simuler(ATTENTISTE, 12).gazFin);
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

  it("la bonne méthode tient le prix et les livraisons ; l'attente garde les 12 %", () => {
    const t = simuler(MEILLEUR, 3);
    expect(t.hausseMoyenne).toBeLessThan(0.1);
    expect(t.conformesMoyen).toBeGreaterThan(0.95);
    expect(simuler(ATTENTISTE, 3).hausseMoyenne).toBeCloseTo(0.12, 2);
  });

  it("tout basculer chez Brévent fait partir Constructions Vallet bien plus souvent", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).valletPart).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(BASCULER)).toBeGreaterThan(10);
    expect(risqueVallet(0)).toBe(0);
    expect(risqueVallet(0.2)).toBeGreaterThan(0.7);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : décomposer et essayer Brévent ; accepter ou tout basculer coûte cher", () => {
    const r = rejeu(MEILLEUR, D.annonce);
    expect(classement(MEILLEUR, D.annonce)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("D2 : l'indexation est la meilleure en moyenne, le prix ferme le plus sûr", () => {
    expect(classement(MEILLEUR, D.negociation)[0]).toBe(1);
    expect(plusSur(MEILLEUR, D.negociation)).toBe(0);
    const r = rejeu(MEILLEUR, D.negociation);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D2 : sans solution de repli, on cède ; avec, on négocie", () => {
    expect(chanceIndexation(MEILLEUR)).toBeGreaterThan(chanceIndexation(ATTENTISTE));
    expect(classement(ATTENTISTE, D.negociation)[0]).toBe(3);
    expect(classement(MEILLEUR, D.negociation).indexOf(3)).toBeGreaterThan(1);
  });

  it("D3 : répercuter en partie bat tout répercuter, et ne rien répercuter est le pire", () => {
    const c = classement(MEILLEUR, D.prixVente);
    expect(c).toEqual([1, 0, 2]);
    const r = rejeu(MEILLEUR, D.prixVente);
    expect(r[1]!.p10).toBeGreaterThan(r[0]!.p10);
  });

  it("D4 : 30 % chez un Brévent essayé ; tout lui confier est le pire ; sans essai, mieux vaut peu", () => {
    const c = classement(MEILLEUR, D.repartition);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
    expect(classement(ATTENTISTE, D.repartition)[0]).toBe(3);
  });

  it("D5 : un second fournisseur rodé passe l'arrêt de Placova mieux que le stock ou l'attente", () => {
    const c = classement(MEILLEUR, D.arret);
    expect(c[0]).toBe(0);
    expect(c.indexOf(2)).toBeGreaterThan(c.indexOf(1));
  });

  it("D6 : réclamer les avoirs, dossiers à l'appui, bat le geste, la compensation et l'oubli", () => {
    const c = classement(MEILLEUR, D.avoirs);
    expect(c[0]).toBe(0);
    expect(c.indexOf(2)).toBeGreaterThan(c.indexOf(0));
  });

  it("décomposer, qualifier, indexer bat le basculement et l'attente, en moyenne", () => {
    const [methode, basculer, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - basculer!).toBeGreaterThan(30000);
    expect(methode! - attente!).toBeGreaterThan(30000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["decomposition", "brevent"],
      ["gaz"],
      ["ferrat"],
      ["livraisons"],
      ["capacite"],
      ["bons"],
    ],
    jours: JOURS,
    diagnostic: "levier",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 9,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_ACHATS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tout basculé, propose de ne ni céder ni tout basculer", () => {
    const p = partie(BASCULER);
    const c = EPISODE_ACHATS.comportements(p, analyser(EPISODE_ACHATS, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_ACHATS.axe(c).titre).toBe("Ni céder, ni tout basculer");
  });

  it("à qui a décidé sans enquêter, propose de regarder de quoi est faite la hausse", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ACHATS.comportements(p, analyser(EPISODE_ACHATS, p).trimestre);
    expect(EPISODE_ACHATS.axe(c).titre).toBe("Regarder de quoi est faite la hausse");
  });

  it("dit le résultat en marge et en écart au budget", () => {
    expect(EPISODE_ACHATS.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
