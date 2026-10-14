import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  RISQUE_CIMIER,
  chanceDeCoupure,
  chanceFacilite,
  hasard,
  prevoir,
  simuler,
  tableauDeBord,
} from "../../src/engine/episodes/tresorerie-qui-fond";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/tresorerie-qui-fond";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_TRESORERIE } from "../../src/pedagogy/episodes/tresorerie-qui-fond";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La trésorerie qui fond » enseigne trois choses : l'argent d'une
 * filiale qui croît dort dans son BFR, et c'est là qu'on va le chercher, par
 * une relance ciblée et un stock assaini ; le crédit qu'on prend sans le
 * demander, aux fournisseurs ou au-delà de l'autorisation, est le plus cher ;
 * une banque prévenue tôt finance le pic, et c'est elle qui rend l'escompte
 * rentable. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 0, 0, 1];
const REFLEXE = [0, 2, 2, 2, 2, 0];
const ATTENTISTE = [3, 3, 3, 3, 2, 3];
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

describe("le modèle de la trésorerie", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.dso).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.dso,
      6,
    );
    expect(simuler(MEILLEUR, 12).cimierDefaut).toBe(simuler(ATTENTISTE, 12).cimierDefaut);
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

  it("sans rien faire, le découvert déborde l'autorisation ; la bonne méthode le tient", () => {
    const enDepassement = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).semainesEnDepassement));
    expect(enDepassement(ATTENTISTE)).toBeGreaterThan(5);
    expect(enDepassement(MEILLEUR)).toBeLessThan(1);
    for (const g of GRAINES_DU_BILAN)
      expect(simuler(ATTENTISTE, g).decouvertMax).toBeLessThan(2600000);
    const fin = (c: readonly number[], cle: "dsoFinal" | "stockFinal") =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g)[cle]));
    expect(fin(MEILLEUR, "dsoFinal")).toBeLessThan(52);
    expect(fin(MEILLEUR, "stockFinal")).toBeLessThan(70);
    expect(fin(ATTENTISTE, "dsoFinal")).toBeGreaterThan(58);
    expect(fin(ATTENTISTE, "stockFinal")).toBeGreaterThan(74);
  });

  it("payer les fournisseurs en retard expose à la coupure de l'assureur-crédit de Norvia", () => {
    expect(chanceDeCoupure(MEILLEUR)).toBe(0);
    expect(chanceDeCoupure(REFLEXE)).toBeGreaterThan(0);
    const coupures = GRAINES_DU_BILAN.filter((g) => simuler(REFLEXE, g).norviaCoupe).length;
    expect(coupures).toBeGreaterThan(5);
    expect(coupures).toBeLessThan(25);
    expect(simuler(REFLEXE, 4).remisePerdue).toBe(true);
  });

  it("Cimier fait défaut environ une fois sur cinq, quelles que soient les décisions", () => {
    const defauts = GRAINES_DU_BILAN.filter((g) => simuler(ATTENTISTE, g).cimierDefaut).length;
    expect(defauts).toBeGreaterThanOrEqual(2);
    expect(defauts).toBeLessThanOrEqual(30 * RISQUE_CIMIER * 2);
  });

  it("la prévision part de la situation de la semaine et voit le pic de fin de trimestre", () => {
    const l = tableauDeBord([], 1, 0, 0);
    expect(l.previsionPic!).toBeGreaterThan(l.autorisation!);
    expect(l.premierDepassement).toBeGreaterThan(0);
    expect(l.picAvecEscompte!).toBeGreaterThan(l.previsionPic!);
    expect(prevoir(MEILLEUR).decouvertMax).toBeLessThan(prevoir(ATTENTISTE).decouvertMax);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la relance ciblée est la meilleure ; décaler les fournisseurs est bien pire", () => {
    const r = rejeu(MEILLEUR, D.relance);
    expect(classement(MEILLEUR, D.relance)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(8000);
  });

  it("D2 : un plan présenté à la banque bat la demande sans dossier, le factor et l'attente", () => {
    const r = rejeu(MEILLEUR, D.banque);
    expect(classement(MEILLEUR, D.banque)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D3 : l'échéancier est le meilleur en moyenne, la cession sans recours la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.cimier);
    expect(classement(MEILLEUR, D.cimier)[0]).toBe(0);
    expect(plusSure(MEILLEUR, D.cimier)).toBe(1);
    expect(r[1]!.p10 - r[0]!.p10).toBeGreaterThan(10000);
    // L'injonction de payer, le réflexe, est la pire des options.
    expect(classement(MEILLEUR, D.cimier).at(-1)).toBe(2);
  });

  it("D4 : assainir les dormants bat la promotion générale et le gel des commandes", () => {
    const c = classement(MEILLEUR, D.stock);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(2);
    const r = rejeu(MEILLEUR, D.stock);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
  });

  it("D5 : l'escompte paie quand la banque suit, et coûte quand on l'a fait attendre", () => {
    expect(classement(MEILLEUR, D.escompte)[0]).toBe(0);
    const banqueRepoussee = [1, 3, 0, 0, 0, 1];
    const r = rejeu(banqueRepoussee, D.escompte);
    expect(r[2]!.attendu).toBeGreaterThan(r[0]!.attendu + 5000);
  });

  it("D6 : la facilité vaut d'autant plus que la banque a reçu un plan en semaine 3", () => {
    expect(chanceFacilite(MEILLEUR)).toBeGreaterThan(chanceFacilite([1, 1, 0, 0, 0, 1]));
    expect(chanceFacilite([1, 1, 0, 0, 0, 1])).toBeGreaterThan(chanceFacilite([1, 3, 0, 0, 0, 1]));
    const r = rejeu(MEILLEUR, D.pic);
    expect(classement(MEILLEUR, D.pic)[0]).toBe(1);
    // Décaler les fournisseurs au moment du pic est le pire choix.
    expect(classement(MEILLEUR, D.pic).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    // Sans plan présenté à la banque, la facilité n'est plus le bon choix.
    expect(classement([1, 3, 0, 0, 0, 1], D.pic)[0]).not.toBe(1);
  });

  it("chercher le cash dans le BFR bat nettement le réflexe et l'attentisme, en moyenne", () => {
    const [bfr, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bfr! - reflexe!).toBeGreaterThan(50000);
    expect(bfr! - attentiste!).toBeGreaterThan(50000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["balance", "bfr"], ["comite"], ["note"], ["rotation"], ["calcul"], ["pic"]],
    jours: JOURS,
    diagnostic: "bfr",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 1050,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_TRESORERIE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tiré sur les fournisseurs et le factor, propose de libérer le cash là où il dort", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_TRESORERIE.comportements(p, analyser(EPISODE_TRESORERIE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_TRESORERIE.axe(c).titre).toBe("Libérer le cash là où il dort");
  });

  it("à qui a décidé sans enquêter, propose de chercher où dort l'argent", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_TRESORERIE.comportements(p, analyser(EPISODE_TRESORERIE, p).trimestre);
    expect(EPISODE_TRESORERIE.axe(c).titre).toBe("Chercher où dort l'argent");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_TRESORERIE.bilan.titre(simuler(MEILLEUR, 2))).toMatch(/sous le budget/);
    expect(EPISODE_TRESORERIE.bilan.titre(simuler(ATTENTISTE, 2))).toMatch(/au-delà du budget/);
  });
});
