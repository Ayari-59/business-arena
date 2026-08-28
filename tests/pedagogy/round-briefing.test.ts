import { describe, expect, it } from "vitest";
import { roundBriefing, type BriefingInput } from "../../src/pedagogy/round-briefing";
import type { CompanyRoundResult } from "../../src/engine/types";

/**
 * Contexte des tours 2 et suivants : il est CALCULÉ sur le tour écoulé, pas
 * écrit d'avance. Ce qui se teste ici, ce sont les règles de lecture :
 *
 * - la bonne tension est repérée, et dans le bon ordre de priorité ;
 * - une route fermée par le niveau de difficulté n'est jamais proposée ;
 * - chaque route dit ce qu'elle rapporte ET ce qu'elle coûte.
 */

/**
 * L'affichage FR sépare les milliers par une espace fine insécable (U+202F) et
 * peut coller un insécable avant l'euro. Les comparaisons se font donc sur un
 * texte normalisé, sans quoi elles échouent sur une espace invisible.
 */
const plain = (s: string) => s.replace(/[\u202f\u00a0]/g, " ");

const VOCABULARY = {
  unit: "enceinte",
  units: "enceintes",
  unitsGender: "f" as const,
  productionPlanLabel: "Plan de production",
  priceLabel: "Prix de vente",
  leftoverLabel: "Stock",
};

/** Un tour parfaitement banal : rien ne déclenche, tout est réglable au cas par cas. */
function result(over: Partial<CompanyRoundResult> = {}): CompanyRoundResult {
  return {
    companyId: "c1",
    incomeStatement: {
      revenue: 300_000,
      productionStocked: 0,
      cogs: 180_000,
      variableProductionCost: 180_000,
      grossMargin: 120_000,
      marketingCost: 6_000,
      qualityCost: 0,
      maintenanceCost: 0,
      fixedCosts: 90_000,
      ebitda: 24_000,
      depreciation: 8_000,
      operatingIncome: 16_000,
      interest: 1_000,
      pretaxIncome: 15_000,
      tax: 3_750,
      netIncome: 11_250,
    },
    balanceSheet: {
      fixedAssetsNet: 200_000,
      inventoryValue: 5_000,
      receivables: 40_000,
      cash: 30_000,
      equity: 220_000,
      financialDebt: 40_000,
      payables: 15_000,
      overdraft: 0,
    },
    cashFlow: { opening: 20_000, items: [], closing: 30_000 },
    functionalBalance: { frng: 100_000, bfr: 70_000, netTreasury: 30_000 },
    ratios: {
      profitability: 0.05,
      returnOnCapitalEmployed: 0.06,
      returnOnEquity: 0.05,
      leverage: 0.2,
      debtToEquity: 0.18,
      assetTurnover: 1.2,
    },
    market: {
      bySegment: {
        etudiants: { potential: 8_000, attraction: 1, share: 0.3, demandForCompany: 3_000, sold: 3_000, lost: 0 },
        passionnes: { potential: 4_000, attraction: 1, share: 0.25, demandForCompany: 1_000, sold: 1_000, lost: 0 },
      },
      totalShare: 0.28,
    },
    production: {
      planned: 4_000,
      produced: 4_000,
      machineCapacity: 7_000,
      laborCapacity: 6_500,
      utilizationRate: 0.57,
      producedQuality: 1,
    },
    breakeven: {
      breakEvenUnits: 3_000,
      breakEvenRevenue: 225_000,
      safetyMargin: 75_000,
      safetyIndex: 0.25,
    },
    ...over,
  } as CompanyRoundResult;
}

function input(over: Partial<BriefingInput> = {}): BriefingInput {
  return {
    result: result(),
    vocabulary: VOCABULARY,
    enabled: { finance: true, investment: true, hr: true },
    hasTreasuryTools: true,
    hasInvestmentOffer: true,
    perishable: false,
    ...over,
  };
}

