import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceQueLeDirecteurAttende,
  hasard,
  risqueIncident,
  simuler,
} from "../../src/engine/episodes/projet-qui-glisse";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/projet-qui-glisse";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_PROJET } from "../../src/pedagogy/episodes/projet-qui-glisse";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le projet qui glisse » enseigne trois choses : un périmètre
 * ouvert mange la vitesse de l'équipe, et on tient une date en choisissant ce
 * qui sort plutôt qu'en courant plus vite ; ajouter du monde à un projet en
 * retard le ralentit d'abord ; et les tests qu'on saute se paient en défauts
 * livrés. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 2, 0, 0, 0, 2];
const ATTENTISTE = [3, 3, 0, 3, 3, 0];
/** Le bon chemin, sans le comité de la semaine 1. */
const SANS_GEL = [3, 1, 1, 1, 1, 1];
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

describe("le modèle du projet", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.raf).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.raf,
      6,
    );
    const avant = hasard(12).imprevus;
    simuler(REFLEXE, 12);
    expect(hasard(12).imprevus).toEqual(avant);
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

  it("geler et découper font ouvrir l'essentiel à la date ; laisser faire fait glisser de plusieurs semaines", () => {
    // Sauf quand le directeur commercial impose son devis, l'essentiel ouvre à la date.
    const trimestres = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    const sansDevis = trimestres.filter((t) => !t.devisImpose);
    expect(sansDevis.length).toBeGreaterThanOrEqual(20);
    expect(sansDevis.filter((t) => t.glissement === 0).length).toBeGreaterThanOrEqual(
      sansDevis.length - 1,
    );
    for (const g of GRAINES_DU_BILAN) expect(simuler(ATTENTISTE, g).glissement).toBeGreaterThan(3);
    // Au fil de l'eau, le périmètre s'alourdit de bien plus que sous le comité.
    expect(simuler(ATTENTISTE, 3).demandesAcceptees).toBeGreaterThan(
      2 * simuler(MEILLEUR, 3).demandesAcceptees,
    );
  });

  it("un renfort ralentit l'équipe ses trois premières semaines (loi de Brooks)", () => {
    const realise = (c: readonly number[], g: number) =>
      [2, 3, 4].reduce((s, w) => s + simuler(c, g).semaines[w]!.realise, 0);
    for (const g of [1, 5, 9]) {
      expect(realise(avec(ATTENTISTE, D.cap, 0), g)).toBeLessThan(realise(ATTENTISTE, g));
    }
  });

  it("rogner la recette envoie plus de défauts en service, et le risque de panne suit", () => {
    const livres = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).defautsLivres));
    expect(livres(avec(MEILLEUR, D.tests, 0))).toBeGreaterThan(livres(MEILLEUR) * 1.5);
    expect(livres(avec(MEILLEUR, D.recette, 2))).toBeGreaterThan(livres(MEILLEUR));
    expect(risqueIncident(0)).toBe(0);
    expect(risqueIncident(40)).toBeGreaterThan(0.8);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : geler le périmètre est de loin le meilleur choix ; renforts et heures font pire que rien", () => {
    const r = rejeu(MEILLEUR, D.cap);
    expect(classement(MEILLEUR, D.cap)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
    expect(r[3]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(10000);
  });

  it("D2 : libérer les utilisateurs clés bat les développeurs testeurs et la recette repoussée", () => {
    const r = rejeu(MEILLEUR, D.recette);
    expect(classement(MEILLEUR, D.recette)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(10000);
  });

  it("D3 : le lot 2 vaut le plus en moyenne, le refus est le plus sûr, et l'accepter coûte cher", () => {
    const r = rejeu(MEILLEUR, D.devis);
    expect(classement(MEILLEUR, D.devis)[0]).toBe(1);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[3]!.p10);
    expect(r[3]!.p10).toBeGreaterThan(r[1]!.p10);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
  });

  it("D3 : proposer le lot 2 ne marche que si un comité tranche déjà les demandes", () => {
    expect(chanceQueLeDirecteurAttende(MEILLEUR)).toBeGreaterThan(
      chanceQueLeDirecteurAttende(SANS_GEL),
    );
    expect(classement(SANS_GEL, D.devis)[0]).toBe(3);
    const avecGel = rejeu(MEILLEUR, D.devis);
    const sansGel = rejeu(SANS_GEL, D.devis);
    expect(avecGel[1]!.attendu - avecGel[3]!.attendu).toBeGreaterThan(5000);
    expect(sansGel[3]!.attendu - sansGel[1]!.attendu).toBeGreaterThan(3000);
  });

  it("D4 : découper bat le report, le statu quo et, de loin, les renforts de la DSI", () => {
    const c = classement(MEILLEUR, D.pilotage);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    const r = rejeu(MEILLEUR, D.pilotage);
    expect(r[1]!.attendu - Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(15000);
  });

  it("D5 : protéger la recette est le meilleur choix ; la rogner le pire", () => {
    const c = classement(MEILLEUR, D.tests);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    const r = rejeu(MEILLEUR, D.tests);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("D6 : ouvrir par des agences pilotes bat l'ouverture d'un coup ; faire plaisir est le pire", () => {
    const c = classement(MEILLEUR, D.ouverture);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
  });

  it("mesurer, geler, découper bat le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - attentiste!).toBeGreaterThan(50000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["raf", "registre"], ["agences"], ["panel"], ["projection"], ["cout-defauts"], []],
    jours: JOURS,
    diagnostic: "perimetre",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 200,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PROJET, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a renforcé, forcé et fait plaisir, propose de retirer du travail", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_PROJET.comportements(p, analyser(EPISODE_PROJET, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PROJET.axe(c).titre).toBe("Retirer du travail plutôt qu'ajouter des bras");
  });

  it("à qui a décidé sans enquêter, propose de mesurer le reste à faire réel", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PROJET.comportements(p, analyser(EPISODE_PROJET, p).trimestre);
    expect(EPISODE_PROJET.axe(c).titre).toBe("Mesurer le reste à faire réel");
  });

  it("dit le résultat en valeur nette", () => {
    expect(EPISODE_PROJET.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/de valeur nette/);
    expect(EPISODE_PROJET.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/dérapages/);
  });
});
