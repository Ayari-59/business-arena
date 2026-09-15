import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { users } from "./identity";

/**
 * Le statut d'une demande de simulation : `new` tant que personne n'a répondu,
 * `handled` une fois qu'un administrateur l'a prise en charge.
 */
export const orientationRequestStatus = pgEnum("orientation_request_status", [
  "new",
  "handled",
]);

/**
 * LA DEMANDE DE SIMULATION — ce qu'un enseignant nous écrit depuis la page
 * « Quelle simulation pour votre classe ».
 *
 * Le bouton ouvrait un courriel pré-rempli dans le logiciel de messagerie du
 * visiteur : rien n'en restait chez nous, et sur un poste de salle des profs
 * sans messagerie configurée, rien ne partait du tout. Le formulaire recueille
 * désormais les informations ici — qui écrit, d'où, et pour quelle classe —,
 * les garde, et tente l'envoi d'un courriel à l'adresse de contact de la
 * plateforme. Envoyé ou non, la demande existe et se lit dans
 * l'administration.
 *
 * La recommandation calculée au moment de l'envoi est figée avec la demande :
 * les règles d'orientation changent, la réponse doit se lire dans le contexte
 * où la question a été posée.
 */
export const orientationRequests = pgTable(
  "orientation_requests",
  {
    id: id(),
    /** Qui écrit. */
    name: text("name").notNull(),
    school: text("school").notNull(),
    email: text("email").notNull(),
    /** Le profil de la classe, tel que le formulaire le pose. */
    diplome: text("diplome").notNull(),
    semestre: text("semestre").notNull(),
    objectif: text("objectif").notNull(),
    /** Le contexte en quelques lignes ; vide si l'enseignant n'a rien ajouté. */
    message: text("message").notNull().default(""),
    /** La recommandation de la page au moment de l'envoi. */
    recommendation: jsonb("recommendation").notNull(),
    /** Adresse d'origine, pour la limitation ; NULL hors proxy. */
    ip: text("ip"),
    /** Le courriel à l'adresse de contact est-il parti ? */
    mailSent: boolean("mail_sent").notNull().default(false),
    status: orientationRequestStatus("status").notNull().default("new"),
    handledBy: uuid("handled_by").references(() => users.id, { onDelete: "set null" }),
    handledAt: timestamp("handled_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("orientation_requests_status_idx").on(t.status, t.createdAt),
    index("orientation_requests_ip_idx").on(t.ip, t.createdAt),
  ],
);
