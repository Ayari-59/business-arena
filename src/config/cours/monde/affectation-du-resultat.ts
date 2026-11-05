import { ENDETTEMENT_MAXIMAL } from "../financement";
import { auCentime } from "./amortissement";
import { ACTIONS_DE_NOVA, DIVIDENDE_DEMANDE_PAR_ACTION, PLAFOND_DE_LA_RESERVE_LEGALE, RESERVE_LEGALE, RESERVES_FACULTATIVES_PROPOSEES } from "./comptabilite-approfondie";
import { bilanDuLycee, compteDuLycee } from "./comptes-du-lycee";
import type { FicheDeLExercice } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : L'AFFECTATION DU BÉNÉFICE DE NOVA, AU LYCÉE (Bac STMG, gestion et finance, 3.3).
 *
 * Le bénéfice est celui du premier exercice de NOVA (comptes-du-lycee.ts, `compteDuLycee`), son
 * capital celui de la fiche, divisé en actions comme dans « L'augmentation de capital »
 * (comptabilite-approfondie.ts, `ACTIONS_DE_NOVA`), et la réserve légale prend la même part du
 * bénéfice (`RESERVE_LEGALE`, 5 %). C'est le premier exercice : il n'y a ni réserve, ni report à
 * nouveau des années passées.
 *
 * LES RÈGLES (Code de commerce, articles L. 232-10 et L. 232-11) : la réserve légale reçoit 5 % du
 * bénéfice tant qu'elle n'atteint pas le dixième du capital ; le bénéfice distribuable est le
 * bénéfice, moins cette dotation, plus le report à nouveau des années passées ; l'assemblée générale
 * des actionnaires le partage entre les dividendes, les réserves facultatives et le report à nouveau.
 *
 * CE QUE LE CHOIX ENGAGE (HYPOTHÈSE DU COURS, celle du bilan du lycée) : le dividende est versé par
 * la banque comme s'il l'était au 31 décembre (`bilanDuLycee`, variante `dividende`) ; il fait
 * baisser d'autant les capitaux propres et la trésorerie. L'autofinancement est la capacité
 * d'autofinancement de l'année, moins les dividendes. Ce qu'une banque prêterait encore suit la
 * règle de prudence du cours (financement.ts : des emprunts au plus égaux aux capitaux propres).
 */

/**
 * Le plafond de la réserve légale, la demande d'un actionnaire (2 € par action) et les réserves
 * facultatives que le président propose : posés une seule fois, avec l'affectation du bénéfice de N
 * que tout le cours reprend (comptabilite-approfondie.ts, `affectationDuBeneficeDeN`).
 */
export { DIVIDENDE_DEMANDE_PAR_ACTION, PLAFOND_DE_LA_RESERVE_LEGALE, RESERVES_FACULTATIVES_PROPOSEES };

export interface Affectation {
  /** Le dividende versé pour une action, en euros. */
  dividendeParAction: number;
  /** Ce que l'assemblée met en réserves facultatives. */
  reservesFacultatives: number;
}

/** Le bénéfice de l'année et ce que la loi en fait d'abord. */
export function beneficeAAffecter(f: FicheDeLExercice) {
  const k = compteDuLycee(f);
  const b = bilanDuLycee(f);
  const capital = f.apport.montant;
  const benefice = k.resultatNet;
  const reportAnterieur = 0;
  const plafond = auCentime(capital * PLAFOND_DE_LA_RESERVE_LEGALE);
  const reserveLegaleAnterieure = 0;
  const reserveLegale = Math.min(auCentime(benefice * RESERVE_LEGALE), auCentime(plafond - reserveLegaleAnterieure));
  return {
    f,
    entreprise: f.entreprise,
    capital,
    actions: ACTIONS_DE_NOVA.nombre,
    benefice,
    caf: k.caf,
    reportAnterieur,
    plafond,
    reserveLegale,
    distribuable: auCentime(benefice - reserveLegale + reportAnterieur),
    capitauxPropres: b.capitauxPropres,
    tresorerie: b.tresorerie,
    emprunts: b.poste("emprunt"),
    /** Ce qu'il faut pour autofinancer la deuxième ligne du chapitre « Financer l'entreprise ». */
    deuxiemeLigne: f.equipement.ht,
  };
}

export type BeneficeAAffecter = ReturnType<typeof beneficeAAffecter>;

/** Une affectation du bénéfice, et ce qu'elle engage pour l'avenir. */
export function affecter(k: BeneficeAAffecter, a: Affectation) {
  const dividendes = auCentime(a.dividendeParAction * k.actions);
  const reportANouveau = auCentime(k.distribuable - dividendes - a.reservesFacultatives);
  const apres = bilanDuLycee(k.f, { dividende: dividendes });
  const autofinancement = auCentime(k.caf - dividendes);
  return {
    dividendeParAction: a.dividendeParAction,
    dividendes,
    reserveLegale: k.reserveLegale,
    reservesFacultatives: a.reservesFacultatives,
    reportANouveau,
    /** L'assemblée ne peut distribuer ni mettre en réserve plus que le bénéfice distribuable. */
    possible: reportANouveau >= 0,
    /** Ce qui reste dans l'entreprise : la réserve légale, les réserves facultatives et le report à nouveau. */
    garde: auCentime(k.benefice - dividendes),
    capitauxPropres: apres.capitauxPropres,
    tresorerie: apres.tresorerie,
    autonomie: apres.autonomie,
    autofinancement,
    manquePourLaLigne: auCentime(Math.max(0, k.deuxiemeLigne - autofinancement)),
    /** Ce qu'une banque prêterait encore, dans la règle des emprunts au plus égaux aux capitaux propres. */
    empruntPossible: auCentime(Math.max(0, apres.capitauxPropres * ENDETTEMENT_MAXIMAL - k.emprunts)),
  };
}

/** Le dividende total le plus haut qui laisse assez d'autofinancement pour payer la deuxième ligne. */
export const dividendeQuiGardeLaLigne = (k: BeneficeAAffecter) => Math.floor(k.caf - k.deuxiemeLigne + 1e-9);
