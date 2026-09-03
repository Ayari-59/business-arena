"use client";

import { useEffect, useState, type ReactNode } from "react";

export type SegmentedTab = { key: string; label: string; icon?: string };

/**
 * Un jeu d'onglets local et autonome : contrairement à `ArenaLayout`, il ne
 * touche ni à une barre collante ni, par défaut, au hash de l'URL — plusieurs
 * instances (une par période de l'accordéon) cohabitent sans se marcher dessus.
 * Seul l'onglet dont le contenu est fourni (non `null`) est proposé.
 *
 * `syncAnchors` : les clés d'onglets qui portent une ancre de page (un panneau
 * dont le contenu a un `id` cible d'un lien `href="#id"`). Comme seul le panneau
 * actif est monté, un lien vers un onglet inactif ne trouverait pas sa cible ;
 * on écoute donc le hash et on active l'onglet correspondant avant de défiler.
 * À ne fournir QUE là où ces ancres existent (le tour en cours), pour qu'aucune
 * autre instance ne réagisse au même hash.
 */
export function SegmentedTabs({
  tabs,
  children,
  defaultKey,
  syncAnchors,
}: {
  tabs: SegmentedTab[];
  children: Record<string, ReactNode>;
  defaultKey?: string;
  syncAnchors?: string[];
}) {
  const visible = tabs.filter((t) => children[t.key] != null);
  const [active, setActive] = useState(
    defaultKey && visible.some((t) => t.key === defaultKey)
      ? defaultKey
      : visible[0]?.key ?? "",
  );
  const current = visible.find((t) => t.key === active) ? active : visible[0]?.key;

  const visibleKeys = visible.map((t) => t.key).join(",");
  const anchorKeys = (syncAnchors ?? []).join(",");
  useEffect(() => {
    if (!anchorKeys) return;
    const anchors = anchorKeys.split(",");
    const keys = visibleKeys ? visibleKeys.split(",") : [];
    const appliquerDepuisHash = () => {
      const cible = window.location.hash.slice(1);
      if (!anchors.includes(cible) || !keys.includes(cible)) return;
      setActive(cible);
      // Le panneau se monte au rendu suivant : on défile une fois qu'il existe.
      requestAnimationFrame(() =>
        document.getElementById(cible)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    };
    appliquerDepuisHash();
    window.addEventListener("hashchange", appliquerDepuisHash);
    return () => window.removeEventListener("hashchange", appliquerDepuisHash);
  }, [anchorKeys, visibleKeys]);

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
