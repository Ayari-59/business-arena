import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { ltiTickets } from "@/db/schema";

/**
 * LES TICKETS À USAGE UNIQUE.
 *
 * Deux moments où le navigateur ne peut pas porter de cookie : la sélection de contenu,
 * que Moodle ouvre dans une fenêtre intégrée (iframe, cookies tiers), et un lancement
 * reçu dans une iframe, que l'outil rouvre dans une nouvelle fenêtre. Le ticket les
 * relie : tiré au hasard, gardé en base, consommé une seule fois, de courte durée.
 */

export type TypeDeTicket = "selection" | "ouverture";

export async function creerTicket(args: {
  type: TypeDeTicket;
  plateformeId: string;
  donnees: Record<string, unknown>;
  dureeS: number;
  now?: Date;
}): Promise<string> {
  const now = args.now ?? new Date();
  const ticket = randomBytes(24).toString("base64url");
  await db.insert(ltiTickets).values({
    ticket,
    type: args.type,
    plateformeId: args.plateformeId,
    donnees: args.donnees,
    expireLe: new Date(now.getTime() + args.dureeS * 1000),
  });
  return ticket;
}

/** Consomme le ticket ; null s'il est inconnu, d'un autre type, expiré ou déjà servi. */
export async function consommerTicket(
  ticket: string | null | undefined,
  type: TypeDeTicket,
  now: Date = new Date(),
): Promise<{ plateformeId: string; donnees: Record<string, unknown> } | null> {
  if (!ticket || !/^[A-Za-z0-9_-]{16,64}$/.test(ticket)) return null;
  const [pris] = await db
    .update(ltiTickets)
    .set({ utiliseLe: now })
    .where(
      and(
        eq(ltiTickets.ticket, ticket),
        eq(ltiTickets.type, type),
        isNull(ltiTickets.utiliseLe),
        gt(ltiTickets.expireLe, now),
      ),
    )
    .returning();
  return pris ? { plateformeId: pris.plateformeId, donnees: pris.donnees } : null;
}
