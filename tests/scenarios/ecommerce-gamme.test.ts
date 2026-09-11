import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "../../src/engine/bots";
import { isMultiProduct, toGamme } from "../../src/engine/gamme";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { ecommerceBots, ecommerceScenario } from "../../src/config/scenarios/ecommerce";
import {
  ecommerceGammeBots,
  ecommerceGammeCompany,
  ecommerceGammeScenario,
} from "../../src/config/scenarios/ecommerce-gamme";
import { ECOMMERCE_GAMME_SITUATIONS } from "../../src/config/scenarios/ecommerce-gamme/situations";
import { ECOMMERCE_SITUATIONS } from "../../src/config/scenarios/ecommerce/situations";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { tourDuPic } from "../../src/config/scenarios/rounds";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * PIXEL & CO · GAMME — le pure player en quatre rayons. Le pure player
 * d'origine reste le scénario des niveaux bas et une ancre de non-régression :
 * celui-ci est un SECOND scénario, qui partage son entrepôt, son équipe, sa
 * finance et ses concurrents, et y ajoute le mix des commandes, un coût
 * d'acquisition et une commission par rayon, et une collection à bâtir.
 *
 * Les invariants disent ce que la dramaturgie doit garder : les fêtes sont
 * le pic, la décoration fait le volume et le mobilier la marge, la capsule ne
 * se vend qu'une fois financée, celui qui n'achète pas son trafic ne gagne
 * pas, et l'équilibrée reste positive. L'instantané fige les chiffres de la
 * partie de référence. Et le pure player d'origine ne bouge pas d'un bit.
 */

const SEED = 20260101;
const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function partie(strategie: BotProfile): GameRunResult {
  const companies: CompanyState[] = [
    ecommerceGammeCompany("player", "PIXEL", "bot", strategie),
    ...ecommerceGammeBots.slice(0, 2).map((b) => ecommerceGammeCompany(b.id, b.name, "bot", b.profile)),
  ];
  return runGame({
    scenario: ecommerceGammeScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: ecommerceGammeScenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
            lastSoldByProduct: ctx.lastResult
              ? soldByProduct(ecommerceGammeScenario, ctx.lastResult.market.bySegment)
              : undefined,
          }),
      ]),
    ),
    seed: SEED,
  });
}

const joueur = (run: GameRunResult) => run.rounds.map((r) => r.results["player"]!);
const cumul = (run: GameRunResult) =>
  joueur(run).reduce((t, r) => t + r.incomeStatement.netIncome, 0);

