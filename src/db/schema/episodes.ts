import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id } from "./_shared";
import { users } from "./identity";

/**
 * LES PARTIES D'ÉPISODES MANAGER, telles qu'elles ont été jouées.
 *
 * On garde les faits bruts, jamais les scores : les choix, les informations
 * consultées, le diagnostic, la prévision. Tout le reste — qualité,
 * robustesse, compétences, profil — se recalcule à partir d'eux, et une
 * erreur de calcul se corrige sans toucher aux données. La version du modèle
 * de l'épisode est notée : un moteur corrigé change ce que valait chaque
 * option, et le profil doit pouvoir le dire.
 *
 * Aucun texte libre n'est stocké.
 */
export const episodeParties = pgTable(
  "episode_parties",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Tirée par le navigateur au début de la partie : recharger le bilan n'écrit pas deux fois. */
    cle: uuid("cle").notNull(),
    episodeCode: text("episode_code").notNull(),
    versionModele: integer("version_modele").notNull(),
    niveau: text("niveau").notNull(),
    graine: integer("graine").notNull(),
    chemin: jsonb("chemin").$type<number[]>().notNull(),
    consultes: jsonb("consultes").$type<string[][]>().notNull(),
    jours: doublePrecision("jours").notNull(),
    diagnostic: text("diagnostic").notNull(),
    reevaluation: jsonb("reevaluation")
      .$type<{ choix: "maintient" | "corrige"; principal: string | null }>()
      .notNull(),
    prevision: doublePrecision("prevision").notNull(),
    confiance: integer("confiance").notNull(),
    /** La première partie de cet épisode pour cette personne : la seule qui compte au profil. */
    premiere: boolean("premiere").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("episode_parties_cle_uq").on(t.userId, t.cle),
    index("episode_parties_user_idx").on(t.userId, t.createdAt),
  ],
);

/**
 * UNE COHORTE : un groupe de managers d'une même entreprise qui suivent le
 * programme ensemble. Elle se rejoint par son code ; l'animateur la suit par
 * une clé secrète, sans compte, et ne voit que des agrégats.
 */
export const episodeCohortes = pgTable("episode_cohortes", {
  id: id(),
  /** Le code à donner aux managers, dans le lien d'invitation. */
  code: text("code").notNull().unique(),
  nom: text("nom").notNull(),
  /** La clé du lien de l'animateur : elle ouvre la vue agrégée, rien d'autre. */
  cleAnimateur: text("cle_animateur").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** L'appartenance d'une personne à une cohorte : une seule à la fois. */
export const episodeMembres = pgTable(
  "episode_membres",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    cohorteId: uuid("cohorte_id")
      .notNull()
      .references(() => episodeCohortes.id, { onDelete: "cascade" }),
    depuis: timestamp("depuis", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("episode_membres_cohorte_idx").on(t.cohorteId)],
);

/** Le code qui rend son profil à une personne, depuis n'importe quel appareil. */
export const episodeReprises = pgTable("episode_reprises", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
