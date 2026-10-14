"use client";

import { bouton } from "@/components/bouton";

/**
 * « TÉLÉCHARGER EN PDF » : l'impression du navigateur, sur la feuille du guide.
 *
 * La page porte sa propre feuille d'impression (A4, en-tête et pied de page, aucune
 * navigation, captures entières) : « Enregistrer au format PDF » dans la boîte
 * d'impression en fait le document à joindre à un devis ou à une formation. Rien ne
 * se génère sur le serveur, donc rien qui puisse tomber ou dériver de la page.
 */
export function BoutonPdf() {
  return (
    <span className="grid justify-items-start gap-1 print:hidden">
      <button
        type="button"
        data-bouton-pdf=""
        onClick={() => window.print()}
        className={bouton({ variante: "secondaire" })}
      >
        Télécharger en PDF
      </button>
      <span className="text-sm text-slate-400">
        Dans la fenêtre d&apos;impression, choisissez « Enregistrer au format PDF ».
      </span>
    </span>
  );
}
