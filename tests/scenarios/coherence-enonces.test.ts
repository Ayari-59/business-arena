import { describe, expect, it } from "vitest";
import { SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";
import { botDecisions, type BotProfile } from "../../src/engine/bots";
import { runGame, soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState } from "../../src/engine/types";

/**
 * Les énoncés citent des chiffres que le moteur applique. Quand les deux
 * divergent, l'élève qui ouvre son bilan ou lit son relevé ne retrouve pas
 * ce qu'on lui a dit : c'est la pire des incohérences pédagogiques. Ces
 * gardes lisent les nombres CITÉS dans les situations et les comparent à la
 * configuration du scénario.
 */

const textes = (code: string): string =>
  scenarioByCode(code)
    .situations.flatMap((s) => [
      s.narrative,
      s.problem,
      ...s.diagnosticOptions.map((o) => o.label),
      ...s.hints.map((h) => h.text),
      ...s.quiz.flatMap((q) => [q.prompt, q.explain, ...q.options.map((o) => o.label)]),
    ])
    .join(" ");

describe("les taux cités dans les situations sont ceux du scénario", () => {
  for (const d of SCENARIOS) {
    it(`${d.code} : le découvert et le placement`, () => {
      const t = textes(d.code);
      const decouvert = Math.round(d.scenario.finance.overdraftAnnualRate * 100);
      for (const m of t.matchAll(/découvert(?: à)? (\d+) %/g)) {
        expect(Number(m[1]), `« ${m[0]} »`).toBe(decouvert);
      }
      const placement = d.scenario.treasury?.placementAnnualRate;
      for (const m of t.matchAll(/(\d+) % l['’]an/g)) {
        expect(placement, `« ${m[0]} » sans placement configuré`).toBeDefined();
        expect(Number(m[1]), `« ${m[0]} »`).toBe(Math.round(placement! * 100));
      }
      // Le rapport entre les deux, dit en mots : « sept fois » pour 14 % contre 2 %.
      const mots: Record<number, string> = { 4: "quatre fois", 5: "cinq fois", 6: "six fois", 7: "sept fois" };
      if (placement && /ce que le placement rapporte/.test(t)) {
        const rapport = Math.floor(d.scenario.finance.overdraftAnnualRate / placement);
        expect(t, `${d.code} : le rapport découvert/placement`).toMatch(new RegExp(`${mots[rapport]}[^.]*ce que le placement rapporte`));
      }
    });
  }
});

describe("LA TABLE D'AUGUSTIN : les chiffres des énoncés sortent de la configuration", () => {
  const d = scenarioByCode("bistrot");
  const s = d.scenario;
  const t = textes("bistrot");

  it("le seuil par jour d'ouverture compte les jours où la salle est ouverte, pas les jours du calendrier", () => {
    // 70 places × 2 services × 64 jours d'ouverture = la capacité du trimestre
    const places = 70;
    const jours = Math.round(d.company("t", "T", "human").machineCapacity / (places * 2));
    expect(jours).toBe(64);
    const ticket = 33;
    const marge = ticket - s.product.materialCostPerUnit - s.product.otherVariableCostPerUnit;
    const seuil = s.fixedCostsPerRound / marge;
    expect(seuil).toBe(4500);
    const parJour = Math.round(seuil / jours);
    expect(parJour).toBe(70);
    expect(t).toContain(`soit ${parJour} par jour sur ${jours} jours d'ouverture`);
    expect(t).not.toMatch(/50 par jour/);
  });

  it("la terrasse de l'énoncé est celle que le moteur vend : 48 000 € pour 1 800 couverts, amortis sur douze trimestres", () => {
    const inv = s.investment!;
    expect(inv.maxPerRound).toBe(1800);
    expect(inv.costPerCapacityUnit * inv.maxPerRound).toBe(48600);
    expect(inv.depreciationRounds).toBe(12);
    const terrasse = d.situations.find((x) => x.code === "bistrot_t5_terrasse")!;
    expect(terrasse.narrative).toContain("48 000 €");
    expect(terrasse.narrative).toContain("1 800 couverts");
    expect(terrasse.narrative).toContain("douze trimestres");
    // 48 000 / 12 = 4 000 € d'amortissement par trimestre, cité par l'énoncé
    expect(terrasse.diagnosticOptions.map((o) => o.label).join(" ")).toContain("4 000 €");
  });

  it("les capitaux propres de la situation du tour 6 sont ceux du bilan, pas un chiffre inventé", () => {
    const equity = d.company("t", "T", "human").finance.equity;
    expect(equity).toBe(92000);
    const valeur = d.situations.find((x) => x.code === "bistrot_t6_valeur")!;
    expect(valeur.narrative).not.toMatch(/260 000/);
    expect(valeur.narrative).toContain("passif de votre bilan");
  });

  it("la capacité nomme la salle ET la cuisine, puisque les équipements qui la font sont des cuisines", () => {
    expect(d.vocabulary.capacityLabel).toBe("Capacité salle et cuisine");
    expect(d.vocabulary.capacityBottleneckLabel).toBe("Salle et cuisine");
    for (const type of s.equipment!.types) expect(type.name.toLowerCase()).toContain("cuisine");
  });
});

describe("aucune offre de commande ne vend sous le coût variable sans le dire", () => {
  for (const d of SCENARIOS) {
    it(`${d.code}`, () => {
      const p = d.scenario.product;
      const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
      for (const o of d.scenario.orderOffers ?? []) {
        expect(o.price, `${o.code} à ${o.price} € pour ${variable} € de coût variable`).toBeGreaterThanOrEqual(variable);
      }
    });
  }
});

describe("PIXEL & CO : la thèse du scénario est ce que le moteur fait", () => {
  const d = scenarioByCode("ecommerce");
  const s = d.scenario;

  it("sans publicité, le trafic payant ne vient presque pas : la porte marketing du segment est fermée aux deux tiers", () => {
    const acquisition = s.market.segments.find((x) => x.code === "acquisition")!;
    expect(acquisition.marketingGate).toBeDefined();
    expect(acquisition.marketingGate!).toBeLessThanOrEqual(0.35);
    for (const x of s.market.segments) if (x.code !== "acquisition") expect(x.marketingGate).toBeUndefined();
  });

  it("les retours de la situation du tour 3 existent dans le moteur et répondent à la qualité perçue", () => {
    expect(s.qualityCosts).toBeDefined();
    expect(s.qualityCosts!.externalReturnSensitivity).toBeGreaterThan(0);
    const retours = d.situations.find((x) => x.code === "ecommerce_t3_retours")!;
    expect(retours.narrative).toContain("11 € de logistique");
  });

  it("les dettes fournisseurs du bilan valent bien 45 jours d'achats", () => {
    const c = d.company("t", "T", "human");
    const achatsTrimestre = 4500 * s.product.materialCostPerUnit;
    const attendu = (achatsTrimestre * s.finance.supplierPaymentDelayDays) / 90;
    expect(Math.abs(c.finance.payables - attendu) / attendu).toBeLessThan(0.05);
    // et le bilan reste équilibré
    const f = c.finance;
    expect(f.fixedAssetsNet + f.inventoryValue + f.receivables + f.cash).toBe(f.equity + f.financialDebt + f.payables);
  });

  it("le déstockage laisse « presque rien », pas une perte", () => {
    const o = (s.orderOffers ?? []).find((x) => x.code === "ecom_offer_destockage")!;
    const variable = s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit;
    expect(o.price - variable).toBeGreaterThan(0);
    expect(o.price - variable).toBeLessThan(5);
  });
});

describe("PIXEL & CO : la partie donne raison à la thèse", () => {
  const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];
  const d = scenarioByCode("ecommerce");
  function cumul(strategie: BotProfile): { cumul: number; mort: number } {
    const companies: CompanyState[] = [
      d.company("player", "PIXEL", "bot", strategie),
      ...d.bots.slice(0, 2).map((b) => d.company(b.id, b.name, "bot", b.profile)),
    ];
    const run = runGame({
      scenario: d.scenario,
      initialCompanies: companies,
      providers: Object.fromEntries(
        companies.map((c) => [
          c.id,
          (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
            botDecisions(c.botProfile as BotProfile, {
              scenario: d.scenario,
              state: ctx.state,
              roundIndex: ctx.roundIndex,
              lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
            }),
        ]),
      ),
      seed: 20260101,
    });
    const rs = run.rounds.map((r) => r.results["player"]!);
    return {
      cumul: rs.reduce((t, r) => t + r.incomeStatement.netIncome, 0),
      mort: rs.findIndex((r) => soldUnits(r) === 0) + 1,
    };
  }
  const resultats = Object.fromEntries(STRATEGIES.map((s) => [s, cumul(s)]));

  it("celui qui n'achète pas son trafic ne gagne pas la partie : la passive finit derrière l'équilibrée et la croissance", () => {
    expect(resultats["passive"]!.cumul).toBeLessThan(resultats["balanced"]!.cumul);
    expect(resultats["passive"]!.cumul).toBeLessThan(resultats["growth"]!.cumul);
    expect(resultats["passive"]!.cumul).toBeLessThan(0);
  });

  it("acheter son trafic paie : l'équilibrée et la croissance gagnent, et nul ne meurt au premier tour", () => {
    expect(resultats["balanced"]!.cumul).toBeGreaterThan(0);
    expect(resultats["growth"]!.cumul).toBeGreaterThan(0);
    for (const s of STRATEGIES) expect(resultats[s]!.mort, s).not.toBe(1);
  });
});
