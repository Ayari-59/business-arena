import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
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
  ...timestamps,
});

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
