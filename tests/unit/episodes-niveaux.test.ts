import { describe, expect, it } from "vitest";
import {
  NIVEAUX,
  budgetDEnquete,
  niveauParCode,
  sourcesProposees,
  verificationPossible,
} from "../../src/config/episodes/niveaux";
import { effetDuChoix } from "../../src/pedagogy/episodes/retour-immediat";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * Les niveaux changent ce que le manager sait et voit, jamais le trimestre ni
 * le jugement du bilan. Ces tests le vérifient sur tous les épisodes.
 */
const [decouverte, standard, expert] = ["decouverte", "standard", "expert"].map(niveauParCode);

describe("les niveaux de difficulté", () => {
  it("sont trois, Standard par défaut, et un code inconnu retombe sur Standard", () => {
    expect(NIVEAUX.map((n) => n.code)).toEqual(["decouverte", "standard", "expert"]);
    expect(niveauParCode(null).code).toBe("standard");
    expect(niveauParCode("impossible").code).toBe("standard");
  });

  it("Standard joue l'épisode tel qu'il est conçu", () => {
    for (const ep of EPISODES) {
      const e = ep.etapes[0]!;
      expect(budgetDEnquete(standard!, ep, e)).toBe(e.budget);
      expect(sourcesProposees(standard!, e)).toBe(e.sources);
      expect(verificationPossible(standard!, 3, 5)).toBe(true);
    }
  });

  it("en Expert, l'enquête est plus courte mais permet toujours les deux sources décisives", () => {
    for (const ep of EPISODES) {
      const e = ep.etapes[0]!;
      const budget = budgetDEnquete(expert!, ep, e)!;
      expect(budget, ep.code).toBeLessThan(e.budget!);
      const decisives = e.sources.filter((s) => s.nature === "decisive");
      expect(
        decisives.reduce((t, s) => t + s.cout, 0),
        ep.code,
      ).toBeLessThanOrEqual(budget);
    }
  });

  it("en Expert, pas de conseil, et une seule vérification par décision après la première", () => {
    for (const ep of EPISODES) {
      for (const e of ep.etapes) {
        expect(sourcesProposees(expert!, e).some((s) => s.nature === "aide")).toBe(false);
      }
    }
    expect(verificationPossible(expert!, 0, 4)).toBe(true);
    expect(verificationPossible(expert!, 2, 0)).toBe(true);
    expect(verificationPossible(expert!, 2, 1)).toBe(false);
  });

  it("seul Découverte donne des repères et un retour immédiat ; seul Expert mêle les imprévus", () => {
    expect(NIVEAUX.filter((n) => n.reperes).map((n) => n.code)).toEqual(["decouverte"]);
    expect(NIVEAUX.filter((n) => n.retourImmediat).map((n) => n.code)).toEqual(["decouverte"]);
    expect(NIVEAUX.filter((n) => !n.imprevusSignales).map((n) => n.code)).toEqual(["expert"]);
    expect(decouverte!.conseil).toBe(true);
  });

  it("le bilan juge les décisions de la même façon à tous les niveaux", () => {
    const ep = EPISODES[0]!;
    const partie = (niveau: PartieJouee["niveau"]): PartieJouee => ({
      graine: 11,
      chemin: ep.references[1]!.chemin,
      consultes: ep.etapes.map(() => []),
      jours: 1,
      diagnostic: ep.diagnostics[0]!.id,
      reevaluation: { choix: "maintient", principal: null },
      prevision: Number(ep.prevision.placeholder.replace(",", ".").replace(/\s/g, "")),
      confiance: 60,
      niveau,
    });
    const juger = (n: PartieJouee["niveau"]) =>
      analyser(ep, partie(n)).decisions.map((d) => [d.bonne, d.rang]);
    expect(juger("expert")).toEqual(juger("standard"));
    expect(juger("decouverte")).toEqual(juger("standard"));
  });
});

describe("le retour immédiat", () => {
  it("compare le choix à l'option qui ne change rien, sur le même hasard", () => {
    for (const ep of EPISODES) {
      const decisions = ep.references[0]!.chemin.slice(0, 1);
      const effet = effetDuChoix(ep, decisions, 0, 7, 1.5);
      if (decisions[0] === ep.neutre[0]) {
        expect(effet).toBeNull();
        continue;
      }
      const avec = ep.simuler([decisions[0]!, ...ep.neutre.slice(1)], 7, 1.5).objectif;
      const sans = ep.simuler(ep.neutre, 7, 1.5).objectif;
      expect(effet!.reference).toBe(ep.neutre[0]);
      expect(effet!.ecart).toBeCloseTo(avec - sans, 6);
    }
  });

  it("ne dit rien quand on a choisi de ne rien changer", () => {
    const ep = EPISODES[0]!;
    expect(effetDuChoix(ep, [ep.neutre[0]!], 0, 7, 1)).toBeNull();
  });
});
