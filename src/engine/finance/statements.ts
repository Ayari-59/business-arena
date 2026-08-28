import type { BalanceSheet, CashFlowItem, IncomeStatement } from "../types";

/**
 * États financiers d'un tour (doc 02 §6). Construction comptable cohérente :
 * le bilan de clôture équilibre par construction (invariant testé, doc 09).
 * Année commerciale de 360 jours pour les prorata de taux et de délais.
 */

export interface FinanceInput {
  opening: BalanceSheet;
  roundDays: number;
  revenue: number;
  /** Ratio de CA encaissé à crédit : Σ(CA segment × min(1, délai/jours du tour)) / CA. */
  receivableRatio: number;
  /** Achats de matières du tour (consommées à la production). */
  purchases: number;
  payableRatio: number; // min(1, délai fournisseur / jours du tour)
  /** Autres coûts variables décaissés (MOD, énergie). */
  otherVariableCash: number;
  /** Variation de stock de produits finis valorisée (production stockée). */
  inventoryChange: number;
  /** Coût variable des unités vendues (CUMP). */
  cogs: number;
  marketingCost: number;
  qualityCost: number;
  maintenanceCost: number;
  fixedCosts: number;
  depreciation: number;
  loanAnnualRate: number;
  overdraftAnnualRate: number;
  interestMultiplier: number; // événements (hausse des taux)
  taxRate: number;
  /** Taux de TVA (0 = désactivée) — voir EngineScenarioConfig.finance.vatRate. */
  vatRate: number;
  newLoan: number;
  loanRepayment: number;
  /** Apport en capital du tour (trésorerie et capitaux propres). */
  capitalIncrease: number;
  /**
   * Dividende versé ce tour : il sort de la caisse ET des capitaux propres.
   * L'identité du bilan tient d'elle-même, les deux baissant du même montant.
   * Le plafonnement aux réserves distribuables est fait par l'appelant.
   */
  dividend?: number;
  /** Investissement du tour : décaissé et immobilisé immédiatement. */
  investmentOutlay: number;
  /**
   * Gestion de trésorerie (optionnel) : mobilisation de créances demandée et
   * paramètres du scénario. Au-delà du plafond de découvert, un affacturage
   * FORCÉ au taux punitif ramène le solde dans les clous (deux passes,
   * déterministe) ; s'il n'y a plus de créances à céder : crise caractérisée.
   */
  treasury?: {
    discountRequest: number;
    factoringRequest: number;
    discountAnnualRate: number;
    discountMaxShare: number;
    factoringFeeRate: number;
    forcedFactoringFeeRate: number;
    overdraftLimit: number;
    /**
     * Placement de trésorerie (optionnel). Le montant demandé quitte la caisse
     * ce tour et revient au suivant ; celui du tour précédent (opening
     * .shortTermInvestment) revient maintenant, avec ses intérêts.
     */
    placementRequest?: number;
    placementAnnualRate?: number;
  };
}

export interface FinanceOutput {
  incomeStatement: IncomeStatement;
  closing: BalanceSheet;
  cashFlow: { opening: number; items: CashFlowItem[]; closing: number };
  treasury: {
    discounted: number;
    factored: number;
    forcedFactored: number;
    financingCost: number;
    crisis: boolean;
    placed: number;
    matured: number;
    placementIncome: number;
  };
}

