import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "../../src/engine/bots";
import { isMultiProduct, toGamme } from "../../src/engine/gamme";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { hotelBots, hotelScenario } from "../../src/config/scenarios/hotel";
import {
  hotelGammeBots,
  hotelGammeCompany,
  hotelGammeScenario,
} from "../../src/config/scenarios/hotel-gamme";
import { HOTEL_GAMME_SITUATIONS } from "../../src/config/scenarios/hotel-gamme/situations";
import { HOTEL_SITUATIONS } from "../../src/config/scenarios/hotel/situations";
import { tourDuPic } from "../../src/config/scenarios/rounds";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * L'ESCALE · GAMME — l'hôtel en trois chambres. L'hôtel d'origine reste le
 * scénario de l'atelier MHR et une ancre de non-régression : celui-ci est un
 * SECOND scénario, qui partage ses murs, sa finance et ses concurrents, et y
 * ajoute le mix des chambres vendues.
 *
 * Les invariants disent ce que la dramaturgie doit garder : l'été est le pic,
 * la standard fait le volume et la suite la marge, la croissance l'emporte, la
 * passive ne gagne pas la partie, et l'équilibrée reste positive. L'instantané
 * fige les chiffres de la partie de référence : toute retouche du scénario,
 * du moteur de gamme ou des bots qui les déplace doit être voulue. Et l'hôtel
 * d'origine ne bouge pas d'un bit.
 */

