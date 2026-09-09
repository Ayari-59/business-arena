import { describe, expect, it } from "vitest";
import { simulateRound } from "../../src/engine/simulation";
import { botDecisions } from "../../src/engine/bots";
import { isMultiProduct, toGamme, toGammeDecisions } from "../../src/engine/gamme";
import { novaCompany, novaScenario } from "../../src/config/scenarios/nova";
import { parseScenarioConfig } from "../../src/config/scenarios/schema";
import type {
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  SegmentConfig,
  SimulationInput,
} from "../../src/engine/types";

/**
 * LA GAMME (multi-produits). Trois garanties :
 *
 *  1. Un scénario mono-produit est une gamme d'UN produit dont le marché EST
 *     `scenario.market` — les tests dorés NOVA, inchangés, en sont la preuve
 *     au bit près ; ici on vérifie la normalisation elle-même.
 *  2. Un produit DORMANT (marché à demande nulle, plan et marketing à zéro)
 *     ajouté à NOVA ne change pas d'un centime les agrégats de l'entreprise :
 *     le moteur n'introduit aucun arrondi parasite en passant à la gamme.
 *  3. Deux produits VIVANTS partagent l'usine : chacun a ses ventes, son
 *     stock, son chiffre d'affaires ; quand la somme des plans dépasse la
 *     capacité, tous sont réduits du même facteur (le facteur rare), et le
 *     bilan reste équilibré.
 */

const SEED = 42;
const A = novaScenario.product.code;
const B = "b-pro";

const PLAYER: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
  finance: { newLoan: 0, loanRepayment: 0 },
};

/** Un second produit, bâti sur le premier segment de NOVA sous un autre code. */
function productB(seasonality?: number[]): NonNullable<EngineScenarioConfig["products"]>[number] {
  const base = novaScenario.market.segments[0]!;
  const segment: SegmentConfig = {
    ...base,
    code: "b-pro",
    name: "Clients du produit B",
    ...(seasonality ? { seasonality } : {}),
  };
  return {
    code: B,
    name: "Produit B",
    materialCostPerUnit: 30,
    otherVariableCostPerUnit: 20,
    hoursPerUnit: 0.5,
    market: { segments: [segment] },
  };
}

/** NOVA + un produit B : le produit A garde exactement le marché de NOVA. */
function gammeScenario(b = productB()): EngineScenarioConfig {
  return parseScenarioConfig({
    ...novaScenario,
    code: "nova-gamme",
    products: [
      {
        code: A,
        name: "Produit A",
        materialCostPerUnit: novaScenario.product.materialCostPerUnit,
        otherVariableCostPerUnit: novaScenario.product.otherVariableCostPerUnit,
        hoursPerUnit: novaScenario.product.hoursPerUnit,
        market: { segments: novaScenario.market.segments },
      },
      b,
    ],
  });
}

function companies(): CompanyState[] {
  return [
    novaCompany("player", "NOVA One", "human"),
    novaCompany("soundbox", "SoundBox", "bot", "price_aggressive"),
    novaCompany("auris", "Auris", "bot", "premium"),
  ];
}

function scalarDecisions(scenario: EngineScenarioConfig, states: CompanyState[]) {
  const [, soundbox, auris] = states as [CompanyState, CompanyState, CompanyState];
  return {
    player: PLAYER,
    soundbox: botDecisions("price_aggressive", { scenario, state: soundbox, roundIndex: 1 }),
    auris: botDecisions("premium", { scenario, state: auris, roundIndex: 1 }),
  };
}

function input(
  scenario: EngineScenarioConfig,
  decisions: Record<string, RoundDecisions>,
  states = companies(),
): SimulationInput {
  return { scenario, roundIndex: 1, companies: states, decisions, activeEvents: [], seed: SEED };
}

describe("gamme — normalisation", () => {
  it("un scénario mono-produit est une gamme d'un produit dont le marché est celui du scénario", () => {
    expect(isMultiProduct(novaScenario)).toBe(false);
    const gamme = toGamme(novaScenario);
    expect(gamme).toHaveLength(1);
    expect(gamme[0]!.code).toBe(novaScenario.product.code);
    expect(gamme[0]!.hoursPerUnit).toBe(novaScenario.product.hoursPerUnit);
    // Même RÉFÉRENCE : même ordre de segments, mêmes objets, aucun recalcul.
    expect(gamme[0]!.market).toBe(novaScenario.market);
  });

  it("les décisions mono sont recopiées telles quelles", () => {
    const gamme = toGamme(novaScenario);
    const [d] = toGammeDecisions(PLAYER, gamme);
    expect(d).toEqual({ price: 59, productionPlan: 4800, marketingBudget: 6000 });
  });

  it("en gamme, un produit sans entrée reçoit le prix scalaire et une part égale du plan", () => {
    const scenario = gammeScenario();
    expect(isMultiProduct(scenario)).toBe(true);
    const gamme = toGamme(scenario);
    expect(gamme.map((p) => p.code)).toEqual([A, B]);
    // Le marché de B hérite de la saisonnalité et de la concurrence du scénario.
    expect(gamme[1]!.market.seasonality).toEqual(novaScenario.market.seasonality);
    expect(gamme[1]!.market.outsideAttraction).toBe(novaScenario.market.outsideAttraction);
    const decisions = toGammeDecisions(PLAYER, gamme);
    expect(decisions[0]).toEqual({ price: 59, productionPlan: 2400, marketingBudget: 3000 });
    expect(decisions[1]).toEqual({ price: 59, productionPlan: 2400, marketingBudget: 3000 });
    // Une entrée explicite fait foi.
    const explicit = toGammeDecisions(
      { ...PLAYER, products: { [B]: { price: 80, productionPlan: 1000, marketingBudget: 500 } } },
      gamme,
    );
    expect(explicit[1]).toEqual({ price: 80, productionPlan: 1000, marketingBudget: 500 });
  });
});

