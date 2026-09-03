"use client";

import { useState, type ReactNode } from "react";

export type SegmentedTab = { key: string; label: string; icon?: string };

/**
 * Un jeu d'onglets local et autonome : contrairement à `ArenaLayout`, il ne
 * touche ni au hash de l'URL ni à une barre collante — plusieurs instances
 * (une par période de l'accordéon) cohabitent donc sans se marcher dessus.
 * Seul l'onglet dont le contenu est fourni (non `null`) est proposé.
 */
export function SegmentedTabs({
  tabs,
  children,
  defaultKey,
}: {
  tabs: SegmentedTab[];
  children: Record<string, ReactNode>;
  defaultKey?: string;
}) {
  const visible = tabs.filter((t) => children[t.key] != null);
  const [active, setActive] = useState(
    defaultKey && visible.some((t) => t.key === defaultKey)
      ? defaultKey
      : visible[0]?.key ?? "",
  );
  const current = visible.find((t) => t.key === active) ? active : visible[0]?.key;
  if (visible.length === 0) return null;

  return (
    <div className="space-y-4">
      <nav className="flex gap-1 rounded-lg border border-white/10 bg-slate-900 p-1" role="tablist">
        {visible.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={current === tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              current === tab.key
                ? "bg-slate-700 text-slate-50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.icon ? <span className="mr-1.5">{tab.icon}</span> : null}
            {tab.label}
          </button>
        ))}
      </nav>
      <div role="tabpanel">{current ? children[current] : null}</div>
    </div>
  );
}
