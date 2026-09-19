"use client";

import { useSyncExternalStore } from "react";
import { CourrierRecommande, grilleDeCourriers } from "@/components/courrier";
import { creerMemoireDeLecture } from "@/components/memoire-de-lecture";
import { lettreDeMission } from "@/config/courriers/mission";

/**
 * LE MANDAT, ET SON RANGEMENT.
 *
 * La note des associés ouvre la partie : elle dit qui confie quoi, et elle se
 * lit avant tout le reste. Mais elle arrive au premier tour, c'est à dire
 * exactement là où l'élève a déjà le plus à lire — le contexte de
 * l'entreprise, les alertes, la situation du tour. Quatre blocs de texte
 * empilés, et on ne lit plus le premier.
 *
 * Un mandat se lit une fois et se range. Lu, il ne laisse qu'une ligne et de
 * quoi le rouvrir ; la place revient à ce qu'il faut décider. C'est le même
 * geste que le courrier du tour, et volontairement le même mot : « J'ai pris
 * note ».
 *
 * L'APPAREIL S'EN SOUVIENT, par la mémoire de lecture — vive d'abord, stockage
 * ensuite —, si bien qu'un rafraîchissement ne remet pas le mur de texte, et
 * qu'un navigateur qui refuse d'écrire ne rend pas le bouton inerte.
 */
function cleMemoire(gameId: string): string {
  return `mandat:${gameId}`;
}

/**
 * "" jamais rangé · "1" rouvert · "2" rangé. Le même vocabulaire que le
 * courrier du tour — et « rouvrir » est un état à part entière, pas un retour
 * au néant : la mémoire retient ce qui a été fait, jamais ce qui a été défait.
 */
const memoire = creerMemoireDeLecture(["1", "2"] as const);

export function MandatDeLEquipe({
  gameId,
  niveau,
  equipe,
  range: rangeInitial = false,
}: {
  gameId: string;
  /** Le niveau de difficulté : c'est lui qui choisit le mandat. */
  niveau: number;
  /** Le nom de l'équipe, porté par la lettre comme destinataire. */
  equipe: string;
  /** Déjà rangé d'emblée (tests, aperçus). */
  range?: boolean;
}) {
  const cle = cleMemoire(gameId);
  const retenu = useSyncExternalStore(
    memoire.subscribe,
    () => memoire.lire(cle),
    () => "" as const,
  );
  const range = rangeInitial || retenu === "2";
  const mandat = lettreDeMission(niveau);

  // Rangé : une ligne, et de quoi rouvrir. Le mandat a dit ce qu'il avait à dire.
  if (range) {
    return (
      <section
        aria-label="Votre mandat"
        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-slate-400"
      >
        {/* L'objet commence déjà par « Votre mandat » : le préfixer d'un
            libellé le répétait mot pour mot. */}
        <span className="text-slate-300">📜 {mandat.objet}</span>
        <button
          type="button"
          onClick={() => memoire.retenir(cle, "1")}
          className="text-amber-300 underline-offset-4 hover:underline"
        >
          Relire
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Votre mandat" className="carte p-3 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-400">📜 Votre mandat</h2>
        <p className="text-xs text-slate-400">
          Ce que les associés vous confient pour cette partie.
        </p>
      </div>
      <div className={`mt-4 ${grilleDeCourriers(1)}`}>
        <CourrierRecommande code={mandat.code} destinataire={equipe} />
      </div>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => memoire.retenir(cle, "2")}
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
        >
          J&apos;ai pris note
        </button>
      </div>
    </section>
  );
}
