"use client";

import { useState } from "react";

/**
 * COPIER OU PARTAGER LE CODE, SANS LE RECOPIER À LA MAIN.
 *
 * Sur téléphone, la feuille de partage native envoie le code vers ses notes ou
 * sa messagerie ; ailleurs, le presse-papiers. Si ni l'un ni l'autre n'existe
 * (navigateur ancien, contexte non sécurisé), le geste échoue sans bruit : le
 * code reste lisible juste au-dessus.
 */
export function BoutonCopierLeCode({ code }: { code: string }) {
  const [fait, setFait] = useState(false);

  async function agir() {
    const texte = `Mon code pour reprendre ma partie Business Arena : ${code}`;
    try {
      if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text: texte });
      } else {
        await navigator.clipboard.writeText(code);
      }
      setFait(true);
      setTimeout(() => setFait(false), 2500);
    } catch {
      // Partage annulé ou refusé : rien à dire, le code est toujours à l'écran.
    }
  }

  return (
    <button
      type="button"
      onClick={agir}
      className="mt-2 mr-2 rounded-lg bouton-filet border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5 pointer-coarse:min-h-11"
    >
      {fait ? "✓ Copié" : "Copier le code"}
    </button>
  );
}
