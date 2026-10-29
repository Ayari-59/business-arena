import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { id } from "./_shared";
import { users } from "./identity";

/**
 * LE COURS PAR LA SIMULATION, SUIVI EN CLASSE.
 *
 * L'enseignant crée une classe ; ses élèves la rejoignent par son code, sous un prénom ou
 * un pseudonyme, sans compte. Chaque chapitre qu'ils suivent remonte où ils en sont, étape
 * par étape, et les remarques du correcteur sur leurs essais manqués : l'enseignant voit
 * qui avance, qui bloque, et les erreurs qui reviennent dans la classe.
 */

/** Une classe du cours, créée par un enseignant depuis son espace (/teacher/cours). */
export const coursClasses = pgTable(
  "cours_classes",
  {
    id: id(),
    /** Le code à donner aux élèves, au tableau ou dans le lien d'invitation. */
    code: text("code").notNull().unique(),
    nom: text("nom").notNull(),
    creePar: uuid("cree_par")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** L'entreprise du cas, imposée à toute la classe. Nulle : chaque élève choisit. */
    entreprise: text("entreprise"),
    /**
     * LE PARCOURS DU COURS DE LA CLASSE (migration 0052) : un code de config/cours/registre.ts.
     * Sous l'offre Classe ou Programme, c'est lui qui ouvre les chapitres réservés (les
     * chapitres de ce parcours) ; sous Campus, tout est ouvert. Nul : aucun parcours choisi.
     */
    parcours: text("parcours"),
    /**
     * CLASSE D'AVANT LE PARCOURS (migration 0052) : créée avant la règle, elle garde l'accès
     * d'avant (tout le cours sous licence) tant que son parcours est nul ; son enseignant est
     * invité à le choisir. Une classe créée depuis porte toujours un parcours.
     */
    heritee: boolean("heritee").notNull().default(false),
    /** Close : plus de nouvel élève. Les progressions déjà remontées restent lisibles. */
    closeLe: timestamp("close_le", { withTimezone: true }),
    /** La calculatrice retirée à la classe (une évaluation de calcul mental) ; permise par défaut. */
    sansCalculatrice: boolean("sans_calculatrice").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cours_classes_cree_par_idx").on(t.creePar)],
);

/** Un élève dans une classe : une seule classe à la fois, en rejoindre une autre la remplace. */
export const coursEleves = pgTable(
  "cours_eleves",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    classeId: uuid("classe_id")
      .notNull()
      .references(() => coursClasses.id, { onDelete: "cascade" }),
    /** Le prénom ou le pseudonyme que l'élève a donné en rejoignant. */
    nom: text("nom").notNull(),
    depuis: timestamp("depuis", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cours_eleves_classe_idx").on(t.classeId)],
);

/** Où l'élève en est dans un chapitre : sa progression, telle que le chapitre la garde. */
export interface SuiviDEtapeEnregistre {
  essais: number;
  reussi: boolean;
  aide: boolean;
}

export const coursProgressions = pgTable(
  "cours_progressions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classeId: uuid("classe_id")
      .notNull()
      .references(() => coursClasses.id, { onDelete: "cascade" }),
    chapitre: text("chapitre").notNull(),
    entreprise: text("entreprise").notNull(),
    /** L'étape la plus avancée atteinte ; égale au nombre d'étapes, le chapitre est fini. */
    etape: integer("etape").notNull().default(0),
    etapes: jsonb("etapes").$type<Record<string, SuiviDEtapeEnregistre>>().notNull().default({}),
    /** Les remarques du correcteur sur les essais manqués, par étape. */
    erreurs: jsonb("erreurs").$type<Record<string, string[]>>().notNull().default({}),
    majLe: timestamp("maj_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.classeId, t.chapitre] }),
    index("cours_progressions_classe_idx").on(t.classeId, t.chapitre),
  ],
);
