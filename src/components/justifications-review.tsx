"use client";

import { useState } from "react";
import { reviewJustificationsAction } from "@/app/teacher/games/[gameId]/ai-actions";

/**
 * Bouton enseignant : demande à l'IA une synthèse des justifications de la
 * classe pour préparer le débriefing. Rendu seulement si la surface est
 * disponible (prop calculée côté serveur).
 */
export function JustificationsReview({
  gameId,
  available,
}: {
  gameId: string;
  available: boolean;
}) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (!available) return null;

  async function ask() {
    setPending(true);
    setError(null);
    const res = await reviewJustificationsAction(gameId);
    setPending(false);
    if (res.ok) setText(res.text);
    else setError(res.reason);
  }

  return (
    <div className="mt-3 rounded-lg border border-sky-400/25 bg-sky-950/10 p-3">
      <button
        type="button"
        onClick={ask}
        disabled={pending}
        className="rounded-lg border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Synthèse en cours…" : "✨ Synthèse IA des justifications"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      {text ? (
        <p className="mt-3 whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm leading-relaxed text-slate-200">
          {text}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">
        Générée par une IA à partir des justifications du tour : à relire, une aide au débriefing.
      </p>
    </div>
  );
}
