import { auCentime, cession, planDAmortissement, type DateDuCours, type Immobilisation } from "./amortissement";
import { cloture, type CodeDeTravail } from "./cloture";
import { exerciceDe } from "./comptes-du-lycee";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { EQUIPEMENT, IMMOBILISATION, MONTANTS_DES_FACTURES_SONORA, SONORA } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : INVESTIR, AMORTIR, CLÔTURER, LA VERSION LYCÉE (gestion et finance de terminale STMG,
 * questions 1.3 et 1.4, lot C ; décision du propriétaire, novembre 2026 : des versions lycée des notions
 * que seuls des chapitres de BTS enseignaient).
 *
 * CE QUI VIENT DES FICHES, sans un chiffre recopié :
 *   · la ligne de montage (exercice-de-nova.ts) : 4 postes à 15 000 € hors taxes, 20 % de TVA, mise en
 *     service le 6 janvier N, amortie en linéaire sur 6 ans, sans valeur résiduelle ; son plan et sa
 *     cession se calculent par le modèle du cours (amortissement.ts : l'année de 360 jours, le jour de
 *     départ compté) ;
 *   · les travaux d'inventaire du 31 décembre N (cloture.ts) : la dotation de la ligne, le stock final
 *     de composants, la créance de Sonora dépréciée de 40 % de son hors taxes, l'assurance payée d'avance ;
 *   · la seconde facture de Sonora (exercice-de-nova.ts), restée impayée.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LA CESSION : à la fin de N + 2, NOVA vend un des 4 postes (un quart de la ligne), remplacé par un
 *     poste automatisé ; le poste vendu est amorti comme la ligne, depuis le 6 janvier N ;
 *   · LE REVENDEUR : un revendeur de matériel d'occasion propose 6 000 € hors taxes pour le poste ;
 *   · LE CAS : un associé propose d'amortir la ligne sur 8 ans au lieu de 6, pour que le résultat de N
 *     soit plus haut ; les postes s'usent pourtant en 6 ans.
 */

export const ENTREPRISES_DE_L_INVESTISSEMENT = ENTREPRISES_DE_LA_DIRECTION;

export const LIGNE = EQUIPEMENT;
export const DATE_DE_LA_CESSION: DateDuCours = { jour: 31, mois: 12, exercice: 2 };
export const DUREE_DE_L_ASSOCIE = 8;
/** Le prix que propose un revendeur de matériel d'occasion pour le poste (hypothèse du cours). */
export const PRIX_DU_REVENDEUR = 6_000;

/** Un poste de la ligne, tel que le modèle d'amortissement le lit. */
export const POSTE: Immobilisation = { ...IMMOBILISATION, valeurBrute: EQUIPEMENT.prixUnitaireHt };

/** L'acquisition de la ligne : le coût hors taxes, la TVA récupérable, ce qui est réglé. */
export function acquisition() {
  return { postes: EQUIPEMENT.quantite, prixUnitaire: EQUIPEMENT.prixUnitaireHt, cout: EQUIPEMENT.ht, tva: EQUIPEMENT.tva, tauxPct: Math.round((EQUIPEMENT.tva / EQUIPEMENT.ht) * 100), regle: EQUIPEMENT.ttc };
}

/** Le plan de la ligne, en linéaire : l'annuité pleine, les jours de N, les deux premières lignes du plan. */
export function planDeLaLigne(immo: Immobilisation = IMMOBILISATION) {
  const plan = planDAmortissement(immo, "lineaire");
  const [n, n1] = [plan[0]!, plan[1]!];
  return { valeurBrute: immo.valeurBrute, duree: immo.dureeAns, annuite: auCentime(immo.valeurBrute / immo.dureeAns), joursDeN: n.prorata, n, n1, exercices: plan.length };
}

/** Un travail d'inventaire du 31 décembre N. */
export const travail = (code: CodeDeTravail) => cloture(exerciceDe("nova")).travaux.find((t) => t.code === code)!;

/** La créance de Sonora au 31 décembre N : son montant TTC, son hors taxes, la dépréciation. */
export function creanceDeSonora() {
  const o = MONTANTS_DES_FACTURES_SONORA.octobre;
  return { ttc: o.netAPayer, ht: o.netFinancier, taux: SONORA.redressement.tauxDePerteProbable, depreciation: travail("creanceDouteuse").montant };
}

/** La cession du poste à un prix : sa valeur nette comptable et le résultat de cession. */
export const cessionDuPoste = (prix: number) => cession(POSTE, "lineaire", DATE_DE_LA_CESSION, prix);

/** Le plus petit prix, à l'euro, qui ne laisse pas de moins-value. */
export const prixSansMoinsValue = () => Math.ceil(cessionDuPoste(0).valeurNette - 1e-9);

/** Le cas : la ligne amortie sur la durée de l'associé, et l'effet sur le résultat de N. */
export function dureeDeLAssocie() {
  const six = planDeLaLigne();
  const huit = planDeLaLigne({ ...IMMOBILISATION, dureeAns: DUREE_DE_L_ASSOCIE });
  return { six: six.n.dotation, huit: huit.n.dotation, effet: auCentime(six.n.dotation - huit.n.dotation), duree: DUREE_DE_L_ASSOCIE, dureeDUsage: IMMOBILISATION.dureeAns };
}
