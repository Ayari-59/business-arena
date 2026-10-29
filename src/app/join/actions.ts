"use server";

import { redirect } from "next/navigation";
import { clearGuestCookie, getOrCreateGuestUserId } from "@/lib/guest";
import { CODE_DE_PARTIE_INCONNU, joinGameByCode, refusDeRejoindre } from "@/services/game.service";
import { ouRejoindre } from "@/services/rejoindre.service";
import { normaliserRangDEquipe } from "@/lib/code-de-partie";
import { gardeDesCodes } from "@/lib/garde-des-codes";

export interface JoinState {
  error: string | null;
}

export async function joinGameAction(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const code = String(formData.get("code") ?? "").trim();
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  // Le carton de table, s'il y en avait un : un rang d'équipe que le champ
  // caché du formulaire a transporté depuis l'adresse scannée.
  const equipe = normaliserRangDEquipe(String(formData.get("equipe") ?? ""));
  if (code.length < 4) return { error: "Saisissez le code donné par votre enseignant." };
  // LE CODE D'ABORD, L'INVITÉ ENSUITE. `getOrCreateGuestUserId` insère dans
  // `users` dès qu'aucun cookie valide n'est présent : le faire avant de
  // vérifier le code laissait une ligne par code faux, sans limite.
  // UNE ADRESSE QUI ESSAIE TROP DE CODES INCONNUS ATTEND (lib/garde-des-codes.ts).
  const garde = await gardeDesCodes();
  if (garde.refus) return { error: garde.refus };
  const refus = await refusDeRejoindre(code);
  // Pas une partie : peut-être un code de classe du cours, de cohorte, de concours ou
  // d'examen, tapé dans la seule porte de la barre. On renvoie l'élève à la bonne page.
  if (refus === CODE_DE_PARTIE_INCONNU) {
    const ailleurs = await ouRejoindre(code);
    if (ailleurs) redirect(ailleurs);
    await garde.echec();
  }
  if (refus) return { error: refus };
  const userId = await getOrCreateGuestUserId();
  const result = await joinGameByCode({ code, userId, pseudo, equipe });
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
