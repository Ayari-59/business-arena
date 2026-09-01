"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 30_000;

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
    let timer: ReturnType<typeof setInterval> | null = null;
    let fetching = false;

    async function poll() {
      if (document.hidden || fetching) return;
      fetching = true;
      try {
        const res = await fetch(`/api/games/${gameId}/${endpoint}`);
        if (!res.ok) return;
        const data = await res.json();

        const prev = stateRef.current;
        let changed = false;

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
      } catch {
        // network error — silent, retry next interval
      } finally {
        fetching = false;
      }
    }

    function onVisibilityChange() {
      if (!document.hidden) poll();
    }

    timer = setInterval(poll, INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [gameId, endpoint, router]);

  return null;
}
