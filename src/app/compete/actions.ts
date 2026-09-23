"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getOrCreateGuestUserId, setGuestCookie } from "@/lib/guest";
import { joinCompetition, reprendreSonIdentite } from "@/services/competition.service";

/**
 * L'adresse d'origine, pour compter les tentatives de reprise. Celle ajoutée
 * par le proxy de confiance, pas celle qu'un client peut écrire lui-même.
 */
async function adresseOrigine(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
}

export interface JoinCompetitionState {
  error: string | null;
  /** Le joueur est déjà inscrit : on le dit, avec le nom de son équipe, au lieu de rediriger. */
  dejaInscrit: { competitionId: string; teamLabel: string } | null;
}

export interface RepriseState {
  error: string | null;
}

/**
 * REPRENDRE SON ÉQUIPE AVEC SON CODE PERSONNEL.
 *
 * Le code reconnu, l'appareil reçoit l'identité de son propriétaire — celle
 * qu'il avait à l'inscription, avec son équipe, ses décisions et son historique
 * — puis l'élève arrive sur la page de son concours.
 */
export async function reprendreSonEquipeAction(
  _prev: RepriseState,
  formData: FormData,
): Promise<RepriseState> {
  const code = String(formData.get("code") ?? "");
  const resultat = await reprendreSonIdentite({ code, ip: await adresseOrigine() });
  if ("error" in resultat) return { error: resultat.error };
  await setGuestCookie(resultat.userId);
  redirect(`/compete/${resultat.competitionId}`);
}

export async function joinCompetitionAction(
  _prev: JoinCompetitionState,
  formData: FormData,
): Promise<JoinCompetitionState> {
  const code = String(formData.get("code") ?? "").trim();
  const teamLabel = String(formData.get("teamLabel") ?? "").trim();
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  if (code.length < 4) return { error: "Saisissez le code du concours.", dejaInscrit: null };
  const userId = await getOrCreateGuestUserId();
  const result = await joinCompetition({ code, userId, teamLabel, pseudo });
  if ("error" in result) return { error: result.error, dejaInscrit: null };
  if (result.alreadyMember) {
    return {
      error: null,
      dejaInscrit: { competitionId: result.competitionId, teamLabel: result.alreadyMember },
    };
  }
  redirect(`/compete/${result.competitionId}`);
}
