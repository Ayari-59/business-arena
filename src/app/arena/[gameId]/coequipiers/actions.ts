"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { estUnMoment } from "@/config/pairs/criteres";
import { PairsRefusError, enregistrerMesReponses, type SaisieDesReponses } from "@/services/pairs.service";

/**
 * L'ÉTUDIANT ENVOIE SON ÉVALUATION (ou la modifie, tant que le moment est ouvert).
 *
 * Qui évalue se lit du cookie signé, jamais d'un champ du formulaire ; le service vérifie
 * qu'il est membre, que le moment est ouvert et que chaque coéquipier actuel reçoit une
 * note de 1 à 5 sur chaque critère. Les champs portent leur cible dans leur nom :
 * `n:<coéquipier>:<critère>` pour une note, `c:<coéquipier>` pour un commentaire.
 */
export async function enregistrerMesReponsesAction(gameId: string, formData: FormData): Promise<void> {
  const userId = await getGuestUserId();
  if (!userId) redirect(`/arena/${gameId}`);
  const moment = formData.get("moment");
  const page = `/arena/${gameId}/coequipiers`;
  if (!estUnMoment(moment)) redirect(`${page}?refus=saisie`);
  const saisie: SaisieDesReponses = {};
  for (const [cle, valeur] of formData.entries()) {
    const note = /^n:([0-9a-f-]{36}):([a-z0-9-]+)$/i.exec(cle);
    if (note) {
      (saisie[note[1]!] ??= { notes: {} }).notes[note[2]!] = String(valeur);
      continue;
    }
    const mot = /^c:([0-9a-f-]{36})$/i.exec(cle);
    if (mot) (saisie[mot[1]!] ??= { notes: {} }).commentaire = String(valeur);
  }
  try {
    await enregistrerMesReponses(gameId, userId, moment, saisie);
  } catch (e) {
    if (e instanceof PairsRefusError) redirect(`${page}?moment=${moment}&refus=${e.raison}`);
    throw e;
  }
  revalidatePath(`/arena/${gameId}`);
  redirect(`${page}?moment=${moment}&fait=envoyee`);
}
