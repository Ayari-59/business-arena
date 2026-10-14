"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session-admin";
import { parisLocalToUtc } from "@/lib/paris-time";
import {
  CatalogueRefuse,
  enregistrerCodePromo,
  enregistrerLaDecouverte,
  enregistrerLAffichage,
  enregistrerLEssai,
  enregistrerModule,
  enregistrerOffre,
  ETIQUETTE_DU_CATALOGUE,
  mettreEnAvant,
  supprimerOffre,
} from "@/services/catalogue.service";
import type { OffreDuCatalogue } from "@/config/catalogue";
import type { CodeNiveau } from "@/config/episodes/niveaux";

/**
 * LES GESTES DE L'ADMINISTRATEUR SUR LE CATALOGUE (/admin/offres).
 *
 * Chaque action relit la session d'administration (`requireAdminSession`), et le service
 * vérifie à son tour que l'auteur est administrateur de la plateforme : rien ne
 * s'enregistre sans lui. Un refus revient en phrases (`CatalogueRefuse`) : dans l'état du
 * formulaire pour l'éditeur d'offre, dans l'adresse (`?erreur=`) pour les autres.
 *
 * Après chaque enregistrement, le cache du catalogue expire (`updateTag`) et les pages qui
 * le lisent se régénèrent : /tarifs, /devis, les bandes de prix, la Découverte, les
 * guides de prise en main (statiques, `dynamicParams = false` : sans ce rappel, la page
 * expirée par l'étiquette répondait 404, `NoFallbackError`).
 */

const PAGES_DU_CATALOGUE = [
  "/tarifs",
  "/devis",
  "/ecoles",
  "/enseignants",
  "/fonctionnalites",
  "/guide",
  "/guides",
  "/guides/enseignant",
  "/guides/etudiant",
  "/guides/etablissement",
  "/guides/formateur",
  "/jouer",
  "/teacher",
  "/teacher/cohortes",
  "/entreprises/episode",
  "/admin",
  "/admin/offres",
];

function invaliderLeCatalogue(): void {
  updateTag(ETIQUETTE_DU_CATALOGUE);
  for (const p of PAGES_DU_CATALOGUE) revalidatePath(p);
}

const champ = (formData: FormData, nom: string) => String(formData.get(nom) ?? "").trim();

/** Un refus du catalogue repart dans l'adresse, vers la section concernée. */
function refuser(e: unknown, section: string): never {
  if (!(e instanceof CatalogueRefuse) && !(e instanceof Error)) throw e;
  const message = e instanceof CatalogueRefuse ? e.erreurs.join(" ") : e.message;
  redirect(`/admin/offres?erreur=${encodeURIComponent(message)}&section=${section}#${section}`);
}

/* ---------------------------------------------------------------------------
 * LES OFFRES.
 * ------------------------------------------------------------------------- */

export interface EtatDeLEditeur {
  erreurs: string[];
}

/** L'éditeur d'offre envoie l'offre entière, en JSON, et le mode (création ou modification). */
export async function enregistrerOffreAction(_prev: EtatDeLEditeur, formData: FormData): Promise<EtatDeLEditeur> {
  const adminId = await requireAdminSession();
  let offre: OffreDuCatalogue;
  try {
    offre = JSON.parse(champ(formData, "offre")) as OffreDuCatalogue;
  } catch {
    return { erreurs: ["Le formulaire n'a pas pu être lu : rechargez la page."] };
  }
  const mode = champ(formData, "mode") === "creation" ? "creation" : "modification";
  try {
    await enregistrerOffre(adminId, offre, mode);
  } catch (e) {
    if (e instanceof CatalogueRefuse) return { erreurs: e.erreurs };
    throw e;
  }
  invaliderLeCatalogue();
  redirect(`/admin/offres?fait=offre&cle=${encodeURIComponent(offre.code)}#offres`);
}

export async function mettreEnAvantAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const code = champ(formData, "code");
  try {
    await mettreEnAvant(adminId, code);
  } catch (e) {
    refuser(e, "offres");
  }
  invaliderLeCatalogue();
  redirect(`/admin/offres?fait=en-avant&cle=${encodeURIComponent(code)}#offres`);
}

