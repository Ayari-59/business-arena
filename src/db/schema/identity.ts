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
 * Un lycée n'achète pas un abonnement par carte bancaire : il émet un bon de
 * commande, reçoit une facture et paie par mandat administratif. La licence
 * enregistre donc les termes convenus, elle ne les encaisse pas. Le prix et la
 * référence sont documentaires : le logiciel note ce qui a été vendu, il ne
 * décide pas du tarif.
 *
 * L'ABSENCE de licence vaut accès libre. C'est délibéré : la frontière ne doit
 * pas se refermer sur les établissements existants ni sur une démonstration,
 * et une limite ne se pose que lorsqu'une vente l'a définie.
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
