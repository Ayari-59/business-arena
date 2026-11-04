"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * UN TABLEAU DU COURS QUI S'EMPILE SUR TÉLÉPHONE QUAND IL NE TIENT PAS (observation du propriétaire,
 * novembre 2026 : « ne pas être obligé de scroller en largeur »).
 *
 * Le nombre de colonnes donne l'empilement d'emblée (`empiler`, en-tete-de-colonne.tsx) ; la mesure rattrape
 * le reste : un tableau plus large que son conteneur sur un écran étroit s'empile aussi (globals.css,
 * `.tableau-empilable`, n'agit que sous 640 px). Une fois empilé, il le reste : empilé, il tient, et le
 * désempiler le ferait déborder à nouveau. Garde : tests/e2e/cours.e2e.ts (aucun tableau ne défile en
 * largeur à 390 px).
 */
export const ECRAN_ETROIT = "(max-width: 639px)";

export function TableauQuiSEmpile({ className, empiler, children }: { className: string; empiler: boolean; children: ReactNode }) {
  const ref = useRef<HTMLTableElement>(null);
  const [deborde, setDeborde] = useState(false);
  useLayoutEffect(() => {
    const t = ref.current;
    const parent = t?.parentElement;
    if (!t || !parent || empiler || typeof window.matchMedia !== "function") return;
    const mesurer = () => {
      if (window.matchMedia(ECRAN_ETROIT).matches && t.scrollWidth > parent.clientWidth + 1) setDeborde(true);
    };
    mesurer();
    if (typeof ResizeObserver === "undefined") return;
    const o = new ResizeObserver(mesurer);
    o.observe(parent);
    return () => o.disconnect();
  }, [empiler]);
  return (
    <table ref={ref} role="table" className={`${className} ${empiler || deborde ? "tableau-empilable" : ""}`}>
      {children}
    </table>
  );
}
