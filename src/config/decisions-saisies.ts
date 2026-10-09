import { readProductFields } from "@/config/decision-source";
import { scalarsOfGamme } from "@/engine/gamme";
import type { ProductCode, ProductDecisions, RoundDecisions } from "@/engine/types";

/**
 * LES DÉCISIONS, LUES SUR LE FORMULAIRE — UNE SEULE FOIS, POUR LES DEUX CÔTÉS.
 *
 * Le même formulaire est lu DEUX fois : par l'action serveur, qui valide et
 * résout le tour, et par le navigateur, qui estime à la frappe le résultat que
 * ces décisions donneraient (`engine/estimation`). Deux lectures écrites
 * séparément finissent par diverger — l'encart annoncerait un emprunt que le
 * moteur ne contracte pas, ou oublierait l'assurance que le tour facture — et
 * rien ne le signalerait : les deux côtés seraient justes, c'est leur ACCORD
 * qui aurait rompu. C'est exactement la faute que le contrat
 * formulaire/action garde déjà (`tests/architecture/form-action-contract.test.ts`).
 *
 * Cette lecture est donc ICI, pure, sans zod et sans serveur : elle rend des
 * NOMBRES, et c'est le schéma (côté serveur seulement) qui borne. Un champ
 * absent du formulaire reste absent du résultat : la différence entre « zéro
 * décidé » et « levier non ouvert à ce niveau » compte.
 */

/** Un nombre lu dans un champ : `undefined` si le champ manque ou est vide. */
function nombre(data: FormData, champ: string): number | undefined {
  const brut = data.get(champ);
  if (brut === null) return undefined;
  const texte = String(brut).trim().replace(",", ".");
  if (texte === "") return undefined;
  const n = Number(texte);
  return Number.isFinite(n) ? n : undefined;
}

/** Le même, mais zéro plutôt que rien : pour les champs que le moteur veut toujours. */
function montant(data: FormData, champ: string): number {
  return nombre(data, champ) ?? 0;
}

/** Un tableau JSON caché (le parc machines) : illisible ⇒ rien, jamais une erreur. */
function tableauJson(data: FormData, champ: string): unknown[] | undefined {
  const brut = data.get(champ);
  if (!brut) return undefined;
  try {
    const lu: unknown = JSON.parse(String(brut));
    return Array.isArray(lu) ? lu : undefined;
  } catch {
    return undefined;
  }
}

export interface DecisionsSaisies {
  /** Les décisions du tour, telles que le formulaire les porte (non bornées). */
  decisions: RoundDecisions;
  /** Les décisions par référence, en gamme ; `undefined` en mono-produit. */
  products: Record<ProductCode, ProductDecisions> | undefined;
  /**
   * Le volume engagé, toutes références confondues. `NaN` quand le champ est
   * vide : l'action le refuse, c'est un pivot et non une absence.
   */
  volume: number;
}

/**
 * Lit le formulaire de décision. `decisions` part directement au moteur (le
 * navigateur) ou au schéma zod (le serveur) : c'est le même objet.
 */
