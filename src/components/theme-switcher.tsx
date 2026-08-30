"use client";

import { useEffect, useState } from "react";
import { CLE_THEME, estCodeTheme, THEMES, THEME_PAR_DEFAUT, type CodeTheme } from "@/config/themes";

/**
 * Le choix du thème, en un bouton.
 *
 * Deux thèmes se choisissent d'un geste plutôt que dans une liste : un menu
 * demanderait d'ouvrir puis de choisir pour une bascule entre deux états. Le
 * bouton annonce donc l'état d'ARRIVÉE et non l'état courant, avec la pastille
 * du thème vers lequel il mène.
 *
 * Le thème vit sur l'élément racine, sous forme d'attribut, et les feuilles de
 * style font le reste : aucune page n'a besoin de savoir lequel est actif. Le
 * choix est relu par le script d'amorçage de la mise en page, qui l'applique
 * AVANT le premier affichage ; sans lui, chaque page s'ouvrirait en sombre
 * puis basculerait sous les yeux du lecteur.
 *
 * Le rendu du serveur ne connaît pas le choix, qui est propre au navigateur.
 * Ce bouton part donc du thème par défaut et se corrige au montage, sinon
 * React signalerait un écart entre ce qu'il a produit et ce qu'il trouve.
 */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<CodeTheme>(THEME_PAR_DEFAUT);

  useEffect(() => {
    const applique = document.documentElement.dataset.theme;
    if (estCodeTheme(applique)) setTheme(applique);
  }, []);

  const suivant = THEMES.find((t) => t.code !== theme) ?? THEMES[0]!;

  function basculer() {
    document.documentElement.dataset.theme = suivant.code;
    try {
      localStorage.setItem(CLE_THEME, suivant.code);
    } catch {
      // navigation privée, stockage refusé : le thème tient pour la visite
    }
    setTheme(suivant.code);
  }

  return (
    <button
      type="button"
      onClick={basculer}
      title={suivant.description}
      aria-label={`Passer au thème ${suivant.nom.toLowerCase()}`}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 transition hover:border-white/25 hover:text-slate-100"
    >
      <span
        aria-hidden
        className="h-3 w-3 rounded-full border border-white/20"
        style={{
          background: suivant.apercu.fond,
          boxShadow: `inset 0 -3px 0 ${suivant.apercu.accent}`,
        }}
      />
      {suivant.nom}
    </button>
  );
}
