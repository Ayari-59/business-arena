"use client";

import { useFormStatus } from "react-dom";

/**
 * LA CASE QUI LIBÈRE UN CHAPITRE D'UN CLIC (audit UX du 11 novembre 2026, P1-3 : il fallait déplier la
 * liste, trouver le chapitre, cliquer, puis « Libérer »). C'est un bouton d'envoi du formulaire de la
 * liste, qui porte son chapitre et le geste (`case` : « code:1 » libère, « code:0 » referme), et se lit
 * comme une case à cocher (`role="checkbox"`) : un clic libère ou referme, sans script comme avec.
 * Pendant l'envoi, les cases se désactivent (`useFormStatus`, comme components/submit-button.tsx).
 */
export function CaseDeLiberation({ coche, libelle, chapitre }: { coche: boolean; libelle: string; chapitre: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="case"
      value={`${chapitre}:${coche ? "0" : "1"}`}
      role="checkbox"
      aria-checked={coche}
      aria-label={libelle}
      disabled={pending}
      aria-busy={pending}
      data-case-de-liberation={coche ? "cochee" : "vide"}
      className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg disabled:cursor-progress disabled:opacity-60"
    >
      <span
        aria-hidden
        className={`grid h-6 w-6 place-items-center rounded-md border-2 text-sm font-bold leading-none ${
          coche ? "border-emerald-400 bg-emerald-500 text-slate-950" : "border-slate-300"
        }`}
      >
        {coche ? "✓" : ""}
      </span>
    </button>
  );
}
