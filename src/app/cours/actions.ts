"use server";

import { redirect } from "next/navigation";
import { getGuestUserId, getOrCreateGuestUserId } from "@/lib/guest";
import {
  enregistrerProgression,
  quitterClasse,
  rejoindreClasse,
  type ProgressionEnvoyee,
} from "@/services/cours.service";

/**
 * LES GESTES DE L'ÉLÈVE DANS UNE CLASSE DU COURS.
 *
 * L'élève est celui du cookie d'invité, jamais un champ envoyé : il ne peut rejoindre
 * qu'en son nom et n'écrire que sa propre progression (services/cours.service.ts borne
 * le reste). Les refus repartent par un code dans l'adresse, jamais par un texte.
 */

export async function rejoindreClasseAction(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const userId = await getOrCreateGuestUserId();
  const r = await rejoindreClasse(userId, code, String(formData.get("nom") ?? ""));
  if (!r.ok) redirect(`/cours/rejoindre?code=${encodeURIComponent(code)}&refus=${r.refus}`);
  redirect("/cours?classe=rejointe");
}

export async function quitterClasseAction(): Promise<void> {
  const userId = await getGuestUserId();
  if (userId) await quitterClasse(userId);
  redirect("/cours?classe=quittee");
}

/** La progression d'un chapitre, envoyée par le navigateur à chaque étape. Sans classe : rien. */
export async function enregistrerProgressionAction(envoi: ProgressionEnvoyee): Promise<boolean> {
  const userId = await getGuestUserId();
  if (!userId) return false;
  try {
    return await enregistrerProgression(userId, envoi);
  } catch (e) {
    console.error("[enregistrerProgressionAction]", e);
    return false;
  }
}
