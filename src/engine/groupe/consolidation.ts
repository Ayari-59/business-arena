import type { BalanceSheet, CompanyRoundResult, CompanyState, EngineScenarioConfig } from "../types";
import { toGamme } from "../gamme";
import { chiffresDuFournisseur, comptesDuFournisseur, ebeDeReference, leFournisseur, valeurDUneSociete } from "./fournisseur";
import type { Consolidation, Filiale } from "./types";

/**
 * LE GROUPE CONSOLIDÉ (niveau 7) : intégration globale, à la clôture du tour.
 *
 * Les comptes de l'équipe restent ses comptes sociaux : elle y porte ses
 * filiales en titres de participation, au prix payé. Le groupe, lui :
 *
 *   - élimine les titres et intègre les actifs et les dettes des filiales ;
 *   - porte l'écart d'acquisition (prix moins la part des capitaux propres
 *     acquis), non amorti, déprécié quand ce qu'un acheteur paierait la part
 *     du groupe (sa valeur, prime de contrôle comprise, comme au rachat) ne
 *     couvre plus ce qu'il en porte ;
 *   - élimine les ventes d'un fournisseur filiale au groupe : ses achats ne
 *     coûtent plus que leur coût, la marge interne revient au groupe ; celle
 *     qui dort encore dans le stock de produits finis est retirée du stock et
 *     du résultat, jusqu'à ce qu'il se vende ;
 *   - attribue aux autres actionnaires d'une filiale leur part de ses
 *     capitaux propres (intérêts minoritaires) et de son résultat.
 *
 * Bilan consolidé : actif = capitaux propres du groupe + intérêts
 * minoritaires + dettes, au centime (`ecartDuBilanConsolide`).
 */

/** Écart d'un bilan consolidé : actif moins capitaux propres, minoritaires et dettes. */
export function ecartDuBilanConsolide(c: Pick<Consolidation, "bilan" | "interetsMinoritaires">): number {
  const b = c.bilan;
  const actif =
    b.fixedAssetsNet + (b.goodwill ?? 0) + b.inventoryValue + b.receivables + b.cash + (b.shortTermInvestment ?? 0);
  const passif = b.equity + c.interetsMinoritaires + b.financialDebt + b.payables + b.overdraft + (b.vatLiability ?? 0);
  return actif - passif;
}

/** La marge d'un fournisseur filiale encore dans le stock de produits finis de l'acquéreur. */
export function margeEnStock(scenario: EngineScenarioConfig, r: CompanyRoundResult, filiales: readonly Filiale[]): number {
  let marge = 0;
  for (const p of toGamme(scenario)) {
    const pr = r.products?.[p.code];
    const fil = pr?.supplier ? filiales.find((f) => f.type === "fournisseur" && f.id === pr.supplier!.code) : undefined;
    const f = fil ? leFournisseur(scenario, fil.id) : undefined;
    if (!pr || !f) continue;
    const matieres = pr.stock.quantity * p.materialCostPerUnit * pr.supplier!.costMultiplier * (pr.supplier!.priceIndexMultiplier ?? 1);
    marge += matieres * (1 - f.tauxDeCoutVariable);
  }
  return marge;
}

export interface ConsolidationDuTour {
  consolide: Consolidation;
  /** EBE consolidé du tour : l'historique de valeur du groupe. */
  ebe: number;
  filiales: Filiale[];
  margeEnStock: number;
  /** Valeur des parts des autres actionnaires des filiales : retirée de la valeur du groupe. */
  valeurDesMinoritaires: number;
}

