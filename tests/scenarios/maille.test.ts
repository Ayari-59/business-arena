import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "../../src/engine/bots";
import { isMultiProduct, toGamme } from "../../src/engine/gamme";
import { runGame, soldUnits, type GameRunResult } from "../../src/engine/simulation/runGame";
import { boutiqueBots, boutiqueCompany, boutiqueScenario } from "../../src/config/scenarios/boutique";
import { tourDuPic } from "../../src/config/scenarios/rounds";
import {
  axesProposables,
  axisAffinity,
  updateBrandAwareness,
} from "../../src/engine/market/communication";
import type { CommunicationAxis, CompanyRoundResult, CompanyState } from "../../src/engine/types";

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

  it("chaque référence a ses façonniers : le tricoteur du mérinos n'est pas celui des bonnets", () => {
    const codes = Object.fromEntries(
      toGamme(boutiqueScenario).map((p) => [p.code, p.suppliers!.map((s) => s.code)]),
    );
    expect(codes["pull-col-rond"]).toEqual(["grossiste", "destockeur", "createur"]);
    expect(codes["cardigan"]).toEqual(codes["pull-col-rond"]);
    // Pas de fins de série sur le premium : une filature à la place.
    expect(codes["pull-merinos"]).toEqual(["grossiste", "filature", "createur"]);
    expect(codes["echarpe"]).toEqual(["grossiste", "accessoiriste", "destockeur"]);
    expect(codes["bonnet"]).toEqual(codes["echarpe"]);
    // Le premier de chaque catalogue est le façonnier de référence (coût ×1),
    // et le catalogue du scénario est celui des pulls (affichages mono-produit).
    for (const p of toGamme(boutiqueScenario)) {
      expect(p.suppliers![0]!.costMultiplier, p.code).toBe(1);
      expect(p.suppliers![0]!.qualityBonus, p.code).toBe(0);
    }
    expect(boutiqueScenario.suppliers!.map((s) => s.code)).toEqual(codes["pull-col-rond"]);
    // Le déstockeur des accessoires n'est pas celui des pulls : même code,
    // autre offre (−22 % contre −18 %).
    const destockPull = toGamme(boutiqueScenario)[0]!.suppliers!.find((s) => s.code === "destockeur")!;
    const destockBonnet = toGamme(boutiqueScenario)[4]!.suppliers!.find((s) => s.code === "destockeur")!;
    expect(destockBonnet.costMultiplier).toBeLessThan(destockPull.costMultiplier);
    // Chez chaque façonnier, chaque référence reste vendable au-dessus de son coût.
    for (const p of toGamme(boutiqueScenario)) {
      for (const s of p.suppliers!) {
        const variable = p.materialCostPerUnit * s.costMultiplier + p.otherVariableCostPerUnit;
        const prixMin = Math.min(...p.market.segments.map((seg) => seg.refPrice));
        expect(prixMin, `${p.code} chez ${s.code}`).toBeGreaterThan(variable * 1.2);
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

/**
 * LA MARQUE ET L'AXE, SUR LES TROIS CLIENTÈLES DE LA BOUTIQUE.
 *
 * Le levier ne vaut que par l'arbitrage qu'il pose : MAILLE & CO a UN discours
 * pour TROIS clientèles qui ne veulent pas entendre la même chose. Les passants
 * comparent les étiquettes, les clientes fidèles regardent la qualité, les
 * comités d'entreprise achètent une maison de confiance. Choisir l'axe, c'est
 * choisir à qui l'on parle — et à qui l'on cesse de parler.
 *
 * Cette table n'est écrite nulle part dans le scénario : le moteur la déduit de
 * l'élasticité, de la sensibilité qualité et de la fidélité de chaque segment.
 * C'est voulu — une table à la main mentirait le jour où l'enseignant change un
 * de ces trois réglages. Ce test fige donc le RÉSULTAT de cette déduction, qui
 * est la promesse pédagogique du levier.
 */
describe("MAILLE & CO — la communication", () => {
  const cfg = boutiqueScenario.communication!;
  const segments = toGamme(boutiqueScenario).flatMap((p) => p.market.segments);
  const segment = (code: string) => {
    const s = segments.find((x) => x.code === code);
    if (!s) throw new Error(`segment ${code} introuvable`);
    return s;
  };
  /** L'axe jugé au prix usuel du segment, sans nouveauté à montrer. */
  const affinite = (axe: CommunicationAxis, code: string) =>
    axisAffinity(axe, segment(code), {
      price: segment(code).refPrice,
      techLevel: 0,
      freshlyLaunched: false,
    });

  it("le scénario ouvre bien le levier", () => {
    expect(cfg).toBeDefined();
    expect(cfg.brandScale).toBeGreaterThan(0);
    // La marque met du temps à se faire dans une boutique de quartier : plus
    // d'inertie que dans les secteurs où l'on se fait connaître vite.
    expect(cfg.brandInertia).toBeGreaterThanOrEqual(0.5);
  });

  it("chaque axe porte une clientèle et en dessert une autre", () => {
    // Le prix parle aux passants (élasticité −2,1) et rebute les fidèles
    // (−0,9), qui n'achètent pas au moins-disant.
    expect(affinite("prix", "pull_passage")).toBe("fit");
    expect(affinite("prix", "pull_fideles")).toBe("misfit");
    expect(affinite("prix", "pull_ce")).toBe("neutral");

    // La qualité, l'inverse exactement.
    expect(affinite("qualite", "pull_fideles")).toBe("fit");
    expect(affinite("qualite", "pull_passage")).toBe("misfit");

    // L'image porte ceux qui reviennent — fidèles et comités d'entreprise —
    // et laisse froids ceux qui passent.
    expect(affinite("image", "pull_fideles")).toBe("fit");
    expect(affinite("image", "pull_ce")).toBe("fit");
    expect(affinite("image", "pull_passage")).toBe("misfit");
  });

  it("promettre le prix en vendant cher n'est jamais crédible", () => {
    // Le garde-fou du moteur : au-delà de +10 % sur le prix usuel, l'axe prix
    // dessert même la clientèle qui compare les étiquettes.
    const passants = segment("pull_passage");
    expect(
      axisAffinity("prix", passants, {
        price: passants.refPrice * 1.3,
        techLevel: 0,
        freshlyLaunched: false,
      }),
    ).toBe("misfit");
  });

  it("l'innovation n'a rien à montrer ici, donc on ne la propose pas", () => {
    // MAILLE & CO n'a ni R&D ni lancement : l'axe innovation sonnerait creux
    // pour TOUTES les clientèles, à tous les tours. Ce n'est pas un oubli,
    // c'est le secteur.
    for (const s of segments) {
      expect(
        axisAffinity("innovation", s, { price: s.refPrice, techLevel: 0, freshlyLaunched: false }),
      ).toBe("misfit");
    }
    // Donc la boutique ne l'offre pas : un choix qui ne peut que coûter n'est
    // pas un arbitrage, c'est un piège.
    expect(axesProposables(boutiqueScenario)).not.toContain("innovation");
    expect(axesProposables(boutiqueScenario)).toEqual(["prix", "qualite", "image"]);
  });

  it("la notoriété se bâtit avec retard et s'use quand on change de discours", () => {
    const apresUnTour = updateBrandAwareness(0, 9000, false, cfg);
    expect(apresUnTour).toBeGreaterThan(0);
    // Deux tours du même budget valent mieux qu'un : la marque est un stock.
    expect(updateBrandAwareness(apresUnTour, 9000, false, cfg)).toBeGreaterThan(apresUnTour);
    // Changer d'axe use l'acquis.
    expect(updateBrandAwareness(apresUnTour, 9000, true, cfg)).toBeLessThan(
      updateBrandAwareness(apresUnTour, 9000, false, cfg),
    );
    // Cesser de payer la fait retomber.
    expect(updateBrandAwareness(apresUnTour, 0, false, cfg)).toBeLessThan(apresUnTour);
  });
});
