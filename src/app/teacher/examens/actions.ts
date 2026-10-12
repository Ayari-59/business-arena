"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { parisLocalToUtc } from "@/lib/paris-time";
import { ExamenReserveError, LicenceDepasseeError } from "@/services/acces.service";
import {
  ExamenRefuseError,
  cloreLExamen,
  creerExamen,
  examenDeLEnseignant,
  publierLesResultats,
  type SaisieDExamen,
} from "@/services/examen.service";
import { envoyerCeQuiAttend, preparerLesNotesDeLExamen, ressourceDeLExamen } from "@/lti/ags/envois";
import { plusTard } from "@/lti/ags/plus-tard";

/**
 * LES GESTES DE L'ENSEIGNANT SUR SES EXAMENS.
 *
 * Chaque action relit la session : l'enseignant est celui du cookie signé, jamais un champ
 * du formulaire. Le service filtre par ce créateur dans la requête même ; une action
 * appelée avec l'identifiant de l'examen d'un autre ne touche donc à rien. Les refus
 * repartent par un CODE dans l'adresse (config/examen/textes.ts dit la phrase).
 */

async function enseignant(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  return session.userId;
}

const entier = (v: FormDataEntryValue | null, defaut: number): number => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? Math.trunc(n) : defaut;
};

/** Créer un examen : la licence, l'entreprise et le niveau se vérifient dans le service. */
export async function creerExamenAction(formData: FormData): Promise<void> {
  const enseignantId = await enseignant();
  const duree = String(formData.get("dureeTourMinutes") ?? "").trim();
  const saisie: SaisieDExamen = {
    nom: String(formData.get("nom") ?? ""),
    scenarioCode: String(formData.get("scenarioCode") ?? ""),
    niveau: entier(formData.get("niveau"), 0),
    tours: entier(formData.get("tours"), 0),
    dureeTourMinutes: duree ? entier(duree, 0) : null,
    ouverture: parisLocalToUtc(String(formData.get("ouverture") ?? "")),
    fermeture: parisLocalToUtc(String(formData.get("fermeture") ?? "")),
    questions: formData.get("questions") === "on",
    resultatEstime: formData.get("resultatEstime") === "on",
    tentatives: entier(formData.get("tentatives"), 1),
    modeGraine: formData.get("modeGraine") === "lot" ? "lot" : "commune",
    grilleCode: String(formData.get("grilleCode") ?? ""),
  };
  let id: string;
  try {
    ({ id } = await creerExamen(enseignantId, saisie));
  } catch (e) {
    if (e instanceof ExamenReserveError) redirect("/teacher/examens?refus=licence#nouvel-examen");
    if (e instanceof LicenceDepasseeError) redirect("/teacher/examens?refus=perimetre#nouvel-examen");
    if (e instanceof ExamenRefuseError) redirect(`/teacher/examens?refus=${e.raison}#nouvel-examen`);
    throw e;
  }
  revalidatePath("/teacher/examens");
  redirect(`/teacher/examens/${id}?cree=1`);
}

/**
 * LE CARNET DE NOTES DE LA PLATEFORME (lti/ags) : ce qui doit partir est posé au journal
 * tout de suite (l'encart le montre « en cours »), et part après la réponse.
 */
async function renvoyerVersLaPlateforme(examenId: string, forcer = false): Promise<void> {
  await preparerLesNotesDeLExamen(examenId, { forcer });
  plusTard(() => envoyerCeQuiAttend(ressourceDeLExamen(examenId)));
}

/** Publier les résultats : chaque candidat voit sa note et son relevé ; la plateforme la reçoit. */
export async function publierExamenAction(examenId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await publierLesResultats(enseignantId, examenId, true))) redirect("/teacher/examens?refus=introuvable");
  await renvoyerVersLaPlateforme(examenId);
  revalidatePath(`/teacher/examens/${examenId}`);
  redirect(`/teacher/examens/${examenId}?fait=publie`);
}

/** Retirer la publication : les candidats ne voient plus que leur reçu. */
export async function retirerPublicationAction(examenId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await publierLesResultats(enseignantId, examenId, false))) redirect("/teacher/examens?refus=introuvable");
  await renvoyerVersLaPlateforme(examenId);
  revalidatePath(`/teacher/examens/${examenId}`);
  redirect(`/teacher/examens/${examenId}?fait=retire`);
}

/** Clore l'examen : plus d'entrée, les copies en cours sont remises telles quelles. */
export async function cloreExamenAction(examenId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await cloreLExamen(enseignantId, examenId))) redirect("/teacher/examens?refus=introuvable");
  revalidatePath(`/teacher/examens/${examenId}`);
  redirect(`/teacher/examens/${examenId}?fait=clos`);
}

/** Renvoyer les notes à la plateforme : chaque ligne repart, celles déjà reçues comprises. */
export async function renvoyerLesNotesAction(examenId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await examenDeLEnseignant(enseignantId, examenId))) redirect("/teacher/examens?refus=introuvable");
  await renvoyerVersLaPlateforme(examenId, true);
  revalidatePath(`/teacher/examens/${examenId}`);
  redirect(`/teacher/examens/${examenId}?fait=renvoi`);
}
