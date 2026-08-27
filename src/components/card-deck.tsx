"use client";

import { useActionState, useState } from "react";
import { drawCardAction, type DrawCardState } from "@/app/teacher/actions";
import { cardsForEventCodes } from "@/config/events/cards";
import { EventCard } from "@/components/event-card";
import { BrandMark } from "@/components/brand-mark";

const initial: DrawCardState = { error: null, drawnCode: null };

const MAX_PENDING = 4;
const MAX_MARKET = 2;

/**
 * Le deck de l'enseignant (mode apprentissage) : deux pioches distinctes —
 * les cartes marché (toute la classe) et les cartes équipe (ciblées). La
 * carte est annoncée aux équipes et appliquée à la clôture du tour.
 */
export function CardDeck({
  gameId,
  pendingEvents,
  teams,
  scenarioEventCodes,
  scenarioCode,
}: {
  gameId: string;
  pendingEvents: { code: string; teamId: string | null; teamName: string | null }[];
  teams: { teamId: string; name: string }[];
  /** Codes d'événements du snapshot joué : le deck est celui du secteur. */
  scenarioEventCodes: string[];
  /** Secteur joué — pour imprimer le bon deck physique. */
  scenarioCode: string;
}) {
  const [state, formAction, pending] = useActionState(drawCardAction.bind(null, gameId), initial);
  const [target, setTarget] = useState<string>("");

  const marketPending = pendingEvents.filter((c) => c.teamId === null);
  const teamsWithCard = new Set(pendingEvents.map((c) => c.teamId).filter(Boolean));
  const marketFull = marketPending.length >= MAX_MARKET;
  const allFull = pendingEvents.length >= MAX_PENDING;

  const isTeamDraw = target !== "";
  const deck = cardsForEventCodes(scenarioEventCodes);
  const drawable = deck.filter(
    (c) =>
      c.scope === (isTeamDraw ? "team" : "market") &&
      !pendingEvents.some((p) => p.code === c.code),
  );

  return (
    <section className="rounded-xl border border-amber-400/20 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-200">🃏 Deck d&apos;événements</h2>
        <a
          href={`/teacher/cards/print?scenario=${encodeURIComponent(scenarioCode)}`}
          target="_blank"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-400/40 hover:text-amber-300"
        >
          🖨️ Imprimer le deck physique
        </a>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Cartes <strong className="text-slate-300">marché</strong> pour toute la classe, cartes{" "}
        <strong className="text-slate-300">équipe</strong> pour cibler une seule entreprise.
        Annoncées aux équipes, appliquées à la clôture du tour. Vous pouvez aussi faire tirer les
        cartes physiques en classe puis saisir la carte tirée ici. (Mode apprentissage uniquement,
        en compétition, seul le tirage aléatoire du moteur fait foi.)
      </p>

      {pendingEvents.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            Cartes en jeu ce tour
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
            {pendingEvents.map((card, i) => (
              <EventCard
                key={`${card.code}-${card.teamId ?? "market"}`}
                code={card.code}
                delayMs={i * 450}
                announced
                targetLabel={card.teamName ? `→ ${card.teamName}` : "Toute la classe"}
              />
            ))}
          </div>
        </div>
      ) : null}

      {!allFull ? (
        <form action={formAction} className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="card-target" className="text-xs font-semibold text-slate-400">
              Destinataire
            </label>
            <select
              id="card-target"
              name="teamId"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            >
              <option value="" disabled={marketFull}>
                🌍 Toute la classe (carte marché){marketFull ? " · max atteint" : ""}
              </option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId} disabled={teamsWithCard.has(t.teamId)}>
                  🎯 {t.name} (carte équipe)
                  {teamsWithCard.has(t.teamId) ? " · carte déjà en jeu" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* pioche face cachée */}
            <button
              type="submit"
              name="eventCode"
              value=""
              disabled={pending || (target === "" && marketFull)}
              className={`group relative h-24 w-16 rounded-lg border shadow-lg transition hover:-translate-y-1 disabled:opacity-60 ${
                isTeamDraw
                  ? "border-sky-400/40 bg-gradient-to-br from-slate-800 to-sky-950"
                  : "border-amber-400/40 bg-gradient-to-br from-slate-800 to-slate-950"
              }`}
              title={isTeamDraw ? "Tirer une carte équipe au hasard" : "Tirer une carte marché au hasard"}
            >
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <BrandMark
                  className={`h-7 w-7 ${isTeamDraw ? "text-sky-400/80" : "text-amber-400/80"}`}
                />
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest ${
                    isTeamDraw ? "text-sky-400/80" : "text-amber-400/70"
                  }`}
                >
                  {isTeamDraw ? "Équipe" : "Marché"}
                </span>
              </span>
            </button>
            <span className="text-xs text-slate-500">ou</span>
            <select
              name="eventCode"
              defaultValue=""
              key={isTeamDraw ? "team" : "market"}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            >
              <option value="">Carte au hasard</option>
              {drawable.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.emoji} {c.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending || (target === "" && marketFull)}
              className="rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-400/10 disabled:opacity-60"
            >
              {pending ? "Tirage…" : "Jouer la carte"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Quatre cartes maximum par tour : clôturez le tour pour continuer.
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