describe("PIXEL & CO · gamme — la gamme", () => {
  it("est une gamme de quatre rayons, chacun avec ses clientèles, préparés par le même entrepôt", () => {
    expect(isMultiProduct(ecommerceGammeScenario)).toBe(true);
    const gamme = toGamme(ecommerceGammeScenario);
    expect(gamme.map((p) => p.code)).toEqual(["decoration", "mobilier", "luminaires", "capsule"]);
    // Le marché du scénario est celui de la décoration : c'est lui que lisent
    // les affichages mono-produit et le prix de référence des bots.
    expect(ecommerceGammeScenario.market.segments).toEqual(gamme[0]!.market.segments);
    expect(ecommerceGammeScenario.product.materialCostPerUnit).toBe(gamme[0]!.materialCostPerUnit);
    const segments = gamme.flatMap((p) => p.market.segments.map((s) => s.code));
    expect(new Set(segments).size).toBe(segments.length);
    // Le stock se garde (rien de périssable), et un fauteuil se prépare plus longtemps qu'un coussin.
    expect(ecommerceGammeScenario.perishable).toBeFalsy();
    expect(gamme[1]!.hoursPerUnit).toBeGreaterThan(gamme[0]!.hoursPerUnit);
    expect(scenarioByCode("ecommerce-gamme").vocabulary.unit).toBe("commande");
  });

  it("chaque rayon décline les trois clientèles du pure player d'origine : trafic payant à porte, base installée, place de marché à commission", () => {
    const gamme = toGamme(ecommerceGammeScenario);
    const segment = (code: string) => ecommerceScenario.market.segments.find((s) => s.code === code)!;
    for (const rayon of ["deco", "mobilier", "luminaires"]) {
      const p = gamme.find((x) => x.market.segments.some((s) => s.code === `${rayon}_trafic`))!;
      const trafic = p.market.segments.find((s) => s.code === `${rayon}_trafic`)!;
      expect(trafic.marketingGate).toBe(segment("acquisition").marketingGate);
      expect(trafic.marketingSensitivity).toBe(segment("acquisition").marketingSensitivity);
      const base = p.market.segments.find((s) => s.code === `${rayon}_fideles`)!;
      expect(base.loyalty).toBe(segment("fideles").loyalty);
      expect(base.marketingGate).toBeUndefined();
      const place = p.market.segments.find((s) => s.code === `${rayon}_marketplace`)!;
      expect(place.paymentDelayDays).toBe(segment("marketplace").paymentDelayDays);
      expect(place.commissionRate).toBeGreaterThanOrEqual(0.12);
    }
    // Les places de marché prélèvent davantage sur le mobilier.
    const mobilier = gamme[1]!.market.segments.find((s) => s.code === "mobilier_marketplace")!;
    expect(mobilier.commissionRate).toBe(0.15);
    // La capsule ne passe par aucune place de marché : une exclusivité.
    expect(gamme[3]!.market.segments.some((s) => s.commissionRate)).toBe(false);
  });

  it("partage l'entrepôt, l'équipe, la finance et les concurrents du pure player d'origine, et son stock réparti par rayon", () => {
    expect(ecommerceGammeScenario.fixedCostsPerRound).toBe(ecommerceScenario.fixedCostsPerRound);
    expect(ecommerceGammeScenario.finance).toEqual(ecommerceScenario.finance);
    expect(ecommerceGammeScenario.equipment).toEqual(ecommerceScenario.equipment);
    expect(ecommerceGammeScenario.suppliers).toEqual(ecommerceScenario.suppliers);
    expect(ecommerceGammeScenario.hr).toEqual(ecommerceScenario.hr);
    expect(ecommerceGammeScenario.qualityCosts).toEqual(ecommerceScenario.qualityCosts);
    expect(ecommerceGammeScenario.marketing).toEqual(ecommerceScenario.marketing);
    expect(ecommerceGammeBots).toBe(ecommerceBots);
    const c = ecommerceGammeCompany("t", "T", "human");
    expect(c.headcount).toBe(5);
    expect(c.machineCapacity).toBe(7000);
    expect(c.finance.equity).toBe(78000);
    expect(Object.keys(c.finishedGoodsByProduct!)).toEqual(["decoration", "mobilier", "luminaires", "capsule"]);
    const valeur = Object.values(c.finishedGoodsByProduct!).reduce((s, x) => s + x.quantity * x.unitCost, 0);
    expect(valeur).toBe(c.finance.inventoryValue);
    expect(c.finishedGoods.quantity).toBe(Object.values(c.finishedGoodsByProduct!).reduce((s, x) => s + x.quantity, 0));
    expect(c.finishedGoodsByProduct!["capsule"]!.quantity).toBe(0);
  });

  it("le pure player d'origine reste mono-produit, sans R&D ni levier communication", () => {
    expect(isMultiProduct(ecommerceScenario)).toBe(false);
    expect(ecommerceScenario.products).toBeUndefined();
    expect(ecommerceScenario.rd).toBeUndefined();
    expect(ecommerceScenario.communication).toBeUndefined();
    expect(ecommerceScenario.code).toBe("ecommerce");
  });

  it("chaque rayon se vend bien au-dessus de son coût variable, et le mobilier rapporte plus du double de la décoration par commande", () => {
    const gamme = toGamme(ecommerceGammeScenario);
    for (const p of gamme) {
      const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
      for (const s of p.market.segments) {
        expect(s.refPrice, `${p.code}/${s.code}`).toBeGreaterThan(variable * 1.5);
      }
    }
    const marge = (p: (typeof gamme)[number]) =>
      Math.min(...p.market.segments.map((s) => s.refPrice)) - p.materialCostPerUnit - p.otherVariableCostPerUnit;
    expect(marge(gamme[1]!)).toBeGreaterThan(2 * marge(gamme[0]!));
    expect(marge(gamme[2]!)).toBeGreaterThan(marge(gamme[0]!));
  });

  it("la capsule est à bâtir : un coût de R&D, un lancement au plus tôt au tour 2, rien à vendre avant", () => {
    const [deco, mobilier, luminaires, capsule] = toGamme(ecommerceGammeScenario);
    expect(capsule!.development).toEqual({ cost: 20000, availableFromRound: 2 });
    for (const p of [deco, mobilier, luminaires]) expect(p!.development).toBeUndefined();
    expect(ecommerceGammeScenario.rd).toBeDefined();
    const t1 = joueur(partie("balanced"))[0]!.products!["capsule"]!;
    expect(t1.produced).toBe(0);
    expect(t1.sold).toBe(0);
    expect(t1.rd?.development?.launched).toBe(false);
  });

  it("hérite des situations du pure player, sous d'autres codes, et réécrit celles que le mix change", () => {
    expect(ECOMMERCE_GAMME_SITUATIONS).toHaveLength(ECOMMERCE_SITUATIONS.length);
    const codes = ECOMMERCE_GAMME_SITUATIONS.map((s) => s.code);
    expect(codes.every((c) => c.startsWith("ecomg_"))).toBe(true);
    expect(codes).not.toEqual(ECOMMERCE_SITUATIONS.map((s) => s.code));
    const par = (code: string) => ECOMMERCE_GAMME_SITUATIONS.find((s) => s.code === code)!;
    expect(par("ecomg_t1_acquisition").title).toBe("Le premier euro de publicité, rayon par rayon");
    expect(par("ecomg_t5_commission").narrative).toContain("15 % sur le mobilier");
    expect(par("ecomg_t4_pic").hints[3]!.text).toContain("mix");
    expect(par("ecomg_detect_idle_cash").narrative).not.toBe(
      ECOMMERCE_SITUATIONS.find((s) => s.code === "ecom_detect_idle_cash")!.narrative,
    );
    for (const [i, s] of ECOMMERCE_GAMME_SITUATIONS.entries()) {
      const source = ECOMMERCE_SITUATIONS[i]!;
      expect(s.modelRelevance).toEqual(source.modelRelevance);
      expect(s.diagnosticOptions.map((o) => [o.id, o.correct])).toEqual(source.diagnosticOptions.map((o) => [o.id, o.correct]));
      expect(s.hints.length).toBe(source.hints.length);
      expect(s.trigger).toEqual(source.trigger);
    }
  });

  it("porte le levier communication : la qualité parle à la base installée, le prix au trafic payant", () => {
    expect(ecommerceGammeScenario.communication).toBeDefined();
    const equilibre = joueur(partie("balanced"))[0]!;
    expect(equilibre.communication?.axis).toBe("qualite");
    expect(equilibre.communication!.brandBudget).toBeGreaterThan(0);
    expect(equilibre.communication!.fitBySegment["deco_fideles"]).toBeGreaterThan(1);
    const agressif = joueur(partie("price_aggressive"))[0]!;
    expect(agressif.communication?.axis).toBe("prix");
    expect(agressif.communication!.fitBySegment["deco_trafic"]).toBeGreaterThan(1);
    expect(agressif.communication!.fitBySegment["deco_fideles"]).toBeLessThan(1);
  });
});

