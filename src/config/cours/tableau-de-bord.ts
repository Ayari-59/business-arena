import { anneeDuCours as anneeJouee } from "./monde/annee-du-cours";

/**
 * LE TABLEAU DE BORD DE L'ANNÉE : SIX INDICATEURS, QUATRE TRIMESTRES DE L'ARÈNE.
 *
 * L'année jouée par le moteur (`anneeJouee`), la même que celle des autres chapitres.
 * Chaque trimestre se résume en six indicateurs : le chiffre d'affaires, le taux de marge
 * sur coût variable, le seuil de rentabilité et l'indice de sécurité qu'il donne, le
 * résultat d'exploitation, la trésorerie de fin et la part de marché. Les montants sont
 * arrondis à l'euro, les taux au dixième de point : ce qu'un tableau de bord affiche.
 */

export interface IndicateursDuTrimestre {
  chiffreDAffaires: number;
  marge: number;
  chargesFixes: number;
  /** En pourcentage, au dixième. */
  tauxDeMarge: number;
  seuil: number;
  /** En pourcentage, au dixième : négatif sous le seuil. */
  indiceDeSecurite: number;
  resultat: number;
  tresorerie: number;
  /** En pourcentage, au dixième. */
  partDeMarche: number;
}

const auDixieme = (x: number) => Math.round(x * 10) / 10;
const tableaux = new Map<string, IndicateursDuTrimestre[]>();

export function tableauDeBord(code: string): IndicateursDuTrimestre[] {
  const deja = tableaux.get(code);
  if (deja) return deja;
  const trimestres = anneeJouee(code).partie.rounds.map((t) => {
    const r = t.results["joueur"]!;
    const is = r.incomeStatement;
    const chiffreDAffaires = Math.round(is.revenue);
    const marge = Math.round(is.grossMargin);
    const chargesFixes = Math.round(
      is.fixedCosts + is.marketingCost + is.qualityCost + is.maintenanceCost + is.depreciation + (is.engagementRse ?? 0) + (is.rdCost ?? 0),
    );
    // Le seuil sur les montants arrondis que l'élève lit : charges fixes ÷ taux de marge.
    const seuil = Math.round((chargesFixes * chiffreDAffaires) / marge);
    return {
      chiffreDAffaires,
      marge,
      chargesFixes,
      tauxDeMarge: auDixieme((marge / chiffreDAffaires) * 100),
      seuil,
      indiceDeSecurite: auDixieme(((chiffreDAffaires - seuil) / chiffreDAffaires) * 100),
      resultat: Math.round(is.operatingIncome),
      tresorerie: Math.round(r.cashFlow.closing),
      partDeMarche: auDixieme(r.market.totalShare * 100),
    };
  });
  tableaux.set(code, trimestres);
  return trimestres;
}

/** Le premier trimestre sous le seuil de rentabilité (1 à 4), ou null si l'année n'y passe jamais. */
export function premierSousLeSeuil(code: string): number | null {
  const i = tableauDeBord(code).findIndex((t) => t.indiceDeSecurite < 0);
  return i < 0 ? null : i + 1;
}

/**
 * Le premier passage d'un trimestre au suivant où le résultat et la trésorerie vont en sens
 * contraires (l'un monte, l'autre baisse), ou null s'ils vont toujours ensemble.
 */
export function premierDesaccord(code: string): { de: number; a: number } | null {
  const t = tableauDeBord(code);
  for (let k = 1; k < t.length; k++) {
    const dr = t[k]!.resultat - t[k - 1]!.resultat;
    const dt = t[k]!.tresorerie - t[k - 1]!.tresorerie;
    if (dr * dt < 0) return { de: k, a: k + 1 };
  }
  return null;
}
