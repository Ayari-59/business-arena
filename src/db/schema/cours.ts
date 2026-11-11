import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { id } from "./_shared";
import { organizations, users } from "./identity";

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
    /**
     * LA LIBÉRATION DES CHAPITRES (migration 0056, décision du propriétaire, novembre 2026) :
     * « tout » ouvre aux élèves tous les chapitres que l'offre permet ; « chapitre » n'ouvre que
     * ceux que l'enseignant a libérés (cours_liberations), avec les chapitres libres. Les classes
     * d'avant la règle restent en « tout ». La règle : services/chapitres-de-la-classe.ts.
     */
    liberation: text("liberation").$type<"tout" | "chapitre">().notNull().default("tout"),
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

/** Une étape d'une activité suivie : ce que la correction au serveur en a dit (pedagogy/cours/suivi-des-activites.ts). */
export interface EtapeDActiviteEnregistree {
  essais: number;
  manques: number;
  reussi: boolean;
  aide: boolean;
  faites?: string[];
}

/**
 * OÙ L'ÉLÈVE EN EST DANS UNE ACTIVITÉ : UN BUREAU, UNE ENQUÊTE, UN SCÉNARIO (migration 0057, décision
 * du propriétaire, novembre 2026). Une activité est corrigée au serveur : c'est l'action serveur qui
 * écrit cette ligne, d'après sa propre correction, jamais d'après ce que dit le navigateur. Sans ligne,
 * l'élève n'a pas commencé. Rien de plus que le suivi des chapitres : l'élève est celui de sa classe,
 * sous le prénom ou le pseudonyme qu'il y a donné (cours_eleves).
 */
export const coursActivites = pgTable(
  "cours_activites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classeId: uuid("classe_id")
      .notNull()
      .references(() => coursClasses.id, { onDelete: "cascade" }),
    /** « bureau », « enquete » ou « scenario ». */
    nature: text("nature").$type<"bureau" | "enquete" | "scenario">().notNull(),
    /** Le code de l'activité dans config/cours/{bureaux,enquetes,scenarios}. */
    code: text("code").notNull(),
    /** « en-cours », « reussi », « termine » (avec la correction) ou « fini » (un scénario). */
    etat: text("etat").$type<"en-cours" | "reussi" | "termine" | "fini">().notNull().default("en-cours"),
    /** Les gestes corrigés (bureau, enquête) ; les parties commencées (scénario). */
    essais: integer("essais").notNull().default(0),
    etapes: jsonb("etapes").$type<Record<string, EtapeDActiviteEnregistree>>().notNull().default({}),
    /** Les remarques du correcteur sur les essais manqués, par étape, bornées. */
    erreurs: jsonb("erreurs").$type<Record<string, string[]>>().notNull().default({}),
    /** Le scénario : la fin retenue, et si c'est celle de la meilleure suite. */
    fin: text("fin"),
    meilleure: boolean("meilleure"),
    majLe: timestamp("maj_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.classeId, t.nature, t.code] }),
    index("cours_activites_classe_idx").on(t.classeId),
  ],
);

/**
 * LES CHAPITRES QU'UN ENSEIGNANT A LIBÉRÉS À SA CLASSE (migration 0056), quand elle les libère
 * un par un (`liberation` = « chapitre »). Un chapitre libéré ouvre aussi son cas pratique.
 */
export const coursLiberations = pgTable(
  "cours_liberations",
  {
    classeId: uuid("classe_id")
      .notNull()
      .references(() => coursClasses.id, { onDelete: "cascade" }),
    /** Le code d'un chapitre de config/cours/registre.ts. */
    chapitre: text("chapitre").notNull(),
    libereLe: timestamp("libere_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.classeId, t.chapitre] })],
);

/**
 * LES PARCOURS QUE L'ADMIN ATTRIBUE (migration 0056, décision du propriétaire, novembre 2026).
 * L'offre ouvre le cours ; une liste d'attribution le RESTREINT à ces parcours. La liste d'un
 * enseignant l'emporte sur celle de son établissement ; sans liste, l'offre seule s'applique.
 * La règle : services/chapitres-de-la-classe.ts (`parcoursAttribues`, `dansLesAttributions`).
 */
export const coursAttributionsEtablissement = pgTable(
  "cours_attributions_etablissement",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** Un code de PARCOURS_A_CHOISIR (config/cours/parcours-de-formation.ts). */
    parcours: text("parcours").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.parcours] })],
);

export const coursAttributionsEnseignant = pgTable(
  "cours_attributions_enseignant",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parcours: text("parcours").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.parcours] })],
);
