"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session-admin";
import {
  createEstablishment,
  createInvite,
  deactivateInvite,
  updatePlatformConfig,
} from "@/services/admin.service";
import { seedDemoWorld } from "@/services/demo.service";
import { deleteOrgLicence, setOrgLicence } from "@/services/licence.service";
import { DEFAULT_AI_CONFIG, isAiModelId } from "@/config/ai";
import { normaliserVitrine, vitrineAEnregistrer, VERSION_DE_LA_REGLE } from "@/config/vitrine-solo";
import { answerFormatFromProfile } from "@/config/difficulty";
import {
  estUneOffreDeLArene,
  PLAFOND_D_ENSEIGNANTS,
  type OffreDeLArene,
} from "@/config/tarifs";

export async function createEstablishmentAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  await createEstablishment({ adminId, name });
  revalidatePath("/admin");
}

export async function updatePlatformConfigAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const aiModelRaw = formData.get("aiModel");
  await updatePlatformConfig(adminId, {
    allowPublicPlay: formData.get("allowPublicPlay") === "on",
    allowSelfServiceTeachers: formData.get("allowSelfServiceTeachers") === "on",
    soloAnswerFormat: answerFormatFromProfile({ answerFormat: formData.get("soloAnswerFormat") }),
    // Les niveaux ouverts sans licence : enregistrés avec la version de la règle, qui
    // seule fait foi (config/vitrine-solo.ts).
    vitrineSolo: vitrineAEnregistrer(
      normaliserVitrine({
        version: VERSION_DE_LA_REGLE,
        active: formData.get("vitrineActive") === "on",
        entrepriseOuverte: formData.get("vitrineEntreprise"),
        niveauMaxAutres: formData.get("vitrineNiveauMax"),
      }),
    ),
    announcement: String(formData.get("announcement") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
    // Ce qui se publie du relevé d'usage sur /enseignants. Un compteur exact
    // peut desservir la page qui le porte — « classes créées : 0 » — et le
    // remède est de ne pas le publier, jamais de maquiller la valeur.
    preuvesPubliees: {
      parties: formData.get("preuveParties") === "on",
      tours: formData.get("preuveTours") === "on",
      decisions: formData.get("preuveDecisions") === "on",
      classes: formData.get("preuveClasses") === "on",
    },
    ai: {
      coach: formData.get("aiCoach") === "on",
      teacherReview: formData.get("aiTeacherReview") === "on",
      tutor: formData.get("aiTutor") === "on",
      model: isAiModelId(aiModelRaw) ? aiModelRaw : DEFAULT_AI_CONFIG.model,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/orientation");
  revalidatePath("/enseignants");
  revalidatePath("/jouer");
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
 * LE PÉRIMÈTRE se choisit (config/tarifs.ts) : l'offre de l'arène, Classe ou Campus, ou
 * aucune ; et la case « Épisodes manager », vendus à part. Le plafond d'enseignants
 * suit l'offre de l'arène (Classe : un enseignant ; Campus : sans plafond) ; une licence
 * des seuls épisodes n'en porte pas.
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
  const arene = estUneOffreDeLArene(texte("arene")) ? (texte("arene") as OffreDeLArene) : null;

  await setOrgLicence({
    adminId,
    organizationId,
    label: texte("label"),
    startsAt: new Date(texte("startsAt")),
    endsAt: new Date(texte("endsAt")),
    maxTeachers: arene ? PLAFOND_D_ENSEIGNANTS[arene] : null,
    arene,
    episodes: formData.get("episodes") === "on",
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

/** Une demande de simulation prise en charge : elle quitte la pile « à répondre ». */
export async function marquerDemandeOrientationTraiteeAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { marquerDemandeTraitee } = await import("@/services/orientation-request.service");
  await marquerDemandeTraitee(id, adminId);
  revalidatePath("/admin");
}

export async function annulerRendezVousAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { annulerRendezVous } = await import("@/services/rendez-vous.service");
  const r = await annulerRendezVous(id, adminId);
  console.info(`[rendez-vous] ${id} annulé · agenda ${r.retireDeLAgenda ? "mis à jour" : "non mis à jour"}`);
  revalidatePath("/admin");
}

export async function deconnecterAgendaAction(): Promise<void> {
  await requireAdminSession();
  const { deconnecterAgenda } = await import("@/services/agenda-google.service");
  await deconnecterAgenda();
  console.info("[agenda] agenda Google déconnecté");
  revalidatePath("/admin");
}

/** Une demande de devis prise en charge : elle quitte la pile « à traiter ». */
export async function marquerDemandeDeDevisTraiteeAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { marquerDemandeDeDevisTraitee } = await import("@/services/devis.service");
  await marquerDemandeDeDevisTraitee(id, adminId);
  revalidatePath("/admin");
}
