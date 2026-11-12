"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  CohorteRefuseeError,
  cloreCohorte,
  creerCohorteDeLEnseignant,
  renommerCohorte,
  renouvelerCodeDeCohorte,
} from "@/services/cohortes.service";
import type { RefusDeCohorte } from "@/config/cohortes";

/**
 * LES GESTES DE L'ENSEIGNANT SUR SES COHORTES.
 *
 * Chaque action relit la session : l'enseignant est celui du cookie signé, jamais un
 * champ du formulaire. Le service filtre par ce créateur dans la requête même ; une
 * action appelée avec l'identifiant de la cohorte d'un autre ne touche donc à rien,
 * et revient sur la liste avec le refus « introuvable ».
 *
 * Les refus repartent par un CODE (config/cohortes.ts dit la phrase) : dans l'adresse pour les gestes
 * sur une cohorte existante, rien de ce qu'elle porte ne s'affichant tel quel ; dans l'état du
 * formulaire pour la création, qui rend aussi la saisie.
 */

async function enseignant(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  return session.userId;
}

const introuvable = (): never => redirect("/teacher/cohortes?refus=introuvable");

/**
 * LE FORMULAIRE DE CRÉATION, APRÈS UN REFUS (audit UX du 11 novembre 2026, P2-6) : le refus revenait par
 * l'adresse, la page se rechargeait, le nom tapé s'effaçait et les épisodes cochés se décochaient. Il
 * revient maintenant dans l'état du formulaire (components/nouvelle-cohorte.tsx), avec la saisie à y
 * remettre : le nom et les épisodes cochés.
 */
export interface EtatDeLaNouvelleCohorte {
  refus: RefusDeCohorte | null;
  valeurs: { nom: string; episodes: string[] } | null;
}

/** Créer une cohorte : un nom, des épisodes cochés. La licence se vérifie dans le service. */
export async function creerCohorteAction(_avant: EtatDeLaNouvelleCohorte, formData: FormData): Promise<EtatDeLaNouvelleCohorte> {
  const enseignantId = await enseignant();
  const nom = String(formData.get("nom") ?? "");
  const episodes = formData.getAll("episodes").map(String);
  let id: string;
  try {
    ({ id } = await creerCohorteDeLEnseignant({ enseignantId, nom, episodes }));
  } catch (e) {
    if (!(e instanceof CohorteRefuseeError)) throw e;
    return { refus: e.raison, valeurs: { nom, episodes } };
  }
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${id}?creee=1`);
}

export async function renommerCohorteAction(cohorteId: string, formData: FormData): Promise<void> {
  const enseignantId = await enseignant();
  const ok = await renommerCohorte({
    enseignantId,
    cohorteId,
    nom: String(formData.get("nom") ?? ""),
  });
  if (!ok) introuvable();
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${cohorteId}?fait=renommee`);
}

/** Clore : plus de nouveaux participants ; les parties commencées se terminent. */
export async function cloreCohorteAction(cohorteId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await cloreCohorte({ enseignantId, cohorteId, close: true }))) introuvable();
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${cohorteId}?fait=close`);
}

export async function rouvrirCohorteAction(cohorteId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await cloreCohorte({ enseignantId, cohorteId, close: false }))) introuvable();
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${cohorteId}?fait=rouverte`);
}

/** Un nouveau code : l'ancien n'ouvre plus rien, les membres restent membres. */
export async function renouvelerCodeDeCohorteAction(cohorteId: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await renouvelerCodeDeCohorte({ enseignantId, cohorteId }))) introuvable();
  revalidatePath("/teacher/cohortes");
  redirect(`/teacher/cohortes/${cohorteId}?fait=code`);
}
