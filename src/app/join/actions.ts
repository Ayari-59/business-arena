"use server";

import { redirect } from "next/navigation";
import { clearGuestCookie, getOrCreateGuestUserId } from "@/lib/guest";
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

export interface LibererState {
  error: string | null;
}

/**
 * « Ce n'est pas moi » : l'appareil redevient neutre et l'on repart de l'écran
 * d'entrée par code. Le geste appartient à l'élève, pas à l'enseignant : c'est
 * lui qui voit, en s'asseyant, le prénom de quelqu'un d'autre en haut de
 * l'écran. Rien n'est supprimé, l'équipe garde ses décisions.
 */
export async function libererLAppareilAction(
  _prev: LibererState,
  _formData: FormData,
): Promise<LibererState> {
  await clearGuestCookie();
  redirect("/join");
}
