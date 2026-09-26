import { eq } from "drizzle-orm";
import { db } from "@/db";
import { games, rounds, situationInstances } from "@/db/schema";
import { conceptByCode, situationLevel } from "@/config/pedagogy/concepts";
import { modelByCode } from "@/config/pedagogy/models";
import type { SituationDef } from "@/config/scenarios/nova/situations";
import {
  MODEL_QUESTION_ID,
  modelQuestionFor,
  type DecisionLever,
  type QuizQuestionDef,
} from "@/config/scenarios/situation-kit";
import { presetFromProfile, quizModeFromProfile, type QuizMode } from "@/config/difficulty";
import { evaluateDiagnosis, evaluateQuiz } from "@/pedagogy/evaluation";
import { nextUnlockableLevel } from "@/pedagogy/hints";
import type { ConsequenceFact, InterpretationFact, TriggerFact } from "@/pedagogy/detection";
import { computeRawSituationScore } from "@/pedagogy/scoring";
import {
  RETAKE_MULTIPLIER,
  missedSituationPolicyFromProfile,
  type MissedSituationPolicy,
} from "@/config/missed-situation";
import { loadInstanceForUser } from "./situation-instance.service";

/**
 * Rattrapage d'une situation manquée, politique de rattrapage de la partie, et
 * construction de la vue d'une situation.
 *
 * CE FICHIER A PORTÉ DEUX FOIS LE MÊME CODE. Il exportait aussi `submitQuiz`
 * et `debriefRound`, copies à 49 % identiques de celles de pedagogy.service —
 * dont un bloc de 95 lignes à l'identique. Personne ne les importait : le
 * chemin vivant passe par pedagogy.service (`arena/actions.ts` pour le QCM,
 * `round-resolution.service` pour le débriefing). Trois cent soixante-dix
 * lignes qui ressemblaient au code vivant sans l'être : une correction faite
 * sur la mauvaise copie ne se serait vue nulle part, et rien ne l'aurait dit.
 *
 * `toView`, `askedQuestions` et `modelCtxOf` restent exportés : la couche
 * lecture (pedagogy-reporting.service) s'en sert.
 */

/**
 * Rattrapage d'une situation manquée (V1-6, politique `retake50`). Une reprise
 * unique, avant la clôture suivante, notée à la moitié du score. Le tour clos
 * n'est PAS recalculé (son IPG reste figé) : le rattrapage vaut pour la Mémoire
 * et l'apprentissage, pas rétroactivement pour le classement.
 */
export async function retakeSituation(args: {
  instanceId: string;
  userId: string;
  selectedOptionIds: string[];
  freeText?: string;
  answers: Record<string, string>;
}): Promise<{ finalScore: number }> {
  const { instance, def, game } = await loadInstanceForUser(args.instanceId, args.userId);
  const kind = (game?.difficultyProfile as { kind?: string } | null)?.kind;
  if (missedSituationPolicyFromProfile(game?.difficultyProfile, kind) !== "retake50") {
    throw new Error("Le rattrapage n'est pas ouvert pour cette partie");
  }
  if (instance.status !== "debriefed") throw new Error("Cette situation n'est pas encore débriefée");
  const diag = instance.diagnosis as { selected?: string[]; retaken?: boolean } | null;
  if (diag?.retaken) throw new Error("Cette situation a déjà été rattrapée");
  if (Array.isArray(diag?.selected)) throw new Error("Cette situation a déjà été rendue");

  // Fenêtre : uniquement le dernier tour clos, avant la clôture suivante.
  const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, game!.id));
  const resolved = gameRounds.filter((r) => r.status === "resolved").map((r) => r.index);
  const maxResolved = resolved.length ? Math.max(...resolved) : 0;
  const myRound = gameRounds.find((r) => r.id === instance.roundId)?.index ?? 0;
  if (myRound !== maxResolved) {
    throw new Error("Le rattrapage n'est ouvert que jusqu'à la clôture suivante");
  }

  const asked = askedQuestions(def, quizModeFromProfile(game?.difficultyProfile));
  const hasQuizQuestions = asked.length > 0;
  const validIds = new Set(asked.map((q) => q.id));
  const cleanAnswers: Record<string, string> = {};
  for (const [q, o] of Object.entries(args.answers)) if (validIds.has(q)) cleanAnswers[q] = o;
  const diagScore = evaluateDiagnosis(args.selectedOptionIds, def.diagnosticOptions);
  const quizScore = hasQuizQuestions ? evaluateQuiz(cleanAnswers, asked) : null;
  const raw = computeRawSituationScore({ diagnosisScore: diagScore, quizScore, hasQuizQuestions });
  const finalScore = raw * RETAKE_MULTIPLIER;

  await db
    .update(situationInstances)
    .set({
      diagnosis: {
        selected: args.selectedOptionIds,
        freeText: args.freeText ?? "",
        score: diagScore,
        finalScore,
        retaken: true,
      },
      quiz: hasQuizQuestions ? { answers: cleanAnswers, score: quizScore ?? 0 } : instance.quiz,
    })
    .where(eq(situationInstances.id, args.instanceId));
  return { finalScore };
}

