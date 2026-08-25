import { timestamp, uuid } from "drizzle-orm/pg-core";

/** Colonnes communes à toutes les tables (conventions doc 05). */
export const id = () => uuid("id").primaryKey().defaultRandom();

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
