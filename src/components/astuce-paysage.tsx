"use client";

import { useEffect, useState } from "react";

/**
 * Astuce « tournez votre téléphone » pour l'arène.
 *
 * L'arène affiche des tableaux larges (marché, tableau de bord) plus à l'aise
 * en paysage. On NE FORCE PAS l'orientation — `screen.orientation.lock()` ne
 * marche pas sur iOS Safari, et bloquer l'écran en portrait pénalise
 * l'accessibilité. On se contente d'une suggestion douce, fermable.
 *
 * Visibilité en CSS pur (variantes Tailwind) : `landscape:hidden` la retire dès
 * qu'on tourne en paysage, `sm:hidden` la retire sur tablette/ordinateur — elle
 * n'apparaît donc que sur petit écran EN PORTRAIT. Une fois fermée, elle ne
 * revient pas (mémorisé par navigateur dans `localStorage`).
 */
const CLE = "astuce-paysage-fermee";

export function AstucePaysage() {
  // Masquée par défaut : le serveur et le premier rendu client rendent `null`
  // (pas de décalage d'hydratation) ; l'effet décide ensuite de l'afficher.
  const [fermee, setFermee] = useState(true);

  useEffect(() => {
    try {
      setFermee(localStorage.getItem(CLE) === "1");
    } catch {
      setFermee(false);
    }
  }, []);

  if (fermee) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-400/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200 sm:hidden landscape:hidden">
      <span>📱 ↻ Astuce : tournez votre téléphone en paysage, l&apos;arène est plus confortable à lire.</span>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(CLE, "1");
          } catch {
            // Stockage indisponible (navigation privée…) : on ferme quand même
            // pour la session en cours.
          }
          setFermee(true);
        }}
        className="shrink-0 rounded-md border border-amber-400/40 px-2 py-1 font-medium transition hover:bg-amber-400/10"
      >
        Fermer
      </button>
    </div>
  );
}
