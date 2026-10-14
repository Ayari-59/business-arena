import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceQueMathieuReste,
  hasard,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/equipe-qui-s-epuise";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/equipe-qui-s-epuise";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_EQUIPE } from "../../src/pedagogy/episodes/equipe-qui-s-epuise";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'équipe qui s'épuise » enseigne trois choses : couper ce qui
 * remplit la file soulage plus que tout effort supplémentaire, la pression
 * sur l'équipe se paie plus tard en absences et en départs, et une tension
 * laissée à elle-même coûte. Ces tests verrouillent les classements qui le
 * disent.
 */

const MEILLEUR = [1, 3, 1, 2, 0, 1];
const PRESSION = [0, 2, 2, 1, 2, 0];
const ATTENTISTE = [3, 2, 3, 3, 3, 2];
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

describe("le modèle du service client", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.delai).toBeCloseTo(
      simuler(PRESSION, 12).semaines[1]!.delai,
      6,
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

  it("les bonnes décisions ramènent le délai sous l'objectif ; l'attente le laisse filer", () => {
    expect(simuler(MEILLEUR, 3).delaiFinal).toBeLessThan(2);
    expect(simuler(ATTENTISTE, 3).delaiFinal).toBeGreaterThan(5);
  });

  it("la pression sur l'équipe fait partir Inès bien plus souvent", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).inesPart).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(PRESSION)).toBeGreaterThan(10);
    expect(risqueDeDepart(0.4)).toBe(0);
    expect(risqueDeDepart(1)).toBeGreaterThan(0.8);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : couper les relances est de loin le meilleur choix ; la pression ne paie pas", () => {
    const r = rejeu(MEILLEUR, D.file);
    expect(classement(MEILLEUR, D.file)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(30000);
  });

  it("D2 : retenir Mathieu marche quand la file a été soulagée ; sinon, le CDI est le plus sûr", () => {
    const sansSoulager = [3, 3, 1, 2, 0, 1];
    expect(chanceQueMathieuReste(MEILLEUR)).toBeGreaterThan(chanceQueMathieuReste(sansSoulager));
    expect(classement(MEILLEUR, D.mathieu)[0]).toBe(3);
    const r = rejeu(sansSoulager, D.mathieu);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[0]!.p10);
  });

  it("D3 : traiter le conflit vaut mieux que trancher ou laisser faire", () => {
    expect(
      classement(MEILLEUR, D.conflit)
        .slice(0, 2)
        .sort((a, b) => a - b),
    ).toEqual([0, 1]);
  });

  it("D4 : préparer les réponses bat les heures supplémentaires et l'absence de préparation", () => {
    const c = classement(MEILLEUR, D.campagne);
    expect(c[0]).toBe(2);
    expect(c.indexOf(1)).toBeGreaterThan(c.indexOf(2));
    expect(c.indexOf(3)).toBeGreaterThan(c.indexOf(2));
  });

  it("D5 : le télétravail cadré est le meilleur choix, le télétravail sans cadre le pire", () => {
    const c = classement(MEILLEUR, D.teletravail);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
  });

  it("D6 : prioriser les demandes anciennes bat le samedi de rattrapage", () => {
    expect(classement(MEILLEUR, D.fin)[0]).toBe(1);
  });

  it("soulager la file d'abord bat la pression et l'attentisme, en moyenne", () => {
    const [soulager, pression, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(soulager).toBeGreaterThan(pression!);
    expect(soulager).toBeGreaterThan(attentiste!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["demandes", "ecoute"], ["entretien"], ["litiges"], ["campagne"], ["charte"], []],
    jours: JOURS,
    diagnostic: "relances",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 3.8,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_EQUIPE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a mis la pression partout, propose de retirer du travail plutôt qu'en demander", () => {
    const p = partie(PRESSION);
    const c = EPISODE_EQUIPE.comportements(p, analyser(EPISODE_EQUIPE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_EQUIPE.axe(c).titre).toBe("Retirer du travail plutôt qu'en demander plus");
  });

  it("à qui a décidé sans enquêter, propose de regarder ce qui remplit la file", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_EQUIPE.comportements(p, analyser(EPISODE_EQUIPE, p).trimestre);
    expect(EPISODE_EQUIPE.axe(c).titre).toBe("Regarder ce qui remplit la file");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_EQUIPE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_EQUIPE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });
});
