"use client";

import { useEffect, useState } from "react";
import { CLE_THEME, estCodeTheme, THEMES, THEME_PAR_DEFAUT, type CodeTheme } from "@/config/themes";

/**
 * Le choix du thème, montré plutôt que caché.
 *
 * IL A ÉTÉ UNE BASCULE, RANGÉE DANS LE MENU. Un seul bouton, qui portait le
 * nom du thème d'ARRIVÉE. Deux défauts se tenaient là. D'abord l'endroit : le
 * réglage vivait derrière le panneau « Menu », c'est-à-dire derrière une carte
 * qui COUVRE la page ; on changeait donc le thème sans voir ce qu'on
 * changeait, et il fallait refermer pour juger. Ensuite le bouton lui-même :
 * un nom de thème, seul dans une barre, ne dit pas s'il désigne l'état courant
 * ou la destination, et on cliquait en croyant aller là où on était déjà.
 *
 * DEUX POSITIONS VISIBLES À LA FOIS règlent les deux. On voit les choix, on
 * voit lequel est retenu, on voit la page changer derrière. C'est un
 * interrupteur, pas une devinette : le doute sur le sens de lecture disparaît
 * parce qu'il n'y a plus rien à deviner.
 *
 * La liste vient du registre, la rangée s'allongera d'elle-même si un
 * troisième thème arrive — et cessera d'être le bon dessin ce jour-là, un
 * segmenté au-delà de trois positions devenant une liste déroulante.
 *
 * Le thème vit sur l'élément racine, sous forme d'attribut, et les feuilles de
 * style font le reste : aucune page n'a besoin de savoir lequel est actif. Le
 * choix est relu par le script d'amorçage de la mise en page, qui l'applique
 * AVANT le premier affichage ; sans lui, chaque page s'ouvrirait sur le thème
 * par défaut puis basculerait sous les yeux du lecteur.
 *
 * Le rendu du serveur ne connaît pas le choix, qui est propre au navigateur.
 * Cette rangée part donc du thème par défaut et se corrige au montage, sinon
 * React signalerait un écart entre ce qu'il a produit et ce qu'il trouve.
 */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<CodeTheme>(THEME_PAR_DEFAUT);

  useEffect(() => {
    const applique = document.documentElement.dataset.theme;
    if (estCodeTheme(applique)) setTheme(applique);
  }, []);

  function choisir(code: CodeTheme) {
    document.documentElement.dataset.theme = code;
    try {
      localStorage.setItem(CLE_THEME, code);
    } catch {
      // navigation privée, stockage refusé : le thème tient pour la visite
    }
    setTheme(code);
  }

  return (
    <div
      role="group"
      aria-label="Thème du site"
      className="flex items-center gap-0.5 rounded-lg border border-white/12 bg-slate-900 p-0.5"
    >
      {THEMES.map((t) => {
        const actif = t.code === theme;
        return (
          <button
            key={t.code}
            type="button"
            onClick={() => choisir(t.code)}
            // La position retenue est un ÉTAT, pas une page : `aria-pressed`
            // le dit là où `aria-current` parlerait de navigation.
            aria-pressed={actif}
            aria-label={`Thème ${t.nom.toLowerCase()}`}
            title={t.description}
            className={`flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-xs transition ${
              actif
                ? "bg-white/12 font-semibold text-slate-100"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {/*
              La pastille montre le thème en deux couleurs : son fond, et son
              accent posé en bas. Elle est écrite en style en ligne parce que
              ces deux valeurs viennent du registre, pas de la palette — c'est
              le seul endroit du site où une couleur doit échapper au thème
              courant, puisqu'elle représente l'AUTRE.
            */}
            <span
              aria-hidden
              className={`h-3 w-3 shrink-0 rounded-full border transition ${
                actif ? "border-amber-400/70" : "border-white/25"
              }`}
              style={{
                background: t.apercu.fond,
                boxShadow: `inset 0 -3px 0 ${t.apercu.accent}`,
              }}
            />
            {/*
              LE NOM EST LU PARTOUT, MONTRÉ À PARTIR DE `sm`. Sur la barre d'un
              téléphone, deux noms à côté du logo et du bouton « Menu »
              passaient à la ligne et doublaient la hauteur de l'en-tête ; les
              pastilles seules y tiennent. Le nom reste dans le texte accessible
              plutôt que d'être retiré : une synthèse vocale n'a pas de
              pastille.
            */}
            <span className="sr-only sm:not-sr-only">{t.nom}</span>
          </button>
        );
      })}
    </div>
  );
}
