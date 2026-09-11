"use client";

import { useFormStatus } from "react-dom";

/**
 * L'attente d'une action longue, montrée plutôt que subie.
 *
 * Une clôture de tour ou une création de partie prend dix à quinze
 * secondes côté serveur. Sans repère, l'enseignant croit à un clic perdu
 * et reclique. Une barre indéterminée et une phrase qui annonce la durée
 * suffisent à faire patienter.
 */
export function LongActionProgress({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-2 rounded-lg border border-amber-400/20 bg-amber-950/10 px-3 py-2"
    >
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800" aria-hidden>
        <div className="barre-indeterminee h-full w-1/3 rounded-full bg-amber-400" />
      </div>
      <p className="text-sm text-amber-200">{label}</p>
    </div>
  );
}

/**
 * La même barre, pour un formulaire sans état (GuardedForm d'une page
 * serveur) : elle lit l'attente du formulaire qui l'entoure.
 */
export function FormPendingProgress({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div className={className}>
      <LongActionProgress label={label} />
    </div>
  );
}
