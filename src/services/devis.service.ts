import { and, desc, eq, gt, sql } from "drizzle-orm";
import {
  FENETRE_PAR_DESTINATAIRE_MS,
  PLAFOND_PAR_DESTINATAIRE_PAR_JOUR,
  REFUS_PAR_DESTINATAIRE,
} from "@/config/plafonds-des-formulaires";
import { consommerUneUtilisation, rendreUneUtilisation } from "@/services/catalogue.service";
import { euros, type DevisChiffre } from "@/config/catalogue";
import { db } from "@/db";
import { demandesDeDevis } from "@/db/schema";
import { VENDEUR } from "@/config/editeur";
import { MENTION_TVA, nomDeLEntreprise, nomDuNiveau, type LibellesDuDevis } from "@/config/tarifs";

/**
 * LES DEMANDES DE DEVIS ÉCRITES.
 *
 * Décision du propriétaire : « la vente se fait sur devis », pour toutes les offres. Le
 * formulaire de `/devis` recueille qui demande, pour quelle offre, pour combien
 * d'enseignants ou de managers ; ce service garde la demande, la relit pour
 * l'administration, la marque traitée, et compose les deux courriels : la notification
 * à l'adresse de contact, l'accusé au demandeur. La demande existe avant tout courriel.
 *
 * Même infrastructure que les demandes de simulation (orientation-request.service.ts) :
 * enregistrement d'abord, plafonds par adresse d'origine et par e-mail, envoi par
 * `lib/courriel.ts`, liste dans /admin.
 */

/** Plafonds : cinq demandes par adresse d'origine et par heure, une par e-mail toutes les dix minutes. */
export const PLAFOND_DEVIS_PAR_IP_PAR_HEURE = 5;
export const DELAI_MEME_EMAIL_MS = 10 * 60 * 1000;

export interface DemandeDeDevis {
  /** Le code de l'offre du catalogue (`/devis?offre=…`). */
  offre: string;
  /** Les libellés du formulaire de cette offre (le nom de l'offre, de l'organisation…). */
  libelles: LibellesDuDevis;
  nom: string;
  fonction: string;
  organisation: string;
  identifiant: string;
  effectif: number | null;
  /** L'entreprise souhaitée (Classe, Programme) ; null sinon. */
  entreprise?: string | null;
  /** Le niveau souhaité (Classe) ; null sinon. */
  niveau?: number | null;
  /**
   * Le demandeur ne veut que le cours : l'entreprise et le niveau d'arène étaient facultatifs.
   * Non enregistré en colonne (une demande Classe sans entreprise le dit déjà) ; il est écrit
   * dans le récapitulatif des deux courriels.
   */
  coursSeul?: boolean;
  email: string;
  message: string;
  ip: string | null;
  /**
   * LE CODE PROMO vérifié (services/catalogue.service.ts, `verifierUnCodePromo`) et le devis
   * qu'il donne. `cle` : l'établissement, pour un code à une utilisation par établissement.
   */
  promo?: { id: string; code: string; cle: string | null; devis: DevisChiffre } | null;
  /** L'affichage des prix est-il allumé ? Éteint, l'accusé au demandeur ne dit aucun montant. */
  montantsPublics?: boolean;
}

/** Ce qu'un code promo refuse au dernier moment : épuisé entre la vérification et l'envoi. */
export const CODE_EPUISE_A_L_ENVOI = "Ce code promo vient d'atteindre son nombre d'utilisations : envoyez la demande sans lui.";
export const CODE_DEJA_UTILISE = "Ce code promo a déjà été utilisé pour cet établissement.";

export async function deposerDemandeDeDevis(
  d: DemandeDeDevis,
  now: number = Date.now(),
): Promise<{ id: string } | { error: string }> {
  const email = d.email.trim().toLowerCase();
  if (d.ip) {
    const [compte] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(demandesDeDevis)
      .where(and(eq(demandesDeDevis.ip, d.ip), gt(demandesDeDevis.createdAt, new Date(now - 60 * 60 * 1000))));
    if ((compte?.n ?? 0) >= PLAFOND_DEVIS_PAR_IP_PAR_HEURE) {
      return { error: "Trop de demandes depuis cette connexion : réessayez dans une heure." };
    }
  }
  // Le plafond par destinataire, d'où que vienne la demande (config/plafonds-des-formulaires.ts).
  {
    const [parDestinataire] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(demandesDeDevis)
      .where(and(eq(demandesDeDevis.email, email), gt(demandesDeDevis.createdAt, new Date(now - FENETRE_PAR_DESTINATAIRE_MS))));
    if ((parDestinataire?.n ?? 0) >= PLAFOND_PAR_DESTINATAIRE_PAR_JOUR) return { error: REFUS_PAR_DESTINATAIRE };
  }
  const recente = await db
    .select({ id: demandesDeDevis.id })
    .from(demandesDeDevis)
    .where(and(eq(demandesDeDevis.email, email), gt(demandesDeDevis.createdAt, new Date(now - DELAI_MEME_EMAIL_MS))))
    .limit(1);
  if (recente.length > 0) {
    return { error: "Une demande vient d'être envoyée avec cette adresse : nous y répondons." };
  }
  // Le code promo : une utilisation se consomme sous le plafond, en une instruction ; si
  // la demande ne s'enregistre pas (déjà utilisé par l'établissement), elle est rendue.
  const promo = d.promo ?? null;
  if (promo && !(await consommerUneUtilisation(promo.id))) return { error: CODE_EPUISE_A_L_ENVOI };
  let ligne: { id: string } | undefined;
  try {
    [ligne] = await db
    .insert(demandesDeDevis)
    .values({
      offre: d.offre,
      nom: d.nom.trim(),
      fonction: d.fonction.trim(),
      organisation: d.organisation.trim(),
      identifiant: d.identifiant.trim(),
      effectif: d.effectif,
      entreprise: d.entreprise ?? null,
      niveau: d.niveau ?? null,
      email,
      message: d.message.trim(),
      ip: d.ip,
      codePromo: promo?.code ?? null,
      codePromoId: promo?.id ?? null,
      prixCatalogueCents: promo?.devis.prixCatalogueCents ?? null,
      remiseCents: promo?.devis.remiseCents ?? null,
      remiseLibelle: promo?.devis.remiseLibelle ?? null,
      prixRemiseCents: promo?.devis.prixRemiseCents ?? null,
      promoCle: promo?.cle ?? null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    })
    .returning({ id: demandesDeDevis.id });
  } catch (e) {
    if (promo) await rendreUneUtilisation(promo.id);
    if (promo && /demandes_de_devis_promo_uq|duplicate key/.test(String((e as { cause?: unknown })?.cause ?? e))) {
      return { error: CODE_DEJA_UTILISE };
    }
    throw e;
  }
  return { id: ligne!.id };
}

