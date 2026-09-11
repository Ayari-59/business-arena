import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import {
  DEFAULT_AI_CONFIG,
  isAiModelId,
  type AiConfig,
  type AiModelId,
  type AiSurface,
} from "@/config/ai";

/**
 * Cœur de l'assistant IA. Volontairement défensif : sans clé API, sans réglage
 * admin, ou en cas d'erreur d'appel, tout renvoie « indisponible » plutôt que
 * de planter la page. La lecture de la config se fait en direct sur
 * platform_settings (comme entitlements.service) pour éviter tout cycle
 * d'imports avec les services de jeu.
 */

/** La clé est-elle configurée ? (variable d'environnement, côté serveur.) */
export function aiKeyPresent(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function getAiConfig(): Promise<AiConfig> {
  try {
    const row = (await db.select().from(platformSettings).where(eq(platformSettings.id, 1)))[0];
    const stored = (row?.settings as { ai?: Partial<AiConfig> } | null)?.ai ?? {};
    const model = isAiModelId(stored.model) ? stored.model : DEFAULT_AI_CONFIG.model;
    return { ...DEFAULT_AI_CONFIG, ...stored, model };
  } catch (e) {
    // Incident de lecture : IA éteinte (repli fermé — pas de coût par erreur).
    console.error("[ai] lecture de la config IA échouée :", e);
    return DEFAULT_AI_CONFIG;
  }
}

/**
 * Une surface est-elle utilisable ? Renvoie le modèle à employer, ou null si
 * la clé manque ou la surface est éteinte en admin. Le droit d'accès du compte
 * (mur freemium `ai`) est vérifié par l'appelant, qui connaît l'utilisateur.
 */
export async function resolveAiSurface(surface: AiSurface): Promise<AiModelId | null> {
  if (!aiKeyPresent()) return null;
  const cfg = await getAiConfig();
  return cfg[surface] ? cfg.model : null;
}

export interface AiTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Appel générique. Renvoie le texte de la réponse, ou null en cas d'échec
 * (réseau, quota, refus…) — jamais d'exception remontée à l'appelant.
 */
export async function generate(args: {
  system: string;
  messages: AiTurn[];
  model: AiModelId;
  maxTokens?: number;
}): Promise<string | null> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: args.model,
      max_tokens: args.maxTokens ?? 700,
      system: args.system,
      messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    if (res.stop_reason === "refusal") return null;
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text.length > 0 ? text : null;
  } catch (e) {
    console.error("[ai] appel au modèle échoué :", e);
    return null;
  }
}
