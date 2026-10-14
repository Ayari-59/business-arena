import { describe, expect, it } from "vitest";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { SCENARIOS } from "@/config/scenarios/registry";
import { articleDeLaGazette, lireLEvenement } from "@/config/gazette/generateur";
import { lignesDeLaPresse } from "@/config/gazette/bilan";
import { NOM_DU_JOURNAL, type ArticleDeLaGazette } from "@/config/gazette/types";
import type { EventInstance } from "@/engine/types";

/**
 * LA GAZETTE NE PARLE QUE DES DÉCISIONS DU NIVEAU.
 *
 * La répartition des leviers ferme l'emprunt aux niveaux 1 à 3 et les embauches
 * aux niveaux 1 et 2. Le journal parle encore des taux à ces niveaux (le
 * découvert les suit), mais :
 *   · aucun titre, aucun chapô n'invite à emprunter là où l'emprunt est fermé ;
 *   · aucun article ne suggère d'embaucher là où les embauches sont fermées ;
 *   · la ligne du bilan sur les taux ne dit pas « Vous n'aviez pas emprunté »
 *     quand l'emprunt n'était pas une décision : elle dit le découvert.
 * Les niveaux concernés se lisent dans les préréglages, pas dans ce test.
 */

const INVITE_A_EMPRUNTER = /emprunt|\bfinancer\b|empruntez/i;
const INVITE_A_EMBAUCHER = /embauch|recrut|renforcer (?:vos|l'|les) équipe|effectifs? (?:à|en) renfort/i;

/** Tous les événements de marché de tous les secteurs, et quelques tours, graines, positions. */
function articlesDuNiveau(level: number, financementOuvert: boolean, filtre: (sujet: string) => boolean) {
  const articles: { scenario: string; code: string; a: ArticleDeLaGazette }[] = [];
  for (const def of SCENARIOS) {
    for (const ev of def.scenario.events) {
      if (ev.scope !== "market") continue;
      const inst: EventInstance = {
        code: ev.code,
        scope: "market",
        roundsLeft: ev.duration,
        modifiers: ev.modifiers,
      } as EventInstance;
      const lu = lireLEvenement(inst, true);
      if (!lu || !filtre(lu.sujet)) continue;
      for (const tour of [1, 2, 3, 4, 5, 6, 7, 8])
        for (const graine of [1, 7, 42, 1234, 99991]) {
          for (const [nouveaux, enCours] of [
            [[inst], []],
            [[], [inst]],
          ] as const) {
            articles.push({
              scenario: def.code,
              code: ev.code,
              a: articleDeLaGazette({
                secteur: def.sector,
                scenario: def.scenario,
                tour,
                niveau: level,
                financementOuvert,
                graine,
                nouveaux,
                enCours,
              }),
            });
          }
        }
    }
  }
  return articles;
}

describe("la Gazette, à la mesure du niveau", () => {
  const fermes = DIFFICULTY_PRESETS.filter((p) => !p.decisions.finance);
  const ouverts = DIFFICULTY_PRESETS.filter((p) => p.decisions.finance);

  it("la répartition ferme bien l'emprunt et les embauches aux premiers niveaux", () => {
    expect(fermes.map((p) => p.level)).toEqual([1, 2, 3]);
    expect(DIFFICULTY_PRESETS.filter((p) => !p.decisions.hr).map((p) => p.level)).toEqual([1, 2]);
  });

  it("emprunt fermé : les taux restent un sujet, mais aucun article n'invite à emprunter", () => {
    for (const p of fermes) {
      const articles = articlesDuNiveau(p.level, p.decisions.finance, (s) => s === "taux");
      expect(articles.length).toBeGreaterThan(50);
      const fautifs = articles
        .filter(({ a }) => INVITE_A_EMPRUNTER.test(`${a.titre} ${a.chapo}`))
        .map(({ scenario, code, a }) => `N${p.level} ${scenario}/${code} : ${a.titre}`);
      expect([...new Set(fautifs)]).toEqual([]);
    }
  });

  it("emprunt ouvert : les mêmes titres restent au journal (le filtre ne vise que les niveaux fermés)", () => {
    const p = ouverts[0]!;
    const titres = new Set(articlesDuNiveau(p.level, p.decisions.finance, (s) => s === "taux").map(({ a }) => a.titre));
    expect([...titres].some((t) => INVITE_A_EMPRUNTER.test(t))).toBe(true);
  });

  it("embauches fermées : aucun article, sur aucun sujet, ne suggère d'embaucher", () => {
    for (const p of DIFFICULTY_PRESETS.filter((x) => !x.decisions.hr)) {
      const articles = articlesDuNiveau(p.level, p.decisions.finance, () => true);
      const fautifs = articles
        .filter(({ a }) => INVITE_A_EMBAUCHER.test(`${a.titre} ${a.chapo}`))
        .map(({ scenario, code, a }) => `N${p.level} ${scenario}/${code} : ${a.titre} / ${a.chapo}`);
      expect([...new Set(fautifs)]).toEqual([]);
    }
  });

  describe("la ligne du bilan sur les taux", () => {
    const taux: ArticleDeLaGazette = {
      tour: 3,
      rubrique: "Côté financement",
      titre: "Les banques s'apprêtent à resserrer le crédit",
      chapo: "Les analystes s'attendent à une forte hausse des taux d'intérêt.",
      fiabilite: "fait",
      sujets: [{ sujet: "taux", sens: "hausse", fiabilite: "fait", dementi: false, code: "rate_hike", nouveau: true }],
      auteur: "gazette",
    };
    const ligne = (financementOuvert: boolean | undefined, decouvert: number | null) =>
      lignesDeLaPresse({
        articles: [taux],
        decisions: [{ tour: 3, price: 60, productionPlan: 4000, newLoan: 0, decouvert }],
        libelle: (t) => `Tour ${t}`,
        unites: "enceintes",
        nomDuJournal: NOM_DU_JOURNAL,
        ...(financementOuvert === undefined ? {} : { financementOuvert }),
      })[0]!.replace(/[  ]/g, " ");

    it("emprunt fermé : elle ne parle pas d'emprunt, elle dit le découvert", () => {
      for (const p of fermes) {
        const avec = ligne(p.decisions.finance, 12_500);
        const sans = ligne(p.decisions.finance, 0);
        for (const l of [avec, sans]) expect(l).not.toMatch(/emprunt/i);
        expect(avec).toContain("Votre découvert, seul financement à ce niveau, était de 12 500 € en fin de tour.");
        expect(sans).toContain("Votre trésorerie avait tenu sans découvert ce tour-là.");
      }
    });

    it("emprunt ouvert, ou partie d'avant la répartition : elle relie l'article à l'emprunt", () => {
      expect(ligne(true, 12_500)).toContain("Vous n'aviez pas emprunté ce tour-là.");
      expect(ligne(undefined, null)).toContain("Vous n'aviez pas emprunté ce tour-là.");
    });
  });
});
