import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  P,
  ciblage,
  hasard,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/talent-qui-veut-partir";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/talent-qui-veut-partir";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_TALENTS } from "../../src/pedagogy/episodes/talent-qui-veut-partir";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le talent qui veut partir » enseigne trois choses : on ne
 * retient pas par l'argent mais en répondant à ce qui manque à chacun
 * (perspectives, charge, reconnaissance), ce qu'un entretien de rétention
 * fait remonter avant la démission ; la contre-offre achète du temps et
 * finit par se savoir ; promettre ce qui ne dépend pas de soi détruit la
 * confiance. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 2, 1, 0, 2, 1];
const ARGENT = [0, 0, 0, 1, 0, 0];
const ATTENTISTE = [3, 3, 3, 3, 1, 2];
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
const avec = (chemin: readonly number[], d: number, o: number) =>
  chemin.map((x, i) => (i === d ? o : x));
const compte = (chemin: readonly number[], test: (t: ReturnType<typeof simuler>) => boolean) =>
  GRAINES_DU_BILAN.filter((g) => test(simuler(chemin, g))).length;

describe("le modèle de la région", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Deux chemins qui ne divergent qu'à la deuxième décision vivent les mêmes deux premières semaines.
    const a = simuler(MEILLEUR, 12);
    const b = simuler([1, 0, 3, 3, 1, 2], 12);
    expect(b.semaines[2]!.marge).toBeCloseTo(a.semaines[2]!.marge, 6);
    expect(b.semaines[2]!.engagement).toBeCloseTo(a.semaines[2]!.engagement, 6);
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

  it("la bonne méthode garde presque tout le monde ; le laisser-partir vide la région", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.reduce(
        (s, g) => s + simuler(c, g).demissions.filter((x) => x !== null).length,
        0,
      );
    expect(departs(MEILLEUR)).toBeLessThanOrEqual(6);
    expect(compte(ATTENTISTE, (t) => t.heloisePartieTot)).toBeGreaterThan(18);
    expect(departs(ATTENTISTE)).toBeGreaterThan(60);
    expect(
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g).engagementFinal)),
    ).toBeGreaterThan(65);
    expect(risqueDeDepart(0.7)).toBeLessThan(0.05);
    expect(risqueDeDepart(0.3)).toBeGreaterThan(0.5);
  });

  it("la contre-offre retient Héloïse sur le moment, mais elle repart bien plus souvent ensuite", () => {
    const contreOffre = avec(MEILLEUR, D.offre, 0);
    const partTot = (c: readonly number[]) => compte(c, (t) => t.heloisePartieTot);
    const repart = (c: readonly number[]) =>
      compte(c, (t) => !t.heloisePartieTot && t.demissions[P.heloise] !== null);
    expect(partTot(contreOffre)).toBeLessThan(partTot(avec(MEILLEUR, D.offre, 3)) / 2);
    expect(repart(contreOffre)).toBeGreaterThan(repart(MEILLEUR) + 5);
  });

  it("les augmentations hors politique finissent par se savoir ; la bonne méthode n'en fait pas", () => {
    expect(compte(ARGENT, (t) => t.fuite !== null)).toBeGreaterThan(15);
    expect(compte(MEILLEUR, (t) => t.fuite !== null)).toBe(0);
  });

  it("une promesse rompue fait repartir celle à qui on l'a faite", () => {
    const promesse = avec(MEILLEUR, D.offre, 1);
    const rompues = GRAINES_DU_BILAN.map((g) => simuler(promesse, g)).filter(
      (t) => t.promesseRompue,
    );
    expect(rompues.length).toBeGreaterThan(5);
    expect(rompues.filter((t) => t.demissions[P.heloise] === 11).length).toBeGreaterThan(
      rompues.length / 3,
    );
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : l'entretien de rétention est de loin le meilleur choix ; l'augmentation immédiate ne paie pas", () => {
    const r = rejeu(MEILLEUR, D.ecoute);
    expect(classement(MEILLEUR, D.ecoute)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
    // Sur un autre chemin, l'écoute reste le meilleur premier geste.
    expect(classement(ATTENTISTE, D.ecoute)[0]).toBe(1);
  });

  it("D2 : le parcours bat la contre-offre et la promesse, et il porte plus après les entretiens", () => {
    const r = rejeu(MEILLEUR, D.offre);
    expect(classement(MEILLEUR, D.offre)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(15000);
    // Sans entretien de rétention, le parcours tombe moins juste : son avance fond.
    const sansEcoute = avec(MEILLEUR, D.ecoute, 3);
    expect(ciblage(sansEcoute)).toBeLessThan(ciblage(MEILLEUR));
    const s = rejeu(sansEcoute, D.offre);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(s[2]!.attendu - s[0]!.attendu + 10000);
  });

  it("D3 : le CDI rapporte le plus en moyenne, l'intérim protège mieux ; la prime ne règle rien", () => {
    const r = rejeu(MEILLEUR, D.habib);
    expect(classement(MEILLEUR, D.habib)[0]).toBe(1);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D4 : reconnaître Mathilde et lui confier un projet bat l'augmentation et le refus poli", () => {
    const r = rejeu(MEILLEUR, D.mathilde);
    expect(classement(MEILLEUR, D.mathilde)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(5000);
    expect(classement(ARGENT, D.mathilde)[0]).toBe(0);
  });

  it("D5 : préparer ouvertement, sur critères, bat l'annonce d'un nom et le recrutement externe", () => {
    const r = rejeu(MEILLEUR, D.poste);
    expect(classement(MEILLEUR, D.poste)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    expect(classement(ATTENTISTE, D.poste)[0]).toBe(2);
  });

  it("D6 : la délégation réelle retient Kofi ; elle ne vaut plus grand-chose si Héloïse garde tout", () => {
    const r = rejeu(MEILLEUR, D.kofi);
    expect(classement(MEILLEUR, D.kofi)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(4000);
    // Après une contre-offre, Héloïse n'a pas de mission et Kofi rien à tenir : l'avance disparaît.
    const a = rejeu(ARGENT, D.kofi);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(a[1]!.attendu - a[0]!.attendu + 2000);
  });

  it("écouter et construire bat nettement la surenchère et le laisser-partir, en moyenne", () => {
    const [construire, surencherir, laisser] = REFERENCES.map((r) => attendu(r.chemin));
    expect(construire! - surencherir!).toBeGreaterThan(50000);
    expect(construire! - laisser!).toBeGreaterThan(50000);
    expect(surencherir!).toBeGreaterThan(laisser!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["entretiens", "dejeuner"],
      ["notes", "comite"],
      ["agenda"],
      ["tassin"],
      ["criteres"],
      ["kofi"],
    ],
    jours: JOURS,
    diagnostic: "besoins",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 47,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_TALENTS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a surenchéri partout, propose de retenir autrement que par l'argent", () => {
    const p = partie(ARGENT);
    const c = EPISODE_TALENTS.comportements(p, analyser(EPISODE_TALENTS, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_TALENTS.axe(c).titre).toBe("Retenir autrement que par l'argent");
  });

  it("à qui a décidé sans enquêter, propose d'écouter avant la démission", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_TALENTS.comportements(p, analyser(EPISODE_TALENTS, p).trimestre);
    expect(EPISODE_TALENTS.axe(c).titre).toBe("Écouter avant la démission");
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_TALENTS.bilan.titre(simuler(MEILLEUR, 1))).toMatch(/au-dessus du budget/);
    expect(EPISODE_TALENTS.bilan.titre(simuler(ATTENTISTE, 1))).toMatch(/sous le budget/);
  });
});