const SEED = 20260101;
const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function partie(strategie: BotProfile): GameRunResult {
  const companies: CompanyState[] = [
    hotelGammeCompany("player", "L'ESCALE", "bot", strategie),
    ...hotelGammeBots.slice(0, 2).map((b) => hotelGammeCompany(b.id, b.name, "bot", b.profile)),
  ];
  return runGame({
    scenario: hotelGammeScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: hotelGammeScenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
            lastSoldByProduct: ctx.lastResult
              ? soldByProduct(hotelGammeScenario, ctx.lastResult.market.bySegment)
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

describe("L'ESCALE · gamme — la gamme", () => {
  it("est une gamme de trois chambres, chacune avec sa clientèle, dans le même bâtiment", () => {
    expect(isMultiProduct(hotelGammeScenario)).toBe(true);
    const gamme = toGamme(hotelGammeScenario);
    expect(gamme.map((p) => p.code)).toEqual(["chambre-standard", "chambre-superieure", "suite"]);
    // Le marché du scénario est celui de la chambre standard : c'est lui que
    // lisent les affichages mono-produit et le prix de référence des bots.
    expect(hotelGammeScenario.market.segments).toEqual(gamme[0]!.market.segments);
    expect(hotelGammeScenario.product.materialCostPerUnit).toBe(gamme[0]!.materialCostPerUnit);
    const segments = gamme.flatMap((p) => p.market.segments.map((s) => s.code));
    expect(new Set(segments).size).toBe(segments.length);
    // Rien ne se stocke, pour aucune chambre.
    expect(hotelGammeScenario.perishable).toBe(true);
  });

  it("la chambre standard est la nuitée de l'hôtel d'origine : mêmes coûts, mêmes murs, mêmes concurrents", () => {
    const standard = toGamme(hotelGammeScenario)[0]!;
    expect(standard.materialCostPerUnit).toBe(hotelScenario.product.materialCostPerUnit);
    expect(standard.otherVariableCostPerUnit).toBe(hotelScenario.product.otherVariableCostPerUnit);
    expect(standard.hoursPerUnit).toBe(hotelScenario.product.hoursPerUnit);
    const segment = (code: string) => hotelScenario.market.segments.find((s) => s.code === code)!;
    const loisirs = standard.market.segments.find((s) => s.code === "loisirs")!;
    // La gamme lève la porte marketing des loisirs (le marketing s'y répartit
    // entre les références) : c'est la seule différence voulue avec l'hôtel.
    expect({ ...loisirs, size: 0 }).toEqual({ ...segment("loisirs"), size: 0, marketingGate: undefined });
    expect(loisirs.marketingGate).toBeUndefined();
    expect(segment("loisirs").marketingGate).toBe(0.6);
    // La clientèle affaires prend la supérieure, aux mêmes ressorts, un plafond plus haut.
    const affaires = toGamme(hotelGammeScenario)[1]!.market.segments.find((s) => s.code === "affaires")!;
    expect(affaires.priceElasticity).toBe(segment("affaires").priceElasticity);
    expect(affaires.refPrice).toBeGreaterThan(segment("affaires").refPrice);
    expect(hotelGammeScenario.fixedCostsPerRound).toBe(hotelScenario.fixedCostsPerRound);
    expect(hotelGammeScenario.finance).toEqual(hotelScenario.finance);
    expect(hotelGammeScenario.equipment).toEqual(hotelScenario.equipment);
    expect(hotelGammeScenario.suppliers).toEqual(hotelScenario.suppliers);
    expect(hotelGammeBots).toBe(hotelBots);
    const c = hotelGammeCompany("t", "T", "human");
    expect(c.machineCapacity).toBe(5400);
    expect(c.finance.equity).toBe(660000);
    expect(Object.keys(c.finishedGoodsByProduct!)).toEqual(["chambre-standard", "chambre-superieure", "suite"]);
  });

  it("l'hôtel d'origine reste mono-produit, sans levier communication", () => {
    expect(isMultiProduct(hotelScenario)).toBe(false);
    expect(hotelScenario.products).toBeUndefined();
    expect(hotelScenario.communication).toBeUndefined();
    expect(hotelScenario.code).toBe("hotel");
  });

  it("chaque chambre se vend bien au-dessus de son coût variable, et la suite rapporte plus du double de la standard", () => {
    const gamme = toGamme(hotelGammeScenario);
    for (const p of gamme) {
      const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
      for (const s of p.market.segments) {
        expect(s.refPrice, `${p.code}/${s.code}`).toBeGreaterThan(variable * 2);
      }
    }
    const marge = (p: (typeof gamme)[number]) =>
      Math.min(...p.market.segments.map((s) => s.refPrice)) - p.materialCostPerUnit - p.otherVariableCostPerUnit;
    expect(marge(gamme[2]!)).toBeGreaterThan(2 * marge(gamme[0]!));
    expect(marge(gamme[1]!)).toBeGreaterThan(marge(gamme[0]!));
  });

  it("hérite des situations de l'hôtel, sous d'autres codes, et réécrit celles que le mix change", () => {
    expect(HOTEL_GAMME_SITUATIONS).toHaveLength(HOTEL_SITUATIONS.length);
    const codes = HOTEL_GAMME_SITUATIONS.map((s) => s.code);
    expect(codes.every((c) => c.startsWith("hotelg_"))).toBe(true);
    expect(codes).not.toEqual(HOTEL_SITUATIONS.map((s) => s.code));
    const par = (code: string) => HOTEL_GAMME_SITUATIONS.find((s) => s.code === code)!;
    expect(par("hotelg_t1_reprise").title).toBe("Soixante chambres, trois prix");
    expect(par("hotelg_t2_yield").narrative).toContain("suites");
    expect(par("hotelg_t6_ecarts").diagnosticOptions[0]!.label).toContain("mix");
    // La structure des situations héritées est intacte : mêmes modèles, mêmes options, mêmes indices.
    for (const [i, s] of HOTEL_GAMME_SITUATIONS.entries()) {
      const source = HOTEL_SITUATIONS[i]!;
      expect(s.modelRelevance).toEqual(source.modelRelevance);
      expect(s.diagnosticOptions.map((o) => [o.id, o.correct])).toEqual(source.diagnosticOptions.map((o) => [o.id, o.correct]));
      expect(s.hints.length).toBe(source.hints.length);
      expect(s.trigger).toEqual(source.trigger);
    }
  });

  it("porte le levier communication : l'image parle aux habitués d'affaires, le prix aux vacanciers", () => {
    expect(hotelGammeScenario.communication).toBeDefined();
    const croissance = joueur(partie("growth"))[0]!;
    expect(croissance.communication?.axis).toBe("image");
    expect(croissance.communication!.fitBySegment["affaires"]).toBeGreaterThan(1);
    expect(croissance.communication!.fitBySegment["direction"]).toBeGreaterThan(1);
    const agressif = joueur(partie("price_aggressive"))[0]!;
    expect(agressif.communication?.axis).toBe("prix");
    expect(agressif.communication!.fitBySegment["loisirs"]).toBeGreaterThan(1);
    expect(agressif.communication!.fitBySegment["affaires"]).toBeLessThan(1);
  });
});

describe("L'ESCALE · gamme — dramaturgie", () => {
  const croissance = partie("growth");

  it("l'été est le pic du secteur, et il tombe dans une partie de quatre tours", () => {
    expect(tourDuPic(hotelGammeScenario)).toBe(3);
  });

  it("la standard fait le volume, la suite fait la marge", () => {
    const rounds = joueur(croissance);
    const vendus = (code: string) => rounds.reduce((s, r) => s + r.products![code]!.sold, 0);
    const marge = (code: string) =>
      rounds.reduce(
        (s, r) => s + r.products![code]!.sold * (r.products![code]!.price - r.products![code]!.unitVariableCost),
        0,
      );
    expect(vendus("chambre-standard")).toBeGreaterThan(3 * vendus("suite"));
    expect(marge("suite") / vendus("suite")).toBeGreaterThan(2 * (marge("chambre-standard") / vendus("chambre-standard")));
    expect(vendus("suite")).toBeGreaterThan(500);
  });

  it("le résultat par chambre se recolle à la comptabilité de l'hôtel, et rien ne se reporte", () => {
    for (const r of joueur(croissance)) {
      const produits = Object.values(r.products!);
      expect(produits).toHaveLength(3);
      const ca = produits.reduce((s, p) => s + p.revenue, 0);
      expect(r.incomeStatement.revenue).toBeGreaterThanOrEqual(ca - 1e-6);
      for (const p of produits) expect(p.stock.quantity).toBe(0);
    }
  });
});

describe("L'ESCALE · gamme — calibration", () => {
  const resultats = STRATEGIES.map((s) => ({ s, cumul: cumul(partie(s)) }));
  const OVERDRAFT_LIMIT = hotelGammeScenario.finance.overdraftLimit;

  it("le secteur peut se gagner, et par plus d'une stratégie — dont l'équilibrée", () => {
    // Comme dans l'hôtel d'origine : la croissance l'emporte, l'agressif et le
    // passif encaissent, l'équilibrée reste positive, le premium qui vend la
    // standard à 114 € vide son hôtel.
    const gagnantes = resultats.filter((r) => r.cumul > 0);
    expect(
      gagnantes.length,
      resultats.map((r) => `${r.s} ${Math.round(r.cumul / 1000)} k€`).join(", "),
    ).toBeGreaterThanOrEqual(3);
    expect(resultats.find((r) => r.s === "balanced")!.cumul).toBeGreaterThan(0);
  });

  it("la passive ne gagne pas la partie, et personne ne meurt avant le quatrième tour", () => {
    const passive = resultats.find((r) => r.s === "passive")!.cumul;
    expect(resultats.find((r) => r.s === "growth")!.cumul).toBeGreaterThan(passive);
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
