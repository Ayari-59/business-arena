"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getGuestUserId, setGuestCookie } from "@/lib/guest";
import { regenererCodeDeReprise, reprendreSaPlace } from "@/services/reprise.service";

/**
 * L'adresse d'origine, pour compter les tentatives. Celle ajoutée par le proxy
 * de confiance, pas celle qu'un client peut écrire lui-même. Même lecture que
 * pour les concours : deux façons de lire l'adresse auraient fini par compter
 * deux populations différentes.
 */
async function adresseOrigine(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
}

export interface RepriseDePlaceState {
  error: string | null;
}

/**
 * REPRENDRE SA PLACE AVEC SON CODE PERSONNEL.
 *
 * Le code reconnu, l'appareil reçoit l'identité de son propriétaire — son
 * équipe, ses décisions, son historique — et l'élève arrive dans son arène.
 *
 * Rien n'est montré AVANT la vérification, et c'est volontaire : une page qui
 * afficherait « vous reprenez la place de Léa » sur un simple paramètre
 * d'adresse dirait, sans rien compter, quels codes existent. On vérifie, on
 * compte l'échec, et c'est l'arène qui annonce ensuite sous quel nom on joue —
 * avec son « ce n'est pas moi » à côté.
 */
export async function reprendreSaPlaceAction(
  _prev: RepriseDePlaceState,
  formData: FormData,
): Promise<RepriseDePlaceState> {
  const code = String(formData.get("code") ?? "");
  const resultat = await reprendreSaPlace({ code, ip: await adresseOrigine() });
  if ("error" in resultat) return { error: resultat.error };
  await setGuestCookie(resultat.userId);
  redirect(`/arena/${resultat.gameId}`);
}

export interface RenouvellementState {
  error: string | null;
}

/**
 * EN TIRER UN AUTRE, PARCE QUE QUELQU'UN L'A VU.
 *
 * Un code se lit par-dessus l'épaule ou se photographie sur un écran resté
 * ouvert. Le geste appartient à l'élève : sans lui, le seul recours serait de
 * prévenir l'enseignant, c'est-à-dire d'avouer. L'ancien code cesse aussitôt
 * de fonctionner.
 */
export async function renouvelerSonCodeAction(
  _prev: RenouvellementState,
  formData: FormData,
): Promise<RenouvellementState> {
  const gameId = String(formData.get("gameId") ?? "");
  // C'est le cookie qui dit qui demande, jamais le formulaire : un identifiant
  // posté serait celui de n'importe qui, et renouveler le code d'un camarade
  // le mettrait dehors.
  const userId = await getGuestUserId();
  if (!gameId || !userId) return { error: "Impossible de renouveler ce code." };
  await regenererCodeDeReprise(gameId, userId);
  return { error: null };
}
