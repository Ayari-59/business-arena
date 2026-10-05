import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  hasard,
  nettoyageDecouvert,
  refonteGlisse,
  simuler,
} from "../../src/engine/episodes/controle-qui-s-annonce";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/controle-qui-s-annonce";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_CONFORMITE } from "../../src/pedagogy/episodes/controle-qui-s-annonce";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le contrôle qui s'annonce » enseigne trois choses : un écart
 * qu'on montre avec son plan de correction coûte bien moins qu'un écart que
 * le contrôleur trouve seul — à condition de savoir ce qu'il va trouver ; les
 * retards de paiement se corrigent dans le circuit de validation, pas en
 * vidant l'arriéré ni en gelant les paiements ; et maquiller un dossier est
 * toujours la pire option. Ces tests verrouillent les classements qui le
 * disent.
 */

const MEILLEUR = [0, 0, 0, 0, 0, 0];
const REFLEXE = [2, 2, 3, 2, 1, 2];
const ATTENTISTE = [3, 3, 3, 3, 2, 2];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};

describe("le modèle de la conformité", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.retard).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.retard,
      6,
    );
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("corriger le circuit ramène les retards sous l'objectif ; l'attente les laisse où ils sont", () => {
    expect(simuler(MEILLEUR, 3).retardFinal).toBeLessThan(0.05);
    expect(simuler(ATTENTISTE, 3).retardFinal).toBeGreaterThan(0.15);
  });

  it("la mise en service glisse parfois, et les accords antidatés sont souvent découverts", () => {
    const glisse = GRAINES_DU_BILAN.filter((g) => refonteGlisse(MEILLEUR, g)).length;
    expect(glisse).toBeGreaterThan(3);
    expect(glisse).toBeLessThan(15);
    const fraude = avec(MEILLEUR, D.remises, 1);
    const decouverts = GRAINES_DU_BILAN.filter((g) => nettoyageDecouvert(fraude, g)).length;
    expect(decouverts).toBeGreaterThan(8);
    expect(decouverts).toBeLessThan(22);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : l'audit ciblé est de loin le meilleur choix ; geler les paiements est le pire", () => {
    const c = classement(MEILLEUR, D.audit);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(2);
    const r = rejeu(MEILLEUR, D.audit);
    expect(r[0]!.attendu - Math.max(r[1]!.attendu, r[3]!.attendu)).toBeGreaterThan(15000);
  });

  it("D2 : refondre le circuit est le meilleur en moyenne, les délégations le plus sûr ; payer l'arriéré ne sert à rien", () => {
    const r = rejeu(MEILLEUR, D.circuit);
    expect(classement(MEILLEUR, D.circuit)[0]).toBe(0);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    expect(r[1]!.p10).toBeGreaterThan(r[0]!.p10);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
    expect(Math.abs(r[2]!.attendu - r[3]!.attendu)).toBeLessThan(1000);
  });

  it("D3 : régulariser bat tout ; antidater les accords est la pire option, même quand ça ne se voit pas", () => {
    const c = classement(MEILLEUR, D.remises);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
    const fraude = avec(MEILLEUR, D.remises, 1);
    for (const g of GRAINES_DU_BILAN) {
      expect(objectif(fraude, g), `graine ${g}`).toBeLessThan(objectif(MEILLEUR, g));
    }
  });

  it("D4 : la note d'autodiagnostic est la meilleure, et elle vaut surtout quand on a audité", () => {
    const c = classement(MEILLEUR, D.controle);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(2);
    const gain = (chemin: readonly number[]) =>
      attendu(avec(chemin, D.controle, 0)) - attendu(avec(chemin, D.controle, 3));
    const sansAudit = avec(MEILLEUR, D.audit, 3);
    expect(gain(MEILLEUR)).toBeGreaterThan(gain(sansAudit) + 10000);
  });

  it("D5 : reconnaître et prouver bat le silence, qui bat la contestation en bloc", () => {
    expect(classement(MEILLEUR, D.rapport)).toEqual([0, 2, 1]);
  });

  it("D6 : former les équipes est le meilleur choix, et vaut d'autant plus que le circuit a été refondu", () => {
    expect(classement(MEILLEUR, D.suite)[0]).toBe(0);
    const gain = (chemin: readonly number[]) =>
      attendu(avec(chemin, D.suite, 0)) - attendu(avec(chemin, D.suite, 2));
    expect(gain(MEILLEUR)).toBeGreaterThan(gain(avec(MEILLEUR, D.circuit, 3)) + 5000);
  });

  it("savoir, corriger et montrer bat le blocage et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(50000);
    expect(methode! - attentiste!).toBeGreaterThan(50000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["extraction", "facture"],
      ["chefs"],
      ["juriste"],
      ["doctrine"],
      ["pv"],
      ["semaines"],
    ],
    jours: JOURS,
    diagnostic: "circuit",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 20,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_CONFORMITE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a bloqué puis minimisé, propose de corriger plutôt que bloquer ou maquiller", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_CONFORMITE.comportements(p, analyser(EPISODE_CONFORMITE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CONFORMITE.axe(c).titre).toBe("Corriger plutôt que bloquer ou maquiller");
  });

  it("à qui a décidé sans enquêter, propose de savoir avant le contrôleur", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_CONFORMITE.comportements(p, analyser(EPISODE_CONFORMITE, p).trimestre);
    expect(EPISODE_CONFORMITE.axe(c).titre).toBe("Savoir avant le contrôleur");
  });

  it("ne présente jamais la dissimulation comme une réussite", () => {
    const fraude = avec(MEILLEUR, D.remises, 1);
    for (const graine of [2, 11, 4242]) {
      const p = partie(fraude, { graine });
      const t = simuler(fraude, graine, JOURS);
      const c = EPISODE_CONFORMITE.comportements(p, t);
      expect(c[4]!.score).toBe(0);
      expect(c[4]!.texte).toMatch(/faux/);
      expect(EPISODE_CONFORMITE.bilan.tuiles(t)[2]!.tenu).toBe(false);
    }
  });

  it("dit le résultat en écart au budget de conformité", () => {
    expect(EPISODE_CONFORMITE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_CONFORMITE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });
});
