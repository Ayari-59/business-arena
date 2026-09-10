import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * GAMME : LE FORMULAIRE DÉCIDE RÉFÉRENCE PAR RÉFÉRENCE.
 *
 * Un scénario à gamme n'a plus « un prix et un volume » : il en a un par
 * produit. Le formulaire les envoie sous `product.<code>.*`, l'action serveur
 * en dérive les scalaires historiques (plan = somme, prix = moyenne pondérée,
 * marketing = somme) et transmet le détail au moteur. Mono-produit : rien ne
 * change, les champs scalaires font foi.
 */

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => "invite-1" }));
vi.mock("@/services/pedagogy.service", () => ({
  submitDiagnosis: vi.fn(),
  submitQuiz: vi.fn(),
  unlockHint: vi.fn(),
}));
vi.mock("@/services/game.service", () => ({
  getGameKind: vi.fn(async () => "class"),
  getGameVocabulary: vi.fn(async () => ({
    productionPlanLabel: "Articles à mettre en rayon",
    units: "articles",
    unit: "article",
    priceLabel: "Prix de vente",
  })),
  nommerEquipe: vi.fn(),
  resolveCurrentRound: vi.fn(),
  submitTeamDecisions: vi.fn(async () => ({ roundIndex: 1 })),
}));
vi.mock("@/app/arena/[gameId]/actions", async (importOriginal) => importOriginal());

const { playRoundAction } = await import("@/app/arena/[gameId]/actions");
const { submitTeamDecisions } = await import("@/services/game.service");
const { readProductFields, productFieldName } = await import("@/config/decision-source");
const { scalarsOfGamme } = await import("@/engine/gamme");
const { DecisionForm } = await import("@/components/decision-form");
const { presetByLevel } = await import("@/config/difficulty");
const { scenarioByCode } = await import("@/config/scenarios/registry");
const { auPas } = await import("@/services/decision-baseline");

function formulaire(champs: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) fd.set(k, v);
  return fd;
}

const BASE = { qualityBudget: "0", maintenanceBudget: "0" };

describe("lecture des champs par produit", () => {
  it("nomme et relit les champs d'une référence", () => {
    expect(productFieldName("bonnet", "price")).toBe("product.bonnet.price");
    const products = readProductFields(
      formulaire({
        "product.pull-col-rond.price": "59",
        "product.pull-col-rond.productionPlan": "1500",
        "product.pull-col-rond.marketingBudget": "3000",
        "product.bonnet.price": "25",
        "product.bonnet.productionPlan": "850",
        "product.bonnet.marketingBudget": "1000",
        price: "999",
      }).entries(),
    );
    expect(products).toEqual({
      "pull-col-rond": { price: 59, productionPlan: 1500, marketingBudget: 3000 },
      bonnet: { price: 25, productionPlan: 850, marketingBudget: 1000 },
    });
  });

  it("sans champ par produit, ne renvoie rien (mono-produit)", () => {
    expect(readProductFields(formulaire({ price: "59", productionPlan: "100" }).entries())).toBeUndefined();
  });

  it("relit la qualité et le fournisseur d'une référence, et ignore un fournisseur vide", () => {
    expect(productFieldName("bonnet", "qualityBudget")).toBe("product.bonnet.qualityBudget");
    expect(productFieldName("bonnet", "supplierChoice")).toBe("product.bonnet.supplierChoice");
    const products = readProductFields(
      formulaire({
        "product.bonnet.price": "25",
        "product.bonnet.productionPlan": "850",
        "product.bonnet.qualityBudget": "1 200",
        "product.bonnet.supplierChoice": "createur",
        "product.echarpe.price": "35",
        "product.echarpe.productionPlan": "600",
        "product.echarpe.supplierChoice": "",
      }).entries(),
    );
    expect(products!.bonnet).toEqual({ price: 25, productionPlan: 850, qualityBudget: NaN, supplierChoice: "createur" });
    expect(products!.echarpe).toEqual({ price: 35, productionPlan: 600 });
  });

  it("dérive la qualité (somme) et le fournisseur (celui du plan le plus fort) quand les références les portent", () => {
    const s = scalarsOfGamme({
      a: { price: 100, productionPlan: 300, qualityBudget: 1000, supplierChoice: "grossiste" },
      b: { price: 50, productionPlan: 900, qualityBudget: 500, supplierChoice: "createur" },
    });
    expect(s.qualityBudget).toBe(1500);
    expect(s.supplierChoice).toBe("createur");
    // Sans qualité ni fournisseur par référence : rien n'est dérivé, les
    // champs scalaires du formulaire font foi.
    const sans = scalarsOfGamme({ a: { price: 100, productionPlan: 300 }, b: { price: 50, productionPlan: 900 } });
    expect(sans.qualityBudget).toBeUndefined();
    expect(sans.supplierChoice).toBeUndefined();
  });

  it("dérive les scalaires : plan = somme, prix = moyenne pondérée, marketing = somme", () => {
    const s = scalarsOfGamme({
      a: { price: 100, productionPlan: 300, marketingBudget: 1000 },
      b: { price: 50, productionPlan: 100, marketingBudget: 500 },
    });
    expect(s.productionPlan).toBe(400);
    expect(s.marketingBudget).toBe(1500);
    expect(s.price).toBeCloseTo((100 * 300 + 50 * 100) / 400, 9);
    // Plans nuls : simple moyenne, jamais une division par zéro.
    expect(scalarsOfGamme({ a: { price: 10, productionPlan: 0 }, b: { price: 30, productionPlan: 0 } }).price).toBe(20);
  });
});