describe("gamme — schéma", () => {
  it("refuse une gamme d'un seul produit", () => {
    expect(() =>
      parseScenarioConfig({ ...novaScenario, products: [productB()] }),
    ).toThrow();
  });

  it("refuse deux produits qui partagent un code de segment", () => {
    const clash = productB();
    clash.market.segments[0]!.code = novaScenario.market.segments[0]!.code;
    expect(() => gammeScenario(clash)).toThrow(/segment/);
  });

  it("refuse deux produits de même code", () => {
    const dup = { ...productB(), code: A };
    expect(() => gammeScenario(dup)).toThrow(/produit/);
  });
});

describe("gamme — un produit dormant ne change rien aux agrégats", () => {
  // Produit B : demande nulle tout au long de la partie, plan et marketing à 0.
  const dormant = gammeScenario(productB([0, 0, 0, 0, 0, 0]));
  const mono = simulateRound(input(novaScenario, scalarDecisions(novaScenario, companies())));
  const withProducts = (d: Record<string, RoundDecisions>) =>
    Object.fromEntries(
      Object.entries(d).map(([id, dec]) => [
        id,
        {
          ...dec,
          products: {
            [A]: { price: dec.price, productionPlan: dec.productionPlan, marketingBudget: dec.marketingBudget },
            [B]: { price: dec.price, productionPlan: 0, marketingBudget: 0 },
          },
        },
      ]),
    );
  // Les bots reçoivent les MÊMES décisions scalaires que dans la partie mono
  // (calculées sur NOVA) : ce que l'on mesure ici est le moteur, pas le bot,
  // qui en gamme jouerait par produit.
  const multi = simulateRound(input(dormant, withProducts(scalarDecisions(novaScenario, companies()))));

  it.each(["player", "soundbox", "auris"])("%s : mêmes CA, résultat, caisse, FRNG, BFR, TN", (id) => {
    const m = mono.results[id]!;
    const g = multi.results[id]!;
    expect(g.incomeStatement.revenue).toBe(m.incomeStatement.revenue);
    expect(g.incomeStatement.netIncome).toBe(m.incomeStatement.netIncome);
    expect(g.balanceSheet.cash).toBe(m.balanceSheet.cash);
    expect(g.functionalBalance.frng).toBe(m.functionalBalance.frng);
    expect(g.functionalBalance.bfr).toBe(m.functionalBalance.bfr);
    expect(g.functionalBalance.netTreasury).toBe(m.functionalBalance.netTreasury);
    expect(g.production.produced).toBe(m.production.produced);
    expect(g.market.totalShare).toBe(m.market.totalShare);
  });

  it("le produit dormant est bien présent, à zéro, et A porte tout", () => {
    const g = multi.results["player"]!;
    expect(g.products?.[B]).toMatchObject({ produced: 0, sold: 0, revenue: 0 });
    expect(g.products?.[A]?.sold).toBe(
      Object.values(mono.results["player"]!.market.bySegment).reduce((s, d) => s + d.sold, 0),
    );
    const next = multi.companies.find((c) => c.id === "player")!;
    expect(next.finishedGoodsByProduct?.[B]).toEqual({ quantity: 0, unitCost: 0 });
    expect(next.finishedGoods.quantity).toBe(
      mono.companies.find((c) => c.id === "player")!.finishedGoods.quantity,
    );
  });

  it("le résultat mono-produit ne porte aucun champ de gamme", () => {
    expect(mono.results["player"]!.products).toBeUndefined();
    expect(mono.companies[0]!.finishedGoodsByProduct).toBeUndefined();
  });
});

