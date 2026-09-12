"use client";

import { useState } from "react";
import type { GlossaryEntry } from "../types";

interface GlossaryPanelProps {
  entries: GlossaryEntry[];
  onClose: () => void;
}

export function GlossaryPanel({ entries, onClose }: GlossaryPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(entries.map((e) => e.category)));

  const filtered = entries.filter((entry) => {
    const matchesSearch =
      entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-xl font-semibold">Glossaire</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-2 py-1 rounded ${
                selectedCategory === null
                  ? "bg-blue-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2 py-1 rounded ${
                  selectedCategory === cat
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filtered.length > 0 ? (
            filtered.map((entry) => (
              <div key={entry.id} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {entry.term}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {entry.definition}
                </p>
                {entry.example && (
                  <p className="text-sm text-slate-500 dark:text-slate-500 italic mt-1">
                    📌 {entry.example}
                  </p>
                )}
                {entry.relatedTerms && entry.relatedTerms.length > 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Termes liés: {entry.relatedTerms.join(", ")}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400">
              Aucun terme trouvé.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
