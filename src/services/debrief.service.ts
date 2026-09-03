import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  concepts,
  games,
  hintUsages,
  learningProgress,
  modelChoices,
  players,
  playerSkills,
  roundResults,
  rounds,
  situationInstances,
  situations,
} from "@/db/schema";
import { conceptByCode } from "@/config/pedagogy/concepts";
import { modelByCode } from "@/config/pedagogy/models";
import type { SituationDef } from "@/config/scenarios/nova/situations";
import {
  MODEL_QUESTION_ID,
  modelQuestionFor,
  type DecisionLever,
  type QuizQuestionDef,
} from "@/config/scenarios/situation-kit";
import { situationByCode } from "@/config/scenarios/registry";
import { presetFromProfile, quizModeFromProfile, type QuizMode } from "@/config/difficulty";
import { evaluateDiagnosis, evaluateQuiz } from "@/pedagogy/evaluation";
import { hintScoreMultiplier, nextUnlockableLevel } from "@/pedagogy/hints";
import { buildConsequenceContext, buildInterpretation } from "@/pedagogy/detection";
import type { ConsequenceFact, InterpretationFact, TriggerFact } from "@/pedagogy/detection";
import { AXES, aggregateAxis, updateMastery } from "@/pedagogy/progress";
import { adaptiveHintMultiplier, playerStrength } from "@/pedagogy/adaptivity";
import { computeRawSituationScore } from "@/pedagogy/scoring";
import {
  RETAKE_MULTIPLIER,
  missedSituationPolicyFromProfile,
  type MissedSituationPolicy,
} from "@/config/missed-situation";
import type { CompanyRoundResult } from "@/engine/types";
import { loadInstanceForUser } from "./situation-instance.service";

/**
 * Interactions joueur (QCM, rattrapage), débriefing d'un tour et construction
 * de la vue d'une situation. Extrait de pedagogy.service.ts (refactoring V2,
 * étape 9). `toView`, `askedQuestions` et `modelCtxOf` sont exportés car la
 * couche lecture (pedagogy-reporting.service) s'en sert.
 */

/**
 * Enregistre les réponses au QCM de mobilisation des connaissances (2-3
 * questions par situation). Le score est calculé immédiatement mais la
 * correction n'est révélée qu'au débriefing du tour.
 */
export async function submitQuiz(args: {
  instanceId: string;
  userId: string;
  answers: Record<string, string>;
}): Promise<{ score: number }> {
  const { instance, def, game } = await loadInstanceForUser(args.instanceId, args.userId);
  if (instance.status === "debriefed") throw new Error("Cette situation est déjà débriefée");
  if (instance.quiz) throw new Error("Le QCM de cette situation est déjà validé");
  // L'enseignant a retiré les QCM de cette partie : le formulaire n'est plus
  // servi, et une soumission forgée ne doit pas non plus être acceptée.
  const asked = askedQuestions(def, quizModeFromProfile(game?.difficultyProfile), modelCtxOf(game));
  if (asked.length === 0) {
    throw new Error("Les QCM sont désactivés pour cette partie");
  }
  const validIds = new Set(asked.map((q) => q.id));
  const answers: Record<string, string> = {};
  for (const [questionId, optionId] of Object.entries(args.answers)) {
    if (validIds.has(questionId)) answers[questionId] = optionId;
  }
  const score = evaluateQuiz(answers, asked);
  await db
    .update(situationInstances)
    .set({
      quiz: { answers, score },
      status: "answered",
      answeredAt: new Date(),
    })
    .where(eq(situationInstances.id, args.instanceId));
  return { score };
}