export function decisionsSaisies(formData: FormData): DecisionsSaisies {
  // GAMME : le formulaire envoie prix, plan, marketing — et, selon le niveau et
  // le scénario, qualité, R&D et fournisseur — PAR RÉFÉRENCE
  // (`product.<code>.*`). Les scalaires historiques en sont dérivés : plan =
  // somme, prix = moyenne pondérée, marketing et qualité = somme, fournisseur =
  // celui de la référence au plan le plus fort. Mono-produit : les champs
  // scalaires font foi.
  const products = readProductFields(formData.entries());
  const scalars = products ? scalarsOfGamme(products) : null;
  const volumeBrut = String(formData.get("productionPlan") ?? "")
    .trim()
    .replace(",", ".");
  const volume = scalars ? scalars.productionPlan : volumeBrut === "" ? NaN : Number(volumeBrut);

  const rdBudget = scalars?.rdBudget ?? nombre(formData, "rdBudget");
  const brandMarketingBudget = nombre(formData, "brandMarketingBudget");
  const axe = formData.get("communicationAxis");
  const fournisseur = scalars?.supplierChoice ?? (formData.get("supplierChoice") || undefined);
  const equipBuy = tableauJson(formData, "equipmentBuyJson");
  const equipSell = tableauJson(formData, "equipmentSellJson");
  const etudes = {
    market: formData.get("studyMarket") === "on",
    price: formData.get("studyPrice") === "on",
    finance: formData.get("studyFinance") === "on",
    project: formData.get("studyProject") === "on",
  };

  const decisions: RoundDecisions = {
    price: scalars ? scalars.price : (nombre(formData, "price") ?? NaN),
    productionPlan: volume,
    marketingBudget: scalars ? scalars.marketingBudget : montant(formData, "marketingBudget"),
    qualityBudget: scalars?.qualityBudget ?? montant(formData, "qualityBudget"),
    maintenanceBudget: montant(formData, "maintenanceBudget"),
    ...(products ? { products } : {}),
    ...(rdBudget !== undefined ? { rdBudget } : {}),
    ...(brandMarketingBudget !== undefined ? { brandMarketingBudget } : {}),
    ...(typeof axe === "string" && axe !== ""
      ? { communicationAxis: axe as NonNullable<RoundDecisions["communicationAxis"]> }
      : {}),
    insurance: (() => {
      const brut = formData.get("insurance");
      if (brut === "on" || brut === "true") return true;
      if (typeof brut === "string" && brut.length > 0) return brut;
      return false;
    })(),
    ...(fournisseur ? { supplierChoice: String(fournisseur) } : {}),
    acceptOrder: formData.get("acceptOrder") === "on",
    ...(Object.values(etudes).some(Boolean) ? { studies: etudes } : {}),
    ...(formData.has("salaryPercent")
      ? {
          hr: {
            hire: montant(formData, "hire"),
            fire: montant(formData, "fire"),
            trainingBudget: montant(formData, "trainingBudget"),
            salaryIndex: (nombre(formData, "salaryPercent") ?? 100) / 100,
          },
        }
      : {}),
    ...(() => {
      // Champs cachés alimentés par l'îlot d'équipement : un contenu illisible
      // devient « pas d'équipement » plutôt qu'une erreur.
      const avecMachine = formData.has("machineCapacityUnits");
      const avecParc = (equipBuy?.length ?? 0) > 0 || (equipSell?.length ?? 0) > 0;
      if (!avecMachine && !avecParc) return {};
      return {
        investment: {
          ...(avecMachine
            ? { machineCapacityUnits: montant(formData, "machineCapacityUnits") }
            : {}),
          ...(equipBuy && equipBuy.length > 0
            ? {
                equipmentBuy: equipBuy as NonNullable<RoundDecisions["investment"]>["equipmentBuy"],
              }
            : {}),
          ...(equipSell && equipSell.length > 0
            ? {
                equipmentSell: equipSell as NonNullable<
                  RoundDecisions["investment"]
                >["equipmentSell"],
              }
            : {}),
        },
      };
    })(),
    finance: {
      newLoan: montant(formData, "newLoan"),
      loanRepayment: montant(formData, "loanRepayment"),
      capitalIncrease: montant(formData, "capitalIncrease"),
      // Le dividende n'est ouvert qu'au niveau 6 : son champ peut être absent.
      dividend: montant(formData, "dividend"),
    },
    ...(formData.has("discount")
      ? {
          treasury: {
            discount: montant(formData, "discount"),
            factoring: montant(formData, "factoring"),
            // Le placement n'est servi qu'aux niveaux qui l'ouvrent.
            placement: montant(formData, "placement"),
          },
        }
      : {}),
    // Engagement RSE : ouvert dès Arbitrage ; champs absents ailleurs.
    ...(formData.has("rseBudget") || formData.has("rseInvestment")
      ? {
          rse: {
            budget: montant(formData, "rseBudget"),
            investment: montant(formData, "rseInvestment"),
          },
        }
      : {}),
    // Prévisions : facultatives, et sans effet sur le calcul du tour. Deux
    // champs vides ne doivent pas devenir deux zéros prévus.
    ...(() => {
      const expectedUnits = nombre(formData, "expectedUnits");
      const expectedCash = nombre(formData, "expectedCash");
      return expectedUnits === undefined && expectedCash === undefined
        ? {}
        : {
            forecast: {
              ...(expectedUnits !== undefined ? { expectedUnits } : {}),
              ...(expectedCash !== undefined ? { expectedCash } : {}),
            },
          };
    })(),
  };
  return { decisions, products, volume };
}