/** Règle la politique des situations manquées d'une partie (V1-6, jsonb, sans migration). */
export async function setMissedPolicy(args: {
  gameId: string;
  teacherId: string;
  policy: MissedSituationPolicy;
}): Promise<void> {
  const game = (await db.select().from(games).where(eq(games.id, args.gameId)))[0];
  if (!game || game.createdBy !== args.teacherId) throw new Error("Partie introuvable");
  const profile = (game.difficultyProfile as Record<string, unknown> | null) ?? {};
  await db
    .update(games)
    .set({ difficultyProfile: { ...profile, missedSituationPolicy: args.policy } })
    .where(eq(games.id, args.gameId));
}

// ---------------------------------------------------------------------------
// Lectures : vue joueur et vue pédagogique enseignant (§27)
// ---------------------------------------------------------------------------

/**
 * Questions réellement posées pour cette partie. Le mode « model » ne garde
 * que la question du modèle d'analyse : les questions de connaissances
 * redemandent hors contexte ce que le diagnostic teste déjà en situation.
 */
/** Niveau + graine d'une partie : reconstruit la question du modèle par niveau (P8). */
export interface ModelCtx {
  level: number;
  seed: number;
}

export function modelCtxOf(game: typeof games.$inferSelect | undefined): ModelCtx | undefined {
  if (!game) return undefined;
  return { level: presetFromProfile(game.difficultyProfile).level, seed: Number(game.seed) };
}

/**
 * Questions réellement posées pour cette partie. Le mode « model » ne garde
 * que la question du modèle d'analyse. Avec un contexte de partie, la question
 * du modèle est reconstruite pour le niveau et la graine (distracteurs par
 * niveau, ordre mélangé) ; sans contexte, la version canonique suffit (les
 * appels qui ne regardent que le NOMBRE de questions n'ont pas besoin du niveau).
 */
export function askedQuestions(def: SituationDef, mode: QuizMode, ctx?: ModelCtx): QuizQuestionDef[] {
  if (mode === "off") return [];
  const base = mode === "model" ? def.quiz.filter((q) => q.id === MODEL_QUESTION_ID) : def.quiz;
  if (!ctx) return base;
  return base.map((q) =>
    q.id === MODEL_QUESTION_ID ? modelQuestionFor(def, ctx.level, ctx.seed) : q,
  );
}

/** Modèle attendu d'une situation, pour le débriefing quand la question n'est pas posée. */
function modelInsight(
  def: SituationDef,
): { prompt: string; answer: string; explain: string } | null {
  const question = def.quiz.find((q) => q.id === MODEL_QUESTION_ID);
  if (!question) return null;
  const answer = question.options.find((o) => o.id === question.correctOptionId)?.label;
  if (!answer) return null;
  return { prompt: question.prompt, answer, explain: question.explain };
}

export interface AnalyticalHint {
  code: string;
  name: string;
  objective: string;
  difficulty: number;
  keyPoints: string[];
}

