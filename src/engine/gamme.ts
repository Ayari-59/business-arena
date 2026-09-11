import type {
  CompanyState,
  EngineScenarioConfig,
  ProductCode,
  ProductDecisions,
  ProductDef,
  ProductDevelopmentDef,
  ProductRdState,
  RoundDecisions,
  SegmentConfig,
  SupplierDef,
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
  /** Catalogue de fournisseurs propre à la référence (absent : celui du scénario). */
  suppliers?: SupplierDef[];
  /** La référence est à développer avant d'être vendue (gamme seulement). */
  development?: ProductDevelopmentDef;
}

/**
 * Le catalogue de fournisseurs d'une référence : le sien, sinon celui du
 * scénario, sinon aucun (le coût matières est alors le coût de référence).
 */
export function suppliersOf(
  product: Pick<GammeProduct, "suppliers">,
  scenario: Pick<EngineScenarioConfig, "suppliers">,
): SupplierDef[] | null {
  const catalogue = product.suppliers ?? scenario.suppliers;
  return catalogue && catalogue.length > 0 ? catalogue : null;
}

/**
 * L'état R&D d'ouverture d'une référence : celui de l'entreprise, sinon le
 * point de départ (rien d'investi, rien de lancé). `null` sans levier R&D.
 */
export function rdOpeningOf(
  scenario: Pick<EngineScenarioConfig, "rd">,
  state: Pick<CompanyState, "rdByProduct">,
  code: ProductCode,
): ProductRdState | null {
  if (!scenario.rd) return null;
  return state.rdByProduct?.[code] ?? { invested: 0, launched: false, techLevel: 0 };
}

/**
 * Une référence est-elle vendable ce tour ? Sans développement à faire, ou
 * sans levier R&D : toujours. Sinon, une fois lancée, ou dès que la R&D
 * cumulée des tours PASSÉS couvre son coût et que son tour de disponibilité
 * est atteint — le lancement suit donc le tour qui a couvert le coût.
 */
export function isProductAvailable(
  product: Pick<GammeProduct, "development">,
  rd: ProductRdState | null,
  roundIndex: number,
): boolean {
  const dev = product.development;
  if (!dev || !rd) return true;
  return rd.launched || (rd.invested >= dev.cost && roundIndex >= (dev.availableFromRound ?? 1));
}

/** Décisions d'un produit, alignées sur l'ordre de la gamme. */
export interface GammeDecision {
  price: number;
  productionPlan: number;
  marketingBudget: number;
  qualityBudget: number;
  supplierChoice?: string;
  /** Budget R&D de la référence (0 sans levier R&D). */
  rdBudget: number;
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
    ...(p.suppliers ? { suppliers: p.suppliers } : {}),
    ...(p.development ? { development: p.development } : {}),
  }));
}

/**
 * Le scénario SANS levier R&D : bloc `rd` retiré, références livrées prêtes
 * (plus rien à développer). C'est le scénario qu'une partie joue quand son
 * niveau n'ouvre pas la R&D, et celui que le cockpit d'un tel atelier doit
 * prévoir. Sans bloc `rd`, le scénario est rendu tel quel.
 */
export function withoutRd(scenario: EngineScenarioConfig): EngineScenarioConfig {
  if (!scenario.rd) return scenario;
  const { rd: _rd, ...rest } = scenario;
  void _rd;
  return {
    ...rest,
    ...(scenario.products
      ? {
          products: scenario.products.map((p) => {
            const { development: _dev, ...produit } = p;
            void _dev;
            return produit;
          }),
        }
      : {}),
  };
}

/**
 * Applique une transformation de segment à TOUS les marchés du scénario : le
 * marché du scénario et, en gamme, celui de chaque produit. Les variantes
 * dérivées à la création d'une partie (dimensionnement de classe, périodicité,
 * monde variable, surcharges enseignantes) ne touchaient que `market` : en
 * gamme, les segments des produits — les seuls que le moteur simule — auraient
 * gardé leur taille de calibration. Mono-produit : seul `market` bouge et la
 * clé `products` n'est jamais émise.
 */
export function mapGammeSegments(
  scenario: EngineScenarioConfig,
  fn: (segment: SegmentConfig) => SegmentConfig,
): EngineScenarioConfig {
  return {
    ...scenario,
    market: { ...scenario.market, segments: scenario.market.segments.map(fn) },
    ...(scenario.products
      ? {
          products: scenario.products.map((p) => ({
            ...p,
            market: { ...p.market, segments: p.market.segments.map(fn) },
          })),
        }
      : {}),
  };
}

/**
 * Les décisions par produit, dans l'ordre de la gamme, à partir des décisions
 * DÉJÀ BORNÉES du tour (prix, plan, marketing et qualité ≥ 0). Mono-produit :
 * on recopie les scalaires. Gamme : l'entrée `products[code]` fait foi ; un
 * produit sans entrée reçoit le prix et le fournisseur scalaires et une part
 * égale du plan, du marketing et de la qualité scalaires — c'est ce qui permet
 * à un bot ou à une reconduction mono-produit de jouer une gamme sans la
 * connaître.
 */
