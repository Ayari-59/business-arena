"use client";

/**
 * Imprimer la page courante. Un atelier se lit à l'écran pour se décider, et
 * se pose sur la table pendant la séance : la version papier n'est pas un
 * accessoire, c'est le second usage.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-400/50 print:hidden"
    >
      🖨️ {label}
    </button>
  );
}
