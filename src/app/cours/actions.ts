"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGuestUserId, getOrCreateGuestUserId, setGuestCookie } from "@/lib/guest";
import { codeFaux, gardeDesCodes, minutesDuRefus } from "@/lib/garde-des-codes";
import { REFUS_DE_LA_REPRISE_EN_CLASSE } from "@/config/reprise";
import { reprendreProfil } from "@/services/cohortes.service";
import { adresseDOrigine } from "@/lib/garde-des-codes";
import {
  classeDeLEleve,
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

export interface RepriseEnClasseState {
  error: string | null;
}

/**
 * REPRENDRE SA PLACE DANS SA CLASSE SUR CET APPAREIL (décision du propriétaire du 11 novembre 2026 ;
 * audit UX du même jour, P1-5). Sur un autre appareil, l'élève qui rejoignait de nouveau sa classe
 * devenait un second élève, et l'enseignant voyait deux « Léa ». Le code de reprise est celui des
 * épisodes (services/cohortes.service.ts, `reprendreProfil`, avec sa garde des tentatives) : il rend à
 * l'appareil l'identité de l'élève, sa classe et sa progression. Seul le code d'un élève de classe
 * passe ; un autre est refusé comme un code inconnu.
 */
export async function reprendreSaPlaceAction(_prev: RepriseEnClasseState, formData: FormData): Promise<RepriseEnClasseState> {
  const r = await reprendreProfil({
    code: String(formData.get("code") ?? ""),
    ip: await adresseDOrigine(),
    inconnu: REFUS_DE_LA_REPRISE_EN_CLASSE,
    porteur: async (userId) => (await classeDeLEleve(userId)) !== null,
  });
  if (!r.ok) return { error: r.erreur };
  await setGuestCookie(r.userId);
  revalidatePath("/cours");
  redirect("/cours?classe=reprise");
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
