import { and, desc, eq, gt, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { phoneAppointments } from "@/db/schema";
import {
  DUREE_MINUTES,
  HORIZON_JOURS,
  PLAFOND_PAR_IP_PAR_HEURE,
  PLAGES,
  PREAVIS_HEURES,
} from "@/config/rendez-vous";
import {
  creneauxDisponibles,
  libelleCreneau,
  parJour,
  type Creneau,
  type Intervalle,
  type JourDeCreneaux,
} from "@/lib/creneaux";
import {
  configurationGoogle,
  creerEvenement,
  periodesOccupees,
  supprimerEvenement,
  type ConfigGoogle,
} from "@/lib/google-agenda";

/**
 * LES RENDEZ-VOUS TÉLÉPHONIQUES.
 *
 * Ce que la page propose, ce qu'elle réserve, ce que l'administration relit.
 * Les créneaux sont les plages ouvertes (config/rendez-vous) moins deux
 * choses : ce que l'agenda Google dit occupé, et ce qui est déjà réservé ici.
 * Sans agenda configuré ou joignable, on propose les plages moins les
 * réservations, et la source le dit : mieux vaut un créneau à confirmer par
 * téléphone qu'une page qui n'en propose aucun.
 *
 * La réservation s'ÉCRIT d'abord, puis se pose dans l'agenda : la base est la
 * source de vérité, l'agenda une copie que la personne qui répond consulte.
 */

/** Ce dont le service a besoin du dehors ; remplaçable en test. */
export interface Dependances {
  agenda?: ConfigGoogle | null;
  poster?: typeof fetch;
}

const dependances = (d: Dependances) => ({
  agenda: d.agenda === undefined ? configurationGoogle() : d.agenda,
  poster: d.poster ?? fetch,
});

export interface CreneauxProposes {
  jours: JourDeCreneaux[];
  /** D'où vient l'occupation : l'agenda Google, ou seulement nos réservations. */
  source: "google" | "local";
  detail?: string;
}

async function reservationsAVenir(depuis: Date): Promise<Intervalle[]> {
  const rows = await db
    .select({ debut: phoneAppointments.startsAt, fin: phoneAppointments.endsAt })
    .from(phoneAppointments)
    .where(and(eq(phoneAppointments.status, "confirmed"), gte(phoneAppointments.endsAt, depuis)));
  return rows;
}

async function calculer(
  now: Date,
  deps: Dependances,
): Promise<{ creneaux: Creneau[]; source: "google" | "local"; detail?: string }> {
  const { agenda, poster } = dependances(deps);
  const fenetre = { debut: now, fin: new Date(now.getTime() + (HORIZON_JOURS + 1) * 86_400_000) };
  const [google, reserves] = await Promise.all([
    periodesOccupees(agenda, fenetre, poster),
    reservationsAVenir(now),
  ]);
  const occupes = google.ok ? [...google.valeur, ...reserves] : reserves;
  const creneaux = creneauxDisponibles({
    now,
    plages: PLAGES,
    dureeMinutes: DUREE_MINUTES,
    preavisMinutes: PREAVIS_HEURES * 60,
    horizonJours: HORIZON_JOURS,
    occupes,
  });
  return google.ok
    ? { creneaux, source: "google" }
    : { creneaux, source: "local", detail: `${google.raison}${google.detail ? ` : ${google.detail}` : ""}` };
}

export async function creneauxProposes(now: Date = new Date(), deps: Dependances = {}): Promise<CreneauxProposes> {
  const { creneaux, source, detail } = await calculer(now, deps);
  return { jours: parJour(creneaux), source, ...(detail ? { detail } : {}) };
}

export interface DemandeRendezVous {
  name: string;
  school: string;
  email: string;
  phone: string;
  message: string;
  /** Le début du créneau choisi, tel que la page l'a proposé. */
  debut: Date;
  ip: string | null;
}

export interface RendezVousPris {
  id: string;
  debut: Date;
  fin: Date;
  /** Le rendez-vous est-il posé dans l'agenda Google ? */
  dansAgenda: boolean;
  /** Pour les journaux : pourquoi il n'y est pas, le cas échéant. */
  detailAgenda?: string;
}

const estDoublon = (e: unknown): boolean => {
  const err = e as { code?: string; cause?: { code?: string }; message?: string };
  return err?.code === "23505" || err?.cause?.code === "23505" || /duplicate key/i.test(err?.message ?? "");
};

export async function reserverRendezVous(
  d: DemandeRendezVous,
  now: Date = new Date(),
  deps: Dependances = {},
): Promise<RendezVousPris | { error: string }> {
  if (d.ip) {
    const [compte] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(phoneAppointments)
      .where(
        and(eq(phoneAppointments.ip, d.ip), gt(phoneAppointments.createdAt, new Date(now.getTime() - 3_600_000))),
      );
    if ((compte?.n ?? 0) >= PLAFOND_PAR_IP_PAR_HEURE) {
      return { error: "Trop de réservations depuis cette connexion : réessayez dans une heure." };
    }
  }
  // Le créneau doit être un de ceux que la page propose EN CE MOMENT : ni
  // passé, ni hors plage, ni pris entre-temps dans l'agenda ou chez nous.
  const { creneaux } = await calculer(now, deps);
  const choisi = creneaux.find((c) => c.debut.getTime() === d.debut.getTime());
  if (!choisi) {
    return { error: "Ce créneau n'est plus disponible : choisissez-en un autre." };
  }
  let id: string;
  try {
    const [ligne] = await db
      .insert(phoneAppointments)
      .values({
        name: d.name.trim(),
        school: d.school.trim(),
        email: d.email.trim().toLowerCase(),
        phone: d.phone.trim(),
        message: d.message.trim(),
        startsAt: choisi.debut,
        endsAt: choisi.fin,
        ip: d.ip,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: phoneAppointments.id });
    id = ligne!.id;
  } catch (e) {
    if (estDoublon(e)) return { error: "Ce créneau vient d'être pris : choisissez-en un autre." };
    throw e;
  }

  const { agenda, poster } = dependances(deps);
  const pose = await creerEvenement(
    agenda,
    {
      titre: `Appel Business Arena · ${d.name.trim()} (${d.school.trim()})`,
      description: descriptionEvenement(d),
      debut: choisi.debut,
      fin: choisi.fin,
      invite: { email: d.email.trim().toLowerCase(), nom: d.name.trim() },
    },
    poster,
  );
  if (pose.ok) {
    await db
      .update(phoneAppointments)
      .set({ calendarEventId: pose.valeur.id, calendarLink: pose.valeur.lien, updatedAt: new Date() })
      .where(eq(phoneAppointments.id, id));
    return { id, debut: choisi.debut, fin: choisi.fin, dansAgenda: true };
  }
  return {
    id,
    debut: choisi.debut,
    fin: choisi.fin,
    dansAgenda: false,
    detailAgenda: `${pose.raison}${pose.detail ? ` : ${pose.detail}` : ""}`,
  };
}

export async function marquerConfirmationEnvoyee(id: string): Promise<void> {
  await db.update(phoneAppointments).set({ mailSent: true }).where(eq(phoneAppointments.id, id));
}

export interface RendezVousVue {
  id: string;
  name: string;
  school: string;
  email: string;
  phone: string;
  message: string;
  debut: Date;
  fin: Date;
  libelle: string;
  status: "confirmed" | "cancelled";
  dansAgenda: boolean;
  calendarLink: string | null;
  mailSent: boolean;
  aVenir: boolean;
}

/** Les rendez-vous, les plus proches d'abord ; les passés et annulés suivent. */
export async function listerRendezVous(limite = 50, now: Date = new Date()): Promise<RendezVousVue[]> {
  const rows = await db
    .select()
    .from(phoneAppointments)
    .orderBy(desc(phoneAppointments.startsAt))
    .limit(limite);
  const vues = rows.map((r) => ({
    id: r.id,
    name: r.name,
    school: r.school,
    email: r.email,
    phone: r.phone,
    message: r.message,
    debut: r.startsAt,
    fin: r.endsAt,
    libelle: libelleCreneau(r.startsAt),
    status: r.status,
    dansAgenda: r.calendarEventId !== null,
    calendarLink: r.calendarLink,
    mailSent: r.mailSent,
    aVenir: r.status === "confirmed" && r.endsAt.getTime() >= now.getTime(),
  }));
  // À venir en ordre chronologique, le reste du plus récent au plus ancien.
  const aVenir = vues.filter((v) => v.aVenir).sort((a, b) => a.debut.getTime() - b.debut.getTime());
  const autres = vues.filter((v) => !v.aVenir);
  return [...aVenir, ...autres];
}

/** Annule le rendez-vous, libère le créneau, retire l'événement de l'agenda si possible. */
export async function annulerRendezVous(
  id: string,
  adminId: string,
  deps: Dependances = {},
): Promise<{ retireDeLAgenda: boolean }> {
  const [ligne] = await db
    .update(phoneAppointments)
    .set({ status: "cancelled", cancelledBy: adminId, cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(phoneAppointments.id, id), eq(phoneAppointments.status, "confirmed")))
    .returning({ eventId: phoneAppointments.calendarEventId });
  if (!ligne?.eventId) return { retireDeLAgenda: false };
  const { agenda, poster } = dependances(deps);
  const retrait = await supprimerEvenement(agenda, ligne.eventId, poster);
  return { retireDeLAgenda: retrait.ok };
}

function descriptionEvenement(d: DemandeRendezVous): string {
  return [
    `Rendez-vous téléphonique pris sur business-arena.fr/rendez-vous.`,
    "",
    `Appeler : ${d.name.trim()} · ${d.school.trim()}`,
    `Téléphone : ${d.phone.trim()}`,
    `E-mail : ${d.email.trim()}`,
    "",
    "Sujet :",
    d.message.trim() || "(rien d'ajouté)",
  ].join("\n");
}

/** Le courriel à l'adresse de contact : qui appeler, quand, à quel numéro. */
export function texteNotification(d: DemandeRendezVous, rdv: RendezVousPris): { sujet: string; texte: string } {
  const quand = libelleCreneau(rdv.debut);
  const texte = [
    `Nouveau rendez-vous téléphonique, pris sur business-arena.fr/rendez-vous.`,
    "",
    `Quand : ${quand}`,
    `Appeler : ${d.name.trim()} · ${d.school.trim()}`,
    `Téléphone : ${d.phone.trim()}`,
    `E-mail : ${d.email.trim()}`,
    "",
    rdv.dansAgenda
      ? "Le rendez-vous est posé dans votre agenda Google, avec l'enseignant en invité."
      : "Le rendez-vous N'A PAS pu être posé dans votre agenda Google : notez-le à la main.",
    "",
    "Sujet :",
    d.message.trim() || "(rien d'ajouté)",
  ].join("\n");
  return { sujet: `Rendez-vous téléphonique · ${quand} · ${d.school.trim()}`, texte };
}

/** La confirmation à l'enseignant : le créneau, le numéro où on l'appelle, comment annuler. */
export function texteConfirmation(
  d: DemandeRendezVous,
  rdv: RendezVousPris,
  contact: string | null,
): { sujet: string; texte: string } {
  const quand = libelleCreneau(rdv.debut);
  const texte = [
    `Bonjour ${d.name.trim()},`,
    "",
    `Votre rendez-vous téléphonique est confirmé : ${quand}, pour ${DUREE_MINUTES} minutes.`,
    `Nous vous appelons au ${d.phone.trim()}.`,
    "",
    rdv.dansAgenda
      ? "Une invitation d'agenda vous parvient séparément ; acceptez-la pour garder le créneau sous les yeux."
      : "Notez ce créneau dans votre agenda.",
    contact
      ? `Pour déplacer ou annuler, répondez simplement à ce courriel ou écrivez à ${contact}.`
      : "Pour déplacer ou annuler, répondez simplement à ce courriel.",
    "",
    "À bientôt,",
    "Business Arena",
  ].join("\n");
  return { sujet: `Rendez-vous confirmé · ${quand}`, texte };
}
