"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  CohorteRefuseeError,
  cloreCohorte,
  creerCohorteDeLEnseignant,
  renommerCohorte,
  renouvelerCodeDeCohorte,
} from "@/services/cohortes.service";

/**
 * LES GESTES DE L'ENSEIGNANT SUR SES COHORTES.
 *
 * Chaque action relit la session : l'enseignant est celui du cookie signé, jamais un
 * champ du formulaire. Le service filtre par ce créateur dans la requête même ; une
 * action appelée avec l'identifiant de la cohorte d'un autre ne touche donc à rien,
 * et revient sur la liste avec le refus « introuvable ».
 *
 * Les refus repartent par un CODE dans l'adresse (config/cohortes.ts dit la phrase) :
 * rien de ce que l'adresse porte ne s'affiche tel quel.
 */

async function enseignant(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  return session.userId;
}

const introuvable = (): never => redirect("/teacher/cohortes?refus=introuvable");

/** Créer une cohorte : un nom, des épisodes cochés. La licence se vérifie dans le service. */
export async function creerCohorteAction(formData: FormData): Promise<void> {
  const enseignantId = await enseignant();
  const episodes = formData.getAll("episodes").map(String);
  let id: string;
  try {
    ({ id } = await creerCohorteDeLEnseignant({
      enseignantId,
      nom: String(formData.get("nom") ?? ""),
      episodes,
    }));
  } catch (e) {
    if (!(e instanceof CohorteRefuseeError)) throw e;
    // On retrouve le formulaire ouvert, avec le premier épisode qu'on avait coché.
    const premier = episodes[0] ? `&episode=${encodeURIComponent(episodes[0])}` : "";
    redirect(`/teacher/cohortes?refus=${e.raison}${premier}#nouvelle-cohorte`);
  }
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${id}?creee=1`);
}

export async function renommerCohorteAction(cohorteId: string, formData: FormData): Promise<void> {
  const enseignantId = await enseignant();
  const ok = await renommerCohorte({
    enseignantId,
    cohorteId,
    nom: String(formData.get("nom") ?? ""),
  });
  if (!ok) introuvable();
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${cohorteId}?fait=renommee`);
}

/** Clore : plus de nouveaux participants ; les parties commencées se terminent. */
export async function cloreCohorteAction(cohorteId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await cloreCohorte({ enseignantId, cohorteId, close: true }))) introuvable();
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${cohorteId}?fait=close`);
}

export async function rouvrirCohorteAction(cohorteId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await cloreCohorte({ enseignantId, cohorteId, close: false }))) introuvable();
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${cohorteId}?fait=rouverte`);
}

/** Un nouveau code : l'ancien n'ouvre plus rien, les membres restent membres. */
export async function renouvelerCodeDeCohorteAction(cohorteId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await renouvelerCodeDeCohorte({ enseignantId, cohorteId }))) introuvable();
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${cohorteId}?fait=code`);
}
