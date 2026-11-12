"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getPlatformConfig } from "@/services/admin.service";
import { marquerCourrielsDuDevis } from "@/services/devis.service";
import {
  deposerDemandeDAdresse,
  PLATEFORMES_LTI,
  texteAccuseAdresse,
  texteNotificationAdresse,
  type DemandeDAdresse,
} from "@/services/adresse-d-inscription.service";
import { envoyerCourriel } from "@/lib/courriel";
import { VENDEUR } from "@/config/editeur";

/**
 * L'ENVOI D'UNE DEMANDE D'ADRESSE D'INSCRIPTION LTI (/integration ; audit UX du 11 novembre 2026, P2-10).
 *
 * Comme le devis : la demande est ENREGISTRÉE d'abord, puis la notification à l'adresse de contact
 * (« Répondre » répond au demandeur) et l'accusé au demandeur, qui ne la conditionnent pas. L'écran de
 * confirmation n'annonce l'accusé que s'il est parti. Toutes les erreurs d'un coup, chacune sous son
 * champ, la saisie rendue (audit UX du 11 novembre 2026, P2-6).
 */
export interface EtatDeLaDemandeDAdresse {
  /** Les erreurs, par champ ; `general` pour celle qui ne tient à aucun champ. */
  erreurs: Record<string, string>;
  ok: { email: string; accuseEnvoye: boolean } | null;
  /** La saisie, rendue au formulaire après un refus. */
  valeurs: Record<string, string> | null;
}

const schema = z.object({
  nom: z.string().trim().min(2, "Votre nom est requis").max(120),
  fonction: z.string().trim().min(2, "Votre fonction est requise").max(120),
  organisation: z.string().trim().min(2, "L'établissement est requis").max(160),
  identifiant: z.string().trim().max(40, "UAI : 40 caractères au plus"),
  plateforme: z.enum(PLATEFORMES_LTI, { message: "Choisissez votre plateforme de cours" }),
  email: z.string().trim().email("Adresse électronique invalide").max(200),
  message: z.string().trim().max(1200, "Le message est limité à 1 200 caractères"),
  /** Piège à robots : un champ invisible qu'un humain ne remplit pas. */
  site: z.string().max(0, "Formulaire invalide"),
});

async function adresseOrigine(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
}

export async function demanderLAdresseDInscriptionAction(
  _avant: EtatDeLaDemandeDAdresse,
  formData: FormData,
): Promise<EtatDeLaDemandeDAdresse> {
  const brut = {
    nom: String(formData.get("nom") ?? ""),
    fonction: String(formData.get("fonction") ?? ""),
    organisation: String(formData.get("organisation") ?? ""),
    identifiant: String(formData.get("identifiant") ?? ""),
    plateforme: String(formData.get("plateforme") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    site: String(formData.get("site") ?? ""),
  };
  const { site: _piege, ...valeurs } = brut;
  void _piege;
  const lu = schema.safeParse(brut);
  if (!lu.success) {
    const erreurs: Record<string, string> = {};
    for (const i of lu.error.issues) {
      const champ = String(i.path[0] ?? "");
      const cle = champ && champ !== "site" ? champ : "general";
      if (!erreurs[cle]) erreurs[cle] = i.message;
    }
    return { erreurs, ok: null, valeurs };
  }
  const demande: DemandeDAdresse = lu.data;
  const depot = await deposerDemandeDAdresse(demande, await adresseOrigine());
  if ("error" in depot) return { erreurs: { general: depot.error }, ok: null, valeurs };

  const config = await getPlatformConfig();
  const contact = config.contactEmail || null;
  let notification = false;
  if (contact) {
    const n = await envoyerCourriel({ a: contact, ...texteNotificationAdresse(demande), repondreA: demande.email });
    notification = n.envoye;
  }
  const accuse = await envoyerCourriel({
    a: demande.email,
    ...texteAccuseAdresse(demande, VENDEUR.contact),
    ...(contact ? { repondreA: contact } : {}),
  });
  await marquerCourrielsDuDevis(depot.id, { notification, accuse: accuse.envoye });
  console.info(
    `[adresse-lti] demande ${depot.id} enregistrée · notification ${
      contact ? (notification ? "envoyée" : "non envoyée") : "sans adresse de contact"
    } · accusé ${accuse.envoye ? "envoyé" : "non envoyé"}`,
  );
  return { erreurs: {}, ok: { email: demande.email, accuseEnvoye: accuse.envoye }, valeurs: null };
}
