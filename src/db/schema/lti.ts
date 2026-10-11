import {
  boolean,
  index,
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
import { episodeCohortes } from "./episodes";

/**
 * LTI 1.3 : BUSINESS ARENA COMME OUTIL EXTERNE D'UNE PLATEFORME D'ENSEIGNEMENT.
 *
 * Décision du propriétaire (octobre 2026) : « Oui, lance LTI 1.3 ». Un établissement
 * sous Moodle, Canvas, Blackboard ou Brightspace ajoute Business Arena comme outil
 * externe ; l'enseignant place une activité dans son cours ; l'élève clique et arrive
 * dans SA partie ou SA cohorte, sans compte ni code, sans e-mail stocké.
 *
 * Tout est additif (migration 0037) : aucune table existante ne change.
 */

/**
 * UNE PLATEFORME INSCRITE : l'émetteur (`iss`), l'identifiant que la plateforme a donné
 * à l'outil (`client_id`), les déploiements reconnus, et les trois adresses de la
 * plateforme (authentification OIDC, jeton, clés publiques). Elle est rattachée à UNE
 * organisation : c'est la licence de celle-ci qui s'applique à tout ce qui arrive par
 * cette plateforme.
 *
 * `sel` : la clé (aléatoire, propre à la plateforme) qui hache le `sub` des personnes.
 * On ne garde jamais le `sub` en clair.
 */
export const ltiPlateformes = pgTable(
  "lti_plateformes",
  {
    id: id(),
    nom: text("nom").notNull(),
    issuer: text("issuer").notNull(),
    clientId: text("client_id").notNull(),
    deploymentIds: jsonb("deployment_ids").$type<string[]>().notNull().default([]),
    urlAuthentification: text("url_authentification").notNull(),
    urlJeton: text("url_jeton").notNull(),
    urlJwks: text("url_jwks").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sel: text("sel").notNull(),
    /** « manuelle » (saisie dans /admin/lti) ou « dynamique » (inscription par jeton). */
    inscription: text("inscription").notNull().default("manuelle"),
    actif: boolean("actif").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("lti_plateformes_issuer_client_uq").on(t.issuer, t.clientId),
    index("lti_plateformes_org_idx").on(t.organizationId),
  ],
);

/**
 * LE JETON D'INSCRIPTION DYNAMIQUE : créé depuis /admin/lti pour une organisation, il
 * est porté par l'adresse à coller dans la plateforme. Usage unique, durée courte.
 */
export const ltiJetonsInscription = pgTable(
  "lti_jetons_inscription",
  {
    id: id(),
    jeton: text("jeton").notNull().unique(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    creePar: uuid("cree_par").references(() => users.id, { onDelete: "set null" }),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    utiliseLe: timestamp("utilise_le", { withTimezone: true }),
    plateformeId: uuid("plateforme_id").references(() => ltiPlateformes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lti_jetons_org_idx").on(t.organizationId)],
);

/**
 * LA CONNEXION OIDC EN COURS : le `state` et le `nonce` tirés à l'initiation. Le
 * lancement consomme la ligne (usage unique) : un `id_token` rejoué trouve son nonce
 * déjà utilisé. La vérification ne dépend pas du cookie, que les navigateurs qui
 * bloquent les cookies tiers ne renvoient pas.
 */
export const ltiNonces = pgTable(
  "lti_nonces",
  {
    id: id(),
    state: text("state").notNull().unique(),
    nonce: text("nonce").notNull().unique(),
    plateformeId: uuid("plateforme_id")
      .notNull()
      .references(() => ltiPlateformes.id, { onDelete: "cascade" }),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    utiliseLe: timestamp("utilise_le", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lti_nonces_expire_idx").on(t.expireLe)],
);

/**
 * UN TICKET À USAGE UNIQUE, de courte durée : la sélection de contenu (deep linking)
 * et l'ouverture en nouvelle fenêtre d'un lancement reçu dans une iframe passent par
 * lui, sans cookie.
 */
export const ltiTickets = pgTable(
  "lti_tickets",
  {
    id: id(),
    ticket: text("ticket").notNull().unique(),
    type: text("type").notNull(),
    plateformeId: uuid("plateforme_id")
      .notNull()
      .references(() => ltiPlateformes.id, { onDelete: "cascade" }),
    donnees: jsonb("donnees").$type<Record<string, unknown>>().notNull(),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    utiliseLe: timestamp("utilise_le", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lti_tickets_expire_idx").on(t.expireLe)],
);

/**
 * L'ACTIVITÉ PLACÉE DANS UN COURS (le « resource link ») et ce qu'elle ouvre : une
 * partie de classe ou une cohorte d'épisodes. Nulle tant que l'enseignant n'a pas
 * choisi.
 */
export const ltiLiens = pgTable(
  "lti_liens",
  {
    id: id(),
    plateformeId: uuid("plateforme_id")
      .notNull()
      .references(() => ltiPlateformes.id, { onDelete: "cascade" }),
    deploymentId: text("deployment_id").notNull(),
    resourceLinkId: text("resource_link_id").notNull(),
    contexteId: text("contexte_id"),
    contexteTitre: text("contexte_titre"),
    titre: text("titre"),
    /** « partie » ou « cohorte » ; nul tant que l'activité n'est pas configurée. */
    cibleType: text("cible_type"),
    gameId: uuid("game_id").references(() => games.id, { onDelete: "set null" }),
    cohorteId: uuid("cohorte_id").references(() => episodeCohortes.id, { onDelete: "set null" }),
    configurePar: uuid("configure_par").references(() => users.id, { onDelete: "set null" }),
    configureLe: timestamp("configure_le", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("lti_liens_ressource_uq").on(t.plateformeId, t.deploymentId, t.resourceLinkId),
  ],
);

/**
 * LA PERSONNE VENUE PAR LA PLATEFORME : son `sub` HACHÉ (jamais en clair) et le compte
 * qui lui correspond ici. Un enseignant reçoit un compte rattaché à l'organisation de la
 * plateforme ; un élève, une identité invitée (son pseudo, rien d'autre). Le courriel
 * n'est gardé que pour un ENSEIGNANT, et seulement si la plateforme l'envoie.
 */
export const ltiComptes = pgTable(
  "lti_comptes",
  {
    id: id(),
    plateformeId: uuid("plateforme_id")
      .notNull()
      .references(() => ltiPlateformes.id, { onDelete: "cascade" }),
    subHache: text("sub_hache").notNull(),
    /** « enseignant » ou « eleve ». */
    role: text("role").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courriel: text("courriel"),
    dernierLancement: timestamp("dernier_lancement", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("lti_comptes_sub_uq").on(t.plateformeId, t.subHache, t.role),
    index("lti_comptes_user_idx").on(t.userId),
  ],
);

/** LE JOURNAL DES REFUS : le motif, l'émetteur annoncé, jamais le jeton. */
export const ltiRefus = pgTable(
  "lti_refus",
  {
    id: id(),
    etape: text("etape").notNull(),
    motif: text("motif").notNull(),
    issuer: text("issuer"),
    plateformeId: uuid("plateforme_id").references(() => ltiPlateformes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lti_refus_date_idx").on(t.createdAt)],
);