export function consolider(args: {
  scenario: EngineScenarioConfig;
  /** L'état de l'acquéreur à la clôture (ses filiales, sa marge en stock d'avant). */
  etat: CompanyState;
  resultat: CompanyRoundResult;
  /** Toutes les entreprises, achats du tour compris : le chiffre d'affaires des fournisseurs. */
  companies: readonly CompanyState[];
}): ConsolidationDuTour {
  const { scenario, etat, resultat: r } = args;
  const g = etat.groupe!;
  const multiple = scenario.groupe!.valorisation.multipleEBE;
  const b = r.balanceSheet;
  const marge = margeEnStock(scenario, r, g.filiales);
  const variationDeMarge = marge - (g.margeEnStock ?? 0);
  let titres = 0;
  let immobilisations = 0;
  let bfr = 0;
  let tresorerie = 0;
  let decouvert = 0;
  let dettes = 0;
  let variationDesCapitaux = 0;
  let ecartNet = 0;
  let minoritaires = 0;
  let valeurDesMinoritaires = 0;
  let ca = 0;
  let ebe = 0;
  let resultat = 0;
  let depreciations = 0;
  let partDesMinoritaires = 0;
  let ventesInternes = 0;
  const detail: Consolidation["filiales"] = [];
  const filiales = g.filiales.map((fil) => {
    const f = leFournisseur(scenario, fil.id)!;
    const comptes = comptesDuFournisseur(f, chiffresDuFournisseur(args.companies, f.code), scenario.finance.taxRate);
    const c = comptes[comptes.length - 1]!;
    const valeur = valeurDUneSociete({
      comptes,
      ebe: comptes.slice(1).map((x) => x.ebe),
      cours: 1,
      coursDeDepart: 1,
      multiple,
      roundDays: scenario.roundDays,
      ebeReference: ebeDeReference(f),
    }).valeur;
    // Le test de dépréciation : ce qu'un acheteur paierait aujourd'hui la part
    // du groupe (sa valeur, prime de contrôle comprise, comme au rachat)
    // couvre-t-il la part des capitaux propres et l'écart qui reste ?
    const reste = fil.ecart - fil.depreciation;
    const porte = fil.part * c.capitauxPropres + reste;
    const recouvrable = fil.part * valeur * (1 + (scenario.groupe!.rachat?.primeDeControle ?? 0));
    const depreciation = Math.min(reste, Math.max(0, porte - recouvrable));
    titres += fil.prixPaye;
    immobilisations += c.immobilisations;
    bfr += c.bfr;
    tresorerie += Math.max(0, c.tresorerie);
    decouvert += Math.max(0, -c.tresorerie);
    dettes += c.dette;
    variationDesCapitaux += fil.part * (c.capitauxPropres - fil.capitauxPropresDAcquisition) - (fil.depreciation + depreciation);
    ecartNet += reste - depreciation;
    minoritaires += (1 - fil.part) * c.capitauxPropres;
    valeurDesMinoritaires += (1 - fil.part) * valeur;
    const interne = r.groupe?.achats?.[f.code] ?? 0;
    ventesInternes += interne;
    ca += c.chiffreDAffaires - interne;
    ebe += c.ebe;
    resultat += c.resultat;
    depreciations += depreciation;
    partDesMinoritaires += (1 - fil.part) * c.resultat;
    detail.push({ id: fil.id, nom: fil.nom, part: fil.part, comptes: c, valeur, ecart: reste - depreciation, depreciationDuTour: depreciation });
    return { ...fil, depreciation: fil.depreciation + depreciation };
  });
  const bilan: BalanceSheet = {
    ...b,
    fixedAssetsNet: b.fixedAssetsNet - titres + immobilisations,
    goodwill: (b.goodwill ?? 0) + ecartNet,
    inventoryValue: b.inventoryValue - marge,
    receivables: b.receivables + bfr,
    cash: b.cash + tresorerie,
    overdraft: b.overdraft + decouvert,
    financialDebt: b.financialDebt + dettes,
    equity: b.equity + variationDesCapitaux - marge,
  };
  const ebeConsolide = r.incomeStatement.ebitda + ebe - variationDeMarge;
  return {
    consolide: {
      bilan,
      interetsMinoritaires: minoritaires,
      chiffreDAffaires: r.incomeStatement.revenue + ca,
      ebe: ebeConsolide,
      resultatNet: r.incomeStatement.netIncome + resultat - depreciations - variationDeMarge,
      partDesMinoritaires,
      eliminations: { ventesInternes, margeEnStock: marge },
      filiales: detail,
    },
    ebe: ebeConsolide,
    filiales,
    margeEnStock: marge,
    valeurDesMinoritaires,
  };
}
