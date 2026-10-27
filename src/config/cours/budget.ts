import type { CompanyRoundResult } from "../../engine/types";
import { scenarioByCode } from "../scenarios/registry";
import { anneeDuCours as anneeJouee } from "./monde/annee-du-cours";

/**
 * LE BUDGET DU DEUXIÈME TRIMESTRE : PRÉVU PAR RECONDUCTION, PUIS RÉALISÉ PAR L'ARÈNE.
 *
 * Le premier trimestre est celui de l'année jouée par le moteur (`anneeJouee`, le même pour
 * tous les chapitres). Le budget du deuxième le reconduit : mêmes ventes, mêmes achats,
 * mêmes charges ; il applique les règles de paiement du moteur, celles d'un trimestre de
 * l'arène : les clients paient à leur délai, le fournisseur au sien, la TVA du trimestre se
 * reverse au suivant, les intérêts courent sur la dette restante, l'impôt se paie en acompte
 * sur le résultat cumulé de l'exercice. Le réalisé est le deuxième trimestre joué : l'écart
 * entre les deux est ce que la reconduction n'a pas vu venir.
 *
 * Les montants sont arrondis à l'euro : un budget ne se tient pas au centime.
 */

const euro = Math.round;
const TRIMESTRE = 90;
const ANNEE_COMMERCIALE = 360;

/** Les flux du tableau de trésorerie de l'arène que le budget reconduit tels quels. */
const RECONDUITS = {
  couts_variables_decaisses: "autres coûts variables",
  commissions_partenaires: "commissions des partenaires",
  couts_fixes: "charges de structure (local, équipe)",
  marketing: "publicité",
  qualite: "qualité",
  maintenance: "entretien",
} as const;

/** Tous les flux qu'un premier trimestre de l'arène porte dans le réglage du cours. */
const FLUX_CONNUS = new Set<string>([
  "encaissements_clients",
  "paiements_fournisseurs",
  "impot",
  "interets",
  "remboursement_emprunt",
  "tva_decaissee",
  ...Object.keys(RECONDUITS),
]);

const flux = (r: CompanyRoundResult, label: string) => r.cashFlow.items.find((i) => i.label === label)?.amount ?? 0;

export interface BudgetDuTrimestre {
  tauxTva: number;
  tauxImpot: number;
  /** Le premier trimestre, réalisé. */
  t1: {
    ventes: number;
    tresorerieFin: number;
    creancesFin: number;
    dettesFournisseursFin: number;
    detteFinanciereFin: number;
    tvaAReverser: number;
    resultatAvantImpot: number;
    impot: number;
  };
  /** Le deuxième, prévu. */
  prevu: {
    ventesTtc: number;
    encaissements: number;
    achatsTtc: number;
    paiementsFournisseurs: number;
    reconduits: { libelle: string; montant: number }[];
    tauxAnnuel: number;
    interets: number;
    emprunt: number;
    tva: number;
    impot: number;
    decaissements: number;
    tresorerieFin: number;
  };
  /** Le deuxième, réalisé par l'arène. */
  realise: { ventes: number; encaissements: number; decaissements: number; tresorerieFin: number };
}

const budgets = new Map<string, BudgetDuTrimestre>();

export function budgetDuTrimestre(code: string): BudgetDuTrimestre {
  const deja = budgets.get(code);
  if (deja) return deja;
  const s = scenarioByCode(code).scenario;
  const { partie, depart } = anneeJouee(code);
  const r1 = partie.rounds[0]!.results["joueur"]!;
  const r2 = partie.rounds[1]!.results["joueur"]!;
  for (const i of r1.cashFlow.items) {
    if (!FLUX_CONNUS.has(i.label)) throw new Error(`${code} : flux du premier trimestre sans place au budget (${i.label})`);
  }
  const tva = s.finance.vatRate ?? 0;
  const b1 = r1.balanceSheet;

  // Le premier trimestre, réalisé.
  const ventes = euro(r1.incomeStatement.revenue);
  const creancesFin = euro(b1.receivables);
  const dettesFin = euro(b1.payables);
  // Les achats TTC du trimestre : ce qui a été payé, plus ce qui reste dû, moins ce qui l'était déjà.
  const achatsTtc = euro(-flux(r1, "paiements_fournisseurs") + b1.payables - depart.finance.payables);
  const t1 = {
    ventes,
    tresorerieFin: euro(r1.cashFlow.closing),
    creancesFin,
    dettesFournisseursFin: dettesFin,
    detteFinanciereFin: euro(b1.financialDebt),
    tvaAReverser: euro(b1.vatLiability ?? 0),
    resultatAvantImpot: euro(r1.incomeStatement.pretaxIncome),
    impot: euro(r1.incomeStatement.tax),
  };

  // Le deuxième, prévu : les ventes et les achats reconduits, donc les créances et les dettes de fin aussi.
  const ventesTtc = euro(ventes * (1 + tva));
  const encaissements = creancesFin + ventesTtc - creancesFin;
  const paiementsFournisseurs = dettesFin + achatsTtc - dettesFin;
  const reconduits = Object.entries(RECONDUITS).flatMap(([label, libelle]) => {
    const montant = euro(-flux(r1, label));
    return montant ? [{ libelle, montant }] : [];
  });
  const tauxAnnuel = s.finance.loanAnnualRate;
  const interets = euro((t1.detteFinanciereFin * tauxAnnuel * TRIMESTRE) / ANNEE_COMMERCIALE);
  const emprunt = euro(-flux(r1, "remboursement_emprunt"));
  // L'acompte d'impôt : l'impôt du résultat cumulé de l'exercice, moins l'acompte déjà versé.
  const report = depart.exerciceFiscal?.report ?? depart.taxLossCarryforward ?? 0;
  const resultatPrevu = t1.resultatAvantImpot + euro(r1.incomeStatement.interest) - interets;
  const impotDu = (cumul: number) => s.finance.taxRate * Math.max(0, cumul - report);
  const impot = euro(impotDu(t1.resultatAvantImpot + resultatPrevu) - impotDu(t1.resultatAvantImpot));
  const decaissements =
    paiementsFournisseurs + reconduits.reduce((t, l) => t + l.montant, 0) + interets + emprunt + t1.tvaAReverser + impot;

  // Au réalisé comme au budget : les clients d'un côté, tout le reste en sorties nettes (un
  // remboursement d'impôt vient en moins des décaissements).
  const encaisseR2 = flux(r2, "encaissements_clients");
  const decaisseR2 = encaisseR2 - (r2.cashFlow.closing - r2.cashFlow.opening);
  const budget: BudgetDuTrimestre = {
    tauxTva: tva,
    tauxImpot: s.finance.taxRate,
    t1,
    prevu: {
      ventesTtc,
      encaissements,
      achatsTtc,
      paiementsFournisseurs,
      reconduits,
      tauxAnnuel,
      interets,
      emprunt,
      tva: t1.tvaAReverser,
      impot,
      decaissements,
      tresorerieFin: t1.tresorerieFin + encaissements - decaissements,
    },
    realise: {
      ventes: euro(r2.incomeStatement.revenue),
      encaissements: euro(encaisseR2),
      decaissements: euro(decaisseR2),
      tresorerieFin: euro(r2.cashFlow.closing),
    },
  };
  budgets.set(code, budget);
  return budget;
}
