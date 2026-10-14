import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./identity";

/**
 * LES CONNEXIONS À DES SERVICES EXTÉRIEURS, réglées depuis l'administration.
 *
 * Une ligne par service (« google_agenda »), une valeur JSON dont les
 * secrets sont chiffrés (lib/chiffrement) avec une clé dérivée du secret de
 * l'hébergement : la base seule ne suffit pas à s'en servir. Ce qui se règle
 * d'un clic vit ici ; ce qui se règle dans l'hébergement reste dans
 * l'environnement, et l'environnement l'emporte quand les deux existent.
 */
export const integrations = pgTable("integrations", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
