"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * La page se relit toute seule : la projection d'une étape suit les réponses de la classe
 * sans que l'enseignant touche à rien. Un onglet caché ne relit pas.
 */
export function Rafraichir({ secondes }: { secondes: number }) {
  const router = useRouter();
  useEffect(() => {
    const minuteur = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, secondes * 1000);
    return () => clearInterval(minuteur);
  }, [router, secondes]);
  return null;
}
