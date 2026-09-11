"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Cadence de base et plafond du backoff. Un onglet d'arène laissé ouvert en
// classe interrogeait le serveur toutes les 30 s en continu — autant
// d'invocations de fonction facturées pour, la plupart du temps, « rien de
// neuf ». On part à 60 s et on RALENTIT progressivement (×1,5 jusqu'à 3 min)
// tant que rien ne change ; on revient à la cadence rapide dès qu'un changement
// survient ou que l'utilisateur revient sur l'onglet.
const BASE_MS = 60_000;
const MAX_MS = 180_000;

interface Props {
  gameId: string;
  currentRound: number;
  roundStatus: string;
  endpoint: "round-status" | "submissions";
  submittedCount?: number;
}

export function RoundStatusPoller({
  gameId,
  currentRound,
  roundStatus,
  endpoint,
  submittedCount,
}: Props) {
  const router = useRouter();
  const stateRef = useRef({ currentRound, roundStatus, submittedCount });

  useEffect(() => {
    stateRef.current = { currentRound, roundStatus, submittedCount };
  }, [currentRound, roundStatus, submittedCount]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let fetching = false;
    let delay = BASE_MS;
    let stopped = false;

    const planifier = () => {
      if (stopped) return;
      timer = setTimeout(poll, delay);
    };

    async function poll() {
      if (stopped) return;
      // Onglet en arrière-plan : on ne sonde pas (et on ne gaspille pas), on
      // reprogramme simplement — le retour au premier plan relancera vite.
      if (document.hidden || fetching) {
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
          if (
            endpoint === "submissions" &&
            typeof data.submittedCount === "number" &&
            data.submittedCount !== prev.submittedCount
          ) {
            changed = true;
          }

          if (changed) router.refresh();

          // Côté prof : une fois que TOUTES les équipes humaines ont rendu,
          // le compteur ne bougera plus jusqu'à ce que le prof clôture le tour
          // (ce qui recharge la page et remonte le poller). Inutile de continuer
          // à sonder — on arrête. Le retour sur l'onglet relancera un sondage.
          if (
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
      // Backoff : on repart vif quand ça bouge, on ralentit sinon.
      delay = changed ? BASE_MS : Math.min(MAX_MS, Math.round(delay * 1.5));
      planifier();
    }

    function onVisibilityChange() {
      if (document.hidden) return;
      // Retour sur l'onglet : cadence rapide et sondage immédiat.
      delay = BASE_MS;
      if (timer) clearTimeout(timer);
      poll();
    }

    planifier();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [gameId, endpoint, router]);

  return null;
}
