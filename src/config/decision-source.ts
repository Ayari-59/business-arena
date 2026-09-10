import type { ProductCode, ProductDecisions, RoundDecisions } from "@/engine/types";

/**
 * D'où viennent les valeurs d'une décision.
 *
 * Constaté en production : prix et volume sont requis et pré-remplis avec les
 * valeurs neutres du secteur ; une équipe validait sans y toucher et rien ne
 * la distinguait d'une équipe qui avait décidé. Le BPI récompensait le clic.
 *
 * Deux champs PIVOTS par secteur : le prix, et le volume (plan de production,
 * chambres ouvertes, jours de conseil vendus…). Les clés moteur sont les mêmes
 * partout, `price` et `productionPlan` ; c'est le vocabulaire du secteur qui
 * les nomme. Pour chacun, trois sources possibles :
 * - `edited`  : l'équipe a changé la valeur proposée ;
 * - `default` : l'équipe a validé la valeur proposée telle quelle ;
 * - `carried` : personne n'a validé, la clôture a reconduit le tour précédent.
 */

export const PIVOT_FIELDS = ["price", "productionPlan"] as const;
export type PivotField = (typeof PIVOT_FIELDS)[number];

export type DecisionSource = "default" | "edited" | "carried";
export type DecisionSourceMap = Record<PivotField, DecisionSource>;

export interface PivotFieldInfo {
  key: PivotField;
  label: string;
}

/** Les pivots nommés dans la langue du secteur. */
export function pivotFieldsFor(vocabulary: {
  priceLabel: string;
  productionPlanLabel: string;
}): PivotFieldInfo[] {
  return [
    { key: "price", label: vocabulary.priceLabel },
    { key: "productionPlan", label: vocabulary.productionPlanLabel },
  ];
}

/**
 * Le prix avance par pas de 0,1 et le volume par pas de 1 dans le formulaire :
 * une valeur proposée décimale y est arrondie avant d'être affichée. La
 * comparaison se fait donc au pas, pas au centime.
 */
const PAS: Record<PivotField, number> = { price: 0.1, productionPlan: 1 };

export function memeValeur(champ: PivotField, a: number, b: number): boolean {
  const pas = PAS[champ];
  return Math.round(a / pas) === Math.round(b / pas);
}

/** Les pivots que l'équipe n'a pas touchés, comparés aux valeurs proposées. */
export function pivotsNonTouches(
  saisie: Pick<RoundDecisions, PivotField>,
  proposees: Pick<RoundDecisions, PivotField>,
): PivotField[] {
  return PIVOT_FIELDS.filter((champ) => memeValeur(champ, saisie[champ], proposees[champ]));
}

/** La source de chaque pivot d'une décision validée par l'équipe. */
export function decisionSourceOf(
  payload: Pick<RoundDecisions, PivotField>,
  proposees: Pick<RoundDecisions, PivotField>,
): DecisionSourceMap {
  const intacts = new Set(pivotsNonTouches(payload, proposees));
  return {
    price: intacts.has("price") ? "default" : "edited",
    productionPlan: intacts.has("productionPlan") ? "default" : "edited",
  };
}

/** La source d'une décision reconduite par la clôture : rien n'a été décidé. */
export const SOURCE_RECONDUITE: DecisionSourceMap = {
  price: "carried",
  productionPlan: "carried",
};

/** Vrai quand l'équipe a validé les deux pivots sans les changer. */
export function estParDefaut(source: DecisionSourceMap | null | undefined): boolean {
  return !!source && PIVOT_FIELDS.every((c) => source[c] === "default");
}

/** Vrai quand rien n'a été validé : la clôture a reconduit. */
export function estReconduite(source: DecisionSourceMap | null | undefined): boolean {
  return !!source && PIVOT_FIELDS.every((c) => source[c] === "carried");
}

const LIBELLES: Record<DecisionSource, string> = {
  default: "par défaut",
  edited: "modifié",
  carried: "reconduit",
};

/** « prix : modifié · volume : par défaut », pour un tableur ou une pastille. */
export function decrireSource(source: DecisionSourceMap | null | undefined): string {
  if (!source) return "";
  return `prix : ${LIBELLES[source.price]} · volume : ${LIBELLES[source.productionPlan]}`;
}

/** Lecture tolérante d'une colonne JSON : null pour les tours antérieurs. */
export function lireSource(raw: unknown): DecisionSourceMap | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const ok = (v: unknown): v is DecisionSource => v === "default" || v === "edited" || v === "carried";
  if (!ok(o.price) || !ok(o.productionPlan)) return null;
  return { price: o.price, productionPlan: o.productionPlan };
}

/**
 * GAMME : les champs par produit du formulaire s'appellent
 * `product.<code>.price`, `product.<code>.productionPlan`,
 * `product.<code>.marketingBudget`, `product.<code>.qualityBudget` et
 * `product.<code>.supplierChoice`. Cette lecture est partagée par le
 * formulaire (vérification des pivots avant envoi) et par l'action serveur.
 * Une valeur numérique vide ou illisible est laissée `NaN` : c'est au schéma
 * de refuser ; un fournisseur vide est simplement absent.
 */
export const PRODUCT_FIELD_PREFIX = "product.";

const PRODUCT_NUMBER_FIELDS = ["price", "productionPlan", "marketingBudget", "qualityBudget"] as const;
type ProductNumberField = (typeof PRODUCT_NUMBER_FIELDS)[number];

export function productFieldName(
  code: ProductCode,
  field: ProductNumberField | "supplierChoice",
): string {
  return `${PRODUCT_FIELD_PREFIX}${code}.${field}`;
}

export function readProductFields(
  entries: Iterable<[string, FormDataEntryValue | string | null]>,
): Record<ProductCode, ProductDecisions> | undefined {
  const out: Record<ProductCode, Partial<Record<ProductNumberField, number>> & { supplierChoice?: string }> = {};
  for (const [key, raw] of entries) {
    if (!key.startsWith(PRODUCT_FIELD_PREFIX)) continue;
    const rest = key.slice(PRODUCT_FIELD_PREFIX.length);
    const dot = rest.lastIndexOf(".");
    if (dot <= 0) continue;
    const code = rest.slice(0, dot);
    const field = rest.slice(dot + 1);
    const text = String(raw ?? "").trim();
    if (field === "supplierChoice") {
      if (text !== "") (out[code] ??= {}).supplierChoice = text;
      continue;
    }
    if (!(PRODUCT_NUMBER_FIELDS as readonly string[]).includes(field)) continue;
    const value = text === "" ? NaN : Number(text.replace(",", "."));
    (out[code] ??= {})[field as ProductNumberField] = value;
  }
  const codes = Object.keys(out);
  if (codes.length === 0) return undefined;
  const products: Record<ProductCode, ProductDecisions> = {};
  for (const code of codes) {
    const p = out[code]!;
    products[code] = {
      price: p.price ?? NaN,
      productionPlan: p.productionPlan ?? NaN,
      ...(p.marketingBudget !== undefined ? { marketingBudget: p.marketingBudget } : {}),
      ...(p.qualityBudget !== undefined ? { qualityBudget: p.qualityBudget } : {}),
      ...(p.supplierChoice !== undefined ? { supplierChoice: p.supplierChoice } : {}),
    };
  }
  return products;
}
