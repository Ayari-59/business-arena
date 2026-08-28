"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  createEstablishment,
  createInvite,
  deactivateInvite,
  requirePlatformAdmin,
  updatePlatformConfig,
} from "@/services/admin.service";
import { seedDemoWorld } from "@/services/demo.service";
import { deleteOrgLicence, setOrgLicence } from "@/services/licence.service";

async function requireAdminSession(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  await requirePlatformAdmin(session.userId);
  return session.userId;
}

export async function createEstablishmentAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  await createEstablishment({ adminId, name });
  revalidatePath("/admin");
}

export async function updatePlatformConfigAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  await updatePlatformConfig(adminId, {
    allowPublicPlay: formData.get("allowPublicPlay") === "on",
    allowSelfServiceTeachers: formData.get("allowSelfServiceTeachers") === "on",
    announcement: String(formData.get("announcement") ?? "").trim(),
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function newAdminInviteAction(organizationId: string): Promise<void> {
  const adminId = await requireAdminSession();
  await createInvite({ organizationId, role: "org_admin", createdBy: adminId });
  revalidatePath("/admin");
}

export async function deactivateAdminInviteAction(
  inviteId: string,
  organizationId: string,
): Promise<void> {
  await requireAdminSession();
  await deactivateInvite({ inviteId, organizationId });
  revalidatePath("/admin");
}

export async function seedDemoAction(): Promise<void> {
  await requireAdminSession();
  await seedDemoWorld();
  revalidatePath("/admin");
  revalidatePath("/teacher/login");
}

/**
 * Enregistre les termes vendus à un établissement.
 *
 * Le montant est saisi en euros et rangé en centimes : un prix stocké en
 * flottant finit toujours par afficher 89,99999. Il est purement documentaire,
 * le produit n'encaisse rien.
 */
export async function setLicenceAction(
  organizationId: string,
  formData: FormData,
): Promise<void> {
  const adminId = await requireAdminSession();
  const texte = (champ: string) => String(formData.get(champ) ?? "").trim();
  const euros = Number(texte("amount").replace(",", "."));
  const plafond = Number(texte("maxTeachers"));

  await setOrgLicence({
    adminId,
    organizationId,
    label: texte("label"),
    startsAt: new Date(texte("startsAt")),
    endsAt: new Date(texte("endsAt")),
    // Champ laissé vide = pas de plafond : la période seule s'applique.
    maxTeachers: texte("maxTeachers") === "" || !Number.isFinite(plafond) ? null : plafond,
    reference: texte("reference") || null,
    amountCents: Number.isFinite(euros) && texte("amount") !== "" ? Math.round(euros * 100) : null,
  });
  revalidatePath("/admin");
}

export async function deleteLicenceAction(licenceId: string): Promise<void> {
  await requireAdminSession();
  await deleteOrgLicence(licenceId);
  revalidatePath("/admin");
}
