import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  hasard,
  mesure,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/indicateur-qui-ment";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/indicateur-qui-ment";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_INDICATEURS } from "../../src/pedagogy/episodes/indicateur-qui-ment";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'indicateur qui ment » enseigne trois choses : un indicateur
 * devenu objectif cesse de mesurer (pousser le décroché fait baisser les
 * commandes), on ne corrige que ce qu'on mesure (sans indicateur de résultat,
 * l'accompagnement vise à l'aveugle), et une règle du jeu se change avec ceux
 * qui jouent (refondre la prime avec l'équipe, pas la supprimer d'un coup).
 * Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 1, 2, 1];
const REFLEXE = [0, 3, 0, 0, 0, 0];
const ATTENTISTE = [3, 2, 3, 2, 3, 0];
const SANS_MESURE = [3, 1, 1, 1, 2, 1];
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

describe("le modèle des plateaux de prise de commande", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.decroche).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.decroche,
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

  it("pousser le décroché le garde vert, mais fait baisser les commandes et monter les rappels", () => {
    const pousse = simuler(REFLEXE, 3);
    const verifie = simuler(MEILLEUR, 3);
    expect(pousse.decrocheMoyen).toBeGreaterThan(verifie.decrocheMoyen);
    expect(pousse.premierAppelMoyen).toBeLessThan(verifie.premierAppelMoyen - 0.1);
    expect(pousse.rappelMoyen).toBeGreaterThan(verifie.rappelMoyen);
    expect(pousse.ca).toBeLessThan(verifie.ca);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of [1, 9, 23]) {
        for (const s of simuler(c, g).semaines.slice(1)) {
          expect(s!.decroche).toBeGreaterThanOrEqual(0.55);
          expect(s!.decroche).toBeLessThanOrEqual(0.99);
          expect(s!.premierAppel).toBeGreaterThanOrEqual(0.4);
          expect(s!.premierAppel).toBeLessThanOrEqual(0.8);
          expect(s!.ca).toBeGreaterThan(120000);
          expect(s!.ca).toBeLessThan(320000);
        }
      }
    }
  });

  it("les commandes au premier appel n'apparaissent que si quelqu'un a décidé de les mesurer", () => {
    expect(mesure(ATTENTISTE, 6)).toBe(false);
    expect(mesure(MEILLEUR, 2)).toBe(true);
    expect(EPISODE_INDICATEURS.lire([3], 1, 0, 3).premierAppel).toBeNull();
    expect(EPISODE_INDICATEURS.lire([1], 1, 0, 3).premierAppel).toBeTypeOf("number");
  });

  it("la pression sur l'équipe fait partir Yasmine ; la bonne méthode la garde", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).yasminePart).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(REFLEXE)).toBeGreaterThan(3);
    expect(risqueDeDepart(0.6)).toBe(0);
    expect(risqueDeDepart(0.2)).toBeGreaterThan(0.8);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : écouter des appels et mesurer le premier appel bat de loin l'objectif à 95 % et les dix indicateurs", () => {
    const r = rejeu(MEILLEUR, D.mesure);
    expect(classement(MEILLEUR, D.mesure)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(30000);
  });

  it("D2 : refondre la prime avec l'équipe bat la suppression brutale, qui bat le seuil relevé", () => {
    const c = classement(MEILLEUR, D.prime);
    expect(c[0]).toBe(1);
    expect(c.indexOf(0)).toBeLessThan(c.indexOf(2));
    expect(c.at(-1)).toBe(3);
  });

  it("D3 : les binômes paient quand on mesure le premier appel ; sans mesure, ils visent à l'aveugle", () => {
    expect(classement(MEILLEUR, D.ecarts)[0]).toBe(1);
    const avec = rejeu(MEILLEUR, D.ecarts);
    const sans = rejeu(SANS_MESURE, D.ecarts);
    const gain = (r: typeof avec) => r[1]!.attendu - r[3]!.attendu;
    expect(gain(avec)).toBeGreaterThan(gain(sans) + 10000);
    expect(classement(MEILLEUR, D.ecarts).at(-1)).toBe(0);
  });

  it("D4 : proposer au siège un indicateur de résultat paie en moyenne ; le report est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.postes);
    expect(classement(MEILLEUR, D.postes)[0]).toBe(1);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
  });

  it("D5 : la ligne prioritaire pour les chantiers bat le rappel automatique et les intérimaires", () => {
    const r = rejeu(MEILLEUR, D.pic);
    expect(classement(MEILLEUR, D.pic)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
  });

  it("D6 : quatre indicateurs équilibrés battent le seul décroché et les quinze indicateurs", () => {
    const c = classement(MEILLEUR, D.tableau);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
  });

  it("vérifier ce que mesure l'indicateur bat le plus-vert-que-vert et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - attentiste!).toBeGreaterThan(40000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["ecoute", "rappels"], ["detail"], ["parConseiller"], ["charge"], ["pic"], []],
    jours: JOURS,
    diagnostic: "goodhart",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 24,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_INDICATEURS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a poussé le chiffre vert partout, propose de regarder le résultat", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_INDICATEURS.comportements(p, analyser(EPISODE_INDICATEURS, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_INDICATEURS.axe(c).titre).toBe(
      "Regarder le résultat, pas seulement le chiffre vert",
    );
  });

  it("à qui a décidé sans enquêter, propose de vérifier ce que l'indicateur mesure", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_INDICATEURS.comportements(p, analyser(EPISODE_INDICATEURS, p).trimestre);
    expect(EPISODE_INDICATEURS.axe(c).titre).toBe("Vérifier ce que l'indicateur mesure");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_INDICATEURS.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus du budget/);
    expect(EPISODE_INDICATEURS.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
