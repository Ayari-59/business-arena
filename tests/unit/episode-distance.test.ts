import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  facteurElodie,
  hasard,
  risqueKillian,
  simuler,
} from "../../src/engine/episodes/equipe-dispersee";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/equipe-dispersee";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_DISTANCE } from "../../src/pedagogy/episodes/equipe-dispersee";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'équipe dispersée » enseigne trois choses : surveiller une
 * équipe itinérante éteint les meilleurs sans rien apprendre aux plus
 * faibles, des objectifs clairs et des rituels réguliers tiennent le lien
 * que l'isolement use, et ce sont les pairs qui font progresser les
 * débutants, à condition d'adapter son style à chacun. Ces tests
 * verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 0, 1, 0, 0, 1];
const CONTROLE = [0, 2, 0, 2, 2, 0];
const LAISSER = [3, 3, 3, 3, 1, 3];
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
const sur30 = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => boolean) =>
  GRAINES_DU_BILAN.filter((g) => f(simuler(c, g))).length;

describe("le modèle de l'équipe itinérante", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Deux chemins qui ne divergent qu'à partir de la deuxième décision vivent les mêmes trois semaines.
    const a = simuler(MEILLEUR, 12);
    const b = simuler([1, 3, 3, 3, 1, 3], 12);
    expect(b.semaines[3]!.marge).toBeCloseTo(a.semaines[3]!.marge, 6);
    expect(b.semaines[3]!.engagement).toBeCloseTo(a.semaines[3]!.engagement, 6);
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

  it("les rituels et les pairs resserrent l'écart de résultats ; le laisser-faire le laisse en place", () => {
    const ecart = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).ecartFinal));
    expect(ecart(MEILLEUR)).toBeLessThan(1.5);
    expect(ecart(LAISSER)).toBeGreaterThan(1.9);
  });

  it("le contrôle remplit les comptes rendus sans faire remonter d'affaires", () => {
    const fin = (c: readonly number[]) => simuler(c, 4).semaines[13]!;
    const remontees = (c: readonly number[]) =>
      simuler(c, 4)
        .semaines.slice(1)
        .reduce((s, w) => s + w!.opportunites, 0);
    expect(fin(CONTROLE).comptesRendus).toBeGreaterThan(fin(MEILLEUR).comptesRendus);
    expect(remontees(CONTROLE)).toBeLessThan(remontees(MEILLEUR) / 2);
  });

  it("le contrôle fait partir Ambre, l'isolement fait partir Killian ; la bonne méthode garde tout le monde", () => {
    expect(sur30(MEILLEUR, (t) => t.elodiePart || t.killianPart)).toBe(0);
    expect(sur30(CONTROLE, (t) => t.elodiePart)).toBeGreaterThan(15);
    expect(sur30(LAISSER, (t) => t.killianPart)).toBeGreaterThan(0);
    expect(risqueKillian(0.5)).toBe(0);
    expect(risqueKillian(0.3)).toBeGreaterThan(0.4);
    // Une mission répond à ce qui la fait partir, à moitié seulement tant que le boîtier reste.
    expect(facteurElodie([1, 0, 1, 0, 0, 1])).toBeLessThan(facteurElodie([0, 0, 1, 0, 0, 1]));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : objectifs et rituels sont de loin le meilleur choix ; la géolocalisation le pire", () => {
    const r = rejeu(MEILLEUR, D.cadre);
    const c = classement(MEILLEUR, D.cadre);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
    // Des objectifs sans rituel valent mieux que rien, moins que des objectifs suivis.
    expect(r[2]!.attendu).toBeGreaterThan(r[3]!.attendu);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
  });

  it("D2 : le binôme rapporte le plus en moyenne, l'accompagnement par le manager protège mieux", () => {
    const r = rejeu(MEILLEUR, D.debutants);
    expect(classement(MEILLEUR, D.debutants)[0]).toBe(0);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(1);
    // Le plan de visites renforcé ne vaut pas mieux que de ne rien faire.
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    // Sous le boîtier, les anciens transmettent sans entrain : le binôme n'est plus le meilleur choix.
    expect(classement(CONTROLE, D.debutants)[0]).not.toBe(0);
  });

  it("D3 : un compte rendu court et lu bat le rappel à l'ordre, qui est le pire choix", () => {
    const r = rejeu(MEILLEUR, D.comptesRendus);
    const c = classement(MEILLEUR, D.comptesRendus);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(r[1]!.attendu - Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(10000);
  });

  it("D4 : une mission retient Ambre mieux que l'argent ; rappeler le cadre est le pire", () => {
    const c = classement(MEILLEUR, D.elodie);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(2);
    // Sous le contrôle, la mission compte d'autant plus que le risque est haut.
    expect(classement(CONTROLE, D.elodie)[0]).toBe(0);
  });

  it("D5 : l'atelier entre pairs lance la gamme le mieux, à condition d'avoir encore des animateurs", () => {
    const r = rejeu(MEILLEUR, D.gamme);
    expect(classement(MEILLEUR, D.gamme)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    // Après le boîtier et le départ d'Ambre, l'atelier ne vaut plus mieux que le technicien.
    expect(classement(CONTROLE, D.gamme)[0]).not.toBe(0);
  });

  it("D6 : débloquer les devis bat le point quotidien, moins bon que de ne rien faire", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu);
    // La remise est un pari : le pire des mauvais tirages.
    expect(Math.min(...r.map((x) => x.p10))).toBe(r[2]!.p10);
  });

  it("objectifs, rituels et pairs battent nettement le contrôle et le laisser-faire, en moyenne", () => {
    const [methode, controle, laisser] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - controle!).toBeGreaterThan(50000);
    expect(methode! - laisser!).toBeGreaterThan(40000);
    expect(laisser!).toBeGreaterThan(controle!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["visites", "appels"], ["devis"], ["outil"], ["cafe"], ["bardage"], ["encours"]],
    jours: JOURS,
    diagnostic: "isolement",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 54,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_DISTANCE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a surveillé partout, propose de piloter par les résultats et le lien", () => {
    const p = partie(CONTROLE);
    const c = EPISODE_DISTANCE.comportements(p, analyser(EPISODE_DISTANCE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_DISTANCE.axe(c).titre).toBe(
      "Piloter par les résultats et le lien, pas par la surveillance",
    );
  });

  it("à qui a décidé sans enquêter, propose de chercher ce qui fait les écarts", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_DISTANCE.comportements(p, analyser(EPISODE_DISTANCE, p).trimestre);
    expect(EPISODE_DISTANCE.axe(c).titre).toBe("Chercher ce qui fait les écarts");
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_DISTANCE.bilan.titre(simuler(MEILLEUR, 1))).toMatch(/au-dessus du budget/);
    expect(EPISODE_DISTANCE.bilan.titre(simuler(LAISSER, 1))).toMatch(/sous le budget/);
  });
});
