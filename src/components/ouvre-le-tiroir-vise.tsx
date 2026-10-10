"use client";

import { useEffect } from "react";

/**
 * L'ANCRE OUVRE LE TIROIR QU'ELLE VISE (catalogue des épisodes).
 *
 * Les épisodes sont rangés dans des tiroirs fermés. Une adresse qui vise une
 * famille (`#vendre`, `#hotel-remplir`) ou un secteur (`#secteur-sante`) doit
 * montrer ce qu'elle vise, pas un tiroir fermé. Trois cas :
 *   · la cible PORTE un tiroir (`:scope > details`) : on l'ouvre ;
 *   · la cible est DANS un tiroir (une famille rangée dans le tiroir de son
 *     métier) : on ouvre chaque tiroir qui la contient ;
 *   · `#famille-<code>` vise la famille `<code>` (l'ancre d'une famille est son
 *     code nu, celui de la page d'avant).
 * Puis on recale le défilement : la hauteur a changé en s'ouvrant. Le même
 * geste à chaque changement d'ancre, et au clic d'un lien du sommaire dont
 * l'ancre est déjà dans l'adresse (le navigateur ne signale alors rien).
 *
 * Sans JavaScript, l'ancre mène au bon titre, et le tiroir s'ouvre d'un clic.
 */
export function OuvreLeTiroirVise({ prefixeDeFamille }: { prefixeDeFamille: string }) {
  useEffect(() => {
    const cibleDe = (hash: string): HTMLElement | null => {
      const id = decodeURIComponent(hash.replace(/^#/, ""));
      if (!id) return null;
      const directe = document.getElementById(id);
      if (directe) return directe;
      return id.startsWith(prefixeDeFamille)
        ? document.getElementById(id.slice(prefixeDeFamille.length))
        : null;
    };
    const ouvrir = (hash: string) => {
      const cible = cibleDe(hash);
      if (!cible) return;
      let change = false;
      const porte = cible.querySelector(":scope > details");
      if (porte instanceof HTMLDetailsElement && !porte.open) {
        porte.open = true;
        change = true;
      }
      for (let el = cible.parentElement; el; el = el.parentElement) {
        if (el instanceof HTMLDetailsElement && !el.open) {
          el.open = true;
          change = true;
        }
      }
      if (change || cible.id !== decodeURIComponent(hash.slice(1))) cible.scrollIntoView();
    };
    const auChangement = () => ouvrir(window.location.hash);
    const auClic = (e: MouseEvent) => {
      const lien = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
      const hash = lien?.getAttribute("href");
      // Même ancre que l'adresse : pas de `hashchange`, on ouvre nous-mêmes.
      if (hash && hash === window.location.hash) ouvrir(hash);
    };
    auChangement();
    window.addEventListener("hashchange", auChangement);
    document.addEventListener("click", auClic);
    return () => {
      window.removeEventListener("hashchange", auChangement);
      document.removeEventListener("click", auClic);
    };
  }, [prefixeDeFamille]);
  return null;
}
