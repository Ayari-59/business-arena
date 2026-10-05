import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceAccord,
  chanceOperation,
  hasard,
  operationAltineo,
  simuler,
} from "../../src/engine/episodes/prix-qui-ne-passe-plus";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/prix-qui-ne-passe-plus";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_PRIX } from "../../src/pedagogy/episodes/prix-qui-ne-passe-plus";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le prix qui ne passe plus » enseigne trois choses : tous les
 * prix ne se comparent pas (une hausse uniforme fait partir ceux qui
 * comparent et laisse de la marge ailleurs), une hausse fuit par les
 * dérogations qu'on n'encadre pas (et les interdire fait partir les clients
 * qui avaient un vrai devis), et une hausse s'accompagne (des commerciaux
 * armés perdent moins et convainquent mieux). Ces tests verrouillent les
 * classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 2, 2, 0, 0, 0];
const ATTENTISTE = [2, 2, 0, 2, 3, 2];
const UNIFORME = [0, 1, 1, 1, 1, 1];
const SANS_FORMATION = [1, 1, 0, 1, 1, 1];
const SANS_REGLE = [1, 2, 1, 1, 1, 1];
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
const enMoyenne = (chemin: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
  moyenne(GRAINES_DU_BILAN.map((g) => f(simuler(chemin, g))));

describe("le modèle de la politique tarifaire", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.tauxMarge).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.tauxMarge,
      6,
    );
    expect(hasard(12)).toBe(hasard(12));
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const imprevus = hasard(g).imprevus;
      expect(imprevus.length).toBeGreaterThanOrEqual(1);
      expect(imprevus.length).toBeLessThanOrEqual(2);
      for (const i of imprevus) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("une hausse uniforme fait partir le gros œuvre ; la hausse différenciée encaisse plus", () => {
    const uniforme = enMoyenne(UNIFORME, (t) => t.volumeBaseMoyen);
    const differenciee = enMoyenne(MEILLEUR, (t) => t.volumeBaseMoyen);
    expect(differenciee - uniforme).toBeGreaterThan(0.05);
    expect(enMoyenne(MEILLEUR, (t) => t.hausseNetteMoyenne)).toBeGreaterThan(
      enMoyenne(UNIFORME, (t) => t.hausseNetteMoyenne),
    );
  });

  it("sans règle, les dérogations dérivent ; encadrées, elles reviennent sous le plafond", () => {
    expect(enMoyenne(MEILLEUR, (t) => t.remisesFinales)).toBeLessThan(0.02);
    expect(enMoyenne(SANS_REGLE, (t) => t.remisesFinales)).toBeGreaterThan(0.03);
    expect(enMoyenne(REFLEXE, (t) => t.remisesFinales)).toBeGreaterThan(0.05);
  });

  it("Altinéo attaque plus souvent quand le gros œuvre a monté au-dessus de lui", () => {
    expect(chanceOperation(UNIFORME)).toBeGreaterThan(chanceOperation(MEILLEUR));
    const operations = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => operationAltineo(c, g)).length;
    expect(operations(UNIFORME)).toBeGreaterThan(operations(MEILLEUR));
    expect(operations(MEILLEUR)).toBeGreaterThan(0);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of [1, 9, 23]) {
        for (const s of simuler(c, g).semaines.slice(1)) {
          expect(s!.tauxMarge).toBeGreaterThan(0.18);
          expect(s!.tauxMarge).toBeLessThan(0.34);
          expect(s!.remises).toBeGreaterThan(0.005);
          expect(s!.remises).toBeLessThan(0.08);
          expect(s!.volumeBase).toBeGreaterThan(0.45);
          expect(s!.volumeBase).toBeLessThan(1.25);
        }
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la hausse différenciée bat de loin les +6 % partout, et plus encore l'absence de hausse", () => {
    const r = rejeu(MEILLEUR, D.hausse);
    expect(classement(MEILLEUR, D.hausse)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(80000);
    // Répercuter le coût famille par famille charge le gros œuvre : pire que l'uniforme.
    expect(r[3]!.attendu).toBeLessThan(r[0]!.attendu);
  });

  it("D2 : encadrer les dérogations bat les interdire, qui bat les laisser filer", () => {
    const r = rejeu(MEILLEUR, D.derogations);
    expect(classement(MEILLEUR, D.derogations)).toEqual([1, 0, 3, 2]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
  });

  it("D3 : former les commerciaux bat la note et le courrier ; l'objectif de volume est le pire", () => {
    const c = classement(MEILLEUR, D.commerciaux);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
  });

  it("D4 : la riposte ciblée paie en moyenne ; la garantie écrite est la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.altineo);
    expect(classement(MEILLEUR, D.altineo)[0]).toBe(1);
    expect(classement(MEILLEUR, D.altineo).at(-1)).toBe(0);
    // Ignorer la rumeur coûte assez pour que le bilan ne le juge pas bon.
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(5000);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(3);
    // Quand le gros œuvre a monté de 6 %, l'opération devient probable : l'assurance vaut plus.
    const u = rejeu(UNIFORME, D.altineo);
    expect(u[3]!.attendu - u[1]!.attendu).toBeGreaterThan(r[3]!.attendu - r[1]!.attendu + 2000);
  });

  it("D5 : recevoir Garon paie quand les commerciaux sont armés ; sans formation, à peine", () => {
    expect(chanceAccord(MEILLEUR)).toBeGreaterThan(chanceAccord(SANS_FORMATION));
    expect(classement(MEILLEUR, D.garon)[0]).toBe(1);
    const avec = rejeu(MEILLEUR, D.garon);
    const sans = rejeu(SANS_FORMATION, D.garon);
    const gain = (r: typeof avec) => r[1]!.attendu - r[2]!.attendu;
    expect(gain(avec)).toBeGreaterThan(gain(sans) + 1500);
    expect(avec[1]!.attendu - avec[0]!.attendu).toBeGreaterThan(3000);
  });

  it("D6 : facturer ce qui est offert bat la remise de fin de trimestre ; la revue vaut surtout sans règle", () => {
    const c = classement(MEILLEUR, D.fin);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    const revue = (chemin: readonly number[]) => {
      const r = rejeu(chemin, D.fin);
      return r[3]!.attendu - r[2]!.attendu;
    };
    expect(revue(SANS_REGLE)).toBeGreaterThan(revue(MEILLEUR) + 2000);
    expect(classement(REFLEXE, D.fin)[0]).toBe(3);
  });

  it("différencier, encadrer, accompagner bat le prix d'un seul bloc et l'attentisme, en moyenne", () => {
    const [methode, bloc, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - bloc!).toBeGreaterThan(60000);
    expect(methode! - attentiste!).toBeGreaterThan(60000);
    expect(methode!).toBeGreaterThan(0);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["elasticite", "derogations"],
      ["detail"],
      ["tournee"],
      ["rumeur"],
      ["compte"],
      ["fuites"],
    ],
    jours: JOURS,
    diagnostic: "bloc",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 28,
    confiance: 60,
    ...extra,
  });

  it("ne juge pas bon d'ignorer la rumeur d'opération d'Altinéo", () => {
    const a = analyser(EPISODE_PRIX, partie([1, 1, 1, 2, 1, 1]));
    expect(a.decisions[D.altineo]!.bonne).toBe(false);
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PRIX, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a appliqué un seul chiffre ou cédé partout, propose de différencier", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_PRIX.comportements(p, analyser(EPISODE_PRIX, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PRIX.axe(c).titre).toBe("Différencier plutôt qu'appliquer un seul chiffre");
  });

  it("à qui a décidé sans enquêter, propose de regarder qui compare", () => {
    const p = partie(MEILLEUR, {
      consultes: [[], [], [], [], [], []],
      jours: 0,
    });
    const c = EPISODE_PRIX.comportements(p, analyser(EPISODE_PRIX, p).trimestre);
    expect(EPISODE_PRIX.axe(c).titre).toBe("Regarder qui compare avant de fixer un prix");
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_PRIX.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus du budget/);
    expect(EPISODE_PRIX.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