describe("gamme — deux produits vivants partagent l'usine", () => {
  const scenario = gammeScenario();
  const states = companies();
  const base = scalarDecisions(scenario, states);
  // Plans qui, ADDITIONNÉS, dépassent la capacité machine (7 000 u) : le
  // facteur rare joue, et il doit réduire les deux produits du même facteur.
  const decisions: Record<string, RoundDecisions> = {
    ...base,
    player: {
      ...PLAYER,
      products: {
        [A]: { price: 59, productionPlan: 6000, marketingBudget: 4000 },
        [B]: { price: 95, productionPlan: 6000, marketingBudget: 2000 },
      },
    },
  };
  const out = simulateRound(input(scenario, decisions, states));
  const player = out.results["player"]!;

  it("est déterministe", () => {
    const again = simulateRound(input(scenario, decisions, companies()));
    expect(JSON.stringify(again)).toBe(JSON.stringify(out));
  });

  it("réduit tous les plans du même facteur quand la capacité sature", () => {
    const a = player.products![A]!;
    const b = player.products![B]!;
    expect(a.planned).toBe(6000);
    expect(b.planned).toBe(6000);
    expect(a.produced + b.produced).toBeLessThanOrEqual(player.production.machineCapacity + 1e-9);
    expect(a.produced / a.planned).toBeCloseTo(b.produced / b.planned, 12);
    expect(a.produced).toBeLessThan(6000);
    expect(player.production.produced).toBeCloseTo(a.produced + b.produced, 9);
  });

  it("donne à chaque produit ses ventes, son chiffre d'affaires et son stock", () => {
    const a = player.products![A]!;
    const b = player.products![B]!;
    expect(a.segments).toEqual(novaScenario.market.segments.map((s) => s.code));
    expect(b.segments).toEqual(["b-pro"]);
    for (const p of [a, b]) {
      const segRevenue = p.segments.reduce((s, c) => s + player.market.bySegment[c]!.revenue, 0);
      const segSold = p.segments.reduce((s, c) => s + player.market.bySegment[c]!.sold, 0);
      expect(p.revenue).toBeCloseTo(segRevenue, 6);
      expect(p.sold).toBeCloseTo(segSold, 6);
      expect(p.unitVariableCost).toBeGreaterThan(0);
    }
    expect(a.unitVariableCost).toBe(
      novaScenario.product.materialCostPerUnit + novaScenario.product.otherVariableCostPerUnit,
    );
    expect(b.unitVariableCost).toBe(50);
    expect(b.price).toBe(95);
    const next = out.companies.find((c) => c.id === "player")!;
    expect(next.finishedGoodsByProduct?.[A]).toEqual(a.stock);
    expect(next.finishedGoodsByProduct?.[B]).toEqual(b.stock);
    expect(next.finishedGoods.quantity).toBeCloseTo(a.stock.quantity + b.stock.quantity, 9);
  });

  it("agrège en une seule comptabilité cohérente", () => {
    const a = player.products![A]!;
    const b = player.products![B]!;
    expect(player.incomeStatement.revenue).toBeCloseTo(a.revenue + b.revenue, 6);
    // Le bilan est équilibré (le moteur lève sinon) et les identités tiennent.
    expect(player.functionalBalance.netTreasury).toBeCloseTo(
      player.functionalBalance.frng - player.functionalBalance.bfr,
      6,
    );
    // Le marketing est bien la somme des budgets par produit.
    expect(player.incomeStatement.marketingCost).toBe(6000);
  });

  it("les bots jouent la gamme produit par produit", () => {
    // Le bot connaît la gamme : un plan par produit dont la somme est le plan
    // scalaire, et un prix par produit dérivé du segment dominant de SON marché
    // avec le même rapport que le prix scalaire porte au prix de référence.
    const sb = out.results["soundbox"]!;
    const plans = base.soundbox.products!;
    expect(plans[A]!.productionPlan).toBeGreaterThan(0);
    expect(plans[B]!.productionPlan).toBeGreaterThan(0);
    expect(plans[A]!.productionPlan + plans[B]!.productionPlan).toBeCloseTo(
      base.soundbox.productionPlan,
      9,
    );
    expect(sb.products?.[A]?.planned).toBeCloseTo(plans[A]!.productionPlan, 9);
    expect(sb.products?.[B]?.planned).toBeCloseTo(plans[B]!.productionPlan, 9);
    // Prix agressif sur les deux références (0,88 × référence du segment
    // dominant), jamais sous le coût variable du produit + 10 % : B coûte
    // 50 €, son prix plancher (55 €) l'emporte sur 0,88 × 59.
    expect(plans[A]!.price).toBeCloseTo(59 * 0.88, 9);
    expect(plans[B]!.price).toBeCloseTo(Math.max(50 * 1.1, 59 * 0.88), 9);
    // Et la somme des budgets marketing par produit est le budget scalaire.
    expect(plans[A]!.marketingBudget! + plans[B]!.marketingBudget!).toBeCloseTo(
      base.soundbox.marketingBudget,
      9,
    );
  });

  it("un scénario mono-produit ne reçoit aucune décision par produit", () => {
    expect(scalarDecisions(novaScenario, companies()).soundbox.products).toBeUndefined();
  });
});
