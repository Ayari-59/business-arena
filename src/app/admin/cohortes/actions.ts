"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session-admin";
import { creerCohorte, renouvelerCleAnimateur } from "@/services/cohortes.service";

/** Créer une cohorte depuis l'administration ; on revient sur la liste, la nouvelle en tête. */
export async function creerCohorteAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) redirect("/admin/cohortes?erreur=nom");
  const c = await creerCohorte(nom);
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
