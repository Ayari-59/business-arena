import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { demandesDeDevis } from "@/db/schema";
import { VENDEUR } from "@/config/editeur";
import { LIBELLES_DU_DEVIS, MENTION_TVA, type OffreDuDevis } from "@/config/tarifs";

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
  offre: OffreDuDevis;
  nom: string;
  fonction: string;
  organisation: string;
  identifiant: string;
  effectif: number | null;
  email: string;
  message: string;
  ip: string | null;
}

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
  const recente = await db
    .select({ id: demandesDeDevis.id })
    .from(demandesDeDevis)
    .where(and(eq(demandesDeDevis.email, email), gt(demandesDeDevis.createdAt, new Date(now - DELAI_MEME_EMAIL_MS))))
    .limit(1);
  if (recente.length > 0) {
    return { error: "Une demande vient d'être envoyée avec cette adresse : nous y répondons." };
  }
  const [ligne] = await db
    .insert(demandesDeDevis)
    .values({
      offre: d.offre,
      nom: d.nom.trim(),
      fonction: d.fonction.trim(),
      organisation: d.organisation.trim(),
      identifiant: d.identifiant.trim(),
      effectif: d.effectif,
      email,
      message: d.message.trim(),
      ip: d.ip,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    })
    .returning({ id: demandesDeDevis.id });
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
function recapitulatif(d: DemandeDeDevis): string[] {
  const l = LIBELLES_DU_DEVIS[d.offre];
  return [
    `Offre : ${l.offre}`,
    `${l.organisation} : ${d.organisation.trim()}`,
    d.identifiant.trim() ? `${l.identifiant.replace(/ \(facultatif\)$/, "")} : ${d.identifiant.trim()}` : null,
    d.effectif !== null ? `${l.effectif} : ${d.effectif}` : null,
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
    sujet: `Demande de devis · ${LIBELLES_DU_DEVIS[d.offre].offre} · ${d.organisation.trim()}`,
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
    sujet: `Votre demande de devis Business Arena · ${LIBELLES_DU_DEVIS[d.offre].offre}`,
    texte: [
      "Bonjour,",
      "",
      `Votre demande de devis est enregistrée. Le devis vous sera adressé par écrit, établi par ${VENDEUR.nom} (${MENTION_TVA}).`,
      "",
      ...recapitulatif(d),
      "",
      `Une question : ${contact}`,
    ].join("\n"),
  };
}
