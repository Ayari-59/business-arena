import type {
  EngineScenarioConfig,
  ProductCode,
  ProductDef,
  RoundDecisions,
} from "./types";

/**
 * LA GAMME : le moteur ne raisonne plus sur « le produit » mais sur une liste
 * de produits, chacun avec son marché. Un scénario mono-produit (les neuf
 * secteurs historiques) devient une gamme d'UN produit dont le marché est
 * celui du scénario ; un scénario à gamme déclare ses produits et leurs
 * marchés. Tout ce qui suit est une normalisation PURE : aucun calcul, aucun
 * tirage, aucune allocation — le comportement mono-produit doit rester
 * identique au bit près, ce que garantissent trois choix :
 *
 *  - le marché du produit unique EST l'objet `scenario.market` (même
 *    référence, même ordre de segments) ;
 *  - les décisions du produit unique sont les scalaires déjà bornés par le
 *    moteur, sans division ni recomposition (x / 1 vaut exactement x, mais on
 *    ne s'y fie même pas : on recopie) ;
 *  - un scénario sans `products` ne produit jamais de champ « par produit ».
 */

/** Un produit normalisé : coûts, main-d'œuvre et marché COMPLET (sans défaut). */
export interface GammeProduct {
  code: ProductCode;
  name: string;
  materialCostPerUnit: number;
  otherVariableCostPerUnit: number;
  hoursPerUnit: number;
  market: EngineScenarioConfig["market"];
}

/** Décisions d'un produit, alignées sur l'ordre de la gamme. */
export interface GammeDecision {
  price: number;
  productionPlan: number;
  marketingBudget: number;
}

/** Le scénario simule-t-il une gamme (≥ 2 produits) ? */
export function isMultiProduct(scenario: EngineScenarioConfig): boolean {
  return (scenario.products?.length ?? 0) > 1;
}

/**
 * La gamme normalisée du scénario. Mono-produit : un seul produit, dont le
 * marché est `scenario.market` lui-même. Gamme : chaque produit reçoit un
 * marché complet, les réglages absents retombant sur ceux du scénario.
 */
export function toGamme(scenario: EngineScenarioConfig): GammeProduct[] {
  if (!isMultiProduct(scenario)) {
    return [
      {
        code: scenario.product.code,
        name: scenario.product.code,
        materialCostPerUnit: scenario.product.materialCostPerUnit,
        otherVariableCostPerUnit: scenario.product.otherVariableCostPerUnit,
        hoursPerUnit: scenario.product.hoursPerUnit,
        market: scenario.market,
      },
    ];
  }
  return scenario.products!.map((p: ProductDef) => ({
    code: p.code,
    name: p.name,
    materialCostPerUnit: p.materialCostPerUnit,
    otherVariableCostPerUnit: p.otherVariableCostPerUnit,
    hoursPerUnit: p.hoursPerUnit,
    market: {
      segments: p.market.segments,
      seasonality: p.market.seasonality ?? scenario.market.seasonality,
      outsideAttraction: p.market.outsideAttraction ?? scenario.market.outsideAttraction,
      competitionIntensity:
        p.market.competitionIntensity ?? scenario.market.competitionIntensity,
    },
  }));
}

/**
 * Les décisions par produit, dans l'ordre de la gamme, à partir des décisions
 * DÉJÀ BORNÉES du tour (prix, plan et marketing ≥ 0). Mono-produit : on
 * recopie les scalaires. Gamme : l'entrée `products[code]` fait foi ; un
 * produit sans entrée reçoit le prix scalaire et une part égale du plan et du
 * marketing scalaires — c'est ce qui permet à un bot ou à une reconduction
 * mono-produit de jouer une gamme sans la connaître.
 */
export function toGammeDecisions(
  decisions: Pick<RoundDecisions, "price" | "productionPlan" | "marketingBudget" | "products">,
  gamme: GammeProduct[],
): GammeDecision[] {
  if (gamme.length === 1) {
    return [
      {
        price: decisions.price,
        productionPlan: decisions.productionPlan,
        marketingBudget: decisions.marketingBudget,
      },
    ];
  }
  const n = gamme.length;
  return gamme.map((p) => {
    const own = decisions.products?.[p.code];
    return {
      price: Math.max(0, own?.price ?? decisions.price),
      productionPlan: Math.max(0, own?.productionPlan ?? decisions.productionPlan / n),
      marketingBudget: Math.max(0, own?.marketingBudget ?? decisions.marketingBudget / n),
    };
  });
}
