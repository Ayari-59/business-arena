import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceQueLePiloteReussisse,
  chanceQuePatrickAccepte,
  hasard,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/reorganisation-qui-coince";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/reorganisation-qui-coince";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_CHANGEMENT } from "../../src/pedagogy/episodes/reorganisation-qui-coince";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La réorganisation qui coince » enseigne trois choses : la
 * performance baisse d'abord quand une organisation change, et ne remonte que
 * si l'équipe adhère ; l'adhésion se construit en écoutant, en faisant la
 * preuve avec des volontaires et en associant les influents, pas en imposant
 * ni en cédant ; et le contrôle fabrique des saisies, pas de l'usage. Ces
 * tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 0, 1, 1];
const IMPOSER = [0, 0, 0, 1, 0, 0];
const ATTENTISTE = [3, 3, 3, 3, 3, 3];
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

describe("le modèle de la région commerciale", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toEqual(hasard(12));
    // Tant que les décisions n'ont pas divergé, les semaines sont identiques.
    expect(simuler(MEILLEUR, 12).semaines[3]!.ca).toBeCloseTo(
      simuler([1, 0, 0, 1, 0, 0], 12).semaines[3]!.ca,
      6,
    );
    expect(simuler(MEILLEUR, 12, 3).semaines[1]!.cout).toBe(
      simuler(IMPOSER, 12, 3).semaines[1]!.cout,
    );
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

  it("la courbe du changement : le chiffre creuse d'abord, puis la nouvelle organisation rapporte si elle est adoptée", () => {
    const g = 3;
    const t = simuler(MEILLEUR, g);
    const creux = Math.max(...t.semaines.slice(4, 8).map((s) => s!.creux));
    expect(creux).toBeGreaterThan(0);
    expect(t.valeurLaissee).toBeGreaterThan(0);
    // Imposé, le creux est bien plus profond et le gain ne vient pas.
    const brutal = simuler(IMPOSER, g);
    expect(brutal.pireSemaine).toBeLessThan(t.pireSemaine);
    expect(brutal.valeurLaissee).toBeLessThan(t.valeurLaissee);
  });

  it("le contrôle fait monter les saisies, pas l'usage réel", () => {
    const controle = simuler(IMPOSER, 5);
    expect(controle.saisiesFinales).toBeGreaterThan(0.8);
    expect(controle.usageFinal).toBeLessThan(0.25);
    const adhesion = simuler(MEILLEUR, 5);
    expect(adhesion.usageFinal).toBeGreaterThan(controle.usageFinal + 0.3);
  });

  it("imposer fait partir Patrick bien plus souvent", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).patrickPart).length;
    expect(departs(MEILLEUR)).toBeLessThanOrEqual(5);
    expect(departs(IMPOSER)).toBeGreaterThan(20);
    expect(risqueDeDepart(0.2)).toBe(0);
    expect(risqueDeDepart(1)).toBeGreaterThan(0.8);
  });

  it("garde des indicateurs réalistes", () => {
    for (const c of [MEILLEUR, IMPOSER, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g);
        for (const s of t.semaines.slice(1)) {
          expect(s!.ca).toBeGreaterThan(300000);
          expect(s!.ca).toBeLessThan(500000);
          expect(s!.adhesion).toBeGreaterThanOrEqual(0.1);
          expect(s!.adhesion).toBeLessThanOrEqual(0.95);
        }
        expect(Math.abs(t.objectif)).toBeLessThan(200000);
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : écouter chacun vaut bien mieux que tenir la ligne ou laisser retomber", () => {
    const r = rejeu(MEILLEUR, D.annonce);
    expect(classement(MEILLEUR, D.annonce)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
  });

  it("D2 : le pilote avec des volontaires bat la bascule de toute l'équipe, et réussit plus souvent après l'écoute", () => {
    const r = rejeu(MEILLEUR, D.bascule);
    expect(classement(MEILLEUR, D.bascule)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(8000);
    expect(chanceQueLePiloteReussisse(MEILLEUR)).toBeGreaterThan(
      chanceQueLePiloteReussisse([0, 1, 1, 0, 1, 1]),
    );
  });

  it("D3 : simplifier l'outil avec les commerciaux bat la saisie obligatoire", () => {
    const r = rejeu(MEILLEUR, D.outil);
    const c = classement(MEILLEUR, D.outil);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
  });

  it("D4 : associer Patrick est le meilleur pari, l'exempter le plus sûr, le recadrer le pire", () => {
    const r = rejeu(MEILLEUR, D.patrick);
    const c = classement(MEILLEUR, D.patrick);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
    // L'espérance et la robustesse s'opposent : l'exempter protège des mauvais tirages.
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[2]!.p10);
    expect(r[2]!.p10).toBeGreaterThan(r[0]!.p10);
  });

  it("D4 : associer Patrick ne marche que si on l'a écouté en semaine 1", () => {
    const sansEcoute = [2, 1, 1, 0, 1, 1];
    expect(chanceQuePatrickAccepte(MEILLEUR, 1)).toBeGreaterThan(
      chanceQuePatrickAccepte(sansEcoute, 1),
    );
    const r = rejeu(sansEcoute, D.patrick);
    expect(r[2]!.attendu).toBeGreaterThan(r[0]!.attendu);
    expect(classement(MEILLEUR, D.patrick)[0]).toBe(0);
  });

  it("D5 : finir en deux vagues avec des binômes bat la bascule de tous d'un coup", () => {
    const r = rejeu(MEILLEUR, D.generalisation);
    expect(classement(MEILLEUR, D.generalisation)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D6 : mesurer l'usage réel bat le classement des saisies et le challenge", () => {
    const c = classement(MEILLEUR, D.fin);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
  });

  it("faire adhérer bat l'injonction et l'attentisme, en moyenne", () => {
    const [adherer, imposer, attendre] = REFERENCES.map((r) => attendu(r.chemin));
    expect(adherer! - imposer!).toBeGreaterThan(50000);
    expect(adherer! - attendre!).toBeGreaterThan(25000);
    expect(attendre).toBeGreaterThan(imposer!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["entretiens", "regions"],
      ["volontaires"],
      ["fiches"],
      ["dejeuner"],
      ["passations"],
      ["usage"],
    ],
    jours: JOURS,
    diagnostic: "objections",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 44,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_CHANGEMENT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a imposé partout, propose de construire l'adhésion", () => {
    const p = partie(IMPOSER);
    const c = EPISODE_CHANGEMENT.comportements(p, analyser(EPISODE_CHANGEMENT, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CHANGEMENT.axe(c).titre).toBe(
      "Construire l'adhésion plutôt que l'imposer ou céder",
    );
  });

  it("à qui a reporté et cédé partout, propose aussi de construire l'adhésion", () => {
    const p = partie(ATTENTISTE);
    const c = EPISODE_CHANGEMENT.comportements(p, analyser(EPISODE_CHANGEMENT, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CHANGEMENT.axe(c).titre).toBe(
      "Construire l'adhésion plutôt que l'imposer ou céder",
    );
  });

  it("à qui a décidé sans enquêter, propose d'écouter les objections", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_CHANGEMENT.comportements(p, analyser(EPISODE_CHANGEMENT, p).trimestre);
    expect(EPISODE_CHANGEMENT.axe(c).titre).toBe("Écouter les objections avant d'agir");
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_CHANGEMENT.bilan.titre(simuler(MEILLEUR, 11))).toMatch(/au-dessus du budget/);
    expect(EPISODE_CHANGEMENT.bilan.titre(simuler(IMPOSER, 11))).toMatch(/en dessous du budget/);
  });
});
