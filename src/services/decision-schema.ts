import { z } from "zod";
import type { RoundDecisions } from "@/engine/types";
import { depasseLePlafond } from "@/engine/investment/plafond";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import {
  refusDuPlafond,
  type ErreurDeChamp,
  type PlafondAEcrire,
  BORNES_DES_CHAMPS,
  BORNES_PAR_REFERENCE,
  PRIX_MAX,
  VENTES_ESTIMEES_MAX,
  VOLUME_MAX,
} from "@/config/refus-de-decision";

/**
 * Validation des décisions d'un tour (doc 01 §4 : zod à toutes les frontières).
 * Les bornes larges ci-dessous sont des garde-fous techniques ; les bornes
 * pédagogiques par scénario viendront de `decision_options` (doc 05 §3).
 *
 * Le plafond de prix a été écrit quand NOVA était le seul scénario, où une
 * enceinte se vend 79 €. Il rendait ATLAS CONSEIL injouable : la journée de
 * conseil s'y facture 780 € au tarif de référence, et tout tour au prix juste
 * était refusé. Un garde-fou technique doit arrêter la faute de frappe, pas le
 * métier : le seuil est monté au niveau du secteur le plus cher, avec de la
 * marge, et un test vérifie qu'aucun scénario ne repasse au-dessus.
 */
// LES BORNES SONT ÉCRITES UNE FOIS, avec la langue des refus
// (`config/refus-de-decision.ts`) : le navigateur les vérifie avant l'envoi, et
// un refus du serveur se nomme champ par champ. Une borne posée ici seulement
// serait un refus découvert après coup.
const B = BORNES_DES_CHAMPS;
const R = BORNES_PAR_REFERENCE;
const nombre = (b: { min: number; max: number }) => z.coerce.number().min(b.min).max(b.max);
/** Plafond technique d'une liste de choix de module (les catalogues en portent moins de dix). */
const MODULES_MAX = 20;
const identifiant = z.string().min(1).max(64);
const identifiants = z.array(identifiant).max(MODULES_MAX).optional();
/** Plafond technique des montants d'un rachat (niveau 7) : la faute de frappe, pas le métier. */
const PLAFOND_DU_RACHAT = 50_000_000;

/** Une cible de rachat ou d'audit (niveau 7) : son type et son identifiant. */
const cibleDeRachat = z.object({ type: z.enum(["site_ferme"]), id: identifiant });

