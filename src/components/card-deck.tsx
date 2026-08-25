"use client";

import { useActionState } from "react";
import { drawCardAction, type DrawCardState } from "@/app/teacher/actions";
import { EVENT_CARDS, TEACHER_DRAWABLE_CODES } from "@/config/events/cards";
import { EventCard } from "@/components/event-card";

const initial: DrawCardState = { error: null, drawnCode: null };

/**
 * Le deck de l'enseignant (mode apprentissage) : tirer une carte au hasard ou
 * jouer une carte choisie. La carte est annoncée aux équipes et appliquée à
 * la clôture du tour.
 */
export function CardDeck({
  gameId,
  pendingCodes,
}: {
  gameId: string;
  pendingCodes: string[];
}) {
  const [state, formAction, pending] = useActionState(drawCardAction.bind(null, gameId), initial);
  const drawable = EVENT_CARDS.filter(
    (c) => TEACHER_DRAWABLE_CODES.includes(c.code) && !pendingCodes.includes(c.code),
  );

  return (
    <section className="rounded-xl border border-amber-400/20 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold text-slate-200">🃏 Deck d&apos;événements</h2>
      <p className="mt-1 text-xs text-slate-500">
        Tirez une carte pour pimenter le tour en cours : elle est annoncée aux équipes et
        s&apos;appliquera à la clôture. (Mode apprentissage uniquement — en compétition, seul
        le tirage aléatoire du moteur fait foi.)
      </p>

      {pendingCodes.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            Cartes en jeu ce tour
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
            {pendingCodes.map((code, i) => (
              <EventCard key={code} code={code} delayMs={i * 450} announced />
            ))}
          </div>
        </div>
      ) : null}

      {pendingCodes.length < 2 ? (
        <form action={formAction} className="mt-4 flex flex-wrap items-center gap-3">
          {/* pioche face cachée */}
          <button
            type="submit"
            name="eventCode"
            value=""
            disabled={pending}
            className="group relative h-24 w-16 rounded-lg border border-amber-400/40 bg-gradient-to-br from-slate-800 to-slate-950 shadow-lg transition hover:-translate-y-1 disabled:opacity-60"
            title="Tirer une carte au hasard"
          >
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-xl">🂠</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70">
                Piocher
              </span>
            </span>
          </button>
          <span className="text-xs text-slate-500">ou</span>
          <select
            name="eventCode"
            defaultValue=""
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          >
            <option value="">— carte au hasard —</option>
            {drawable.map((c) => (
              <option key={c.code} value={c.code}>
                {c.emoji} {c.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-400/10 disabled:opacity-60"
          >
            {pending ? "Tirage…" : "Jouer la carte"}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Deux cartes maximum par tour — clôturez le tour pour continuer.
        </p>
      )}
      {state.error ? (
        <p className="mt-3 rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}
