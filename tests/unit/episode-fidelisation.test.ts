import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceQueKayaParte,
  hasard,
  simuler,
} from "../../src/engine/episodes/client-qui-s-en-va";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/client-qui-s-en-va";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_FIDELISATION } from "../../src/pedagogy/episodes/client-qui-s-en-va";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le client qui s'en va » enseigne trois choses : l'attrition est
 * silencieuse et se lit avant le départ (dans la baisse des commandes, pas
 * dans les réclamations), on part pour un irritant plutôt que pour le prix, et
 * une action pour tous paie d'abord ceux qui seraient restés. Ces tests
 * verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 1, 1, 1];
const REFLEXE = [0, 2, 2, 0, 0, 0];
const ATTENTISTE = [3, 3, 3, 2, 2, 2];
const SANS_LISTE = [3, 0, 0, 1, 1, 1];
const SANS_COMPTOIR = [1, 3, 0, 1, 1, 1];
const JOURS = 2.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));

describe("le modèle de la clientèle artisans", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.actifs).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.actifs,
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

  it("les artisans qui partent ne se plaignent pas : les réclamations ne suivent pas les départs", () => {
    const attente = simuler(ATTENTISTE, 3);
    const debut = attente.semaines[2]!;
    const fin = attente.semaines[12]!;
    expect(fin.departs).toBeGreaterThan(1.5 * debut.departs);
    expect(Math.abs(fin.reclamations - debut.reclamations)).toBeLessThan(1);
    // Corriger les factures fait tomber les réclamations, pas les départs.
    const factures = simuler([1, 1, 0, 1, 1, 1], 3);
    const comptoir = simuler(MEILLEUR, 3);
    expect(factures.semaines[8]!.reclamations).toBeLessThan(comptoir.semaines[8]!.reclamations - 1);
    expect(factures.departsTotal).toBeGreaterThan(comptoir.departsTotal + 10);
  });

  it("les bonnes décisions tiennent les artisans actifs ; l'attente les laisse filer", () => {
    expect(moyenne(GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g).actifsFinal))).toBeGreaterThan(
      895,
    );
    expect(simuler(ATTENTISTE, 3).actifsFinal).toBeLessThan(860);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of [1, 9, 23]) {
        const t = simuler(c, g);
        for (const s of t.semaines.slice(1)) {
          expect(s!.actifs).toBeGreaterThan(820);
          expect(s!.actifs).toBeLessThan(930);
          expect(s!.departs).toBeLessThan(20);
          expect(s!.attente).toBeLessThan(40);
          expect(s!.margeSemaine).toBeGreaterThan(60000);
          expect(s!.margeSemaine).toBeLessThan(100000);
        }
        expect(Math.abs(t.objectif)).toBeLessThan(200000);
      }
    }
  });

  it("les artisans en baisse n'apparaissent que si quelqu'un a décidé de les suivre", () => {
    expect(EPISODE_FIDELISATION.lire([3], 1, 0, 3).enBaisse).toBeNull();
    expect(EPISODE_FIDELISATION.lire([1], 1, 0, 3).enBaisse).toBeTypeOf("number");
  });

  it("Kaya Rénovation part bien plus souvent quand personne ne traite le comptoir ni ne l'appelle", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).kayaPart).length;
    expect(chanceQueKayaParte(MEILLEUR)).toBeLessThan(0.1);
    expect(chanceQueKayaParte(ATTENTISTE)).toBeGreaterThan(0.6);
    expect(departs(MEILLEUR)).toBeLessThanOrEqual(6);
    expect(departs(ATTENTISTE)).toBeGreaterThan(12);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : interroger les partis et suivre ceux qui baissent bat de loin les points et les remises", () => {
    const r = rejeu(MEILLEUR, D.lancement);
    expect(classement(MEILLEUR, D.lancement)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(30000);
    expect(r[3]!.attendu).toBeGreaterThan(Math.max(r[0]!.attendu, r[2]!.attendu));
  });

  it("D2 : traiter l'attente du matin bat les factures ; compenser par une remise est le pire", () => {
    const r = rejeu(MEILLEUR, D.irritant);
    const c = classement(MEILLEUR, D.irritant);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(2);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(30000);
  });

  it("D3 : appeler ceux qui baissent paie le plus en moyenne ; la remise ciblée est la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.signaux);
    expect(classement(MEILLEUR, D.signaux)[0]).toBe(0);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(1);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D3 : sans la liste de la semaine 1, les appels visent à l'aveugle", () => {
    const gain = (c: readonly number[]) => {
      const r = rejeu(c, D.signaux);
      return r[0]!.attendu - r[3]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain(SANS_LISTE) + 8000);
  });

  it("D4 : visiter les partis du comptoir paie une fois le comptoir réglé ; sinon, mieux vaut s'abstenir", () => {
    const r = rejeu(MEILLEUR, D.reconquete);
    expect(classement(MEILLEUR, D.reconquete)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    const s = rejeu(SANS_COMPTOIR, D.reconquete);
    expect(s[2]!.attendu).toBeGreaterThan(s[1]!.attendu);
    expect(s[2]!.attendu).toBeGreaterThan(s[0]!.attendu);
  });

  it("D5 : retenir les artisans fragiles bat l'alignement général et le laisser-faire", () => {
    const r = rejeu(MEILLEUR, D.concurrent);
    expect(classement(MEILLEUR, D.concurrent)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("D6 : installer l'alerte bat la remise de fin de trimestre, qui est le pire choix", () => {
    const c = classement(MEILLEUR, D.suivi);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
  });

  it("comprendre qui part et pourquoi bat les points et remises pour tous, et l'attentisme", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - attentiste!).toBeGreaterThan(50000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["entretiens", "frequence"], ["chrono"], ["liste"], ["pourquoi"], ["dalvaz"], []],
    jours: JOURS,
    diagnostic: "irritant",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 910,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_FIDELISATION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a payé tout le monde, propose de traiter la cause", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_FIDELISATION.comportements(p, analyser(EPISODE_FIDELISATION, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_FIDELISATION.axe(c).titre).toBe(
      "Traiter la cause plutôt que payer tout le monde",
    );
  });

  it("à qui a décidé sans enquêter, propose de demander aux partis pourquoi ils sont partis", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_FIDELISATION.comportements(p, analyser(EPISODE_FIDELISATION, p).trimestre);
    expect(EPISODE_FIDELISATION.axe(c).titre).toBe(
      "Demander à ceux qui partent pourquoi ils partent",
    );
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_FIDELISATION.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /au-dessus du budget/,
    );
    expect(EPISODE_FIDELISATION.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