export async function supprimerOffreAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  try {
    await supprimerOffre(adminId, champ(formData, "code"));
  } catch (e) {
    refuser(e, "offres");
  }
  invaliderLeCatalogue();
  redirect("/admin/offres?fait=suppression#offres");
}

/** « Afficher les prix sur le site » : éteint par défaut (offres sur mesure, sur devis). */
export async function enregistrerAffichageAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  try {
    await enregistrerLAffichage(adminId, { prixPublics: formData.get("prixPublics") === "on" });
  } catch (e) {
    refuser(e, "offres");
  }
  invaliderLeCatalogue();
  redirect("/admin/offres?fait=affichage#offres");
}

/* ---------------------------------------------------------------------------
 * LES MODULES.
 * ------------------------------------------------------------------------- */

export async function enregistrerModuleAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  try {
    await enregistrerModule(
      adminId,
      {
        code: champ(formData, "code"),
        nom: champ(formData, "nom"),
        description: champ(formData, "description"),
        actif: formData.get("actif") === "on",
        ordre: Math.round(Number(champ(formData, "ordre") || "0")),
      },
      champ(formData, "mode") === "creation" ? "creation" : "modification",
    );
  } catch (e) {
    refuser(e, "modules");
  }
  invaliderLeCatalogue();
  redirect("/admin/offres?fait=module#modules");
}

/* ---------------------------------------------------------------------------
 * LES GRATUITÉS.
 * ------------------------------------------------------------------------- */

export async function enregistrerDecouverteAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  try {
    await enregistrerLaDecouverte(adminId, {
      solo: {
        active: formData.get("soloActive") === "on",
        entrepriseOuverte: champ(formData, "entrepriseOuverte"),
        niveauMaxAutres: Math.round(Number(champ(formData, "niveauMax"))),
      },
      demos: formData.getAll("demos").map((x) => String(x)),
      niveauDesDemos: champ(formData, "niveauDesDemos") as CodeNiveau,
    });
  } catch (e) {
    refuser(e, "gratuites");
  }
  invaliderLeCatalogue();
  redirect("/admin/offres?fait=decouverte#gratuites");
}

export async function enregistrerEssaiAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  try {
    await enregistrerLEssai(adminId, {
      autorise: formData.get("autorise") === "on",
      dureeMaxJours: Math.round(Number(champ(formData, "dureeMaxJours"))),
    });
  } catch (e) {
    refuser(e, "gratuites");
  }
  invaliderLeCatalogue();
  redirect("/admin/offres?fait=essai#gratuites");
}

/* ---------------------------------------------------------------------------
 * LES CODES PROMO.
 * ------------------------------------------------------------------------- */

/** « 2026-11-30 » → le lendemain à minuit, heure de Paris : la fin est exclusive. */
function finDuJour(jour: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour);
  if (!m) return null;
  const lendemain = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1));
  return parisLocalToUtc(`${lendemain.toISOString().slice(0, 10)}T00:00`);
}

export async function enregistrerCodePromoAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminSession();
  const type = champ(formData, "typeRemise") === "montant" ? "montant" : "pourcentage";
  const brut = Number(champ(formData, "valeur").replace(",", "."));
  const max = champ(formData, "utilisationsMax");
  const debut = champ(formData, "debut");
  try {
    await enregistrerCodePromo(
      adminId,
      {
        code: champ(formData, "code"),
        typeRemise: type,
        valeur: Number.isFinite(brut) ? (type === "montant" ? Math.round(brut * 100) : Math.round(brut)) : 0,
        offres: formData.get("toutesLesOffres") === "on" ? null : formData.getAll("offres").map((x) => String(x)),
        debut: debut ? parisLocalToUtc(`${debut}T00:00`) : null,
        fin: champ(formData, "fin") ? finDuJour(champ(formData, "fin")) : null,
        utilisationsMax: max === "" ? null : Number(max),
        unParEtablissement: formData.get("unParEtablissement") === "on",
        actif: formData.get("actif") === "on",
        affiche: formData.get("affiche") === "on",
      },
      champ(formData, "id") || null,
    );
  } catch (e) {
    refuser(e, "codes");
  }
  invaliderLeCatalogue();
  redirect("/admin/offres?fait=code#codes");
}
