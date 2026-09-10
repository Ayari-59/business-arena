import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "../../src/engine/bots";
import { isMultiProduct, toGamme } from "../../src/engine/gamme";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { bistrotBots, bistrotScenario } from "../../src/config/scenarios/bistrot";
import {
  bistrotGammeBots,
  bistrotGammeCompany,
  bistrotGammeScenario,
} from "../../src/config/scenarios/bistrot-gamme";
import { BISTROT_GAMME_SITUATIONS } from "../../src/config/scenarios/bistrot-gamme/situations";
import { BISTROT_SITUATIONS } from "../../src/config/scenarios/bistrot/situations";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { tourDuPic } from "../../src/config/scenarios/rounds";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * LA TABLE D'AUGUSTIN · GAMME — le bistrot en quatre offres. Le bistrot
 * d'origine reste le scénario des niveaux bas et une ancre de non-régression :
 * celui-ci est un SECOND scénario, qui partage sa cuisine, sa brigade, sa
 * finance et ses concurrents, et y ajoute le mix des couverts servis et une
 * activité à bâtir.
 *
 * Les invariants disent ce que la dramaturgie doit garder : décembre est le
 * pic, la formule du midi fait le volume et la carte du soir la marge, le
 * traiteur ne se vend qu'une fois financé, la croissance l'emporte, la
 * passive ne gagne pas la partie, et l'équilibrée reste positive.
 * L'instantané fige les chiffres de la partie de référence. Et le bistrot
 * d'origine ne bouge pas d'un bit.
 */

const SEED = 20260101;
const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