export function computeFinance(input: FinanceInput): FinanceOutput {
  const o = input.opening;
  const periodFraction = input.roundDays / 360;
  const t = input.treasury;

  // Créances TTC du tour, avant mobilisation (base de l'escompte/affacturage).
  const vat = input.vatRate;
  const receivablesGross = input.revenue * (1 + vat) * input.receivableRatio;

  // Mobilisations volontaires (bornées) : escompte plafonné à une part du
  // poste clients, affacturage sur le solde.
  const discounted = t
    ? Math.min(Math.max(0, t.discountRequest), t.discountMaxShare * receivablesGross)
    : 0;
  const discountCost = t ? discounted * t.discountAnnualRate * periodFraction : 0;
  const factored = t
    ? Math.min(Math.max(0, t.factoringRequest), receivablesGross - discounted)
    : 0;
  const factoringCost = t ? factored * t.factoringFeeRate : 0;

  // Placement de trésorerie. Celui du tour précédent arrive à terme
  // maintenant : le principal revient en caisse et les intérêts sont un
  // PRODUIT financier. Le nouveau placement, lui, quitte la caisse et n'y
  // reviendra qu'au tour suivant : il ne peut donc pas payer les charges de
  // ce tour-ci. C'est là tout l'arbitrage, et c'est pour cela qu'on peut se
  // retrouver à payer un découvert tout en détenant un placement.
  const matured = o.shortTermInvestment ?? 0;
  const placementIncome = matured * (t?.placementAnnualRate ?? 0) * periodFraction;
  const placed = t?.placementAnnualRate
    ? Math.max(0, Math.min(t.placementRequest ?? 0, o.cash + matured))
    : 0;

  /** Construit les états pour un montant d'affacturage forcé donné. */
  const build = (forcedFactored: number) => {
    const forcedCost = t ? forcedFactored * t.forcedFactoringFeeRate : 0;
    const financingCost = discountCost + factoringCost + forcedCost;

    // --- Compte de résultat -----------------------------------------------
    const variableProductionCost = input.purchases + input.otherVariableCash;
    const grossMargin = input.revenue - input.cogs;
    const ebitda =
      grossMargin -
      input.marketingCost -
      input.qualityCost -
      input.maintenanceCost -
      input.fixedCosts;
    const depreciation = Math.min(input.depreciation, o.fixedAssetsNet);
    const operatingIncome = ebitda - depreciation;
    // charges financières : intérêts de la dette + coûts de mobilisation
    const interest =
      (o.financialDebt * input.loanAnnualRate + o.overdraft * input.overdraftAnnualRate) *
        periodFraction *
        input.interestMultiplier +
      financingCost;
    const pretaxIncome = operatingIncome - interest + placementIncome;
    const tax = input.taxRate * Math.max(0, pretaxIncome);
    const netIncome = pretaxIncome - tax;

    const incomeStatement: IncomeStatement = {
      revenue: input.revenue,
      productionStocked: input.inventoryChange,
      cogs: input.cogs,
      variableProductionCost,
      grossMargin,
      marketingCost: input.marketingCost,
      qualityCost: input.qualityCost,
      maintenanceCost: input.maintenanceCost,
      fixedCosts: input.fixedCosts,
      ebitda,
      depreciation,
      operatingIncome,
      interest,
      financialIncome: placementIncome,
      pretaxIncome,
      tax,
      netIncome,
    };

    // --- Créances, dettes fournisseurs, TVA, flux de trésorerie -----------
    // TVA : le compte de résultat reste HT ; créances et dettes deviennent
    // TTC, la TVA nette du tour est décaissée au tour SUIVANT (dette du BFR).
    const openingVat = o.vatLiability ?? 0;
    const mobilized = discounted + factored + forcedFactored;
    const receivablesEnd = receivablesGross - mobilized;
    const collections = input.revenue * (1 + vat) + o.receivables - receivablesGross;
    const payablesEnd = input.purchases * (1 + vat) * input.payableRatio;
    const supplierPayments = input.purchases * (1 + vat) + o.payables - payablesEnd;
    const vatDue = vat * (input.revenue - input.purchases); // négatif = crédit de TVA
    const loanRepayment = Math.min(input.loanRepayment, o.financialDebt);

    const items: CashFlowItem[] = [
      { label: "encaissements_clients", amount: collections },
      // mobilisations : le brut entre en caisse, les coûts sont déjà dans
      // la ligne « interets » (charges financières)
      { label: "escompte_creances", amount: discounted },
      { label: "affacturage", amount: factored },
      { label: "affacturage_force", amount: forcedFactored },
      { label: "paiements_fournisseurs", amount: -supplierPayments },
      { label: "couts_variables_decaisses", amount: -input.otherVariableCash },
      { label: "couts_fixes", amount: -input.fixedCosts },
      { label: "marketing", amount: -input.marketingCost },
      { label: "qualite", amount: -input.qualityCost },
      { label: "maintenance", amount: -input.maintenanceCost },
      { label: "interets", amount: -interest },
      { label: "impot", amount: -tax },
      { label: "tva_decaissee", amount: -openingVat },
      { label: "investissement", amount: -input.investmentOutlay },
      { label: "nouvel_emprunt", amount: input.newLoan },
      { label: "augmentation_capital", amount: input.capitalIncrease },
      { label: "dividendes_verses", amount: -(input.dividend ?? 0) },
      { label: "remboursement_emprunt", amount: -loanRepayment },
      { label: "placement_arrive_a_terme", amount: matured },
      { label: "produits_financiers", amount: placementIncome },
      { label: "placement_souscrit", amount: -placed },
    ].filter((i) => i.amount !== 0);

    const netFlow = items.reduce((s, i) => s + i.amount, 0);
    const openingNet = o.cash - o.overdraft;
    const closingNet = openingNet + netFlow;

    // --- Bilan de clôture -------------------------------------------------
    const closing: BalanceSheet = {
      fixedAssetsNet: o.fixedAssetsNet - depreciation + input.investmentOutlay,
      inventoryValue: o.inventoryValue + input.inventoryChange,
      receivables: receivablesEnd,
      cash: Math.max(0, closingNet),
      shortTermInvestment: placed,
      equity: o.equity + netIncome + input.capitalIncrease - (input.dividend ?? 0),
      financialDebt: o.financialDebt + input.newLoan - loanRepayment,
      payables: payablesEnd,
      overdraft: Math.max(0, -closingNet),
      vatLiability: vatDue,
    };

    return {
      incomeStatement,
      closing,
      cashFlow: { opening: openingNet, items, closing: closingNet },
      receivablesEnd,
      closingNet,
      forcedCost,
    };
  };

  // Première passe sans affacturage forcé ; si le découvert dépasse le
  // plafond et qu'il reste des créances, la banque force la cession
  // (le coût étant déductible, la seconde passe ne peut que remonter le solde).
  let forcedFactored = 0;
  let pass = build(0);
  if (t && pass.closingNet < -t.overdraftLimit && pass.receivablesEnd > 0) {
    const gap = -pass.closingNet - t.overdraftLimit;
    forcedFactored = Math.min(pass.receivablesEnd, gap / (1 - t.forcedFactoringFeeRate));
    pass = build(forcedFactored);
  }

  const crisis = t ? pass.closingNet < -t.overdraftLimit - 0.01 : false;
  return {
    incomeStatement: pass.incomeStatement,
    closing: pass.closing,
    cashFlow: pass.cashFlow,
    treasury: {
      discounted,
      factored,
      forcedFactored,
      financingCost: discountCost + factoringCost + pass.forcedCost,
      crisis,
      placed,
      matured,
      placementIncome,
    },
  };
}

/** Total actif = total passif (contrôle d'équilibre, testé au centime). */
export function balanceGap(b: BalanceSheet): number {
  const assets =
    b.fixedAssetsNet +
    b.inventoryValue +
    b.receivables +
    b.cash +
    (b.shortTermInvestment ?? 0);
  const liabilities =
    b.equity + b.financialDebt + b.payables + b.overdraft + (b.vatLiability ?? 0);
  return assets - liabilities;
}
