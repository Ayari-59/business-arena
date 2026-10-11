import { sql } from "drizzle-orm";
import {
  boolean,
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
import { users } from "./identity";

/**
 * LE CATALOGUE COMMERCIAL, EN BASE (migration 0041, /admin/offres).
 *
 * Demande du propriétaire : « gérer l'offre depuis le panneau admin, les gratuités, la
 * composition de plusieurs modules, les remises, les promos ». Ce qui était figé dans
 * config/tarifs.ts vit ici ; config/tarifs.ts reste la valeur par défaut (base vide,
 * tests) et la source des textes juridiques. Les formes (types, règles, rendu) sont dans
 * config/catalogue.ts ; la lecture en cache et l'écriture journalisée, dans
 * services/catalogue.service.ts.
 */

/**
 * LES MODULES : les briques vendables. `effet` dit ce que le produit en fait :
 * 'arene' et 'episodes' sont lus par services/acces.service.ts (au travers des licences
 * qui les portent) ; null, le module est descriptif : affiché, vendu, sans verrou.
 */
export const catalogueModules = pgTable("catalogue_modules", {
  code: text("code").primaryKey(),
  nom: text("nom").notNull(),
  description: text("description").notNull().default(""),
  effet: text("effet", { enum: ["arene", "episodes"] }),
  actif: boolean("actif").notNull().default(true),
  ordre: integer("ordre").notNull().default(0),
  ...timestamps,
});

/**
 * LES OFFRES : une composition de modules, des limites, un prix, et ce que la carte de
 * /tarifs en dit. Les textes peuvent porter des variables (`{entreprises}`…) que le
 * rendu remplit : un nombre tiré du produit ne s'écrit pas en base (CLAUDE.md).
 */
export const catalogueOffres = pgTable(
  "catalogue_offres",
  {
  code: text("code").primaryKey(),
  rubrique: text("rubrique", { enum: ["arene", "reseau", "episodes", "option"] }).notNull(),
  public: text("public", { enum: ["enseignement", "entreprises"] }).notNull(),
  nom: text("nom").notNull(),
  sousTitre: text("sous_titre").notNull().default(""),
  tarif: text("tarif", { enum: ["gratuit", "prix", "devis", "inclus", "etude"] }).notNull(),
  /** Le prix de référence annuel, en centimes ; null hors tarif « prix ». */
  prixCents: integer("prix_cents"),
  /** Ce que la ligne d'option affiche à la place du tarif (« Incluse ») ; null : le libellé du tarif. */
  libelleTarif: text("libelle_tarif"),
  inclus: jsonb("inclus").$type<string[]>().notNull().default([]),
  precisions: jsonb("precisions").$type<string[]>().notNull().default([]),
  formules: jsonb("formules").$type<{ nom: string; inclus: string[] }[]>().notNull().default([]),
  modules: jsonb("modules").$type<unknown[]>().notNull().default([]),
  mention: jsonb("mention"),
  ordre: integer("ordre").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  miseEnAvant: boolean("mise_en_avant").notNull().default(false),
  boutonLibelle: text("bouton_libelle").notNull().default(""),
  boutonCible: text("bouton_cible").notNull().default(""),
  devisLibelle: text("devis_libelle"),
  formulaire: text("formulaire", { enum: ["etablissement", "reseau", "entreprise"] })
    .notNull()
    .default("etablissement"),
  ...timestamps,
  },
  // Une seule offre mise en avant (le seul bouton plein de /tarifs).
  (t) => [uniqueIndex("catalogue_offres_une_en_avant_uq").on(t.miseEnAvant).where(sql`${t.miseEnAvant}`)],
);

/**
 * LES RÉGLAGES DU CATALOGUE : 'decouverte' (les niveaux ouverts en solo, les épisodes de
 * démonstration et leur niveau ; héritier du réglage « vitrine solo » de
 * platform_settings), 'essai' (la période d'essai d'établissement, désactivée par
 * défaut) et 'affichage' (les prix de référence sur les pages publiques, éteints par
 * défaut : les offres se font sur mesure, sur devis).
 */
export const catalogueReglages = pgTable("catalogue_reglages", {
  cle: text("cle").primaryKey(),
  valeur: jsonb("valeur").notNull(),
  modifiePar: uuid("modifie_par").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

/**
 * LES CODES PROMO, saisis par le client dans /devis. Une utilisation est une demande de
 * devis enregistrée avec le code (`demandes_de_devis.code_promo_id`) ; `utilisations`
 * en tient le compte, incrémenté sous condition dans la même instruction que la
 * vérification du plafond. `affiche` : la promotion datée qui porte le bandeau de
 * /tarifs (une seule à la fois, index unique partiel).
 */
export const codesPromo = pgTable(
  "codes_promo",
  {
    id: id(),
    code: text("code").notNull().unique(),
    typeRemise: text("type_remise", { enum: ["pourcentage", "montant"] }).notNull(),
    /** Un pourcentage (1 à 100), ou un montant en centimes. */
    valeur: integer("valeur").notNull(),
    /** Les codes des offres concernées ; null : toutes. */
    offres: text("offres").array(),
    debut: timestamp("debut", { withTimezone: true }),
    fin: timestamp("fin", { withTimezone: true }),
    utilisationsMax: integer("utilisations_max"),
    utilisations: integer("utilisations").notNull().default(0),
    unParEtablissement: boolean("un_par_etablissement").notNull().default(true),
    actif: boolean("actif").notNull().default(true),
    affiche: boolean("affiche").notNull().default(false),
    creePar: uuid("cree_par").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  // Une seule promotion affichée à la fois.
  (t) => [uniqueIndex("codes_promo_un_bandeau_uq").on(t.affiche).where(sql`${t.affiche}`)],
);

/**
 * L'HISTORIQUE : chaque modification du catalogue, d'une promotion ou d'une gratuité
 * (qui, quand, avant, après). Le nom de l'auteur est copié : il reste lisible si le
 * compte disparaît.
 */
export const catalogueJournal = pgTable(
  "catalogue_journal",
  {
    id: id(),
    quand: timestamp("quand", { withTimezone: true }).notNull().defaultNow(),
    auteurId: uuid("auteur_id").references(() => users.id, { onDelete: "set null" }),
    auteur: text("auteur").notNull().default(""),
    objet: text("objet").notNull(),
    cle: text("cle").notNull(),
    action: text("action").notNull(),
    avant: jsonb("avant"),
    apres: jsonb("apres"),
  },
  (t) => [index("catalogue_journal_quand_idx").on(t.quand)],
);