describe("PIXEL & CO · gamme — dramaturgie", () => {
  const croissance = partie("growth");

  it("les fêtes sont le pic, comme dans le pure player d'origine", () => {
    expect(tourDuPic(ecommerceGammeScenario)).toBe(4);
    expect(tourDuPic(ecommerceScenario)).toBe(4);
  });

  it("la décoration fait le volume, le mobilier fait la marge", () => {
    const rounds = joueur(croissance);
    const vendus = (code: string) => rounds.reduce((s, r) => s + r.products![code]!.sold, 0);
    const marge = (code: string) =>
      rounds.reduce(
        (s, r) => s + r.products![code]!.sold * (r.products![code]!.price - r.products![code]!.unitVariableCost),
        0,
      ) / vendus(code);
    expect(vendus("decoration")).toBeGreaterThan(vendus("mobilier"));
    expect(vendus("decoration")).toBeGreaterThan(vendus("luminaires"));
    expect(marge("mobilier")).toBeGreaterThan(2 * marge("decoration"));
    expect(marge("luminaires")).toBeGreaterThan(marge("decoration"));
    expect(vendus("capsule")).toBeGreaterThan(1500);
  });

  it("celui qui finance la capsule dès le tour 1 la vend au tour 2 ; qui ne la bâtit pas ne la vend jamais", () => {
    const equilibre = joueur(partie("balanced"));
    expect(equilibre[0]!.incomeStatement.rdCost).toBeGreaterThanOrEqual(20000);
    expect(equilibre[1]!.products!["capsule"]!.rd?.development).toMatchObject({ launched: true, launchRound: 2 });
    expect(equilibre[1]!.products!["capsule"]!.sold).toBeGreaterThan(0);
    for (const s of ["passive", "price_aggressive"] as const) {
      for (const r of joueur(partie(s))) {
        expect(r.products!["capsule"]!.sold, s).toBe(0);
        expect(r.incomeStatement.rdCost, s).toBeUndefined();
      }
    }
  });

  it("le résultat par rayon se recolle à la comptabilité, et l'entrepôt borne la somme des rayons", () => {
    for (const r of joueur(croissance)) {
      const produits = Object.values(r.products!);
      expect(produits).toHaveLength(4);
      const ca = produits.reduce((s, p) => s + p.revenue, 0);
      expect(r.incomeStatement.revenue).toBeGreaterThanOrEqual(ca - 1e-6);
      // Le stock se garde : on peut vendre plus qu'on ne prépare ce tour-ci, jamais préparer plus que l'entrepôt.
      expect(r.production.produced).toBeLessThanOrEqual(r.production.machineCapacity + 1e-6);
    }
  });
});

