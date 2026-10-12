import { sql } from "drizzle-orm";
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
import { id, timestamps } from "./_shared";
import { organizations, users } from "./identity";
import { games } from "./game";

/**
 * L'EXAMEN INDIVIDUEL (migration 0042, /teacher/examens).
 *
 * Décision du propriétaire, après comparaison avec Capsim : « Lance l'examen individuel
 * façon Comp-XM. » L'enseignant crée un examen : une entreprise et un niveau de sa
 * licence, un nombre de tours, une durée par tour et/ou une fenêtre d'ouverture, les
 * questions de diagnostic ou non, le nombre de tentatives. Chaque candidat y joue SEUL
 * une partie solo contre les concurrents pilotés, sur le même scénario et le même niveau ;
 * la note se calcule sur une grille FIXE, copiée dans l'examen à sa création
 * (`grille`, config/examen/grille.ts) : elle ne change plus ensuite.
 *
 * Les graines : une seule (`mode_graine` = 'commune', le même marché pour tous) ou un lot
 * de graines d'égale difficulté ('lot', pour limiter la copie des décisions), tiré à la
 * création selon la règle de pedagogy/examen/lot.ts. Dans les deux cas, la note juge les
 * décisions rejouées sur trente marchés, pas le tirage.
 */
export const examens = pgTable(
  "examens",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    creePar: uuid("cree_par").references(() => users.id, { onDelete: "set null" }),
    nom: text("nom").notNull(),
    /** Le code donné aux candidats (/examen). */
    code: text("code").notNull(),
    /** L'entreprise choisie (code du registre, tête de famille) et le niveau. */
    scenarioCode: text("scenario_code").notNull(),
    niveau: integer("niveau").notNull(),
    tours: integer("tours").notNull(),
    /** La durée maximale d'un tour, en minutes ; null : pas de limite par tour. */
    dureeTourMinutes: integer("duree_tour_minutes"),
    /** La fenêtre d'ouverture ; null : ouverte dès la création, sans fin. */
    ouverture: timestamp("ouverture", { withTimezone: true }),
    fermeture: timestamp("fermeture", { withTimezone: true }),
    /** Les questions de diagnostic des situations sont-elles posées (et notées) ? */
    questions: boolean("questions").notNull().default(false),
    /** L'encart « Résultat estimé » est-il montré au candidat ? */
    resultatEstime: boolean("resultat_estime").notNull().default(true),
    /** Le nombre de tentatives par candidat (1 par défaut) ; la dernière remise compte. */
    tentatives: integer("tentatives").notNull().default(1),
    /** 'commune' : la même graine pour tous ; 'lot' : un lot de graines d'égale difficulté. */
    modeGraine: text("mode_graine", { enum: ["commune", "lot"] }).notNull(),
    graines: integer("graines").array().notNull(),
    /** La mesure du lot (pedagogy/examen/lot.ts, `LotDeGraines`) : rang commun, médiane, étendue. */
    equite: jsonb("equite"),
    /** La grille nommée et sa version, et sa COPIE figée à la création. */
    grilleCode: text("grille_code").notNull(),
    grilleVersion: integer("grille_version").notNull(),
    grille: jsonb("grille").notNull(),
    /** Les résultats sont-ils publiés aux candidats ? */
    publieLe: timestamp("publie_le", { withTimezone: true }),
    /** L'examen est-il clos (plus aucune entrée, copies en cours remises) ? */
    closLe: timestamp("clos_le", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("examens_code_uq").on(t.code),
    index("examens_org_idx").on(t.organizationId),
    index("examens_cree_par_idx").on(t.creePar),
  ],
);

/**
 * UN CANDIDAT, UNE TENTATIVE. Le candidat s'identifie par son compte, sa plateforme de
 * cours (LTI), son établissement (RENATER) ou un nom et un numéro d'étudiant saisis :
 * jamais d'adresse électronique (RGPD, comme les parties de classe). `user_id` est
 * l'identité qui joue (le cookie invité, retrouvé par le code de reprise).
 *
 * La NOTE est calculée à la remise, puis gardée avec son détail (lignes de la grille,
 * compétences, mesures) : elle ne bouge plus, même si le moteur évolue.
 */
export const examenCandidats = pgTable(
  "examen_candidats",
  {
    id: id(),
    examenId: uuid("examen_id")
      .notNull()
      .references(() => examens.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    numeroEtudiant: text("numero_etudiant"),
    identification: text("identification", { enum: ["compte", "lti", "renater", "saisie"] }).notNull(),
    tentative: integer("tentative").notNull().default(1),
    gameId: uuid("game_id").references(() => games.id, { onDelete: "set null" }),
    graine: integer("graine").notNull(),
    commenceLe: timestamp("commence_le", { withTimezone: true }).notNull().defaultNow(),
    remisLe: timestamp("remis_le", { withTimezone: true }),
    /** La note sur 100, une décimale ; null tant qu'elle n'est pas calculée. */
    note: doublePrecision("note"),
    /** Le détail de la note (config/examen/grille.ts, `CopieNotee`), ou la raison d'une copie sans note. */
    notation: jsonb("notation"),
    noteLe: timestamp("note_le", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("examen_candidats_examen_idx").on(t.examenId),
    uniqueIndex("examen_candidats_user_uq").on(t.examenId, t.userId, t.tentative),
    uniqueIndex("examen_candidats_numero_uq")
      .on(t.examenId, t.numeroEtudiant, t.tentative)
      .where(sql`${t.numeroEtudiant} IS NOT NULL`),
    uniqueIndex("examen_candidats_game_uq").on(t.gameId),
  ],
);
