import { describe, expect, it } from "vitest";
import {
  GRAINES_DU_BILAN,
  NEUTRE,
  OBJECTIF_CA,
  cheminComplet,
  moyenne,
  rejouer,
  simuler,
  tableauDeBord,
  type Chemin,
} from "../../src/engine/episodes/trimestre-qui-derape";
import { ETAPES, REFERENCES } from "../../src/config/episodes/trimestre-qui-derape";
import {
  analyser,
  axeDeTravail,
  comportements,
  type PartieJouee,
} from "../../src/pedagogy/episodes/bilan-du-trimestre";

/**
 * L'épisode « Le trimestre qui dérape » enseigne quelque chose de précis :
 * la remise réflexe coûte plus qu'elle ne rapporte, chercher la cause paie, et
 * une offre de grand compte oppose espérance et robustesse. Ces tests
 * verrouillent ces classements : un réglage du modèle qui les renverserait
 * enseignerait le contraire de ce que l'épisode dit.
 */

const MEILLEUR: Chemin = [1, 0, 1, 1, 1];
const JOURS = 1.5;
const classement = (d: number) =>
  rejouer(MEILLEUR, d, ETAPES[d]!.options.length, JOURS)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);

describe("le modèle de l'agence", () => {
  it("est déterministe : même graine, même trimestre", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
  });

  it("le hasard ne dépend pas des décisions : les semaines avant toute décision sont identiques", () => {
    const a = simuler([0, 0, 0, 0, 0], 12, 0).semaines[1]!;
    const b = simuler([3, 3, 3, 2, 2], 12, 0).semaines[1]!;
    expect(a.ca).toBeCloseTo(b.ca, 6);
  });

  it("plus de deux jours d'enquête en semaine 1 coûtent du chiffre", () => {
    expect(simuler(MEILLEUR, 3, 3).semaines[1]!.ca).toBeLessThan(
      simuler(MEILLEUR, 3, 2).semaines[1]!.ca,
    );
    expect(simuler(MEILLEUR, 3, 2).semaines[1]!.ca).toBeCloseTo(
      simuler(MEILLEUR, 3, 0).semaines[1]!.ca,
      6,
    );
  });

  it("l'objectif de chiffre d'affaires est atteignable, sans être acquis", () => {
    const ca = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g, JOURS).ca);
    expect(moyenne(ca)).toBeGreaterThan(OBJECTIF_CA * 0.97);
    expect(Math.min(...ca)).toBeLessThan(OBJECTIF_CA);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : réaffecter le portefeuille de Karim est le meilleur choix, la remise ne paie pas", () => {
    const c = classement(0);
    expect(c[0]).toBe(1);
    expect(c.indexOf(0)).toBeGreaterThan(c.indexOf(1));
  });

  it("D2 : s'aligner par une remise est pire que régler le délai", () => {
    const c = classement(1);
    expect(c.indexOf(2)).toBeGreaterThan(c.indexOf(0));
    expect(c.indexOf(2)).toBeGreaterThan(c.indexOf(1));
  });

  it("D3 : l'escompte est le meilleur choix, ne rien faire le pire", () => {
    const c = classement(2);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(3);
  });

  it("D4 : contre-proposer gagne en moyenne, accepter protège mieux, refuser est dernier", () => {
    const r = rejouer(MEILLEUR, 3, 3, JOURS);
    expect(r[1]!.attendu).toBeGreaterThan(r[0]!.attendu);
    expect(r[0]!.p10).toBeGreaterThan(r[1]!.p10);
    expect(classement(3).at(-1)).toBe(2);
  });

  it("D5 : relancer les devis bat la remise de fin de trimestre", () => {
    expect(classement(4)[0]).toBe(1);
  });

  it("diagnostiquer d'abord bat le réflexe remise et l'attentisme, en moyenne", () => {
    const attendu = (chemin: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(chemin as Chemin, g, JOURS).objectif));
    const [diagnostic, attentiste, remise] = REFERENCES.map((r) => attendu(r.chemin));
    expect(diagnostic).toBeGreaterThan(attentiste!);
    expect(diagnostic).toBeGreaterThan(remise!);
  });
});

describe("le tableau de bord", () => {
  it("compte les décisions à venir comme « ne rien changer »", () => {
    expect(cheminComplet([1])).toEqual([1, ...NEUTRE.slice(1)]);
  });

  it("avant la première semaine, montre la situation de départ", () => {
    const t = tableauDeBord([], 1, 0, 0);
    expect(t.ca).toBe(0);
    expect(t.marge).toBeNull();
  });

  it("une décision ne change pas les semaines qui la précèdent", () => {
    const avant = tableauDeBord([1], 5, 1, 4);
    const apres = tableauDeBord([1, 2], 5, 1, 4);
    expect(apres.ca).toBeCloseTo(avant.ca, 6);
  });
});

describe("le bilan", () => {
  const partie = (chemin: Chemin, extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["detail", "appel"], ["j1", "stock"], ["balance"], ["poids"], []],
    jours: JOURS,
    diagnostic: "karim",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 34,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("juge faible la remise de la semaine 1, même quand elle a payé", () => {
    const a = analyser(partie([0, 2, 1, 0, 0]));
    expect(a.decisions[0]!.bonne).toBe(false);
    expect(a.decisions[0]!.cas.startsWith("faible")).toBe(true);
  });

  it("compare le joueur aux trois manières de décider, sous son propre hasard", () => {
    const a = analyser(partie(MEILLEUR));
    expect(a.references.map((r) => r.nom)).toEqual(REFERENCES.map((r) => r.nom));
    expect(a.references[0]!.valeur).toBeCloseTo(a.trimestre.objectif, 6);
  });

  it("propose de questionner la remise à qui l'a choisie trois fois", () => {
    const p = partie([0, 2, 1, 0, 0]);
    const c = comportements(p, analyser(p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(axeDeTravail(c).titre).toBe("Questionner le réflexe remise");
  });

  it("propose de vérifier la cause à qui a décidé sans enquêter", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], []], jours: 0 });
    expect(axeDeTravail(comportements(p, analyser(p).trimestre)).titre).toBe(
      "Vérifier la cause avant d'agir",
    );
  });
});
