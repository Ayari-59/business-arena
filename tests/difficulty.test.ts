import { describe, expect, it } from "vitest";
import {
  applyEconomicOverrides,
  applyEventIntensity,
  DIFFICULTY_PRESETS,
  LEGACY_PRESET,
  presetFromProfile,
  quizModeFromProfile,
  sanitizeEconomicOverrides,
  QUIZ_MODES,
} from "../src/config/difficulty";
import { novaScenario } from "../src/config/scenarios/nova";
import { scenarioByCode } from "../src/config/scenarios/registry";
import { botDecisions, type BotProfile } from "../src/engine/bots";
import { runGame, soldUnits } from "../src/engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState } from "../src/engine/types";
import { parseScenarioConfig } from "../src/config/scenarios/schema";

/**
 * Niveaux de difficulté et paramètres économiques modulables (doc 08 §2) :
 * des DONNÉES, jamais du codage en dur — presets cohérents, overrides bornés,
 * intensité d'événements qui n'invente pas de tirages (les 0 restent 0).
 */

describe("préréglages de difficulté", () => {
  it("six niveaux, progression monotone du plafond d'indices et de l'intensité", () => {
    expect(DIFFICULTY_PRESETS).toHaveLength(6);
    for (let i = 1; i < DIFFICULTY_PRESETS.length; i++) {
      const prev = DIFFICULTY_PRESETS[i - 1]!;
      const cur = DIFFICULTY_PRESETS[i]!;
      expect(cur.level).toBe(prev.level + 1);
      expect(cur.hintMaxLevel).toBeLessThanOrEqual(prev.hintMaxLevel);
      expect(cur.eventProbabilityMultiplier).toBeGreaterThanOrEqual(
        prev.eventProbabilityMultiplier,
      );
    }
    // Executive : conditions réelles
    expect(DIFFICULTY_PRESETS[5]!.hintMaxLevel).toBe(0);
  });

  it("les parties historiques (sans niveau) gardent leur comportement complet", () => {
    const legacy = presetFromProfile({ level: 1, kind: "class" });
    expect(legacy).toBe(LEGACY_PRESET);
    expect(legacy.hintMaxLevel).toBe(5);
    expect(legacy.decisions.finance).toBe(true);
    const explicit = presetFromProfile({ difficulty: { level: 5 } });
    expect(explicit.name).toBe("Stratégie");
    expect(explicit.hintMaxLevel).toBe(2);
  });
});

describe("paramètres économiques modulables", () => {
  it("chaque champ renseigné remplace la valeur du scénario, les absents la conservent", () => {
    const out = applyEconomicOverrides(novaScenario, {
      taxRate: 0.33,
      vatRate: 0.2,
      fixedCostsPerRound: 80000,
    });
    expect(out.finance.taxRate).toBe(0.33);
    expect(out.finance.vatRate).toBe(0.2);
    expect(out.fixedCostsPerRound).toBe(80000);
    expect(out.finance.loanAnnualRate).toBe(novaScenario.finance.loanAnnualRate);
    expect(out.product.materialCostPerUnit).toBe(novaScenario.product.materialCostPerUnit);
    // le scénario modifié reste un scénario valide (zod)
    expect(() => parseScenarioConfig(out)).not.toThrow();
    // et l'original n'est jamais muté
    expect(novaScenario.finance.taxRate).not.toBe(0.33);
  });

  it("le délai client ne s'applique qu'aux segments qui font DÉJÀ crédit", () => {
    // NOVA : étudiants et passionnés paient comptant, CampusTech à 80 jours.
    const out = applyEconomicOverrides(novaScenario, { customerPaymentDelayDays: 30 });
    const byCode = new Map(out.market.segments.map((s) => [s.code, s]));
    expect(byCode.get("etudiants")!.paymentDelayDays).toBe(0);
    expect(byCode.get("passionnes")!.paymentDelayDays).toBe(0);
    expect(byCode.get("campustech")!.paymentDelayDays).toBe(30);
    // uniformiser à 0 supprime le crédit sans transformer les comptants
    const comptant = applyEconomicOverrides(novaScenario, { customerPaymentDelayDays: 0 });
    for (const s of comptant.market.segments) expect(s.paymentDelayDays).toBe(0);
  });

  it("les délais des offres et des fournisseurs restent ceux du scénario", () => {
    // Leur alternance crédit / comptant EST l'exercice : la modularité ne doit
    // pas l'effacer.
    const out = applyEconomicOverrides(novaScenario, {
      customerPaymentDelayDays: 30,
      supplierPaymentDelayDays: 60,
    });
    expect(out.orderOffers?.map((o) => o.paymentDelayDays)).toEqual(
      novaScenario.orderOffers?.map((o) => o.paymentDelayDays),
    );
    expect(out.suppliers?.map((s) => s.paymentDelayDays)).toEqual(
      novaScenario.suppliers?.map((s) => s.paymentDelayDays),
    );
  });

  it("les leviers de financement et de trésorerie sont modulables", () => {
    const out = applyEconomicOverrides(novaScenario, {
      overdraftLimit: 10000,
      loanDurationRounds: 8,
      depreciationPerRound: 7000,
      discountMaxShare: 0.3,
      factoringFeeRate: 0.05,
    });
    expect(out.finance.overdraftLimit).toBe(10000);
    expect(out.finance.loanDurationRounds).toBe(8);
    expect(out.finance.depreciationPerRound).toBe(7000);
    expect(out.treasury?.discountMaxShare).toBe(0.3);
    expect(out.treasury?.factoringFeeRate).toBe(0.05);
    expect(() => parseScenarioConfig(out)).not.toThrow();
  });

  it("un scénario sans bloc trésorerie n'en gagne pas un par un réglage", () => {
    // Sinon on ajouterait des décisions que l'énoncé ne présente pas.
    const sansTresorerie = { ...novaScenario, treasury: undefined };
    const out = applyEconomicOverrides(sansTresorerie, { discountMaxShare: 0.4 });
    expect(out.treasury).toBeUndefined();
  });

  it("une valeur hors bornes est ignorée champ par champ, pas la création", () => {
    const out = sanitizeEconomicOverrides({
      taxRate: 0.9, // > 60 % → ignoré
      vatRate: 0.2, // valide
      supplierPaymentDelayDays: -5, // négatif → ignoré
      customerPaymentDelayDays: 400, // > 180 jours → ignoré
      factoringFeeRate: 0.5, // > 20 % → ignoré
      overdraftLimit: 25000, // valide
    });
    expect(out).toEqual({ vatRate: 0.2, overdraftLimit: 25000 });
  });
});

