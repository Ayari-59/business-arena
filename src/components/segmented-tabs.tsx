"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type SegmentedTab = { key: string; label: string; icon?: string };

/**
 * Un jeu d'onglets local et autonome : contrairement à `ArenaLayout`, il ne
 * touche ni à une barre collante ni, par défaut, au hash de l'URL — plusieurs
 * instances (une par période de l'accordéon) cohabitent sans se marcher dessus.
 * Seul l'onglet dont le contenu est fourni (non `null`) est proposé.
 *
 * Accessibilité (motif WAI-ARIA « tabs ») : chaque onglet porte un `id` et
 * `aria-controls` vers son panneau, le panneau un `aria-labelledby` en retour ;
 * un `tabindex` roulant (seul l'onglet actif est tabulable) et les flèches
 * ←/→/↑/↓ + Origine/Fin déplacent le focus ET activent l'onglet, comme l'attend
 * un lecteur d'écran. Les ids sont dérivés de `useId`, donc uniques par
 * instance même quand l'accordéon en monte plusieurs.
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
  label = "Sections",
}: {
  tabs: SegmentedTab[];
  children: Record<string, ReactNode>;
  defaultKey?: string;
  syncAnchors?: string[];
  label?: string;
}) {
  const baseId = useId();
  const boutons = useRef<Record<string, HTMLButtonElement | null>>({});
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

  const tabId = (key: string) => `${baseId}-tab-${key}`;
  const panelId = (key: string) => `${baseId}-panel-${key}`;

  // Flèches et Origine/Fin : on déplace le focus d'onglet en onglet et on active
  // au passage (activation « automatique », la plus simple à suivre au clavier).
  const auClavier = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys = visible.map((t) => t.key);
    let cible = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") cible = (index + 1) % keys.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") cible = (index - 1 + keys.length) % keys.length;
    else if (e.key === "Home") cible = 0;
    else if (e.key === "End") cible = keys.length - 1;
    else return;
    e.preventDefault();
    const k = keys[cible]!;
    setActive(k);
    boutons.current[k]?.focus();
  };

  return (
    <div className="space-y-4">
      <nav
        className="flex gap-1 rounded-lg border border-white/10 bg-slate-900 p-1"
        role="tablist"
        aria-label={label}
      >
        {visible.map((tab, index) => (
          <button
            key={tab.key}
            id={tabId(tab.key)}
            ref={(el) => {
              boutons.current[tab.key] = el;
            }}
            type="button"
            role="tab"
            aria-selected={current === tab.key}
            aria-controls={panelId(tab.key)}
            tabIndex={current === tab.key ? 0 : -1}
            onClick={() => setActive(tab.key)}
            onKeyDown={(e) => auClavier(e, index)}
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
      <div
        role="tabpanel"
        id={current ? panelId(current) : undefined}
        aria-labelledby={current ? tabId(current) : undefined}
        tabIndex={0}
      >
        {current ? children[current] : null}
      </div>
    </div>
  );
}
