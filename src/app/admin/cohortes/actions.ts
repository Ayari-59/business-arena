"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session-admin";
import { creerCohorte, rattacherCohorte, renouvelerCleAnimateur } from "@/services/cohortes.service";

/** Créer une cohorte depuis l'administration ; on revient sur la liste, la nouvelle en tête. */
export async function creerCohorteAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) redirect("/admin/cohortes?erreur=nom");
  // L'organisation de l'animateur : sous licence, elle ouvre tous les épisodes aux membres.
  const organisation = String(formData.get("organisation") ?? "").trim() || null;
  const c = await creerCohorte(nom, organisation);
  revalidatePath("/admin/cohortes");
  redirect(`/admin/cohortes?creee=${encodeURIComponent(c.code)}`);
}

/** Remplacer le lien de l'animateur d'une cohorte, quand l'ancien a circulé. */
export async function renouvelerCleAnimateurAction(cohorteId: string): Promise<void> {
  await requireAdminSession();
  await renouvelerCleAnimateur(cohorteId);
  revalidatePath("/admin/cohortes");
  redirect("/admin/cohortes?renouvelee=1");
}

/** Rattacher une cohorte à l'organisation de son animateur (ou l'en détacher). */
export async function rattacherCohorteAction(cohorteId: string, formData: FormData): Promise<void> {
  await requireAdminSession();
  const organisation = String(formData.get("organisation") ?? "").trim() || null;
  await rattacherCohorte(cohorteId, organisation);
  revalidatePath("/admin/cohortes");
  redirect("/admin/cohortes?rattachee=1");
}
