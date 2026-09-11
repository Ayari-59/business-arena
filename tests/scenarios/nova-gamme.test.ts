import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "../../src/engine/bots";
import { isMultiProduct, toGamme } from "../../src/engine/gamme";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { novaScenario } from "../../src/config/scenarios/nova";
import {
  novaGammeBots,
  novaGammeCompany,
  novaGammeScenario,
} from "../../src/config/scenarios/nova-gamme";
import { tourDuPic } from "../../src/config/scenarios/rounds";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * NOVA · GAMME — le fabricant d'enceintes en trois références. Le NOVA
 * d'origine reste le scénario des ateliers STMG et l'ancre de non-régression
 * du moteur : celui-ci est un SECOND scénario, qui partage son atelier, sa
 * finance et ses concurrents, et y ajoute le mix.
 *
 * Ce fichier tient deux rôles. Les invariants de calibration disent ce que la
 * dramaturgie doit garder : le pic est au tour 4 et la demande y dépasse
 * l'atelier (le facteur rare), le Go fait le volume et le Studio la marge, la
 * stratégie passive est punie, et plusieurs stratégies restent gagnantes.
 * L'instantané doré fige les chiffres de la partie de référence : toute
 * retouche du scénario, du moteur de gamme ou des bots qui les déplace doit
 * être voulue. Et le NOVA d'origine, lui, ne bouge pas d'un bit.
 */

