import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceQueReneReste,
  hasard,
  simuler,
} from "../../src/engine/episodes/competences-qui-manquent";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/competences-qui-manquent";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_COMPETENCES } from "../../src/pedagogy/episodes/competences-qui-manquent";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les compétences qui manquent » enseigne trois choses : un
 * savoir rare se transmet à côté de ceux qui l'ont, sur les vraies pièces,
 * et seulement tant qu'ils sont là ; une formation générique ou une recrue de
 * dehors ne connaissent pas les pièces de l'atelier ; et la polyvalence
 * ciblée coûte d'abord, puis protège. Ces tests verrouillent les classements
 * qui le disent.
 */

const MEILLEUR = [1, 0, 0, 0, 0, 0];
const ACHETER = [0, 2, 1, 0, 3, 1];
const ATTENDRE = [3, 3, 3, 2, 3, 3];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const plusSur = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));

describe("le modèle de l'atelier", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Deux chemins qui ne divergent qu'à partir de la semaine 5 vivent les mêmes quatre premières.
    const a = simuler(MEILLEUR, 12);
    const b = simuler([1, 0, 3, 2, 3, 3], 12);
    expect(b.semaines[4]!.demande).toBeCloseTo(a.semaines[4]!.demande, 6);
    expect(b.semaines[4]!.cumul).toBeCloseTo(a.semaines[4]!.cumul, 6);
    // La demande ne dépend jamais des décisions avant le contrat de l'agenceur.
    expect(simuler(ATTENDRE, 12).semaines[7]!.demande).toBeCloseTo(a.semaines[7]!.demande, 6);
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

  it("transmettre tôt garde l'atelier en marche après les départs ; attendre l'arrête", () => {
    const bons = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    expect(moyenne(bons.map((t) => t.serviceApres))).toBeGreaterThan(0.9);
    expect(bons.filter((t) => t.pilotesFinaux >= 2).length).toBeGreaterThan(25);
    const attente = GRAINES_DU_BILAN.map((g) => simuler(ATTENDRE, g));
    expect(moyenne(attente.map((t) => t.serviceApres))).toBeLessThan(0.5);
    expect(moyenne(attente.map((t) => t.releveFinale))).toBeLessThan(0.45);
    // Les indicateurs restent dans des plages réalistes.
    for (const t of [...bons, ...attente]) {
      expect(t.tauxRepriseMoyen).toBeLessThan(0.08);
      expect(t.objectif).toBeGreaterThan(-80000);
      expect(t.objectif).toBeLessThan(50000);
    }
  });

  it("René accepte bien plus souvent de rester quand on lui a confié la relève", () => {
    const sansRelais = [3, 3, 3, 2, 0, 3];
    expect(chanceQueReneReste(MEILLEUR)).toBeGreaterThan(0.7);
    expect(chanceQueReneReste(sansRelais)).toBeLessThan(0.35);
    const restes = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).reneReste).length;
    expect(restes(MEILLEUR)).toBeGreaterThan(restes(sansRelais) + 8);
    expect(restes(ATTENDRE)).toBe(0);
  });

  it("le recrutement réussit environ une fois sur deux, et la recrue arrive tard", () => {
    const arrivees = GRAINES_DU_BILAN.map((g) => simuler(ACHETER, g).recrueArrivee);
    const venues = arrivees.filter((a) => a !== null);
    expect(venues.length).toBeGreaterThan(8);
    expect(venues.length).toBeLessThan(22);
    for (const a of venues) expect(a).toBeGreaterThanOrEqual(10);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le binôme sur les vraies pièces bat de loin le stage, le recrutement et l'attente", () => {
    const r = rejeu(MEILLEUR, D.plan);
    expect(classement(MEILLEUR, D.plan)[0]).toBe(1);
    for (const autre of [0, 2, 3]) expect(r[1]!.attendu - r[autre]!.attendu).toBeGreaterThan(20000);
    // Même sur le chemin de l'attente, c'est la décision qui compte le plus.
    expect(classement(ATTENDRE, D.plan)[0]).toBe(1);
  });

  it("D2 : écrire les gestes avec la relève bat la bibliothèque achetée et le « de main à main »", () => {
    const r = rejeu(MEILLEUR, D.savoir);
    expect(classement(MEILLEUR, D.savoir)[0]).toBe(0);
    expect(r[0]!.attendu - Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(4000);
  });

  it("D3 : la polyvalence ciblée est la meilleure et la plus sûre ; la rotation générale, la pire", () => {
    const r = rejeu(MEILLEUR, D.polyvalence);
    expect(classement(MEILLEUR, D.polyvalence)[0]).toBe(0);
    expect(classement(MEILLEUR, D.polyvalence).at(-1)).toBe(2);
    expect(plusSur(MEILLEUR, D.polyvalence)).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(3000);
  });

  it("D4 : tout le contrat rapporte le plus en moyenne, le plafond protège mieux ; sans relève, tout accepter est le pire", () => {
    expect(classement(MEILLEUR, D.contrat)[0]).toBe(0);
    expect(plusSur(MEILLEUR, D.contrat)).toBe(1);
    expect(classement(ATTENDRE, D.contrat).at(-1)).toBe(0);
    const r = rejeu(ATTENDRE, D.contrat);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
  });

  it("D5 : le cumul emploi-retraite est le meilleur choix", () => {
    const r = rejeu(MEILLEUR, D.rene);
    expect(classement(MEILLEUR, D.rene)[0]).toBe(0);
    expect(r[0]!.attendu - Math.max(r[1]!.attendu, r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(
      2000,
    );
  });

  it("D6 : la passation est le meilleur choix quand la relève existe ; l'intérim, quand elle n'existe pas", () => {
    const r = rejeu(MEILLEUR, D.joaquim);
    expect(classement(MEILLEUR, D.joaquim)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(1000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(1000);
    // L'intérimaire est une assurance : il protège des mauvais tirages, et coûte en moyenne.
    expect(plusSur(MEILLEUR, D.joaquim)).toBe(1);
    expect(classement(ATTENDRE, D.joaquim)[0]).toBe(1);
  });

  it("transmettre tôt bat nettement l'achat de compétences et l'attente, en moyenne", () => {
    const [transmettre, acheter, attendre] = REFERENCES.map((r) => attendu(r.chemin));
    expect(transmettre! - acheter!).toBeGreaterThan(30000);
    expect(transmettre! - attendre!).toBeGreaterThan(30000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["cartographie", "fabricant"],
      ["programmes"],
      ["matrice"],
      ["capacite"],
      ["retraite"],
      ["validation"],
    ],
    jours: JOURS,
    diagnostic: "transmission",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 90,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_COMPETENCES, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a acheté la compétence dehors, propose de transmettre plutôt qu'acheter", () => {
    const p = partie(ACHETER);
    const c = EPISODE_COMPETENCES.comportements(p, analyser(EPISODE_COMPETENCES, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_COMPETENCES.axe(c).titre).toBe("Transmettre plutôt qu'acheter");
  });

  it("à qui a décidé sans enquêter, propose de chercher où est le savoir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_COMPETENCES.comportements(p, analyser(EPISODE_COMPETENCES, p).trimestre);
    expect(EPISODE_COMPETENCES.axe(c).titre).toBe("Chercher où est le savoir");
  });

  it("à qui a attendu les départs, propose de commencer avant", () => {
    const p = partie(ATTENDRE);
    const c = EPISODE_COMPETENCES.comportements(p, analyser(EPISODE_COMPETENCES, p).trimestre);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_COMPETENCES.axe(c).titre).toBe("Commencer avant les départs");
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_COMPETENCES.bilan.titre(simuler(MEILLEUR, 1))).toMatch(/au-dessus du budget/);
    expect(EPISODE_COMPETENCES.bilan.titre(simuler(ATTENDRE, 1))).toMatch(/sous le budget/);
  });
});