describe("l'action serveur en gamme", () => {
  it("transmet le détail par produit et les scalaires dérivés", async () => {
    vi.mocked(submitTeamDecisions).mockClear();
    const etat = await playRoundAction(
      "partie",
      { error: null },
      formulaire({
        ...BASE,
        "product.pull-col-rond.price": "59",
        "product.pull-col-rond.productionPlan": "1500",
        "product.pull-col-rond.marketingBudget": "3000",
        "product.bonnet.price": "25",
        "product.bonnet.productionPlan": "500",
        "product.bonnet.marketingBudget": "1000",
      }),
    );
    expect(etat.error).toBeNull();
    expect(submitTeamDecisions).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(submitTeamDecisions).mock.calls[0]![0].payload;
    expect(payload.products).toEqual({
      "pull-col-rond": { price: 59, productionPlan: 1500, marketingBudget: 3000 },
      bonnet: { price: 25, productionPlan: 500, marketingBudget: 1000 },
    });
    expect(payload.productionPlan).toBe(2000);
    expect(payload.marketingBudget).toBe(4000);
    expect(payload.price).toBeCloseTo((59 * 1500 + 25 * 500) / 2000, 9);
  });

  it("transmet la qualité et le fournisseur de chaque référence, et en dérive les scalaires", async () => {
    vi.mocked(submitTeamDecisions).mockClear();
    const etat = await playRoundAction(
      "partie",
      { error: null },
      formulaire({
        maintenanceBudget: "0",
        // Le champ scalaire est absent : la qualité vient des références.
        "product.pull-col-rond.price": "59",
        "product.pull-col-rond.productionPlan": "1500",
        "product.pull-col-rond.marketingBudget": "3000",
        "product.pull-col-rond.qualityBudget": "2000",
        "product.pull-col-rond.supplierChoice": "grossiste",
        "product.bonnet.price": "25",
        "product.bonnet.productionPlan": "500",
        "product.bonnet.marketingBudget": "1000",
        "product.bonnet.qualityBudget": "500",
        "product.bonnet.supplierChoice": "createur",
      }),
    );
    expect(etat.error).toBeNull();
    const payload = vi.mocked(submitTeamDecisions).mock.calls[0]![0].payload;
    expect(payload.products!["pull-col-rond"]).toEqual({
      price: 59,
      productionPlan: 1500,
      marketingBudget: 3000,
      qualityBudget: 2000,
      supplierChoice: "grossiste",
    });
    expect(payload.products!.bonnet!.supplierChoice).toBe("createur");
    expect(payload.qualityBudget).toBe(2500);
    expect(payload.supplierChoice).toBe("grossiste");
  });

  it("refuse une gamme dont tous les volumes sont nuls, dans la langue du secteur", async () => {
    vi.mocked(submitTeamDecisions).mockClear();
    const etat = await playRoundAction(
      "partie",
      { error: null },
      formulaire({
        ...BASE,
        "product.pull-col-rond.price": "59",
        "product.pull-col-rond.productionPlan": "0",
        "product.bonnet.price": "25",
        "product.bonnet.productionPlan": "0",
      }),
    );
    expect(etat.error).toContain("Articles à mettre en rayon");
    expect(submitTeamDecisions).not.toHaveBeenCalled();
  });

  it("refuse un prix illisible sur une référence", async () => {
    vi.mocked(submitTeamDecisions).mockClear();
    const etat = await playRoundAction(
      "partie",
      { error: null },
      formulaire({
        ...BASE,
        "product.pull-col-rond.price": "",
        "product.pull-col-rond.productionPlan": "100",
      }),
    );
    expect(etat.error).toContain("invalides");
    expect(submitTeamDecisions).not.toHaveBeenCalled();
  });
});

