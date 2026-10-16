import type { BalanceSheet, CompanyRoundResult, CompanyState, EngineScenarioConfig } from "../types";
import { toGamme } from "../gamme";
import { leFournisseur } from "./fournisseur";
import { laSociete, valeurDeLaSociete } from "./societe";
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
 *     couvre plus ce qu'il en porte. L'écart d'une filiale étrangère est un
 *     actif de la filiale : tenu dans sa devise, converti au cours de clôture,
 *     sa variation de change en écart de conversion ; son test se fait dans
 *     sa devise, où le change ne déprécie rien ;
 *   - élimine les ventes d'un fournisseur filiale au groupe : ses achats ne
 *     coûtent plus que leur coût, la marge interne revient au groupe ; celle
 *     qui dort encore dans le stock de produits finis est retirée du stock et
 *     du résultat, jusqu'à ce qu'il se vende ;
 *   - attribue aux autres actionnaires d'une filiale leur part de ses
 *     capitaux propres (intérêts minoritaires) et de son résultat ;
 *   - convertit une filiale étrangère : bilan au cours de clôture, compte de
 *     résultat au cours moyen du tour, la différence en écart de conversion
 *     dans les capitaux propres.
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
  graine: number;
  roundIndex: number;
}): ConsolidationDuTour {
  const { scenario, etat, resultat: r, roundIndex } = args;
  const g = etat.groupe!;
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
  let ecartDeConversion = 0;
  const detail: Consolidation["filiales"] = [];
  const prime = scenario.groupe!.rachat?.primeDeControle ?? 0;
  const filiales = g.filiales.map((fil) => {
    const soc = laSociete(scenario, args.companies, args.graine, fil.type, fil.id, roundIndex)!;
    const c = soc.comptes[soc.comptes.length - 1]!;
    const rc = soc.cours[roundIndex]!;
    const rm = (soc.cours[roundIndex - 1]! + rc) / 2;
    const valeur = valeurDeLaSociete(scenario, soc);
    // Le test de dépréciation, dans la devise de la filiale : ce qu'un acheteur
    // paierait aujourd'hui la part du groupe (sa valeur, prime de contrôle
    // comprise, comme au rachat) couvre-t-il la part des capitaux propres et
    // l'écart qui reste ?
    const resteEnDevise = fil.ecart / fil.coursDAcquisition - fil.depreciation;
    const porte = fil.part * c.capitauxPropres + resteEnDevise;
    const depreciationEnDevise = Math.min(resteEnDevise, Math.max(0, porte - (fil.part * valeur * (1 + prime)) / rc));
    // En euros : l'écart qui reste au cours de clôture, la dépréciation du tour aussi.
    const reste = resteEnDevise * rc;
    const depreciation = depreciationEnDevise * rc;
    const depreciationsPassees = fil.depreciationEnEuros ?? fil.depreciation;
    titres += fil.prixPaye;
    immobilisations += c.immobilisations * rc;
    bfr += c.bfr * rc;
    tresorerie += Math.max(0, c.tresorerie) * rc;
    decouvert += Math.max(0, -c.tresorerie) * rc;
    dettes += c.dette * rc;
    variationDesCapitaux +=
      fil.part * (c.capitauxPropres * rc - fil.capitauxPropresDAcquisition * fil.coursDAcquisition) + (reste - depreciation) - fil.ecart;
    // L'écart de conversion : ce que les capitaux propres ont gagné au cours de
    // clôture, au-delà des résultats convertis au cours moyen de chaque tour.
    const resultatsConvertis = soc.comptes
      .slice(fil.tour, roundIndex + 1)
      .reduce((x, k, i) => x + k.resultat * (soc.cours[fil.tour + i - 1]! + soc.cours[fil.tour + i]!) / 2, 0);
    ecartDeConversion +=
      fil.part * (c.capitauxPropres * rc - fil.capitauxPropresDAcquisition * fil.coursDAcquisition - resultatsConvertis) +
      // l'écart d'acquisition converti au cours de clôture, au-delà de son prix et de ses dépréciations passées
      (reste - depreciation) - (fil.ecart - depreciationsPassees - depreciation);
    ecartNet += reste - depreciation;
    minoritaires += (1 - fil.part) * c.capitauxPropres * rc;
    valeurDesMinoritaires += (1 - fil.part) * valeur;
    const interne = fil.type === "fournisseur" ? (r.groupe?.achats?.[fil.id] ?? 0) : 0;
    ventesInternes += interne;
    ca += c.chiffreDAffaires * rm - interne;
    ebe += c.ebe * rm;
    resultat += c.resultat * rm;
    depreciations += depreciation;
    partDesMinoritaires += (1 - fil.part) * c.resultat * rm;
    detail.push({
      id: fil.id,
      nom: fil.nom,
      part: fil.part,
      comptes: c,
      cours: { cloture: rc, moyen: rm },
      valeur,
      ecart: reste - depreciation,
      depreciationDuTour: depreciation,
    });
    return {
      ...fil,
      depreciation: fil.depreciation + depreciationEnDevise,
      depreciationEnEuros: depreciationsPassees + depreciation,
    };
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
      ecartDeConversion,
      filiales: detail,
    },
    ebe: ebeConsolide,
    filiales,
    margeEnStock: marge,
    valeurDesMinoritaires,
  };
}
