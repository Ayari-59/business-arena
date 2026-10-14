import { describe, expect, it } from "vitest";
import {
  D,
  ENVELOPPE,
  IMPREVUS,
  chanceDeLevee,
  hasard,
  simuler,
} from "../../src/engine/episodes/preavis-de-greve";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/preavis-de-greve";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_DIALOGUE_SOCIAL } from "../../src/pedagogy/episodes/preavis-de-greve";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le préavis de grève » enseigne trois choses : la confiance se
 * construit dans la durée (partager les chiffres, tenir ses engagements) et sa
 * perte se paie plus tard ; négocier les intérêts plutôt que les positions
 * donne plus pour moins cher ; une grève coûte, mais céder sous la menace
 * aussi. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 2, 2, 0, 2, 0];
const REFLEXE = [0, 0, 0, 1, 0, 2];
const ATTENTISTE = [3, 0, 3, 1, 1, 3];
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

describe("le modèle de la négociation des dépôts", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.service).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.service,
      6,
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

  it("la bonne méthode garde la confiance et l'enveloppe ; l'attente les perd", () => {
    const bon = simuler(MEILLEUR, 3);
    const neutre = simuler(ATTENTISTE, 3);
    expect(bon.confianceFinale).toBeGreaterThan(0.6);
    expect(neutre.confianceFinale).toBeLessThan(0.2);
    expect(bon.mesures).toBeLessThanOrEqual(ENVELOPPE);
    expect(neutre.joursDeGreve).toBeGreaterThanOrEqual(3);
  });

  it("le préavis tombe au hasard, plus souvent quand la direction a ouvert ses chiffres", () => {
    const levees = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).preavisLeve).length;
    expect(levees(MEILLEUR)).toBeGreaterThan(5);
    expect(levees(MEILLEUR)).toBeLessThan(30);
    expect(levees(ATTENTISTE)).toBe(0);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : ouvrir les chiffres est de loin le meilleur choix ; fermer ou tout lâcher coûte cher", () => {
    const r = rejeu(MEILLEUR, D.ouverture);
    expect(classement(MEILLEUR, D.ouverture)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(30000);
  });

  it("D2 : la méthode est la meilleure en moyenne, l'avance contre la levée la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.preavis);
    expect(classement(MEILLEUR, D.preavis)[0]).toBe(2);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[3]!.p10);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
  });

  it("D2 : la même méthode marche bien plus souvent après une ouverture franche", () => {
    expect(chanceDeLevee([1, 2])).toBeGreaterThan(chanceDeLevee([0, 2]) + 0.2);
    expect(chanceDeLevee([3, 2])).toBe(chanceDeLevee([0, 2]));
  });

  it("D3 : le paquet bâti sur les intérêts bat le pourcentage, la prime et l'attente", () => {
    const r = rejeu(MEILLEUR, D.paquet);
    expect(classement(MEILLEUR, D.paquet)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
  });

  it("D3 : un pourcentage annoncé d'entrée renchérit le paquet", () => {
    expect(simuler([0, 2, 2, 0, 2, 0], 3).points).toBeGreaterThan(simuler(MEILLEUR, 3).points);
  });

  it("D4 : les samedis volontaires et planifiés sont le meilleur choix ; les imposer coûte d'autant plus qu'on avait promis", () => {
    expect(classement(MEILLEUR, D.samedis)[0]).toBe(0);
    const imposer = (c: readonly number[]) => {
      const r = rejeu(c, D.samedis);
      return r[0]!.attendu - r[1]!.attendu;
    };
    // Après la promesse d'un planning à quinze jours, l'imposer est bien plus cher qu'après un pourcentage.
    expect(imposer(MEILLEUR)).toBeGreaterThan(imposer([1, 2, 0, 0, 2, 0]) + 5000);
  });

  it("D5 : le dernier paquet chiffré bat la signature sous la menace et le passage en force", () => {
    const r = rejeu(MEILLEUR, D.cloture);
    expect(classement(MEILLEUR, D.cloture)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(8000);
  });

  it("D6 : tenir le calendrier vaut mieux que décaler, se taire ou acheter la paix", () => {
    const r = rejeu(MEILLEUR, D.suivi);
    expect(classement(MEILLEUR, D.suivi)[0]).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
    expect(r[0]!.attendu - Math.max(r[1]!.attendu, r[3]!.attendu)).toBeGreaterThan(5000);
  });

  it("partager, négocier les intérêts et tenir parole bat la fermeté puis la concession, et l'attente", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 50000);
    expect(methode).toBeGreaterThan(attentiste! + 50000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["grille", "elus"],
      ["equipes"],
      ["chiffrage"],
      ["volontaires"],
      ["manque"],
      ["engagements"],
    ],
    jours: 2,
    diagnostic: "interets",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 40,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_DIALOGUE_SOCIAL, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a été ferme puis a cédé, propose de sortir de ce réflexe", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_DIALOGUE_SOCIAL.comportements(
      p,
      analyser(EPISODE_DIALOGUE_SOCIAL, p).trimestre,
    );
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_DIALOGUE_SOCIAL.axe(c).titre).toBe(
      "Ni refus de principe, ni concession sous la menace",
    );
  });

  it("à qui a décidé sans enquêter, propose de chercher ce qu'il y a derrière la revendication", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_DIALOGUE_SOCIAL.comportements(
      p,
      analyser(EPISODE_DIALOGUE_SOCIAL, p).trimestre,
    );
    expect(EPISODE_DIALOGUE_SOCIAL.axe(c).titre).toBe(
      "Chercher ce qu'il y a derrière la revendication",
    );
  });

  it("dit le résultat en écart à l'enveloppe", () => {
    expect(EPISODE_DIALOGUE_SOCIAL.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /sous l'enveloppe/,
    );
    expect(EPISODE_DIALOGUE_SOCIAL.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(
      /au-delà de l'enveloppe/,
    );
  });
});
