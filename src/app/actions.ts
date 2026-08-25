"use server";

import { redirect } from "next/navigation";
import { getOrCreateGuestUserId } from "@/lib/guest";
import { createSoloGame } from "@/services/game.service";

export async function startGameAction(): Promise<void> {
  const userId = await getOrCreateGuestUserId();
  const gameId = await createSoloGame(userId);
  redirect(`/arena/${gameId}`);
}
