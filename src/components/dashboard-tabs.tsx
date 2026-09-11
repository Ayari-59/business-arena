"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const TABS = [
  { key: "synthese", label: "Synthèse" },
  { key: "marche", label: "Marché" },
  { key: "finance", label: "Finance" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * Les trois faces du tableau de bord. Motif WAI-ARIA « tabs » : chaque onglet
 * relie son panneau (`aria-controls`/`aria-labelledby`), un `tabindex` roulant
 * ne rend tabulable que l'onglet actif, et les flèches ←/→/↑/↓ + Origine/Fin
 * déplacent le focus en activant — sans quoi la navigation entre Synthèse,
 * Marché et Finance était perdue au clavier et au lecteur d'écran.
 */
export function DashboardTabs({
  children,
}: {
  children: Record<TabKey, ReactNode>;
}) {
  const baseId = useId();
  const boutons = useRef<Record<string, HTMLButtonElement | null>>({});
  const [active, setActive] = useState<TabKey>("synthese");

  const tabId = (key: string) => `${baseId}-tab-${key}`;
  const panelId = (key: string) => `${baseId}-panel-${key}`;

  const auClavier = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let cible = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") cible = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") cible = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") cible = 0;
    else if (e.key === "End") cible = TABS.length - 1;
    else return;
    e.preventDefault();
    const k = TABS[cible]!.key;
    setActive(k);
    boutons.current[k]?.focus();
  };

  return (
    <div className="space-y-6">
      <nav
        className="flex gap-1 rounded-lg border border-white/10 bg-slate-900 p-1"
        role="tablist"
        aria-label="Tableau de bord"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.key}
            id={tabId(tab.key)}
            ref={(el) => {
              boutons.current[tab.key] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            aria-controls={panelId(tab.key)}
            tabIndex={active === tab.key ? 0 : -1}
            onClick={() => setActive(tab.key)}
            onKeyDown={(e) => auClavier(e, index)}
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
      <div
        role="tabpanel"
        id={panelId(active)}
        aria-labelledby={tabId(active)}
        tabIndex={0}
      >
        {children[active]}
      </div>
    </div>
  );
}