describe("contexte des tours suivants", () => {
  it("un tour sans tension propose l'arbitrage qu'on oublie de faire quand tout va bien", () => {
    const b = roundBriefing(input());
    expect(b.code).toBe("steady");
    expect(plain(b.headline)).toContain("11 250 €");
    expect(plain(b.headline)).toContain("28 %");
  });

  it("la trésorerie passe avant tout le reste", () => {
    // Une perte d'exploitation ET un découvert : c'est le découvert qui parle,
    // parce qu'une entreprise ne meurt pas d'une perte, elle meurt de ne plus
    // pouvoir payer.
    const b = roundBriefing(
      input({
        result: result({
          balanceSheet: { ...result().balanceSheet, cash: 0, overdraft: 12_000 },
          functionalBalance: { frng: 40_000, bfr: 52_000, netTreasury: -12_000 },
          incomeStatement: { ...result().incomeStatement, operatingIncome: -5_000 },
        }),
      }),
    );
    expect(b.code).toBe("treasury_crisis");
    expect(plain(b.headline)).toContain("12 000 €");
  });

  it("sans outils de trésorerie au scénario, la route de mobilisation n'est pas proposée", () => {
    const crise = {
      balanceSheet: { ...result().balanceSheet, overdraft: 9_000 },
      functionalBalance: { frng: 40_000, bfr: 49_000, netTreasury: -9_000 },
    };
    const avec = roundBriefing(input({ result: result(crise), hasTreasuryTools: true }));
    const sans = roundBriefing(input({ result: result(crise), hasTreasuryTools: false }));
    expect(avec.routes.some((r) => r.label.includes("poste clients"))).toBe(true);
    expect(sans.routes.some((r) => r.label.includes("poste clients"))).toBe(false);
    // et il reste toujours de quoi agir
    expect(sans.routes.length).toBeGreaterThanOrEqual(2);
  });

  it("la demande refusée est repérée, avec le volume réellement perdu", () => {
    const b = roundBriefing(
      input({
        result: result({
          market: {
            bySegment: {
              etudiants: { potential: 9_000, attraction: 1, share: 0.4, demandForCompany: 3_600, sold: 3_000, lost: 600 },
              passionnes: { potential: 4_000, attraction: 1, share: 0.25, demandForCompany: 1_000, sold: 1_000, lost: 0 },
            },
            totalShare: 0.33,
          },
        }),
      }),
    );
    expect(b.code).toBe("demand_refused");
    expect(plain(b.headline)).toContain("600 enceintes");
    expect(plain(b.headline)).toContain("4 600");
  });

  it("un niveau qui n'ouvre ni investissement ni RH ne conseille que le prix", () => {
    const saturee = {
      market: {
        bySegment: {
          etudiants: { potential: 9_000, attraction: 1, share: 0.4, demandForCompany: 3_600, sold: 3_000, lost: 600 },
        },
        totalShare: 0.33,
      },
    };
    const b = roundBriefing(
      input({
        result: result(saturee),
        enabled: { finance: false, investment: false, hr: false },
      }),
    );
    expect(b.code).toBe("demand_refused");
    expect(b.routes).toHaveLength(1);
    expect(b.routes[0]!.label).toContain("prix de vente");
  });

  it("l'invendu est nommé selon le métier : du stock, ou une perte sèche", () => {
    const surproduction = { production: { ...result().production, produced: 5_000 } };
    const stockable = roundBriefing(input({ result: result(surproduction), perishable: false }));
    const perissable = roundBriefing(input({ result: result(surproduction), perishable: true }));
    expect(stockable.code).toBe("stock_piling");
    expect(stockable.headline).toContain("sur les bras");
    // un bistrot ne « videra » pas son stock : la question posée n'est pas la même
    expect(perissable.question).not.toBe(stockable.question);

    // Le participe s'accorde avec l'unité du secteur. La phrase était écrite
    // une fois pour sept métiers : juste pour des couverts, fausse pour des
    // enceintes. Le vocabulaire du scénario porte donc le genre.
    expect(perissable.headline).toContain("elles sont perdues");
    const masculin = roundBriefing(
      input({
        result: result(surproduction),
        perishable: true,
        vocabulary: { ...VOCABULARY, unit: "couvert", units: "couverts", unitsGender: "m" },
      }),
    );
    expect(masculin.headline).toContain("ils sont perdus");
    expect(masculin.headline).not.toContain("perdues");
  });

  it("la perte d'exploitation parle quand rien de plus pressant ne s'est produit", () => {
    const b = roundBriefing(
      input({
        result: result({
          incomeStatement: { ...result().incomeStatement, operatingIncome: -14_000, netIncome: -18_000 },
        }),
      }),
    );
    expect(b.code).toBe("operating_loss");
    expect(plain(b.headline)).toMatch(/14 000 €/);
  });

  it("toute route dit ce qu'elle rapporte ET ce qu'elle coûte, dans tous les cas", () => {
    const cas: BriefingInput[] = [
      input(),
      input({ result: result({ balanceSheet: { ...result().balanceSheet, overdraft: 5_000 } }) }),
      input({ result: result({ production: { ...result().production, produced: 6_000 } }) }),
      input({
        result: result({ incomeStatement: { ...result().incomeStatement, operatingIncome: -1 } }),
      }),
      input({
        result: result({
          market: {
            bySegment: {
              a: { potential: 9_000, attraction: 1, share: 0.4, demandForCompany: 3_600, sold: 3_000, lost: 900 },
            },
            totalShare: 0.3,
          },
        }),
      }),
    ];
    for (const c of cas) {
      const b = roundBriefing(c);
      expect(b.question.trim().endsWith("?"), b.code).toBe(true);
      expect(b.routes.length, b.code).toBeGreaterThanOrEqual(1);
      for (const route of b.routes) {
        expect(route.gain.length, `${b.code} / ${route.label}`).toBeGreaterThan(60);
        expect(route.risque.length, `${b.code} / ${route.label}`).toBeGreaterThan(60);
      }
    }
  });

  it("le vocabulaire du métier est repris, jamais des « unités » génériques", () => {
    const b = roundBriefing(
      input({
        result: result({
          market: {
            bySegment: {
              a: { potential: 9_000, attraction: 1, share: 0.4, demandForCompany: 3_600, sold: 3_000, lost: 900 },
            },
            totalShare: 0.3,
          },
        }),
        vocabulary: {
          unit: "nuitée",
          units: "nuitées",
          unitsGender: "f" as const,
          productionPlanLabel: "Chambres à ouvrir",
          priceLabel: "Prix moyen par nuitée",
          leftoverLabel: "Capacité perdue",
        },
      }),
    );
    expect(b.headline).toContain("nuitées");
    expect(JSON.stringify(b)).not.toContain("unités");
  });
});
