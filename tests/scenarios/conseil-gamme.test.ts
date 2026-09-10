import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "../../src/engine/bots";
import { isMultiProduct, toGamme } from "../../src/engine/gamme";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { conseilBots, conseilScenario } from "../../src/config/scenarios/conseil";
import {
  conseilGammeBots,
  conseilGammeCompany,
  conseilGammeScenario,
} from "../../src/config/scenarios/conseil-gamme";
import { CONSEIL_GAMME_SITUATIONS } from "../../src/config/scenarios/conseil-gamme/situations";
import { CONSEIL_SITUATIONS } from "../../src/config/scenarios/conseil/situations";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * ATLAS CONSEIL · GAMME — le cabinet en trois offres. Le cabinet d'origine
 * reste le scénario des niveaux bas et une ancre de non-régression : celui-ci
 * est un SECOND scénario, qui partage ses consultants, sa finance et ses
 * concurrents, et y ajoute le mix des journées vendues et une offre à bâtir.
 *
 * Les invariants disent ce que la dramaturgie doit garder : l'été est le
 * creux, l'audit fait le volume et la cyber la marge, la pratique cyber ne se
 * vend qu'une fois financée, la croissance l'emporte, la passive ne gagne pas
 * la partie, et l'équilibrée reste positive. L'instantané fige les chiffres
 * de la partie de référence : toute retouche du scénario, du moteur de gamme
 * ou des bots qui les déplace doit être voulue. Et le cabinet d'origine ne
 * bouge pas d'un bit.
 */

