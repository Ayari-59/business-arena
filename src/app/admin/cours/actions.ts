"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session-admin";
import { attribuerALEnseignant, attribuerALEtablissement } from "@/services/attributions.service";

/**
 * LES PARCOURS QUE L'ADMIN ATTRIBUE (décision du propriétaire, novembre 2026 ; migration 0056).
 * Le formulaire envoie la liste entière : elle remplace la précédente, et une liste vide efface
 * la restriction (l'offre seule décide, ou la liste de l'établissement pour un enseignant).
 */
const lesParcours = (formData: FormData) => formData.getAll("parcours").map(String);

export async function attribuerALEtablissementAction(organizationId: string, formData: FormData): Promise<void> {
  await requireAdminSession();
  await attribuerALEtablissement(organizationId, lesParcours(formData));
  revalidatePath("/admin/cours");
  redirect(`/admin/cours?fait=etablissement#etablissement-${organizationId}`);
}

export async function attribuerALEnseignantAction(organizationId: string, userId: string, formData: FormData): Promise<void> {
  await requireAdminSession();
  await attribuerALEnseignant(userId, lesParcours(formData));
  revalidatePath("/admin/cours");
  redirect(`/admin/cours?fait=enseignant#etablissement-${organizationId}`);
}
