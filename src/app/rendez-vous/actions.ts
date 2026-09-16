"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getPlatformConfig } from "@/services/admin.service";
import {
  marquerConfirmationEnvoyee,
  reserverRendezVous,
  texteConfirmation,
  texteNotification,
} from "@/services/rendez-vous.service";
import { envoyerCourriel } from "@/lib/courriel";
import { libelleCreneau } from "@/lib/creneaux";

/**
 * LA RÉSERVATION D'UN CRÉNEAU.
 *
 * Le créneau vient de la page, qui l'a calculé sur l'agenda ; l'action le
 * revérifie au moment de réserver (le service recalcule), écrit la
 * réservation, la pose dans l'agenda, puis prévient : l'adresse de contact
 * d'un côté, l'enseignant de l'autre. Aucun courriel ne conditionne la
 * réservation : elle existe avant qu'ils ne partent, et l'administration la
 * montre quoi qu'il arrive.
 */
export interface RendezVousFormState {
  error: string | null;
  /** Le rendez-vous est pris : ce que l'enseignant doit savoir. */
  ok: { quand: string; email: string; dansAgenda: boolean } | null;
  /** La saisie, rendue au formulaire après un échec. */
  values: Record<string, string> | null;
}

const schema = z.object({
  creneau: z.string().trim().min(1, "Choisissez un créneau"),
  nom: z.string().trim().min(2, "Votre nom est requis").max(120),
  etablissement: z.string().trim().min(2, "Votre établissement est requis").max(160),
  telephone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 .()-]{8,20}$/, "Numéro de téléphone invalide"),
  email: z.string().trim().email("E-mail invalide").max(200),
  message: z.string().trim().max(800, "Le message est limité à 800 caractères").catch(""),
  /** Piège à robots : un champ invisible qu'un humain ne remplit pas. */
  site: z.string().max(0, "Formulaire invalide").catch("x"),
});

async function adresseOrigine(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
}

export async function reserverRendezVousAction(
  _prev: RendezVousFormState,
  formData: FormData,
): Promise<RendezVousFormState> {
  const brut = {
    creneau: String(formData.get("creneau") ?? ""),
    nom: String(formData.get("nom") ?? ""),
    etablissement: String(formData.get("etablissement") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    site: String(formData.get("site") ?? ""),
  };
  const values = { ...brut };
  delete (values as { site?: string }).site;
  const parsed = schema.safeParse(brut);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide", ok: null, values };
  }
  const d = parsed.data;
  const debut = new Date(d.creneau);
  if (Number.isNaN(debut.getTime())) return { error: "Choisissez un créneau", ok: null, values };

  const demande = {
    name: d.nom,
    school: d.etablissement,
    email: d.email,
    phone: d.telephone,
    message: d.message,
    debut,
    ip: await adresseOrigine(),
  };
  const rdv = await reserverRendezVous(demande);
  if ("error" in rdv) return { error: rdv.error, ok: null, values };

  // Les courriels : à l'adresse de contact (« Répondre » répond à
  // l'enseignant), et à l'enseignant (« Répondre » répond au contact). Ni
  // l'un ni l'autre ne conditionne la réservation.
  const config = await getPlatformConfig();
  const contact = config.contactEmail || null;
  const confirmation = texteConfirmation(demande, rdv, contact);
  const envoi = await envoyerCourriel({
    a: d.email,
    ...confirmation,
    ...(contact ? { repondreA: contact } : {}),
  });
  if (envoi.envoye) await marquerConfirmationEnvoyee(rdv.id);
  let notification: string = "aucune adresse de contact configurée";
  if (contact) {
    const n = await envoyerCourriel({ a: contact, ...texteNotification(demande, rdv), repondreA: d.email });
    notification = n.envoye ? "envoyée" : `non envoyée (${n.raison}${n.detail ? ` : ${n.detail}` : ""})`;
  }
  // Une ligne dans les journaux de l'hébergeur, sans l'identité de l'enseignant.
  console.info(
    `[rendez-vous] ${rdv.id} réservé · agenda ${rdv.dansAgenda ? "posé" : `non posé (${rdv.detailAgenda})`} · confirmation ${
      envoi.envoye ? "envoyée" : `non envoyée (${envoi.raison}${envoi.detail ? ` : ${envoi.detail}` : ""})`
    } · notification ${notification}`,
  );
  return {
    error: null,
    ok: { quand: libelleCreneau(rdv.debut), email: d.email, dansAgenda: rdv.dansAgenda },
    values: null,
  };
}
