import { auCentime } from "./amortissement";
import { bilanDuLycee, compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { PAIE_DU_MOIS } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : PRIMES, INTÉRESSEMENT, PARTICIPATION ET ÉPARGNE SALARIALE CHEZ NOVA (enseignement
 * spécifique de ressources humaines et communication de terminale STMG, thème 2, question 2.3, lot E).
 *
 * CE QUI VIENT DES FICHES : le premier exercice de NOVA (comptes-du-lycee.ts : le résultat net, la valeur
 * ajoutée ; le bilan : les capitaux propres) et sa paie (exercice-de-nova.ts : 4 salariés, 7 500 € bruts
 * par mois à eux quatre, soit les salaires bruts de l'année).
 *
 * CE QUI VIENT DU DROIT (Code du travail) : la participation est obligatoire à partir de 50 salariés ; une
 * entreprise plus petite peut l'adopter volontairement, par accord. Sa réserve spéciale suit la formule
 * légale, ½ × (B − 5 % × C) × S ÷ VA (le bénéfice net, les capitaux propres, les salaires, la valeur
 * ajoutée ; les capitaux propres s'y comptent sans le résultat de l'exercice). L'intéressement est facultatif, prévu par un accord, lié aux résultats ou aux performances ;
 * le total des primes ne dépasse pas 20 % des salaires bruts de l'année.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LA VALEUR AJOUTÉE de la formule est celle du compte de résultat du lycée (ventes moins
 *     consommations) ; le texte la définit par ses composantes fiscales, d'un montant voisin. Le bénéfice
 *     est le résultat net du lycée, que le texte prend après les retraitements fiscaux ;
 *   · L'ACCORD D'INTÉRESSEMENT : une part du résultat net de l'année, essayée de 5 en 5 % ; le président
 *     veut verser au moins ce que donnerait la participation légale, sous le plafond ;
 *   · LE CAS : chaque opérateur reçoit la même part ; un opérateur qui la place sur le plan d'épargne
 *     d'entreprise reçoit de NOVA un abondement de 50 % de son versement ; il veut acheter son logement
 *     dans 2 ans.
 */

export const ENTREPRISES_DE_L_EPARGNE_SALARIALE = ENTREPRISES_DE_LA_DIRECTION;

export const DROIT_DE_LA_PARTICIPATION = { partDesCapitaux: 0.05, plafondDeLInteressement: 0.2, seuilDObligation: 50 } as const;
export const TAUX_D_INTERESSEMENT_ESSAYES = { min: 0, max: 30, pas: 5 } as const;
export const ABONDEMENT = 0.5;

/** Les chiffres de la formule, lus sur les comptes de NOVA. */
export function chiffresDeLaParticipation() {
  const k = compteDuLycee(exerciceDe("nova"));
  const b = bilanDuLycee(exerciceDe("nova"));
  // Les capitaux propres de la formule : le capital et les réserves, sans le résultat de l'année.
  return { benefice: k.resultatNet, capitaux: auCentime(b.capitauxPropres - k.resultatNet), salaires: PAIE_DU_MOIS.brut * 12, valeurAjoutee: k.valeurAjoutee, effectif: PAIE_DU_MOIS.effectif };
}

/** La réserve spéciale de participation, pas à pas, au centime. */
export function participationLegale() {
  const c = chiffresDeLaParticipation();
  const cinqPourCent = auCentime(c.capitaux * DROIT_DE_LA_PARTICIPATION.partDesCapitaux);
  const diminue = auCentime(c.benefice - cinqPourCent);
  const reserve = auCentime((diminue / 2) * (c.salaires / c.valeurAjoutee));
  return { ...c, cinqPourCent, diminue, reserve, parSalarie: auCentime(reserve / c.effectif) };
}

/** Le plafond de l'intéressement : 20 % des salaires bruts de l'année. */
export const plafondDeLInteressement = () => auCentime(chiffresDeLaParticipation().salaires * DROIT_DE_LA_PARTICIPATION.plafondDeLInteressement);

/** L'intéressement pour une part du résultat net (en %). */
export function interessement(taux: number) {
  const c = chiffresDeLaParticipation();
  const total = auCentime((c.benefice * taux) / 100);
  return { taux, total, parSalarie: auCentime(total / c.effectif), plafond: plafondDeLInteressement(), participation: participationLegale().reserve, tenu: total >= participationLegale().reserve && total <= plafondDeLInteressement() };
}

/** La seule part essayée qui verse au moins la participation, sous le plafond. */
export function tauxDeLAccord() {
  const t = TAUX_D_INTERESSEMENT_ESSAYES;
  for (let x = t.min; x <= t.max; x += t.pas) if (interessement(x).tenu) return x;
  return t.min;
}

/** Le cas : la part d'un opérateur, l'abondement s'il la place, et ce qu'il aurait sur le plan. */
export function placerSonInteressement() {
  const part = interessement(tauxDeLAccord()).parSalarie;
  const abondement = auCentime(part * ABONDEMENT);
  return { part, taux: ABONDEMENT * 100, abondement, surLePlan: auCentime(part + abondement) };
}