export const roundDecisionsSchema = z.object({
  price: z.coerce.number().min(1).max(PRIX_MAX),
  // Zéro reste admis par le schéma : l'action refuse le volume nul AVANT lui,
  // dans la langue du secteur (`refusDuVolume`).
  productionPlan: z.coerce.number().min(0).max(VOLUME_MAX),
  marketingBudget: nombre(B.marketingBudget!),
  qualityBudget: nombre(B.qualityBudget!),
  maintenanceBudget: nombre(B.maintenanceBudget!),
  // Gamme : décisions par produit (prix, plan, marketing, qualité,
  // fournisseur). Mêmes bornes techniques que les scalaires ; absent en
  // mono-produit.
  products: z
    .record(
      z.string().min(1),
      z.object({
        price: nombre(R.price!),
        productionPlan: nombre(R.productionPlan!),
        marketingBudget: nombre(R.marketingBudget!).optional(),
        qualityBudget: nombre(R.qualityBudget!).optional(),
        supplierChoice: z.string().min(1).optional(),
        rdBudget: nombre(R.rdBudget!).optional(),
      }),
    )
    .optional(),
  // R&D (scénarios avec levier `rd`) : le scalaire (mono-produit, ou somme
  // des références en gamme). Absent partout ailleurs.
  rdBudget: nombre(B.rdBudget!).optional(),
  // Communication (scénarios avec levier `communication`) : le budget de
  // marque (gamme) et l'axe tenu ce tour.
  brandMarketingBudget: nombre(B.brandMarketingBudget!).optional(),
  communicationAxis: z.enum(["prix", "qualite", "innovation", "image"]).optional(),
  insurance: z.union([z.boolean(), z.string()]).optional(),
  supplierChoice: z.string().optional(),
  acceptOrder: z.boolean().optional(),
  studies: z
    .object({
      market: z.boolean().optional(),
      price: z.boolean().optional(),
      finance: z.boolean().optional(),
      project: z.boolean().optional(),
    })
    .optional(),
  hr: z
    .object({
      hire: z.coerce.number().int().min(B.hire!.min).max(B.hire!.max).optional(),
      fire: z.coerce.number().int().min(B.fire!.min).max(B.fire!.max).optional(),
      trainingBudget: nombre(B.trainingBudget!).optional(),
      // Saisi en pour cent du marché (80 à 130), reçu en indice (0,8 à 1,3).
      salaryIndex: z.coerce
        .number()
        .min(B.salaryPercent!.min / 100)
        .max(B.salaryPercent!.max / 100)
        .optional(),
    })
    .optional(),
  investment: z
    .object({
      machineCapacityUnits: nombre(B.machineCapacityUnits!).optional(),
      equipmentBuy: z
        .array(z.object({ typeCode: z.string().min(1), quantity: z.coerce.number().int().min(0).max(100) }))
        .optional(),
      equipmentSell: z
        .array(z.object({ typeCode: z.string().min(1), quantity: z.coerce.number().int().min(0).max(100) }))
        .optional(),
    })
    .optional(),
  finance: z
    .object({
      newLoan: nombre(B.newLoan!).optional(),
      loanRepayment: nombre(B.loanRepayment!).optional(),
      capitalIncrease: nombre(B.capitalIncrease!).optional(),
      dividend: nombre(B.dividend!).optional(),
    })
    .optional(),
  treasury: z
    .object({
      discount: nombre(B.discount!).optional(),
      factoring: nombre(B.factoring!).optional(),
      placement: nombre(B.placement!).optional(),
    })
    .optional(),
  rse: z
    .object({
      budget: nombre(B.rseBudget!).optional(),
      investment: nombre(B.rseInvestment!).optional(),
    })
    .optional(),
  /**
   * LES VENTES ESTIMÉES PAR L'ÉQUIPE, et le compte estimé que le serveur en a
   * tiré. Stocké dans le JSON des décisions, jamais lu par le moteur : la fin
   * de tour le met en face du réel. Bornes techniques seulement, comme le
   * reste.
   */
  salesEstimate: z
    .object({
      byProduct: z.record(z.string().min(1), z.coerce.number().min(0).max(VENTES_ESTIMEES_MAX)),
      units: z.coerce.number().min(0).max(VENTES_ESTIMEES_MAX),
      estimate: z
        .object({
          revenue: z.coerce.number(),
          netIncome: z.coerce.number(),
          netTreasury: z.coerce.number(),
          deliverableUnits: z.coerce.number().min(0).max(10_000_000),
        })
        .optional(),
    })
    .optional(),
  forecast: z
    .object({
      expectedUnits: z.coerce.number().min(0).max(VENTES_ESTIMEES_MAX).optional(),
      expectedRevenue: z.coerce.number().optional(),
      expectedNetIncome: z.coerce.number().optional(),
      expectedCash: z.coerce.number().optional(),
    })
    .optional(),
  /**
   * LES MODULES DU SCÉNARIO (catalogues optionnels : `config/modules-saisis`).
   * Un `z.object` supprime les clés qu'il ne connaît pas : sans ces lignes, une
   * case cochée disparaissait ici, avant le moteur, sans un mot. Bornes
   * techniques seulement ; ce que le scénario offre ce tour (catalogue, niveau,
   * plafonds) est jugé ensuite par `refusDesModules`. Les décisions des modules
   * retirés ne sont plus lues : leurs clés tombent ici.
   */
  qualityActions: z
    .array(z.object({ actionCode: identifiant, level: z.coerce.number().int().min(1).max(10) }))
    .max(MODULES_MAX)
    .optional(),
  startedRdActionIds: identifiants,
  /**
   * NIVEAU 7. Le rachat d'une cible et son audit (actions ponctuelles), la sous-traitance
   * par référence. Bornes techniques ; ce que le niveau ouvre, ce que la cible
   * coûte et ce que la banque prête sont jugés par le moteur, qui refuse en
   * disant pourquoi.
   */
  rachat: z
    .object({
      cible: cibleDeRachat,
      prixMaximum: z.coerce.number().min(0).max(PLAFOND_DU_RACHAT),
      paiement: z.enum(["numeraire", "titres"]),
      emprunt: z.coerce.number().min(0).max(PLAFOND_DU_RACHAT).optional(),
      augmentationDeCapital: z.coerce.number().min(0).max(PLAFOND_DU_RACHAT).optional(),
    })
    .optional(),
  diligence: cibleDeRachat.optional(),
  sousTraitance: z.record(z.string().min(1), z.coerce.number().min(0).max(VOLUME_MAX)).optional(),
  /** Ce que l'équipe arrête ce tour ; ce qui peut s'arrêter est jugé par `refusDesModules`. */
  stoppedModuleItems: z
    .array(z.object({ module: identifiant, id: identifiant }))
    .max(MODULES_MAX * 2)
    .optional(),
});

// garde de compatibilité structurelle avec le type moteur
export type ParsedRoundDecisions = z.infer<typeof roundDecisionsSchema>;
const _compat: RoundDecisions = {} as ParsedRoundDecisions;
void _compat;

/**
 * LE PLAFOND D'INVESTISSEMENT, JUGÉ PAR LE SERVEUR. Le schéma ne connaît que des
 * bornes fixes ; ce plafond dépend de l'équipe et du parc à l'ouverture du tour
 * (`engine/investment/plafond`, lu par la vue). La feuille le juge avant
 * l'envoi avec le même calcul ; un formulaire périmé ou forgé tombe ici. Le
 * message et le champ visé sont ceux de la feuille (`refusDuPlafond`).
 *
 * Seul l'ENVOI est jugé : une décision déjà enregistrée se rejoue telle
 * quelle, le moteur n'applique aucun plafond.
 */
export function refusDuPlafondDInvestissement(
  decisions: RoundDecisions,
  plafond: (PlafondAEcrire & { niveauDesEmbauches: number | null }) | null | undefined,
  vocabulaire: Pick<ScenarioVocabulary, "unit" | "units" | "plafond">,
): ErreurDeChamp | null {
  if (!plafond) return null;
  return refusDuPlafond({
    plafond,
    depasse: depasseLePlafond(plafond, decisions.investment),
    typesAchetes: (decisions.investment?.equipmentBuy ?? [])
      .filter((l) => l.quantity > 0)
      .map((l) => l.typeCode),
    vocabulaire,
    niveauDesEmbauches: plafond.niveauDesEmbauches,
  });
}
