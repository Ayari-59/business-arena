import type { BalanceSheet, IncomeStatement } from "../types";

/**
 * Profitabilité et rentabilités (doc 02 §6.4, §17) : « gagner de l'argent »
 * n'est pas « être rentable par rapport aux moyens engagés ».
 */
export interface Ratios {
  profitability: number; // résultat net / CA
  returnOnCapitalEmployed: number; // Re : REX net d'IS / (CP + dettes financières)
  returnOnEquity: number; // Rf : résultat net / CP
  leverage: number; // effet de levier = Rf − Re
  debtToEquity: number;
  assetTurnover: number; // CA / total actif
}

/** L'actif du bilan : immobilisations, stocks, créances, trésorerie, placements, écart d'acquisition. */
export function totalDeLActif(b: BalanceSheet): number {
  const actifs = b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash + (b.shortTermInvestment ?? 0);
  // L'écart d'acquisition (niveau 7) n'est additionné que présent.
  return b.goodwill !== undefined ? actifs + b.goodwill : actifs;
}

/**
 * Le résultat d'exploitation net d'impôt. Une perte d'exploitation ne porte pas
 * d'impôt : la multiplier par (1 − taux) la faisait paraître plus petite qu'elle
 * n'est.
 */
const rexNetDImpot = (rex: number, taxRate: number) => (rex > 0 ? rex * (1 - taxRate) : rex);

/**
 * ROE (Rf). Quand les capitaux propres sont nuls ou négatifs, le ratio
 * résultat / CP n'a plus de sens : une PERTE sur des CP négatifs donnerait
 * un ratio POSITIF (perte < 0 ÷ CP < 0), qui se lirait comme une réussite.
 * Or des CP effacés sont le pire état de rentabilité pour l'associé. On
 * distingue donc deux cas plutôt que de tout ramener à 0 (neutre, ce qui
 * notait une entreprise insolvable au milieu de l'échelle) :
 *  - CP ≤ 0 ET perte → plancher à −1 (−100 %, « capitaux propres effacés »),
 *    en dessous de toute borne min de scénario : le score de rentabilité
 *    tombe donc au plancher, et l'affichage montre −100 % en rouge ;
 *  - CP ≤ 0 mais résultat positif (redressement en cours) → 0 (neutre) :
 *    on ne récompense pas une base de capital inexistante, mais on ne punit
 *    pas non plus une entreprise qui regagne de l'argent.
 */
const rentabiliteFinanciere = (netIncome: number, equity: number) =>
  equity > 0 ? netIncome / equity : netIncome < 0 ? -1 : 0;

/**
 * Les ratios DU TOUR. Le Rf du tour est celui que lit l'indice de performance
 * (`scoring/bpi.ts`, repères par tour) : il ne change pas. Les ratios affichés
 * à l'élève se lisent sur l'année (`ratiosDeLAnnee`).
 */
export function computeRatios(is: IncomeStatement, b: BalanceSheet, taxRate: number): Ratios {
  const capitalEmployed = b.equity + b.financialDebt;
  const totalAssets = totalDeLActif(b);
  const roce = capitalEmployed > 0 ? rexNetDImpot(is.operatingIncome, taxRate) / capitalEmployed : 0;
  const roe = rentabiliteFinanciere(is.netIncome, b.equity);
  return {
    profitability: is.revenue > 0 ? is.netIncome / is.revenue : 0,
    returnOnCapitalEmployed: roce,
    returnOnEquity: roe,
    leverage: roe - roce,
    debtToEquity: b.equity > 0 ? b.financialDebt / b.equity : 0,
    assetTurnover: totalAssets > 0 ? is.revenue / totalAssets : 0,
  };
}

