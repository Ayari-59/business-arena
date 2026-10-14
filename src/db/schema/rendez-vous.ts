import { sql } from "drizzle-orm";
import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { users } from "./identity";

/** Un rendez-vous tient (`confirmed`) jusqu'à ce qu'un administrateur l'annule. */
export const appointmentStatus = pgEnum("appointment_status", ["confirmed", "cancelled"]);

/**
 * LE RENDEZ-VOUS TÉLÉPHONIQUE — un créneau réservé depuis /rendez-vous.
 *
 * La page propose les créneaux que l'agenda Google laisse libres ; quand un
 * enseignant en prend un, la réservation est écrite ICI d'abord, puis posée
 * dans l'agenda. La base reste la source de vérité : si l'agenda est
 * injoignable, le rendez-vous existe quand même, se lit dans
 * l'administration et bloque son créneau pour les suivants.
 *
 * Deux réservations ne peuvent pas porter le même créneau tant qu'elles
 * tiennent : l'index unique partiel le garantit sous concurrence, là où une
 * vérification avant insertion laisserait passer deux clics simultanés.
 */
export const phoneAppointments = pgTable(
  "phone_appointments",
  {
    id: id(),
    /** Qui appelle-t-on. */
    name: text("name").notNull(),
    school: text("school").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    /** De quoi il veut parler ; vide s'il n'a rien ajouté. */
    message: text("message").notNull().default(""),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatus("status").notNull().default("confirmed"),
    /** L'événement posé dans l'agenda Google ; NULL s'il n'a pas pu l'être. */
    calendarEventId: text("calendar_event_id"),
    calendarLink: text("calendar_link"),
    /** La confirmation à l'enseignant est-elle partie ? */
    mailSent: boolean("mail_sent").notNull().default(false),
    /** Adresse d'origine, pour la limitation ; NULL hors proxy. */
    ip: text("ip"),
    cancelledBy: uuid("cancelled_by").references(() => users.id, { onDelete: "set null" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("phone_appointments_slot_idx")
      .on(t.startsAt)
      .where(sql`${t.status} = 'confirmed'`),
    index("phone_appointments_starts_idx").on(t.startsAt),
    index("phone_appointments_ip_idx").on(t.ip, t.createdAt),
  ],
);
