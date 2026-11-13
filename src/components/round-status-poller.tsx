"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { prochainDelai, CADENCE_DE_SEANCE_MS } from "@/lib/cadence-du-sondage";

// LA CADENCE vit dans `lib/cadence-du-sondage.ts` : 12 s en séance, sans recul,
// tant qu'une page attend une validation, une clôture ou une révélation ; le
// recul de 60 s à 3 min ne revient que pour un onglet oublié ouvert, quand plus
// rien n'a bougé depuis une demi-heure. Un onglet caché ne sonde pas.

interface Props {
  gameId: string;
  currentRound: number;
  roundStatus: string;
  endpoint: "round-status" | "submissions";
  submittedCount?: number;
  /**
   * LE MUR DE LA CLASSE NE CESSE PAS DE REGARDER. Quand toutes les équipes ont
   * rendu, le sondeur s'arrête : c'est juste, pour l'écran de pilotage, qui se
   * recharge de lui-même en clôturant le tour. La projection, elle, est un
   * autre onglet : elle resterait sur « 4 / 4 équipes ont validé » alors que le
   * classement est tombé. Elle continue donc à sonder, en ralentissant.
   */
  insistant?: boolean;
  /**
   * Le dernier tour dont le classement est révélé, quand la page le connaît.
   * Sans lui, le premier sondage sert de point de départ : une révélation qui
   * tombe ensuite recharge la page de l'élève, qui voit alors son rang.
   */
  dernierTourRevele?: number | null;
}

export function RoundStatusPoller({
  gameId,
  currentRound,
  roundStatus,
  endpoint,
  submittedCount,
  insistant = false,
  dernierTourRevele,
}: Props) {
  const router = useRouter();
  const stateRef = useRef({ currentRound, roundStatus, submittedCount, dernierTourRevele });

  useEffect(() => {
    stateRef.current = { currentRound, roundStatus, submittedCount, dernierTourRevele };
  }, [currentRound, roundStatus, submittedCount, dernierTourRevele]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let fetching = false;
    let delay = CADENCE_DE_SEANCE_MS;
    let stopped = false;
    // Le dernier mouvement : l'ouverture de la page, un changement, un retour
    // sur l'onglet. Une demi-heure sans rien, et la séance est finie.
    let dernierMouvement = Date.now();
    // Le dernier tour révélé vu au sondage précédent, quand la page ne l'a pas dit.
    let reveleVu: number | null | undefined = stateRef.current.dernierTourRevele;

    const planifier = () => {
      if (stopped) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(poll, delay);
    };

    async function poll() {
      timer = null;
      if (stopped) return;
      // Onglet en arrière-plan : on ne sonde pas, et on ne reprogramme rien.
      // C'est le retour sur l'onglet qui relance le sondage.
      if (document.hidden) return;
      if (fetching) {
        planifier();
        return;
      }
      fetching = true;
      let changed = false;
      try {
        const res = await fetch(`/api/games/${gameId}/${endpoint}`);
        if (res.ok) {
          const data = await res.json();
          const prev = stateRef.current;

          if (data.currentRound !== prev.currentRound) changed = true;
          if (data.roundStatus !== prev.roundStatus) changed = true;
          // Le compte des équipes qui ont rendu vient des DEUX endpoints : le
          // tableau de l'enseignant s'en sert pour savoir qui il attend, et
          // l'arène pour dire à l'élève où en est la classe. Dans les deux cas
          // il bouge sans que le tour change.
          if (
            typeof data.submittedCount === "number" &&
            data.submittedCount !== prev.submittedCount
          ) {
            changed = true;
          }
          // La révélation du classement ne change ni le tour ni son statut :
          // l'élève qui attend son rang doit la voir arriver aussi.
          if (data.dernierTourRevele !== undefined) {
            if (reveleVu !== undefined && data.dernierTourRevele !== reveleVu) changed = true;
            reveleVu = data.dernierTourRevele;
          }

          if (changed) router.refresh();

          // Côté prof : une fois que TOUTES les équipes humaines ont rendu,
          // le compteur ne bougera plus jusqu'à ce que le prof clôture le tour
          // (ce qui recharge la page et remonte le poller). Inutile de continuer
          // à sonder — on arrête. Le retour sur l'onglet relancera un sondage.
          if (
            !insistant &&
            endpoint === "submissions" &&
            typeof data.submittedCount === "number" &&
            typeof data.totalHumanTeams === "number" &&
            data.totalHumanTeams > 0 &&
            data.submittedCount >= data.totalHumanTeams
          ) {
            return; // `finally` remet `fetching` à false ; pas de reprogrammation
          }
        }
      } catch {
        // erreur réseau — silencieux, on retentera au prochain tour
      } finally {
        fetching = false;
      }
      if (changed) dernierMouvement = Date.now();
      delay = prochainDelai({
        delai: delay,
        change: changed,
        depuisLeDernierMouvementMs: Date.now() - dernierMouvement,
      });
      planifier();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        // Onglet caché : on coupe le minuteur, rien ne part.
        if (timer) clearTimeout(timer);
        timer = null;
        return;
      }
      // Retour sur l'onglet : la séance reprend, sondage immédiat.
      dernierMouvement = Date.now();
      delay = CADENCE_DE_SEANCE_MS;
      if (timer) clearTimeout(timer);
      timer = null;
      poll();
    }

    planifier();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [gameId, endpoint, router, insistant]);

  return null;
}