/** Les ratios de l'année, et sur combien de tours ils sont lus. */
export interface RatiosDeLAnnee extends Ratios {
  /** Les tours lus : l'année glissante, ou moins en début de partie. */
  toursLus: number;
  /** Les tours d'une année à cette durée de tour (quatre au trimestre). */
  toursParAn: number;
  /** Moins d'une année jouée : les flux sont ramenés à l'année (× toursParAn ÷ toursLus). */
  annualise: boolean;
  /** Le coût de la dette, net d'impôt et ramené à l'année : intérêts ÷ (dettes financières + découvert). */
  coutDeLaDette: number | null;
  /**
   * L'effet de levier est-il vraiment celui de la dette : l'outil rapporte, mais moins que
   * la dette ne coûte (0 < Re < coût de la dette) ? Faux quand Rf passe sous Re pour une
   * autre raison : une perte d'exploitation (Re ≤ 0, c'est l'outil qui perd), ou des
   * produits et charges hors exploitation.
   */
  laDettePese: boolean;
}

/**
 * LES RATIOS SUR L'ANNÉE GLISSANTE. Re, Rf et la rotation rapportaient les flux d'UN
 * trimestre à des capitaux et un actif qui sont ceux de l'année : un Re de 3,5 % au
 * trimestre se lisait sous le repère de 8 %, qui est annuel. Les flux se lisent donc sur
 * les quatre derniers trimestres (l'année de tours à cette durée) ; tant qu'il y en a
 * moins, ils sont ramenés à l'année, et l'affichage le dit. Les capitaux et l'actif sont
 * ceux de la clôture du dernier tour. La rentabilité nette (RN ÷ CA) et l'endettement ne
 * dépendent pas de la durée : ils se lisent sur la même fenêtre, sans annualisation.
 *
 * `tours` : les comptes de chaque tour, du plus ancien au plus récent, jusqu'au tour lu.
 */
export function ratiosDeLAnnee(
  tours: readonly { incomeStatement: IncomeStatement; balanceSheet: BalanceSheet }[],
  taxRate: number,
  roundDays: number,
): RatiosDeLAnnee {
  const toursParAn = Math.max(1, Math.round(360 / Math.max(1, roundDays)));
  const fenetre = tours.slice(-toursParAn);
  const toursLus = fenetre.length;
  const dernier = fenetre.at(-1);
  if (!dernier) {
    return {
      profitability: 0,
      returnOnCapitalEmployed: 0,
      returnOnEquity: 0,
      leverage: 0,
      debtToEquity: 0,
      assetTurnover: 0,
      toursLus: 0,
      toursParAn,
      annualise: false,
      coutDeLaDette: null,
      laDettePese: false,
    };
  }
  const somme = (lire: (is: IncomeStatement) => number) => fenetre.reduce((s, t) => s + lire(t.incomeStatement), 0);
  const aLAnnee = toursParAn / toursLus;
  const ca = somme((is) => is.revenue);
  const rex = somme((is) => is.operatingIncome) * aLAnnee;
  const rn = somme((is) => is.netIncome) * aLAnnee;
  const interets = somme((is) => is.interest) * aLAnnee;
  const b = dernier.balanceSheet;
  const capitalEmployed = b.equity + b.financialDebt;
  const totalAssets = totalDeLActif(b);
  const re = capitalEmployed > 0 ? rexNetDImpot(rex, taxRate) / capitalEmployed : 0;
  const rf = rentabiliteFinanciere(rn, b.equity);
  const dettes = b.financialDebt + b.overdraft;
  const coutDeLaDette = dettes > 0 ? (interets * (1 - taxRate)) / dettes : null;
  const leverage = rf - re;
  return {
    profitability: ca > 0 ? somme((is) => is.netIncome) / ca : 0,
    returnOnCapitalEmployed: re,
    returnOnEquity: rf,
    leverage,
    debtToEquity: b.equity > 0 ? b.financialDebt / b.equity : 0,
    assetTurnover: totalAssets > 0 ? (ca * aLAnnee) / totalAssets : 0,
    toursLus,
    toursParAn,
    annualise: toursLus < toursParAn,
    coutDeLaDette,
    laDettePese: leverage < 0 && re > 0 && coutDeLaDette !== null && coutDeLaDette > re,
  };
}
