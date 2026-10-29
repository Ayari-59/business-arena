"use server";

import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getPlatformConfig } from "@/services/admin.service";
import {
  deposerDemandeDeDevis,
  marquerCourrielsDuDevis,
  texteAccuseDevis,
  texteNotificationDevis,
} from "@/services/devis.service";
import { envoyerCourriel } from "@/lib/courriel";
import { ENTREPRISES, libellesDuDevisDe, NIVEAUX_DE_L_ARENE, parametrageRequisAuDevis } from "@/config/tarifs";
import { VENDEUR } from "@/config/editeur";
import { chiffrerLeDevis, cleDEtablissement, nomDansLeDevis, offresDuDevis, type DevisChiffre } from "@/config/catalogue";
import { ETIQUETTE_DU_CATALOGUE, lireLEtatDuCatalogue, verifierUnCodePromo } from "@/services/catalogue.service";

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
  /**
   * Le champ que l'erreur concerne (audit UX du 29 octobre 2026, P1-6) : le formulaire dit
   * l'erreur SOUS ce champ et y place le focus, au lieu d'un message en bas de page.
   */
  champ?: string | null;
  /** La demande est enregistrée : ce que le demandeur doit savoir. */
  ok: {
    email: string;
    offre: string;
    accuseEnvoye: boolean;
    /** Le devis chiffré d'un code promo accepté : le code, prix catalogue, remise, prix remisé. */
    promo: ({ code: string; montants: boolean } & DevisChiffre) | null;
  } | null;
  /** La saisie, rendue au formulaire après un échec. */
  values: Record<string, string> | null;
}

const schema = z.object({
  offre: z.string().trim().min(1, "Choisissez l'offre"),
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
  codePromo: z.string().trim().max(40, "Un code promo tient en 40 caractères").catch(""),
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
    ["offre", "nom", "fonction", "organisation", "identifiant", "effectif", "entreprise", "niveau", "email", "message", "codePromo", "site"].map(
      (k) => [k, String(formData.get(k) ?? "")],
    ),
  );
  const values = { ...brut };
  delete values.site;
  const parsed = schema.safeParse(brut);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const nom = String(issue?.path[0] ?? "");
    return { error: issue?.message ?? "Formulaire invalide", champ: nom && nom !== "site" ? nom : null, ok: null, values };
  }
  const d = parsed.data;
  if (brut.effectif && !/^\d{1,6}$/.test(brut.effectif.trim())) {
    return { error: "Indiquez un nombre", champ: "effectif", ok: null, values };
  }
  const { catalogue, affichage } = await lireLEtatDuCatalogue();
  const offre = offresDuDevis(catalogue).find((o) => o.code === d.offre);
  if (!offre) return { error: "Choisissez l'offre", champ: "offre", ok: null, values };
  // L'entreprise et le niveau : seulement pour les offres qui se paramètrent à l'achat ; une
  // valeur saisie hors du registre est refusée. « Le cours seul » n'est plus un choix (audit
  // de l'offre, octobre 2026). REQUIS POUR CLASSE SEULEMENT (audit UX du 29 octobre 2026,
  // P1-7) : pour Programme et Campus, ce sont des choix pédagogiques qu'une direction laisse
  // à l'équipe ; facultatifs, gardés s'ils sont donnés (`parametrageRequisAuDevis`).
  const libelles = libellesDuDevisDe(offre);
  const requis = parametrageRequisAuDevis(libelles);
  const entreprise = libelles.entreprise ? brut.entreprise!.trim() : "";
  if (libelles.entreprise && (requis || entreprise) && !ENTREPRISES.some((e) => e.code === entreprise)) {
    return { error: "Choisissez l'entreprise souhaitée", champ: "entreprise", ok: null, values };
  }
  const niveauSaisi = brut.niveau!.trim();
  const niveau = libelles.niveau && (requis || niveauSaisi) ? Number(niveauSaisi) : null;
  if (libelles.niveau && niveau !== null && !NIVEAUX_DE_L_ARENE.some((n) => n.niveau === niveau)) {
    return { error: "Choisissez le niveau souhaité", champ: "niveau", ok: null, values };
  }
  // Le code promo, s'il est saisi : vérifié côté serveur, refusé avec sa phrase.
  let promo: NonNullable<Parameters<typeof deposerDemandeDeDevis>[0]["promo"]> | null = null;
  if (d.codePromo) {
    const cle = cleDEtablissement(d.organisation, d.identifiant);
    const v = await verifierUnCodePromo({
      saisie: d.codePromo,
      offre: offre.code,
      nomDeLOffre: nomDansLeDevis(offre),
      cleEtablissement: cle,
    });
    if (!v.ok) return { error: v.message, champ: "codePromo", ok: null, values };
    promo = {
      id: v.code.id,
      code: v.code.code,
      cle: v.code.unParEtablissement ? cle : null,
      devis: chiffrerLeDevis(offre.tarif === "prix" ? offre.prixCents : null, {
        type: v.code.typeRemise,
        valeur: v.code.valeur,
      }),
    };
  }
  const demande = {
    offre: offre.code,
    libelles,
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
    promo,
    montantsPublics: affichage.prixPublics,
  };
  const depot = await deposerDemandeDeDevis(demande);
  if ("error" in depot) return { error: depot.error, ok: null, values };
  // Une utilisation de plus : le bandeau d'une promotion épuisée se retire.
  if (promo) {
    try {
      revalidateTag(ETIQUETTE_DU_CATALOGUE, "max");
    } catch {
      // Hors d'une requête Next (tests) : rien à invalider.
    }
  }

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
    `[devis] demande ${depot.id} (${offre.code}${promo ? `, code ${promo.code}` : ""}) enregistrée · notification ${
      contact ? (notification ? "envoyée" : "non envoyée") : "sans adresse de contact"
    } · accusé ${accuse.envoye ? "envoyé" : `non envoyé (${accuse.raison})`}`,
  );
  return {
    error: null,
    ok: {
      email: d.email,
      offre: offre.code,
      accuseEnvoye: accuse.envoye,
      // L'écran ne montre un montant que si l'affichage des prix est allumé ; la demande
      // enregistrée garde toujours le prix de référence, la remise et le prix remisé (/admin).
      promo: promo
        ? affichage.prixPublics
          ? { code: promo.code, montants: true, ...promo.devis }
          : { code: promo.code, montants: false, prixCatalogueCents: null, remiseCents: null, remiseLibelle: "", prixRemiseCents: null }
        : null,
    },
    values: null,
  };
}
