"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { key: "synthese", label: "Synthèse" },
  { key: "marche", label: "Marché" },
  { key: "finance", label: "Finance" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function DashboardTabs({
  children,
}: {
  children: Record<TabKey, ReactNode>;
}) {
  const [active, setActive] = useState<TabKey>("synthese");

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 rounded-lg border border-white/10 bg-slate-900 p-1" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              active === tab.key
                ? "bg-slate-700 text-slate-50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div role="tabpanel">{children[active]}</div>
    </div>
  );
}
