"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getPlatformConfig } from "@/services/admin.service";
import {
  deposerDemandeDeDevis,
  marquerCourrielsDuDevis,
  texteAccuseDevis,
  texteNotificationDevis,
} from "@/services/devis.service";
import { envoyerCourriel } from "@/lib/courriel";
import {
  ENTREPRISES,
  LIBELLES_DU_DEVIS,
  NIVEAUX_DE_L_ARENE,
  OFFRES_DU_DEVIS,
  type OffreDuDevis,
} from "@/config/tarifs";
import { VENDEUR } from "@/config/editeur";

/**
 * L'ENVOI D'UNE DEMANDE DE DEVIS.
 *
 * La demande est ENREGISTRÉE d'abord, quoi qu'il arrive ensuite. Deux courriels suivent,
 * qui ne la conditionnent pas : la notification à l'adresse de contact (« Répondre »
 * répond au demandeur) et l'accusé au demandeur. L'écran de confirmation DIT LA VÉRITÉ
 * (audit PAR-06) : il n'annonce l'accusé que s'il est parti.
 */
export interface DevisFormState {
  error: string | null;
  /** La demande est enregistrée : ce que le demandeur doit savoir. */
  ok: { email: string; offre: OffreDuDevis; accuseEnvoye: boolean } | null;
  /** La saisie, rendue au formulaire après un échec. */
  values: Record<string, string> | null;
}

const schema = z.object({
  offre: z.enum(OFFRES_DU_DEVIS as [OffreDuDevis, ...OffreDuDevis[]], { message: "Choisissez l'offre" }),
  nom: z.string().trim().min(2, "Votre nom est requis").max(120),
  fonction: z.string().trim().min(2, "Votre fonction est requise").max(120),
  organisation: z.string().trim().min(2, "L'établissement ou l'organisation est requis").max(160),
  identifiant: z.string().trim().max(40, "UAI ou SIRET : 40 caractères au plus").catch(""),
  effectif: z
    .string()
    .trim()
    .regex(/^\d{0,6}$/, "Indiquez un nombre")
    .catch(""),
  email: z.string().trim().email("E-mail invalide").max(200),
  message: z.string().trim().max(1200, "Le message est limité à 1 200 caractères").catch(""),
  /** Piège à robots : un champ invisible qu'un humain ne remplit pas. */
  site: z.string().max(0, "Formulaire invalide").catch("x"),
});

async function adresseOrigine(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
}

export async function envoyerDemandeDeDevisAction(
  _prev: DevisFormState,
  formData: FormData,
): Promise<DevisFormState> {
  const brut = Object.fromEntries(
    ["offre", "nom", "fonction", "organisation", "identifiant", "effectif", "entreprise", "niveau", "email", "message", "site"].map(
      (k) => [k, String(formData.get(k) ?? "")],
    ),
  );
  const values = { ...brut };
  delete values.site;
  const parsed = schema.safeParse(brut);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide", ok: null, values };
  }
  const d = parsed.data;
  if (brut.effectif && !/^\d{1,6}$/.test(brut.effectif.trim())) {
    return { error: "Indiquez un nombre", ok: null, values };
  }
  // L'entreprise et le niveau : seulement pour les offres qui se paramètrent à l'achat, et
  // alors requis ; une valeur hors du registre est refusée.
  const libelles = LIBELLES_DU_DEVIS[d.offre];
  const entreprise = libelles.entreprise ? brut.entreprise!.trim() : "";
  if (libelles.entreprise && !ENTREPRISES.some((e) => e.code === entreprise)) {
    return { error: "Choisissez l'entreprise souhaitée", ok: null, values };
  }
  const niveau = libelles.niveau ? Number(brut.niveau) : null;
  if (libelles.niveau && !NIVEAUX_DE_L_ARENE.some((n) => n.niveau === niveau)) {
    return { error: "Choisissez le niveau souhaité", ok: null, values };
  }
  const demande = {
    offre: d.offre,
    nom: d.nom,
    fonction: d.fonction,
    organisation: d.organisation,
    identifiant: d.identifiant,
    effectif: libelles.effectif && d.effectif ? Number(d.effectif) : null,
    entreprise: entreprise || null,
    niveau,
    email: d.email,
    message: d.message,
    ip: await adresseOrigine(),
  };
  const depot = await deposerDemandeDeDevis(demande);
  if ("error" in depot) return { error: depot.error, ok: null, values };

  const config = await getPlatformConfig();
  const contact = config.contactEmail || null;
  let notification = false;
  if (contact) {
    const n = await envoyerCourriel({ a: contact, ...texteNotificationDevis(demande), repondreA: d.email });
    notification = n.envoye;
  }
  const accuse = await envoyerCourriel({
    a: d.email,
    ...texteAccuseDevis(demande, VENDEUR.contact),
    ...(contact ? { repondreA: contact } : {}),
  });
  await marquerCourrielsDuDevis(depot.id, { notification, accuse: accuse.envoye });
  // Une ligne dans les journaux de l'hébergeur, sans l'identité du demandeur.
  console.info(
    `[devis] demande ${depot.id} (${d.offre}) enregistrée · notification ${
      contact ? (notification ? "envoyée" : "non envoyée") : "sans adresse de contact"
    } · accusé ${accuse.envoye ? "envoyé" : `non envoyé (${accuse.raison})`}`,
  );
  return {
    error: null,
    ok: { email: d.email, offre: d.offre, accuseEnvoye: accuse.envoye },
    values: null,
  };
}
