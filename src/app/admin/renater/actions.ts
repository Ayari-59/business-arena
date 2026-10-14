"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session-admin";
import { configurationSaml } from "@/saml/configuration";
import { rafraichirFederation } from "@/saml/federation";
import { rattacher, RattachementRefuse, retirerRattachement } from "@/saml/etablissements";

/**
 * LES GESTES DE L'ADMINISTRATEUR GÉNÉRAL SUR LA CONNEXION RENATER. Chaque action relit la
 * session d'administration ; le résultat repart par l'adresse.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const champ = (formData: FormData, nom: string) => String(formData.get(nom) ?? "").trim();

/** Relire l'agrégat de la fédération tout de suite (après un changement chez RENATER). */
export async function relireAgregatAction(): Promise<void> {
  await requireAdminSession();
  const c = configurationSaml();
  if (!c) redirect("/admin/renater?refus=configuration#etat");
  const r = await rafraichirFederation(c);
  revalidatePath("/admin/renater");
  redirect(r.ok ? "/admin/renater?fait=agregat#etat" : "/admin/renater?refus=agregat#etat");
}

/** Rattacher un établissement (IdP et/ou schacHomeOrganization) à une organisation. */
export async function rattacherAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const organizationId = champ(formData, "organisation");
  if (!UUID.test(organizationId)) redirect("/admin/renater?refus=organisation#rattacher");
  let refus: string | null = null;
  try {
    await rattacher({
      idpEntityId: champ(formData, "idp") || null,
      schac: champ(formData, "schac") || null,
      organizationId,
      nom: champ(formData, "nom"),
      adminId,
    });
  } catch (e) {
    if (!(e instanceof RattachementRefuse)) throw e;
    refus = e.message;
  }
  if (refus) redirect(`/admin/renater?refus=rattachement&message=${encodeURIComponent(refus)}#rattacher`);
  revalidatePath("/admin/renater");
  redirect("/admin/renater?fait=rattache#rattachements");
}

export async function retirerRattachementAction(id: string): Promise<void> {
  await requireAdminSession();
  if (UUID.test(id)) await retirerRattachement(id);
  revalidatePath("/admin/renater");
  redirect("/admin/renater?fait=retire#rattachements");
}
