import { readProductFields } from "@/config/decision-source";
import { scalarsOfGamme } from "@/engine/gamme";
import type { ProductCode, ProductDecisions, RoundDecisions } from "@/engine/types";
import type { CibleDeRachat } from "@/engine/groupe/types";
import { modulesSaisis } from "@/config/modules-saisis";

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

// ── NIVEAU 7 « GROUPE » ─────────────────────────────────────────────────────

/** Préfixes des champs du niveau 7 nommés par référence, et par filiale. */
export const PREFIXE_SOUS_TRAITANCE = "sousTraitance.";
export const PREFIXE_RESEAU_ETRANGER = "reseauEtranger.";
export const PREFIXE_FABRICATION_ETRANGERE = "fabricationEtrangere.";

/** Le nom du champ d'une commande au sous-traitant : `sousTraitance.<référence>`. */
export const champDeSousTraitance = (code: string) => `${PREFIXE_SOUS_TRAITANCE}${code}`;
/** Le nom du champ d'une synergie : `reseauEtranger.<filiale>.<référence>`. */
export const champDeSynergie = (prefixe: string, filiale: string, code: string) => `${prefixe}${filiale}.${code}`;

const TYPES_DE_CIBLE: readonly CibleDeRachat["type"][] = ["fournisseur", "etranger"];

/** Une cible écrite `type:identifiant` dans une liste de choix ; vide ou illisible : rien. */
export function cibleLue(brut: FormDataEntryValue | null): CibleDeRachat | undefined {
  if (typeof brut !== "string") return undefined;
  const i = brut.indexOf(":");
  if (i <= 0) return undefined;
  const type = brut.slice(0, i) as CibleDeRachat["type"];
  const id = brut.slice(i + 1);
  return TYPES_DE_CIBLE.includes(type) && id !== "" ? { type, id } : undefined;
}

/** La valeur d'une cible dans une liste de choix. */
export const valeurDeCible = (c: CibleDeRachat) => `${c.type}:${c.id}`;

/** Les nombres saisis sous un préfixe : `{ suite du nom: nombre }`, sans les cases vides. */
function parPrefixe(data: FormData, prefixe: string): Record<string, number> | undefined {
  const out: Record<string, number> = {};
  for (const [nom, brut] of data.entries()) {
    if (!nom.startsWith(prefixe) || typeof brut !== "string") continue;
    const texte = brut.trim().replace(",", ".");
    if (texte === "") continue;
    out[nom.slice(prefixe.length)] = Number(texte);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Les mêmes, rangés par filiale puis par référence (`<filiale>.<référence>`). */
function parFiliale(data: FormData, prefixe: string): Record<string, Record<ProductCode, number>> | undefined {
  const plat = parPrefixe(data, prefixe);
  if (!plat) return undefined;
  const out: Record<string, Record<ProductCode, number>> = {};
  for (const [cle, n] of Object.entries(plat)) {
    const i = cle.indexOf(".");
    if (i <= 0) continue;
    const filiale = cle.slice(0, i);
    (out[filiale] ??= {})[cle.slice(i + 1)] = n;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Les décisions du niveau 7 : le rachat (une cible choisie, son montage), les
 * commandes au sous-traitant, les synergies des filiales étrangères. Rien de saisi : rien d'ajouté, pour que les autres niveaux
 * restent identiques.
 */
function decisionsDuGroupe(data: FormData): Partial<RoundDecisions> {
  const out: Partial<RoundDecisions> = {};
  const cible = cibleLue(data.get("rachatCible"));
  if (cible) {
    const paiement = data.get("rachatPaiement") === "titres" ? "titres" : "numeraire";
    const emprunt = nombre(data, "rachatEmprunt");
    const augmentation = nombre(data, "rachatAugmentation");
    const part = nombre(data, "rachatPart");
    out.rachat = {
      cible,
      // Vide, ce n'est pas « zéro » : le schéma le refuse sur sa case.
      prixMaximum: nombre(data, "rachatPrixMaximum") ?? NaN,
      paiement,
      ...(paiement === "numeraire" && emprunt !== undefined && emprunt > 0 ? { emprunt } : {}),
      ...(paiement === "numeraire" && augmentation !== undefined && augmentation > 0
        ? { augmentationDeCapital: augmentation }
        : {}),
      ...(cible.type === "etranger" && part !== undefined ? { part } : {}),
    };
  }
  const st = parPrefixe(data, PREFIXE_SOUS_TRAITANCE);
  if (st) out.sousTraitance = st;
  const reseau = parFiliale(data, PREFIXE_RESEAU_ETRANGER);
  if (reseau) out.reseauEtranger = reseau;
  const fabrication = parFiliale(data, PREFIXE_FABRICATION_ETRANGERE);
  if (fabrication) out.fabricationEtrangere = fabrication;
  return out;
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
      // L'emprunt et l'apport s'ouvrent au niveau 4, le dividende au niveau 6 :
      // leurs champs peuvent être absents, et valent alors zéro.
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
    // Engagement RSE : ouvert dès Stratégie ; champs absents ailleurs.
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
    // Les modules du scénario (actions qualité, projets, partenariats…) : des
    // cases à cocher, chacune sous un nom unique. Rien coché, rien ajouté.
    ...modulesSaisis(formData.entries()),
    // Le niveau 7 : rachat, sous-traitance, synergies étrangères.
    ...decisionsDuGroupe(formData),
  };
  return { decisions, products, volume };
}
