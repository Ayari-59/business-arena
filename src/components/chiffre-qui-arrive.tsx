"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { amorti, dureeDuJeton, mouvementReduit } from "@/lib/mouvement";
import { PLUMES, type NomDePlume } from "@/lib/plumes";

/**
 * UN CHIFFRE QUI ARRIVE SE VOIT ARRIVER.
 *
 * Le marché répond, et le résultat du tour s'affiche : il était déjà là,
 * imprimé, comme s'il n'avait jamais été autre chose. Rien ne disait que c'est
 * LE moment de la séance. Un compteur qui monte le dit en une demi-seconde,
 * sans un mot de plus.
 *
 * CE N'EST PAS UN EFFET, C'EST UN FAIT. Le mouvement ne se joue que lorsque la
 * valeur a CHANGÉ : le résultat du tour au rituel, les chiffres de l'ardoise au
 * retour d'une simulation, le cumul à la clôture. Une page qu'on relit, qu'on
 * recharge ou sur laquelle on revient sans que rien ait bougé reste immobile :
 * animer une valeur qui n'a pas changé serait un mensonge poli.
 *
 * LA MÉMOIRE EST CELLE DE L'ONGLET. Ce qui a été montré est retenu dans le
 * `sessionStorage`, par chemin de page et par clé (`memoire`) : au retour du
 * rituel, l'ardoise sait que son chiffre d'affaires valait autre chose tout à
 * l'heure, et le fait monter de l'ancien au nouveau. Elle s'efface à la
 * fermeture de l'onglet, ne voyage pas d'un appareil à l'autre, et un stockage
 * refusé (navigation privée, cookies bloqués) ne fait rien tomber : on
 * n'anime pas, c'est tout.
 *
 * CE QUE LE MOUVEMENT NE DOIT JAMAIS COÛTER :
 * · la DONNÉE — le rendu serveur écrit la valeur FINALE, et l'état React part
 *   de cette même valeur : un lecteur d'écran, un robot d'indexation ou une
 *   capture la trouvent entière dès le premier octet. C'est l'affichage qui
 *   est animé, jamais la donnée ;
 * · la LISIBILITÉ — chaque image intermédiaire est un nombre formaté comme le
 *   final, dans la même police tabulaire : rien n'est flou, rien n'est vide ;
 * · l'ACTION — le composant ne rend qu'un `<span>` : aucun bouton n'attend
 *   qu'il ait fini, aucune zone ne devient inerte ;
 * · le CONFORT — `prefers-reduced-motion` coupe tout, et l'état final s'affiche
 *   d'un coup.
 *
 * La durée vient du jeton `--duree-chiffre` (bloc « LOT 5B » de globals.css) :
 * aucune milliseconde n'est écrite ici.
 *
 * LA MISE EN FORME SE NOMME, OU SE DONNE. Un écran de SERVEUR (l'ardoise, le
 * rituel, la clôture) nomme sa plume (`plume="euro"`) : une fonction ne
 * traverse pas la frontière du serveur. Un écran déjà client (un épisode, dont
 * la courbe porte son propre format) passe la fonction (`format`).
 */

/** La clé de mémoire, propre à la page ET à la grandeur suivie. */
function cleDeMemoire(memoire: string): string {
  const page = typeof window === "undefined" ? "" : window.location.pathname;
  return `chiffre:${page}:${memoire}`;
}

function valeurRetenue(memoire: string): number | null {
  try {
    const brut = window.sessionStorage.getItem(cleDeMemoire(memoire));
    if (brut === null) return null;
    const n = Number.parseFloat(brut);
    return Number.isFinite(n) ? n : null;
  } catch {
    // Stockage refusé : on ne retient rien, donc on n'anime rien.
    return null;
  }
}

function retenir(memoire: string, valeur: number): void {
  try {
    window.sessionStorage.setItem(cleDeMemoire(memoire), String(valeur));
  } catch {
    /* Rien à faire : la mémoire est un confort, pas une dépendance. */
  }
}

/**
 * Le nombre de chiffres qui arrivent en ce moment sur la page. Tant qu'il y en
 * a, la racine porte `data-chiffres-arrivent` : la feuille s'en sert pour
 * tracer les courbes de l'ardoise AU MOMENT où ses chiffres montent, et pas au
 * chargement d'une page qu'on relit.
 */
let enCours = 0;
function ouvrirLArrivee(): void {
  enCours += 1;
  document.documentElement.setAttribute("data-chiffres-arrivent", "");
}
function fermerLArrivee(): void {
  enCours = Math.max(0, enCours - 1);
  if (enCours === 0) document.documentElement.removeAttribute("data-chiffres-arrivent");
}

