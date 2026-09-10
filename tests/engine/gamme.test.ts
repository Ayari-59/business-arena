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
    expect(d).toEqual({ price: 59, productionPlan: 4800, marketingBudget: 6000, qualityBudget: 3000 });
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
    // Part égale du plan, du marketing ET de la qualité scalaires.
    expect(decisions[0]).toEqual({ price: 59, productionPlan: 2400, marketingBudget: 3000, qualityBudget: 1500 });
    expect(decisions[1]).toEqual({ price: 59, productionPlan: 2400, marketingBudget: 3000, qualityBudget: 1500 });
    // Une entrée explicite fait foi, fournisseur compris ; un produit sans
    // fournisseur propre reçoit le fournisseur scalaire.
    const explicit = toGammeDecisions(
      {
        ...PLAYER,
        supplierChoice: "standard",
        products: {
          [B]: { price: 80, productionPlan: 1000, marketingBudget: 500, qualityBudget: 2500, supplierChoice: "premium" },
        },
      },
      gamme,
    );
    expect(explicit[0]).toMatchObject({ price: 59, qualityBudget: 1500, supplierChoice: "standard" });
    expect(explicit[1]).toEqual({
      price: 80,
      productionPlan: 1000,
      marketingBudget: 500,
      qualityBudget: 2500,
      supplierChoice: "premium",
    });
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

  it("les bots répartissent leur budget qualité au prorata du plan et gardent un seul fournisseur", () => {
    // Auris (premium) dépense 1,5 × l'échelle qualité : la somme des budgets
    // par produit est le budget scalaire, et chaque référence en reçoit la
    // part de son plan. Son fournisseur est le même sur toute la gamme.
    const auris = base.auris;
    const plans = auris.products!;
    expect(auris.qualityBudget).toBeGreaterThan(0);
    expect(plans[A]!.qualityBudget! + plans[B]!.qualityBudget!).toBeCloseTo(auris.qualityBudget, 9);
    expect(plans[A]!.qualityBudget! / auris.qualityBudget).toBeCloseTo(
      plans[A]!.productionPlan / auris.productionPlan,
      9,
    );
    expect(plans[A]!.supplierChoice).toBe(auris.supplierChoice);
    expect(plans[B]!.supplierChoice).toBe(auris.supplierChoice);
  });
});

