import type { Sector } from "@/config/scenarios/registry";

/**
 * LE NOM DU STOCK DÉPEND DU MÉTIER.
 *
 * Les états financiers de l'arène appelaient le stock « Stocks de produits
 * finis » et sa variation « Production stockée » dans toutes les entreprises :
 * juste chez un fabricant, faux dans une boutique qui revend des marchandises
 * (compte 37, variation en 6037 avec les achats), dans un cabinet ou un
 * chantier dont le stock est fait d'en-cours ou de travaux en cours (compte 33
 * ou 34). Le libellé se tire donc du secteur du scénario (`ScenarioDefinition.sector`).
 *
 * La valeur affichée ne change pas : c'est toujours `productionStocked`, la
 * variation du stock (+ quand il monte), d'où le « ± Δ stock » partout.
 */
export interface LibellesDuStock {
  /** La ligne de l'actif du bilan. */
  stock: string;
  /** La ligne du compte de résultat qui porte la variation de ce stock. */
  variation: string;
}

export const LIBELLES_DES_STOCKS: Record<Sector, LibellesDuStock> = {
  // Un fabricant (NOVA) : le PCG dit produits finis (35) et production stockée (713).
  industrie: { stock: "Stocks de produits finis", variation: "Production stockée (± Δ stock)" },
  // Un commerce revend ce qu'il achète : marchandises (37), variation en 6037.
  commerce: { stock: "Stocks de marchandises", variation: "Variation du stock de marchandises (± Δ stock)" },
  ecommerce: { stock: "Stocks de marchandises", variation: "Variation du stock de marchandises (± Δ stock)" },
  // Un cabinet ne stocke que du travail commencé et pas encore facturé (34).
  services: { stock: "En-cours de services", variation: "Production stockée, en-cours (± Δ stock)" },
  // Un chantier non réceptionné : travaux en cours (33).
  batiment: { stock: "Travaux en cours", variation: "Production stockée, travaux en cours (± Δ stock)" },
  // Une cuisine garde des denrées, matières premières qu'elle transforme (31).
  restauration: { stock: "Stocks de denrées", variation: "Variation du stock de denrées (± Δ stock)" },
  // Hôtel, salle de sport, transporteur : ce qu'ils vendent ne se stocke pas ;
  // il ne leur reste que des fournitures et consommables (32).
  hotellerie: { stock: "Stocks de fournitures", variation: "Variation du stock de fournitures (± Δ stock)" },
  abonnement: { stock: "Stocks de fournitures", variation: "Variation du stock de fournitures (± Δ stock)" },
  transport: { stock: "Stocks de fournitures", variation: "Variation du stock de fournitures (± Δ stock)" },
};

export const libellesDuStock = (secteur: Sector): LibellesDuStock => LIBELLES_DES_STOCKS[secteur];
