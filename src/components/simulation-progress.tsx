"use client";

import { useEffect, useState } from "react";

/**
 * Le moment de simulation, en solo. Valider résout le tour côté serveur puis
 * redirige : entre les deux, l'attente était un simple « Envoi en cours… ».
 * Inspiré des maquettes « découverte », on la rend tangible — le joueur voit
 * la machine tourner, étape après étape, plutôt qu'un bouton grisé.
 *
 * L'animation est décorative : les étapes défilent à un rythme régulier
 * pendant que l'action serveur travaille ; quand elle se termine, la
 * redirection remplace la page (le composant est démonté). Si le calcul est
 * plus long que l'animation, on tient sur la dernière étape. `aria-live`
 * annonce la progression ; `prefers-reduced-motion` fige la barre.
 */
const ETAPES = [
  "Calcul des approvisionnements",
  "Calcul de la production",
  "Calcul de la demande",
  "Calcul de la satisfaction client",
  "Calcul des ventes",
  "Calculs comptables et financiers",
  "Calcul des évaluations",
];

export function SimulationProgress({ periodName }: { periodName: string }) {
  const [etape, setEtape] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // On avance jusqu'à l'avant-dernière étape et on y tient : la dernière
      // ne se « coche » qu'au moment où le serveur a réellement fini (la
      // redirection démonte alors le composant).
      setEtape((e) => (e < ETAPES.length - 1 ? e + 1 : e));
    }, 550);
    return () => clearInterval(id);
  }, []);

  const pourcent = Math.round((etape / (ETAPES.length - 1)) * 92);

  return (
    <section
      aria-live="polite"
      className="rounded-xl border border-amber-400/30 bg-slate-900 p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
          <span aria-hidden className="motion-safe:animate-pulse">
            🚀
          </span>
          Simulation en cours · {periodName}
        </p>
        <span className="text-sm font-semibold tabular-nums text-amber-300">{pourcent}%</span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-amber-400 transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${pourcent}%` }}
        />
      </div>

      <ol className="mt-4 space-y-1.5">
        {ETAPES.map((libelle, i) => {
          const fait = i < etape;
          const courant = i === etape;
          return (
            <li key={libelle} className="flex items-center gap-2.5 text-sm">
              <span
                aria-hidden
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  fait
                    ? "bg-emerald-400 text-slate-950"
                    : courant
                      ? "border border-amber-400 text-amber-300 motion-safe:animate-pulse"
                      : "border border-white/10 text-slate-600"
                }`}
              >
                {fait ? "✓" : ""}
              </span>
              <span
                className={
                  fait ? "text-slate-400" : courant ? "text-slate-100" : "text-slate-600"
                }
              >
                {libelle}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
