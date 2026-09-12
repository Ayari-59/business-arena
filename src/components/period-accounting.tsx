"use client";

import { useState } from "react";
import type { GameView } from "@/services/game-view.service";
import type { AccountingCategory } from "@/engine/types";
import { formatEuro } from "@/lib/formats";

type AccountingData = NonNullable<GameView["accounting"]>;

/**
 * Affiche le journal comptable et le grand livre du tour.
 * Filtrable par catégorie pour les ateliers comptabilité.
 */
export function PeriodAccounting({ accounting }: { accounting: AccountingData }) {
  const [selectedCategory, setSelectedCategory] = useState<AccountingCategory | null>(null);
  const [activeTab, setActiveTab] = useState<"journal" | "ledger">("journal");

  const categories: { key: AccountingCategory; label: string }[] = [
    { key: "purchase", label: "Achats" },
    { key: "sale", label: "Ventes" },
    { key: "payroll", label: "Paie" },
    { key: "tax", label: "Taxes" },
    { key: "financing", label: "Financement" },
    { key: "depreciation", label: "Amortissements" },
    { key: "inventory", label: "Stocks" },
    { key: "cash", label: "Trésorerie" },
    { key: "other", label: "Autres" },
  ];

  const filteredEntries = selectedCategory
    ? accounting.byCategory[selectedCategory]
    : accounting.journal;

  return (
    <div className="space-y-6">
      {/* Filtres par catégorie */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">Filtrer par catégorie</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedCategory === null
                ? "bg-orange-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Tout ({accounting.journal.length} écritures)
          </button>
          {categories.map((cat) => {
            const count = accounting.byCategory[cat.key].length;
            if (count === 0) return null;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  selectedCategory === cat.key
                    ? "bg-orange-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Onglets Journal / Grand Livre */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-slate-900 p-1 w-fit">
        <button
          onClick={() => setActiveTab("journal")}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === "journal"
              ? "bg-orange-500 text-white"
              : "text-slate-300 hover:text-white"
          }`}
        >
          Journal ({accounting.journal.length})
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === "ledger"
              ? "bg-orange-500 text-white"
              : "text-slate-300 hover:text-white"
          }`}
        >
          Grand Livre ({accounting.generalLedger.length})
        </button>
      </div>

      {/* Journal Comptable */}
      {activeTab === "journal" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  N°
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  Libellé
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  Compte débité
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  Compte crédité
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr
                  key={entry.entryId}
                  className="border-b border-white/5 hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-3 py-2 text-slate-400">{entry.entryId}</td>
                  <td className="px-3 py-2 text-slate-200">
                    <div className="font-medium">{entry.label}</div>
                    {entry.reference && (
                      <div className="text-xs text-slate-500">{entry.reference}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400">
                    <div>{entry.debitAccount}</div>
                    <div className="text-xs text-slate-600">{entry.debitLabel}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400">
                    <div>{entry.creditAccount}</div>
                    <div className="text-xs text-slate-600">{entry.creditLabel}</div>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-200 font-medium">
                    {formatEuro(entry.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grand Livre */}
      {activeTab === "ledger" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  Compte
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  Libellé
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                  Solde d'ouverture
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                  Débits
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                  Crédits
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                  Solde de clôture
                </th>
              </tr>
            </thead>
            <tbody>
              {accounting.generalLedger.map((account) => (
                <tr
                  key={account.accountCode}
                  className="border-b border-white/5 hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-3 py-2 font-mono text-slate-400">{account.accountCode}</td>
                  <td className="px-3 py-2 text-slate-200">{account.accountLabel}</td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {formatEuro(account.openingBalance)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {formatEuro(account.debits)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {formatEuro(account.credits)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-200">
                    {formatEuro(account.closingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
