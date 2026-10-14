"use client";

import { useEffect, useState } from "react";

/**
 * CE QUE LES TIROIRS CASSENT, ET QU'IL FAUT RÉPARER.
 *
 * Replier douze diplômes fait passer la page de seize mille neuf cents pixels
 * à moins de deux mille. Deux choses se perdent au passage, et aucune ne se
 * voit tant qu'on ne s'en sert pas.
 *
 * LA PREMIÈRE EST L'INDEX. Les pastilles du haut pointent vers l'ancre d'un
 * diplôme ; un navigateur déplie un tiroir quand la cible est DEDANS, pas
 * quand elle EST le tiroir. Un clic sur « BTS GPME » amenait donc devant un
 * tiroir fermé, c'est-à-dire devant un titre et rien d'autre : l'index
 * désignait sa cible et la cachait du même geste.
 *
 * LA SECONDE EST LA RECHERCHE DANS LA PAGE. Le contenu d'un tiroir fermé
 * échappe au Ctrl+F du navigateur. Un enseignant qui cherche « seuil de
 * rentabilité » sur la page qui parle de son référentiel ne trouverait rien,
 * et conclurait que le mot n'y est pas. D'où le dépliage en un geste, qui rend
 * aussi la page imprimable d'un bloc.
 *
 * Sans JavaScript, tout reste utilisable : les tiroirs s'ouvrent au clic,
 * l'ancre amène au bon titre, et seul le confort disparaît.
 */

/** Les tiroirs de la page, marqués pour que la commande ne touche qu'eux. */
const TIROIRS = "details[data-diplome]";

export function TiroirsDesDiplomes() {
  const [tousOuverts, setTousOuverts] = useState(false);

  useEffect(() => {
    const ouvrirLaCible = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const cible = document.getElementById(id);
      if (!(cible instanceof HTMLDetailsElement) || cible.open) return;
      cible.open = true;
      // Le navigateur a déjà fait défiler vers un tiroir fermé, donc vers une
      // hauteur qui n'est plus la bonne une fois qu'il s'ouvre.
      cible.scrollIntoView();
    };
    ouvrirLaCible();
    window.addEventListener("hashchange", ouvrirLaCible);
    return () => window.removeEventListener("hashchange", ouvrirLaCible);
  }, []);

  const basculer = () => {
    const ouvrir = !tousOuverts;
    for (const tiroir of document.querySelectorAll<HTMLDetailsElement>(
      TIROIRS,
    )) {
      tiroir.open = ouvrir;
    }
    setTousOuverts(ouvrir);
  };

  return (
    <button
      type="button"
      onClick={basculer}
      className="rounded-full border border-amber-400/30 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-400/10"
    >
      {tousOuverts ? "Tout replier" : "Tout déplier"}
    </button>
  );
}
