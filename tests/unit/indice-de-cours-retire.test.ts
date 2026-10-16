import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { NOVA_DEFINITION, ECOMMERCE_DEFINITION } from "@/config/scenarios/registry";
import { simulateRound } from "@/engine/simulation";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";

/**
 * L'INDICE DE COURS DES FOURNISSEURS EST RETIRÉ, ET UNE PARTIE QUI LE PORTE SE JOUE ENCORE.
 *
 * L'indice (une marche aléatoire tirée de la graine, avec une tendance de +1 % par
 * tour chez le fournisseur standard de NOVA) renchérissait les matières de NOVA et de
 * PIXEL & CO tour après tour : il a fait passer NOVA mono, pour l'équipe qui valide
 * la proposition, de 6 crises sur 12 sans défaillance à 8 crises et 4 défaillances,
 * et faussait le résultat estimé, que le navigateur calcule sans la graine.
 *
 * La fixture est une vraie partie solo NOVA (niveau 2, graine 8919, monde variable),
 * jouée trois tours sur le moteur d'AVANT le retrait (main 62358d33) : son snapshot
 * porte les `priceIndex` des fournisseurs standard et lowcost, et le résultat de son
 * tour 3 le multiplicateur appliqué. Elle ne se régénère pas.
 */
const PARTIE = JSON.parse(
  readFileSync(new URL("../fixtures/partie-avant-retrait-de-l-indice.json", import.meta.url), "utf8"),
) as {
  seed: number;
  prochainTour: number;
  scenario: Record<string, unknown> & { suppliers: Record<string, unknown>[] };
  companies: CompanyState[];
  events: EventInstance[];
  decisionsDuTour3: Record<string, RoundDecisions>;
  resultatDuTour3: CompanyRoundResult;
};

/** Le tour suivant de la fixture, sur le snapshot donné, avec les décisions de son tour 3. */
const tourSuivant = (scenario: EngineScenarioConfig) =>
  simulateRound({
    scenario,
    roundIndex: PARTIE.prochainTour,
    companies: structuredClone(PARTIE.companies),
    decisions: structuredClone(PARTIE.decisionsDuTour3),
    activeEvents: structuredClone(PARTIE.events),
    seed: PARTIE.seed,
  });

const sansIndice = (s: Record<string, unknown> & { suppliers: Record<string, unknown>[] }) => ({
  ...s,
  suppliers: s.suppliers.map(({ priceIndex: _p, ...f }) => {
    void _p;
    return f;
  }),
});

describe("une partie créée avec l'indice de cours", () => {
  it("la fixture porte bien l'indice : dans son snapshot et dans le résultat de son tour 3", () => {
    const avecIndice = PARTIE.scenario.suppliers.filter((f) => f.priceIndex !== undefined).map((f) => f.code);
    expect(avecIndice).toEqual(["standard", "lowcost"]);
    expect(
      (PARTIE.resultatDuTour3.supplier as Record<string, unknown> | undefined)?.priceIndexMultiplier,
    ).toBeGreaterThan(1);
  });

  it("son snapshot se charge sans erreur, et l'indice n'y est plus", () => {
    const relu = parseScenarioConfig(PARTIE.scenario);
    expect(relu.suppliers?.map((f) => f.code)).toEqual(["standard", "lowcost", "premium"]);
    for (const f of relu.suppliers ?? []) expect(Object.keys(f)).not.toContain("priceIndex");
  });

  it("le snapshot gardé tel quel se joue, et l'indice qu'il porte est ignoré", () => {
    // La base garde le snapshot en JSON et l'arène le relit sans le reparser : le
    // moteur reçoit donc l'indice, et doit l'ignorer.
    const brut = tourSuivant(PARTIE.scenario as unknown as EngineScenarioConfig);
    const nettoye = tourSuivant(sansIndice(PARTIE.scenario) as unknown as EngineScenarioConfig);
    const relu = tourSuivant(parseScenarioConfig(PARTIE.scenario));
    for (const c of PARTIE.companies) {
      expect(JSON.stringify(brut.results[c.id]), c.id).toBe(JSON.stringify(nettoye.results[c.id]));
      expect(JSON.stringify(relu.results[c.id]), c.id).toBe(JSON.stringify(nettoye.results[c.id]));
      expect(Object.keys(brut.results[c.id]!.supplier ?? {})).not.toContain("priceIndexMultiplier");
    }
    // Le coût matières est celui du fournisseur, sans cours : 22 € × son coefficient
    // (monde variable), plus les autres coûts variables.
    const equipe = brut.results["a-equipe"]!;
    const fournisseur = equipe.supplier!;
    expect(fournisseur.code).toBe("standard");
    expect(equipe.breakeven.unitVariableCost).toBeCloseTo(22 * fournisseur.costMultiplier + 16, 9);
    // L'état suivant ne porte rien de l'indice.
    expect(JSON.stringify(brut.companies)).not.toContain("priceIndex");
  });

  it("les scénarios du registre ne portent plus d'indice", () => {
    for (const def of [NOVA_DEFINITION, ECOMMERCE_DEFINITION]) {
      expect(JSON.stringify(def.scenario), def.code).not.toContain("priceIndex");
    }
  });
});
