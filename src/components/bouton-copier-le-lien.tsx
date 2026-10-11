"use client";

import { useState } from "react";
import { bouton, type VarianteDeBouton } from "@/components/bouton";

/**
 * COPIER LE LIEN D'UNE COHORTE, POUR LE COLLER DANS L'ENT OU UN MESSAGE.
 *
 * Le lien est écrit en clair juste à côté : si le presse-papiers est refusé
 * (contexte non sécurisé, navigateur ancien), le geste échoue sans bruit et le
 * lien reste lisible et sélectionnable. L'état « copié » est annoncé aux
 * lecteurs d'écran.
 */
export function BoutonCopierLeLien({
  lien,
  variante = "principal",
}: {
  lien: string;
  variante?: VarianteDeBouton;
}) {
  const [fait, setFait] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setFait(true);
      setTimeout(() => setFait(false), 2500);
    } catch {
      // Presse-papiers indisponible : le lien reste affiché, rien à dire de plus.
    }
  }

  return (
    <button
      type="button"
      onClick={copier}
      data-copier-le-lien=""
      className={`${bouton({ variante })} pointer-coarse:min-h-11`}
      aria-live="polite"
    >
      {fait ? "Lien copié" : "Copier le lien"}
    </button>
  );
}