describe("gamme — la qualité et le fournisseur se décident par référence", () => {
  // NOVA + produit B, avec des coûts de non-qualité (rebuts, retours) pour
  // que la qualité de chaque référence se lise aussi dans ses rebuts.
  const scenario = parseScenarioConfig({
    ...gammeScenario(),
    qualityCosts: { baseDefectRate: 0.04, externalReturnSensitivity: 0.1 },
  });
  const states = companies();
  const base = scalarDecisions(scenario, states);
  const player = (products: RoundDecisions["products"]): Record<string, RoundDecisions> => ({
    ...base,
    player: { ...PLAYER, supplierChoice: "standard", products },
  });
  const egal = simulateRound(
    input(
      scenario,
      player({
        [A]: { price: 59, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 1500 },
        [B]: { price: 95, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 1500 },
      }),
      states,
    ),
  );
  const concentre = simulateRound(
    input(
      scenario,
      player({
        [A]: { price: 59, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 3000 },
        [B]: { price: 95, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 0 },
      }),
      states,
    ),
  );

  it("un budget réparti à parts égales donne à chaque référence la qualité que le scalaire donnait à l'entreprise", () => {
    // Même budget total (3 000 €) que le joueur mono-produit ; en gamme
    // l'échelle est divisée par deux, donc 1 500 € par référence valent
    // exactement 3 000 € pour l'entreprise mono-produit.
    const r = egal.results["player"]!;
    expect(r.products![A]!.qualityBudget).toBe(1500);
    expect(r.products![A]!.producedQuality).toBeCloseTo(r.products![B]!.producedQuality, 12);
    expect(r.products![A]!.producedQuality).toBeCloseTo(r.production.producedQuality, 12);
    expect(r.incomeStatement.qualityCost).toBe(3000);
    expect(r.qualityCosts?.prevention).toBe(3000);
  });

  it("concentré sur une référence, il la distingue : qualité produite, rebuts, qualité perçue", () => {
    const r = concentre.results["player"]!;
    const a = r.products![A]!;
    const b = r.products![B]!;
    expect(a.qualityBudget).toBe(3000);
    expect(b.qualityBudget).toBe(0);
    expect(a.producedQuality).toBeGreaterThan(b.producedQuality);
    // Moins de qualité produite, plus de rebuts (NOVA porte des coûts de non-qualité).
    expect(b.defectUnits / b.produced).toBeGreaterThan(a.defectUnits / a.produced);
    expect(a.perceivedQuality).toBeGreaterThan(b.perceivedQuality);
    // Le budget total est inchangé : seule la répartition a bougé.
    expect(r.incomeStatement.qualityCost).toBe(3000);
    // L'état suivant suit chaque référence, et la qualité de l'entreprise
    // est leur moyenne pondérée par les unités produites.
    const next = concentre.companies.find((c) => c.id === "player")!;
    expect(next.perceivedQualityByProduct![A]).toBe(a.perceivedQuality);
    expect(next.perceivedQualityByProduct![B]).toBe(b.perceivedQuality);
    expect(next.perceivedQuality).toBeGreaterThan(Math.min(a.perceivedQuality, b.perceivedQuality));
    expect(next.perceivedQuality).toBeLessThan(Math.max(a.perceivedQuality, b.perceivedQuality));
    // Un état mono-produit ne porte jamais ce champ.
    expect(
      simulateRound(input(novaScenario, scalarDecisions(novaScenario, companies()))).companies[0]!
        .perceivedQualityByProduct,
    ).toBeUndefined();
  });

  it("la qualité perçue d'une référence est celle que son marché voit au tour suivant", () => {
    // Au tour 2, la référence B (sans qualité) attire moins que la même
    // référence B d'une équipe qui l'a soignée : la qualité perçue par
    // produit entre bien dans l'attraction du produit.
    const tour2 = (apres: ReturnType<typeof simulateRound>) =>
      simulateRound({
        scenario,
        roundIndex: 2,
        companies: apres.companies,
        decisions: player({
          [A]: { price: 59, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 1500 },
          [B]: { price: 95, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 1500 },
        }),
        activeEvents: [],
        seed: SEED,
      });
    const apresEgal = tour2(egal).results["player"]!;
    const apresConcentre = tour2(concentre).results["player"]!;
    // La demande captée (avant contrainte de stock) suit la qualité perçue
    // de CHAQUE référence : B en perd, A en gagne.
    const demande = (r: typeof apresEgal, codes: string[]) =>
      codes.reduce((s, c) => s + r.market.bySegment[c]!.demandForCompany, 0);
    expect(demande(apresConcentre, ["b-pro"])).toBeLessThan(demande(apresEgal, ["b-pro"]));
    expect(demande(apresConcentre, apresEgal.products![A]!.segments)).toBeGreaterThan(
      demande(apresEgal, apresEgal.products![A]!.segments),
    );
  });

  it("chaque référence achète chez son fournisseur : coût, bonus qualité, délai de règlement", () => {
    const standard = scenario.suppliers!.find((s) => s.code === "standard")!;
    const lowcost = scenario.suppliers!.find((s) => s.code === "lowcost")!;
    const premium = scenario.suppliers!.find((s) => s.code === "premium")!;
    // Le fournisseur low-cost porte un risque de rupture : on le neutralise
    // ici pour ne mesurer que le coût et le délai (la rupture a son test).
    const sansRupture = parseScenarioConfig({
      ...scenario,
      suppliers: scenario.suppliers!.map((s) => ({ ...s, supplyRiskProbability: 0 })),
    });
    const panache = simulateRound(
      input(
        sansRupture,
        player({
          [A]: { price: 59, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 1500, supplierChoice: "lowcost" },
          [B]: { price: 95, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 1500, supplierChoice: "premium" },
        }),
        states,
      ),
    );
    const r = panache.results["player"]!;
    const a = r.products![A]!;
    const b = r.products![B]!;
    expect(a.supplier).toMatchObject({ code: "lowcost", supplyDisruption: false });
    expect(b.supplier).toMatchObject({ code: "premium", supplyDisruption: false });
    // Coût variable de chaque référence au prix d'achat de SON fournisseur.
    expect(a.unitVariableCost).toBeCloseTo(
      novaScenario.product.materialCostPerUnit * lowcost.costMultiplier +
        novaScenario.product.otherVariableCostPerUnit,
      9,
    );
    expect(b.unitVariableCost).toBeCloseTo(30 * premium.costMultiplier + 20, 9);
    // Le bonus qualité du fournisseur ne joue que sur SA référence : à budget
    // qualité égal, B (premium, +0,05) est mieux perçu que A (low-cost, −0,03).
    expect(b.perceivedQuality).toBeGreaterThan(a.perceivedQuality);
    // Les dettes fournisseurs suivent les délais de chaque fournisseur, entre
    // ceux d'une gamme tout au standard et… ceux d'une gamme tout au premium.
    const toutStandard = simulateRound(
      input(
        sansRupture,
        player({
          [A]: { price: 59, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 1500, supplierChoice: "standard" },
          [B]: { price: 95, productionPlan: 3000, marketingBudget: 3000, qualityBudget: 1500, supplierChoice: "standard" },
        }),
        states,
      ),
    ).results["player"]!;
    expect(standard.paymentDelayDays).toBeGreaterThan(premium.paymentDelayDays);
    expect(lowcost.paymentDelayDays).toBeGreaterThan(standard.paymentDelayDays);
    // Panaché (45 j et 15 j, pondérés par les achats) contre tout standard (22 j).
    expect(r.balanceSheet.payables).not.toBeCloseTo(toutStandard.balanceSheet.payables, 2);
    // Le bloc fournisseur d'entreprise reste celui du scalaire.
    expect(r.supplier?.code).toBe("standard");
  });

  it("une rupture d'approvisionnement n'ampute que les références du fournisseur défaillant", () => {
    // Une rupture certaine (probabilité 1) dépasse ce que le schéma admet
    // (0,3) : on l'injecte après validation, le moteur ne revalide pas.
    const fragile: EngineScenarioConfig = {
      ...scenario,
      suppliers: scenario.suppliers!.map((s) =>
        s.code === "lowcost"
          ? { ...s, supplyRiskProbability: 1, supplyRiskAvailabilityHit: 0.5 }
          : { ...s, supplyRiskProbability: 0 },
      ),
    };
    const r = simulateRound(
      input(
        fragile,
        player({
          [A]: { price: 59, productionPlan: 2000, marketingBudget: 3000, qualityBudget: 1500, supplierChoice: "standard" },
          [B]: { price: 95, productionPlan: 2000, marketingBudget: 3000, qualityBudget: 1500, supplierChoice: "lowcost" },
        }),
        states,
      ),
    ).results["player"]!;
    const a = r.products![A]!;
    const b = r.products![B]!;
    expect(b.supplier?.supplyDisruption).toBe(true);
    expect(a.supplier?.supplyDisruption).toBe(false);
    // Sous la capacité : A produit son plan, B la moitié du sien.
    expect(a.produced).toBeCloseTo(2000, 9);
    expect(b.produced).toBeCloseTo(1000, 9);
  });

  it("une référence à catalogue propre s'approvisionne chez SES fournisseurs, les bots aussi", () => {
    // B déclare son propre catalogue : un tricoteur spécialisé (référence,
    // moins cher que le standard du scénario) et un atelier premium. Le code
    // « lowcost » du scénario n'y existe pas : B retombe sur SON référent.
    const specialise = parseScenarioConfig({
      ...gammeScenario({
        ...productB(),
        suppliers: [
          {
            code: "specialiste",
            name: "Tricoteur spécialisé",
            narrative: "Le spécialiste de B.",
            costMultiplier: 1,
            qualityBonus: 0,
            paymentDelayDays: 30,
            supplyRiskProbability: 0,
            supplyRiskAvailabilityHit: 1,
          },
          {
            code: "atelier",
            name: "Atelier premium de B",
            narrative: "Plus cher, mieux fini.",
            costMultiplier: 1.3,
            qualityBonus: 0.1,
            paymentDelayDays: 15,
            supplyRiskProbability: 0,
            supplyRiskAvailabilityHit: 1,
          },
        ],
      }),
      suppliers: scenario.suppliers!.map((s) => ({ ...s, supplyRiskProbability: 0 })),
      // Les bots n'arbitrent leurs fournisseurs que lorsqu'ils sont « enrichis ».
      enrichedBots: true,
    });
    const gammeB = toGamme(specialise)[1]!;
    expect(gammeB.suppliers?.map((s) => s.code)).toEqual(["specialiste", "atelier"]);
    // A garde le catalogue du scénario.
    expect(toGamme(specialise)[0]!.suppliers).toBeUndefined();

    const r = simulateRound(
      input(
        specialise,
        player({
          [A]: { price: 59, productionPlan: 3000, qualityBudget: 1500, supplierChoice: "lowcost" },
          [B]: { price: 95, productionPlan: 3000, qualityBudget: 1500, supplierChoice: "lowcost" },
        }),
        states,
      ),
    ).results["player"]!;
    expect(r.products![A]!.supplier?.code).toBe("lowcost");
    expect(r.products![B]!.supplier?.code).toBe("specialiste");
    expect(r.products![B]!.unitVariableCost).toBeCloseTo(30 + 20, 9);
    const atelier = simulateRound(
      input(
        specialise,
        player({
          [A]: { price: 59, productionPlan: 3000, qualityBudget: 1500 },
          [B]: { price: 95, productionPlan: 3000, qualityBudget: 1500, supplierChoice: "atelier" },
        }),
        states,
      ),
    ).results["player"]!;
    expect(atelier.products![B]!.supplier?.code).toBe("atelier");
    expect(atelier.products![B]!.unitVariableCost).toBeCloseTo(30 * 1.3 + 20, 9);

    // Les bots appliquent leur règle de profil au catalogue de chaque
    // référence : le premium prend le mieux-disant qualité partout, l'agressif
    // le moins cher partout.
    const premium = botDecisions("premium", { scenario: specialise, state: states[2]!, roundIndex: 1 });
    expect(premium.products![A]!.supplierChoice).toBe("premium");
    expect(premium.products![B]!.supplierChoice).toBe("atelier");
    const agressif = botDecisions("price_aggressive", { scenario: specialise, state: states[1]!, roundIndex: 1 });
    expect(agressif.products![A]!.supplierChoice).toBe("lowcost");
    expect(agressif.products![B]!.supplierChoice).toBe("specialiste");
  });

  it("refuse deux fournisseurs de même code dans le catalogue d'une référence", () => {
    const doublon = {
      code: "x",
      name: "X",
      narrative: "x",
      costMultiplier: 1,
      qualityBonus: 0,
      paymentDelayDays: 0,
      supplyRiskProbability: 0,
      supplyRiskAvailabilityHit: 1,
    };
    expect(() => gammeScenario({ ...productB(), suppliers: [doublon, { ...doublon, name: "Y" }] })).toThrow(
      /fournisseur/,
    );
  });

  it("un produit sans fournisseur propre prend le fournisseur scalaire", () => {
    const r = simulateRound(
      input(
        scenario,
        {
          ...base,
          player: {
            ...PLAYER,
            supplierChoice: "premium",
            products: {
              [A]: { price: 59, productionPlan: 3000, qualityBudget: 1500 },
              [B]: { price: 95, productionPlan: 3000, qualityBudget: 1500 },
            },
          },
        },
        states,
      ),
    ).results["player"]!;
    expect(r.products![A]!.supplier?.code).toBe("premium");
    expect(r.products![B]!.supplier?.code).toBe("premium");
  });
});