describe("le formulaire en gamme", () => {
  type Props = Parameters<typeof DecisionForm>[0];
  const boutique = scenarioByCode("boutique");
  const gamme: NonNullable<Props["gamme"]> = boutique.scenario.products!.map((p) => ({
    code: p.code,
    name: p.name,
    materialCostPerUnit: p.materialCostPerUnit,
    otherVariableCostPerUnit: p.otherVariableCostPerUnit,
    hoursPerUnit: p.hoursPerUnit,
    refPrice: p.market.segments[0]!.refPrice,
    segments: p.market.segments.map((s) => ({ code: s.code, name: s.name })),
    seasonCoef: 1,
    stock: 0,
  }));
  const defaults: Props["defaults"] = {
    price: 50,
    productionPlan: 4400,
    marketingBudget: 4500,
    qualityBudget: 0,
    maintenanceBudget: 0,
    products: {
      "pull-col-rond": { price: 59, productionPlan: 1500, marketingBudget: 900 },
      cardigan: { price: 79, productionPlan: 700, marketingBudget: 900 },
      "pull-merinos": { price: 129, productionPlan: 350, marketingBudget: 900 },
      echarpe: { price: 35, productionPlan: 1000, marketingBudget: 900 },
      bonnet: { price: 25, productionPlan: 850, marketingBudget: 900 },
    },
  };
  const suppliersOffer: NonNullable<Props["suppliersOffer"]> = boutique.scenario.suppliers!.map((s) => ({
    code: s.code,
    name: s.name,
    narrative: s.narrative,
    costMultiplier: s.costMultiplier,
    qualityBonus: s.qualityBonus,
    paymentDelayDays: s.paymentDelayDays,
    supplyRiskProbability: s.supplyRiskProbability,
    materialCostPerUnit: 20,
  }));
  const rendu = (g: Props["gamme"], extra: Partial<Props> = {}) =>
    renderToStaticMarkup(
      createElement(DecisionForm, {
        gameId: "partie-test",
        roundIndex: 1,
        periodName: "tour 1",
        defaults,
        kind: "class",
        alreadySubmitted: false,
        enabled: presetByLevel.get(1)!.decisions,
        vocabulary: boutique.vocabulary,
        gamme: g,
        ...extra,
      }),
    );

  it("propose un prix, un volume et un marketing par référence, et aucun scalaire", () => {
    const html = rendu(gamme);
    for (const p of gamme) {
      expect(html).toContain(`name="product.${p.code}.price"`);
      expect(html).toContain(`name="product.${p.code}.productionPlan"`);
      expect(html).toContain(`name="product.${p.code}.marketingBudget"`);
      expect(html).toContain(p.name);
    }
    expect(html).not.toContain('name="price"');
    expect(html).not.toContain('name="productionPlan"');
    expect(html).not.toContain('name="marketingBudget"');
    // Les valeurs proposées de chaque référence sont bien celles du produit.
    expect(html).toContain('name="product.pull-merinos.price" value="129"');
    expect(html).toContain('aria-label="Prix de vente · Pull mérinos premium"');
  });

  it("au niveau 1, sans qualité ni fournisseur, ne propose ni l'une ni l'autre par référence", () => {
    const html = rendu(gamme);
    expect(html).not.toContain(".qualityBudget");
    expect(html).not.toContain(".supplierChoice");
    // Le scalaire caché reste envoyé : le serveur ne dérive rien des références.
    expect(html).toContain('name="qualityBudget"');
  });

  it("quand le niveau ouvre la qualité et que le scénario a des fournisseurs, les propose par référence", () => {
    const html = rendu(gamme, { enabled: presetByLevel.get(3)!.decisions, suppliersOffer });
    for (const p of gamme) {
      expect(html).toContain(`name="product.${p.code}.qualityBudget"`);
      expect(html).toContain(`name="product.${p.code}.supplierChoice"`);
    }
    // Plus de champ qualité ni de radio fournisseur scalaires : ils seraient
    // ignorés par le serveur et tromperaient l'élève.
    expect(html).not.toContain('name="qualityBudget"');
    expect(html).not.toContain('name="supplierChoice"');
    // Chaque référence propose les trois façonniers, le premier par défaut.
    expect(html).toContain("Atelier de tricotage local");
    expect(html).toContain('<option value="grossiste" selected="">');
  });

  it("en mono-produit, la qualité et le fournisseur restent des champs d'entreprise", () => {
    const html = rendu(null, { enabled: presetByLevel.get(3)!.decisions, suppliersOffer });
    expect(html).toContain('name="qualityBudget"');
    expect(html).toContain('name="supplierChoice"');
    expect(html).not.toContain("product.");
  });

  it("en mono-produit, le formulaire n'a pas changé", () => {
    const html = rendu(null);
    expect(html).toContain('name="price"');
    expect(html).toContain('name="productionPlan"');
    expect(html).not.toContain("product.");
  });
});