const SEED = 20260101;
const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function partie(strategie: BotProfile): GameRunResult {
  const companies: CompanyState[] = [
    novaGammeCompany("player", "NOVA", "bot", strategie),
    ...novaGammeBots.slice(0, 2).map((b) => novaGammeCompany(b.id, b.name, "bot", b.profile)),
  ];
  return runGame({
    scenario: novaGammeScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: novaGammeScenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
            lastSoldByProduct: ctx.lastResult
              ? soldByProduct(novaGammeScenario, ctx.lastResult.market.bySegment)
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

describe("NOVA · gamme — la gamme", () => {
  it("est une gamme de trois références, chacune avec son marché", () => {
    expect(isMultiProduct(novaGammeScenario)).toBe(true);
    const gamme = toGamme(novaGammeScenario);
    expect(gamme.map((p) => p.code)).toEqual(["nova-go", "nova-one", "nova-studio"]);
    // Le marché du scénario est celui du cœur de gamme : c'est lui que lisent
    // les affichages mono-produit et le prix de référence des bots.
    expect(novaGammeScenario.market.segments).toEqual(gamme[1]!.market.segments);
    expect(novaGammeScenario.product.materialCostPerUnit).toBe(gamme[1]!.materialCostPerUnit);
    // Les codes de segments sont uniques sur toute la gamme.
    const segments = gamme.flatMap((p) => p.market.segments.map((s) => s.code));
    expect(new Set(segments).size).toBe(segments.length);
  });

  it("le NOVA One est le NOVA d'origine : mêmes coûts, mêmes ressorts, même CampusTech", () => {
    const one = toGamme(novaGammeScenario)[1]!;
    expect(one.materialCostPerUnit).toBe(novaScenario.product.materialCostPerUnit);
    expect(one.otherVariableCostPerUnit).toBe(novaScenario.product.otherVariableCostPerUnit);
    expect(one.hoursPerUnit).toBe(novaScenario.product.hoursPerUnit);
    const segment = (code: string) => novaScenario.market.segments.find((s) => s.code === code)!;
    expect(one.market.segments.find((s) => s.code === "etudiants")).toEqual(segment("etudiants"));
    expect(one.market.segments.find((s) => s.code === "campustech")).toEqual(segment("campustech"));
    // La moitié des passionnés du NOVA d'origine achètent un One, aux mêmes
    // ressorts ; l'autre moitié, les audiophiles, n'achète que la Studio.
    const passionnes = one.market.segments.find((s) => s.code === "passionnes")!;
    expect({ ...passionnes, size: 0 }).toEqual({ ...segment("passionnes"), size: 0 });
    expect(passionnes.size).toBeLessThan(segment("passionnes").size);
    expect(toGamme(novaGammeScenario)[2]!.market.segments.map((s) => s.code)).toContain("audiophiles");
    // Même atelier, même finance, mêmes concurrents.
    expect(novaGammeScenario.fixedCostsPerRound).toBe(novaScenario.fixedCostsPerRound);
    expect(novaGammeScenario.finance).toEqual(novaScenario.finance);
    expect(novaGammeScenario.equipment).toEqual(novaScenario.equipment);
    expect(novaGammeBots.map((b) => b.id)).toEqual(["soundbox", "auris", "vertex", "kubo", "practico", "onda", "lumen"]);
  });

  it("le NOVA d'origine reste mono-produit", () => {
    expect(isMultiProduct(novaScenario)).toBe(false);
    expect(novaScenario.products).toBeUndefined();
    expect(novaScenario.code).toBe("nova");
  });

  it("chaque référence vend plus cher que son coût variable, au prix de référence de chacun de ses segments", () => {
    for (const p of toGamme(novaGammeScenario)) {
      const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
      for (const s of p.market.segments) {
        expect(s.refPrice, `${p.code}/${s.code}`).toBeGreaterThan(variable * 1.3);
      }
    }
  });

  it("chaque référence a ses composants : pas d'import low-cost sur le Studio, pas d'acousticien sur le Go", () => {
    const codes = Object.fromEntries(
      toGamme(novaGammeScenario).map((p) => [p.code, p.suppliers!.map((s) => s.code)]),
    );
    expect(codes["nova-go"]).toEqual(["standard", "lowcost"]);
    expect(codes["nova-one"]).toEqual(["standard", "lowcost", "premium"]);
    expect(codes["nova-studio"]).toEqual(["standard", "premium", "acoustika"]);
    // Le premier de chaque catalogue est le fournisseur de référence (coût ×1),
    // et le catalogue du scénario est celui du One (affichages mono-produit).
    for (const p of toGamme(novaGammeScenario)) {
      expect(p.suppliers![0]!.costMultiplier, p.code).toBe(1);
      expect(p.suppliers![0]!.qualityBonus, p.code).toBe(0);
    }
    expect(novaGammeScenario.suppliers!.map((s) => s.code)).toEqual(codes["nova-one"]);
    // …aux mêmes conditions que dans le NOVA d'origine (seuls les récits changent).
    const conditions = (l: { code: string; costMultiplier: number; qualityBonus: number; paymentDelayDays: number }[]) =>
      l.map((s) => [s.code, s.costMultiplier, s.qualityBonus, s.paymentDelayDays]);
    expect(conditions(novaGammeScenario.suppliers!)).toEqual(conditions(novaScenario.suppliers!));
    // L'import du Go n'est pas celui du One : même code, autre offre (−20 % contre −15 %).
    const asiaOne = toGamme(novaGammeScenario)[1]!.suppliers!.find((s) => s.code === "lowcost")!;
    const asiaGo = toGamme(novaGammeScenario)[0]!.suppliers!.find((s) => s.code === "lowcost")!;
    expect(asiaGo.costMultiplier).toBeLessThan(asiaOne.costMultiplier);
    // Chez chaque fournisseur, chaque référence reste vendable au-dessus de son coût.
    for (const p of toGamme(novaGammeScenario)) {
      for (const s of p.suppliers!) {
        const variable = p.materialCostPerUnit * s.costMultiplier + p.otherVariableCostPerUnit;
        const prixMin = Math.min(...p.market.segments.map((seg) => seg.refPrice));
        expect(prixMin, `${p.code} chez ${s.code}`).toBeGreaterThan(variable * 1.2);
      }
    }
  });

  it("la Studio est à développer : un coût de R&D, un lancement au plus tôt au tour 2, rien à vendre avant", () => {
    const studio = toGamme(novaGammeScenario)[2]!;
    expect(studio.development).toEqual({ cost: 25000, availableFromRound: 2 });
    expect(toGamme(novaGammeScenario)[0]!.development).toBeUndefined();
    expect(toGamme(novaGammeScenario)[1]!.development).toBeUndefined();
    expect(novaGammeScenario.rd).toBeDefined();
    // Le NOVA d'origine, lui, n'a pas de levier R&D.
    expect(novaScenario.rd).toBeUndefined();
    const t1 = joueur(partie("balanced"))[0]!.products!["nova-studio"]!;
    expect(t1.produced).toBe(0);
    expect(t1.sold).toBe(0);
    expect(t1.rd?.development?.launched).toBe(false);
  });

  it("porte le levier communication : marque et axe, que les bots tiennent selon leur profil", () => {
    expect(novaGammeScenario.communication).toBeDefined();
    expect(novaScenario.communication).toBeUndefined();
    const t1 = joueur(partie("balanced"))[0]!;
    expect(t1.communication?.axis).toBe("qualite");
    expect(t1.communication!.brandBudget).toBeGreaterThan(0);
    // L'axe qualité porte auprès des audiophiles et dessert auprès des lycéens.
    expect(t1.communication!.fitBySegment["passionnes"]).toBeGreaterThan(1);
    expect(t1.communication!.fitBySegment["lyceens"]).toBeLessThan(1);
    const agressif = joueur(partie("price_aggressive"))[0]!;
    expect(agressif.communication?.axis).toBe("prix");
    expect(agressif.communication!.fitBySegment["lyceens"]).toBeGreaterThan(1);
  });

  it("ouvre sans stock, sur aucune référence, avec le bilan du NOVA d'origine", () => {
    const c = novaGammeCompany("t", "T", "human");
    expect(c.finishedGoods.quantity).toBe(0);
    expect(Object.keys(c.finishedGoodsByProduct!)).toEqual(["nova-go", "nova-one", "nova-studio"]);
    for (const lot of Object.values(c.finishedGoodsByProduct!)) expect(lot.quantity).toBe(0);
    expect(c.machineCapacity).toBe(7000);
    expect(c.finance.equity).toBe(150000);
  });
});

describe("NOVA · gamme — dramaturgie", () => {
  const balanced = partie("balanced");

  it("Noël est le pic du secteur, et il tombe dans une partie de quatre tours", () => {
    expect(tourDuPic(novaGammeScenario)).toBe(4);
  });

  it("au tour 4, la demande dépasse l'atelier : le facteur rare joue", () => {
    const t4 = joueur(balanced)[3]!;
    const demande = Object.values(t4.market.bySegment).reduce((s, x) => s + x.demandForCompany, 0);
    expect(demande).toBeGreaterThan(t4.production.machineCapacity);
    const perdu = Object.values(t4.market.bySegment).reduce((s, x) => s + x.lost, 0);
    expect(perdu).toBeGreaterThan(1000);
  });

  it("celui qui finance la Studio dès le tour 1 la vend au tour 2 ; qui ne la développe pas ne la vend jamais", () => {
    const equilibre = joueur(balanced);
    expect(equilibre[0]!.incomeStatement.rdCost).toBeGreaterThanOrEqual(25000);
    expect(equilibre[1]!.products!["nova-studio"]!.rd?.development).toMatchObject({ launched: true, launchRound: 2 });
    expect(equilibre[1]!.products!["nova-studio"]!.sold).toBeGreaterThan(0);
    const passif = joueur(partie("passive"));
    for (const r of passif) {
      expect(r.products!["nova-studio"]!.sold).toBe(0);
      expect(r.incomeStatement.rdCost).toBeUndefined();
    }
  });

  it("CampusTech n'existe pas avant le tour 3, la hausse matières frappe le tour 5", () => {
    expect(balanced.rounds[0]!.market.potentialBySegment["campustech"]).toBe(0);
    expect(balanced.rounds[2]!.market.potentialBySegment["campustech"]).toBeGreaterThan(0);
    expect(balanced.rounds[4]!.newEvents.map((e) => e.code)).toContain("raw_material_spike");
  });

  it("le Go fait le volume, le Studio fait la marge", () => {
    const rounds = joueur(balanced);
    const vendus = (code: string) => rounds.reduce((s, r) => s + r.products![code]!.sold, 0);
    const marge = (code: string) =>
      rounds.reduce(
        (s, r) => s + r.products![code]!.sold * (r.products![code]!.price - r.products![code]!.unitVariableCost),
        0,
      );
    expect(vendus("nova-go")).toBeGreaterThan(vendus("nova-studio"));
    expect(marge("nova-studio") / vendus("nova-studio")).toBeGreaterThan(
      3 * (marge("nova-go") / vendus("nova-go")),
    );
  });

  it("le résultat par produit se recolle à la comptabilité de l'entreprise", () => {
    for (const r of joueur(balanced)) {
      const produits = Object.values(r.products!);
      expect(produits).toHaveLength(3);
      const ca = produits.reduce((s, p) => s + p.revenue, 0);
      expect(r.incomeStatement.revenue).toBeGreaterThanOrEqual(ca - 1e-6);
      const produit = produits.reduce((s, p) => s + p.produced, 0);
      expect(r.production.produced).toBeCloseTo(produit, 6);
    }
  });
});

describe("NOVA · gamme — calibration", () => {
  const resultats = STRATEGIES.map((s) => ({ s, cumul: cumul(partie(s)) }));
  const OVERDRAFT_LIMIT = novaGammeScenario.finance.overdraftLimit;

  it("le secteur peut se gagner, et par plus d'une stratégie — dont l'équilibrée", () => {
    // Même profil que le NOVA d'origine : premium et équilibrée gagnent, la
    // croissance à prix bas s'y perd, le passif et l'agressif y laissent
    // des plumes. La Studio récompense qui la développe.
    const gagnantes = resultats.filter((r) => r.cumul > 0);
    expect(
      gagnantes.length,
      resultats.map((r) => `${r.s} ${Math.round(r.cumul / 1000)} k€`).join(", "),
    ).toBeGreaterThanOrEqual(2);
    expect(resultats.find((r) => r.s === "balanced")!.cumul).toBeGreaterThan(0);
  });

  it("la stratégie passive est punie, sans mort précoce", () => {
    expect(resultats.find((r) => r.s === "passive")!.cumul).toBeLessThan(0);
    const run = partie("passive");
    for (let round = 1; round <= 3; round++) {
      expect(joueur(run)[round - 1]!.functionalBalance.netTreasury).toBeGreaterThan(-OVERDRAFT_LIMIT - 1);
    }
  });

  it("les décisions comptent : plus de cent mille euros entre la meilleure et la pire", () => {
    const totals = resultats.map((r) => r.cumul);
    expect(Math.max(...totals) - Math.min(...totals)).toBeGreaterThan(100000);
  });

  it("aucune stratégie ne coûte plus que l'entreprise ne valait", () => {
    const depart = novaGammeCompany("m", "m", "bot").finance.equity;
    for (const s of STRATEGIES) {
      const dernier = partie(s).finalCompanies.find((c) => c.id === "player")!;
      expect(dernier.finance.equity, s).toBeGreaterThan(-depart);
    }
  });
});

describe("NOVA · gamme — instantané doré", () => {
  it("la partie de référence (équilibrée contre SoundBox et Auris) est figée", () => {
    const run = partie("balanced");
    const resume = joueur(run).map((r, i) => ({
      tour: i + 1,
      ca: Math.round(r.incomeStatement.revenue),
      resultat: Math.round(r.incomeStatement.netIncome),
      tresorerie: Math.round(r.functionalBalance.netTreasury),
      bfr: Math.round(r.functionalBalance.bfr),
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
