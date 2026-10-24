import { soldUnits } from "../../engine/simulation/runGame";
import { rejouerLePremierTrimestre } from "./decision";

/**
 * LA CAMPAGNE : L'ARÈNE REJOUE LE TRIMESTRE À D'AUTRES BUDGETS.
 *
 * Le premier trimestre de l'année du cours (même réglage, même graine, mêmes concurrents),
 * joué à plusieurs budgets d'acquisition : sans campagne, à la moitié du budget de la
 * gestion équilibrée, à ce budget, puis une fois et demie et deux fois plus. Seul le budget
 * change ; le prix, le plan et les concurrents restent ceux du trimestre. Ce que le commercial
 * espère d'une campagne, l'arène le joue : la demande répond au budget, de moins en moins
 * à mesure qu'il monte.
 *
 * LES BUDGETS ÉTUDIÉS sont des multiples de celui du trimestre : zéro dit ce que la
 * campagne apporte en tout, les paliers d'une demi-fois disent ce qu'apporte chaque euro de
 * plus. Ils encadrent le budget joué sans prétendre trouver l'optimum de l'arène.
 */
export const PALIERS_DE_BUDGET = [0, 0.5, 1, 1.5, 2] as const;

export interface Campagne {
  facteur: number;
  budget: number;
  /** Les commandes de toutes les clientèles, et celles des nouveaux clients (le trafic payant). */
  commandes: number;
  nouveaux: number;
  chiffreDAffaires: number;
  /** La marge brute du trimestre : ce qui reste des ventes une fois payés les coûts variables. */
  marge: number;
  resultat: number;
}

const campagnes = new Map<string, Campagne[]>();

/** Les budgets joués, du plus petit au plus grand ; `nouveaux` lit la clientèle `acquisition`. */
export function campagnesRejouees(code: string, clienteleDesNouveaux = "acquisition"): Campagne[] {
  const deja = campagnes.get(code);
  if (deja) return deja;
  const v = PALIERS_DE_BUDGET.map((facteur) => {
    const r = rejouerLePremierTrimestre(code, (d) => ({ ...d, marketingBudget: d.marketingBudget * facteur }));
    const is = r.incomeStatement;
    return {
      facteur,
      budget: Math.round(is.marketingCost),
      commandes: Math.round(soldUnits(r)),
      nouveaux: Math.round(r.market.bySegment[clienteleDesNouveaux]?.sold ?? 0),
      chiffreDAffaires: Math.round(is.revenue),
      marge: Math.round(is.grossMargin),
      resultat: Math.round(is.operatingIncome),
    };
  });
  campagnes.set(code, v);
  return v;
}
