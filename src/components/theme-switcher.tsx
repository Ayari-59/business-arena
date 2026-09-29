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
 * DEUX PASTILLES, SANS LEUR NOM. Les noms ont tenu quelques heures à droite des
 * pastilles, et ils ne disaient rien que celles-ci ne disent déjà : une
 * pastille d'encre et une pastille de papier, c'est le thème montré plutôt
 * qu'écrit. Ils coûtaient en revanche la moitié de la largeur d'un contrôle
 * posé dans une barre qui porte déjà un logo, trois liens, deux boutons et un
 * menu. Le nom reste dans l'infobulle et dans le texte accessible : il n'est
 * pas retiré, il cesse d'être imprimé.
 *
 * LA PASTILLE N'EST PAS UN SYMBOLE, C'EST LE THÈME. Elle porte ses deux vraies
 * couleurs — son fond, et son accent posé en bas — et non un soleil ou une
 * lune, qui sont des métaphores à apprendre et qui ne voudraient plus rien
 * dire d'un troisième thème. Ces deux couleurs viennent du registre : ajouter
 * un thème dessine sa pastille sans rien écrire ici.
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
            // L'infobulle NOMME le thème avant de le décrire : c'est elle qui
            // rend son nom à la pastille pour qui hésite, maintenant qu'il
            // n'est plus imprimé à côté.
            title={`${t.nom} — ${t.description}`}
            // La cible fait bien plus que la pastille : on vise un contrôle
            // de barre au pouce, pas un disque de quatre millimètres.
            className={`flex items-center rounded-[7px] px-2 py-1.5 transition ${
              actif ? "bg-white/15 ring-1 ring-white/15" : "hover:bg-white/5"
            }`}
          >
            {/*
              Les deux couleurs sont posées en style en ligne, et c'est le seul
              endroit du site où une couleur doit ÉCHAPPER au thème courant :
              elle représente l'autre thème, elle ne peut donc pas venir de la
              palette que ce thème vient de redéfinir.
            */}
            {/*
              LA PASTILLE NE BOUGE PAS ; C'EST LA TOUCHE QUI S'ALLUME. Deux
              essais l'ont appris. Un anneau laiton autour de la pastille
              retenue se perdait, les deux pastilles portant déjà un trait de
              laiton en bas — leur accent —, si bien que le laiton ne
              distinguait plus rien. Puis l'autre pastille fut mise en retrait,
              et son opacité l'a fait mentir : à 55 %, l'encre du thème sombre
              vire au gris bleuté sur fond clair, c'est-à-dire à une couleur que
              le thème n'a pas. Une pastille dont le rôle est de MONTRER une
              teinte ne peut pas être atténuée. Seule la touche change donc :
              celle qui est en vigueur est un creux plein et cerclé.
            */}
            <span
              aria-hidden
              className={`h-4 w-4 shrink-0 rounded-full border transition ${
                actif ? "border-white/60" : "border-white/25"
              }`}
              style={{
                background: t.apercu.fond,
                boxShadow: `inset 0 -4px 0 ${t.apercu.accent}`,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
