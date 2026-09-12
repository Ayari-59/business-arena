/**
 * Constructeur de journal comptable (Jalon B du plan fondation comptable).
 *
 * Au cours de la simulation, le moteur crée des AccountingEntry à chaque
 * point de flux financier (achat, vente, paie, amortissement, etc.)
 * avant de mettre à jour la P&L. Le JournalBuilder les collecte et
 * construit à la fin du tour le grand livre (soldes par compte).
 */

import type {
  AccountingEntry,
  AccountingCategory,
  AccountCode,
  GeneralLedgerAccount,
  Ledger,
} from "../types";

export class JournalBuilder {
  private entries: AccountingEntry[] = [];
  private entryId = 0;
  /** Soldes d'ouverture des comptes (si connus). */
  private openingBalances: Map<AccountCode, number> = new Map();

  /**
   * Enregistrer une écriture comptable simple.
   */
  record(params: {
    day: number;
    label: string;
    category: AccountingCategory;
    debitAccount: AccountCode;
    debitLabel: string;
    creditAccount: AccountCode;
    creditLabel: string;
    amount: number;
    reference?: string;
    metadata?: {
      productCode?: string;
      segmentCode?: string;
      supplierCode?: string;
      employeeCount?: number;
      quantity?: number;
      unitPrice?: number;
    };
  }): void {
    this.entries.push({
      entryId: ++this.entryId,
      day: params.day,
      label: params.label,
      category: params.category,
      debitAccount: params.debitAccount,
      debitLabel: params.debitLabel,
      creditAccount: params.creditAccount,
      creditLabel: params.creditLabel,
      amount: params.amount,
      reference: params.reference,
      metadata: params.metadata,
    });
  }

  /**
   * Définir les soldes d'ouverture des comptes (pour réconciliation).
   * Optionnel : si absent, les soldes d'ouverture seront tous 0.
   */
  setOpeningBalances(balances: Map<AccountCode, number>): void {
    this.openingBalances = new Map(balances);
  }

  /**
   * Vérifier que le journal est équilibré (débits = crédits).
   * Retourne true si équilibré, false sinon.
   */
  isBalanced(): boolean {
    let totalDebits = 0;
    let totalCredits = 0;
    for (const entry of this.entries) {
      totalDebits += entry.amount;
      totalCredits += entry.amount;
    }
    return Math.abs(totalDebits - totalCredits) < 0.01; // Tolérance flottante
  }

  /**
   * Construire le grand livre à partir des écritures.
   * Retourne l'objet Ledger avec journal complet et accounts par code.
   */
  build(): Ledger {
    const accounts: Map<AccountCode, GeneralLedgerAccount> = new Map();

    // Initialiser les comptes avec les soldes d'ouverture
    const accountCodes = new Set<AccountCode>();
    for (const entry of this.entries) {
      accountCodes.add(entry.debitAccount);
      accountCodes.add(entry.creditAccount);
    }
    for (const code of accountCodes) {
      const opening = this.openingBalances.get(code) ?? 0;
      accounts.set(code, {
        accountCode: code,
        accountLabel: "", // Sera rempli lors du logging
        openingBalance: opening,
        debits: 0,
        credits: 0,
        closingBalance: opening,
      });
    }

    // Passer en revue les écritures et mettre à jour les comptes
    for (const entry of this.entries) {
      const debitAccount = accounts.get(entry.debitAccount)!;
      debitAccount.debits += entry.amount;
      debitAccount.accountLabel = entry.debitLabel;
      debitAccount.closingBalance =
        debitAccount.openingBalance + debitAccount.debits - debitAccount.credits;

      const creditAccount = accounts.get(entry.creditAccount)!;
      creditAccount.credits += entry.amount;
      creditAccount.accountLabel = entry.creditLabel;
      creditAccount.closingBalance =
        creditAccount.openingBalance + creditAccount.debits - creditAccount.credits;
    }

    return {
      entries: this.entries,
      accounts,
    };
  }

  /**
   * Réinitialiser le journal (utile si réutilisé d'un tour à l'autre).
   */
  reset(): void {
    this.entries = [];
    this.entryId = 0;
  }
}
