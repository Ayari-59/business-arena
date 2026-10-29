import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { games, tuteurQuestions } from "@/db/schema";
import {
  MESSAGE_QUOTA_ATTEINT,
  MESSAGE_TUTEUR_COUPE,
  QUESTIONS_AU_TUTEUR_PAR_PARTIE,
} from "@/config/tuteur";

/**
 * LE TUTEUR IA, CÔTÉ SERVEUR : l'interrupteur de la partie et le quota de l'élève.
 *
 * L'action du tuteur (app/arena/[gameId]/ai-actions.ts) appelle `reserverUneQuestion`
 * avant d'envoyer quoi que ce soit à Anthropic : l'interrupteur et le quota se
 * vérifient ici, jamais dans le navigateur.
 */

export type Reservation = { ok: true; restantes: number } | { ok: false; reason: string };

/** Le tuteur de cette partie est-il ouvert ? Une partie inconnue est fermée. */
export async function tuteurActifPour(gameId: string): Promise<boolean> {
  const [g] = await db.select({ actif: games.tuteurActif }).from(games).where(eq(games.id, gameId));
  return g?.actif ?? false;
}

/**
 * Réserver une question : refusée si l'enseignant a coupé le tuteur, ou si l'élève a
 * déjà posé ses `QUESTIONS_AU_TUTEUR_PAR_PARTIE` questions dans cette partie. La
 * réservation est atomique : deux envois simultanés ne dépassent pas le quota.
 */
export async function reserverUneQuestion(gameId: string, userId: string): Promise<Reservation> {
  if (!(await tuteurActifPour(gameId))) return { ok: false, reason: MESSAGE_TUTEUR_COUPE };
  const lignes = await db
    .insert(tuteurQuestions)
    .values({ gameId, userId, nombre: 1 })
    .onConflictDoUpdate({
      target: [tuteurQuestions.gameId, tuteurQuestions.userId],
      set: { nombre: sql`${tuteurQuestions.nombre} + 1`, updatedAt: new Date() },
      setWhere: sql`${tuteurQuestions.nombre} < ${QUESTIONS_AU_TUTEUR_PAR_PARTIE}`,
    })
    .returning({ nombre: tuteurQuestions.nombre });
  const nombre = lignes[0]?.nombre;
  if (nombre === undefined) return { ok: false, reason: MESSAGE_QUOTA_ATTEINT };
  return { ok: true, restantes: QUESTIONS_AU_TUTEUR_PAR_PARTIE - nombre };
}

/**
 * Rendre une question réservée quand l'IA n'a pas répondu : une panne ne doit pas
 * coûter une question à l'élève.
 */
export async function rendreUneQuestion(gameId: string, userId: string): Promise<void> {
  await db
    .update(tuteurQuestions)
    .set({ nombre: sql`greatest(${tuteurQuestions.nombre} - 1, 0)`, updatedAt: new Date() })
    .where(and(eq(tuteurQuestions.gameId, gameId), eq(tuteurQuestions.userId, userId)));
}

/** Combien de questions il reste à cet élève dans cette partie. */
export async function questionsRestantes(gameId: string, userId: string): Promise<number> {
  const [l] = await db
    .select({ nombre: tuteurQuestions.nombre })
    .from(tuteurQuestions)
    .where(and(eq(tuteurQuestions.gameId, gameId), eq(tuteurQuestions.userId, userId)));
  return Math.max(0, QUESTIONS_AU_TUTEUR_PAR_PARTIE - (l?.nombre ?? 0));
}

/**
 * L'enseignant allume ou coupe le tuteur de SA partie. La propriété se vérifie ici :
 * une partie d'un autre enseignant ne bouge pas.
 */
export async function reglerLeTuteur(args: {
  gameId: string;
  teacherId: string;
  actif: boolean;
}): Promise<void> {
  const [g] = await db.select({ createdBy: games.createdBy }).from(games).where(eq(games.id, args.gameId));
  if (!g || g.createdBy !== args.teacherId) throw new Error("Partie introuvable");
  await db.update(games).set({ tuteurActif: args.actif }).where(eq(games.id, args.gameId));
}
