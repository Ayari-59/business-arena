import {
  boolean,
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
import { sql } from "drizzle-orm";
import { id } from "./_shared";
import { organizations, users } from "./identity";

/**
 * SAML 2.0 : BUSINESS ARENA, FOURNISSEUR DE SERVICES DE LA FÉDÉRATION
 * ÉDUCATION-RECHERCHE (RENATER).
 *
 * Décision du propriétaire (octobre 2026) : « Lance la partie technique RENATER ». Un
 * étudiant ou un enseignant d'un établissement relié à la fédération se connecte avec
 * les identifiants de son établissement ; Business Arena reconnaît l'établissement, donc
 * la licence de l'organisation qui lui est rattachée.
 *
 * Tout est additif (migration 0039) : aucune table existante ne change.
 */

/**
 * UN FOURNISSEUR D'IDENTITÉS (IdP) DE LA FÉDÉRATION, tel que l'agrégat SIGNÉ le décrit :
 * son adresse d'authentification, ses certificats de signature, ses portées
 * (`shibmd:Scope`, les domaines qu'il a le droit d'affirmer), son nom.
 *
 * C'est le cache de l'agrégat : chaque lecture vérifiée met les lignes à jour. Une
 * ligne n'est jamais effacée : un IdP sorti de l'agrégat passe à `present = false` et
 * n'est plus accepté. Sa ligne garde le `sel` qui hache les identifiants de ses
 * personnes : s'il revient, elles retrouvent leurs comptes.
 */
export const samlIdps = pgTable(
  "saml_idps",
  {
    entityId: text("entity_id").primaryKey(),
    /** « test » ou « production » : la fédération de l'agrégat qui l'a décrit. */
    federation: text("federation").notNull(),
    nomFr: text("nom_fr"),
    nomEn: text("nom_en"),
    /** L'adresse SingleSignOnService en HTTP-Redirect. */
    ssoRedirect: text("sso_redirect").notNull(),
    /** Les certificats de signature (PEM), tels que publiés dans l'agrégat. */
    certificats: jsonb("certificats").$type<string[]>().notNull(),
    /** Les portées déclarées (`shibmd:Scope`, sans expression régulière). */
    portees: jsonb("portees").$type<string[]>().notNull().default([]),
    present: boolean("present").notNull().default(true),
    /** La clé HMAC, propre à l'IdP, qui hache les identifiants de ses personnes. */
    sel: text("sel").notNull(),
    vuLe: timestamp("vu_le", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("saml_idps_federation_idx").on(t.federation, t.present)],
);

/** LA DERNIÈRE LECTURE DE L'AGRÉGAT d'une fédération : quand, combien, et l'erreur s'il y en a eu une. */
export const samlFederations = pgTable("saml_federations", {
  federation: text("federation").primaryKey(),
  url: text("url").notNull(),
  /** La dernière lecture RÉUSSIE (signature vérifiée). */
  luLe: timestamp("lu_le", { withTimezone: true }),
  /** Le `validUntil` de l'agrégat lu : au-delà, il n'est plus accepté. */
  valideJusquA: timestamp("valide_jusqu_a", { withTimezone: true }),
  nombre: integer("nombre").notNull().default(0),
  /** Empreinte SHA-256 du document lu (pour comparer deux lectures). */
  empreinte: text("empreinte"),
  derniereTentative: timestamp("derniere_tentative", { withTimezone: true }),
  derniereErreur: text("derniere_erreur"),
});

/**
 * LE RATTACHEMENT D'UN ÉTABLISSEMENT À UNE ORGANISATION (géré dans /admin/renater) : un
 * IdP (entityID), une valeur de `schacHomeOrganization`, ou les deux (un IdP mutualisé
 * qui sert plusieurs établissements). L'organisation est celle dont la licence
 * s'applique aux enseignants de l'établissement.
 */
export const samlEtablissements = pgTable(
  "saml_etablissements",
  {
    id: id(),
    idpEntityId: text("idp_entity_id"),
    schac: text("schac"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    creePar: uuid("cree_par").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("saml_etablissements_cle_uq").on(
      sql`coalesce(${t.idpEntityId}, '')`,
      sql`coalesce(${t.schac}, '')`,
    ),
    index("saml_etablissements_org_idx").on(t.organizationId),
  ],
);

/**
 * LA PERSONNE VENUE PAR LA FÉDÉRATION : son identifiant pseudonyme (pairwise-id, à
 * défaut eduPersonTargetedID ou le NameID persistant) HACHÉ avec le sel de son IdP,
 * jamais en clair, et le compte qui lui correspond ici.
 *
 * Un ENSEIGNANT (ou un personnel) reçoit un compte rattaché à l'organisation de son
 * établissement ; son courriel n'est gardé que s'il est transmis. Un ÉTUDIANT reçoit une
 * identité de joueur persistante : ni nom, ni courriel, rien d'autre que ce lien.
 */
export const samlComptes = pgTable(
  "saml_comptes",
  {
    id: id(),
    idpEntityId: text("idp_entity_id").notNull(),
    identifiantHache: text("identifiant_hache").notNull(),
    /** « enseignant » ou « etudiant ». */
    role: text("role").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    courriel: text("courriel"),
    derniereVenue: timestamp("derniere_venue", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("saml_comptes_identifiant_uq").on(t.idpEntityId, t.identifiantHache, t.role),
    index("saml_comptes_user_idx").on(t.userId),
  ],
);

/**
 * UNE DEMANDE D'AUTHENTIFICATION ENVOYÉE (AuthnRequest) : son ID, l'IdP visé et la page
 * où revenir. La réponse doit porter cet ID (`InResponseTo`) ; elle consomme la ligne
 * (usage unique, dix minutes).
 */
export const samlRequetes = pgTable(
  "saml_requetes",
  {
    id: text("id").primaryKey(),
    idpEntityId: text("idp_entity_id").notNull(),
    retour: text("retour"),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    utiliseLe: timestamp("utilise_le", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("saml_requetes_expire_idx").on(t.expireLe)],
);

/** LES ASSERTIONS DÉJÀ ACCEPTÉES (IdP, ID) : une assertion rejouée est refusée. */
export const samlAssertions = pgTable(
  "saml_assertions",
  {
    idpEntityId: text("idp_entity_id").notNull(),
    assertionId: text("assertion_id").notNull(),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.idpEntityId, t.assertionId] }),
    index("saml_assertions_expire_idx").on(t.expireLe),
  ],
);

/** LE JOURNAL DES REFUS : l'étape, le motif, l'IdP annoncé ; jamais la réponse elle-même. */
export const samlRefus = pgTable(
  "saml_refus",
  {
    id: id(),
    etape: text("etape").notNull(),
    motif: text("motif").notNull(),
    idpEntityId: text("idp_entity_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("saml_refus_date_idx").on(t.createdAt)],
);