describe("effet réel du délai client sur le moteur", () => {
  /**
   * Un réglage qui ne change pas les comptes ne sert à rien. On vérifie ici
   * que rallonger le délai client gonfle bien le poste clients et le BFR,
   * à décisions et à chiffre d'affaires identiques.
   */
  const play = (delayDays: number) => {
    const def = scenarioByCode("conseil"); // tous ses segments font crédit
    const scenario = applyEconomicOverrides(def.scenario, {
      customerPaymentDelayDays: delayDays,
    });
    const companies = [
      def.company("player", "P", "bot", "balanced"),
      ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
    ];
    const run = runGame({
      scenario,
      initialCompanies: companies,
      providers: Object.fromEntries(
        companies.map((c) => [
          c.id,
          (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
            botDecisions(c.botProfile as BotProfile, {
              scenario,
              state: ctx.state,
              roundIndex: ctx.roundIndex,
              lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
            }),
        ]),
      ),
      seed: 20260101,
    });
    return run.rounds[0]!.results["player"]!;
  };

  it("payer comptant vide le poste clients ; 90 jours le gonfle", () => {
    const comptant = play(0);
    const credit = play(90);
    // même activité : le délai ne change ni les ventes ni le résultat d'exploitation
    expect(credit.incomeStatement.revenue).toBeCloseTo(comptant.incomeStatement.revenue, 6);
    expect(credit.incomeStatement.operatingIncome).toBeCloseTo(
      comptant.incomeStatement.operatingIncome,
      6,
    );
    // mais la trésorerie, elle, change du tout au tout
    expect(comptant.balanceSheet.receivables).toBe(0);
    expect(credit.balanceSheet.receivables).toBeGreaterThan(0);
    expect(credit.functionalBalance.bfr).toBeGreaterThan(comptant.functionalBalance.bfr);
    expect(credit.functionalBalance.netTreasury).toBeLessThan(
      comptant.functionalBalance.netTreasury,
    );
  });

  it("allonger le délai allonge le poste clients de façon monotone", () => {
    const r30 = play(30).balanceSheet.receivables;
    const r60 = play(60).balanceSheet.receivables;
    const r90 = play(90).balanceSheet.receivables;
    expect(r60).toBeGreaterThan(r30);
    expect(r90).toBeGreaterThan(r60);
  });
});

describe("intensité d'événements par niveau", () => {
  it("multiplie les probabilités, plafonne à 0,9, et n'invente jamais de tirage", () => {
    const doubled = applyEventIntensity(novaScenario, 2);
    for (const [i, event] of doubled.events.entries()) {
      const base = novaScenario.events[i]!;
      if (base.probability === 0) expect(event.probability).toBe(0);
      else expect(event.probability).toBeCloseTo(Math.min(0.9, base.probability * 2), 12);
    }
    // multiplicateur 1 : objet inchangé (aucune copie inutile)
    expect(applyEventIntensity(novaScenario, 1)).toBe(novaScenario);
  });
});

describe("réglage des questions posées dans les situations", () => {
  it("lit un réglage explicite, quelle que soit la position", () => {
    for (const mode of QUIZ_MODES) {
      expect(quizModeFromProfile({ quizMode: mode.code })).toBe(mode.code);
    }
  });

  it("les parties d'avant le réglage gardent leur comportement", () => {
    // Le drapeau booléen historique : absent ou true = tout servi, false = rien.
    expect(quizModeFromProfile(null)).toBe("full");
    expect(quizModeFromProfile({})).toBe("full");
    expect(quizModeFromProfile({ quizEnabled: true })).toBe("full");
    expect(quizModeFromProfile({ quizEnabled: false })).toBe("off");
  });

  it("le réglage explicite l'emporte sur l'ancien drapeau", () => {
    expect(quizModeFromProfile({ quizEnabled: false, quizMode: "model" })).toBe("model");
    expect(quizModeFromProfile({ quizEnabled: true, quizMode: "off" })).toBe("off");
  });

  it("une valeur inconnue retombe sur le comportement historique", () => {
    expect(quizModeFromProfile({ quizMode: "n'importe quoi" })).toBe("full");
  });
});
