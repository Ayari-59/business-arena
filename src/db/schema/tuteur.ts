import { integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./identity";
import { games } from "./game";

/**
 * LES QUESTIONS POSÉES AU TUTEUR IA (migration 0050, services/tuteur.service.ts) : un
 * compteur par partie et par élève, pour tenir le quota (config/tuteur.ts). Le texte des
 * questions n'est pas gardé : seul leur nombre l'est. La ligne part avec la partie ou
 * avec l'élève.
 */
export const tuteurQuestions = pgTable(
  "tuteur_questions",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nombre: integer("nombre").notNull().default(0),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.gameId, t.userId] })],
);