describe("PIXEL & CO · gamme — calibration", () => {
  const parties = Object.fromEntries(STRATEGIES.map((s) => [s, partie(s)])) as Record<BotProfile, GameRunResult>;
  const resultats = STRATEGIES.map((s) => ({ s, cumul: cumul(parties[s]) }));

  it("le secteur peut se gagner, et par plus d'une stratégie — dont l'équilibrée", () => {
    // Comme dans le pure player d'origine : acheter son trafic paie, l'équilibrée
    // qui bâtit la capsule l'emporte, la croissance et l'agressif encaissent,
    // celui qui n'achète pas son trafic ne vend rien, le premium vide son entrepôt.
    const gagnantes = resultats.filter((r) => r.cumul > 0);
    expect(
      gagnantes.length,
      resultats.map((r) => `${r.s} ${Math.round(r.cumul / 1000)} k€`).join(", "),
    ).toBeGreaterThanOrEqual(3);
    expect(resultats.find((r) => r.s === "balanced")!.cumul).toBeGreaterThan(0);
  });

  it("celui qui n'achète pas son trafic ne gagne pas la partie, et nul ne meurt avant le troisième tour", () => {
    const passive = resultats.find((r) => r.s === "passive")!.cumul;
    expect(resultats.find((r) => r.s === "growth")!.cumul).toBeGreaterThan(passive);
    expect(resultats.find((r) => r.s === "balanced")!.cumul).toBeGreaterThan(passive);
    expect(passive).toBeLessThan(0);
    for (const s of STRATEGIES) {
      const mort = joueur(parties[s]).findIndex((r) => soldUnits(r) === 0) + 1;
      expect(mort === 0 || mort >= 3, `${s} défaillante au tour ${mort}`).toBe(true);
    }
  });

  it("les décisions comptent : plus de cent cinquante mille euros entre la meilleure et la pire", () => {
    const totals = resultats.map((r) => r.cumul);
    expect(Math.max(...totals) - Math.min(...totals)).toBeGreaterThan(150000);
  });

  it("la partie de référence ne bouge pas sans qu'on le veuille", () => {
    const fige = Object.fromEntries(
      STRATEGIES.map((s) => [
        s,
        joueur(parties[s]).map((r) => ({
          resultat: Math.round(r.incomeStatement.netIncome),
          tresorerie: Math.round(r.functionalBalance.netTreasury),
          vendu: Object.fromEntries(Object.entries(r.products!).map(([c, p]) => [c, Math.round(p.sold)])),
        })),
      ]),
    );
    expect(fige).toMatchSnapshot();
  });
});
