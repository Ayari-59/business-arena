"use client";

import { useEffect } from "react";

/**
 * UNE ANCRE QUI ARRIVE DEVANT UNE SECTION FERMÉE N'A RIEN MONTRÉ.
 *
 * Le navigateur déplie un `<details>` quand la cible de l'ancre est DEDANS,
 * pas quand la cible est la section qui le contient. Un lien « Déploiement »
 * du menu amenait donc le lecteur devant un titre et un « Lire cette section »,
 * c'est-à-dire devant l'envers de ce qu'il demandait.
 *
 * Ce composant ouvre le tiroir de la section visée, à l'arrivée comme à chaque
 * changement d'ancre, puis recale le défilement : la hauteur a changé en
 * s'ouvrant. Sans JavaScript, la section reste lisible d'un clic.
 */
export function OuvreLaSectionVisee() {
  useEffect(() => {
    const ouvrir = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const tiroir = document.getElementById(id)?.querySelector(":scope > details");
      if (!(tiroir instanceof HTMLDetailsElement) || tiroir.open) return;
      tiroir.open = true;
      document.getElementById(id)?.scrollIntoView();
    };
    ouvrir();
    window.addEventListener("hashchange", ouvrir);
    return () => window.removeEventListener("hashchange", ouvrir);
  }, []);
  return null;
}