/**
 * Rattrapage d'une situation manquée (V1-6, politique `retake50`). Une reprise
 * unique, avant la clôture suivante, notée à la moitié du score. Le tour clos
 * n'est PAS recalculé (son BPI reste figé) : le rattrapage vaut pour la Mémoire
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
// Débriefing d'un tour + progression (doc 03 §5-§6)
// ---------------------------------------------------------------------------

export async function debriefRound(gameId: string, roundIndex: number): Promise<void> {
  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex)))
  )[0];
  if (!roundRow) return;
  const instances = await db
    .select()
    .from(situationInstances)
    .where(eq(situationInstances.roundId, roundRow.id));
  if (instances.length === 0) return;

  const situationRows = await db.select().from(situations);
  const codeById = new Map(situationRows.map((r) => [r.id, r.code]));
  const conceptRows = await db.select().from(concepts);
  const conceptIdByCode = new Map(conceptRows.map((r) => [r.code, r.id]));
  const gameRow = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  const quizMode = quizModeFromProfile(gameRow?.difficultyProfile);

  const toDebrief = instances.filter((i) => i.status !== "debriefed");
  if (toDebrief.length === 0) return;

  const instanceIds = toDebrief.map((i) => i.id);
  const teamIds = [...new Set(toDebrief.map((i) => i.teamId))];

  const allUsages = await db
    .select()
    .from(hintUsages)
    .where(inArray(hintUsages.situationInstanceId, instanceIds));
  const levelsByInstance = new Map<string, number[]>();
  for (const u of allUsages) {
    const list = levelsByInstance.get(u.situationInstanceId) ?? [];
    list.push(u.level);
    levelsByInstance.set(u.situationInstanceId, list);
  }

  const allMembers = await db
    .select()
    .from(players)
    .where(inArray(players.teamId, teamIds));
  const membersByTeam = new Map<string, (typeof allMembers)[number][]>();
  for (const m of allMembers) {
    const list = membersByTeam.get(m.teamId) ?? [];
    list.push(m);
    membersByTeam.set(m.teamId, list);
  }

  const allUserIds = [...new Set(allMembers.map((m) => m.userId))];
  const allSkills = allUserIds.length
    ? await db.select().from(playerSkills).where(inArray(playerSkills.userId, allUserIds))
    : [];
  const skillsByUser = new Map<string, { value: string }[]>();
  for (const s of allSkills) {
    const list = skillsByUser.get(s.userId) ?? [];
    list.push(s);
    skillsByUser.set(s.userId, list);
  }

  const allRelevantConceptIds: string[] = [];
  for (const inst of toDebrief) {
    const def = situationByCode.get(codeById.get(inst.situationId) ?? "");
    if (!def) continue;
    for (const code of def.conceptCodes) {
      const cid = conceptIdByCode.get(code);
      if (cid) allRelevantConceptIds.push(cid);
    }
  }
  const uniqueConceptIds = [...new Set(allRelevantConceptIds)];
  const allProgress =
    allUserIds.length && uniqueConceptIds.length
      ? await db
          .select()
          .from(learningProgress)
          .where(
            and(
              inArray(learningProgress.userId, allUserIds),
              inArray(learningProgress.conceptId, uniqueConceptIds),
            ),
          )
      : [];
  const progressMap = new Map<string, { mastery: string; evidenceCount: number }>();
  for (const p of allProgress) {
    progressMap.set(`${p.userId}:${p.conceptId}`, {
      mastery: p.mastery,
      evidenceCount: p.evidenceCount,
    });
  }

  const fallbackChoiceIds = toDebrief
    .filter((inst) => {
      const def = situationByCode.get(codeById.get(inst.situationId) ?? "");
      if (!def) return false;
      const hasQuiz = askedQuestions(def, quizMode).length > 0;
      if (!hasQuiz) return false;
      return (inst.quiz as { score?: number } | null)?.score == null;
    })
    .map((i) => i.id);
  const choiceRows = fallbackChoiceIds.length
    ? await db
        .select()
        .from(modelChoices)
        .where(inArray(modelChoices.situationInstanceId, fallbackChoiceIds))
    : [];
  const choiceByInstance = new Map(choiceRows.map((c) => [c.situationInstanceId, c]));

  // A2 — Conséquences pédagogiques : charger les résultats avant/après pour
  // construire le snapshot d'évolution des indicateurs au débriefing.
  const afterResults = await db
    .select()
    .from(roundResults)
    .where(eq(roundResults.roundId, roundRow.id));
  const afterByTeam = new Map<string, CompanyRoundResult>();
  for (const r of afterResults) {
    afterByTeam.set(r.teamId, {
      incomeStatement: r.incomeStatement,
      balanceSheet: r.balanceSheet,
      functionalBalance: { frng: Number(r.frng), bfr: Number(r.bfr), netTreasury: Number(r.netTreasury) },
      market: { bySegment: r.marketDetail as CompanyRoundResult["market"]["bySegment"], totalShare: Number(r.marketShare) },
      production: (r.engineTrace as { production?: CompanyRoundResult["production"] })?.production ?? { utilizationRate: 0 },
    } as CompanyRoundResult);
  }
  let beforeByTeam = new Map<string, CompanyRoundResult>();
  if (roundIndex > 1) {
    const prevRoundRow = (
      await db
        .select()
        .from(rounds)
        .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex - 1)))
    )[0];
    if (prevRoundRow) {
      const beforeResults = await db
        .select()
        .from(roundResults)
        .where(eq(roundResults.roundId, prevRoundRow.id));
      for (const r of beforeResults) {
        beforeByTeam.set(r.teamId, {
          incomeStatement: r.incomeStatement,
          balanceSheet: r.balanceSheet,
          functionalBalance: { frng: Number(r.frng), bfr: Number(r.bfr), netTreasury: Number(r.netTreasury) },
          market: { bySegment: r.marketDetail as CompanyRoundResult["market"]["bySegment"], totalShare: Number(r.marketShare) },
          production: (r.engineTrace as { production?: CompanyRoundResult["production"] })?.production ?? { utilizationRate: 0 },
        } as CompanyRoundResult);
      }
    }
  }

  for (const instance of toDebrief) {
    const def = situationByCode.get(codeById.get(instance.situationId) ?? "");
    if (!def) continue;

    const levels = levelsByInstance.get(instance.id) ?? [];
    const diagScore =
      ((instance.diagnosis as { score?: number } | null)?.score as number | undefined) ?? 0;
    const hasQuizQuestions = askedQuestions(def, quizMode).length > 0;
    let quizScore: number | null = null;
    if (hasQuizQuestions) {
      quizScore = (instance.quiz as { score?: number } | null)?.score ?? null;
      if (quizScore === null) {
        const choice = choiceByInstance.get(instance.id);
        quizScore = choice ? Number(choice.modelScore ?? 0) : 0;
      }
    }
    const raw = computeRawSituationScore({ diagnosisScore: diagScore, quizScore, hasQuizQuestions });
    const baseMultiplier = hintScoreMultiplier(levels, def.hints);
    const teamScore = raw * baseMultiplier;

    // A2 — snapshot conséquences pour les situations détectées
    let consequenceContext: ConsequenceFact[] | null = null;
    // A3 — interprétation pédagogique contextuelle
    let interpretationContext: InterpretationFact | null = null;
    if (instance.origin === "detected" && "detect" in def.trigger) {
      const before = beforeByTeam.get(instance.teamId);
      const after = afterByTeam.get(instance.teamId);
      if (before && after) {
        consequenceContext = buildConsequenceContext(def.trigger.detect, before, after);
        interpretationContext = buildInterpretation(def.trigger.detect, consequenceContext);
      }
    }

    await db
      .update(situationInstances)
      .set({
        status: "debriefed",
        diagnosis: {
          ...((instance.diagnosis as object) ?? {}),
          finalScore: teamScore,
          hintLevelsUsed: levels,
        },
        ...(consequenceContext !== null ? { consequenceContext } : {}),
        ...(interpretationContext !== null ? { interpretationContext } : {}),
      })
      .where(eq(situationInstances.id, instance.id));

    // Une ligne de progression ne se crée que s'il y a eu une réponse. Une
    // situation non rendue n'est pas une mesure à zéro, c'est une absence :
    // la vue enseignant affichait « 2 » puis « 1 » de maîtrise sans qu'aucun
    // élève ait rien saisi.
    const repondu =
      typeof (instance.diagnosis as { score?: unknown } | null)?.score === "number" ||
      typeof (instance.quiz as { score?: unknown } | null)?.score === "number" ||
      choiceByInstance.has(instance.id);
    const members = repondu ? (membersByTeam.get(instance.teamId) ?? []) : [];
    for (const member of members) {
      const memberSkills = (skillsByUser.get(member.userId) ?? []).map((s) => ({
        value: Number(s.value),
      }));
      const strength = playerStrength(memberSkills);
      const memberMultiplier = adaptiveHintMultiplier(levels, def.hints, strength);
      const score = raw * memberMultiplier;

      for (const conceptCode of def.conceptCodes) {
        const conceptId = conceptIdByCode.get(conceptCode);
        if (!conceptId) continue;
        const key = `${member.userId}:${conceptId}`;
        const current = progressMap.get(key);
        const mastery = updateMastery(Number(current?.mastery ?? 0), score, def.weight);
        const evidenceCount = (current?.evidenceCount ?? 0) + 1;
        await db
          .insert(learningProgress)
          .values({
            userId: member.userId,
            conceptId,
            mastery: mastery.toFixed(2),
            evidenceCount: 1,
            lastEventAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [learningProgress.userId, learningProgress.conceptId],
            set: {
              mastery: mastery.toFixed(2),
              evidenceCount,
              lastEventAt: new Date(),
            },
          });
        progressMap.set(key, { mastery: mastery.toFixed(2), evidenceCount });
      }
    }
  }

  // Recompute skills once for all affected users
  const codeByConceptId = new Map(conceptRows.map((r) => [r.id, r.code]));
  for (const userId of allUserIds) {
    const progress = await db
      .select({ mastery: learningProgress.mastery, conceptId: learningProgress.conceptId })
      .from(learningProgress)
      .where(eq(learningProgress.userId, userId));
    if (progress.length === 0) continue;
    const byAxis = new Map<string, number[]>();
    for (const p of progress) {
      const def = conceptByCode.get(codeByConceptId.get(p.conceptId) ?? "");
      if (!def) continue;
      const list = byAxis.get(def.axis) ?? [];
      list.push(Number(p.mastery));
      byAxis.set(def.axis, list);
    }
    for (const axis of AXES) {
      const masteries = byAxis.get(axis);
      if (!masteries || masteries.length === 0) continue;
      const value = aggregateAxis(masteries).toFixed(2);
      await db
        .insert(playerSkills)
        .values({ userId, axis, value })
        .onConflictDoUpdate({ target: [playerSkills.userId, playerSkills.axis], set: { value } });
    }
  }
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
