import { auCentime, type DateDuCours } from "./amortissement";
import { annexe, comptesAnnuels, MOIS_DE_LA_SITUATION, SEUILS_DES_MICRO_ENTREPRISES, situationIntermediaire, tailleDeNova } from "./comptes-annuels";
import { EXERCICE_DE_NOVA, type FicheDeLExercice } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : LES COMPTES ANNUELS DE N, PRÉPARÉS PAR LE STAGIAIRE (l'enquête « Les comptes annuels
 * du stagiaire », config/cours/enquetes ; la suite du chapitre « Les comptes annuels : présentation,
 * annexe et situation intermédiaire »).
 *
 * En mars N+1, le stagiaire a mis en forme les comptes annuels de N avant l'assemblée : le compte de
 * résultat et le bilan du système de base, deux lignes de l'annexe, la position de NOVA face aux seuils
 * des micro-entreprises, et le résultat de la situation au 30 juin que la banque avait demandée. Six de
 * ses neuf montants sont faux. Les bons ne s'écrivent pas ici : ce sont ceux de monde/comptes-annuels.ts
 * (`comptesAnnuels`, `annexe`, `tailleDeNova`, `situationIntermediaire`), sur la clôture figée de N.
 *
 * LES SIX ERREURS, CHACUNE D'UNE NATURE DIFFÉRENTE (hypothèses de l'enquête) :
 *   1. LE SIGNE : la variation des stocks de matières écrite comme le stock final, positive, alors
 *      qu'un stock qui monte diminue les charges ;
 *   2. LA DÉPRÉCIATION PRISE POUR UNE PROVISION : la dépréciation de la créance de Sonora ajoutée aux
 *      provisions pour risques, alors qu'elle se retranche déjà des clients ;
 *   3. LES INTÉRÊTS COURUS OUBLIÉS : les emprunts et dettes financières réduits au capital restant dû ;
 *   4. LES ÉCHÉANCES NON SÉPARÉES : tout le capital restant dû à plus d'un an dans l'état des dettes ;
 *   5. LE BRUT AU LIEU DU NET : le total du bilan comparé aux seuils pris en valeurs brutes ;
 *   6. LE PRORATA : le résultat avant impôt de la situation au 30 juin pris pour la moitié de celui de
 *      l'année, au lieu de celui des six mois.
 * Trois montants sont justes : les autres achats et charges externes, les charges financières, les
 * immobilisations corporelles nettes.
 */

/** Le jour où l'élève ouvre le dossier (hypothèse de l'enquête) : avant l'assemblée qui approuve les comptes. */
export const JOUR_DES_COMPTES_DU_STAGIAIRE: DateDuCours = { jour: 9, mois: 3, exercice: 1 };

/** La nature d'une erreur du stagiaire. */
export type ErreurDesComptes = "signe" | "depreciation" | "interets-courus" | "echeances" | "brut" | "prorata";

/** Un montant des comptes du stagiaire : le juste, le sien, et l'erreur s'il y en a une. */
export interface MontantDesComptes {
  code: string;
  juste: number;
  stagiaire: number;
  erreur: ErreurDesComptes | null;
}

/** Les neuf montants du stagiaire, chacun face au juste, dans l'ordre de son dossier. */
export function comptesDuStagiaire(f: FicheDeLExercice = EXERCICE_DE_NOVA): MontantDesComptes[] {
  const c = comptesAnnuels(f);
  const r = c.resultat;
  const b = c.bilan;
  const x = annexe(f);
  const t = tailleDeNova(f);
  const s = situationIntermediaire(MOIS_DE_LA_SITUATION, f);
  const totalBrut = auCentime(b.totalActif + b.actif.immobilisations.amortissements + b.actif.stocks.depreciation + b.actif.clients.depreciation);
  const m = (code: string, juste: number, stagiaire: number, erreur: ErreurDesComptes | null): MontantDesComptes => ({ code, juste, stagiaire, erreur });
  return [
    m("variation-des-stocks", r.variationDeStock, -r.variationDeStock, "signe"),
    m("charges-externes", r.chargesExternes, r.chargesExternes, null),
    m("charges-financieres", r.chargesFinancieres, r.chargesFinancieres, null),
    m("immobilisations", b.actif.immobilisations.net, b.actif.immobilisations.net, null),
    m("provisions", b.passif.provisions, auCentime(b.passif.provisions + b.actif.clients.depreciation), "depreciation"),
    m("emprunts", b.passif.emprunts, auCentime(b.passif.emprunts - x.interetsCourus), "interets-courus"),
    m("emprunt-a-plus-d-un-an", x.empruntAPlusDUnAn, auCentime(x.empruntAPlusDUnAn + x.capitalAUnAn), "echeances"),
    m("total-pour-les-seuils", t.bilan, totalBrut, "brut"),
    m("resultat-du-semestre", s.resultatAvantImpot, s.auProrata, "prorata"),
  ];
}

/** Le montant d'un code. */
export const montantDuStagiaire = (code: string, f: FicheDeLExercice = EXERCICE_DE_NOVA) => comptesDuStagiaire(f).find((x) => x.code === code)!;

/** Ce que les erreurs changent : le passif du stagiaire face à son actif, et les seuils qu'il croit dépassés. */
export function effetsDesErreurs(f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const c = comptesAnnuels(f);
  const t = tailleDeNova(f);
  const provisions = montantDuStagiaire("provisions", f);
  const emprunts = montantDuStagiaire("emprunts", f);
  const brut = montantDuStagiaire("total-pour-les-seuils", f);
  const passifDuStagiaire = auCentime(c.bilan.totalPassif + (provisions.stagiaire - provisions.juste) + (emprunts.stagiaire - emprunts.juste));
  return {
    totalDeLActif: c.bilan.totalActif,
    passifDuStagiaire,
    /** L'écart du bilan du stagiaire : son passif moins son actif. */
    ecartDuBilan: auCentime(passifDuStagiaire - c.bilan.totalActif),
    /** Les seuils des micro-entreprises que le stagiaire croit dépassés, et les vrais. */
    seuilsDuStagiaire: t.depassesMicro + (brut.juste <= SEUILS_DES_MICRO_ENTREPRISES.bilan && brut.stagiaire > SEUILS_DES_MICRO_ENTREPRISES.bilan ? 1 : 0),
    seuilsJustes: t.depassesMicro,
  };
}
