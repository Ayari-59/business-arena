import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { simulateRound } from "@/engine/simulation";
import { neutralDecisions } from "@/engine/bots";
import { SCENARIOS } from "@/config/scenarios/registry";
import { composerLeScenarioJoue, CORRECTIFS_DES_PARTIES_NOUVELLES } from "@/config/scenarios/scenario-joue";
import type { CompanyState, EngineScenarioConfig } from "@/engine/types";

/**
 * UNE MACHINE ACHETÉE COMPTE UNE FOIS (`parcSansDoublon`, engine/types.ts).
 *
 * La file d'attente du parc (`pendingMachineFleet`) n'était pas vidée quand rien n'était
 * acheté au tour suivant : la même machine s'ajoutait au parc à CHAQUE tour, alors que le
 * bilan n'en comptait qu'une. Chez NOVA, une machine achetée au tour 1 portait l'atelier
 * de 7 000 à 11 000 unités au tour 5. Aucun test ne le voyait.
 *
 * Décision du propriétaire : le correctif vaut pour les parties créées après lui ; une
 * partie commencée avant finit sous sa règle et se rejoue à l'identique.
 */

/** La capacité de fin de tour, tour par tour, d'une entreprise qui achète une machine au tour 1. */
function capacites(scenario: EngineScenarioConfig, def: (typeof SCENARIOS)[number], tours = 5): number[] {
  let etats: CompanyState[] = [def.company("a", "A", "human")];
  const type = scenario.equipment!.types[0]!.code;
  const vues: number[] = [];
  for (let t = 1; t <= tours; t++) {
    const d = neutralDecisions({ scenario, state: etats[0]!, roundIndex: t });
    if (t === 1) d.investment = { ...(d.investment ?? {}), equipmentBuy: [{ typeCode: type, quantity: 1 }] };
    etats = simulateRound({ scenario, roundIndex: t, companies: etats, decisions: { a: d }, activeEvents: [], seed: 7 }).companies;
    vues.push(etats[0]!.machineCapacity);
  }
  return vues;
}

describe("une machine achetée compte une fois", () => {
  for (const def of SCENARIOS) {
    it(`${def.code} : la capacité gagnée au tour 2 ne grossit plus ensuite`, () => {
      const corrige = capacites({ ...def.scenario, parcSansDoublon: true }, def);
      // L'achat sert : le tour 2 dépasse le tour 1.
      expect(corrige[1]!).toBeGreaterThan(corrige[0]!);
      // Puis rien ne s'ajoute, faute d'un autre achat.
      for (let t = 2; t < corrige.length; t++) expect(corrige[t], `tour ${t + 1}`).toBe(corrige[1]);
    });
  }

  it("sans le réglage, le chemin d'avant : une partie commencée avant le correctif se rejoue à l'identique", () => {
    const nova = SCENARIOS.find((d) => d.code === "nova")!;
    const avant = capacites(nova.scenario, nova);
    // La file d'attente recomptée à chaque tour : le défaut, gardé pour les parties d'avant.
    expect(avant[4]!).toBeGreaterThan(avant[1]!);
  });
});

describe("le réglage se pose à la création d'une partie, et nulle part ailleurs", () => {
  const nova = SCENARIOS.find((d) => d.code === "nova")!;
  const reglages = { scenario: nova.scenario, seed: 11, variableWorld: true, level: 2, concurrents: 3, periodicity: "quarter" as const };

  it("le scénario joué le porte quand on le demande, et seulement alors", () => {
    expect(composerLeScenarioJoue({ ...reglages, parcSansDoublon: true }).parcSansDoublon).toBe(true);
    expect("parcSansDoublon" in composerLeScenarioJoue(reglages)).toBe(false);
  });

  it("la création d'une partie le demande, et le rejeu relit celui de la partie", () => {
    const creation = readFileSync("src/services/game-creation.service.ts", "utf8");
    // La création pose les correctifs des parties nouvelles, pour la partie et son tour
    // d'essai ; ce correctif en fait partie (le lot de l'examen lit la même liste).
    expect(creation.match(/\.\.\.CORRECTIFS_DES_PARTIES_NOUVELLES/g)?.length).toBe(2);
    expect(CORRECTIFS_DES_PARTIES_NOUVELLES.parcSansDoublon).toBe(true);
    const rejeu = readFileSync("src/services/merite.service.ts", "utf8");
    expect(rejeu).toMatch(/parcSansDoublon: snapshot\.parcSansDoublon === true/);
  });
});
