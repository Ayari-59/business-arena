import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { users } from "./identity";
import { ltiLiens } from "./lti";

/**
 * LE RETOUR DES NOTES DANS LE CARNET DE LA PLATEFORME (LTI Advantage, Assignment and
 * Grade Services 1.3 ; migration 0043, src/lti/ags).
 *
 * Tout est additif : deux tables neuves et cinq colonnes de `lti_liens`.
 */

/**
 * L'ÉLÈVE D'UNE ACTIVITÉ QUI ACCORDE LE RETOUR DES NOTES, et son identifiant chez la
 * plateforme (`sub`). La note s'adresse à cet identifiant et à lui seul : c'est la seule
 * donnée gardée en plus, et elle l'est CHIFFRÉE (AES-256-GCM, clé tirée du secret de
 * l'hébergement, lib/chiffrement.ts) : une copie de la base ne suffit pas à la lire. Une
 * activité sans service de notes n'écrit rien ici.
 */
export const ltiNotesEleves = pgTable(
  "lti_notes_eleves",
  {
    id: id(),
    lienId: uuid("lien_id")
      .notNull()
      .references(() => ltiLiens.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subChiffre: text("sub_chiffre").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("lti_notes_eleves_uq").on(t.lienId, t.userId),
    index("lti_notes_eleves_user_idx").on(t.userId),
  ],
);

/**
 * LE JOURNAL D'ENVOI : une ligne par activité et par élève. Elle dit ce qui doit partir
 * (`nature` : une note, son retrait, une progression), pour quelle ressource
 * (« examen:<id> », « partie:<id> »), et ce qu'il en est advenu : l'état, le code HTTP
 * de la plateforme, un message lisible, le nombre d'essais. Une erreur temporaire
 * (plateforme injoignable, erreur 5xx) se retente d'elle-même ; les autres attendent
 * le bouton « Renvoyer les notes ».
 */
export const ltiNotesEnvois = pgTable(
  "lti_notes_envois",
  {
    id: id(),
    lienId: uuid("lien_id")
      .notNull()
      .references(() => ltiLiens.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ressource: text("ressource").notNull(),
    nature: text("nature", { enum: ["note", "retrait", "commencee", "terminee"] }).notNull(),
    /** La note sur 100 (une décimale), pour une `nature` « note » seulement. */
    note: doublePrecision("note"),
    commentaire: text("commentaire"),
    etat: text("etat", { enum: ["a-envoyer", "envoi", "envoye", "erreur"] }).notNull().default("a-envoyer"),
    /** L'erreur est-elle temporaire (nouvel essai de lui-même) ? */
    temporaire: boolean("temporaire").notNull().default(false),
    codeHttp: integer("code_http"),
    message: text("message"),
    essais: integer("essais").notNull().default(0),
    dernierEssai: timestamp("dernier_essai", { withTimezone: true }),
    prochainEssai: timestamp("prochain_essai", { withTimezone: true }),
    envoyeLe: timestamp("envoye_le", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("lti_notes_envois_uq").on(t.lienId, t.userId),
    index("lti_notes_envois_ressource_idx").on(t.ressource),
  ],
);
