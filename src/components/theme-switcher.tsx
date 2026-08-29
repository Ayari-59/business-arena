"use client";

import { useEffect, useState } from "react";
import { CLE_THEME, estCodeTheme, THEMES, THEME_PAR_DEFAUT, type CodeTheme } from "@/config/themes";

/**
 * Le choix du thème.
 *
 * Le thème vit sur l'élément racine, sous forme d'attribut, et les feuilles de
 * style font le reste : aucune page n'a besoin de savoir lequel est actif. Le
 * choix est relu par le script d'amorçage de la mise en page, qui l'applique
 * AVANT le premier affichage ; sans lui, chaque page s'ouvrirait en ardoise
 * puis basculerait sous les yeux du lecteur.
 *
 * Le rendu du serveur ne connaît pas le choix, qui est propre au navigateur.
 * Ce menu part donc du thème par défaut et se corrige au montage, sinon React
 * signalerait un écart entre ce qu'il a produit et ce qu'il trouve.
 */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<CodeTheme>(THEME_PAR_DEFAUT);

  useEffect(() => {
    const applique = document.documentElement.dataset.theme;
    if (estCodeTheme(applique)) setTheme(applique);
  }, []);

  function choisir(code: string) {
    if (!estCodeTheme(code)) return;
    document.documentElement.dataset.theme = code;
    try {
      localStorage.setItem(CLE_THEME, code);
    } catch {
      // navigation privée, stockage refusé : le thème tient pour la visite
    }
    setTheme(code);
  }

  return (
    <label className="flex items-center">
      <span className="sr-only">Thème du site</span>
      <select
        value={theme}
        onChange={(e) => choisir(e.target.value)}
        title="Thème du site"
        className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-300 transition hover:border-white/25 hover:text-slate-100"
      >
        {THEMES.map((t) => (
          <option key={t.code} value={t.code}>
            {t.nom}
          </option>
        ))}
      </select>
    </label>
  );
}
