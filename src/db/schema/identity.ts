import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";

export const orgKind = pgEnum("org_kind", ["school", "company", "public"]);
export const orgRole = pgEnum("org_role", ["student", "teacher", "org_admin"]);

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // null si connexion par magic link (ADR-08)
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  locale: text("locale").notNull().default("fr"),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  /**
   * Version de session : incrémentée par « Se déconnecter partout ». Un cookie
   * signé pour une version antérieure est refusé, quel que soit son délai.
   */
  sessionVersion: integer("session_version").notNull().default(1),
  /**
   * LE CONSENTEMENT AUX NOUVEAUTÉS (migration 0040, services/nouveautes.service.ts) : la
   * date de l'accord, la version du texte accepté, la date du retrait. Le compte consent
   * quand l'accord est plus récent que le retrait. Jamais coché par défaut.
   */
  nouveautesConsentiesLe: timestamp("nouveautes_consenties_le", { withTimezone: true }),
  nouveautesRetireesLe: timestamp("nouveautes_retirees_le", { withTimezone: true }),
  nouveautesVersionDuTexte: text("nouveautes_version_du_texte"),
  /** La dernière connexion (mot de passe, inscription, LTI, RENATER) ; nulle avant 0040. */
  derniereConnexionLe: timestamp("derniere_connexion_le", { withTimezone: true }),
  /**
   * D'où vient le compte : 'inscription' (formulaire du site), 'lti', 'renater'
   * (fédération). Nulle pour une identité d'élève ou d'invité, qui n'est pas un inscrit.
   */
  provenance: text("provenance", { enum: ["inscription", "lti", "renater"] }),
  /**
   * DÉSACTIVÉ (migration 0040, /admin/inscrits) : le compte ne se connecte plus et sa session
   * est refusée (lib/session.ts) ; ses parties restent. Nul : actif.
   */
  desactiveLe: timestamp("desactive_le", { withTimezone: true }),
  /**
   * INSCRIT PAR UN CODE D'INVITATION (migration 0040) : le code saisi à l'inscription. Il
   * donne l'état « invité » dans /admin/inscrits et l'usage de chaque code. Nul : inscription
   * libre, LTI, RENATER, ou compte d'avant 0040.
   */
  invitationId: uuid("invitation_id").references((): AnyPgColumn => orgInvites.id, { onDelete: "set null" }),
  /**
   * L'ADRESSE CONFIRMÉE (migration 0046, services/confirmation-email.service.ts) : la date
   * où le titulaire a ouvert le lien reçu à cette adresse. Nulle : jamais confirmée. Sans
   * elle, un compte ne devient pas administrateur de la plateforme et son établissement ne
   * reçoit pas de licence. L'essai, lui, reste ouvert.
   */
  emailConfirmeLe: timestamp("email_confirme_le", { withTimezone: true }),
  /** Le dernier lien de confirmation envoyé : un nouvel envoi attend quelques minutes. */
  confirmationEnvoyeeLe: timestamp("confirmation_envoyee_le", { withTimezone: true }),
  ...timestamps,
});

/**
 * Échecs de connexion, pour limiter les tentatives.
 *
 * En base et non en mémoire : Vercel sert le site depuis plusieurs instances
 * qui ne partagent rien, un compteur en mémoire se remettrait à zéro à chaque
 * instance et à chaque déploiement. Une ligne par échec ; purgées à la
 * première connexion réussie de l'e-mail ou de l'adresse.
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: id(),
    email: text("email").notNull(),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_email_idx").on(t.email), index("login_attempts_ip_idx").on(t.ip)],
);

export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  kind: orgKind("kind").notNull().default("school"),
  ...timestamps,
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: orgRole("role").notNull().default("student"),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.userId, t.organizationId] })],
);

export const classes = pgTable(
  "classes",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    joinCode: text("join_code").notNull().unique(),
    schoolYear: text("school_year"),
    ...timestamps,
  },
  (t) => [index("classes_organization_idx").on(t.organizationId)],
);

/**
 * Codes d'invitation d'un établissement (espace admin) : un code enrôle un
 * nouvel inscrit dans l'organisation avec le rôle porté par le code
 * (org_admin pour le premier administrateur, teacher pour les enseignants).
 */