export interface SituationView {
  instanceId: string;
  code: string;
  category: import("@/config/scenarios/situation-kit").SituationCategory;
  title: string;
  narrative: string;
  problem: string;
  origin: "scripted" | "detected";
  status: string;
  weight: number;
  diagnosticOptions: { id: string; label: string }[];
  /** QCM (connaissances + modèle d'analyse) : sans bonne réponse ni crédits (révélés au débriefing). */
  quizQuestions: { id: string; prompt: string; options: { id: string; label: string }[] }[];
  /** Réponses déjà validées par l'équipe (null tant que le QCM n'est pas soumis). */
  quizAnswers: Record<string, string> | null;
  unlockedHints: { level: number; text: string; costRatio: number }[];
  nextHint: { level: number; costRatio: number } | null;
  /**
   * Renseigné quand la situation a encore des indices mais que le niveau de la
   * partie les interdit. L'élève doit lire la raison AVANT de cliquer, pas
   * après : un bouton actif qui refuse laisse croire que le malus est déjà pris.
   */
  hintLimit: string | null;
  /** Modèles d'analyse pertinents pour cette situation (A7 — cadre analytique avant la décision). Vide après débriefing. */
  analyticalHints: AnalyticalHint[];
  /** Leviers décisionnels suggérés par la situation (A8 — pont situation→décision). Vide après débriefing. */
  decisionLevers: DecisionLever[];
  /** Faits chiffrés ayant déclenché la situation (A1 — « Pourquoi cette situation ? »). */
  triggerFacts: TriggerFact[] | null;
  diagnosis: { selected: string[]; freeText: string; score?: number; finalScore?: number } | null;
  /** L'équipe a rendu (diagnostic soumis) cette situation. */
  rendered: boolean;
  /** Situation débriefée sans avoir été rendue (V1-6 — consultable en Mémoire). */
  missed: boolean;
  /** Situation manquée puis rattrapée (score compté pour moitié). */
  retaken: boolean;
  /**
   * Niveau pédagogique de la situation (1..6), celui de sa notion la plus
   * avancée. Sert à ordonner les situations d'un tour (fondations d'abord).
   */
  level: number;
  /**
   * Situation dont le niveau dépasse celui fixé pour la partie : signalée à
   * l'élève (« au-dessus du niveau »), jamais cachée (filtrage doux, #2).
   */
  aboveGameLevel: boolean;
  /** Étapes d'apprentissage requises pour accéder à cette situation. */
  requiredLearningSteps: string[];
  /** True si l'utilisateur a complété toutes les étapes requises. */
  isAccessible: boolean;
  /** Rempli uniquement après débriefing. */
  debrief: {
    correctOptionIds: string[];
    /** Correction du QCM, question par question : crédit par option + explication. */
    quizCorrection: {
      id: string;
      correctOptionId: string;
      explain: string;
      credits: Record<string, number>;
    }[];
    quizScore: number | null;
    /** Modèle attendu, servi seulement quand la question n'a PAS été posée. */
    modelInsight: { prompt: string; answer: string; explain: string } | null;
    /** Évolution avant/après des indicateurs (A2 — « Qu'a-t-il évolué ? »). */
    consequenceFacts: ConsequenceFact[] | null;
    /** Interprétation pédagogique contextuelle (A3 — « Comment interpréter cette évolution ? »). */
    interpretation: InterpretationFact | null;
    concepts: { code: string; name: string; domain: string }[];
    finalScore: number;
  } | null;
}

/** Exactement trois notions par modèle candidat (P8) : celles du modèle, complétées au besoin par celles de la situation. */
function troisNotions(modelConceptCodes: string[], situationConceptCodes: string[]): string[] {
  const noms: string[] = [];
  const vus = new Set<string>();
  for (const code of [...modelConceptCodes, ...situationConceptCodes]) {
    const nom = conceptByCode.get(code)?.name;
    if (nom && !vus.has(nom)) {
      vus.add(nom);
      noms.push(nom);
    }
    if (noms.length === 3) break;
  }
  return noms;
}