export function ChiffreQuiArrive({
  valeur,
  plume,
  format,
  memoire,
  depuis,
  className = "",
}: {
  /** La valeur du moment, en nombre : c'est elle qu'on voit arriver. */
  valeur: number;
  /** Le nom d'une plume de la maison, depuis un écran de serveur. */
  plume?: NomDePlume;
  /** Ou la mise en forme elle-même, depuis un écran déjà client. */
  format?: (n: number) => string;
  /**
   * Sous quel nom la valeur déjà montrée est retenue pour l'onglet. Sans elle,
   * le chiffre ne bouge que si la valeur change pendant qu'on le regarde.
   */
  memoire?: string;
  /**
   * Le départ imposé la toute première fois (l'écart signé monte depuis zéro).
   * Sans mémoire antérieure et sans ce départ, rien ne bouge.
   */
  depuis?: number;
  className?: string;
}) {
  const ecrire = format ?? PLUMES[plume ?? "euro"];
  const final = ecrire(valeur);
  // L'état part de la valeur FINALE : le rendu serveur et la première image du
  // navigateur portent le chiffre entier, l'hydratation ne change rien.
  const [affiche, setAffiche] = useState(final);
  const [anime, setAnime] = useState(false);
  // La dernière valeur que CE composant a montrée, pour les changements vécus
  // sous les yeux (une saisie, un rafraîchissement de données).
  const montree = useRef<number | null>(null);

  useEffect(() => {
    const finir = () => {
      setAffiche(ecrire(valeur));
      setAnime(false);
      montree.current = valeur;
      if (memoire) retenir(memoire, valeur);
    };

    const premiere = montree.current === null;
    const depart = premiere
      ? memoire
        ? (valeurRetenue(memoire) ?? depuis ?? null)
        : (depuis ?? null)
      : montree.current;

    if (depart === null || depart === valeur || mouvementReduit()) {
      finir();
      return;
    }

    const duree = dureeDuJeton("--duree-chiffre");
    if (duree <= 0) {
      finir();
      return;
    }

    let image = 0;
    let premiereImage = true;
    const debut = performance.now();
    ouvrirLArrivee();
    // L'état ne change qu'à la PREMIÈRE IMAGE, jamais dans le corps de l'effet :
    // un rendu de plus avant que le navigateur n'ait peint ne servirait à rien.
    const pas = (maintenant: number) => {
      const t = Math.min(1, (maintenant - debut) / duree);
      if (t < 1) {
        if (premiereImage) {
          premiereImage = false;
          setAnime(true);
        }
        setAffiche(ecrire(depart + (valeur - depart) * amorti(t)));
        image = requestAnimationFrame(pas);
        return;
      }
      image = 0;
      fermerLArrivee();
      finir();
    };
    image = requestAnimationFrame(pas);
    return () => {
      if (image) {
        cancelAnimationFrame(image);
        fermerLArrivee();
      }
      // Interrompu (démontage, valeur qui change à nouveau) : l'état final, net.
      setAffiche(ecrire(valeur));
      setAnime(false);
      montree.current = valeur;
      if (memoire) retenir(memoire, valeur);
    };
    // `ecrire` est une mise en forme, stable par nature : la suivre
    // relancerait l'animation à chaque rendu du parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur, memoire, depuis]);

  return (
    <span
      data-chiffre-qui-arrive={anime ? "arrive" : "pose"}
      className={`chiffre-qui-arrive ${className}`.trim()}
    >
      {affiche}
    </span>
  );
}

/**
 * CE QUI DÉPEND D'UNE SAISIE SE VOIT SE METTRE À JOUR.
 *
 * Le total des budgets du tour se recalcule à chaque frappe, et c'est
 * précisément pour cela qu'on ne le voyait pas changer : il était déjà juste
 * avant qu'on ait fini de taper. Un éclat bref — le filet d'accent qui
 * apparaît autour de la valeur et se referme — dit « j'ai entendu », sans
 * faire défiler un chiffre à chaque touche.
 *
 * La valeur suivie est une CHAÎNE OU UN NOMBRE déjà mis en forme : ce composant
 * ne calcule rien et ne compte rien, il signale. Il ne bouge pas au premier
 * rendu (rien n'a changé), et `prefers-reduced-motion` le prive de son éclat :
 * la valeur, elle, reste exacte et lisible dans tous les cas.
 */
export function ValeurRafraichie({
  valeur,
  children,
  className = "",
}: {
  /** Ce qui, en changeant, mérite l'éclat. */
  valeur: string | number;
  /** La valeur telle qu'elle s'écrit. */
  children: ReactNode;
  className?: string;
}) {
  const [eclat, setEclat] = useState(false);
  const vue = useRef<string | number | null>(null);

  useEffect(() => {
    const premiere = vue.current === null;
    const change = !premiere && vue.current !== valeur;
    vue.current = valeur;
    if (!change || mouvementReduit()) return;
    const duree = dureeDuJeton("--duree-eclat");
    if (duree <= 0) return;
    // À la première image, pas dans le corps de l'effet : l'éclat est une
    // réaction à la frappe, pas un rendu de plus dans la même passe.
    const image = requestAnimationFrame(() => setEclat(true));
    const minuteur = window.setTimeout(() => setEclat(false), duree);
    return () => {
      cancelAnimationFrame(image);
      window.clearTimeout(minuteur);
      setEclat(false);
    };
  }, [valeur]);

  return (
    <span
      data-valeur-rafraichie={eclat ? "eclat" : "posee"}
      className={`valeur-rafraichie ${className}`.trim()}
    >
      {children}
    </span>
  );
}
