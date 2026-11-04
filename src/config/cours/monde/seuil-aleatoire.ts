import { donneesDuMois, seuilDeRentabilite } from "./couts-et-budgets";
import { arrondi, lectureDeLaTable, quantileNormal, repartitionNormale } from "./loi-normale";
import type { FicheDeGestion } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LE SEUIL DE PROFITABILITÉ EN AVENIR ALÉATOIRE (DCG UE 11, programme 2025, 2.1 :
 * « le seuil de profitabilité probabilisé sera étudié avec la loi normale »).
 *
 * Le mois de janvier de NOVA est celui du seuil de rentabilité (monde/nova-gestion.ts, relu par
 * `donneesDuMois` et `seuilDeRentabilite` de couts-et-budgets.ts) : 59 € le prix, 38 € le coût
 * variable d'une enceinte, 31 183 € de charges fixes, 1 590 enceintes vendues. Ce fichier ne recopie
 * aucun de ces chiffres. Il ajoute une seule hypothèse : les ventes d'un mois de janvier ne sont pas
 * certaines. Elles suivent une loi normale dont l'espérance est la vente de la fiche, 1 590 enceintes,
 * et dont l'écart-type est ECART_TYPE_DE_LA_DEMANDE.
 *
 * Tout le reste s'en déduit par les propriétés de l'espérance et de la variance : le chiffre
 * d'affaires CA = p × X et le résultat R = m × X − CF suivent eux aussi une loi normale,
 * E(aX + b) = a E(X) + b et σ(aX + b) = |a| σ(X). La somme de mois indépendants suit une loi normale
 * dont l'espérance est la somme des espérances, et la variance la somme des variances.
 */

/**
 * L'ÉCART-TYPE DES VENTES D'UN MOIS DE JANVIER (hypothèse du cours) : 150 enceintes. Le directeur
 * commercial l'a tiré des janviers passés : 95 fois sur 100, dit-il, les ventes tombent à moins de
 * 294 enceintes de leur moyenne (1,96 × 150), entre 1 296 et 1 884.
 */
export const ECART_TYPE_DE_LA_DEMANDE = 150;

/** L'OBJECTIF DU DIRIGEANT (hypothèse du cours) : un résultat mensuel d'au moins 5 000 €. */
export const OBJECTIF_DU_DIRIGEANT = 5_000;

/** LA SÉCURITÉ QUE VEUT LE DIRIGEANT (hypothèse du cours) : être en profit au moins 9 mois sur 10. */
export const CONFIANCE_DU_DIRIGEANT = 0.9;

/** LE MOIS REDOUTÉ : le résultat que le mois dépasse 95 fois sur 100, la perte qui n'arrive qu'1 mois sur 20. */
export const CONFIANCE_DU_MOIS_REDOUTE = 0.95;

/** LE TRIMESTRE : trois mois comme janvier, dont les ventes sont indépendantes d'un mois à l'autre (hypothèse du cours). */
export const MOIS_DU_TRIMESTRE = 3;

/** LA FOURCHETTE DU DIRECTEUR COMMERCIAL : un intervalle centré qui contient les ventes 95 fois sur 100. */
export const CONFIANCE_DE_LA_FOURCHETTE = 0.95;

/** Une demande aléatoire et les conditions du mois : ce que le laboratoire fait varier. */
export interface MoisAleatoire {
  prix: number;
  coutVariableUnitaire: number;
  chargesFixes: number;
  /** L'espérance des ventes du mois, en enceintes. */
  moyenne: number;
  /** L'écart-type des ventes du mois, en enceintes. */
  ecartType: number;
}

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Le mois de janvier de la fiche, avec sa demande aléatoire. */
export function moisAleatoireDeLaFiche(f: FicheDeGestion, leviers: Partial<MoisAleatoire> = {}): MoisAleatoire {
  const d = donneesDuMois(f);
  return { prix: d.prix, coutVariableUnitaire: d.coutVariableUnitaire, chargesFixes: d.chargesFixes, moyenne: d.quantite, ecartType: ECART_TYPE_DE_LA_DEMANDE, ...leviers };
}

