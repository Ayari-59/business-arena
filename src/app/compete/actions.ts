"use server";

import { redirect } from "next/navigation";
import { getOrCreateGuestUserId } from "@/lib/guest";
import { joinCompetition } from "@/services/competition.service";

export interface JoinCompetitionState {
  error: string | null;
}

export async function joinCompetitionAction(
  _prev: JoinCompetitionState,
  formData: FormData,
): Promise<JoinCompetitionState> {
  const code = String(formData.get("code") ?? "").trim();
  const teamLabel = String(formData.get("teamLabel") ?? "").trim();
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  if (code.length < 4) return { error: "Saisissez le code du concours." };
  const userId = await getOrCreateGuestUserId();
  const result = await joinCompetition({ code, userId, teamLabel, pseudo });
  if ("error" in result) return { error: result.error };
  redirect(`/compete/${result.competitionId}`);
}
