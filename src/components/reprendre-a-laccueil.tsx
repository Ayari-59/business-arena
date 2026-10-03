"use client";

import { useEffect, useState } from "react";
import { ReprendreMaPartie } from "@/components/reprendre-ma-partie";
import type { PartieEnCours } from "@/services/partie-en-cours.service";

/**
 * L'ACCUEIL EST STATIQUE, LA PARTIE EN COURS NE L'EST PAS.
 *
 * Cet îlot demande à `/api/mes-parties` ce que l'appareil a commencé, et ne
 * rend rien tant que la réponse n'est pas là : pas de saut de mise en page
 * pour celui qui n'a rien à reprendre, et aucune erreur affichée si le réseau
 * manque — l'accueil fonctionne très bien sans.
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

  return <ReprendreMaPartie parties={parties} className="mb-6 max-w-md" />;
}
