"use client";

import { usePathname } from "next/navigation";

/**
 * LE CHEMIN DE LA PAGE, LE MÊME AU SERVEUR ET DANS LE NAVIGATEUR.
 *
 * Constaté en production (audit d'octobre 2026) : l'accueil levait l'erreur
 * React #418 (hydratation) à chaque chargement. L'accueil est régénéré en tâche
 * de fond (ISR, `revalidate`), et sur Vercel cette régénération rend la page
 * sous le chemin `/index` : la charge RSC servie portait `"c":["","index"]`.
 * `usePathname()` valait donc `/index` au serveur et `/` dans le navigateur. La
 * barre d'action mobile, qui ne s'affiche que sur une liste de chemins, n'était
 * pas dans le HTML du serveur et apparaissait au client : React rejetait la page
 * et la reconstruisait.
 *
 * Les composants communs lisent le chemin ici : `/index` est l'accueil.
 */
export function cheminNormalise<T extends string | null>(chemin: T): T {
  return (chemin === "/index" ? "/" : chemin) as T;
}

export function useCheminDeLaPage(): ReturnType<typeof usePathname> {
  return cheminNormalise(usePathname());
}
