"use client";

import { useSyncExternalStore } from "react";
import { EventCard } from "@/components/event-card";
import { BrandMark } from "@/components/brand-mark";
import { cardByCode } from "@/config/events/cards";

/**
 * LE TIRAGE DU TOUR, VÉCU.
 *
 * Le moteur tire les cartes d'un tour à sa clôture ; en solo, le joueur les
 * découvrait dans ses résultats, après avoir décidé. Le tirage étant
 * déterministe (voir `peekEventDraw`), on le lui présente ENTRE L'ANALYSE ET
 * LA DÉCISION : la situation lue, les situations analysées, une pioche face
 * cachée attend à l'entrée de « Décider » — un geste pour retourner, et les
 * cartes qui pèseront sur le trimestre tombent sur une décision déjà
 * réfléchie, qu'il faut reprendre. C'est ce qui fait d'un aléa subi un
 * événement joué.
 *
 * Une fois lue, on en prend note et la carte S'EFFACE : elle a dit ce qu'elle
 * avait à dire, la décision reprend toute la place. Il en reste une ligne, et
 * de quoi la revoir. L'appareil retient où en est le joueur (retourné, noté) :
 * revenir sur la page ne rejoue pas la scène.
 */
export interface CarteTiree {
  code: string;
  /** null = toute la classe ; sinon l'entreprise ciblée. */
  teamId: string | null;
  isMyTeam: boolean;
}

function cleMemoire(gameId: string, round: number): string {
  return `tirage:${gameId}:${round}`;
}

/**
 * La mémoire du retournement, lue comme une source externe : le serveur rend
 * toujours la pioche face cachée (il ne connaît pas l'appareil), le client
 * lit l'appareil à l'hydratation, et le geste prévient les abonnés. Pas de
 * setState dans un effet, pas de désaccord serveur/client.
 */
const abonnes = new Set<() => void>();
const memoire = {
  subscribe(cb: () => void) {
    abonnes.add(cb);
    return () => abonnes.delete(cb);
  },
  /** "" jamais retourné · "1" retourné · "2" noté (replié). */
  lire(cle: string): "" | "1" | "2" {
    try {
      const v = window.localStorage.getItem(cle);
      return v === "1" || v === "2" ? v : "";
    } catch {
      return "";
    }
  },
  retenir(cle: string, etat: "1" | "2") {
    try {
      window.localStorage.setItem(cle, etat);
    } catch {
      // stockage indisponible : la scène se rejouera, ce n'est pas grave
    }
    for (const cb of abonnes) cb();
  },
};

export function TirageDuTour({
  gameId,
  round,
  periodeLabel,
  cartes,
  revele: reveleInitial = false,
  note: noteInitial = false,
}: {
  gameId: string;
  round: number;
  /** « Trimestre 3 » : le nom du tour tel que la partie le dit. */
  periodeLabel: string;
  /** Les cartes qui tomberont sur cette équipe : marché et ciblées sur elle. */
  cartes: readonly CarteTiree[];
  /** Face visible d'emblée (tests, aperçus). */
  revele?: boolean;
  /** Déjà notée et repliée d'emblée (tests, aperçus). */
  note?: boolean;
}) {
  const cle = cleMemoire(gameId, round);
  const retenu = useSyncExternalStore(
    memoire.subscribe,
    () => memoire.lire(cle),
    () => "" as const,
  );
  const note = noteInitial || retenu === "2";
  const revele = reveleInitial || note || retenu === "1";
  const retourner = () => memoire.retenir(cle, "1");
  const prendreNote = () => memoire.retenir(cle, "2");
  const revoir = () => memoire.retenir(cle, "1");

  // Notée : une ligne, et de quoi revoir. La carte a dit ce qu'elle avait à dire.
  if (note) {
    return (
      <section aria-label={`Le tirage du ${periodeLabel}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-slate-400">
        <span>
          🃏 Tirage du {periodeLabel} :{" "}
          {cartes.length > 0 ? (
            <span className="text-slate-300">
              {cartes.map((c) => cardByCode.get(c.code)?.title ?? c.code).join(" · ")}
            </span>
          ) : (
            "aucune carte"
          )}
        </span>
        {cartes.length > 0 ? (
          <button
            type="button"
            onClick={revoir}
            className="text-amber-300 underline-offset-4 hover:underline"
          >
            Revoir
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section
      aria-label={`Le tirage du ${periodeLabel}`}
      className="carte p-3 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-400">🃏 Le tirage du {periodeLabel}</h2>
        <p className="text-xs text-slate-400">
          {revele
            ? cartes.length > 0
              ? `${cartes.length > 1 ? `${cartes.length} cartes pèsent` : "Une carte pèse"} sur ce tour : décidez en le sachant.`
              : "Rien n'est tombé : le marché tourne sans surprise."
            : "Le sort du tour est scellé. Retournez les cartes avant de décider."}
        </p>
      </div>

      {!revele ? (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* la pioche : trois dos en éventail */}
          <div className="relative h-40 w-32" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="card-back-face absolute inset-0 rounded-xl border border-amber-400/30"
                style={{ transform: `rotate(${(i - 1) * 6}deg) translateY(${i * -3}px)` }}
              >
                <div className="flex h-full flex-col items-center justify-center gap-1">
                  <BrandMark className="h-8 w-8 text-amber-400/80" />
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/70">
                    Arena
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={retourner}
            className="rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
          >
            Retourner les cartes
          </button>
        </div>
      ) : (
        <div aria-live="polite">
          {cartes.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {cartes.map((c, i) => (
                <EventCard
                  key={`${c.code}-${c.teamId ?? "market"}`}
                  code={c.code}
                  delayMs={i * 500}
                  targetLabel={c.teamId ? "🎯 Votre entreprise" : "Tout le marché"}
                  highlight={c.isMyTeam}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-white/5 bg-slate-950 px-4 py-3 text-center text-sm text-slate-300">
              🃏 Aucune carte ce tour.
            </p>
          )}
          {/* Lue, la carte s'efface : on en prend note, la décision reprend la place. */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={prendreNote}
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
            >
              J&apos;ai pris note
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
