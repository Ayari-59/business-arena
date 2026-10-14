"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session-admin";
import {
  creerCodeDInvitation,
  desactiverCodeDInvitation,
  desactiverCompte,
  GestionRefusee,
  rattacherAUnEtablissement,
  reactiverCompte,
  reglerLesInscriptions,
  retirerDUnEtablissement,
} from "@/services/inscrits.service";

/**
 * LES GESTES DE L'ADMINISTRATEUR DE LA PLATEFORME SUR LES INSCRITS. Chaque action relit la
 * session d'administration, puis le service relit le rôle ; les refus repartent par un code
 * dans l'adresse, les réussites par `fait`.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fiche = (userId: string) => `/admin/inscrits/${userId}`;

/** Un geste sur un compte, puis retour à sa fiche, avec le fait accompli ou le refus. */
async function surLeCompte(userId: string, fait: string, geste: (adminId: string) => Promise<void>): Promise<never> {
  const adminId = await requireAdminSession();
  if (!UUID.test(userId)) redirect("/admin/inscrits");
  try {
    await geste(adminId);
  } catch (e) {
    if (e instanceof GestionRefusee) redirect(`${fiche(userId)}?refus=${e.raison}`);
    throw e;
  }
  revalidatePath("/admin/inscrits");
  redirect(`${fiche(userId)}?fait=${fait}`);
}

export async function desactiverCompteAction(userId: string): Promise<void> {
  await surLeCompte(userId, "desactive", (adminId) => desactiverCompte(adminId, userId));
}

export async function reactiverCompteAction(userId: string): Promise<void> {
  await surLeCompte(userId, "reactive", (adminId) => reactiverCompte(adminId, userId));
}

export async function rattacherAction(userId: string, formData: FormData): Promise<void> {
  const organisation = String(formData.get("organisation") ?? "");
  const role = formData.get("role") === "org_admin" ? "org_admin" : "teacher";
  if (!UUID.test(organisation)) redirect(`${fiche(userId)}?refus=organisation`);
  await surLeCompte(userId, "rattache", (adminId) => rattacherAUnEtablissement(adminId, userId, organisation, role));
}

export async function retirerAction(userId: string, organisation: string): Promise<void> {
  await surLeCompte(userId, "retire", (adminId) => retirerDUnEtablissement(adminId, userId, organisation));
}

/** Les réglages des inscriptions, en tête de /admin/inscrits. */
export async function reglerInscriptionsAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const { ignores } = await reglerLesInscriptions(adminId, {
    inscriptionLibre: formData.get("inscriptionLibre") === "oui",
    domainesAutorises: String(formData.get("domainesAutorises") ?? ""),
    domainesBloques: String(formData.get("domainesBloques") ?? ""),
  });
  revalidatePath("/admin/inscrits");
  revalidatePath("/admin");
  redirect(`/admin/inscrits?fait=reglages${ignores.length ? `&ignores=${encodeURIComponent(ignores.slice(0, 10).join(" "))}` : ""}#reglages`);
}

export async function desactiverCodeAction(inviteId: string): Promise<void> {
  const adminId = await requireAdminSession();
  if (UUID.test(inviteId)) await desactiverCodeDInvitation(adminId, inviteId);
  revalidatePath("/admin/inscrits");
  revalidatePath("/admin");
  redirect("/admin/inscrits?fait=code#codes");
}

/** Un code d'invitation pour un établissement, depuis la liste des codes. */
export async function creerCodeAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const organisation = String(formData.get("organisation") ?? "");
  const role = formData.get("role") === "org_admin" ? "org_admin" : "teacher";
  if (!UUID.test(organisation)) redirect("/admin/inscrits?refus=organisation#codes");
  let code: string;
  try {
    code = await creerCodeDInvitation(adminId, organisation, role);
  } catch (e) {
    if (e instanceof GestionRefusee) redirect(`/admin/inscrits?refus=${e.raison}#codes`);
    throw e;
  }
  revalidatePath("/admin/inscrits");
  revalidatePath("/admin");
  redirect(`/admin/inscrits?fait=code-cree&code=${code}#codes`);
}
