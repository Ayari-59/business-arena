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
 * IL ARRIVE PLIÉ. Première version : la lettre dépliée, un bouton pour la
 * ranger. Mieux que rien, mais le premier écran portait quand même trois
 * textes d'un coup, et c'est deux de trop — on n'en lisait plus aucun. Le
 * mandat se présente donc comme UNE LIGNE, qui nomme ce qu'on vous confie et
 * propose de lire. Qui veut le détail l'ouvre ; qui veut décider n'a pas à le
 * traverser.
 *
 * Ce n'est pas une mise au placard : la ligne porte l'objet du mandat, donc
 * elle répond déjà à « qui m'a demandé de décider », qui était toute la raison
 * d'être de cette lettre. Le reste est l'argumentaire, et l'argumentaire attend
 * qu'on le demande.
 *
 * L'APPAREIL S'EN SOUVIENT, par la mémoire de lecture — vive d'abord, stockage
 * ensuite —, si bien qu'un rafraîchissement ne remet pas le mur de texte, et
 * qu'un navigateur qui refuse d'écrire ne rend pas le bouton inerte.
 */
function cleMemoire(gameId: string): string {
  return `mandat:${gameId}`;
}

/**
 * "" jamais touché · "1" ouvert · "2" replié après lecture.
 *
 * LE DÉFAUT EST PLIÉ : sans geste de l'élève, on en reste à la ligne. Les deux
 * états retenus sont donc deux gestes, jamais un retour au néant — la mémoire
 * garde ce qui a été fait, pas ce qui a été défait.
 */
const memoire = creerMemoireDeLecture(["1", "2"] as const);

export function MandatDeLEquipe({
  gameId,
  niveau,
  equipe,
  ouvert: ouvertInitial = false,
}: {
  gameId: string;
  /** Le niveau de difficulté : c'est lui qui choisit le mandat. */
  niveau: number;
  /** Le nom de l'équipe, porté par la lettre comme destinataire. */
  equipe: string;
  /** Déjà déplié d'emblée (tests, aperçus). */
  ouvert?: boolean;
}) {
  const cle = cleMemoire(gameId);
  const retenu = useSyncExternalStore(
    memoire.subscribe,
    () => memoire.lire(cle),
    () => "" as const,
  );
  const ouvert = ouvertInitial || retenu === "1";
  const mandat = lettreDeMission(niveau);

  // Plié : une ligne, l'objet du mandat, et de quoi l'ouvrir. C'est l'état
  // d'arrivée, et celui où l'on revient une fois la lettre lue.
  if (!ouvert) {
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
          {retenu === "2" ? "Relire" : "Lire"}
        </button>
      </section>
    );
  }

  /*
   * PAS DE CARTE AUTOUR DE LA LETTRE.
   *
   * La première version encadrait le mandat d'une carte titrée « 📜 Votre
   * mandat · Ce que les associés vous confient ». Mais la lettre porte déjà son
   * propre en-tête — « Note interne · Les associés », « Objet : Votre mandat » —
   * et sa propre matière : c'était un bloc dans un bloc, un titre sur un titre,
   * et un pavé de plus sur l'écran d'ouverture, là où trois textes se suivent
   * déjà (le mandat, la situation de l'entreprise, son contexte).
   *
   * La lettre se suffit. Il ne reste autour d'elle que le geste qui la range.
   */
  return (
    <section aria-label="Votre mandat" className={grilleDeCourriers(1)}>
      <CourrierRecommande code={mandat.code} destinataire={equipe} />
      <div className="flex justify-center">
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
