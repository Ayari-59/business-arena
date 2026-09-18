"use client";

import { useSyncExternalStore } from "react";
import { CourrierRecommande, Enveloppe, Lettre } from "@/components/courrier";
import { courrierParCode } from "@/config/courriers/registre";
import { courrierDeRoutine } from "@/config/courriers/routine";

/**
 * LE COURRIER DU TRIMESTRE, VÉCU.
 *
 * Le moteur tire les événements d'un tour à sa clôture ; en solo, le joueur
 * les découvrait dans ses résultats, après avoir décidé. Le tirage étant
 * déterministe (voir `peekEventDraw`), on le lui présente ENTRE L'ANALYSE ET
 * LA DÉCISION : la situation lue, les situations analysées, le courrier
 * attend, cacheté, à l'entrée de « Décider » — un geste pour l'ouvrir, et ce
 * qui pèsera sur le trimestre tombe sur une décision déjà réfléchie, qu'il
 * faut reprendre. C'est ce qui fait d'un aléa subi un événement joué.
 *
 * UNE ENVELOPPE N'EST JAMAIS VIDE. Quand rien de notable ne tombe, le facteur
 * passe quand même : un courrier de routine, sans effet sur les comptes,
 * remplace le « aucune carte ce tour » d'autrefois. Le trimestre calme se lit,
 * lui aussi.
 *
 * Une fois lu, on en prend note et le courrier SE CLASSE : il a dit ce qu'il
 * avait à dire, la décision reprend toute la place. Il en reste une ligne, et
 * de quoi le relire. L'appareil retient où en est le joueur (ouvert, classé) :
 * revenir sur la page ne rejoue pas la scène.
 */
export interface PliDuTour {
  code: string;
  /** null = toute la classe ; sinon l'entreprise destinataire. */
  teamId: string | null;
  isMyTeam: boolean;
}

function cleMemoire(gameId: string, round: number): string {
  return `courrier:${gameId}:${round}`;
}

/**
 * La mémoire de l'ouverture, lue comme une source externe : le serveur rend
 * toujours l'enveloppe cachetée (il ne connaît pas l'appareil), le client lit
 * l'appareil à l'hydratation, et le geste prévient les abonnés. Pas de
 * setState dans un effet, pas de désaccord serveur/client.
 */
const abonnes = new Set<() => void>();
const memoire = {
  subscribe(cb: () => void) {
    abonnes.add(cb);
    return () => abonnes.delete(cb);
  },
  /** "" jamais ouvert · "1" ouvert · "2" classé (replié). */
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

export function CourrierDuTour({
  gameId,
  round,
  periodeLabel,
  plis,
  ouvert: ouvertInitial = false,
  classe: classeInitial = false,
}: {
  gameId: string;
  /** « Trimestre 3 » : le nom du tour tel que la partie le dit. */
  round: number;
  periodeLabel: string;
  /** Les courriers qui tomberont sur cette équipe : marché et adressés à elle. */
  plis: readonly PliDuTour[];
  /** Enveloppe déjà ouverte d'emblée (tests, aperçus). */
  ouvert?: boolean;
  /** Déjà classé et replié d'emblée (tests, aperçus). */
  classe?: boolean;
}) {
  const cle = cleMemoire(gameId, round);
  const retenu = useSyncExternalStore(
    memoire.subscribe,
    () => memoire.lire(cle),
    () => "" as const,
  );
  const classe = classeInitial || retenu === "2";
  const ouvert = ouvertInitial || classe || retenu === "1";
  const ouvrir = () => memoire.retenir(cle, "1");
  const prendreNote = () => memoire.retenir(cle, "2");
  const relire = () => memoire.retenir(cle, "1");

  // Le courrier de routine : ce que le facteur apporte un trimestre calme.
  const routine = courrierDeRoutine(gameId, round);
  const vide = plis.length === 0;

  // Classé : une ligne, et de quoi relire. Le courrier a dit ce qu'il avait à dire.
  if (classe) {
    return (
      <section
        aria-label={`Le courrier du ${periodeLabel}`}
        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-slate-400"
      >
        <span>
          📬 Courrier du {periodeLabel} :{" "}
          <span className="text-slate-300">
            {vide
              ? routine.objet
              : plis.map((p) => courrierParCode.get(p.code)?.objet ?? p.code).join(" · ")}
          </span>
        </span>
        <button
          type="button"
          onClick={relire}
          className="text-amber-300 underline-offset-4 hover:underline"
        >
          Relire
        </button>
      </section>
    );
  }

  return (
    <section aria-label={`Le courrier du ${periodeLabel}`} className="carte p-3 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-400">📬 Le courrier du {periodeLabel}</h2>
        <p className="text-xs text-slate-400">
          {ouvert
            ? vide
              ? "Rien qui engage ce trimestre : le courrier se classe, et la décision reprend la main."
              : `${plis.length > 1 ? `${plis.length} courriers pèsent` : "Un courrier pèse"} sur ce tour : décidez en le sachant.`
            : "Le facteur est passé. Ouvrez le courrier avant de décider."}
        </p>
      </div>

      {!ouvert ? (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* la pile de plis, cachetés */}
          <div className="relative h-36 w-56" aria-hidden>
            {[0, 1, 2].map((i) => (
              <Enveloppe
                key={i}
                className="absolute inset-0"
                destinataire="L'entreprise"
                liasse={null}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={ouvrir}
            className="rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
          >
            Ouvrir le courrier
          </button>
        </div>
      ) : (
        <div aria-live="polite">
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {vide ? (
              <Lettre code={routine.code} destinataire="L'entreprise" />
            ) : (
              plis.map((p, i) => (
                <CourrierRecommande
                  key={`${p.code}-${p.teamId ?? "market"}`}
                  code={p.code}
                  delayMs={i * 500}
                  destinataire={p.teamId ? "🎯 Votre entreprise" : "Tout le marché"}
                  surligne={p.isMyTeam}
                />
              ))
            )}
          </div>
          {/* Lu, le courrier se classe : la décision reprend la place. */}
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
