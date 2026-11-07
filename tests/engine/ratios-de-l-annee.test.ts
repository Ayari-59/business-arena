import { describe, expect, it } from "vitest";
import { computeRatios, ratiosDeLAnnee } from "@/engine/finance/ratios";
import { commentaireDuLevier, fenetreDesRatios } from "@/components/lecture-des-ratios";
import type { BalanceSheet, IncomeStatement } from "@/engine/types";
import { anneeJouee } from "@/config/cours/annee-de-l-arene";

/**
 * LES RATIOS AFFICHÉS SE LISENT SUR L'ANNÉE (relevé du moteur, novembre 2026).
 *
 * Re, Rf et la rotation rapportaient les flux d'un trimestre à des capitaux de l'année,
 * face à des repères annuels (Re ≥ 8 %, Rf ≥ 10 %) : NOVA lisait 13,8 % de Rf au dernier
 * trimestre d'une année qui en rapportait 33. Un résultat d'exploitation négatif était
 * « net d'impôt », les placements manquaient à l'actif, et « la dette pèse » s'affichait
 * dès que Rf passait sous Re, perte comprise.
 */

const bilan = (over: Partial<BalanceSheet> = {}): BalanceSheet => ({
  fixedAssetsNet: 200_000,
  inventoryValue: 0,
  receivables: 0,
  cash: 50_000,
  equity: 150_000,
  financialDebt: 100_000,
  payables: 0,
  overdraft: 0,
  ...over,
});
const compte = (over: Partial<IncomeStatement> = {}): IncomeStatement =>
  ({ revenue: 100_000, operatingIncome: 10_000, netIncome: 6_000, interest: 1_000, ...over }) as IncomeStatement;

describe("les ratios de l'année glissante", () => {
  it("quatre trimestres : les flux de l'année sur les capitaux de la clôture", () => {
    const tours = [4_000, 8_000, 12_000, 16_000].map((rex) => ({
      incomeStatement: compte({ operatingIncome: rex, netIncome: rex / 2 }),
      balanceSheet: bilan(),
    }));
    // Un cinquième tour fait glisser la fenêtre : le premier sort.
    const r = ratiosDeLAnnee([{ incomeStatement: compte({ operatingIncome: 1e9 }), balanceSheet: bilan() }, ...tours], 0.25, 90);
    expect(r.toursLus).toBe(4);
    expect(r.annualise).toBe(false);
    expect(r.returnOnCapitalEmployed).toBeCloseTo((40_000 * 0.75) / 250_000, 12);
    expect(r.returnOnEquity).toBeCloseTo(20_000 / 150_000, 12);
    expect(r.assetTurnover).toBeCloseTo(400_000 / 250_000, 12);
  });

  it("moins de quatre trimestres : ramenés à l'année, et l'affichage le dit", () => {
    const r = ratiosDeLAnnee([{ incomeStatement: compte(), balanceSheet: bilan() }], 0.25, 90);
    expect(r.annualise).toBe(true);
    expect(r.returnOnEquity).toBeCloseTo((6_000 * 4) / 150_000, 12);
    expect(fenetreDesRatios(r)).toContain("ramenés à l'année");
    // À l'année, un tour est l'année.
    expect(ratiosDeLAnnee([{ incomeStatement: compte(), balanceSheet: bilan() }], 0.25, 360).annualise).toBe(false);
  });

  it("dans l'arène, le Rf de l'année est le résultat de l'année sur les capitaux de la clôture", () => {
    const res = anneeJouee("nova").partie.rounds.map((t) => t.results.joueur!);
    const r = ratiosDeLAnnee(res, 0.25, 90);
    const rn = res.reduce((s, x) => s + x.incomeStatement.netIncome, 0);
    expect(r.returnOnEquity).toBeCloseTo(rn / res.at(-1)!.balanceSheet.equity, 12);
    expect(Math.abs(r.returnOnEquity)).toBeGreaterThan(Math.abs(res.at(-1)!.ratios.returnOnEquity));
  });
});

describe("ce que les ratios ne faisaient pas", () => {
  it("un résultat d'exploitation négatif ne porte pas d'impôt", () => {
    const r = computeRatios(compte({ operatingIncome: -10_000, netIncome: -11_000 }), bilan(), 0.25);
    expect(r.returnOnCapitalEmployed).toBeCloseTo(-10_000 / 250_000, 12);
  });

  it("les placements comptent à l'actif", () => {
    const r = computeRatios(compte(), bilan({ shortTermInvestment: 50_000 }), 0.25);
    expect(r.assetTurnover).toBeCloseTo(100_000 / 300_000, 12);
  });

  it("« la dette pèse » seulement quand elle coûte plus que ce que l'outil rapporte", () => {
    // Une perte d'exploitation : Rf sous Re, mais la dette coûte 3 % net d'impôt.
    const perte = ratiosDeLAnnee(
      [{ incomeStatement: compte({ operatingIncome: -40_000, netIncome: -44_000, interest: 1_000 }), balanceSheet: bilan() }],
      0.25,
      90,
    );
    expect(perte.leverage).toBeLessThan(0);
    expect(perte.laDettePese).toBe(false);
    expect(commentaireDuLevier(perte)).not.toContain("La dette pèse");
    // Une dette chère sur un outil qui rapporte peu : là, elle pèse.
    const chere = ratiosDeLAnnee(
      [{ incomeStatement: compte({ operatingIncome: 1_000, netIncome: -2_000, interest: 3_000 }), balanceSheet: bilan() }],
      0.25,
      90,
    );
    expect(chere.laDettePese).toBe(true);
    expect(commentaireDuLevier(chere)).toContain("La dette pèse");
  });
});
