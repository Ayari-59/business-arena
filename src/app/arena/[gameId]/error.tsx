"use client";

import { bouton } from "@/components/bouton";

export default function ArenaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-bold text-slate-100">
        Une erreur est survenue
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {error.message || "Impossible de charger la partie. Veuillez réessayer."}
      </p>
      <button
        type="button"
        onClick={reset}
        className={`${bouton()} mt-6`}
      >
        Réessayer
      </button>
    </main>
  );
}
