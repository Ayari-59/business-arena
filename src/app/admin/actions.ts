"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session-admin";
import {
  createEstablishment,
  createInvite,
  deactivateInvite,
  updatePlatformConfig,
} from "@/services/admin.service";
import {
  DEMO_REFUSEE_EN_PRODUCTION,
  demoAutorisee,
  fermerLesComptesDeDemo,
  renouvelerLeMotDePasseDeDemo,
  seedDemoWorld,
} from "@/services/demo.service";
import { deleteOrgLicence } from "@/services/licence.service";
import { attribuerUneLicence } from "@/services/vente.service";
import { DEFAULT_AI_CONFIG, isAiModelId } from "@/config/ai";
import { answerFormatFromProfile } from "@/config/difficulty";

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
    // L'inscription libre se règle dans /admin/inscrits (reglerInscriptionsAction) : ce
    // formulaire ne l'écrit plus, sans quoi il la remettrait à « non » à chaque envoi.
    soloAnswerFormat: answerFormatFromProfile({ answerFormat: formData.get("soloAnswerFormat") }),
    // Les niveaux ouverts sans licence se règlent dans /admin/offres, avec la Découverte
    // (migration 0041) : ce formulaire ne les écrit plus.
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

/** Ce que voit l'admin après un geste sur le monde démo : le mot de passe, une seule fois. */
export interface EtatDeLaDemo {
  error: string | null;
  /** Le mot de passe tiré, montré une fois puis perdu : il n'est gardé qu'en empreinte. */
  motDePasse: string | null;
  message: string | null;
}

export async function seedDemoAction(
  _prev: EtatDeLaDemo,
  _formData: FormData,
): Promise<EtatDeLaDemo> {
  await requireAdminSession();
  if (!demoAutorisee()) return { error: DEMO_REFUSEE_EN_PRODUCTION, motDePasse: null, message: null };
  const monde = await seedDemoWorld();
  revalidatePath("/admin");
  return {
    error: null,
    motDePasse: monde.password,
    message: monde.created ? "Monde démo créé." : "Le monde démo était déjà en place.",
  };
}

export async function renouvelerLeMotDePasseDeDemoAction(
  _prev: EtatDeLaDemo,
  _formData: FormData,
): Promise<EtatDeLaDemo> {
  await requireAdminSession();
  if (!demoAutorisee()) return { error: DEMO_REFUSEE_EN_PRODUCTION, motDePasse: null, message: null };
  const motDePasse = await renouvelerLeMotDePasseDeDemo();
  return { error: null, motDePasse, message: "Nouveau mot de passe des deux comptes de démonstration." };
}

export async function fermerLesComptesDeDemoAction(
  _prev: EtatDeLaDemo,
  _formData: FormData,
): Promise<EtatDeLaDemo> {
  await requireAdminSession();
  await fermerLesComptesDeDemo();
  revalidatePath("/admin");
  return {
    error: null,
    motDePasse: null,
    message: "Comptes de démonstration fermés : plus de mot de passe, sessions et codes d'invitation révoqués.",
  };
}

/**
 * ATTRIBUE UNE LICENCE DEPUIS UNE OFFRE DU CATALOGUE (/admin/offres).
 *
 * L'offre pose le périmètre (l'arène et son paramétrage, les épisodes), les limites et le
 * prix catalogue ; l'admin choisit ce qu'elle laisse au choix (l'entreprise, le niveau, le
 * plafond d'enseignants du devis), la nature (vendue, offerte, essai) et la remise. Le
 * montant facturé est CALCULÉ par le serveur (services/vente.service.ts), jamais lu du
 * formulaire ; la licence garde une copie des conditions de l'offre. Les montants saisis
 * en euros sont rangés en centimes : un prix stocké en flottant finit toujours par
 * afficher 89,99999.
 */
/** Un champ du formulaire de licence, nettoyé. */
const lire = (formData: FormData, nom: string) => String(formData.get(nom) ?? "").trim();
/** Un montant saisi en euros (« 990 », « 1 090,50 »), en centimes ; null si vide ou illisible. */
function centimes(formData: FormData, nom: string): number | null {
  const n = Number(lire(formData, nom).replace(/\s/g, "").replace(",", "."));
  return lire(formData, nom) !== "" && Number.isFinite(n) ? Math.round(n * 100) : null;
}

export async function setLicenceAction(
  organizationId: string,
  formData: FormData,
): Promise<void> {
  const adminId = await requireAdminSession();
  const nature = lire(formData, "nature");
  const typeRemise = lire(formData, "typeRemise");
  await attribuerUneLicence(adminId, organizationId, {
    offre: lire(formData, "offre"),
    episodes: formData.get("episodes") === "on",
    entreprise: lire(formData, "entreprise") || null,
    niveau: Number(lire(formData, "niveau")) || null,
    maxEnseignants: Number(lire(formData, "maxTeachers")) || null,
    label: lire(formData, "label"),
    startsAt: new Date(lire(formData, "startsAt")),
    endsAt: new Date(lire(formData, "endsAt")),
    reference: lire(formData, "reference") || null,
    nature: nature === "offerte" || nature === "essai" ? nature : "vendue",
    prixCatalogueCents: centimes(formData, "prixCatalogue"),
    remise:
      typeRemise === "pourcentage" || typeRemise === "montant"
        ? {
            type: typeRemise,
            valeur:
              typeRemise === "pourcentage"
                ? Math.floor(Number(lire(formData, "valeurRemise").replace(",", ".")))
                : (centimes(formData, "valeurRemise") ?? 0),
            motif: lire(formData, "motifRemise"),
          }
        : null,
    motifGratuite: lire(formData, "motifGratuite") || null,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/offres");
  revalidatePath("/teacher");
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
