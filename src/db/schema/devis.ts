import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { users } from "./identity";
import { codesPromo } from "./offres";

/**
 * LA DEMANDE DE DEVIS ÉCRITE (migration 0036), envoyée depuis `/devis?offre=…`.
 *
 * Décision du propriétaire : « la vente se fait sur devis », pour toutes les offres.
 * Chaque carte de /tarifs mène ici avec son offre pré-remplie. La demande est écrite en
 * base d'abord : la notification à l'adresse de contact et l'accusé au demandeur sont
 * des commodités, et l'administration dit s'ils sont partis. Le prospect ne passe plus
 * par un rendez-vous téléphonique pour obtenir un prix (audit C-06, PAR-05) ; le
 * rendez-vous reste proposé à côté.
 */
export const demandesDeDevis = pgTable(
  "demandes_de_devis",
  {
    id: id(),
    /** Ce qui est demandé : classe, programme, campus, reseau, episodes ou entreprise (config/tarifs.ts). */
    offre: text("offre").notNull(),
    nom: text("nom").notNull(),
    fonction: text("fonction").notNull(),
    /** L'établissement, le réseau ou l'organisation. */
    organisation: text("organisation").notNull(),
    /** UAI ou SIRET, facultatif ; vide s'il n'est pas donné. */
    identifiant: text("identifiant").notNull().default(""),
    /** Enseignants, établissements ou managers, selon l'offre ; null s'il n'est pas donné. */
    effectif: integer("effectif"),
    /** L'entreprise souhaitée (Classe, Programme ; migration 0038) ; null sinon. */
    entreprise: text("entreprise"),
    /** Le niveau souhaité (offre Classe) ; null sinon. */
    niveau: integer("niveau"),
    email: text("email").notNull(),
    message: text("message").notNull().default(""),
    /**
     * LE CODE PROMO (migration 0041) : le code saisi, vérifié côté serveur, et le devis
     * qu'il donne : prix catalogue, remise, prix remisé (centimes ; null pour une offre
     * sur devis, dont seule la remise est connue). `promo_cle` : l'établissement, pour un
     * code à une utilisation par établissement (index unique avec le code).
     */
    codePromo: text("code_promo"),
    codePromoId: uuid("code_promo_id").references(() => codesPromo.id, { onDelete: "set null" }),
    prixCatalogueCents: integer("prix_catalogue_cents"),
    remiseCents: integer("remise_cents"),
    remiseLibelle: text("remise_libelle"),
    prixRemiseCents: integer("prix_remise_cents"),
    promoCle: text("promo_cle"),
    /** Adresse d'origine, pour la limitation ; NULL hors proxy. */
    ip: text("ip"),
    /** Le courriel à l'adresse de contact est-il parti ? */
    notificationEnvoyee: boolean("notification_envoyee").notNull().default(false),
    /** L'accusé de réception au demandeur est-il parti ? */
    accuseEnvoye: boolean("accuse_envoye").notNull().default(false),
    traiteePar: uuid("traitee_par").references(() => users.id, { onDelete: "set null" }),
    traiteeLe: timestamp("traitee_le", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("demandes_de_devis_cree_idx").on(t.createdAt),
    uniqueIndex("demandes_de_devis_promo_uq")
      .on(t.codePromoId, t.promoCle)
      .where(sql`${t.promoCle} IS NOT NULL`),
    index("demandes_de_devis_ip_idx").on(t.ip, t.createdAt),
  ],
);
