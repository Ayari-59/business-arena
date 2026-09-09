import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "../../src/engine/bots";
import { isMultiProduct, toGamme } from "../../src/engine/gamme";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { boutiqueBots, boutiqueCompany, boutiqueScenario } from "../../src/config/scenarios/boutique";
import { tourDuPic } from "../../src/config/scenarios/rounds";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * MAILLE & CO — le premier secteur à GAMME du jeu. Cinq références en maille,
 * chacune avec son marché et sa saison, qui partagent la même réserve et la
 * même comptabilité.
 *
 * Ce fichier tient deux rôles. Les invariants de calibration disent ce que la
 * dramaturgie du secteur doit garder : Noël est le pic, la demande de Noël
 * dépasse la réserve (le facteur rare), le bonnet fait le volume et le mérinos
 * la marge, et les cinq stratégies types restent jouables. L'instantané doré
 * fige les chiffres de la partie de référence : toute retouche du scénario, du
 * moteur de gamme ou des bots par produit qui les déplace doit être voulue.
 */

const SEED = 20260101;
const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function partie(strategie: BotProfile): GameRunResult {
  const companies: CompanyState[] = [
    boutiqueCompany("player", "MAILLE & CO", "bot", strategie),
    ...boutiqueBots.slice(0, 2).map((b) => boutiqueCompany(b.id, b.name, "bot", b.profile)),
  ];
  return runGame({
    scenario: boutiqueScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: boutiqueScenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
            lastSoldByProduct: ctx.lastResult
              ? soldByProduct(boutiqueScenario, ctx.lastResult.market.bySegment)
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

describe("MAILLE & CO — la gamme", () => {
  it("est une gamme de cinq références, chacune avec son marché", () => {
    expect(isMultiProduct(boutiqueScenario)).toBe(true);
    const gamme = toGamme(boutiqueScenario);
    expect(gamme.map((p) => p.code)).toEqual([
      "pull-col-rond",
      "cardigan",
      "pull-merinos",
      "echarpe",
      "bonnet",
    ]);
    // Le marché du scénario est celui du cœur de gamme : c'est lui que lisent
    // les affichages mono-produit et le prix de référence des bots.
    expect(boutiqueScenario.market.segments).toEqual(gamme[0]!.market.segments);
    // Le produit « de référence » porte les coûts du pull col rond.
    expect(boutiqueScenario.product.materialCostPerUnit).toBe(gamme[0]!.materialCostPerUnit);
  });

  it("ouvre avec un stock par référence dont l'agrégat est le lot mono-produit", () => {
    const c = boutiqueCompany("t", "T", "human");
    const lots = Object.values(c.finishedGoodsByProduct!);
    expect(lots).toHaveLength(5);
    const quantite = lots.reduce((s, l) => s + l.quantity, 0);
    const valeur = lots.reduce((s, l) => s + l.quantity * l.unitCost, 0);
    expect(c.finishedGoods.quantity).toBe(quantite);
    expect(c.finishedGoods.quantity * c.finishedGoods.unitCost).toBeCloseTo(valeur, 6);
    expect(c.finance.inventoryValue).toBeCloseTo(valeur, 6);
  });

  it("chaque référence vend plus cher que son coût variable, au prix de référence de chacun de ses segments", () => {
    for (const p of toGamme(boutiqueScenario)) {
      const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
      for (const s of p.market.segments) {
        expect(s.refPrice, `${p.code}/${s.code}`).toBeGreaterThan(variable * 1.3);
      }
    }
  });
});

describe("MAILLE & CO — dramaturgie", () => {
  const balanced = partie("balanced");

  it("Noël est le pic du secteur", () => {
    expect(tourDuPic(boutiqueScenario)).toBe(4);
  });

  it("au tour 4, la demande dépasse la réserve : le facteur rare joue", () => {
    const t4 = joueur(balanced)[3]!;
    const demande = Object.values(t4.market.bySegment).reduce((s, x) => s + x.demandForCompany, 0);
    expect(demande).toBeGreaterThan(t4.production.machineCapacity);
  });

  it("le bonnet fait le volume, le pull mérinos fait la marge", () => {
    const rounds = joueur(balanced);
    const vendus = (code: string) => rounds.reduce((s, r) => s + r.products![code]!.sold, 0);
    const marge = (code: string) =>
      rounds.reduce(
        (s, r) => s + r.products![code]!.sold * (r.products![code]!.price - r.products![code]!.unitVariableCost),
        0,
      );
    expect(vendus("bonnet")).toBeGreaterThan(vendus("pull-merinos"));
    expect(marge("pull-merinos") / vendus("pull-merinos")).toBeGreaterThan(
      3 * (marge("bonnet") / vendus("bonnet")),
    );
  });

  it("le résultat par produit se recolle à la comptabilité de l'entreprise", () => {
    for (const r of joueur(balanced)) {
      const produits = Object.values(r.products!);
      expect(produits).toHaveLength(5);
      const ca = produits.reduce((s, p) => s + p.revenue, 0);
      // Les commandes fermes et exceptionnelles s'ajoutent au CA des marchés.
      expect(r.incomeStatement.revenue).toBeGreaterThanOrEqual(ca - 1e-6);
      const produit = produits.reduce((s, p) => s + p.produced, 0);
      expect(r.production.produced).toBeCloseTo(produit, 6);
    }
  });
});

describe("MAILLE & CO — calibration", () => {
  const resultats = STRATEGIES.map((s) => ({ s, cumul: cumul(partie(s)) }));

  it("le secteur peut se gagner, et par plus d'une stratégie", () => {
    const gagnantes = resultats.filter((r) => r.cumul > 0);
    expect(
      gagnantes.length,
      resultats.map((r) => `${r.s} ${Math.round(r.cumul / 1000)} k€`).join(", "),
    ).toBeGreaterThanOrEqual(3);
  });

  it("aucune stratégie ne coûte plus que l'entreprise ne valait", () => {
    const depart = boutiqueCompany("m", "m", "bot").finance.equity;
    for (const s of STRATEGIES) {
      const dernier = partie(s).finalCompanies.find((c) => c.id === "player")!;
      expect(dernier.finance.equity, s).toBeGreaterThan(-depart);
    }
  });
});

describe("MAILLE & CO — instantané doré", () => {
  it("la partie de référence (équilibrée contre FastMode et Atelier Lin) est figée", () => {
    const run = partie("balanced");
    const resume = joueur(run).map((r, i) => ({
      tour: i + 1,
      ca: Math.round(r.incomeStatement.revenue),
      resultat: Math.round(r.incomeStatement.netIncome),
      tresorerie: Math.round(r.functionalBalance.netTreasury),
      produits: Object.fromEntries(
        Object.entries(r.products!).map(([code, p]) => [
          code,
          {
            plan: Math.round(p.planned),
            vendu: Math.round(p.sold),
            perdu: Math.round(p.lost),
            prix: Math.round(p.price * 100) / 100,
            stock: Math.round(p.stock.quantity),
          },
        ]),
      ),
    }));
    expect(resume).toMatchSnapshot();
    // Déterminisme : la même partie rejouée est identique au bit près.
    expect(JSON.stringify(partie("balanced"))).toBe(JSON.stringify(run));
  });
});
