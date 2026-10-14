import { describe, expect, it } from "vitest";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";
import { leviersDuNiveau } from "../../src/config/decisions";
import {
  ETAPES_D_INVESTISSEMENT,
  avecInvestissementParNiveau,
  etapesDuNiveau,
} from "../../src/config/investissement-par-niveau";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { drawEvents } from "../../src/engine/events";
import { createRng, deriveRoundSeed } from "../../src/engine/random";
import type { EngineScenarioConfig } from "../../src/engine/types";

/**
 * LA PROGRESSION (octobre 2026) : l'opérationnel d'abord, puis l'investissement
 * et le financement, puis la stratégie. L'investissement et le financement
 * s'ouvrent ensemble au niveau 4, et les histoires qui posent la question
 * d'investir tombent là où on peut y répondre, jamais avant.
 */

const NOVA = SCENARIOS.find((d) => d.code === "nova")!.scenario;
const niveau = (n: number) => DIFFICULTY_PRESETS.find((p) => p.level === n)!;
const inv = (s: EngineScenarioConfig) =>
  s.scriptedEvents.filter((e) => e.eventCode.includes("_inv_")).map((e) => `${e.round}:${e.eventCode.split("_inv_")[1]}`);

describe("financer et investir, ensemble, au niveau Arbitrage", () => {
  it("emprunter, apporter et investir s'ouvrent au niveau 4, et restent ouverts ensuite", () => {
    for (const p of DIFFICULTY_PRESETS) {
      const attendu = p.level >= 4;
      expect(p.decisions.finance, `niveau ${p.level}`).toBe(attendu);
      expect(p.decisions.investment, `niveau ${p.level}`).toBe(attendu);
      expect(p.decisions.insurance, `niveau ${p.level}`).toBe(attendu);
    }
  });

  it("aucun niveau n'ouvre l'investissement sans les embauches : une machine se fait tourner", () => {
    for (const p of DIFFICULTY_PRESETS) {
      if (p.decisions.investment) expect(p.decisions.hr, `niveau ${p.level}`).toBe(true);
    }
  });

  it("l'escompte et l'affacturage s'ouvrent au niveau 3, avec l'équipe : le BFR avant l'emprunt", () => {
    expect(niveau(1).decisions.creances).toBe(false);
    expect(niveau(2).decisions.creances).toBe(false);
    for (const n of [3, 4, 5, 6]) expect(niveau(n).decisions.creances).toBe(true);
    expect(niveau(3).decisions.hr).toBe(true);
    const champs = (n: number) => leviersDuNiveau(n).map((l) => l.champ);
    expect(champs(2)).not.toContain("discount");
    expect(champs(2)).not.toContain("newLoan");
    expect(champs(3)).toContain("discount");
    expect(champs(3)).toContain("hire");
    expect(champs(3)).not.toContain("newLoan");
    expect(champs(3)).not.toContain("machineCapacityUnits");
    expect(champs(4)).toContain("newLoan");
    expect(champs(4)).toContain("machineCapacityUnits");
  });

  it("la stratégie vient ensuite : R&D, RSE et placement au niveau 5, le dividende au 6", () => {
    for (const n of [1, 2, 3, 4]) {
      expect(niveau(n).decisions.rse).toBe(false);
      expect(niveau(n).decisions.rd).toBe(false);
      expect(niveau(n).decisions.placement).toBe(false);
    }
    for (const n of [5, 6]) {
      expect(niveau(n).decisions.rse).toBe(true);
      expect(niveau(n).decisions.rd).toBe(true);
      expect(niveau(n).decisions.placement).toBe(true);
    }
    expect(niveau(5).decisions.dividend).toBe(false);
    expect(niveau(6).decisions.dividend).toBe(true);
  });
});