/**
 * Le seuil probabilisé d'un mois : les lois du chiffre d'affaires et du résultat, la probabilité
 * d'atteindre le seuil (de ne pas perdre d'argent) et celle d'une perte, exactes et lues à la table.
 */
export function seuilAleatoire(d: MoisAleatoire) {
  const s = seuilDeRentabilite({ prix: d.prix, coutVariableUnitaire: d.coutVariableUnitaire, chargesFixes: d.chargesFixes, quantite: d.moyenne, jours: 30 });
  const marge = s.margeUnitaire;
  const seuil = s.seuilExact;
  // La variable centrée réduite du seuil : t = (seuil − espérance) ÷ écart-type.
  const t = seuil === null ? Number.NEGATIVE_INFINITY : (seuil - d.moyenne) / d.ecartType;
  const perte = seuil === null ? 1 : repartitionNormale(t);
  return {
    ...d,
    marge,
    seuil,
    /** Le seuil en valeur, au taux de marge exact. */
    seuilValeur: s.seuilValeur,
    chiffreDAffaires: { esperance: auCentime(d.prix * d.moyenne), ecartType: auCentime(d.prix * d.ecartType) },
    resultat: { esperance: auCentime(marge * d.moyenne - d.chargesFixes), ecartType: auCentime(marge * d.ecartType) },
    t,
    probabiliteDePerte: seuil === null ? 1 : perte,
    probabiliteDeProfit: seuil === null ? 0 : 1 - perte,
    /** Ce que l'élève lit à la table : t arrondi à deux décimales. */
    tLu: arrondi(t, 2),
    profitLu: seuil === null ? 0 : lectureDeLaTable(-t),
    perteLue: seuil === null ? 1 : lectureDeLaTable(t),
  };
}

export type SeuilAleatoire = ReturnType<typeof seuilAleatoire>;

/** P(R ≥ r) : la probabilité que le résultat du mois atteigne `r`, exacte. */
export function probabiliteDuResultat(x: SeuilAleatoire, r: number) {
  return 1 - repartitionNormale((r - x.resultat.esperance) / x.resultat.ecartType);
}

/** Le résultat que le mois dépasse avec la probabilité `p` : E(R) − t × σ(R), Π(t) = p. */
export const resultatDepasse = (x: SeuilAleatoire, p: number, t: number = quantileNormal(p)) => auCentime(x.resultat.esperance - t * x.resultat.ecartType);

/** Le plus grand écart-type des ventes qui laisse le mois en profit avec la probabilité `p` : E(R) ÷ (t × marge). */
export const ecartTypeTenable = (x: SeuilAleatoire, p: number, t: number = quantileNormal(p)) => x.resultat.esperance / (t * x.marge);

/**
 * La somme de `n` mois indépendants comme celui-ci : l'espérance se multiplie par n, la variance
 * aussi, l'écart-type par √n. La perte de la période, et sa lecture à la table.
 */
export function cumulDeMois(x: SeuilAleatoire, n: number) {
  const esperance = auCentime(n * x.resultat.esperance);
  const ecartType = auCentime(x.resultat.ecartType * Math.sqrt(n));
  const t = -esperance / ecartType;
  return { n, esperance, ecartType, t, tLu: arrondi(t, 2), probabiliteDePerte: repartitionNormale(t), perteLue: lectureDeLaTable(t) };
}

/** La fourchette du directeur : l'intervalle centré sur l'espérance qui contient les ventes avec la probabilité `confiance`. */
export function fourchetteDesVentes(x: Pick<MoisAleatoire, "moyenne" | "ecartType">, t: number) {
  return { bas: auCentime(x.moyenne - t * x.ecartType), haut: auCentime(x.moyenne + t * x.ecartType) };
}

/** L'écart-type que suppose une fourchette centrée : la demi-largeur divisée par t. */
export const ecartTypeDeLaFourchette = (bas: number, haut: number, t: number) => ({ moyenne: auCentime((bas + haut) / 2), ecartType: auCentime((haut - bas) / 2 / t) });