describe("la proposition mise au pas en gamme", () => {
  it("arrondit chaque référence et redérive les scalaires des produits", () => {
    const d = auPas({
      price: 999,
      productionPlan: 1,
      marketingBudget: 1,
      qualityBudget: 10.4,
      maintenanceBudget: 20.6,
      products: {
        a: { price: 59.96, productionPlan: 1499.6, marketingBudget: 2999.5 },
        b: { price: 25.04, productionPlan: 500.4, marketingBudget: 1000.4 },
      },
    });
    expect(d.products).toEqual({
      a: { price: 60, productionPlan: 1500, marketingBudget: 3000 },
      b: { price: 25, productionPlan: 500, marketingBudget: 1000 },
    });
    expect(d.productionPlan).toBe(2000);
    expect(d.marketingBudget).toBe(4000);
    expect(d.price).toBeCloseTo(Math.round(((60 * 1500 + 25 * 500) / 2000) * 10) / 10, 9);
    // Sans qualité par référence, le scalaire est simplement arrondi.
    expect(d.qualityBudget).toBe(10);
  });

  it("arrondit la qualité de chaque référence, garde son fournisseur, et redérive les scalaires", () => {
    const d = auPas({
      price: 999,
      productionPlan: 1,
      marketingBudget: 1,
      qualityBudget: 1,
      maintenanceBudget: 0,
      supplierChoice: "grossiste",
      products: {
        a: { price: 60, productionPlan: 1500, qualityBudget: 1999.6, supplierChoice: "createur" },
        b: { price: 25, productionPlan: 500, qualityBudget: 500.4, supplierChoice: "grossiste" },
      },
    });
    expect(d.products!.a).toEqual({ price: 60, productionPlan: 1500, qualityBudget: 2000, supplierChoice: "createur" });
    expect(d.qualityBudget).toBe(2500);
    expect(d.supplierChoice).toBe("createur");
  });
});