const SEED = 20260101;
const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function partie(strategie: BotProfile): GameRunResult {
  const companies: CompanyState[] = [
    conseilGammeCompany("player", "ATLAS", "bot", strategie),
    ...conseilGammeBots.slice(0, 2).map((b) => conseilGammeCompany(b.id, b.name, "bot", b.profile)),
  ];
  return runGame({
    scenario: conseilGammeScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: conseilGammeScenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
            lastSoldByProduct: ctx.lastResult
              ? soldByProduct(conseilGammeScenario, ctx.lastResult.market.bySegment)
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

describe("ATLAS CONSEIL · gamme — la gamme", () => {
  it("est une gamme de trois offres, chacune avec sa clientèle, vendues par les mêmes consultants", () => {
    expect(isMultiProduct(conseilGammeScenario)).toBe(true);
    const gamme = toGamme(conseilGammeScenario);
    expect(gamme.map((p) => p.code)).toEqual(["audit", "transformation", "cyber"]);
    // Le marché du scénario est celui de l'audit : c'est lui que lisent les
    // affichages mono-produit et le prix de référence des bots.
    expect(conseilGammeScenario.market.segments).toEqual(gamme[0]!.market.segments);
    expect(conseilGammeScenario.product.materialCostPerUnit).toBe(gamme[0]!.materialCostPerUnit);
    const segments = gamme.flatMap((p) => p.market.segments.map((s) => s.code));
    expect(new Set(segments).size).toBe(segments.length);
    // Une journée ne se stocke pas, pour aucune offre ; et chacune consomme un jour-consultant.
    expect(conseilGammeScenario.perishable).toBe(true);
    for (const p of gamme) expect(p.hoursPerUnit).toBe(1);
    expect(scenarioByCode("conseil-gamme").vocabulary.laborTimeUnit).toBe("jour");
  });

  it("l'audit est la journée du cabinet d'origine : mêmes frais, mêmes consultants, mêmes concurrents", () => {
    const [audit, transformation] = toGamme(conseilGammeScenario);
    expect(audit!.materialCostPerUnit).toBe(conseilScenario.product.materialCostPerUnit);
    expect(audit!.otherVariableCostPerUnit).toBe(conseilScenario.product.otherVariableCostPerUnit);
    const segment = (code: string) => conseilScenario.market.segments.find((s) => s.code === code)!;
    const pme = audit!.market.segments.find((s) => s.code === "pme")!;
    expect({ ...pme, size: 0 }).toEqual({ ...segment("pme"), size: 0 });
    const publics = audit!.market.segments.find((s) => s.code === "public")!;
    expect({ ...publics, size: 0 }).toEqual({ ...segment("public"), size: 0 });
    // Les grands comptes prennent la transformation, aux mêmes ressorts.
    const grandsComptes = transformation!.market.segments.find((s) => s.code === "grands_comptes")!;
    expect({ ...grandsComptes, size: 0 }).toEqual({ ...segment("grands_comptes"), size: 0 });
    expect(conseilGammeScenario.fixedCostsPerRound).toBe(conseilScenario.fixedCostsPerRound);
    expect(conseilGammeScenario.finance).toEqual(conseilScenario.finance);
    expect(conseilGammeScenario.equipment).toEqual(conseilScenario.equipment);
    expect(conseilGammeScenario.suppliers).toEqual(conseilScenario.suppliers);
    expect(conseilGammeScenario.hr).toEqual(conseilScenario.hr);
    expect(conseilGammeBots).toBe(conseilBots);
    const c = conseilGammeCompany("t", "T", "human");
    expect(c.headcount).toBe(12);
    expect(c.machineCapacity).toBe(1500);
    expect(c.finance.equity).toBe(205000);
    expect(Object.keys(c.finishedGoodsByProduct!)).toEqual(["audit", "transformation", "cyber"]);
    for (const lot of Object.values(c.finishedGoodsByProduct!)) expect(lot.quantity).toBe(0);
  });

  it("le cabinet d'origine reste mono-produit, sans R&D ni levier communication", () => {
    expect(isMultiProduct(conseilScenario)).toBe(false);
    expect(conseilScenario.products).toBeUndefined();
    expect(conseilScenario.rd).toBeUndefined();
    expect(conseilScenario.communication).toBeUndefined();
    expect(conseilScenario.code).toBe("conseil");
  });

  it("chaque journée se vend bien au-dessus de ses frais, et la cyber rapporte plus que la transformation, qui rapporte plus que l'audit", () => {
    const gamme = toGamme(conseilGammeScenario);
    for (const p of gamme) {
      const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
      for (const s of p.market.segments) {
        expect(s.minAcceptablePrice, `${p.code}/${s.code}`).toBeGreaterThan(variable * 2);
      }
    }
    const marge = (p: (typeof gamme)[number]) =>
      Math.min(...p.market.segments.map((s) => s.refPrice)) - p.materialCostPerUnit - p.otherVariableCostPerUnit;
    expect(marge(gamme[2]!)).toBeGreaterThan(marge(gamme[1]!));
    expect(marge(gamme[1]!)).toBeGreaterThan(marge(gamme[0]!));
  });

  it("la pratique cyber est à bâtir : un coût de R&D, un lancement au plus tôt au tour 2, rien à vendre avant", () => {
    const [audit, transformation, cyber] = toGamme(conseilGammeScenario);
    expect(cyber!.development).toEqual({ cost: 30000, availableFromRound: 2 });
    expect(audit!.development).toBeUndefined();
    expect(transformation!.development).toBeUndefined();
    expect(conseilGammeScenario.rd).toBeDefined();
    const t1 = joueur(partie("balanced"))[0]!.products!["cyber"]!;
    expect(t1.produced).toBe(0);
    expect(t1.sold).toBe(0);
    expect(t1.rd?.development?.launched).toBe(false);
  });

  it("hérite des situations du cabinet, sous d'autres codes, et réécrit celles que le mix change", () => {
    expect(CONSEIL_GAMME_SITUATIONS).toHaveLength(CONSEIL_SITUATIONS.length);
    const codes = CONSEIL_GAMME_SITUATIONS.map((s) => s.code);
    expect(codes.every((c) => c.startsWith("conseilg_"))).toBe(true);
    expect(codes).not.toEqual(CONSEIL_SITUATIONS.map((s) => s.code));
    const par = (code: string) => CONSEIL_GAMME_SITUATIONS.find((s) => s.code === code)!;
    expect(par("conseilg_t1_reprise").title).toBe("Douze consultants, trois offres et un projet");
    expect(par("conseilg_t3_banc").narrative).toContain("cyber");
    expect(par("conseilg_t5_mission_rabais").title).toContain("audit");
    expect(par("conseilg_detect_idle_cash").narrative).not.toBe(
      CONSEIL_SITUATIONS.find((s) => s.code === "conseil_detect_idle_cash")!.narrative,
    );
    // La structure des situations héritées est intacte : mêmes modèles, mêmes options, mêmes indices.
    for (const [i, s] of CONSEIL_GAMME_SITUATIONS.entries()) {
      const source = CONSEIL_SITUATIONS[i]!;
      expect(s.modelRelevance).toEqual(source.modelRelevance);
      expect(s.diagnosticOptions.map((o) => [o.id, o.correct])).toEqual(source.diagnosticOptions.map((o) => [o.id, o.correct]));
      expect(s.hints.length).toBe(source.hints.length);
      expect(s.trigger).toEqual(source.trigger);
    }
  });

  it("porte le levier communication : la qualité parle aux grands comptes, le prix aux PME et dessert les grands comptes", () => {
    expect(conseilGammeScenario.communication).toBeDefined();
    const equilibre = joueur(partie("balanced"))[0]!;
    expect(equilibre.communication?.axis).toBe("qualite");
    expect(equilibre.communication!.brandBudget).toBeGreaterThan(0);
    expect(equilibre.communication!.fitBySegment["grands_comptes"]).toBeGreaterThan(1);
    const agressif = joueur(partie("price_aggressive"))[0]!;
    expect(agressif.communication?.axis).toBe("prix");
    expect(agressif.communication!.fitBySegment["pme"]).toBeGreaterThan(1);
    expect(agressif.communication!.fitBySegment["grands_comptes"]).toBeLessThan(1);
  });
});

describe("ATLAS CONSEIL · gamme — dramaturgie", () => {
  const croissance = partie("growth");

  it("l'été est le creux du cabinet : au tour 3, le marché de l'audit est au plus bas", () => {
    const potentiel = croissance.rounds.map((r) =>
      ["pme", "public"].reduce((s, code) => s + (r.market.potentialBySegment[code] ?? 0), 0),
    );
    expect(Math.min(...potentiel)).toBe(potentiel[2]);
  });

  it("l'audit fait le volume, la cyber fait la marge", () => {
    const rounds = joueur(croissance);
    const vendus = (code: string) => rounds.reduce((s, r) => s + r.products![code]!.sold, 0);
    const marge = (code: string) =>
      rounds.reduce(
        (s, r) => s + r.products![code]!.sold * (r.products![code]!.price - r.products![code]!.unitVariableCost),
        0,
      ) / vendus(code);
    expect(vendus("audit")).toBeGreaterThan(2 * vendus("cyber"));
    expect(vendus("audit")).toBeGreaterThan(vendus("transformation"));
    expect(marge("cyber")).toBeGreaterThan(marge("transformation"));
    expect(marge("transformation")).toBeGreaterThan(marge("audit"));
    expect(vendus("cyber")).toBeGreaterThan(300);
  });

  it("celui qui finance la pratique cyber dès le tour 1 la vend au tour 2 ; qui ne la bâtit pas ne la vend jamais", () => {
    const equilibre = joueur(partie("balanced"));
    expect(equilibre[0]!.incomeStatement.rdCost).toBeGreaterThanOrEqual(30000);
    expect(equilibre[1]!.products!["cyber"]!.rd?.development).toMatchObject({ launched: true, launchRound: 2 });
    expect(equilibre[1]!.products!["cyber"]!.sold).toBeGreaterThan(0);
    for (const s of ["passive", "price_aggressive"] as const) {
      for (const r of joueur(partie(s))) {
        expect(r.products!["cyber"]!.sold, s).toBe(0);
        expect(r.incomeStatement.rdCost, s).toBeUndefined();
      }
    }
  });

  it("le résultat par offre se recolle à la comptabilité du cabinet, et aucune journée ne se reporte", () => {
    for (const r of joueur(croissance)) {
      const produits = Object.values(r.products!);
      expect(produits).toHaveLength(3);
      const ca = produits.reduce((s, p) => s + p.revenue, 0);
      expect(r.incomeStatement.revenue).toBeGreaterThanOrEqual(ca - 1e-6);
      for (const p of produits) expect(p.stock.quantity).toBe(0);
      // Les trois offres se partagent les 720 jours-consultants du trimestre.
      expect(soldUnits(r)).toBeLessThanOrEqual(r.production.laborCapacity + 1e-6);
    }
  });
});

describe("ATLAS CONSEIL · gamme — calibration", () => {
  const resultats = STRATEGIES.map((s) => ({ s, cumul: cumul(partie(s)) }));
  const OVERDRAFT_LIMIT = conseilGammeScenario.finance.overdraftLimit;

  it("le secteur peut se gagner, et par plus d'une stratégie — dont l'équilibrée", () => {
    // La croissance l'emporte, l'équilibrée et le premium bâtissent la cyber et
    // s'y retrouvent, l'agressif remplit le banc en bradant, le passif vend
    // ce qu'il a toujours vendu.
    const gagnantes = resultats.filter((r) => r.cumul > 0);
    expect(
      gagnantes.length,
      resultats.map((r) => `${r.s} ${Math.round(r.cumul / 1000)} k€`).join(", "),
    ).toBeGreaterThanOrEqual(3);
    expect(resultats.find((r) => r.s === "balanced")!.cumul).toBeGreaterThan(0);
  });

  it("la passive ne gagne pas la partie, l'équilibrée qui bâtit la cyber la dépasse, et personne ne meurt avant le quatrième tour", () => {
    const passive = resultats.find((r) => r.s === "passive")!.cumul;
    expect(resultats.find((r) => r.s === "growth")!.cumul).toBeGreaterThan(passive);
    expect(resultats.find((r) => r.s === "balanced")!.cumul).toBeGreaterThan(passive);
    for (const s of STRATEGIES) {
      const run = partie(s);
      for (let round = 1; round <= 3; round++) {
        expect(joueur(run)[round - 1]!.functionalBalance.netTreasury, `${s} au tour ${round}`).toBeGreaterThan(-3 * OVERDRAFT_LIMIT);
      }
    }
  });

  it("les décisions comptent : plus de deux cent mille euros entre la meilleure et la pire", () => {
    const totals = resultats.map((r) => r.cumul);
    expect(Math.max(...totals) - Math.min(...totals)).toBeGreaterThan(200000);
  });

  it("la partie de référence ne bouge pas sans qu'on le veuille", () => {
    const fige = Object.fromEntries(
      STRATEGIES.map((s) => [
        s,
        joueur(partie(s)).map((r) => ({
          resultat: Math.round(r.incomeStatement.netIncome),
          tresorerie: Math.round(r.functionalBalance.netTreasury),
          vendu: Object.fromEntries(Object.entries(r.products!).map(([c, p]) => [c, Math.round(p.sold)])),
        })),
      ]),
    );
    expect(fige).toMatchSnapshot();
  });
});
