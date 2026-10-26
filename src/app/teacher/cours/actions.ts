"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { cloreClasse, creerClasse, permettreLaCalculatrice } from "@/services/cours.service";

/**
 * LES GESTES DE L'ENSEIGNANT SUR SES CLASSES DU COURS. L'enseignant est celui de la
 * session ; le service filtre par ce créateur dans la requête même.
 */

async function enseignant(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  return session.userId;
}

export async function creerClasseAction(formData: FormData): Promise<void> {
  const enseignantId = await enseignant();
  const cree = await creerClasse({
    enseignantId,
    nom: String(formData.get("nom") ?? ""),
    entreprise: String(formData.get("entreprise") ?? "") || null,
  });
  if (!cree) redirect("/teacher/cours?refus=nom#nouvelle-classe");
  revalidatePath("/teacher/cours");
  redirect(`/teacher/cours/${cree.id}?creee=1`);
}

export async function cloreClasseAction(classeId: string, close: boolean): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await cloreClasse({ enseignantId, classeId, close }))) redirect("/teacher/cours?refus=introuvable");
  revalidatePath(`/teacher/cours/${classeId}`);
  redirect(`/teacher/cours/${classeId}?fait=${close ? "close" : "rouverte"}`);
}

export async function calculatriceAction(classeId: string, permise: boolean): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await permettreLaCalculatrice({ enseignantId, classeId, permise }))) redirect("/teacher/cours?refus=introuvable");
  revalidatePath(`/teacher/cours/${classeId}`);
  redirect(`/teacher/cours/${classeId}?fait=${permise ? "calculatrice" : "sans-calculatrice"}`);
}