export function toView(
  instance: typeof situationInstances.$inferSelect,
  def: SituationDef,
  levels: number[],
  quizMode: QuizMode = "full",
  hintCap: { cap: number; reason: string } = { cap: 5, reason: "" },
  modelCtx?: ModelCtx,
): SituationView {
  const asked = askedQuestions(def, quizMode, modelCtx);
  const modelAsked = asked.some((q) => q.id === MODEL_QUESTION_ID);
  const debriefed = instance.status === "debriefed";
  const diagnosis = instance.diagnosis as
    | (SituationView["diagnosis"] & { retaken?: boolean })
    | null;
  const quizStored = instance.quiz as { answers?: Record<string, string>; score?: number } | null;
  // Rendue = l'équipe a soumis son diagnostic. Une situation débriefée sans
  // diagnostic est « manquée » (V1-6) : consultable, score 0.
  const rendered = Array.isArray(diagnosis?.selected);
  const retaken = diagnosis?.retaken === true;
  const missed = debriefed && !rendered;
  return {
    instanceId: instance.id,
    code: def.code,
    category: def.category,
    title: def.title,
    narrative: def.narrative,
    problem: def.problem,
    origin: instance.origin,
    status: instance.status,
    weight: def.weight,
    level: situationLevel(def.conceptCodes),
    aboveGameLevel: modelCtx ? situationLevel(def.conceptCodes) > modelCtx.level : false,
    diagnosticOptions: def.diagnosticOptions.map(({ id, label }) => ({ id, label })),
    // Seules les questions réellement posées sont servies : en mode « model »
    // la question du modèle uniquement, en mode « off » aucune.
    quizQuestions: asked.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map(({ id, label }) => ({ id, label })), // sans les crédits
    })),
    quizAnswers: quizStored?.answers ?? null,
    unlockedHints: def.hints
      .filter((h) => levels.includes(h.level))
      .map((h) => ({ level: h.level, text: h.text, costRatio: h.costRatio })),
    nextHint: (() => {
      const next = nextUnlockableLevel(levels);
      if (next === null || debriefed || next > hintCap.cap) return null;
      const hint = def.hints.find((h) => h.level === next);
      return hint ? { level: hint.level, costRatio: hint.costRatio } : null;
    })(),
    hintLimit: (() => {
      const next = nextUnlockableLevel(levels);
      if (next === null || debriefed || next <= hintCap.cap) return null;
      return def.hints.some((h) => h.level === next) ? hintCap.reason : null;
    })(),
    // « Points clés à examiner » : servis seulement APRÈS la réponse au modèle
    // (P8) — ou tout de suite si aucune question n'est posée. Avant la réponse,
    // les livrer reviendrait à souffler le cadre d'analyse.
    analyticalHints:
      debriefed || !(quizStored != null || asked.length === 0)
        ? []
        : Object.entries(def.modelRelevance)
            .filter(([, rel]) => rel === "optimal" || rel === "acceptable")
            .map(([code]) => modelByCode.get(code))
            .filter((m): m is NonNullable<typeof m> => Boolean(m))
            .map((m) => ({
              code: m.code,
              name: m.name,
              objective: m.objective,
              difficulty: m.difficulty,
              keyPoints: troisNotions(m.conceptCodes, def.conceptCodes),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    decisionLevers: debriefed ? [] : (def.decisionLevers ?? []),
    triggerFacts: (instance.triggerContext as TriggerFact[] | null) ?? null,
    diagnosis,
    rendered,
    missed,
    retaken,
    requiredLearningSteps: def.requiredLearningSteps ?? [],
    isAccessible: true,
    debrief: debriefed
      ? {
          correctOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
          quizCorrection: asked.map((q) => ({
            id: q.id,
            correctOptionId: q.correctOptionId,
            explain: q.explain,
            credits: Object.fromEntries(
              q.options.map((o) => [
                o.id,
                o.credit ?? (o.id === q.correctOptionId ? 1 : 0),
              ]),
            ),
          })),
          quizScore: quizStored?.score ?? null,
          // Question du modèle non posée : le débriefing donne quand même le
          // modèle attendu et son explication. Sans cela, retirer les
          // questions retirerait aussi la leçon centrale de la situation. Une
          // situation MANQUÉE (V1-6) donne toujours le modèle attendu, même si
          // la question était posée : c'est l'essentiel à consulter.
          modelInsight: modelAsked && !missed ? null : modelInsight(def),
          consequenceFacts: (instance.consequenceContext as ConsequenceFact[] | null) ?? null,
          interpretation: (instance.interpretationContext as InterpretationFact | null) ?? null,
          concepts: def.conceptCodes
            .map((code) => conceptByCode.get(code))
            .filter((c): c is NonNullable<typeof c> => Boolean(c))
            .map((c) => ({ code: c.code, name: c.name, domain: c.domain })),
          finalScore: diagnosis?.finalScore ?? 0,
        }
      : null,
  };
}
