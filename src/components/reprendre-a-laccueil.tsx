"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PartieEnCours } from "@/services/partie-en-cours.service";

/**
 * L'ACCUEIL EST STATIQUE, LA PARTIE EN COURS NE L'EST PAS.
 *
 * Cet îlot demande à `/api/mes-parties` ce que l'appareil a commencé, et ne
 * rend rien tant que la réponse n'est pas là : pas de saut de mise en page
 * pour celui qui n'a rien à reprendre, et aucune erreur affichée si le réseau
 * manque — l'accueil fonctionne très bien sans.
 *
 * DISCRET, PAR CHOIX. La première version posait une carte de trois parties
 * AU-DESSUS du titre : sur téléphone, la proposition de valeur descendait sous
 * la ligne de flottaison pour celui qui revient. L'accueil reste celui de tout
 * le monde ; ici, une seule ligne sous les boutons, pour la dernière partie, et
 * un lien vers les autres. La liste complète vit sur /jouer.
 */
export function ReprendreALAccueil() {
  const [parties, setParties] = useState<PartieEnCours[]>([]);

  useEffect(() => {
    let annule = false;
    fetch("/api/mes-parties", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((corps: { parties?: PartieEnCours[] } | null) => {
        if (!annule && corps?.parties) setParties(corps.parties);
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, []);

  const derniere = parties[0];
  if (!derniere) return null;
  const autres = parties.length - 1;

  return (
    <div data-reprendre-ma-partie className="mt-5 max-w-sm">
      <Link
        href={`/arena/${derniere.gameId}`}
        className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-slate-900/60 px-4 py-2.5 transition hover:border-amber-400/60 hover:bg-slate-900"
      >
        <span className="min-w-0">
          <span className="block text-xs uppercase tracking-[0.18em] text-amber-300">
            Reprendre ma partie
          </span>
          <span className="block truncate text-sm text-slate-200">
            {derniere.entreprise} · tour {derniere.tour} sur {derniere.tours}
          </span>
        </span>
        <span
          aria-hidden
          className="text-amber-300 transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
      {autres > 0 ? (
        <Link
          href="/jouer"
          className="mt-1 inline-flex min-h-11 items-center text-sm text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
        >
          Voir mes {parties.length} parties en cours
        </Link>
      ) : null}
    </div>
  );
}