describe("le calendrier d'investissement, niveau par niveau", () => {
  it("chaque étape s'ajoute au niveau suivant, jamais l'inverse", () => {
    const parNiveau = [1, 2, 3, 4, 5, 6].map((n) => etapesDuNiveau(n).map((e) => e.suffixe));
    for (let i = 1; i < parNiveau.length; i += 1) {
      for (const s of parNiveau[i - 1]!) expect(parNiveau[i], `niveau ${i + 1}`).toContain(s);
    }
    expect(parNiveau[3]).toEqual(["signal", "taux", "grand_compte"]);
    expect(parNiveau[4]).toContain("concurrent");
    expect(parNiveau[4]).not.toContain("retournement");
    expect(parNiveau[5]).toContain("retournement");
  });

  it("aux niveaux 1 à 3, aucune histoire n'appelle un emprunt ou une machine", () => {
    for (const n of [1, 2, 3]) {
      expect(etapesDuNiveau(n), `niveau ${n}`).toEqual([]);
      expect(inv(avecInvestissementParNiveau(NOVA, n)), `niveau ${n}`).toEqual([]);
    }
  });

  it("chaque histoire tombe à un niveau qui ouvre l'investissement et le financement", () => {
    for (const e of ETAPES_D_INVESTISSEMENT) {
      const p = niveau(e.niveauMin);
      expect(p.decisions.investment && p.decisions.finance, `${e.suffixe} au niveau ${e.niveauMin}`).toBe(true);
    }
  });

  it("niveau 4 : un signe et la fenêtre de financement au tour 2, la demande qui monte au tour 3", () => {
    expect(inv(avecInvestissementParNiveau(NOVA, 4))).toEqual(["2:signal", "2:taux", "3:grand_compte"]);
  });

  it("niveaux 5 et 6 : le concurrent, puis le retournement", () => {
    expect(inv(avecInvestissementParNiveau(NOVA, 5))).toContain("4:concurrent");
    expect(inv(avecInvestissementParNiveau(NOVA, 5))).not.toContain("5:retournement");
    expect(inv(avecInvestissementParNiveau(NOVA, 6))).toContain("5:retournement");
  });

  it("une partie d'avant la répartition se recompose avec le calendrier de son époque", () => {
    expect(inv(avecInvestissementParNiveau(NOVA, 1, "avant-2026-10-11"))).toEqual(["2:signal", "3:grand_compte"]);
    expect(inv(avecInvestissementParNiveau(NOVA, 3, "avant-2026-10-11"))).toEqual([
      "2:signal",
      "2:taux",
      "3:grand_compte",
    ]);
    expect(etapesDuNiveau(5, "avant-2026-10-11").map((e) => e.suffixe)).toContain("retournement");
  });

  it("les événements scénarisés du secteur restent en place", () => {
    const joue = avecInvestissementParNiveau(NOVA, 6);
    for (const s of NOVA.scriptedEvents) expect(joue.scriptedEvents).toContainEqual(s);
  });

  it("poser deux fois le même niveau ne double rien", () => {
    const une = avecInvestissementParNiveau(NOVA, 6);
    expect(avecInvestissementParNiveau(une, 6).scriptedEvents).toEqual(une.scriptedEvents);
  });

  it("on n'invite pas à investir au dernier tour : il faut un tour après l'étape", () => {
    const court = (rounds: number) => inv(avecInvestissementParNiveau({ ...NOVA, roundsCount: rounds }, 6));
    expect(court(6)).toHaveLength(5);
    // Quatre tours : la demande monte au tour 3, il reste le 4 : ça tient. Le concurrent (tour 4) non.
    expect(court(4)).toEqual(["2:signal", "2:taux", "3:grand_compte"]);
    expect(court(2)).toEqual([]);
  });

  it("un scénario sans ces événements (celui d'un enseignant) reste tel quel", () => {
    const sans = { ...NOVA, events: NOVA.events.filter((e) => !e.code.includes("_inv_")) };
    expect(avecInvestissementParNiveau(sans, 6)).toBe(sans);
  });
});

