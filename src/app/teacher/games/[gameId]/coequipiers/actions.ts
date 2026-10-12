"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { estUnMoment, type MomentDesPairs } from "@/config/pairs/criteres";
import {
  PairsRefusError,
  enregistrerLesNotesDEquipe,
  publierUnMoment,
  reglerLEvaluation,
} from "@/services/pairs.service";

/**
 * LES GESTES DE L'ENSEIGNANT SUR L'ÉVALUATION ENTRE COÉQUIPIERS.
 *
 * Chaque action relit la session : l'enseignant est celui du cookie signé. Le service ne
 * touche qu'à une partie de classe qu'il a créée ; une autre se lit comme absente. Les
 * refus repartent par un code dans l'adresse, que la page traduit.
 */

async function enseignant(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  return session.userId;
}

const page = (gameId: string) => `/teacher/games/${gameId}/coequipiers`;

async function ou<T>(gameId: string, geste: () => Promise<T>): Promise<T> {
  try {
    return await geste();
  } catch (e) {
    if (e instanceof PairsRefusError) redirect(`${page(gameId)}?refus=${e.raison}`);
    throw e;
  }
}

/** Activer, régler ou désactiver l'évaluation. */
export async function reglerLEvaluationAction(gameId: string, formData: FormData): Promise<void> {
  const teacherId = await enseignant();
  const nombre = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(",", "."));
  const { figes } = await ou(gameId, () =>
    reglerLEvaluation(teacherId, gameId, {
      active: formData.get("active") === "on",
      moments: formData.getAll("moments").map(String),
      criteresCoches: formData.getAll("criteres").map(String),
      criteresLibres: [String(formData.get("critereLibre1") ?? ""), String(formData.get("critereLibre2") ?? "")],
      autoEvaluation: formData.get("autoEvaluation") === "on",
      commentaire: formData.get("commentaire") === "on",
      borneBasse: nombre(formData.get("borneBasse")),
      borneHaute: nombre(formData.get("borneHaute")),
      bareme: nombre(formData.get("bareme")),
    }),
  );
  revalidatePath(page(gameId));
  revalidatePath(`/teacher/games/${gameId}`);
  redirect(`${page(gameId)}?fait=${figes ? "figes" : "regle"}`);
}

/** Publier un moment (les réponses se closent, chacun voit ses moyennes), ou retirer la publication. */
export async function publierMomentAction(gameId: string, moment: MomentDesPairs, publier: boolean): Promise<void> {
  const teacherId = await enseignant();
  if (!estUnMoment(moment)) redirect(`${page(gameId)}?refus=saisie`);
  await ou(gameId, () => publierUnMoment(teacherId, gameId, moment, publier));
  revalidatePath(page(gameId));
  redirect(`${page(gameId)}?fait=${publier ? "publie" : "retire"}#moment-${moment}`);
}

/** Les notes d'équipe d'un moment : une case par équipe, `note:<équipe>`. */
export async function notesDEquipeAction(gameId: string, formData: FormData): Promise<void> {
  const teacherId = await enseignant();
  const moment = formData.get("moment");
  if (!estUnMoment(moment)) redirect(`${page(gameId)}?refus=saisie`);
  const saisies: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    const m = /^note:([0-9a-f-]{36})$/i.exec(cle);
    if (m) saisies[m[1]!] = String(valeur);
  }
  await ou(gameId, () => enregistrerLesNotesDEquipe(teacherId, gameId, moment, saisies));
  revalidatePath(page(gameId));
  redirect(`${page(gameId)}?fait=notes#moment-${moment}`);
}
