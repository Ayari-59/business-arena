import { describe, expect, it } from "vitest";
import { SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";

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