describe("chaque secteur porte les cinq événements", () => {
  for (const d of SCENARIOS) {
    it(`${d.code} : cinq cartes, de probabilité nulle`, () => {
      const cartes = d.scenario.events.filter((e) => e.code.includes("_inv_"));
      expect(cartes.map((e) => e.code.split("_inv_")[1]).sort()).toEqual(
        ETAPES_D_INVESTISSEMENT.map((e) => e.suffixe).sort(),
      );
      for (const c of cartes) {
        expect(c.probability, c.code).toBe(0);
        expect(c.scope, c.code).toBe("market");
      }
      // Même préfixe pour les cinq : un seul secteur par jeu de cartes.
      expect(new Set(cartes.map((c) => c.code.split("_inv_")[0])).size).toBe(1);
    });
  }
});

describe("ces cartes ne déplacent pas le hasard des parties", () => {
  const companies = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("sans le calendrier, les tirages sont ceux d'avant les cartes", () => {
    const avant: EngineScenarioConfig = { ...NOVA, events: NOVA.events.filter((e) => !e.code.includes("_inv_")) };
    for (const seed of [1, 42, 20260101]) {
      for (let round = 1; round <= 6; round += 1) {
        const tirer = (s: EngineScenarioConfig) =>
          drawEvents(s, round, companies, [], createRng(deriveRoundSeed(seed, round))).drawn.map((e) => e.code);
        expect(tirer(NOVA), `graine ${seed}, tour ${round}`).toEqual(tirer(avant));
      }
    }
  });

  it("avec le calendrier, les cartes tombent exactement au tour dit, et seulement elles s'ajoutent", () => {
    const joue = avecInvestissementParNiveau(NOVA, 6);
    const tombees: string[] = [];
    for (let round = 1; round <= 6; round += 1) {
      const sans = drawEvents(NOVA, round, companies, [], createRng(deriveRoundSeed(7, round))).drawn.map((e) => e.code);
      const avec = drawEvents(joue, round, companies, [], createRng(deriveRoundSeed(7, round))).drawn.map((e) => e.code);
      const ajoutees = avec.filter((c) => !sans.includes(c));
      for (const c of ajoutees) tombees.push(`${round}:${c.split("_inv_")[1]}`);
      // Le reste du tirage (cartes aléatoires du secteur) est identique.
      expect(avec.filter((c) => !c.includes("_inv_"))).toEqual(sans.filter((c) => !c.includes("_inv_")));
    }
    expect(tombees.sort()).toEqual(inv(joue).sort());
  });
});

describe("le récapitulatif d'un téléphone garde une ligne pour financer et investir", () => {
  const ligne = (cle: string, nom: string, valeur: string) => ({ cle, nom, valeur });

  it("fusionne les deux lignes, et dit ce qui est décidé", async () => {
    const { fusionnerFinancerEtInvestir } = await import("../../src/components/cartes-de-decision");
    const lignes = [
      ligne("prix", "Prix", "40 €"),
      ligne("financement", "Financement", "emprunt 20 000 €"),
      ligne("investissement", "Investissement", "achat de machines"),
    ];
    expect(fusionnerFinancerEtInvestir(lignes)).toEqual([
      ligne("prix", "Prix", "40 €"),
      ligne("financement", "Financer et investir", "emprunt 20 000 €, achat de machines"),
    ]);
  });

  it("dit « Aucun » quand rien n'est décidé, et ne touche à rien sans les deux cartes", async () => {
    const { fusionnerFinancerEtInvestir } = await import("../../src/components/cartes-de-decision");
    const rien = [ligne("financement", "Financement", "Aucun"), ligne("investissement", "Investissement", "Aucun")];
    expect(fusionnerFinancerEtInvestir(rien)).toEqual([ligne("financement", "Financer et investir", "Aucun")]);
    const seule = [ligne("financement", "Financement", "Aucun")];
    expect(fusionnerFinancerEtInvestir(seule)).toBe(seule);
  });
});
