import { describe, expect, it } from "vitest";
import {
  CHANCE_COEUR,
  D,
  IMPREVUS,
  NEUTRE,
  hasard,
  recrutement,
  risqueBastien,
  rythme,
  simuler,
} from "../../src/engine/episodes/poste-qui-reste-vide";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/poste-qui-reste-vide";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_RECRUTEMENT } from "../../src/pedagogy/episodes/poste-qui-reste-vide";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le poste qui reste vide » enseigne trois choses : la vacance
 * coûte chaque semaine, mais un mauvais recrutement coûte plus ; un entretien
 * structuré trie mieux que l'impression, et une offre rapide garde le bon
 * candidat ; l'intégration fait la montée en charge, à condition que le
 * parrain ne soit pas lui-même débordé. Ces tests verrouillent les
 * classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 0, 0, 0];
const REFLEXE = [0, 0, 0, 1, 1, 2];
const ATTENTISTE = [...NEUTRE];
/** Le meilleur chemin, mais une équipe poussée à tout visiter avec une prime. */
const EQUIPE_POUSSEE = [1, 2, 1, 0, 0, 0];
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
const part = (f: (g: number) => boolean) => GRAINES_DU_BILAN.filter(f).length / 30;

describe("le modèle de l'agence de Villefranche", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.marge).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.marge,
      6,
    );
    expect(hasard(12)).toBe(hasard(12));
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

  it("la bonne méthode pourvoit le poste en semaine 8 au plus tard ; l'attente le laisse vide", () => {
    const arrivee = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).arrivee ?? 14));
    expect(arrivee(MEILLEUR)).toBeLessThanOrEqual(8.5);
    expect(arrivee(ATTENTISTE)).toBeGreaterThan(12);
  });

  it("le coup de cœur n'est un bon choix qu'une fois sur trois ; la grille trie", () => {
    expect(CHANCE_COEUR).toBeLessThan(0.4);
    const bons = (c: readonly number[]) => part((g) => recrutement(c, g).bon);
    expect(bons(MEILLEUR)).toBeGreaterThan(0.8);
    expect(bons(REFLEXE)).toBeLessThan(0.45);
  });

  it("une équipe poussée à bout perd Bastien bien plus souvent", () => {
    const departs = (c: readonly number[]) => part((g) => simuler(c, g).bastienPart);
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(EQUIPE_POUSSEE)).toBeGreaterThan(0.5);
    expect(risqueBastien(0.5)).toBe(0);
    expect(risqueBastien(3)).toBeGreaterThan(0.7);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE, EQUIPE_POUSSEE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.clientsPerdus).toBeLessThan(30);
        expect(t.chargeMoyenne).toBeLessThan(1.6);
        expect(t.objectif).toBeGreaterThan(-120000);
        expect(t.objectif).toBeLessThan(40000);
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : réécrire l'annonce bat nettement la rediffusion de l'ancienne et le cabinet", () => {
    const r = rejeu(MEILLEUR, D.annonce);
    expect(classement(MEILLEUR, D.annonce)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
  });

  it("D2 : trier le portefeuille est le meilleur en moyenne ; le reprendre soi-même est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.portefeuille);
    expect(classement(MEILLEUR, D.portefeuille)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(25000);
    // Espérance contre robustesse : l'option la plus sûre n'est pas la meilleure en moyenne.
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[3]!.p10);
    expect(r[3]!.p10).toBeGreaterThan(r[1]!.p10);
  });

  it("D3 : l'entretien structuré bat le coup de cœur, le feeling et l'attente du candidat parfait", () => {
    const r = rejeu(MEILLEUR, D.selection);
    expect(classement(MEILLEUR, D.selection)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(8000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(5000);
  });

  it("D4 : une offre ferme et rapide bat la procédure habituelle et l'offre basse", () => {
    const r = rejeu(MEILLEUR, D.offre);
    const c = classement(MEILLEUR, D.offre);
    expect(c[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(c.indexOf(2)).toBeGreaterThan(c.indexOf(3));
  });

  it("D5 : le parrain est le meilleur choix, sauf quand l'équipe a été poussée à bout", () => {
    expect(classement(MEILLEUR, D.integration)[0]).toBe(0);
    const r = rejeu(MEILLEUR, D.integration);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(8000);
    // Un parrain débordé n'est qu'à moitié parrain : mieux vaut alors accompagner soi-même.
    expect(rythme(EQUIPE_POUSSEE, 8, 1)).toBeLessThan(rythme(MEILLEUR, 8, 1));
    expect(classement(EQUIPE_POUSSEE, D.integration)[0]).toBe(3);
  });

  it("D6 : le point structuré est le meilleur choix ; rompre par précaution, le pire", () => {
    const c = classement(MEILLEUR, D.essai);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
  });

  it("la bonne méthode bat nettement le coup de cœur et l'attente du candidat parfait", () => {
    const [methode, coeur, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - coeur!).toBeGreaterThan(30000);
    expect(methode! - attente!).toBeGreaterThan(30000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["annonce", "candidats"],
      ["marges"],
      ["references"],
      ["pistes"],
      ["parrain"],
      ["retours"],
    ],
    jours: JOURS,
    diagnostic: "annonce",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 18,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_RECRUTEMENT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("juge faible le réflexe de laisser la période d'essai courir sans retour", () => {
    const r = rejeu(MEILLEUR, D.essai);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(4000);
    const a = analyser(EPISODE_RECRUTEMENT, partie([1, 1, 1, 0, 0, 2]));
    expect(a.decisions[D.essai]!.bonne).toBe(false);
    expect(a.decisions[D.essai]!.meilleur.option).toBe(0);
  });

  it("à qui a suivi ses réflexes, propose de vérifier avant de choisir et de décider vite", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_RECRUTEMENT.comportements(p, analyser(EPISODE_RECRUTEMENT, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_RECRUTEMENT.axe(c).titre).toBe(
      "Vérifier avant de choisir, décider vite ensuite",
    );
  });

  it("à qui a décidé sans enquêter, propose de regarder pourquoi le poste n'attire pas", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_RECRUTEMENT.comportements(p, analyser(EPISODE_RECRUTEMENT, p).trimestre);
    expect(EPISODE_RECRUTEMENT.axe(c).titre).toBe("Regarder pourquoi le poste n'attire pas");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_RECRUTEMENT.bilan.titre(simuler(MEILLEUR, 11))).toMatch(/au-dessus du budget/);
    expect(EPISODE_RECRUTEMENT.bilan.titre(simuler(ATTENTISTE, 11))).toMatch(
      /en dessous du budget/,
    );
  });
});
