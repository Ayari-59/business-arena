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
const { formatEuro } = await import("@/lib/format");
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
  // Le catalogue de chaque référence (le sien, sinon celui du scénario), tel
  // que la vue le sert — ici affecté d'un monde variable de +5 % sur tous les
  // façonniers, pour vérifier que l'écart affiché reste relatif au référent.
  const catalogue = (p: NonNullable<typeof boutique.scenario.products>[number], facteur = 1) =>
    (p.suppliers ?? boutique.scenario.suppliers ?? []).map((s) => ({
      code: s.code,
      name: s.name,
      narrative: s.narrative,
      costMultiplier: s.costMultiplier * facteur,
      qualityBonus: s.qualityBonus,
      paymentDelayDays: s.paymentDelayDays,
      supplyRiskProbability: s.supplyRiskProbability,
      materialCostPerUnit: Math.round(p.materialCostPerUnit * s.costMultiplier * facteur * 100) / 100,
    }));
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
    suppliers: catalogue(p, 1.05),
    rd: null,
  }));
  const sansFournisseurs: NonNullable<Props["gamme"]> = gamme.map((g) => ({ ...g, suppliers: null }));
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

  it("au niveau 1, sans qualité, ne propose pas de budget qualité par référence", () => {
    const html = rendu(sansFournisseurs);
    expect(html).not.toContain(".qualityBudget");
    expect(html).not.toContain(".supplierChoice");
    // Le scalaire caché reste envoyé : le serveur ne dérive rien des références.
    expect(html).toContain('name="qualityBudget"');
  });

  it("quand le niveau ouvre la qualité et que les références ont des façonniers, les propose par référence", () => {
    const html = rendu(gamme, { enabled: presetByLevel.get(3)!.decisions, suppliersOffer });
    for (const p of gamme) {
      expect(html).toContain(`name="product.${p.code}.qualityBudget"`);
      expect(html).toContain(`name="product.${p.code}.supplierChoice"`);
    }
    // Plus de champ qualité ni de radio fournisseur scalaires : ils seraient
    // ignorés par le serveur et tromperaient l'élève.
    expect(html).not.toContain('name="qualityBudget"');
    expect(html).not.toContain('name="supplierChoice"');
    // Le premier façonnier de chaque catalogue est proposé par défaut.
    expect(html).toContain('<option value="grossiste" selected="">');
  });

  it("chaque référence propose SON catalogue, au prix d'achat de la référence, l'écart lu par rapport à son référent", () => {
    const html = rendu(gamme, { enabled: presetByLevel.get(3)!.decisions });
    // Le mérinos a une filature, pas de déstockeur ; les accessoires ont un
    // tricoteur d'accessoires et leur propre déstockeur.
    expect(html).toContain("Filature mérinos italienne");
    expect(html).toContain("accessoires du Nord");
    // Prix d'achat de LA référence chez le façonnier (bonnet 9,50 × 0,90 × 1,05
    // de monde variable = 8,98 € chez le tricoteur d'accessoires), et écart
    // relatif au façonnier de référence (−10 %, +22 % pour l'atelier local des
    // pulls), quel que soit le facteur du monde variable.
    expect(html).toContain("8,98");
    expect(html).toContain("(−10 %)");
    expect(html).toContain("(+22 %)");
    expect(html).toContain("(coût de référence)");
    expect(html).toContain("(−18 %)");
    expect(html).not.toContain("(+5 %)");
    // La fiche du façonnier dit le délai de règlement, pas un « délai fournisseur ».
    expect(html).toContain("Délai de règlement");
    expect(html).not.toContain("Délai fournisseur");
    // Et le lien avec le prix : achat, coût variable, marge et coefficient.
    expect(html).toContain("coef.");
    expect(html).toContain("marge");
  });

  it("un commerce ne produit rien : pas d'étape « Produire » en gamme, l'entretien rejoint l'approvisionnement", () => {
    const niveau3 = rendu(gamme, { enabled: presetByLevel.get(3)!.decisions });
    expect(niveau3).not.toContain("Produire");
    expect(niveau3).toContain("Entretien · réserve et linéaire");
    expect(niveau3).toContain('name="maintenanceBudget"');
    expect(niveau3).not.toContain("Production · qualité");
    // Le budget d'entretien vit dans la première étape, avec les ventes.
    const etapeEntretien = niveau3.indexOf('name="maintenanceBudget"');
    const etapeSuivante = niveau3.indexOf('data-etape="1"');
    expect(etapeEntretien).toBeGreaterThan(0);
    expect(etapeEntretien).toBeLessThan(etapeSuivante);
    // Niveau 1 : ni qualité ni entretien ouverts, les scalaires cachés partent quand même.
    const niveau1 = rendu(gamme);
    expect(niveau1).not.toContain("Produire");
    expect(niveau1).toContain('type="hidden" name="qualityBudget"');
    expect(niveau1).toContain('type="hidden" name="maintenanceBudget"');
    // Mono-produit : l'étape « Produire » est toujours là.
    expect(rendu(null, { enabled: presetByLevel.get(3)!.decisions })).toContain("Produire");
  });

  it("en mono-produit, la qualité et le fournisseur restent des champs d'entreprise, l'écart relatif au référent", () => {
    const majore = suppliersOffer.map((s) => ({ ...s, costMultiplier: s.costMultiplier * 1.05 }));
    const html = rendu(null, { enabled: presetByLevel.get(3)!.decisions, suppliersOffer: majore });
    expect(html).toContain('name="qualityBudget"');
    expect(html).toContain('name="supplierChoice"');
    expect(html).not.toContain("product.");
    expect(html).toContain("(coût de référence)");
    expect(html).toContain("(−18 %)");
    expect(html).not.toContain("+5 %");
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

describe("la R&D par référence", () => {
  type Props = Parameters<typeof DecisionForm>[0];
  const boutique = scenarioByCode("boutique");
  const gammeRd: NonNullable<Props["gamme"]> = boutique.scenario.products!.map((p, i) => ({
    code: p.code,
    name: p.name,
    materialCostPerUnit: p.materialCostPerUnit,
    otherVariableCostPerUnit: p.otherVariableCostPerUnit,
    hoursPerUnit: p.hoursPerUnit,
    refPrice: p.market.segments[0]!.refPrice,
    segments: p.market.segments.map((s) => ({ code: s.code, name: s.name })),
    seasonCoef: 1,
    stock: 0,
    suppliers: null,
    // Le mérinos (i = 2) est à développer : 40 000 €, 12 000 déjà engagés.
    rd: {
      techLevel: 0,
      development:
        i === 2
          ? { cost: 40000, availableFromRound: 2, invested: 12000, available: false, launchRound: null }
          : null,
    },
  }));
  const defaults: Props["defaults"] = {
    price: 50,
    productionPlan: 4400,
    marketingBudget: 4500,
    qualityBudget: 0,
    maintenanceBudget: 0,
    rdBudget: 0,
    products: Object.fromEntries(
      gammeRd.map((g) => [g.code, { price: g.refPrice, productionPlan: 500, marketingBudget: 900, rdBudget: 0 }]),
    ),
  };
  const rendu = (extra: Partial<Props> = {}) =>
    renderToStaticMarkup(
      createElement(DecisionForm, {
        gameId: "partie-test",
        roundIndex: 1,
        periodName: "tour 1",
        defaults,
        kind: "class",
        alreadySubmitted: false,
        enabled: presetByLevel.get(4)!.decisions,
        vocabulary: boutique.vocabulary,
        gamme: gammeRd,
        rdOffer: { techScale: 10000 },
        ...extra,
      }),
    );

  it("au niveau qui ouvre la R&D, chaque référence porte son budget, et la référence en développement ne se vend pas", () => {
    const html = rendu();
    expect(html).toContain('name="product.pull-col-rond.rdBudget"');
    expect(html).toContain('name="product.pull-merinos.rdBudget"');
    // La référence en développement : pas de saisie de volume, un champ caché à zéro.
    expect(html).toContain("en développement");
    expect(html).toContain('name="product.pull-merinos.productionPlan" value="0"');
    expect(html).toContain(`${formatEuro(12000)} engagés sur ${formatEuro(40000)}`);
    expect(html).toContain(`il reste ${formatEuro(28000)} à financer`);
    // Les autres références gardent leur saisie normale.
    expect(html).toContain('name="product.pull-col-rond.productionPlan" value="500"');
  });

  it("au niveau qui ne l'ouvre pas, aucun champ R&D ; sans levier dans le scénario non plus", () => {
    const ferme = rendu({ enabled: presetByLevel.get(3)!.decisions });
    expect(ferme).not.toContain("rdBudget");
    const sansLevier = rendu({ rdOffer: null });
    expect(sansLevier).not.toContain("rdBudget");
  });

  it("l'action relit la R&D de chaque référence et en dérive le scalaire", async () => {
    const champs: Record<string, string> = {};
    for (const g of gammeRd) {
      champs[`product.${g.code}.price`] = String(g.refPrice);
      champs[`product.${g.code}.productionPlan`] = g.code === "pull-merinos" ? "0" : "500";
      champs[`product.${g.code}.marketingBudget`] = "900";
      champs[`product.${g.code}.rdBudget`] = g.code === "pull-merinos" ? "28000" : "0";
    }
    champs.maintenanceBudget = "0";
    const products = readProductFields(formulaire(champs).entries());
    expect(products!["pull-merinos"]!.rdBudget).toBe(28000);
    expect(products!["bonnet"]!.rdBudget).toBe(0);
    expect(scalarsOfGamme(products!).rdBudget).toBe(28000);
  });
});
