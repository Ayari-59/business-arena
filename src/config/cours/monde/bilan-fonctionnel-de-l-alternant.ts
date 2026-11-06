import { auCentime, type DateDuCours } from "./amortissement";
import { cloture } from "./cloture";
import type { FicheDeLExercice } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : LE BILAN FONCTIONNEL DE NOVA, PRÉPARÉ PAR UN ALTERNANT (l'enquête « Le bilan
 * fonctionnel de l'alternant », config/cours/enquetes ; la suite du chapitre « Bilan fonctionnel et BFR »).
 *
 * Début février N+1, l'alternant du service comptable a relu le bilan comptable du 31 décembre N par
 * fonction ; cinq de ses reclassements sont faux. Les bons chiffres ne s'écrivent pas ici : ce sont ceux
 * du bilan fonctionnel de la clôture du cours (monde/cloture.ts, `cloture(fiche).fonctionnel`). Ceux de
 * l'alternant en sortent, poste par poste : chaque erreur déplace un poste juste d'une masse à une autre.
 *
 * LES CINQ ERREURS, CHACUNE D'UNE NATURE DIFFÉRENTE (hypothèses de l'enquête) :
 *   1. LA VALEUR NETTE : la ligne de montage aux emplois stables pour sa valeur nette, et ses
 *      amortissements retirés des ressources stables (le bilan reste équilibré) ;
 *   2. LE PLACEMENT IMMOBILISÉ : le compte à terme et ses intérêts courus aux emplois stables, comme une
 *      immobilisation financière, au lieu de la trésorerie active (il échoit le 6 janvier N+1) ;
 *   3. LES INTÉRÊTS COURUS AUX DETTES FINANCIÈRES : ceux de l'emprunt, payés le 3 janvier N+1, aux
 *      ressources stables au lieu du passif hors exploitation ;
 *   4. L'IMPÔT EN EXPLOITATION : l'impôt sur les sociétés dû au passif d'exploitation, au lieu du passif
 *      hors exploitation ;
 *   5. LA PROVISION EN DETTES : la provision pour litige au passif d'exploitation, au lieu des ressources
 *      stables.
 * Trois reclassements sont justes : la TVA sur la facture non parvenue et la charge constatée d'avance à
 * l'actif d'exploitation, le produit constaté d'avance au passif d'exploitation.
 *
 * CHAQUE ERREUR GARDE LE BILAN ÉQUILIBRÉ : l'égalité FRNG − BFR = TN tient chez l'alternant comme dans
 * le bon bilan. Elle ne prouve donc rien.
 */

/** Le jour où l'élève ouvre le dossier (hypothèse de l'enquête). */
export const JOUR_DU_BILAN_DE_L_ALTERNANT: DateDuCours = { jour: 3, mois: 2, exercice: 1 };

/** La nature d'une erreur de l'alternant. */
export type ErreurDeLAlternant = "valeur-nette" | "placement" | "interets-courus" | "impot" | "provision";

/** Les masses d'un bilan fonctionnel, celles que l'enquête compare. */
export interface MassesFonctionnelles {
  emploisStables: number;
  ressourcesStables: number;
  fondsDeRoulement: number;
  actifDExploitation: number;
  passifDExploitation: number;
  besoinDExploitation: number;
  actifHorsExploitation: number;
  passifHorsExploitation: number;
  besoinHorsExploitation: number;
  tresorerieActive: number;
  tresoreriePassive: number;
  tresorerieNette: number;
}

/** Les postes que l'alternant a reclassés, lus sur les soldes de la clôture. */
export function postesDuBilanDeLAlternant(f: FicheDeLExercice) {
  const s = cloture(f).soldes;
  const debit = (c: string) => auCentime(s[c] ?? 0);
  const credit = (c: string) => auCentime(-(s[c] ?? 0));
  return {
    ligneBrute: debit(f.equipement.compte),
    amortissements: credit(f.equipement.compteDAmortissement),
    placement: auCentime(debit(f.placement.compte) + debit(f.placement.compteDesInteretsCourus)),
    interetsCourus: credit("1688"),
    impot: credit("444"),
    provision: credit("1511"),
    tvaSurFactureNonParvenue: debit("44586"),
    chargeConstateeDAvance: debit("486"),
    produitConstateDAvance: credit("487"),
  };
}

/** Les masses à partir de leurs postes : les soldes se recalculent, comme dans le modèle. */
function masses(m: Omit<MassesFonctionnelles, "fondsDeRoulement" | "besoinDExploitation" | "besoinHorsExploitation" | "tresorerieNette">): MassesFonctionnelles {
  const besoinDExploitation = auCentime(m.actifDExploitation - m.passifDExploitation);
  const besoinHorsExploitation = auCentime(m.actifHorsExploitation - m.passifHorsExploitation);
  return {
    ...m,
    fondsDeRoulement: auCentime(m.ressourcesStables - m.emploisStables),
    besoinDExploitation,
    besoinHorsExploitation,
    tresorerieNette: auCentime(m.tresorerieActive - m.tresoreriePassive),
  };
}

/** Le bon bilan fonctionnel : celui de la clôture du cours. */
export function bilanFonctionnelJuste(f: FicheDeLExercice): MassesFonctionnelles {
  const fo = cloture(f).fonctionnel;
  return masses({
    emploisStables: fo.emploisStables,
    ressourcesStables: fo.ressourcesStables.total,
    actifDExploitation: fo.actifDExploitation,
    passifDExploitation: fo.passifDExploitation,
    actifHorsExploitation: fo.actifHorsExploitation,
    passifHorsExploitation: fo.passifHorsExploitation,
    tresorerieActive: fo.tresorerieActive,
    tresoreriePassive: fo.tresoreriePassive,
  });
}

/** Ce que chaque erreur déplace : le montant, de la masse juste à celle de l'alternant (des deux côtés pour la valeur nette). */
export function deplacementsDeLAlternant(f: FicheDeLExercice): Readonly<Record<ErreurDeLAlternant, number>> {
  const p = postesDuBilanDeLAlternant(f);
  return { "valeur-nette": p.amortissements, placement: p.placement, "interets-courus": p.interetsCourus, impot: p.impot, provision: p.provision };
}

/** Le bilan fonctionnel de l'alternant : le bon, chaque erreur passée. */
export function bilanFonctionnelDeLAlternant(f: FicheDeLExercice): MassesFonctionnelles {
  const j = bilanFonctionnelJuste(f);
  const d = deplacementsDeLAlternant(f);
  return masses({
    emploisStables: auCentime(j.emploisStables - d["valeur-nette"] + d.placement),
    ressourcesStables: auCentime(j.ressourcesStables - d["valeur-nette"] + d["interets-courus"] - d.provision),
    actifDExploitation: j.actifDExploitation,
    passifDExploitation: auCentime(j.passifDExploitation + d.impot + d.provision),
    actifHorsExploitation: j.actifHorsExploitation,
    passifHorsExploitation: auCentime(j.passifHorsExploitation - d["interets-courus"] - d.impot),
    tresorerieActive: auCentime(j.tresorerieActive - d.placement),
    tresoreriePassive: j.tresoreriePassive,
  });
}
