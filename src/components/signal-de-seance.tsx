"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * LE PILOTAGE PARLE AU MUR.
 *
 * L'enseignant clôt le tour sur son écran de pilotage ; la projection est un
 * AUTRE onglet, souvent sur le second écran, et elle n'en sait rien. Son
 * sondeur l'apprendrait — mais il s'arrête de lui-même quand toutes les
 * équipes ont rendu, c'est-à-dire exactement au moment où la clôture arrive,
 * et le mur resterait sur « 4 / 4 équipes ont validé » pendant que la classe
 * attend le classement.
 *
 * Les deux onglets sont dans le même navigateur : ils peuvent se parler
 * directement, sans passer par le serveur ni rien facturer. Le pilotage
 * annonce où en est la séance (le dernier tour clos, et s'il est révélé) à
 * chaque fois que cela change ; la projection se recharge quand l'annonce ne
 * correspond plus à ce qu'elle montre, et joue alors la révélation.
 *
 * Ce n'est pas le seul chemin, c'est le plus court : un vidéoprojecteur branché
 * sur une autre machine n'entend rien, et c'est le sondeur (`insistant`) qui
 * ramène la projection à l'heure. Rien ne dépend donc de ce canal pour être
 * juste ; il rend la salle immédiate.
 */

/** Où en est la séance, tel que le pilotage le voit. */
export interface EtatDeSeance {
  /** L'index du dernier tour clos, ou null si aucun ne l'est. */
  tourClos: number | null;
  /** Son classement est-il révélé aux élèves ? */
  revele: boolean;
}

const nomDuCanal = (gameId: string) => `ba-seance-${gameId}`;

/** Ouvre le canal de la partie, ou null là où le navigateur ne le connaît pas. */
function ouvrir(gameId: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(nomDuCanal(gameId));
  } catch {
    return null;
  }
}

/** Posé sur le pilotage : il annonce l'état de la séance aux autres onglets. */
export function SignalDeSeance({ gameId, tourClos, revele }: { gameId: string } & EtatDeSeance) {
  useEffect(() => {
    const canal = ouvrir(gameId);
    if (!canal) return;
    try {
      canal.postMessage({ tourClos, revele } satisfies EtatDeSeance);
    } catch {
      // Un onglet en train de se fermer : rien à faire.
    }
    return () => canal.close();
  }, [gameId, tourClos, revele]);
  return null;
}

/** Posé sur la projection : elle se recharge quand l'annonce la dépasse. */
export function EchoDeSeance({ gameId, tourClos, revele }: { gameId: string } & EtatDeSeance) {
  const router = useRouter();
  useEffect(() => {
    const canal = ouvrir(gameId);
    if (!canal) return;
    canal.onmessage = (evenement: MessageEvent) => {
      const dit = evenement.data as Partial<EtatDeSeance> | null;
      if (!dit || typeof dit !== "object") return;
      if (dit.tourClos !== tourClos || dit.revele !== revele) router.refresh();
    };
    return () => {
      canal.onmessage = null;
      canal.close();
    };
  }, [gameId, tourClos, revele, router]);
  return null;
}
