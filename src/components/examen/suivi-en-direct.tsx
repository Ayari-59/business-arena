"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * LE SUIVI EN DIRECT D'UN EXAMEN : la page de l'enseignant se relit d'elle-même tant que
 * des copies sont en cours, à la cadence donnée, et seulement quand l'onglet est visible
 * (un onglet laissé ouvert en arrière-plan ne sollicite pas le serveur). Le serveur rend
 * l'heure de la dernière lecture, à côté.
 */
export function SuiviEnDirect({ actif, toutesLesMs = 20_000 }: { actif: boolean; toutesLesMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!actif) return;
    const minuterie = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, toutesLesMs);
    return () => clearInterval(minuterie);
  }, [actif, toutesLesMs, router]);
  return null;
}
