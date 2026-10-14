import { describe, expect, it } from "vitest";
import {
  BUDGET,
  D,
  IMPREVUS,
  chanceDeCapitaliser,
  hasard,
  risqueNiveleur,
  simuler,
} from "../../src/engine/episodes/budget-qui-ne-tient-pas";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/budget-qui-ne-tient-pas";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_BUDGET } from "../../src/pedagogy/episodes/budget-qui-ne-tient-pas";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le budget qui ne tient pas » enseigne trois choses : ce qui est
 * engagé coûte avant d'être facturé, une coupe aveugle dans l'entretien se
 * paie en pannes, et un dépassement annoncé tôt se négocie quand une surprise
 * se subit. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [2, 0, 0, 0, 0, 1];
const REFLEXE = [0, 1, 1, 1, 3, 2];
const ATTENTISTE = [3, 3, 3, 3, 2, 3];
/** Sans l'analyse de la semaine 1, mais avec de bonnes décisions ensuite. */
const SANS_ANALYSE = [3, 3, 0, 0, 0, 1];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne sur les trente tirages. */
const gain = (chemin: readonly number[], d: number, option: number, contre: number) => {
  const r = rejeu(chemin, d);
  return r[option]!.attendu - r[contre]!.attendu;
};

describe("le modèle des services généraux", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.energie).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.energie,
      6,
    );
    expect(simuler(MEILLEUR, 12).semaines[1]!.pannes).toBe(
      simuler(REFLEXE, 12).semaines[1]!.pannes,
    );
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("l'engagé dépasse de loin le facturé, et la projection sur le facturé sous-estime le dépassement", () => {
    for (const g of [1, 5, 9]) {
      const t = simuler(ATTENTISTE, g);
      expect(t.semaines[3]!.engage).toBeGreaterThan(5 * t.semaines[3]!.facture);
      // En semaine 3, l'outil annonce bien moins que ce que le trimestre coûtera.
      expect(t.semaines[3]!.projection - (BUDGET - t.depenses)).toBeGreaterThan(15000);
      // À la clôture, des dépenses réalisées n'ont toujours pas de facture.
      expect(t.nonFacture).toBeGreaterThan(5000);
    }
  });

  it("les coupes aveugles multiplient les pannes et le risque de casser le niveleur", () => {
    const pannes = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).pannes));
    expect(pannes(REFLEXE)).toBeGreaterThan(1.8 * pannes(MEILLEUR));
    expect(risqueNiveleur(REFLEXE)).toBeGreaterThan(3 * risqueNiveleur(MEILLEUR));
  });

  it("la bonne méthode finit près du budget ; l'attente le dépasse nettement, sans exploser", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(-5000);
    expect(attendu(ATTENTISTE)).toBeLessThan(-35000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-0.3 * BUDGET);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : analyser l'engagé avant de couper bat de loin la coupe uniforme et le gel", () => {
    const r = rejeu(MEILLEUR, D.economies);
    expect(classement(MEILLEUR, D.economies)[0]).toBe(2);
    expect(r[2]!.attendu - Math.max(r[0]!.attendu, r[1]!.attendu)).toBeGreaterThan(20000);
    // Couper partout ou geler fait pire que ne rien faire.
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu);
    expect(r[1]!.attendu).toBeLessThan(r[3]!.attendu);
  });

  it("D2 : reprévoir tôt paie, et bien plus quand l'engagé a été analysé en semaine 1", () => {
    expect(classement(MEILLEUR, D.reprevision)[0]).toBe(0);
    expect(classement(SANS_ANALYSE, D.reprevision)[0]).toBe(0);
    expect(chanceDeCapitaliser(MEILLEUR)).toBeGreaterThan(chanceDeCapitaliser([3, 0]));
    expect(gain(MEILLEUR, D.reprevision, 0, 3)).toBeGreaterThan(
      2 * gain(SANS_ANALYSE, D.reprevision, 0, 3),
    );
    // Présenter le chiffre rassurant de l'outil ne vaut pas mieux que se taire.
    expect(gain(MEILLEUR, D.reprevision, 0, 1)).toBeGreaterThan(15000);
  });

  it("D3 : reprogrammer la GTB bat la baisse des consignes partout", () => {
    expect(classement(MEILLEUR, D.energie)[0]).toBe(0);
    expect(gain(MEILLEUR, D.energie, 0, 1)).toBeGreaterThan(3000);
  });

  it("D4 : contester le prestataire rapporte le plus en moyenne ; la remise est la plus sûre", () => {
    for (const chemin of [MEILLEUR, ATTENTISTE]) {
      const r = rejeu(chemin, D.prestataire);
      expect(classement(chemin, D.prestataire)[0]).toBe(0);
      expect(Math.max(...r.map((x) => x.p10))).toBe(r[2]!.p10);
    }
    expect(classement(MEILLEUR, D.prestataire).at(-1)).toBe(1);
  });

  it("D5 : la révision vaut surtout quand l'entretien a été coupé ; la location protège", () => {
    expect(classement(MEILLEUR, D.pannes)[0]).toBe(0);
    expect(classement(REFLEXE, D.pannes)[0]).toBe(0);
    expect(gain(REFLEXE, D.pannes, 0, 2)).toBeGreaterThan(5 * gain(MEILLEUR, D.pannes, 0, 2));
    const r = rejeu(SANS_ANALYSE, D.pannes);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
  });

  it("D6 : décaler les factures ne change rien ; arrêter le non-engagé bat le gel total", () => {
    const r = rejeu(MEILLEUR, D.cloture);
    expect(classement(MEILLEUR, D.cloture)[0]).toBe(1);
    expect(r[0]!.attendu).toBeCloseTo(r[3]!.attendu, 6);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2000);
    expect(r[2]!.p10).toBeLessThan(r[1]!.p10);
  });

  it("analyser, protéger, reprévoir tôt bat le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(40000);
    expect(methode! - attentiste!).toBeGreaterThan(30000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["rapprochement", "pannes"],
      ["investissement"],
      ["courbe"],
      ["contrat"],
      ["parc"],
      ["fnp"],
    ],
    jours: JOURS,
    diagnostic: "engagements",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 60,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_BUDGET, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a coupé partout et gelé, propose de couper poste par poste", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_BUDGET.comportements(p, analyser(EPISODE_BUDGET, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_BUDGET.axe(c).titre).toBe("Couper poste par poste, pas partout");
  });

  it("à qui a décidé sans enquêter, propose de regarder ce qui est déjà engagé", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_BUDGET.comportements(p, analyser(EPISODE_BUDGET, p).trimestre);
    expect(EPISODE_BUDGET.axe(c).titre).toBe("Regarder ce qui est déjà engagé");
  });

  it("à qui a laissé la clôture découvrir le dépassement, propose de prévenir tôt", () => {
    const p = partie(ATTENTISTE);
    const c = EPISODE_BUDGET.comportements(p, analyser(EPISODE_BUDGET, p).trimestre);
    expect(EPISODE_BUDGET.axe(c).titre).toBe("Prévenir tôt");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_BUDGET.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_BUDGET.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });
});
