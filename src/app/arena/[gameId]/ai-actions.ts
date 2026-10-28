"use server";

import { getGuestUserId } from "@/lib/guest";
import { getGameView } from "@/services/game.service";
import { entitlementsForUser } from "@/services/entitlements.service";
import { generate, resolveAiSurface, type AiTurn } from "@/services/ai.service";
import { COACH_SYSTEM, TUTOR_SYSTEM } from "@/config/ai";
import { formatEuro } from "@/lib/format";
import type { GameView } from "@/services/game.service";
import { rendreUneQuestion, reserverUneQuestion } from "@/services/tuteur.service";
import { lireLEntreeDuTuteur } from "@/lib/entree-du-tuteur";

export type AiResult = { ok: true; text: string } | { ok: false; reason: string };

const INDISPO = "L'assistant IA n'est pas disponible pour cette partie.";

/** Résumé compact de la partie, pour ancrer le modèle sur les vrais chiffres. */
function buildContext(view: GameView): string {
  const lignes: string[] = [];
  lignes.push(`Entreprise : ${view.playerTeamName} (secteur : ${view.vocabulary.units}).`);
  const hist = view.history.slice(-6);
  if (hist.length > 0) {
    lignes.push("Historique (par tour) :");
    for (const h of hist) {
      lignes.push(
        `- Tour ${h.round} : chiffre d'affaires ${formatEuro(h.revenue)}, ` +
          `résultat net ${formatEuro(h.netIncome)}, trésorerie ${formatEuro(h.netTreasury)}.`,
      );
    }
  }
  const last = view.periods.at(-1);
  if (last?.decisions) {
    const d = last.decisions;
    lignes.push(
      `Décisions du dernier tour : ${view.vocabulary.priceLabel} ${d.price} €, ` +
        `${view.vocabulary.productionPlanLabel} ${Math.round(d.productionPlan)} ${view.vocabulary.units}, ` +
        `budget marketing ${formatEuro(d.marketingBudget)}.`,
    );
  }
  return lignes.join("\n");
}

async function guard(
  gameId: string,
  surface: "coach" | "tutor",
): Promise<{ view: GameView; model: import("@/config/ai").AiModelId } | { error: string }> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée : relancez une partie depuis l'accueil." };
  const ent = await entitlementsForUser(userId);
  if (!ent.ai) return { error: INDISPO };
  const model = await resolveAiSurface(surface);
  if (!model) return { error: INDISPO };
  const view = await getGameView(gameId, userId);
  if (!view) return { error: INDISPO };
  return { view, model };
}

/** Coach de tour : un retour pédagogique court sur le dernier tour joué. */
export async function coachRoundAction(gameId: string): Promise<AiResult> {
  const g = await guard(gameId, "coach");
  if ("error" in g) return { ok: false, reason: g.error };
  const text = await generate({
    system: COACH_SYSTEM,
    model: g.model,
    maxTokens: 500,
    messages: [{ role: "user", content: buildContext(g.view) }],
  });
  return text ? { ok: true, text } : { ok: false, reason: "L'IA n'a pas répondu, réessayez." };
}

/** Tuteur conversationnel : répond à une question en s'appuyant sur la partie. */
export async function tutorChatAction(
  gameId: string,
  history: AiTurn[],
  question: string,
): Promise<AiResult> {
  // Bornes et rôles vérifiés avant tout (audit, P2-5) : une action serveur reçoit
  // ce que le navigateur veut bien envoyer, pas ce que son type annonce.
  const lu = lireLEntreeDuTuteur(history, question);
  if (!lu.ok) return { ok: false, reason: lu.reason };
  const q = lu.entree.question;
  const g = await guard(gameId, "tutor");
  if ("error" in g) return { ok: false, reason: g.error };
  // RGPD ET IA (services/tuteur.service.ts) : l'interrupteur de la partie, posé par
  // l'enseignant, et le quota de l'élève, vérifiés ici avant tout envoi à Anthropic.
  const eleve = await getGuestUserId();
  if (!eleve) return { ok: false, reason: INDISPO };
  const reserve = await reserverUneQuestion(gameId, eleve);
  if (!reserve.ok) return { ok: false, reason: reserve.reason };
  // Historique borné (6 derniers échanges) pour maîtriser le coût.
  const passe = lu.entree.history.slice(-6).filter((m) => m.content.trim().length > 0);
  const text = await generate({
    system: `${TUTOR_SYSTEM}\n\nÉtat de la partie de l'élève :\n${buildContext(g.view)}`,
    model: g.model,
    maxTokens: 600,
    messages: [...passe, { role: "user", content: q }],
  });
  if (!text) await rendreUneQuestion(gameId, eleve);
  return text ? { ok: true, text } : { ok: false, reason: "L'IA n'a pas répondu, réessayez." };
}
