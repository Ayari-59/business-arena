import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { users } from "./identity";
import { games, teams } from "./game";
import type { CritereDesPairs, MomentDesPairs } from "@/config/pairs/criteres";

/**
 * L'ÉVALUATION ENTRE COÉQUIPIERS D'UNE PARTIE DE CLASSE (migration 0044).
 *
 * Une ligne par partie, posée par l'enseignant qui l'active : quand on évalue, sur quels
 * critères, avec ou sans auto-évaluation et commentaire, les bornes du facteur, le barème
 * de la note d'équipe, la version de la méthode (config/pairs/calcul.ts). Tout part avec
 * la partie (cascade) : rien ne survit à sa suppression. Aucune adresse électronique.
 */
export const pairsEvaluations = pgTable("pairs_evaluations", {
  gameId: uuid("game_id")
    .primaryKey()
    .references(() => games.id, { onDelete: "cascade" }),
  active: boolean("active").notNull().default(true),
  moments: text("moments").array().$type<MomentDesPairs[]>().notNull(),
  criteres: jsonb("criteres").$type<CritereDesPairs[]>().notNull(),
  autoEvaluation: boolean("auto_evaluation").notNull().default(false),
  commentaire: boolean("commentaire").notNull().default(true),
  borneBasse: doublePrecision("borne_basse").notNull(),
  borneHaute: doublePrecision("borne_haute").notNull(),
  bareme: integer("bareme").notNull().default(20),
  methodeVersion: integer("methode_version").notNull(),
  creePar: uuid("cree_par").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

/**
 * UN MOMENT D'ÉVALUATION (mi-parcours, fin) : sa publication et les notes d'équipe que
 * l'enseignant saisit, par équipe ({ teamId: note }). Absente tant que l'enseignant n'a
 * rien publié ni saisi.
 */
export const pairsMoments = pgTable(
  "pairs_moments",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    moment: text("moment", { enum: ["mi_parcours", "fin"] }).$type<MomentDesPairs>().notNull(),
    publieLe: timestamp("publie_le", { withTimezone: true }),
    notesDEquipe: jsonb("notes_d_equipe").$type<Record<string, number>>().notNull().default({}),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.gameId, t.moment] })],
);

/**
 * UNE RÉPONSE : ce qu'un étudiant donne à un coéquipier (ou à lui-même), critère par
 * critère, et son commentaire facultatif. L'auteur n'est lu que par l'enseignant de la
 * partie ; l'étudiant évalué ne reçoit que des moyennes, après publication.
 */
export const pairsReponses = pgTable(
  "pairs_reponses",
  {
    id: id(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    moment: text("moment", { enum: ["mi_parcours", "fin"] }).$type<MomentDesPairs>().notNull(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    evaluateurId: uuid("evaluateur_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evalueId: uuid("evalue_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notes: jsonb("notes").$type<Record<string, number>>().notNull(),
    commentaire: text("commentaire"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("pairs_reponses_uq").on(t.gameId, t.moment, t.evaluateurId, t.evalueId),
    index("pairs_reponses_equipe_idx").on(t.gameId, t.moment, t.teamId),
  ],
);
