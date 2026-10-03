"use client";

import { useEffect, useRef } from "react";

/**
 * REPLIÉ SUR TÉLÉPHONE, À PLAT AILLEURS.
 *
 * Les pages publiques sont servies depuis le cache : elles ne savent pas, au
 * rendu, si le lecteur tient un téléphone. Ce composant rend donc un
 * `<details>` FERMÉ (le contenu est dans le HTML, lisible par les moteurs de
 * recherche et par Ctrl+F une fois ouvert), puis l'ouvre dès que l'écran passe
 * le seuil `sm` — et le suit quand on tourne l'appareil. Sur grand écran le
 * résumé disparaît : la page est celle d'avant, sans bouton à replier.
 *
 * LE CSS FAIT LE MÊME TRAVAIL AVANT LE JAVASCRIPT, là où le navigateur sait
 * styler `::details-content` (voir globals.css) : sur grand écran le contenu
 * est visible dès le premier affichage, sans attendre l'hydratation ni
 * produire de saut de mise en page. Le script ne sert plus qu'aux navigateurs
 * plus anciens.
 *
 * Sans JavaScript, le résumé reste visible partout et ouvre au clic : on perd
 * le confort, pas le contenu. Le lecteur d'écran lit l'état natif du
 * `<details>` (« développé » / « réduit »).
 *
 * À l'impression le contenu s'ouvre aussi : une fiche imprimée ne se déplie
 * pas.
 */
const GRAND_ECRAN = "(min-width: 640px)";

export function RepliableSurTelephone({
  resume,
  children,
  className = "",
  resumeClassName = "",
}: {
  /** Ce que le résumé promet : « Voir le détail », « Afficher les modèles »… */
  resume: string;
  children: React.ReactNode;
  className?: string;
  resumeClassName?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const requete = window.matchMedia(GRAND_ECRAN);
    const appliquer = () => {
      if (requete.matches) {
        el.open = true;
        el.dataset.aPlat = "";
      } else if ("aPlat" in el.dataset) {
        // On revient au téléphone (rotation) : on replie ce qu'on avait ouvert.
        el.open = false;
        delete el.dataset.aPlat;
      }
    };
    const avantImpression = () => {
      el.open = true;
    };
    appliquer();
    requete.addEventListener("change", appliquer);
    window.addEventListener("beforeprint", avantImpression);
    return () => {
      requete.removeEventListener("change", appliquer);
      window.removeEventListener("beforeprint", avantImpression);
    };
  }, []);

  return (
    <details ref={ref} className={`repliable-tel group ${className}`}>
      <summary
        className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-semibold text-amber-300 hover:text-amber-200 group-data-[a-plat]:hidden [&::-webkit-details-marker]:hidden ${resumeClassName}`}
      >
        <span
          aria-hidden
          className="inline-block transition-transform group-open:rotate-90 motion-reduce:transition-none"
        >
          ▸
        </span>
        <span>{resume}</span>
      </summary>
      {children}
    </details>
  );
}