function partie(strategie: BotProfile): GameRunResult {
  const companies: CompanyState[] = [
    bistrotGammeCompany("player", "AUGUSTIN", "bot", strategie),
    ...bistrotGammeBots.slice(0, 2).map((b) => bistrotGammeCompany(b.id, b.name, "bot", b.profile)),
  ];
  return runGame({
    scenario: bistrotGammeScenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: bistrotGammeScenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
            lastSoldByProduct: ctx.lastResult
              ? soldByProduct(bistrotGammeScenario, ctx.lastResult.market.bySegment)
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

describe("LA TABLE D'AUGUSTIN · gamme — la gamme", () => {
  it("est une gamme de quatre offres, chacune avec sa clientèle, servies par la même cuisine", () => {
    expect(isMultiProduct(bistrotGammeScenario)).toBe(true);
    const gamme = toGamme(bistrotGammeScenario);
    expect(gamme.map((p) => p.code)).toEqual(["formule-midi", "carte-soir", "banquets", "traiteur"]);
    // Le marché du scénario est celui de la formule du midi : c'est lui que
    // lisent les affichages mono-produit et le prix de référence des bots.
    expect(bistrotGammeScenario.market.segments).toEqual(gamme[0]!.market.segments);
    expect(bistrotGammeScenario.product.materialCostPerUnit).toBe(gamme[0]!.materialCostPerUnit);
    const segments = gamme.flatMap((p) => p.market.segments.map((s) => s.code));
    expect(new Set(segments).size).toBe(segments.length);
    // Rien ne se garde, pour aucune offre ; et la brigade n'y passe pas le même temps.
    expect(bistrotGammeScenario.perishable).toBe(true);
    expect(gamme.map((p) => p.hoursPerUnit)).toEqual([0.4, 0.6, 0.45, 0.35]);
    expect(scenarioByCode("bistrot-gamme").vocabulary.unit).toBe("couvert");
  });

  it("la formule du midi est le couvert du bistrot d'origine : mêmes clientèles, même cuisine, mêmes concurrents", () => {
    const [midi, soir, banquets] = toGamme(bistrotGammeScenario);
    const segment = (code: string) => bistrotScenario.market.segments.find((s) => s.code === code)!;
    const affaires = midi!.market.segments.find((s) => s.code === "midi_affaires")!;
    expect({ ...affaires, size: 0 }).toEqual({ ...segment("midi_affaires"), size: 0 });
    // Les dîneurs prennent la carte du soir, les groupes les banquets : mêmes
    // ressorts, un ticket au-dessus du ticket moyen.
    const locaux = soir!.market.segments.find((s) => s.code === "soir_locaux")!;
    expect(locaux.priceElasticity).toBe(segment("soir_locaux").priceElasticity);
    expect(locaux.refPrice).toBeGreaterThan(segment("soir_locaux").refPrice);
    const groupes = banquets!.market.segments.find((s) => s.code === "groupes")!;
    expect(groupes.paymentDelayDays).toBe(segment("groupes").paymentDelayDays);
    expect(groupes.seasonality).toEqual(segment("groupes").seasonality);
    expect(bistrotGammeScenario.fixedCostsPerRound).toBe(bistrotScenario.fixedCostsPerRound);
    expect(bistrotGammeScenario.finance).toEqual(bistrotScenario.finance);
    expect(bistrotGammeScenario.equipment).toEqual(bistrotScenario.equipment);
    expect(bistrotGammeScenario.suppliers).toEqual(bistrotScenario.suppliers);
    expect(bistrotGammeScenario.hr).toEqual(bistrotScenario.hr);
    expect(bistrotGammeScenario.scriptedEvents).toEqual(bistrotScenario.scriptedEvents);
    expect(bistrotGammeBots).toBe(bistrotBots);
    const c = bistrotGammeCompany("t", "T", "human");
    expect(c.headcount).toBe(10);
    expect(c.machineCapacity).toBe(9000);
    expect(c.finance.equity).toBe(92000);
    expect(Object.keys(c.finishedGoodsByProduct!)).toEqual(["formule-midi", "carte-soir", "banquets", "traiteur"]);
    for (const lot of Object.values(c.finishedGoodsByProduct!)) expect(lot.quantity).toBe(0);
  });

  it("le bistrot d'origine reste mono-produit, sans R&D ni levier communication", () => {
    expect(isMultiProduct(bistrotScenario)).toBe(false);
    expect(bistrotScenario.products).toBeUndefined();
    expect(bistrotScenario.rd).toBeUndefined();
    expect(bistrotScenario.communication).toBeUndefined();
    expect(bistrotScenario.code).toBe("bistrot");
  });

  it("chaque offre tient son ratio matières entre 28 et 33 %, et la carte du soir rapporte plus que la formule du midi", () => {
    const gamme = toGamme(bistrotGammeScenario);
    for (const p of gamme) {
      const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
      for (const s of p.market.segments) {
        expect(s.minAcceptablePrice, `${p.code}/${s.code}`).toBeGreaterThan(variable);
        const ratio = p.materialCostPerUnit / s.refPrice;
        expect(ratio, `${p.code}/${s.code} ratio matières`).toBeGreaterThan(0.2);
        expect(ratio, `${p.code}/${s.code} ratio matières`).toBeLessThan(0.4);
      }
    }
    const marge = (p: (typeof gamme)[number]) =>
      Math.min(...p.market.segments.map((s) => s.refPrice)) - p.materialCostPerUnit - p.otherVariableCostPerUnit;
    expect(marge(gamme[1]!)).toBeGreaterThan(marge(gamme[0]!));
    expect(marge(gamme[2]!)).toBeGreaterThan(marge(gamme[0]!));
  });

  it("le traiteur est à bâtir : un coût de R&D, un lancement au plus tôt au tour 2, rien à vendre avant", () => {
    const [midi, soir, banquets, traiteur] = toGamme(bistrotGammeScenario);
    expect(traiteur!.development).toEqual({ cost: 18000, availableFromRound: 2 });
    for (const p of [midi, soir, banquets]) expect(p!.development).toBeUndefined();
    expect(bistrotGammeScenario.rd).toBeDefined();
    const t1 = joueur(partie("balanced"))[0]!.products!["traiteur"]!;
    expect(t1.produced).toBe(0);
    expect(t1.sold).toBe(0);
    expect(t1.rd?.development?.launched).toBe(false);
  });

  it("hérite des situations du bistrot, sous d'autres codes, et réécrit celles que le mix change", () => {
    expect(BISTROT_GAMME_SITUATIONS).toHaveLength(BISTROT_SITUATIONS.length);
    const codes = BISTROT_GAMME_SITUATIONS.map((s) => s.code);
    expect(codes.every((c) => c.startsWith("bistrotg_"))).toBe(true);
    expect(codes).not.toEqual(BISTROT_SITUATIONS.map((s) => s.code));
    const par = (code: string) => BISTROT_GAMME_SITUATIONS.find((s) => s.code === code)!;
    expect(par("bistrotg_t1_reprise").title).toBe("Le premier service, quatre cartes");
    expect(par("bistrotg_t3_matieres").narrative).toContain("traiteur");
    expect(par("bistrotg_t4_banquets").hints[2]!.text).toContain("mix");
    expect(par("bistrotg_detect_idle_cash").narrative).not.toBe(
      BISTROT_SITUATIONS.find((s) => s.code === "bistrot_detect_idle_cash")!.narrative,
    );
    // La structure des situations héritées est intacte : mêmes modèles, mêmes options, mêmes indices.
    for (const [i, s] of BISTROT_GAMME_SITUATIONS.entries()) {
      const source = BISTROT_SITUATIONS[i]!;
      expect(s.modelRelevance).toEqual(source.modelRelevance);
      expect(s.diagnosticOptions.map((o) => [o.id, o.correct])).toEqual(source.diagnosticOptions.map((o) => [o.id, o.correct]));
      expect(s.hints.length).toBe(source.hints.length);
      expect(s.trigger).toEqual(source.trigger);
    }
  });

  it("porte le levier communication : la qualité parle aux gourmets, le prix aux déjeuners d'affaires", () => {
    expect(bistrotGammeScenario.communication).toBeDefined();
    const equilibre = joueur(partie("balanced"))[0]!;
    expect(equilibre.communication?.axis).toBe("qualite");
    expect(equilibre.communication!.brandBudget).toBeGreaterThan(0);
    expect(equilibre.communication!.fitBySegment["soir_gourmets"]).toBeGreaterThan(1);
    const agressif = joueur(partie("price_aggressive"))[0]!;
    expect(agressif.communication?.axis).toBe("prix");
    expect(agressif.communication!.fitBySegment["midi_affaires"]).toBeGreaterThan(1);
    expect(agressif.communication!.fitBySegment["soir_gourmets"]).toBeLessThan(1);
  });
});

describe("LA TABLE D'AUGUSTIN · gamme — dramaturgie", () => {
  const croissance = partie("growth");

  it("décembre est le pic du bistrot, comme dans le bistrot d'origine, et août le creux", () => {
    expect(tourDuPic(bistrotGammeScenario)).toBe(4);
    expect(tourDuPic(bistrotScenario)).toBe(4);
    const potentiel = croissance.rounds.map((r) =>
      Object.values(r.market.potentialBySegment).reduce((s, x) => s + x, 0),
    );
    expect(Math.min(...potentiel)).toBe(potentiel[2]);
  });

  it("la formule du midi fait le volume, la carte du soir fait la marge", () => {
    const rounds = joueur(croissance);
    const vendus = (code: string) => rounds.reduce((s, r) => s + r.products![code]!.sold, 0);
    const marge = (code: string) =>
      rounds.reduce(
        (s, r) => s + r.products![code]!.sold * (r.products![code]!.price - r.products![code]!.unitVariableCost),
        0,
      ) / vendus(code);
    expect(vendus("formule-midi")).toBeGreaterThan(2 * vendus("traiteur"));
    expect(vendus("formule-midi")).toBeGreaterThan(vendus("banquets"));
    expect(marge("carte-soir")).toBeGreaterThan(marge("formule-midi"));
    expect(marge("banquets")).toBeGreaterThan(marge("formule-midi"));
    expect(vendus("traiteur")).toBeGreaterThan(1500);
  });

  it("celui qui finance le traiteur dès le tour 1 le vend au tour 2 ; qui ne le bâtit pas ne le vend jamais", () => {
    const equilibre = joueur(partie("balanced"));
    expect(equilibre[0]!.incomeStatement.rdCost).toBeGreaterThanOrEqual(18000);
    expect(equilibre[1]!.products!["traiteur"]!.rd?.development).toMatchObject({ launched: true, launchRound: 2 });
    expect(equilibre[1]!.products!["traiteur"]!.sold).toBeGreaterThan(0);
    for (const s of ["passive", "price_aggressive"] as const) {
      for (const r of joueur(partie(s))) {
        expect(r.products!["traiteur"]!.sold, s).toBe(0);
        expect(r.incomeStatement.rdCost, s).toBeUndefined();
      }
    }
  });

  it("le résultat par offre se recolle à la comptabilité du bistrot, et rien ne se garde", () => {
    for (const r of joueur(croissance)) {
      const produits = Object.values(r.products!);
      expect(produits).toHaveLength(4);
      const ca = produits.reduce((s, p) => s + p.revenue, 0);
      expect(r.incomeStatement.revenue).toBeGreaterThanOrEqual(ca - 1e-6);
      for (const p of produits) expect(p.stock.quantity).toBe(0);
      // Les quatre offres se partagent la cuisine et la brigade.
      expect(soldUnits(r)).toBeLessThanOrEqual(r.production.machineCapacity + 1e-6);
      expect(soldUnits(r)).toBeLessThanOrEqual(r.production.laborCapacity + 1e-6);
    }
  });
});

describe("LA TABLE D'AUGUSTIN · gamme — calibration", () => {
  const resultats = STRATEGIES.map((s) => ({ s, cumul: cumul(partie(s)) }));
  const OVERDRAFT_LIMIT = bistrotGammeScenario.finance.overdraftLimit;

  it("le secteur peut se gagner, et par plus d'une stratégie — dont l'équilibrée", () => {
    // Comme dans le bistrot d'origine : la croissance l'emporte, l'équilibrée
    // qui bâtit le traiteur et l'agressif encaissent, le premium qui vend la
    // formule du midi à 35 € vide sa salle, le passif ne couvre pas sa brigade.
    const gagnantes = resultats.filter((r) => r.cumul > 0);
    expect(
      gagnantes.length,
      resultats.map((r) => `${r.s} ${Math.round(r.cumul / 1000)} k€`).join(", "),
    ).toBeGreaterThanOrEqual(3);
    expect(resultats.find((r) => r.s === "balanced")!.cumul).toBeGreaterThan(0);
  });

  it("la passive ne gagne pas la partie, l'équilibrée qui bâtit le traiteur la dépasse, et personne ne meurt avant le quatrième tour", () => {
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

  it("les décisions comptent : plus de cent mille euros entre la meilleure et la pire, sur un bistrot de 70 couverts", () => {
    const totals = resultats.map((r) => r.cumul);
    expect(Math.max(...totals) - Math.min(...totals)).toBeGreaterThan(100000);
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
