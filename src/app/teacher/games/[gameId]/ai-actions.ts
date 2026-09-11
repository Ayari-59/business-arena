"use server";

import { getSession } from "@/lib/session";
import { getTeacherGameView } from "@/services/game.service";
import { entitlementsForUser } from "@/services/entitlements.service";
import { generate, resolveAiSurface } from "@/services/ai.service";
import { TEACHER_REVIEW_SYSTEM } from "@/config/ai";

export type AiResult = { ok: true; text: string } | { ok: false; reason: string };

const INDISPO = "La synthèse IA n'est pas disponible.";

/**
 * Synthèse des justifications de la classe, pour préparer le débriefing.
 * Gatée par le droit du compte (mur `ai`), le réglage admin et la clé API.
 */
export async function reviewJustificationsAction(gameId: string): Promise<AiResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: INDISPO };

  const ent = await entitlementsForUser(session.userId);
  if (!ent.ai) return { ok: false, reason: INDISPO };
  const model = await resolveAiSurface("teacherReview");
  if (!model) return { ok: false, reason: INDISPO };

  let view;
  try {
    view = await getTeacherGameView(gameId, session.userId);
  } catch {
    return { ok: false, reason: INDISPO };
  }
  if (!view) return { ok: false, reason: INDISPO };

  const avecJustif = view.teams.filter(
    (t) => t.controller === "human" && t.justification && t.justification.trim().length > 0,
  );
  if (avecJustif.length === 0) {
    return { ok: false, reason: "Aucune justification écrite pour l'instant." };
  }

  const contexte = avecJustif
    .map((t) => `Équipe ${t.name} : « ${t.justification} »`)
    .join("\n");

  const text = await generate({
    system: TEACHER_REVIEW_SYSTEM,
    model,
    maxTokens: 700,
    messages: [
      {
        role: "user",
        content: `Justifications écrites par les équipes pour ce tour :\n${contexte}`,
      },
    ],
  });
  return text ? { ok: true, text } : { ok: false, reason: "L'IA n'a pas répondu, réessayez." };
}
