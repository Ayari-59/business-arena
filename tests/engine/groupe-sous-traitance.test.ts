import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import { coutAuBareme, commandeDuTour } from "@/engine/groupe";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";
import { novaGammeCompany, novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { NIVEAU_7_RETIRE } from "@/config/difficulty";

/**
 * FABRIQUER OU FAIRE FABRIQUER (niveau 7) : des produits finis en stock, au
 * barème, sans coût fixe ; rien commandé, rien changé.
 */
const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "passive"];
const composer7 = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 7, concurrents: 4, periodicity: "quarter", investmentStories: true });
const six = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 6, concurrents: 4, periodicity: "quarter", investmentStories: true });
/** Le monde du 6 et le bloc de groupe du 7 : le mécanisme, indépendamment du marché calibré du 7. */
const sept: EngineScenarioConfig = { ...six, groupe: { ...composer7.groupe!, depart: undefined } };

function jouer(scenario: EngineScenarioConfig, retouche?: (tour: number, id: string, d: RoundDecisions) => void) {
  let etats: CompanyState[] = PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, "bot", p));
  let ev: EventInstance[] = [];
  let prec: Record<string, CompanyRoundResult> = {};
  const tours: { results: Record<string, CompanyRoundResult>; companies: CompanyState[]; decisions: Record<string, RoundDecisions> }[] = [];
  for (let tour = 1; tour <= scenario.roundsCount; tour++) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const [i, e] of etats.entries()) {
      const p = prec[e.id];
      const d = botDecisions(PROFILS[i]!, {
        scenario,
        state: e,
        roundIndex: tour,
        lastSoldUnits: p ? soldUnits(p) : undefined,
        lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
        leviers: NIVEAU_7_RETIRE.decisions,
      });
      retouche?.(tour, e.id, d);
      decisions[e.id] = d;
    }
    const out = simulateRound({ scenario, roundIndex: tour, companies: etats, decisions, activeEvents: ev, seed: 2026 });
    for (const r of Object.values(out.results)) expect(Math.abs(balanceGap(r.balanceSheet))).toBeLessThan(0.01);
    tours.push({ results: out.results, companies: out.companies, decisions });
    prec = out.results;
    etats = out.companies;
    ev = out.events;
  }
  return tours;
}

describe("le barème du sous-traitant", () => {
  const tranches = [{ jusqua: 1000, prix: 10 }, { jusqua: 2000, prix: 20 }, { prix: 40 }];
  it("se paie tranche par tranche, la dernière sans limite", () => {
    expect(coutAuBareme(0, tranches)).toBe(0);
    expect(coutAuBareme(500, tranches)).toBe(5000);
    expect(coutAuBareme(1500, tranches)).toBe(10000 + 10000);
    expect(coutAuBareme(2500, tranches)).toBe(10000 + 20000 + 20000);
  });
  it("la commande est bornée au plafond, nulle pour une référence qu'il ne fait pas, absente sans rien", () => {
    const cfg = sept.groupe!.sousTraitance!;
    const codes = sept.products!.map((p) => p.code);
    const c = commandeDuTour(cfg, codes, { "nova-go": 1e9, "nova-studio": 500 })!;
    expect(c.unites[codes.indexOf("nova-go")]).toBe(cfg["nova-go"]!.plafond);
    expect(c.unites[codes.indexOf("nova-studio")]).toBe(0);
    expect(commandeDuTour(cfg, codes, { "nova-go": 0 })).toBeNull();
    expect(commandeDuTour(cfg, codes, undefined)).toBeNull();
  });
});

describe("la sous-traitance dans le tour", () => {
  const sans = jouer(sept);
  const zero = jouer(sept, (_t, id, d) => {
    if (id === "e0") d.sousTraitance = { "nova-go": 0, "nova-one": 0 };
  });
  const Q = 1200;
  const avec = jouer(sept, (t, id, d) => {
    if (id === "e0" && t === 3) d.sousTraitance = { "nova-one": Q };
  });

  it("rien commandé : rien de changé, aucun coût fixe", () => {
    for (let t = 0; t < sans.length; t++) expect(zero[t]!.results).toEqual(sans[t]!.results);
  });

  it("les unités entrent en stock au coût du barème, se vendent, et se paient à la livraison", () => {
    const r = avec[2]!.results.e0!;
    const r0 = sans[2]!.results.e0!;
    const cout = coutAuBareme(Q, sept.groupe!.sousTraitance!["nova-one"]!.tranches);
    expect(r.groupe!.sousTraitance!.unites).toBe(Q);
    expect(r.groupe!.sousTraitance!.cout).toBeCloseTo(cout, 6);
    expect(r.incomeStatement.sousTraitance).toBeCloseTo(cout, 6);
    expect(r.incomeStatement.variableProductionCost - r0.incomeStatement.variableProductionCost).toBeCloseTo(cout, 4);
    expect(r.cashFlow.items.find((i) => i.label === "achats_sous_traitance")!.amount).toBeCloseTo(-cout, 6);
    expect(r.incomeStatement.revenue).toBeGreaterThan(r0.incomeStatement.revenue);
    // Aucune heure ni machine : la production de l'atelier est celle d'avant.
    expect(r.production.produced).toBeCloseTo(r0.production.produced, 6);
  });

  it("le stock non vendu reste payé, au bilan", () => {
    const enTrop = jouer(sept, (t, id, d) => {
      if (id === "e0" && t === 1) d.sousTraitance = { "nova-one": 4000 };
    });
    expect(enTrop[0]!.results.e0!.balanceSheet.inventoryValue).toBeGreaterThan(sans[0]!.results.e0!.balanceSheet.inventoryValue);
  });

  it("la qualité du sous-traitant se mêle à celle de l'atelier, au prorata", () => {
    const pq = (x: typeof sans) => x[2]!.companies.find((c) => c.id === "e0")!.perceivedQualityByProduct!["nova-one"]!;
    expect(pq(avec)).not.toBeCloseTo(pq(sans), 6);
  });

  it("hors niveau 7, la décision ne fait rien", () => {
    const a = jouer(six);
    const b = jouer(six, (t, id, d) => {
      if (id === "e0" && t === 3) d.sousTraitance = { "nova-one": Q };
    });
    expect(b[2]!.results.e0).toEqual(a[2]!.results.e0);
  });
});
