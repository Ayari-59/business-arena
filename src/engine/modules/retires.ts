import type { CompanyState } from "../types";

/**
 * LES MODULES RETIRÉS, VUS D'UNE PARTIE EN COURS.
 *
 * Seize catalogues optionnels ont été retirés (stratégie de prix, actions
 * commerciales, marque, export, contrats fournisseurs, capacité, maintenance,
 * hygiène et sécurité, innovation, formation, politiques RH, programme RSE,
 * options de financement, partenariats, digital, plans de crise). Une partie
 * créée avant garde son snapshot figé et un état d'entreprise qui peut porter
 * des éléments engagés : le moteur ne les lit plus, ils ne coûtent ni ne font
 * plus rien, et l'état du tour suivant ne les recopie pas.
 *
 * Seule exception : les lignes d'emprunt tirées sur une option de financement
 * vivent dans `loans`, qui n'est pas listé ici. Elles se remboursent à leur
 * taux jusqu'à leur terme (`modules/effets`, `lignesATauxPropre`).
 *
 * La grille R&D (`rdGrid`) a suivi : aucun écran, aucun bot ne l'a jamais
 * proposée, et elle doublait les programmes R&D. Aucune partie connue ne porte
 * `rdGridActions` ; la clé est écartée ici par précaution. Les catégories
 * d'emprunt (`loanCategories`), retirées avec elle, ne laissaient rien dans
 * l'état : une ligne qu'elles auraient tirée vivrait dans `loans` comme une
 * ligne de l'emprunt ordinaire, à son échéance et au taux ordinaire.
 */
export const CHAMPS_DES_MODULES_RETIRES = [
  "activeHsActions",
  "activeTrainingPrograms",
  "activeCommercialActions",
  "activeSupplierContracts",
  "activeCapacityOptions",
  "activeInternationalMarkets",
  "innovationsInDev",
  "launchedInnovations",
  "activeRseActions",
  "carbonFootprint",
  "maintenanceLog",
  "activePricingStrategies",
  "activeHRPolicies",
  "activeCrisisPlans",
  "ongoingCrisis",
  "activePartnerships",
  "digitalProjectsInProgress",
  "completedDigitalProjects",
  "activeBrandActions",
  "rdGridActions",
] as const;

/** L'état sans les champs des modules retirés ; le même objet s'il n'en porte aucun. */
export function sansLesModulesRetires(etat: CompanyState): CompanyState {
  const brut = etat as unknown as Record<string, unknown>;
  if (!CHAMPS_DES_MODULES_RETIRES.some((k) => k in brut)) return etat;
  const propre: Record<string, unknown> = { ...brut };
  for (const k of CHAMPS_DES_MODULES_RETIRES) delete propre[k];
  return propre as unknown as CompanyState;
}
