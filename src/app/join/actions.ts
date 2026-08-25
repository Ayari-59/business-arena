"use server";

import { redirect } from "next/navigation";
import { getOrCreateGuestUserId } from "@/lib/guest";
import { joinGameByCode } from "@/services/game.service";

export interface JoinState {
  error: string | null;
}

export async function joinGameAction(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const code = String(formData.get("code") ?? "").trim();
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  if (code.length < 4) return { error: "Saisissez le code donné par votre enseignant." };
  const userId = await getOrCreateGuestUserId();
  const result = await joinGameByCode({ code, userId, pseudo });
  if ("error" in result) return { error: result.error };
  redirect(`/arena/${result.gameId}`);
}
