import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  hasard,
  ouverture,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/collaborateur-qui-decroche";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/collaborateur-qui-decroche";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_PERFORMANCE } from "../../src/pedagogy/episodes/collaborateur-qui-decroche";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le collaborateur qui décroche » enseigne trois choses : la
 * cause d'un décrochage se cherche dans les faits (ici, un logiciel jamais
 * appris), un entretien factuel et un plan suivi font remonter la
 * performance quand une sanction d'emblée ferme le dialogue, et l'équipe qui
 * compense doit être protégée. Ces tests verrouillent les classements qui le
 * disent.
 */

const MEILLEUR = [1, 1, 0, 1, 0, 0];
const SANCTION = [0, 2, 2, 0, 1, 1];
const LAISSER_FILER = [3, 3, 2, 2, 3, 3];
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

describe("le modèle du comptoir", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Deux chemins qui ne divergent qu'en semaine 3 vivent les mêmes deux premières semaines.
    const a = simuler(MEILLEUR, 12);
    const b = simuler([1, 3, 2, 2, 3, 3], 12);
    expect(b.semaines[2]!.erreurs).toBeCloseTo(a.semaines[2]!.erreurs, 6);
    expect(b.semaines[2]!.ca).toBeCloseTo(a.semaines[2]!.ca, 6);
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

  it("l'accompagnement ramène Didier près de son niveau ; laisser filer use l'équipe", () => {
    const bons = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    expect(moyenne(bons.map((t) => t.performanceFinale))).toBeGreaterThan(85);
    expect(bons.filter((t) => t.tenu).length).toBeGreaterThan(25);
    const filer = GRAINES_DU_BILAN.map((g) => simuler(LAISSER_FILER, g));
    expect(moyenne(filer.map((t) => t.performanceFinale))).toBeLessThan(60);
    expect(moyenne(filer.map((t) => t.climatFinal))).toBeLessThan(0.3);
  });

  it("laisser l'équipe compenser fait partir Karima bien plus souvent", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).karimaPart).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(LAISSER_FILER)).toBeGreaterThan(10);
    expect(risqueDeDepart(0.6)).toBe(0);
    expect(risqueDeDepart(0.2)).toBeGreaterThan(0.7);
  });

  it("une sanction d'emblée peut arrêter Didier ; l'entretien jamais", () => {
    const arrets = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).arret.length > 0).length;
    expect(arrets(MEILLEUR)).toBe(0);
    expect(arrets(SANCTION)).toBeGreaterThan(5);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : l'entretien factuel est de loin le meilleur choix ; l'avertissement immédiat le pire", () => {
    const r = rejeu(MEILLEUR, D.entretien);
    const c = classement(MEILLEUR, D.entretien);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(5000);
  });

  it("D2 : le plan d'accompagnement ne porte que si le dialogue a été ouvert", () => {
    expect(ouverture(MEILLEUR)).toBeGreaterThan(ouverture(SANCTION));
    expect(classement(MEILLEUR, D.plan)[0]).toBe(1);
    // L'objectif sous menace est le pire choix une fois Didier ouvert.
    expect(classement(MEILLEUR, D.plan).at(-1)).toBe(2);
    // Après un avertissement, le binôme n'est plus le meilleur choix.
    expect(classement(SANCTION, D.plan)[0]).not.toBe(1);
  });

  it("D3 : répartir les reprises équitablement bat la patience, la prime et la confidence trahie", () => {
    const r = rejeu(MEILLEUR, D.equipe);
    expect(classement(MEILLEUR, D.equipe)[0]).toBe(0);
    expect(r[0]!.attendu - Math.max(r[1]!.attendu, r[2]!.attendu)).toBeGreaterThan(3000);
    // Laissée sans réponse, l'équipe s'use : c'est là que la réunion vaut le plus.
    const filer = rejeu(LAISSER_FILER, D.equipe);
    expect(filer[0]!.attendu - filer[2]!.attendu).toBeGreaterThan(10000);
  });

  it("D4 : faire le point sur les objectifs bat l'avertissement ; le recadrage sert quand le plan a échoué", () => {
    const c = classement(MEILLEUR, D.etape);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    // Avec la seule formation de l'éditeur, l'objectif est rarement tenu :
    // le point, qui devient alors un recadrage écrit, reste le meilleur choix.
    const formation = [1, 0, 0, 1, 0, 0];
    expect(GRAINES_DU_BILAN.filter((g) => simuler(formation, g).tenu).length).toBeLessThan(15);
    expect(classement(formation, D.etape)[0]).toBe(1);
  });

  it("D5 : confier la gamme à Didier rapporte le plus en moyenne, le fournisseur protège mieux", () => {
    const r = rejeu(MEILLEUR, D.gamme);
    expect(classement(MEILLEUR, D.gamme)[0]).toBe(0);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(1);
    // Après une sanction, Didier n'est plus en état de former : c'est le pire choix.
    expect(classement(SANCTION, D.gamme).at(-1)).toBe(0);
  });

  it("D6 : confier le rush à Didier bat la procédure et l'intérim", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(3000);
  });

  it("comprendre et accompagner bat nettement la sanction et le laisser-filer, en moyenne", () => {
    const [comprendre, sanctionner, filer] = REFERENCES.map((r) => attendu(r.chemin));
    expect(comprendre! - sanctionner!).toBeGreaterThan(15000);
    expect(comprendre! - filer!).toBeGreaterThan(15000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["erreurs", "formation"],
      ["yacine"],
      ["reprises"],
      ["bilan"],
      ["ventes"],
      ["commandes"],
    ],
    jours: JOURS,
    diagnostic: "outil",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 3.5,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PERFORMANCE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a sanctionné partout, propose de comprendre avant de sanctionner", () => {
    const p = partie(SANCTION);
    const c = EPISODE_PERFORMANCE.comportements(p, analyser(EPISODE_PERFORMANCE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PERFORMANCE.axe(c).titre).toBe("Comprendre avant de sanctionner");
  });

  it("à qui a décidé sans enquêter, propose de chercher ce qui a changé", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PERFORMANCE.comportements(p, analyser(EPISODE_PERFORMANCE, p).trimestre);
    expect(EPISODE_PERFORMANCE.axe(c).titre).toBe("Chercher ce qui a changé");
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_PERFORMANCE.bilan.titre(simuler(MEILLEUR, 1))).toMatch(/au-dessus du budget/);
    expect(EPISODE_PERFORMANCE.bilan.titre(simuler(LAISSER_FILER, 1))).toMatch(/sous le budget/);
  });
});
