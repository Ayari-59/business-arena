"use client";

import { useState } from "react";
import { bouton, type VarianteDeBouton } from "@/components/bouton";

/**
 * COPIER UN MESSAGE PRÊT À COLLER DANS PRONOTE OU ÉCOLE DIRECTE.
 *
 * Ni Pronote ni École Directe n'accueillent d'outil externe : l'enseignant
 * passe par le cahier de textes ou le « travail à faire », où il colle un lien.
 * Ce bouton lui donne le message entier (le lien direct, le code, la consigne),
 * pour qu'il n'ait rien à recomposer. Si le presse-papiers est refusé, le geste
 * échoue sans bruit : le lien et le code restent affichés à côté.
 */
export function BoutonCopierLeMessage({
  message,
  variante = "secondaire",
}: {
  message: string;
  variante?: VarianteDeBouton;
}) {
  const [fait, setFait] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(message);
      setFait(true);
      setTimeout(() => setFait(false), 2500);
    } catch {
      // Presse-papiers indisponible : le lien et le code restent lisibles.
    }
  }

  return (
    <button
      type="button"
      onClick={copier}
      data-copier-le-message=""
      className={`${bouton({ variante })} pointer-coarse:min-h-11`}
      aria-live="polite"
    >
      {fait ? "Message copié" : "Copier pour Pronote / École Directe"}
    </button>
  );
}
