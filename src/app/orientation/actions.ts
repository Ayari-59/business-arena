"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { OBJECTIFS, diplomesProposes } from "@/config/orientation";
import { getPlatformConfig } from "@/services/admin.service";
import {
  deposerDemandeOrientation,
  marquerCourrielEnvoye,
  texteDuCourriel,
} from "@/services/orientation-request.service";
import { envoyerCourriel } from "@/lib/courriel";

/**
 * L'ENVOI D'UNE DEMANDE DE SIMULATION.
 *
 * Le formulaire ouvrait un courriel pré-rempli chez le visiteur ; il envoie
 * désormais chez nous. La demande est ENREGISTRÉE d'abord, quoi qu'il arrive
 * ensuite : le courriel de notification vers l'adresse de contact est une
 * commodité, pas la source de vérité — sans clé d'envoi configurée, la
 * demande se lit dans l'administration, et l'enseignant est prévenu de la
 * même façon.
 */
export interface OrientationFormState {
  error: string | null;
  /** La demande est partie : ce que l'enseignant doit savoir. */
  ok: { email: string } | null;
  /** La saisie, rendue au formulaire après un échec. */
  values: Record<string, string> | null;
}

const schema = z.object({
  nom: z.string().trim().min(2, "Votre nom est requis").max(120),
  etablissement: z.string().trim().min(2, "Votre établissement est requis").max(160),
  email: z.string().trim().email("E-mail invalide").max(200),
  diplome: z.string().trim().min(1),
  semestre: z.enum(["s1", "s2"]),
  objectif: z.string().trim().min(1),
  message: z.string().trim().max(1200, "Le message est limité à 1 200 caractères").catch(""),
  /** Piège à robots : un champ invisible qu'un humain ne remplit pas. */
  site: z.string().max(0, "Formulaire invalide").catch("x"),
});

/** L'adresse d'origine telle que le proxy la transmet ; null hors proxy. */
async function adresseOrigine(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
}

export async function envoyerDemandeOrientationAction(
  _prev: OrientationFormState,
  formData: FormData,
): Promise<OrientationFormState> {
  const brut = {
    nom: String(formData.get("nom") ?? ""),
    etablissement: String(formData.get("etablissement") ?? ""),
    email: String(formData.get("email") ?? ""),
    diplome: String(formData.get("diplome") ?? ""),
    semestre: String(formData.get("semestre") ?? "s1"),
    objectif: String(formData.get("objectif") ?? ""),
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
  if (!diplomesProposes().some((x) => x.code === d.diplome) || !OBJECTIFS.some((o) => o.code === d.objectif)) {
    return { error: "Formulaire invalide", ok: null, values };
  }
  const demande = {
    name: d.nom,
    school: d.etablissement,
    email: d.email,
    diplome: d.diplome,
    semestre: d.semestre,
    objectif: d.objectif,
    message: d.message,
    ip: await adresseOrigine(),
  };
  const depot = await deposerDemandeOrientation(demande);
  if ("error" in depot) return { error: depot.error, ok: null, values };

  // La notification : vers l'adresse de contact de la plateforme, « Répondre »
  // répond à l'enseignant. Un échec d'envoi ne fait pas échouer la demande.
  const config = await getPlatformConfig();
  if (config.contactEmail) {
    const { sujet, texte } = texteDuCourriel(demande, depot.recommandation);
    const envoi = await envoyerCourriel({ a: config.contactEmail, sujet, texte, repondreA: d.email });
    if (envoi.envoye) await marquerCourrielEnvoye(depot.id);
    // Une ligne dans les journaux de l'hébergeur : c'est là qu'on lit si la
    // notification part, sans avoir à ouvrir l'administration. Ni l'adresse
    // de l'enseignant ni le message n'y figurent.
    console.info(
      `[orientation] demande ${depot.id} enregistrée · courriel ${
        envoi.envoye ? "envoyé" : `non envoyé (${envoi.raison}${envoi.detail ? ` : ${envoi.detail}` : ""})`
      }`,
    );
  } else {
    console.info(`[orientation] demande ${depot.id} enregistrée · aucune adresse de contact configurée`);
  }
  return { error: null, ok: { email: d.email }, values: null };
}
