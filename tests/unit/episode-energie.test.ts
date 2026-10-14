import { describe, expect, it } from "vitest";
import {
  CHANCE_FROID,
  D,
  IMPREVUS,
  chanceOstral,
  hasard,
  simuler,
  tableauDeBord,
} from "../../src/engine/episodes/facture-qui-flambe";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/facture-qui-flambe";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_ENERGIE } from "../../src/pedagogy/episodes/facture-qui-flambe";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La facture qui flambe » enseigne trois choses : l'énergie part
 * quand les sites sont fermés, et c'est là qu'on la coupe, après l'avoir
 * mesurée, plutôt que de couper partout ; le prix fixe protège mais se paie,
 * et le contrat mixte laisse la sobriété porter sur la part indexée ; un
 * client exigeant se convainc par des preuves, pas par de l'affichage. Ces
 * tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 1, 0, 1, 0, 0];
const REFLEXE = [0, 0, 1, 0, 1, 1];
const ATTENTISTE = [3, 0, 3, 3, 3, 3];
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
/** L'option qui protège le mieux dans les mauvais tirages. */
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;

describe("le modèle de l'énergie", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.prixMarche).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.prixMarche,
      6,
    );
    expect(simuler(MEILLEUR, 12).froid).toBe(simuler(ATTENTISTE, 12).froid);
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

  it("le froid tombe environ quatre trimestres sur dix", () => {
    const froids = GRAINES_DU_BILAN.filter((g) => hasard(g).froid).length;
    expect(froids / GRAINES_DU_BILAN.length).toBeGreaterThan(CHANCE_FROID - 0.2);
    expect(froids / GRAINES_DU_BILAN.length).toBeLessThan(CHANCE_FROID + 0.2);
  });

  it("la bonne méthode baisse la consommation et tient le budget ; l'attente ne baisse rien", () => {
    const bon = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g, JOURS));
    const rien = GRAINES_DU_BILAN.map((g) => simuler(ATTENTISTE, g, JOURS));
    expect(moyenne(bon.map((t) => t.indiceMoyen))).toBeLessThan(80);
    expect(moyenne(rien.map((t) => t.indiceMoyen))).toBeCloseTo(100, 0);
    expect(moyenne(bon.map((t) => t.cout))).toBeLessThan(150000);
    expect(moyenne(rien.map((t) => t.cout))).toBeGreaterThan(170000);
    expect(moyenne(rien.map((t) => t.cout))).toBeLessThan(200000);
  });

  it("couper partout fait exercer au CSE son droit d'alerte ; couper le dépôt pendant le froid le fait geler", () => {
    const alertes = GRAINES_DU_BILAN.filter((g) => simuler(REFLEXE, g).alerteCse > 0).length;
    const gels = GRAINES_DU_BILAN.filter((g) => simuler(REFLEXE, g).gel).length;
    expect(alertes).toBeGreaterThan(3);
    expect(gels).toBeGreaterThan(2);
    expect(
      GRAINES_DU_BILAN.some((g) => simuler(MEILLEUR, g).alerteCse || simuler(MEILLEUR, g).gel),
    ).toBe(false);
  });

  it("la part consommée sites fermés n'apparaît qu'avec les sous-compteurs", () => {
    expect(tableauDeBord([3], 4, 0, 4).horsHoraires).toBeNull();
    expect(tableauDeBord([1], 4, 0, 4).horsHoraires).toBeGreaterThan(0.3);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : mesurer d'abord est de loin le meilleur choix ; couper partout ne paie pas", () => {
    const r = rejeu(MEILLEUR, D.premier);
    expect(classement(MEILLEUR, D.premier)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
  });

  it("D2 : le contrat mixte est le meilleur en moyenne, le prix fixe du courtier le plus sûr, Volténa le pire", () => {
    const r = rejeu(MEILLEUR, D.contrat);
    const c = classement(MEILLEUR, D.contrat);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.contrat)).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    // Tout indexer : un bon pari en moyenne, le pire dans les mauvais tirages.
    expect(r[3]!.p10).toBeLessThan(Math.min(r[1]!.p10, r[2]!.p10));
  });

  it("la clause de volume de Volténa fait payer les économies : elle tombe sur qui a été sobre", () => {
    const sobre = simuler([1, 0, 0, 1, 0, 0], 3);
    const attentiste = simuler(ATTENTISTE, 3);
    expect(sobre.penaliteVolume).toBeGreaterThan(3000);
    expect(attentiste.penaliteVolume).toBe(0);
  });

  it("D3 : le plan ciblé bat les thermostats verrouillés, le défi et le laisser-faire, d'autant plus qu'on a mesuré", () => {
    expect(classement(MEILLEUR, D.sobriete)[0]).toBe(0);
    const ecart = (c: readonly number[]) => {
      const r = rejeu(c, D.sobriete);
      return r[0]!.attendu - r[1]!.attendu;
    };
    expect(ecart(MEILLEUR)).toBeGreaterThan(ecart([3, 1, 0, 1, 0, 0]));
  });

  it("D4 : les déstratificateurs, sur le premier poste, battent les LED et l'étude du grand programme", () => {
    const c = classement(MEILLEUR, D.investissement);
    expect(c[0]).toBe(1);
    expect(c.indexOf(2)).toBeGreaterThan(c.indexOf(0));
  });

  it("D5 : un plan mesuré et chiffré garde Ostral ; l'affichage le fait partir", () => {
    const c = classement(MEILLEUR, D.ostral);
    expect(c[0]).toBe(0);
    expect(c.slice(-2).sort()).toEqual([1, 2]);
  });

  it("le plan carbone convainc deux fois mieux quand on a mesuré en semaine 1", () => {
    const sansMesure = [3, 1, 0, 1, 0, 0];
    expect(chanceOstral(MEILLEUR, true)).toBeGreaterThan(chanceOstral(sansMesure, true) + 0.2);
    const gain = (c: readonly number[]) => {
      const r = rejeu(c, D.ostral);
      return r[0]!.attendu - r[3]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain(sansMesure));
  });

  it("D6 : préparer le froid bat la coupure du dépôt, qui fait courir le risque du gel", () => {
    const c = classement(MEILLEUR, D.froid);
    expect(c[0]).toBe(0);
    const r = rejeu(MEILLEUR, D.froid);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(3000);
    expect(r[1]!.p10).toBeLessThan(r[0]!.p10);
  });

  it("mesurer puis cibler bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(40000);
    expect(bonne! - attentiste!).toBeGreaterThan(40000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["courbe", "tournee"],
      ["offres", "clause"],
      ["souscompteurs"],
      ["postes"],
      ["exigences"],
      ["meteo"],
    ],
    jours: JOURS,
    diagnostic: "horsHoraires",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 140,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_ENERGIE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de cibler plutôt que de couper partout", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_ENERGIE.comportements(p, analyser(EPISODE_ENERGIE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_ENERGIE.axe(c).titre).toBe("Cibler plutôt que couper partout");
  });

  it("à qui a décidé sans enquêter, propose de mesurer avant d'agir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ENERGIE.comportements(p, analyser(EPISODE_ENERGIE, p).trimestre);
    expect(EPISODE_ENERGIE.axe(c).titre).toBe("Mesurer avant d'agir");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_ENERGIE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_ENERGIE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });
});
