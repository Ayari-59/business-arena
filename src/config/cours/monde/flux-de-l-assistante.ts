import { auCentime, type DateDuCours } from "./amortissement";
import { affectationDuBeneficeDeN } from "./comptabilite-approfondie";
import { empruntALaCloture } from "./emprunt";
import type { FicheDeLExercice } from "./exercice-de-nova";
import { tableauDesFlux } from "./tableaux-de-flux";

/**
 * LE MONDE DU COURS : LE TABLEAU DES FLUX DE TRÉSORERIE DE N, PRÉPARÉ PAR L'ASSISTANTE COMPTABLE
 * (l'enquête « Le tableau des flux de l'assistante », config/cours/enquetes ; la suite du chapitre « Le
 * tableau des flux de trésorerie »).
 *
 * En mars N+1, l'assistante a dressé le tableau des flux du premier exercice, méthode indirecte, pour le
 * dossier de la banque ; sa trésorerie de clôture ne retombe pas sur celle du bilan. Les bons chiffres ne
 * s'écrivent pas ici : ce sont ceux du tableau du cours (monde/tableaux-de-flux.ts, `tableauDesFlux`).
 * Ceux de l'assistante en sortent, ligne par ligne.
 *
 * LES CINQ ERREURS, CHACUNE D'UNE NATURE DIFFÉRENTE (hypothèses de l'enquête) :
 *   1. LA DÉPRÉCIATION REPRISE : la dépréciation de la créance de Sonora, une dépréciation de l'actif
 *      circulant, ajoutée aux amortissements et provisions, alors que le besoin en valeurs nettes l'a
 *      déjà comptée ;
 *   2. LE SIGNE : la variation du besoin lié à l'activité écrite avec le signe contraire ;
 *   3. LA TVA : la ligne de montage comptée toutes taxes comprises, alors que sa TVA est récupérée ;
 *   4. LES INTÉRÊTS DANS LE FINANCEMENT : les intérêts payés de l'emprunt ajoutés au capital remboursé,
 *      alors qu'ils sont déjà dans le résultat, donc dans l'activité ;
 *   5. L'EXERCICE SUIVANT : le dividende voté sur le bénéfice de N, qui sera versé en N+1, compté parmi
 *      les dividendes versés en N.
 * Trois lignes sont justes : le résultat net, l'augmentation de capital, l'emprunt reçu.
 */

/** Le jour où l'élève ouvre le dossier (hypothèse de l'enquête). */
export const JOUR_DES_FLUX_DE_L_ASSISTANTE: DateDuCours = { jour: 16, mois: 3, exercice: 1 };

/** La nature d'une erreur de l'assistante. */
export type ErreurDesFlux = "depreciation" | "signe" | "tva" | "interets" | "exercice";

/** Les lignes saisies d'un tableau des flux (les totaux s'en déduisent). */
export interface LignesDesFlux {
  resultatNet: number;
  amortissementsEtProvisions: number;
  /** La variation du besoin lié à l'activité, retranchée de la marge brute d'autofinancement. */
  variationDuBesoin: number;
  /** Les décaissements s'écrivent en négatif. */
  acquisitions: number;
  cessions: number;
  augmentationDeCapital: number;
  empruntsRecus: number;
  remboursements: number;
  dividendes: number;
  tresorerieDOuverture: number;
}

/** Les totaux d'un tableau des flux, tirés de ses lignes. */
export function totauxDesFlux(l: LignesDesFlux) {
  const margeBrute = auCentime(l.resultatNet + l.amortissementsEtProvisions);
  const activite = auCentime(margeBrute - l.variationDuBesoin);
  const investissement = auCentime(l.acquisitions + l.cessions);
  const financement = auCentime(l.augmentationDeCapital + l.empruntsRecus + l.remboursements + l.dividendes);
  const variation = auCentime(activite + investissement + financement);
  return { margeBrute, activite, investissement, financement, variation, cloture: auCentime(l.tresorerieDOuverture + variation) };
}

/** Le tableau juste : celui du cours. */
export function fluxJustes(f: FicheDeLExercice): LignesDesFlux {
  const x = tableauDesFlux(f);
  return {
    resultatNet: x.resultatNet,
    amortissementsEtProvisions: auCentime(x.amortissements + x.provisions),
    variationDuBesoin: x.besoinNetDeLActivite,
    acquisitions: -x.t.emplois.acquisitions,
    cessions: x.t.ressources.cessions,
    augmentationDeCapital: x.t.ressources.augmentationDeCapital,
    empruntsRecus: x.t.ressources.nouveauxEmprunts,
    remboursements: -x.t.emplois.remboursements,
    dividendes: -x.t.emplois.dividendes + 0,
    tresorerieDOuverture: x.tresorerieDOuverture,
  };
}

/** Ce que l'assistante ajoute ou change, chiffré dans le monde du cours. */
export function ecartsDeLAssistante(f: FicheDeLExercice) {
  const x = tableauDesFlux(f);
  return {
    depreciation: x.depreciationsDeLActifCirculant,
    tvaDeLaLigne: f.equipement.tva,
    interetsPayes: empruntALaCloture(f.pret).interetsPayes,
    dividendeDeN: affectationDuBeneficeDeN().dividendes,
  };
}

/** Le tableau de l'assistante : le juste, chaque erreur passée. */
export function fluxDeLAssistante(f: FicheDeLExercice): LignesDesFlux {
  const j = fluxJustes(f);
  const e = ecartsDeLAssistante(f);
  return {
    ...j,
    amortissementsEtProvisions: auCentime(j.amortissementsEtProvisions + e.depreciation),
    variationDuBesoin: -j.variationDuBesoin + 0,
    acquisitions: auCentime(j.acquisitions - e.tvaDeLaLigne),
    remboursements: auCentime(j.remboursements - e.interetsPayes),
    dividendes: auCentime(j.dividendes - e.dividendeDeN),
  };
}

/** L'erreur de chaque ligne de l'assistante ; les autres sont justes. */
export const ERREURS_DES_FLUX: Readonly<Partial<Record<keyof LignesDesFlux, ErreurDesFlux>>> = {
  amortissementsEtProvisions: "depreciation",
  variationDuBesoin: "signe",
  acquisitions: "tva",
  remboursements: "interets",
  dividendes: "exercice",
};
