/**
 * Réglages et invites de l'assistant IA (MVP).
 *
 * Trois surfaces, toutes facultatives et réglables depuis l'admin :
 *   - coach        : un retour de tour à l'élève (solo) ;
 *   - teacherReview: une synthèse des justifications pour l'enseignant ;
 *   - tutor        : un tuteur conversationnel pour l'élève.
 *
 * Rien n'est actif tant que (1) une clé ANTHROPIC_API_KEY est présente,
 * (2) l'administrateur a allumé la surface, et (3) le compte y a droit
 * (mur freemium `ai`). Défauts : tout ÉTEINT, modèle économique.
 */

/** Modèles proposés à l'administrateur (du moins cher au plus capable). */
export const AI_MODELS = [
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — économique (recommandé)" },
  { id: "claude-sonnet-5", label: "Sonnet 5 — équilibré" },
  { id: "claude-opus-5", label: "Opus 5 — qualité maximale" },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]["id"];

export function isAiModelId(v: unknown): v is AiModelId {
  return typeof v === "string" && AI_MODELS.some((m) => m.id === v);
}

export type AiSurface = "coach" | "teacherReview" | "tutor";

export interface AiConfig {
  /** Coach de tour, côté élève (solo). */
  coach: boolean;
  /** Synthèse des justifications, côté enseignant. */
  teacherReview: boolean;
  /** Tuteur conversationnel, côté élève. */
  tutor: boolean;
  /** Modèle employé par toutes les surfaces. */
  model: AiModelId;
}

/** Défaut : IA éteinte partout, modèle économique. Aucun coût sans réglage explicite. */
export const DEFAULT_AI_CONFIG: AiConfig = {
  coach: false,
  teacherReview: false,
  tutor: false,
  model: "claude-haiku-4-5",
};

// ---------------------------------------------------------------------------
// Invites système (ton pédagogique, français, sans chiffres inventés)
// ---------------------------------------------------------------------------

const GARDE_FOU =
  "Tu es un assistant pédagogique pour un jeu de gestion d'entreprise destiné à des étudiants (BTS, DCG, écoles). " +
  "Écris en français, dans un registre clair et bienveillant. N'invente jamais de chiffres : n'utilise que les données fournies. " +
  "Ne donne pas la « bonne réponse » toute faite : fais réfléchir. Reste bref.";

export const COACH_SYSTEM =
  GARDE_FOU +
  " Tu commentes le tour que l'élève vient de jouer : 3 à 4 phrases maximum. " +
  "Relie une décision à son effet visible dans les résultats, souligne un point de vigilance (souvent la trésorerie ou la marge), " +
  "et pose une question ouverte pour le tour suivant. Pas de liste, pas de titre.";

export const TEACHER_REVIEW_SYSTEM =
  GARDE_FOU +
  " Tu aides l'enseignant à préparer le débriefing. À partir des justifications écrites par une équipe au fil des tours, " +
  "produis une courte synthèse (4 à 6 phrases) : ce que l'équipe semble avoir compris, ses angles morts, " +
  "et une ou deux questions à lui poser en classe. Tu t'adresses à l'enseignant, pas à l'élève.";

export const TUTOR_SYSTEM =
  GARDE_FOU +
  " Tu réponds aux questions de l'élève en cours de partie. Appuie-toi sur l'état de sa partie fourni en contexte. " +
  "Explique les notions (marge, seuil de rentabilité, BFR, trésorerie…) avec ses propres chiffres quand ils sont fournis, " +
  "mais ne joue pas à sa place : oriente, ne décide pas. Réponses courtes.";