export const orgInvites = pgTable(
  "org_invites",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: orgRole("role").notNull(),
    code: text("code").notNull().unique(),
    active: boolean("active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("org_invites_org_idx").on(t.organizationId)],
);

/**
 * Licence d'un établissement : ce qui est vendu.
 *
 * Tout se vend sur devis : l'établissement reçoit un devis, émet un bon de commande,
 * reçoit une facture et paie par virement ou mandat administratif. La licence
 * enregistre donc les termes convenus, elle ne les encaisse pas. Le prix et la
 * référence sont documentaires : le logiciel note ce qui a été vendu, il ne
 * décide pas du tarif.
 *
 * Sans licence de l'arène en cours, la classe ne s'ouvre pas : décision du
 * propriétaire, « pas d'essai en classe » (services/acces.service.ts). Le solo
 * public et les démonstrations d'épisodes restent gratuits.
 */
export const orgLicences = pgTable(
  "org_licences",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** Ce que l'établissement lit sur sa facture : « Année scolaire 2026-2027 ». */
    label: text("label").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    /** Plafond d'enseignants. Null = sans plafond, la période seule s'applique. */
    maxTeachers: integer("max_teachers"),
    /** Numéro de devis ou de bon de commande, pour retrouver la vente. */
    reference: text("reference"),
    /** Montant facturé en centimes, purement documentaire. */
    amountCents: integer("amount_cents"),
    /**
     * LE PÉRIMÈTRE (migrations 0036 et 0038, config/tarifs.ts). `arene` : l'offre de
     * l'arène que la licence ouvre, Classe, Programme ou Campus ; null, elle n'ouvre pas
     * l'arène. `episodes` : elle ouvre les épisodes manager non démo, vendus à part sur
     * devis. Une licence d'avant la décision est une licence de l'arène, sans les épisodes.
     */
    arene: text("arene", { enum: ["classe", "programme", "campus"] }).default("campus"),
    episodes: boolean("episodes").notNull().default(false),
    /**
     * L'EXAMEN INDIVIDUEL (migration 0042, /teacher/examens) : la licence ouvre-t-elle le
     * module `examen` ? Posé à la vente depuis la composition de l'offre ; les licences
     * Programme et Campus d'avant la migration le reçoivent (inclus par défaut).
     */
    examen: boolean("examen").notNull().default(false),
    /**
     * LE PARAMÉTRAGE DE L'ARÈNE (migration 0038) : les entreprises ouvertes (codes du
     * registre ; null : toutes), les niveaux ouverts (null : tous) et le plafond de
     * parties de classe ou de concours EN COURS en même temps (null : sans plafond).
     * Une licence Classe porte une entreprise et un niveau, une partie à la fois ; une
     * Programme, une entreprise ; un Campus, rien de restreint.
     */
    entreprises: text("entreprises").array(),
    niveaux: integer("niveaux").array(),
    maxPartiesEnCours: integer("max_parties_en_cours"),
    /**
     * LA VENTE, COPIÉE AU MOMENT DE LA VENTE (migration 0041, /admin/offres) : l'offre du
     * catalogue vendue (`offre_code`) et une copie de ses conditions (`conditions` : nom,
     * modules et paramètres, prix catalogue, ce qu'elle inclut). Changer le catalogue ne
     * change pas une licence déjà vendue. `prix_catalogue_cents` : le prix de référence
     * (ou celui du devis pour une offre sur devis) ; `remise` : la remise commerciale
     * (type, valeur, motif, montant) ; `amount_cents` reste le montant facturé.
     * `nature` : vendue, offerte (0 €, motif obligatoire) ou essai (0 €, datée).
     */
    offreCode: text("offre_code"),
    conditions: jsonb("conditions"),
    prixCatalogueCents: integer("prix_catalogue_cents"),
    remise: jsonb("remise"),
    nature: text("nature", { enum: ["vendue", "offerte", "essai"] }).notNull().default("vendue"),
    motifGratuite: text("motif_gratuite"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("org_licences_org_idx").on(t.organizationId)],
);

/** Réglages globaux de la plateforme (ligne unique, jsonb versionnable). */
export const platformSettings = pgTable("platform_settings", {
  id: integer("id").primaryKey(), // toujours 1
  settings: jsonb("settings").notNull(),
  ...timestamps,
});

export const classMembers = pgTable(
  "class_members",
  {
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.classId, t.userId] })],
);

/**
 * LE JOURNAL DES GESTES SUR LES INSCRITS (migration 0040, /admin/inscrits) : qui (l'admin de
 * la plateforme), quoi (le geste), sur quel compte, avec un détail lisible (établissement,
 * code, réglages). Écrit par services/inscrits.service.ts, jamais modifié ; lu dans la page
 * et dans la fiche d'un inscrit.
 */
export const inscritsJournal = pgTable(
  "inscrits_journal",
  {
    id: id(),
    adminId: uuid("admin_id").references(() => users.id, { onDelete: "set null" }),
    geste: text("geste").notNull(),
    cibleUserId: uuid("cible_user_id").references(() => users.id, { onDelete: "set null" }),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("inscrits_journal_date_idx").on(t.createdAt), index("inscrits_journal_cible_idx").on(t.cibleUserId)],
);