export function toGammeDecisions(
  decisions: Pick<
    RoundDecisions,
    "price" | "productionPlan" | "marketingBudget" | "qualityBudget" | "supplierChoice" | "products" | "rdBudget"
  >,
  gamme: GammeProduct[],
): GammeDecision[] {
  if (gamme.length === 1) {
    return [
      {
        price: decisions.price,
        productionPlan: decisions.productionPlan,
        marketingBudget: decisions.marketingBudget,
        qualityBudget: decisions.qualityBudget,
        ...(decisions.supplierChoice !== undefined ? { supplierChoice: decisions.supplierChoice } : {}),
        rdBudget: Math.max(0, decisions.rdBudget ?? 0),
      },
    ];
  }
  const n = gamme.length;
  return gamme.map((p) => {
    const own = decisions.products?.[p.code];
    const supplierChoice = own?.supplierChoice ?? decisions.supplierChoice;
    return {
      price: Math.max(0, own?.price ?? decisions.price),
      productionPlan: Math.max(0, own?.productionPlan ?? decisions.productionPlan / n),
      marketingBudget: Math.max(0, own?.marketingBudget ?? decisions.marketingBudget / n),
      qualityBudget: Math.max(0, own?.qualityBudget ?? decisions.qualityBudget / n),
      ...(supplierChoice !== undefined ? { supplierChoice } : {}),
      rdBudget: Math.max(0, own?.rdBudget ?? (decisions.rdBudget ?? 0) / n),
    };
  });
}

/**
 * Les scalaires d'une décision à gamme, dérivés des décisions par produit :
 * le plan est la somme des plans, le marketing et la qualité la somme des
 * budgets, le prix la moyenne des prix pondérée par les plans (simple moyenne
 * si tous les plans sont nuls), le fournisseur celui de la référence au plan
 * le plus fort. La qualité et le fournisseur ne sont dérivés que si au moins
 * une référence les porte (sinon les champs scalaires du formulaire font
 * foi). Le formulaire et l'action serveur en font le MÊME usage — c'est ce
 * qui permet de comparer une saisie à la proposition sur les pivots
 * historiques (`price`, `productionPlan`) sans connaître la gamme.
 */
export function scalarsOfGamme(
  products: Record<
    ProductCode,
    Pick<ProductDecisions, "price" | "productionPlan" | "marketingBudget" | "qualityBudget" | "supplierChoice" | "rdBudget">
  >,
): Pick<RoundDecisions, "price" | "productionPlan" | "marketingBudget"> & {
  qualityBudget?: number;
  supplierChoice?: string;
  /** Somme des budgets R&D, dérivée seulement si une référence en porte un. */
  rdBudget?: number;
} {
  const entries = Object.values(products);
  const productionPlan = entries.reduce((s, p) => s + Math.max(0, p.productionPlan), 0);
  const marketingBudget = entries.reduce((s, p) => s + Math.max(0, p.marketingBudget ?? 0), 0);
  const price =
    productionPlan > 0
      ? entries.reduce((s, p) => s + p.price * Math.max(0, p.productionPlan), 0) / productionPlan
      : entries.length > 0
        ? entries.reduce((s, p) => s + p.price, 0) / entries.length
        : 0;
  const withQuality = entries.filter((p) => p.qualityBudget !== undefined);
  const qualityBudget =
    withQuality.length > 0
      ? withQuality.reduce((s, p) => s + Math.max(0, p.qualityBudget ?? 0), 0)
      : undefined;
  const withSupplier = entries.filter((p) => p.supplierChoice !== undefined);
  const supplierChoice =
    withSupplier.length > 0
      ? withSupplier.reduce((best, p) =>
          Math.max(0, p.productionPlan) > Math.max(0, best.productionPlan) ? p : best,
        ).supplierChoice
      : undefined;
  const withRd = entries.filter((p) => p.rdBudget !== undefined);
  const rdBudget =
    withRd.length > 0 ? withRd.reduce((s, p) => s + Math.max(0, p.rdBudget ?? 0), 0) : undefined;
  return {
    price,
    productionPlan,
    marketingBudget,
    ...(qualityBudget !== undefined ? { qualityBudget } : {}),
    ...(supplierChoice !== undefined ? { supplierChoice } : {}),
    ...(rdBudget !== undefined ? { rdBudget } : {}),
  };
}

/**
 * La référence sur laquelle porte une commande exceptionnelle : celle que
 * l'offre nomme (`productCode`), sinon la première de la gamme (mono : le
 * seul produit). Un code inconnu retombe sur la première.
 */
export function offerProductIndex(
  gamme: readonly { code: string }[],
  offer: { productCode?: string } | null | undefined,
): number {
  if (!offer?.productCode) return 0;
  const k = gamme.findIndex((p) => p.code === offer.productCode);
  return k >= 0 ? k : 0;
}