export async function marquerCourrielsDuDevis(
  id: string,
  envois: { notification: boolean; accuse: boolean },
): Promise<void> {
  await db
    .update(demandesDeDevis)
    .set({ notificationEnvoyee: envois.notification, accuseEnvoye: envois.accuse })
    .where(eq(demandesDeDevis.id, id));
}

export type DemandeDeDevisVue = typeof demandesDeDevis.$inferSelect;

export async function listerDemandesDeDevis(limite = 100): Promise<DemandeDeDevisVue[]> {
  return db.select().from(demandesDeDevis).orderBy(desc(demandesDeDevis.createdAt)).limit(limite);
}

export async function marquerDemandeDeDevisTraitee(id: string, adminId: string): Promise<void> {
  await db
    .update(demandesDeDevis)
    .set({ traiteePar: adminId, traiteeLe: new Date(), updatedAt: new Date() })
    .where(eq(demandesDeDevis.id, id));
}

/** Les lignes communes aux deux courriels : ce qui a été demandé. */
/**
 * Le code promo d'une demande, en lignes. `montants` : le devis chiffré (prix catalogue,
 * remise, prix remisé, prix nets), pour la notification interne, et pour le demandeur
 * seulement si l'affichage des prix est allumé ; sinon la phrase sans montant.
 */
export function lignesDuCodePromo(p: NonNullable<DemandeDeDevis["promo"]>, montants = true): string[] {
  if (!montants) return [`Code promo ${p.code} pris en compte : la remise sera appliquée à votre devis.`];
  const v = p.devis;
  return [
    `Code promo : ${p.code} (${v.remiseLibelle})`,
    v.prixCatalogueCents !== null ? `Prix catalogue : ${euros(v.prixCatalogueCents)} par an` : null,
    v.remiseCents !== null ? `Remise : ${euros(v.remiseCents)}` : null,
    v.prixRemiseCents !== null ? `Prix remisé : ${euros(v.prixRemiseCents)} par an` : "Prix remisé : établi au devis, remise comprise",
  ].filter((x): x is string => x !== null);
}

function recapitulatif(d: DemandeDeDevis, montants = true): string[] {
  const l = d.libelles;
  return [
    `Offre : ${l.offre}`,
    d.coursSeul ? "Intérêt : le cours seul, sans paramétrage de l'arène" : null,
    `${l.organisation} : ${d.organisation.trim()}`,
    d.identifiant.trim() ? `${l.identifiant.replace(/ \(facultatif\)$/, "")} : ${d.identifiant.trim()}` : null,
    d.entreprise ? `Entreprise souhaitée : ${nomDeLEntreprise(d.entreprise)}` : null,
    d.niveau ? `Niveau souhaité : ${nomDuNiveau(d.niveau)}` : null,
    d.effectif !== null ? `${l.effectif ?? "Effectif"} : ${d.effectif}` : null,
    ...(d.promo ? lignesDuCodePromo(d.promo, montants) : []),
    `Demandé par : ${d.nom.trim()}, ${d.fonction.trim()}`,
    `E-mail : ${d.email.trim()}`,
    "",
    "Message :",
    d.message.trim() || "(rien d'ajouté)",
  ].filter((x): x is string => x !== null);
}

/** Le courriel à l'adresse de contact : « Répondre » répond au demandeur. */
export function texteNotificationDevis(d: DemandeDeDevis): { sujet: string; texte: string } {
  return {
    sujet: `Demande de devis · ${d.libelles.offre} · ${d.organisation.trim()}`,
    texte: [
      "Demande de devis reçue depuis business-arena.fr/devis.",
      `Le devis est à établir au nom de ${VENDEUR.nom}. ${MENTION_TVA}.`,
      "",
      ...recapitulatif(d),
    ].join("\n"),
  };
}

/** L'accusé au demandeur : ce qu'il a demandé, qui y répond, et rien de promis de plus. */
export function texteAccuseDevis(d: DemandeDeDevis, contact: string): { sujet: string; texte: string } {
  return {
    sujet: `Votre demande de devis Business Arena · ${d.libelles.offre}`,
    texte: [
      "Bonjour,",
      "",
      `Votre demande de devis est enregistrée. Le devis vous sera adressé par écrit, établi par ${VENDEUR.nom} (${MENTION_TVA}).`,
      "",
      ...recapitulatif(d, d.montantsPublics === true),
      "",
      `Une question : ${contact}`,
    ].join("\n"),
  };
}
