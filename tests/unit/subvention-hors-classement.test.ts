import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as bpi from "@/scoring/bpi";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * LA SUBVENTION HORS CLASSEMENT (séance d'essai, P1-5 ; décision du
 * propriétaire). Au tour 4, le mur montrait BassBoost « +261 370 € » et Écho
 * Premium « +138 119 € », les deux meilleurs résultats de la classe : ce sont
 * les subventions de l'enseignant. Une aide de l'enseignant ne fait pas monter
 * au classement : le résultat affiché au mur et au classement, et l'IPG, se
 * comptent hors subvention ; la subvention se montre à part.
 *
 * Vue rouge sur le code d'avant (l'IPG financier d'une équipe subventionnée
 * passait de 20 à 100, et le classement sommait le résultat net brut), verte
 * après.
 */

function resultat(netIncome: number, rescueSubsidy?: number): CompanyRoundResult {
  return {
    companyId: "x",
    incomeStatement: {
      operatingIncome: -80_000,
      netIncome,
      revenue: 200_000,
      ...(rescueSubsidy ? { rescueSubsidy } : {}),
    },
    balanceSheet: { overdraft: 0 },
    functionalBalance: { netTreasury: 10_000 },
    ratios: { returnOnEquity: 0 },
    market: { totalShare: 0.2, bySegment: { s: { demandForCompany: 3000, sold: 3000, lost: 0 } } },
    production: { utilizationRate: 0.8 },
  } as unknown as CompanyRoundResult;
}

describe("la subvention ne compte pas dans l'IPG", () => {
  // Une perte de 9 430 € avant subvention ; 261 370 € avec une subvention de 270 800 €.
  const sansAide = resultat(-9_430);
  const aidee = resultat(261_370, 270_800);

  it("le résultat hors subvention retire la subvention du résultat net", () => {
    const horsSubvention = (bpi as Record<string, unknown>).resultatHorsSubvention as
      | ((is: CompanyRoundResult["incomeStatement"]) => number)
      | undefined;
    expect(typeof horsSubvention).toBe("function");
    expect(horsSubvention!(aidee.incomeStatement)).toBe(-9_430);
    expect(horsSubvention!(sansAide.incomeStatement)).toBe(-9_430);
  });

  it("une équipe aidée a la même performance financière qu'une équipe qui ne l'est pas", () => {
    expect(bpi.financialV2Score(aidee, 0)).toBe(bpi.financialV2Score(sansAide, 0));
  });

  it("le tour suivant ne lit pas la subvention dans le résultat précédent", () => {
    const service = readFileSync(join(process.cwd(), "src/services/scoring.service.ts"), "utf8");
    // Le résultat précédent (variation financière) et le résultat cumulé du
    // classement se lisent hors subvention.
    expect(service.match(/resultatHorsSubvention\(/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(service).toContain("cumulativeSubsidy");
    const rejeu = readFileSync(join(process.cwd(), "src/pedagogy/merite/rejeu.ts"), "utf8");
    expect(rejeu).toContain("resultatHorsSubvention(");
  });
});

describe("le mur montre le résultat hors subvention, et la subvention à part", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("la vue enseignant porte le résultat hors subvention et la subvention du tour", () => {
    const service = lire("src/services/game.service.ts");
    expect(service).toContain("lastRescueSubsidy");
    expect(service).toMatch(/lastNetIncome: last \? resultatHorsSubvention\(/);
  });

  it("la projection écrit la subvention à part, « Subvention de … hors classement »", () => {
    expect(lire("src/components/revelation-du-marche.tsx")).toContain("data-revelation-subvention");
    const projection = lire("src/app/teacher/games/[gameId]/projection/page.tsx");
    expect(projection).toContain("lastRescueSubsidy");
    expect(projection).toContain("hors classement");
  });
});
