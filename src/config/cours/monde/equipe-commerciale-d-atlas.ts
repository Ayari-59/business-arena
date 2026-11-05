import { COMMERCIAUX, COMPTES } from "./atlas-conseil";

/**
 * LE MONDE DU COURS : LA DISPERSION DES RÉSULTATS DES COMMERCIAUX D'ATLAS CONSEIL, ET L'ANIMATION DE
 * L'ÉQUIPE (le parcours BTS NDRC, bloc 1 : l'analyse des indicateurs, position et dispersion, et la
 * performance collective).
 *
 * Le complément du chapitre « Le tableau de bord commercial ». Le tableau de bord lit le panier moyen
 * de chaque commercial ; ce module ouvre un trimestre, contrat par contrat, pour voir ce que la moyenne
 * cache : les 13 contrats que Nadia, la commerciale des entreprises, a signés au trimestre 4 de N. Ils
 * refont exactement son trimestre de la fiche (monde/atlas-conseil.ts : 13 contrats, 228 journées,
 * 179 400 €) et sont pris dans ses comptes, au prix de chacun : 800 € la journée, 760 € pour les
 * Laboratoires Sérénoa et les Laiteries Montbrême, qui ont une remise d'usage.
 */

export interface ContratDuTrimestre {
  /** Le compte, par son code dans le portefeuille (atlas-conseil.ts). */
  compte: string;
  journees: number;
}

/**
 * LES 13 CONTRATS DE NADIA AU TRIMESTRE 4 DE N (hypothèse du cours), du plus gros au plus petit. Chaque
 * contrat reste dans les journées de l'année de son compte. 4 contrats font les trois quarts du
 * chiffre d'affaires ; les 9 autres sont des petites formations de PME.
 */
export const CONTRATS_DE_NADIA_AU_T4: readonly ContratDuTrimestre[] = [
  { compte: "ducastel", journees: 56 },
  { compte: "serenoa", journees: 45 },
  { compte: "kerval", journees: 36 },
  { compte: "montbreme", journees: 30 },
  { compte: "garance", journees: 9 },
  { compte: "rouviere", journees: 8 },
  { compte: "vauclair", journees: 8 },
  { compte: "malvine", journees: 8 },
  { compte: "roudier", journees: 7 },
  { compte: "lorvan", journees: 6 },
  { compte: "ostrea", journees: 5 },
  { compte: "ambrette", journees: 5 },
  { compte: "lumen", journees: 5 },
];

/** Les plus gros contrats dont le chapitre fait calculer la part du chiffre d'affaires. */
export const GROS_CONTRATS = 4;

const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** La médiane d'une série : la valeur du milieu, ou la moyenne des deux du milieu. */
export function mediane(xs: readonly number[]) {
  const t = [...xs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 === 1 ? t[m]! : (t[m - 1]! + t[m]!) / 2;
}

/** L'écart-type d'une série (de la population) : la racine de la moyenne des carrés des écarts à la moyenne. */
export function ecartType(xs: readonly number[]) {
  const m = somme(xs) / xs.length;
  return Math.sqrt(somme(xs.map((x) => (x - m) ** 2)) / xs.length);
}

/**
 * LES CONTRATS DE NADIA AU T4 : le montant de chacun (ses journées au prix de son compte de N), puis la
 * position et la dispersion de la série : moyenne (le panier moyen du tableau de bord), médiane,
 * étendue, écart-type, coefficient de variation, et la part des plus gros contrats.
 */
export function contratsDeNadia() {
  const contrats = CONTRATS_DE_NADIA_AU_T4.map((k) => {
    const c = COMPTES.find((x) => x.code === k.compte)!;
    const prix = c.chiffreDAffaires / c.journees;
    return { ...k, nom: c.nom, prix, montant: auCentime(k.journees * prix) };
  });
  const montants = contrats.map((k) => k.montant);
  const total = auCentime(somme(montants));
  const moyenne = total / montants.length;
  const e = ecartType(montants);
  const gros = [...montants].sort((a, b) => b - a).slice(0, GROS_CONTRATS);
  const t4 = COMMERCIAUX.find((k) => k.code === "entreprises")!.n[3]!;
  return {
    contrats,
    nombre: contrats.length,
    journees: somme(contrats.map((k) => k.journees)),
    total,
    /** Le trimestre de la fiche, que les contrats doivent refaire. */
    trimestreDeLaFiche: t4,
    moyenne,
    mediane: mediane(montants),
    plusGros: Math.max(...montants),
    plusPetit: Math.min(...montants),
    etendue: Math.max(...montants) - Math.min(...montants),
    ecartType: e,
    coefficientDeVariation: e / moyenne,
    partDesGros: somme(gros) / total,
    contratsSousLaMoyenne: montants.filter((x) => x < moyenne).length,
  };
}
