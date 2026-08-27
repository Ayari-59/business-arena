import { describe, expect, it } from "vitest";
import {
  COMMERCE_KPIS,
  HOTELLERIE_KPIS,
  INDUSTRIE_KPIS,
  RESTAURATION_KPIS,
  SERVICES_KPIS,
  computeSectorKpis,
  type SectorKpiContext,
} from "../../src/config/scenarios/sector-kpis";
import { SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";
import type { CompanyRoundResult, SegmentSalesDetail } from "../../src/engine/types";

/**
 * Les indicateurs métier sont lus par des élèves et repris en cours : une
 * formule fausse est pire qu'un indicateur absent. On vérifie ici les
 * identités du métier, pas seulement que « ça calcule ».
 */

const segment = (over: Partial<SegmentSalesDetail> = {}): SegmentSalesDetail => ({
  potential: 1000,
  attraction: 1,
  share: 0.3,
  demandForCompany: 300,
  sold: 300,
  lost: 0,
  ...over,
});

/** Résultat de tour minimal : seuls les champs lus par les KPI sont peuplés. */
const result = (over: {
  revenue?: number;
  cogs?: number;
  inventoryValue?: number;
  receivables?: number;
  machineCapacity?: number;
  laborCapacity?: number;
  utilizationRate?: number;
  segments?: Record<string, SegmentSalesDetail>;
} = {}): CompanyRoundResult =>
  ({
    companyId: "a",
    incomeStatement: {
      revenue: over.revenue ?? 100_000,
      cogs: over.cogs ?? 40_000,
    },
    balanceSheet: {
      inventoryValue: over.inventoryValue ?? 0,
      receivables: over.receivables ?? 0,
    },
    market: { bySegment: over.segments ?? { main: segment() }, totalShare: 0.3 },
    production: {
      planned: 0,
      produced: 1000,
      machineCapacity: over.machineCapacity ?? 5000,
      laborCapacity: over.laborCapacity ?? 8000,
      utilizationRate: over.utilizationRate ?? 0.5,
      producedQuality: 1,
    },
  }) as unknown as CompanyRoundResult;

const ctx = (over: Partial<SectorKpiContext> = {}): SectorKpiContext => ({
  result: result(),
  previousSegments: null,
  segmentUnits: 300,
  totalUnits: 300,
  roundDays: 90,
  scenario: scenarioByCode("nova").scenario,
  ...over,
});

const valueOf = (
  defs: Parameters<typeof computeSectorKpis>[0],
  key: string,
  context: SectorKpiContext,
): number | undefined => computeSectorKpis(defs, context).find((k) => k.key === key)?.value;

describe("indicateurs hôteliers", () => {
  const hotelCtx = ctx({
    result: result({ revenue: 342_000, machineCapacity: 5400 }),
    totalUnits: 3600,
  });

  it("le taux d'occupation rapporte les nuitées vendues aux nuitées offertes", () => {
    expect(valueOf(HOTELLERIE_KPIS, "taux_occupation", hotelCtx)).toBeCloseTo(3600 / 5400, 9);
  });

  it("le PMC est le prix moyen des nuitées VENDUES", () => {
    expect(valueOf(HOTELLERIE_KPIS, "pmc", hotelCtx)).toBeCloseTo(342_000 / 3600, 9);
  });

  it("le RevPAR rapporte le revenu aux chambres DISPONIBLES", () => {
    expect(valueOf(HOTELLERIE_KPIS, "revpar", hotelCtx)).toBeCloseTo(342_000 / 5400, 9);
  });

  it("RevPAR = PMC × taux d'occupation — l'identité du métier", () => {
    const pmc = valueOf(HOTELLERIE_KPIS, "pmc", hotelCtx)!;
    const occ = valueOf(HOTELLERIE_KPIS, "taux_occupation", hotelCtx)!;
    const revpar = valueOf(HOTELLERIE_KPIS, "revpar", hotelCtx)!;
    expect(revpar).toBeCloseTo(pmc * occ, 9);
  });

  it("un hôtel bradé et un hôtel vide sont tous deux sanctionnés par le RevPAR", () => {
    // même chiffre d'affaires atteint de deux façons opposées
    const brade = ctx({ result: result({ revenue: 216_000, machineCapacity: 5400 }), totalUnits: 5400 });
    const vide = ctx({ result: result({ revenue: 216_000, machineCapacity: 5400 }), totalUnits: 2160 });
    expect(valueOf(HOTELLERIE_KPIS, "revpar", brade)).toBeCloseTo(40, 9);
    expect(valueOf(HOTELLERIE_KPIS, "revpar", vide)).toBeCloseTo(40, 9);
    // le PMC, lui, distingue les deux stratégies
    expect(valueOf(HOTELLERIE_KPIS, "pmc", brade)).toBeCloseTo(40, 9);
    expect(valueOf(HOTELLERIE_KPIS, "pmc", vide)).toBeCloseTo(100, 9);
  });
});

describe("indicateurs du commerce", () => {
  it("le panier moyen dépasse le prix d'un article (plusieurs articles par ticket)", () => {
    const c = ctx({ result: result({ revenue: 45_000 }), totalUnits: 1000 });
    const panier = valueOf(COMMERCE_KPIS, "panier_moyen", c)!;
    const prixArticle = 45_000 / 1000;
    expect(panier).toBeGreaterThan(prixArticle);
    expect(panier).toBeCloseTo(45 * 1.6, 9);
  });

  it("une rupture de stock fait chuter le taux de transformation", () => {
    const servi = ctx({
      result: result({ segments: { fideles: segment({ demandForCompany: 400, sold: 400 }) } }),
    });
    const rupture = ctx({
      result: result({
        segments: { fideles: segment({ demandForCompany: 400, sold: 250, lost: 150 }) },
      }),
    });
    expect(valueOf(COMMERCE_KPIS, "transformation", servi)).toBeCloseTo(1, 9);
    expect(valueOf(COMMERCE_KPIS, "transformation", rupture)).toBeCloseTo(0.625, 9);
  });

  it("l'attrition mesure la part de marché fidèle perdue, pas la saison", () => {
    // la demande s'effondre de moitié mais le POTENTIEL aussi : personne n'est parti
    const saison = ctx({
      result: result({
        segments: { fideles: segment({ potential: 500, demandForCompany: 150 }) },
      }),
      previousSegments: { fideles: segment({ potential: 1000, demandForCompany: 300 }) },
    });
    expect(valueOf(COMMERCE_KPIS, "attrition", saison)).toBeCloseTo(0, 9);

    // ici le potentiel est stable et la part recule : c'est une vraie attrition
    const perte = ctx({
      result: result({
        segments: { fideles: segment({ potential: 1000, demandForCompany: 240 }) },
      }),
      previousSegments: { fideles: segment({ potential: 1000, demandForCompany: 300 }) },
    });
    expect(valueOf(COMMERCE_KPIS, "attrition", perte)).toBeCloseTo(0.2, 9);
  });

  it("gagner des clients n'affiche jamais une attrition négative", () => {
    const gain = ctx({
      result: result({
        segments: { fideles: segment({ potential: 1000, demandForCompany: 400 }) },
      }),
      previousSegments: { fideles: segment({ potential: 1000, demandForCompany: 300 }) },
    });
    expect(valueOf(COMMERCE_KPIS, "attrition", gain)).toBe(0);
  });

  it("l'attrition est indisponible au premier tour, sans point de comparaison", () => {
    expect(valueOf(COMMERCE_KPIS, "attrition", ctx())).toBeUndefined();
  });
});

describe("indicateurs de la restauration", () => {
  it("le ratio matières isole les denrées du coût variable total", () => {
    // bistrot : 10 € de denrées sur 13 € de coût variable
    const bistrot = scenarioByCode("bistrot").scenario;
    const c = ctx({
      result: result({ revenue: 198_000, cogs: 78_000 }),
      scenario: bistrot,
    });
    const part = 10 / 13;
    expect(valueOf(RESTAURATION_KPIS, "ratio_matieres", c)).toBeCloseTo(
      (78_000 * part) / 198_000,
      9,
    );
    // et l'ordre de grandeur reste celui du métier
    expect(valueOf(RESTAURATION_KPIS, "ratio_matieres", c)!).toBeGreaterThan(0.25);
    expect(valueOf(RESTAURATION_KPIS, "ratio_matieres", c)!).toBeLessThan(0.35);
  });

  it("le ticket moyen rapporte le CA aux couverts servis", () => {
    const c = ctx({ result: result({ revenue: 198_000 }), totalUnits: 6000 });
    expect(valueOf(RESTAURATION_KPIS, "ticket_moyen", c)).toBeCloseTo(33, 9);
  });
});

describe("indicateurs des services", () => {
  it("le taux d'occupation se mesure sur la capacité HUMAINE, pas sur les locaux", () => {
    const c = ctx({
      result: result({ machineCapacity: 1500, laborCapacity: 720 }),
      totalUnits: 540,
    });
    expect(valueOf(SERVICES_KPIS, "taux_occupation", c)).toBeCloseTo(540 / 720, 9);
  });

  it("le DSO convertit les créances en jours de chiffre d'affaires", () => {
    const c = ctx({ result: result({ revenue: 300_000, receivables: 200_000 }), roundDays: 90 });
    expect(valueOf(SERVICES_KPIS, "dso", c)).toBeCloseTo(60, 9);
  });
});

describe("indicateurs de l'industrie", () => {
  it("la marge unitaire est ce que laisse une unité après son coût variable", () => {
    const c = ctx({ result: result({ revenue: 100_000, cogs: 40_000 }), totalUnits: 2000 });
    expect(valueOf(INDUSTRIE_KPIS, "marge_unitaire", c)).toBeCloseTo(30, 9);
  });

  it("l'écoulement du stock s'exprime en jours de ventes", () => {
    const c = ctx({ result: result({ cogs: 90_000, inventoryValue: 30_000 }), roundDays: 90 });
    expect(valueOf(INDUSTRIE_KPIS, "ecoulement_stock", c)).toBeCloseTo(30, 9);
  });
});

describe("robustesse, tous secteurs", () => {
  it("aucun indicateur ne divise par zéro au premier tour", () => {
    const vide = ctx({
      result: result({
        revenue: 0,
        cogs: 0,
        machineCapacity: 0,
        laborCapacity: 0,
        segments: { main: segment({ potential: 0, demandForCompany: 0, sold: 0 }) },
      }),
      segmentUnits: 0,
      totalUnits: 0,
    });
    for (const d of SCENARIOS) {
      for (const kpi of computeSectorKpis(d.kpis, vide)) {
        expect(Number.isFinite(kpi.value), `${d.code}/${kpi.key}`).toBe(true);
      }
    }
  });

  it("chaque secteur expose trois indicateurs, tous nommés et expliqués", () => {
    for (const d of SCENARIOS) {
      expect(d.kpis.length, d.code).toBeGreaterThanOrEqual(3);
      const keys = d.kpis.map((k) => k.key);
      expect(new Set(keys).size, `${d.code} : clés dupliquées`).toBe(keys.length);
      for (const k of d.kpis) {
        expect(k.label.length, `${d.code}/${k.key}`).toBeGreaterThan(3);
        expect(k.hint.length, `${d.code}/${k.key} : sans explication`).toBeGreaterThan(30);
      }
    }
  });
});
