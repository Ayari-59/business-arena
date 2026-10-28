import { z } from "zod";

/**
 * CE QUE LE TUTEUR IA ACCEPTE D'UN NAVIGATEUR (audit, P2-5).
 *
 * L'action serveur recevait une question et un historique sans aucune borne :
 * longueur libre, nombre de messages libre, rôle non vérifié. Tout partait chez
 * Anthropic, et chaque caractère se paie. On borne ici ce qui entre :
 * - la question : de 1 à 1 000 caractères ;
 * - l'historique : au plus 20 messages, des rôles `user` ou `assistant` seulement ;
 *   une question passée de plus de 1 000 caractères est refusée, une réponse du
 *   tuteur (écrite par le modèle, souvent plus longue) est coupée à 1 000.
 * Le quota par élève et l'interrupteur par partie sont tenus ailleurs
 * (`services/tuteur.service.ts`).
 */
import { MAX_CARACTERES_PAR_MESSAGE, MAX_MESSAGES_D_HISTORIQUE } from "./bornes-du-tuteur";

export { MAX_CARACTERES_PAR_MESSAGE, MAX_MESSAGES_D_HISTORIQUE };

const tourDeParole = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().max(MAX_CARACTERES_PAR_MESSAGE) }),
  z.object({
    role: z.literal("assistant"),
    content: z.string().transform((t) => t.slice(0, MAX_CARACTERES_PAR_MESSAGE)),
  }),
]);

const entree = z.object({
  history: z.array(tourDeParole).max(MAX_MESSAGES_D_HISTORIQUE),
  question: z.string().trim().min(1, "Posez une question.").max(
    MAX_CARACTERES_PAR_MESSAGE,
    `Une question tient en ${MAX_CARACTERES_PAR_MESSAGE} caractères au plus.`,
  ),
});

export type EntreeDuTuteur = z.infer<typeof entree>;

export function lireLEntreeDuTuteur(
  history: unknown,
  question: unknown,
): { ok: true; entree: EntreeDuTuteur } | { ok: false; reason: string } {
  const r = entree.safeParse({ history, question });
  if (r.success) return { ok: true, entree: r.data };
  const premiere = r.error.issues[0];
  // Le message dit à l'élève ce qui ne va pas dans SA question ; le reste est un
  // historique fabriqué à la main, qui n'appelle pas d'explication.
  if (premiere?.path[0] === "question") return { ok: false, reason: premiere.message };
  return { ok: false, reason: "La conversation n'a pas pu être lue : rechargez la page." };
}
