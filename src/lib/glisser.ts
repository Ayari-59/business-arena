"use client";

import { useRef, type TouchEvent } from "react";

/**
 * LE GESTE DES APPLICATIONS : glisser le doigt pour passer à la carte suivante ou revenir.
 *
 * Il ne remplace aucun bouton, il les double. Il se tait quand le doigt part d'une
 * commande qui glisse déjà (un curseur, une zone de texte, un défilement latéral) :
 * on ne tourne pas la page en réglant un montant.
 */

/** Distance minimale, en pixels, pour que ce soit un geste et non un frôlement. */
export const DISTANCE_MINIMALE = 64;
/** Le geste doit être nettement plus horizontal que vertical : sinon, c'est un défilement. */
export const RAPPORT_HORIZONTAL = 1.6;
/** Au-delà, le doigt a traîné : ce n'est plus un coup de pouce. */
export const DUREE_MAXIMALE_MS = 700;

export type Geste = "suivant" | "precedent" | null;

/** Ce que veut dire un déplacement du doigt, de son point de départ à son point d'arrivée. */
export function gesteDe(dx: number, dy: number, dureeMs: number): Geste {
  if (dureeMs > DUREE_MAXIMALE_MS) return null;
  if (Math.abs(dx) < DISTANCE_MINIMALE) return null;
  if (Math.abs(dx) < Math.abs(dy) * RAPPORT_HORIZONTAL) return null;
  // Glisser vers la gauche fait entrer la carte suivante, comme on tourne une page.
  return dx < 0 ? "suivant" : "precedent";
}

const COMMANDES_QUI_GLISSENT = 'input, textarea, select, [role="slider"], [data-sans-glisse]';

/** Le doigt est-il parti d'un endroit qui glisse déjà de lui-même ? */
export function departSurUneCommande(cible: EventTarget | null): boolean {
  let e = cible instanceof Element ? cible : null;
  while (e && e !== document.body) {
    if (e.matches(COMMANDES_QUI_GLISSENT)) return true;
    const style = getComputedStyle(e);
    if ((style.overflowX === "auto" || style.overflowX === "scroll") && e.scrollWidth > e.clientWidth + 1)
      return true;
    e = e.parentElement;
  }
  return false;
}

/** Un petit coup dans la main, là où le téléphone sait le donner (Android ; pas Safari). */
export function vibrer(motif: number | number[] = 10): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(motif);
    }
  } catch {
    // appareil ou réglage sans vibration : le geste reste valable sans
  }
}

/** Une réussite : deux battements, pour une analyse rendue ou un tour validé. */
export const VIBRATION_DE_REUSSITE = [14, 50, 24];

/** Les gestionnaires à poser sur le conteneur d'une carte. `actif` faux : ils ne font rien. */
export function useGlisser({
  suivant,
  precedent,
  actif = true,
}: {
  suivant?: () => void;
  precedent?: () => void;
  actif?: boolean;
}) {
  const depart = useRef<{ x: number; y: number; t: number } | null>(null);
  return {
    onTouchStart(e: TouchEvent) {
      const doigt = e.touches[0];
      // Un seul doigt : deux doigts, c'est un pincement.
      if (!actif || e.touches.length !== 1 || !doigt || departSurUneCommande(e.target)) {
        depart.current = null;
        return;
      }
      depart.current = { x: doigt.clientX, y: doigt.clientY, t: Date.now() };
    },
    onTouchEnd(e: TouchEvent) {
      const d = depart.current;
      depart.current = null;
      const doigt = e.changedTouches[0];
      if (!d || !doigt) return;
      const geste = gesteDe(doigt.clientX - d.x, doigt.clientY - d.y, Date.now() - d.t);
      if (geste === "suivant" && suivant) suivant();
      else if (geste === "precedent" && precedent) precedent();
    },
    onTouchCancel() {
      depart.current = null;
    },
  };
}
