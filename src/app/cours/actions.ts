"use server";

import { redirect } from "next/navigation";
import { getGuestUserId, getOrCreateGuestUserId } from "@/lib/guest";
import { codeFaux, gardeDesCodes, minutesDuRefus } from "@/lib/garde-des-codes";
import {
  classeParCode,
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
  const nom = String(formData.get("nom") ?? "");
  // Le prénom saisi revient dans son champ après un refus (audit UX du 29 octobre 2026, P1-3).
  const suite = nom.trim() ? `&nom=${encodeURIComponent(nom.trim())}` : "";
  const refuser = (refus: string, attente = "") =>
    redirect(`/cours/rejoindre?code=${encodeURIComponent(code)}&refus=${refus}${attente}${suite}`);
  // LE CODE D'ABORD, L'INVITÉ ENSUITE (audit, P2-3) : `getOrCreateGuestUserId` insère
  // un compte dès qu'aucun cookie n'est présent ; le faire avant de vérifier le code
  // laissait une ligne par requête, sans limite. Et un code inconnu compte un échec
  // pour l'adresse (lib/garde-des-codes.ts).
  // Un code juste passe toujours, plafond atteint ou non : le code est cherché d'abord.
  const garde = await gardeDesCodes();
  if (!nom.trim()) refuser("nom");
  if (!(await classeParCode(code))) {
    // TROP D'ESSAIS DEPUIS CETTE ADRESSE (audit UX, P1-4) : le dire, avec l'attente.
    const trop = await codeFaux(garde);
    if (trop) refuser("trop", `&attente=${minutesDuRefus(trop)}`);
    refuser("inconnu");
  }
  const userId = await getOrCreateGuestUserId();
  const r = await rejoindreClasse(userId, code, nom);
  if (!r.ok) refuser(r.refus);
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
