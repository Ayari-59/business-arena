import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  concepts,
  decisions,
  gameRankings,
  games,
  hintUsages,
  hints,
  learningProgress,
  modelChoices,
  playerSkills,
  players,
  roundResults,
  rounds,
  situationInstances,
  situations,
  teams,
  users,
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
import {
  SCENARIOS,
  scenarioByCode,
  situationByCode,
} from "@/config/scenarios/registry";
import { presetFromProfile, quizModeFromProfile, type QuizMode } from "@/config/difficulty";
import { decrireSource, lireSource, type DecisionSourceMap } from "@/config/decision-source";
import { hintScoreMultiplier, nextUnlockableLevel } from "@/pedagogy/hints";
import { evaluateDiagnosis, evaluateQuiz } from "@/pedagogy/evaluation";
import { buildConsequenceContext, buildInterpretation } from "@/pedagogy/detection";
import type { ConsequenceFact, InterpretationFact, TriggerFact } from "@/pedagogy/detection";
import { AXES, aggregateAxis, updateMastery } from "@/pedagogy/progress";
import { adaptiveHintMultiplier, playerStrength } from "@/pedagogy/adaptivity";
import { computeRawSituationScore } from "@/pedagogy/scoring";
import { loadInstanceForUser, unlockedLevels } from "./situation-instance.service";
import { hintCapOf } from "./hints.service";
import {
  RETAKE_MULTIPLIER,
  missedSituationPolicyFromProfile,
  type MissedSituationPolicy,
} from "@/config/missed-situation";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * Moteur pédagogique côté services (étapes 8-9, doc 03) : instancie les
 * situations, trace indices/diagnostics/choix de modèles, débriefe et met à
 * jour la progression. Les référentiels (concepts, modèles, situations) sont
 * des DONNÉES seedées de façon idempotente — jamais de contenu en dur ici.
 */

// Seed des référentiels (concepts, modèles, situations) : extrait dans
// pedagogy-seed.service.ts (refactoring V2, étape 9). Ré-exporté ici pour ne
// pas casser les appels via @/services/pedagogy.service.
export { seedPedagogyReferentials } from "./pedagogy-seed.service";

// Cycle de vie des situations (ouverture d'un tour, chargement d'une instance) :
// extrait dans situation-instance.service.ts (refactoring V2, étape 9).
// `openSituationsForRound` est ré-exporté pour les appelants existants ;
// `loadInstanceForUser`/`unlockedLevels` sont importés en tête.
export { openSituationsForRound } from "./situation-instance.service";

// ---------------------------------------------------------------------------
// Interactions joueur : indices, diagnostic, QCM de connaissances
// ---------------------------------------------------------------------------

// Indices (plafond + déblocage) : extraits dans hints.service.ts (refactoring
// V2, étape 9). `hintCapOf` est importé en tête (utilisé par toView) ;
// `unlockHint` est ré-exporté pour les appelants existants.
export { unlockHint } from "./hints.service";

/** Enregistre le diagnostic (options cochées + texte libre) et le score F1. */
// Diagnostic (enregistrement + score F1) : extrait dans diagnosis.service.ts
// (refactoring V2, étape 9).
export { submitDiagnosis } from "./diagnosis.service";

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

/** Profil de compétences (§28) : agrège les maîtrises de concepts par axe. */
async function recomputeSkills(userId: string): Promise<void> {
  const progress = await db
    .select({ mastery: learningProgress.mastery, conceptId: learningProgress.conceptId })
    .from(learningProgress)
    .where(eq(learningProgress.userId, userId));
  if (progress.length === 0) return;
  const conceptRows = await db.select().from(concepts);
  const codeById = new Map(conceptRows.map((r) => [r.id, r.code]));
  const byAxis = new Map<string, number[]>();
  for (const p of progress) {
    const def = conceptByCode.get(codeById.get(p.conceptId) ?? "");
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

function modelCtxOf(game: typeof games.$inferSelect | undefined): ModelCtx | undefined {
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
function askedQuestions(def: SituationDef, mode: QuizMode, ctx?: ModelCtx): QuizQuestionDef[] {
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

function toView(
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

export interface DebriefedRound {
  roundIndex: number;
  situations: SituationView[];
}

/** Situations de l'équipe du joueur : tour courant (à traiter) + tous les tours débriefés. */
export async function getTeamSituations(
  gameId: string,
  userId: string,
): Promise<{
  current: SituationView[];
  debriefedByRound: DebriefedRound[];
  missedPolicy: MissedSituationPolicy;
}> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  const policy = missedSituationPolicyFromProfile(
    game?.difficultyProfile,
    (game?.difficultyProfile as { kind?: string } | null)?.kind,
  );
  if (!game) return { current: [], debriefedByRound: [], missedPolicy: policy };
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humanIds = teamRows.filter((t) => t.controller === "human").map((t) => t.id);
  const membership = (
    await db
      .select()
      .from(players)
      .where(and(inArray(players.teamId, humanIds.length ? humanIds : ["-"]), eq(players.userId, userId)))
  )[0];
  if (!membership) return { current: [], debriefedByRound: [], missedPolicy: policy };

  const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const instances = await db
    .select()
    .from(situationInstances)
    .where(
      and(
        inArray(situationInstances.roundId, gameRounds.map((r) => r.id)),
        eq(situationInstances.teamId, membership.teamId),
      ),
    );
  if (instances.length === 0) return { current: [], debriefedByRound: [], missedPolicy: policy };

  const situationRows = await db.select().from(situations);
  const codeById = new Map(situationRows.map((r) => [r.id, r.code]));
  const quizMode = quizModeFromProfile(game.difficultyProfile);
  const hintCap = hintCapOf(game);

  const currentRound = gameRounds.find((r) => r.index === game.currentRound);
  const resolvedRoundIds = new Set(gameRounds.filter((r) => r.status === "resolved").map((r) => r.id));
  const roundIndexById = new Map(gameRounds.map((r) => [r.id, r.index]));

  const allHints = await db
    .select({ situationInstanceId: hintUsages.situationInstanceId, level: hintUsages.level })
    .from(hintUsages)
    .where(inArray(hintUsages.situationInstanceId, instances.map((i) => i.id)));
  const levelsByInstance = new Map<string, number[]>();
  for (const h of allHints) {
    const arr = levelsByInstance.get(h.situationInstanceId) ?? [];
    arr.push(h.level);
    levelsByInstance.set(h.situationInstanceId, arr);
  }

  const current: SituationView[] = [];
  const debriefedMap = new Map<number, SituationView[]>();
  for (const instance of instances) {
    const def = situationByCode.get(codeById.get(instance.situationId) ?? "");
    if (!def) continue;
    const levels = levelsByInstance.get(instance.id) ?? [];
    const view = toView(instance, def, levels, quizMode, hintCap, modelCtxOf(game));
    if (currentRound && instance.roundId === currentRound.id && instance.status !== "debriefed") {
      current.push(view);
    } else if (resolvedRoundIds.has(instance.roundId)) {
      const idx = roundIndexById.get(instance.roundId)!;
      const arr = debriefedMap.get(idx) ?? [];
      arr.push(view);
      debriefedMap.set(idx, arr);
    }
  }
  const debriefedByRound: DebriefedRound[] = [...debriefedMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([roundIndex, situations]) => ({ roundIndex, situations }));
  return { current, debriefedByRound, missedPolicy: policy };
}

export interface TeacherPedagogyView {
  /**
   * Maîtrise MESURÉE : moyenne des élèves qui ont au moins une réponse sur la
   * notion (les lignes de progression ne se créent qu'avec une réponse).
   * Vide tant qu'aucune situation n'a été rendue.
   */
  conceptMastery: { code: string; name: string; average: number; students: number }[];
  /** Notions EXPOSÉES par les situations du tour courant : une liste, pas un score. */
  conceptsExposed: { code: string; name: string }[];
  hintsUsedByTeam: { teamName: string; count: number }[];
  /** QCM de connaissances : combien soumis, taux de bonnes réponses moyen. */
  quizStats: { submitted: number; averageScore: number };
}

/** Vue pédagogique enseignant (§27) : « ma classe maîtrise-t-elle le BFR ? » */
export async function getTeacherPedagogyView(
  gameId: string,
  teacherId: string,
): Promise<TeacherPedagogyView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return null;

  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const teamIds = teamRows.map((t) => t.id);
  const memberships = teamIds.length
    ? await db.select().from(players).where(inArray(players.teamId, teamIds))
    : [];
  const userIds = [...new Set(memberships.map((m) => m.userId))];

  const conceptRows = await db.select().from(concepts);
  const progress = userIds.length
    ? await db.select().from(learningProgress).where(inArray(learningProgress.userId, userIds))
    : [];
  const byConcept = new Map<string, number[]>();
  for (const p of progress) {
    const list = byConcept.get(p.conceptId) ?? [];
    list.push(Number(p.mastery));
    byConcept.set(p.conceptId, list);
  }
  const conceptMastery = conceptRows
    .filter((c) => byConcept.has(c.id))
    .map((c) => {
      const values = byConcept.get(c.id)!;
      return {
        code: c.code,
        name: c.name,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        students: values.length,
      };
    })
    .sort((a, b) => a.average - b.average);

  const gameRounds = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const instances = gameRounds.length
    ? await db
        .select()
        .from(situationInstances)
        .where(inArray(situationInstances.roundId, gameRounds.map((r) => r.id)))
    : [];
  const instanceIds = instances.map((i) => i.id);
  const usages = instanceIds.length
    ? await db.select().from(hintUsages).where(inArray(hintUsages.situationInstanceId, instanceIds))
    : [];
  const instanceTeam = new Map(instances.map((i) => [i.id, i.teamId]));
  const hintsByTeam = new Map<string, number>();
  for (const u of usages) {
    const teamId = instanceTeam.get(u.situationInstanceId);
    if (!teamId) continue;
    hintsByTeam.set(teamId, (hintsByTeam.get(teamId) ?? 0) + 1);
  }

  const quizScores = instances
    .map((i) => (i.quiz as { score?: number } | null)?.score)
    .filter((s): s is number => typeof s === "number");

  // Les notions du tour courant : celles des situations ouvertes ce tour, pour
  // que l'enseignant sache ce qui est en jeu, sans le confondre avec ce qui
  // est acquis.
  const currentRound = gameRounds.find((r) => r.index === game.currentRound);
  const exposedCodes = new Set<string>();
  if (currentRound) {
    const situationIds = [
      ...new Set(instances.filter((i) => i.roundId === currentRound.id).map((i) => i.situationId)),
    ];
    const situationRows = situationIds.length
      ? await db.select().from(situations).where(inArray(situations.id, situationIds))
      : [];
    for (const row of situationRows) {
      for (const code of situationByCode.get(row.code)?.conceptCodes ?? []) exposedCodes.add(code);
    }
  }
  const conceptsExposed = conceptRows
    .filter((c) => exposedCodes.has(c.code))
    .map((c) => ({ code: c.code, name: c.name }));

  return {
    conceptMastery,
    conceptsExposed,
    hintsUsedByTeam: teamRows
      .filter((t) => t.controller === "human")
      .map((t) => ({ teamName: t.name, count: hintsByTeam.get(t.id) ?? 0 })),
    quizStats: {
      submitted: quizScores.length,
      averageScore:
        quizScores.length === 0
          ? 0
          : quizScores.reduce((a, b) => a + b, 0) / quizScores.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Carnet d'usage : ce que la vue par partie ne peut pas dire
// ---------------------------------------------------------------------------

/**
 * Agrégation sur TOUTES les parties d'un enseignant.
 *
 * La vue par partie répond à « ma classe maîtrise-t-elle le BFR ? ». Elle ne
 * peut pas répondre à « quelle situation bloque tout le monde, dans toutes mes
 * classes ? », qui est la question qui fait évoluer un cours. Une situation
 * ratée par une classe est un accident ; ratée par cinq, c'est l'énoncé qui
 * est en cause.
 *
 * Tout est calculé sur des données déjà enregistrées : aucune collecte
 * nouvelle, aucune donnée personnelle supplémentaire.
 */
export interface TeacherUsageView {
  totals: {
    games: number;
    finishedGames: number;
    teams: number;
    situationsDebriefed: number;
    hintsUnlocked: number;
  };
  /** Secteurs réellement joués, du plus au moins fréquent. */
  sectors: { code: string; title: string; games: number }[];
  /**
   * Les situations classées par score moyen CROISSANT : celles qui résistent
   * viennent en tête. Une situation jamais débriefée n'y figure pas, faute de
   * quoi elle passerait pour parfaitement réussie.
   */
  situations: {
    code: string;
    title: string;
    scenario: string;
    /** Équipes composées qui ont répondu, et dont le score fait la moyenne. */
    debriefed: number;
    /** Équipes composées qui n'ont rien rendu : un abandon, pas un score. */
    unanswered: number;
    /** Null quand personne n'a répondu : il n'y a alors rien à moyenner. */
    averageScore: number | null;
    /** Indices ouverts par équipe, et non par élève : l'indice est collectif. */
    averageHints: number;
  }[];
  /** Combien de fois chaque niveau d'indice a été ouvert, tous élèves confondus. */
  hintsByLevel: { level: number; count: number }[];
  /** Concepts les moins maîtrisés, tous élèves de l'enseignant confondus. */
  concepts: { code: string; name: string; average: number; students: number }[];
}

export async function getTeacherUsageView(teacherId: string): Promise<TeacherUsageView> {
  const empty: TeacherUsageView = {
    totals: { games: 0, finishedGames: 0, teams: 0, situationsDebriefed: 0, hintsUnlocked: 0 },
    sectors: [],
    situations: [],
    hintsByLevel: [],
    concepts: [],
  };

  const gameRows = await db.select().from(games).where(eq(games.createdBy, teacherId));
  if (gameRows.length === 0) return empty;
  const gameIds = gameRows.map((g) => g.id);

  const teamRows = await db.select().from(teams).where(inArray(teams.gameId, gameIds));
  const roundRows = await db.select().from(rounds).where(inArray(rounds.gameId, gameIds));
  const instances = roundRows.length
    ? await db
        .select()
        .from(situationInstances)
        .where(inArray(situationInstances.roundId, roundRows.map((r) => r.id)))
    : [];
  const usages = instances.length
    ? await db
        .select()
        .from(hintUsages)
        .where(inArray(hintUsages.situationInstanceId, instances.map((i) => i.id)))
    : [];

  // Secteurs : le code vient du SNAPSHOT, donc du scénario réellement joué.
  const sectorCounts = new Map<string, number>();
  for (const g of gameRows) {
    const code = scenarioByCode((g.scenarioSnapshot as { code?: string } | null)?.code).code;
    sectorCounts.set(code, (sectorCounts.get(code) ?? 0) + 1);
  }
  const sectors = [...sectorCounts.entries()]
    .map(([code, count]) => ({ code, title: scenarioByCode(code).title, games: count }))
    .sort((a, b) => b.games - a.games);

  // Une équipe sans joueur n'a jamais rien rendu, et son instance est pourtant
  // débriefée avec un score de zéro comme les autres. La moyenner reviendrait à
  // compter un absent comme un échec : en classe, un code distribué en avance ou
  // deux élèves manquants suffisent alors à faire passer une situation réussie
  // sous la barre. Les équipes réellement composées font seules la moyenne.
  const teamIds = teamRows.map((t) => t.id);
  const memberships = teamIds.length
    ? await db.select().from(players).where(inArray(players.teamId, teamIds))
    : [];
  const playedTeamIds = new Set(memberships.map((m) => m.teamId));

  // Situations : score moyen et indices moyens, sur les seules instances
  // DÉBRIEFÉES. Une situation ouverte et jamais traitée ne dit rien du tout.
  const situationRows = await db.select().from(situations);
  const codeById = new Map(situationRows.map((r) => [r.id, r.code]));
  const scenarioOf = new Map<string, string>();
  for (const d of SCENARIOS) for (const s of d.situations) scenarioOf.set(s.code, d.title);

  const hintsByInstance = new Map<string, number>();
  for (const u of usages) {
    hintsByInstance.set(
      u.situationInstanceId,
      (hintsByInstance.get(u.situationInstanceId) ?? 0) + 1,
    );
  }

  /**
   * Deux signaux, et non un seul.
   *
   * Une équipe qui compose son diagnostic et se trompe donne un SCORE. Une
   * équipe qui n'a rien rendu donne autre chose : un abandon. Le débriefing
   * inscrit pourtant un zéro dans les deux cas, et la moyenne les confondait.
   * Six situations ressortaient alors à 0 %, ce qui se lit « énoncé
   * infaisable » alors que personne n'avait essayé.
   *
   * On les sépare donc : la moyenne ne porte que sur les équipes qui ont
   * répondu, et le silence est compté à part. Une situation que tout le monde
   * laisse tomber reste visible, elle ne se déguise plus en échec.
   */
  const perSituation = new Map<
    string,
    { scores: number[]; hints: number[]; muettes: number }
  >();
  for (const inst of instances) {
    if (inst.status !== "debriefed") continue;
    if (!playedTeamIds.has(inst.teamId)) continue;
    const code = codeById.get(inst.situationId);
    if (!code) continue;
    const diagnosis = inst.diagnosis as { finalScore?: number; selected?: string[] } | null;
    if (typeof diagnosis?.finalScore !== "number") continue;
    const entry = perSituation.get(code) ?? { scores: [], hints: [], muettes: 0 };
    // « selected » n'existe que si l'équipe a soumis un diagnostic : le
    // débriefing, lui, n'ajoute que le score final.
    if (diagnosis.selected === undefined) {
      entry.muettes += 1;
    } else {
      entry.scores.push(diagnosis.finalScore);
      entry.hints.push(hintsByInstance.get(inst.id) ?? 0);
    }
    perSituation.set(code, entry);
  }

  const mean = (values: number[]) =>
    values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

  const situationStats = [...perSituation.entries()]
    .map(([code, { scores, hints: used, muettes }]) => ({
      code,
      title: situationByCode.get(code)?.title ?? code,
      scenario: scenarioOf.get(code) ?? "",
      debriefed: scores.length,
      unanswered: muettes,
      averageScore: scores.length === 0 ? null : mean(scores),
      averageHints: mean(used),
    }))
    // Les situations notées d'abord, de la plus dure à la plus facile. Celles
    // que personne n'a traitées ferment la marche : elles n'ont pas de score,
    // et leur place est de dire ce qui n'a pas été fait.
    .sort((a, b) => {
      if (a.averageScore === null) return b.averageScore === null ? 0 : 1;
      if (b.averageScore === null) return -1;
      return a.averageScore - b.averageScore;
    });

  const levelCounts = new Map<number, number>();
  for (const u of usages) levelCounts.set(u.level, (levelCounts.get(u.level) ?? 0) + 1);
  const hintsByLevel = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: levelCounts.get(level) ?? 0,
  }));

  // Concepts : la maîtrise de TOUS les élèves passés par les parties de cet
  // enseignant, quel que soit le scénario joué.
  const userIds = [...new Set(memberships.map((m) => m.userId))];
  const conceptRows = await db.select().from(concepts);
  const progress = userIds.length
    ? await db.select().from(learningProgress).where(inArray(learningProgress.userId, userIds))
    : [];
  const masteryByConcept = new Map<string, number[]>();
  for (const p of progress) {
    const list = masteryByConcept.get(p.conceptId) ?? [];
    list.push(Number(p.mastery));
    masteryByConcept.set(p.conceptId, list);
  }
  const conceptStats = conceptRows
    .filter((c) => masteryByConcept.has(c.id))
    .map((c) => {
      const values = masteryByConcept.get(c.id)!;
      return { code: c.code, name: c.name, average: mean(values), students: values.length };
    })
    .sort((a, b) => a.average - b.average);

  return {
    totals: {
      games: gameRows.length,
      finishedGames: gameRows.filter((g) => g.status === "finished").length,
      // Les équipes pilotées par un bot ne sont pas des élèves : les compter
      // gonflerait le carnet d'un facteur qui ne dépend que du nombre de
      // concurrents choisi à la création.
      teams: teamRows.filter((t) => t.controller === "human").length,
      situationsDebriefed: instances.filter(
        (i) => i.status === "debriefed" && playedTeamIds.has(i.teamId),
      ).length,
      hintsUnlocked: usages.length,
    },
    sectors,
    situations: situationStats,
    hintsByLevel,
    concepts: conceptStats,
  };
}


/**
 * Relevé de notes d'une partie : de quoi finir la séance.
 *
 * Le produit accompagnait l'enseignant jusqu'à l'avant-dernière étape. Il
 * voyait la maîtrise de sa classe, les indices ouverts, le classement au score
 * composite, et rien de tout cela n'est une note : il devait recopier des
 * chiffres à la main depuis son écran. Le relevé décompose ce que le jeu a
 * déjà enregistré, équipe par équipe et situation par situation.
 *
 * Deux notes séparées, jamais fondues en une :
 *
 * - la note PÉDAGOGIQUE, sur 20, tirée des situations rendues : diagnostic,
 *   questions, moins le malus d'indices. C'est ce que l'équipe a compris ;
 * - la performance de GESTION, le score composite et le résultat cumulé.
 *   C'est ce que l'entreprise a fait, et une bonne analyse peut mener à un
 *   mauvais trimestre.
 *
 * Les pondérer l'une par l'autre serait un choix pédagogique qui appartient à
 * l'enseignant, pas au logiciel. Les deux sont donc servies côte à côte.
 *
 * Comme dans le carnet d'usage, une situation NON RENDUE n'entre pas dans la
 * moyenne : elle est comptée à part. Un silence n'est pas un zéro tant que
 * l'enseignant n'en a pas décidé ainsi, et il lui faut le voir pour décider.
 */
export interface TeamGrade {
  teamId: string;
  name: string;
  students: string[];
  /** Situations débriefées auxquelles l'équipe a effectivement répondu. */
  answered: number;
  /** Situations débriefées sans aucune réponse rendue. */
  unanswered: number;
  /** Moyenne des scores finaux des situations rendues, de 0 à 1. */
  average: number | null;
  /** La même, sur 20, arrondie au quart de point. Null si rien n'a été rendu. */
  note: number | null;
  /** Moyenne du seul diagnostic, avant questions et avant malus. */
  diagnosisAverage: number | null;
  /** Moyenne des questions posées, null si la partie n'en pose aucune. */
  quizAverage: number | null;
  hintsUsed: number;
  /** Points perdus sur 20 à cause des indices, sur les situations rendues. */
  hintPenalty: number;
  rank: number | null;
  bpi: number | null;
  cumulativeNetIncome: number | null;
  /**
   * Source des pivots (prix, volume) au dernier tour clos : 'default' quand
   * l'équipe a validé les valeurs proposées, 'carried' quand rien n'a été
   * validé. Null pour un tour antérieur à cette mesure, ou sans tour clos.
   */
  lastDecisionSource: DecisionSourceMap | null;
  /** La même, en toutes lettres pour le tableur : « prix : modifié · volume : par défaut ». */
  lastDecisionSourceLabel: string;
  situations: {
    code: string;
    title: string;
    round: number;
    answered: boolean;
    score: number | null;
    hints: number;
  }[];
}

export interface GradeSheet {
  gameId: string;
  /** Le code d'invitation : ce qui distingue deux classes du même secteur. */
  joinCode: string | null;
  scenarioTitle: string;
  quizMode: QuizMode;
  /** Tours déjà clôturés : le dénominateur des situations attendues. */
  roundsResolved: number;
  teams: TeamGrade[];
}

/** Arrondi au quart de point : une note de bulletin, pas un flottant. */
const surVingt = (part: number) => Math.round(part * 20 * 4) / 4;

export async function getGameGradeSheet(
  gameId: string,
  teacherId: string,
): Promise<GradeSheet | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return null;

  const teamRows = (await db.select().from(teams).where(eq(teams.gameId, gameId))).filter(
    (t) => t.controller === "human",
  );
  const teamIds = teamRows.map((t) => t.id);
  const roundRows = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const resolved = roundRows.filter((r) => r.status === "resolved");

  // La source des décisions du dernier tour clos : qui a décidé, qui a laissé
  // faire. Une colonne du relevé, pas une note.
  const dernierClos = [...resolved].sort((a, b) => b.index - a.index)[0];
  const dernieresDecisions =
    dernierClos && teamIds.length
      ? await db
          .select()
          .from(decisions)
          .where(and(eq(decisions.roundId, dernierClos.id), inArray(decisions.teamId, teamIds)))
      : [];

  const instances =
    teamIds.length && roundRows.length
      ? await db
          .select()
          .from(situationInstances)
          .where(inArray(situationInstances.teamId, teamIds))
      : [];
  const usages = instances.length
    ? await db
        .select()
        .from(hintUsages)
        .where(inArray(hintUsages.situationInstanceId, instances.map((i) => i.id)))
    : [];
  const hintsByInstance = new Map<string, number>();
  for (const u of usages) {
    hintsByInstance.set(u.situationInstanceId, (hintsByInstance.get(u.situationInstanceId) ?? 0) + 1);
  }

  const situationRows = await db.select().from(situations);
  const codeById = new Map(situationRows.map((r) => [r.id, r.code]));
  const roundIndexById = new Map(roundRows.map((r) => [r.id, r.index]));
  const quizMode = quizModeFromProfile(game.difficultyProfile);
  const memberships = teamIds.length
    ? await db
        .select({ teamId: players.teamId, name: users.displayName })
        .from(players)
        .innerJoin(users, eq(users.id, players.userId))
        .where(inArray(players.teamId, teamIds))
    : [];
  const rankingRows = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));

  const teamGrades: TeamGrade[] = teamRows.map((team) => {
    const ownes = instances
      .filter((i) => i.teamId === team.id && i.status === "debriefed")
      .sort(
        (a, b) => (roundIndexById.get(a.roundId) ?? 0) - (roundIndexById.get(b.roundId) ?? 0),
      );

    const lignes = ownes.map((inst) => {
      const code = codeById.get(inst.situationId) ?? "";
      const def = situationByCode.get(code);
      const diagnosis = inst.diagnosis as
        | { finalScore?: number; score?: number; selected?: string[] }
        | null;
      // « selected » n'existe que si l'équipe a soumis : le débriefing, lui,
      // n'ajoute que le score final.
      const answered = diagnosis?.selected !== undefined;
      // Une question posée et laissée sans réponse vaut zéro : c'est ce que
      // fait le débriefing, et le relevé doit décomposer le MÊME calcul, sans
      // quoi l'écart qu'il attribue aux indices contiendrait autre chose.
      const questionsPosees = def ? askedQuestions(def, quizMode).length > 0 : false;
      const quiz = questionsPosees
        ? ((inst.quiz as { score?: number } | null)?.score ?? 0)
        : null;
      return {
        code,
        title: def?.title ?? code,
        round: roundIndexById.get(inst.roundId) ?? 0,
        answered,
        score: answered && typeof diagnosis?.finalScore === "number" ? diagnosis.finalScore : null,
        hints: hintsByInstance.get(inst.id) ?? 0,
        rawDiagnosis: answered && typeof diagnosis?.score === "number" ? diagnosis.score : null,
        quiz: answered ? quiz : null,
      };
    });

    const rendues = lignes.filter((l) => l.answered && l.score !== null);
    const moyenne = (values: number[]) =>
      values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

    const average = moyenne(rendues.map((l) => l.score!));
    const diagnosisAverage = moyenne(
      rendues.filter((l) => l.rawDiagnosis !== null).map((l) => l.rawDiagnosis!),
    );
    const quizAverage = moyenne(rendues.filter((l) => l.quiz !== null).map((l) => l.quiz!));

    // Ce que les indices ont coûté : l'écart entre le score AVANT malus et le
    // score final, exprimé en points de la note sur 20. C'est ce qui permet de
    // distinguer une note basse due à une erreur d'analyse d'une note basse
    // due à l'aide reçue. Le score avant malus se recompose exactement comme
    // le fait le débriefing, faute de quoi l'écart contiendrait aussi les
    // questions laissées sans réponse.
    const sansMalus = moyenne(
      rendues.map((l) =>
        computeRawSituationScore({
          diagnosisScore: l.rawDiagnosis ?? 0,
          quizScore: l.quiz,
          hasQuizQuestions: l.quiz !== null,
        }),
      ),
    );
    const hintPenalty =
      average !== null && sansMalus !== null ? Math.max(0, surVingt(sansMalus - average)) : 0;

    const classement = rankingRows.find((r) => r.teamId === team.id);
    return {
      teamId: team.id,
      name: team.name.replace(/\s*\(vous\)\s*$/, ""),
      students: memberships.filter((m) => m.teamId === team.id).map((m) => m.name),
      answered: rendues.length,
      unanswered: lignes.filter((l) => !l.answered).length,
      average,
      note: average === null ? null : surVingt(average),
      diagnosisAverage,
      quizAverage,
      hintsUsed: lignes.reduce((n, l) => n + l.hints, 0),
      hintPenalty,
      rank: classement?.rank ?? null,
      bpi: classement ? Number(classement.bpi) : null,
      cumulativeNetIncome: classement
        ? Number((classement.detail as { cumulativeNetIncome?: number })?.cumulativeNetIncome ?? 0)
        : null,
      lastDecisionSource: lireSource(
        dernieresDecisions.find((d) => d.teamId === team.id)?.decisionSource,
      ),
      lastDecisionSourceLabel: decrireSource(
        lireSource(dernieresDecisions.find((d) => d.teamId === team.id)?.decisionSource),
      ),
      situations: lignes.map(({ code, title, round, answered, score, hints }) => ({
        code,
        title,
        round,
        answered,
        score,
        hints,
      })),
    };
  });

  return {
    gameId,
    joinCode: game.joinCode ?? null,
    scenarioTitle: scenarioByCode(
      (game.scenarioSnapshot as { code?: string } | null)?.code,
    ).title,
    quizMode: quizModeFromProfile(game.difficultyProfile),
    roundsResolved: resolved.length,
    teams: teamGrades.sort((a, b) => a.name.localeCompare(b.name, "fr")),
  };
}

// ---------------------------------------------------------------------------
// Vue par élève : la progression individuelle que l'enseignant ne voit pas
// ---------------------------------------------------------------------------

export interface StudentProgress {
  userId: string;
  displayName: string;
  teamName: string;
  skills: { axis: string; value: number }[];
  /** Force globale [0, 100] — moyenne des 7 axes. */
  strength: number;
  concepts: { code: string; name: string; mastery: number }[];
  /** Score moyen sur les situations débriefées de cette partie. */
  averageScore: number | null;
  situationsAnswered: number;
  situationsUnanswered: number;
  hintsUsed: number;
}

export interface StudentProgressView {
  gameId: string;
  scenarioTitle: string;
  classAverage: { strength: number; averageScore: number | null };
  students: StudentProgress[];
}

export async function getStudentProgressView(
  gameId: string,
  teacherId: string,
): Promise<StudentProgressView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game || game.createdBy !== teacherId) return null;

  const teamRows = (await db.select().from(teams).where(eq(teams.gameId, gameId))).filter(
    (t) => t.controller === "human",
  );
  const teamIds = teamRows.map((t) => t.id);
  const teamNameById = new Map(teamRows.map((t) => [t.id, t.name]));

  const memberships = teamIds.length
    ? await db
        .select({ userId: players.userId, teamId: players.teamId, name: users.displayName })
        .from(players)
        .innerJoin(users, eq(users.id, players.userId))
        .where(inArray(players.teamId, teamIds))
    : [];
  if (memberships.length === 0)
    return {
      gameId,
      scenarioTitle: scenarioByCode((game.scenarioSnapshot as { code?: string } | null)?.code).title,
      classAverage: { strength: 0, averageScore: null },
      students: [],
    };

  const userIds = [...new Set(memberships.map((m) => m.userId))];

  const allSkills = await db
    .select()
    .from(playerSkills)
    .where(inArray(playerSkills.userId, userIds));
  const skillsByUser = new Map<string, { axis: string; value: number }[]>();
  for (const s of allSkills) {
    const list = skillsByUser.get(s.userId) ?? [];
    list.push({ axis: s.axis, value: Number(s.value) });
    skillsByUser.set(s.userId, list);
  }

  const conceptRows = await db.select().from(concepts);
  const conceptNameById = new Map(conceptRows.map((r) => [r.id, { code: r.code, name: r.name }]));
  const allProgress = await db
    .select()
    .from(learningProgress)
    .where(inArray(learningProgress.userId, userIds));
  const progressByUser = new Map<string, { code: string; name: string; mastery: number }[]>();
  for (const p of allProgress) {
    const concept = conceptNameById.get(p.conceptId);
    if (!concept) continue;
    const list = progressByUser.get(p.userId) ?? [];
    list.push({ code: concept.code, name: concept.name, mastery: Number(p.mastery) });
    progressByUser.set(p.userId, list);
  }

  const roundRows = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const instances = teamIds.length && roundRows.length
    ? await db
        .select()
        .from(situationInstances)
        .where(inArray(situationInstances.teamId, teamIds))
    : [];
  const usages = instances.length
    ? await db
        .select()
        .from(hintUsages)
        .where(inArray(hintUsages.situationInstanceId, instances.map((i) => i.id)))
    : [];
  const hintsByTeam = new Map<string, number>();
  for (const u of usages) {
    const teamId = instances.find((i) => i.id === u.situationInstanceId)?.teamId;
    if (teamId) hintsByTeam.set(teamId, (hintsByTeam.get(teamId) ?? 0) + 1);
  }

  const scoresByTeam = new Map<string, { answered: number; unanswered: number; scores: number[] }>();
  for (const inst of instances) {
    const entry = scoresByTeam.get(inst.teamId) ?? { answered: 0, unanswered: 0, scores: [] };
    if (inst.status === "debriefed") {
      const diag = inst.diagnosis as { finalScore?: number; selected?: string[] } | null;
      if (diag?.selected !== undefined) {
        entry.answered++;
        if (typeof diag.finalScore === "number") entry.scores.push(diag.finalScore);
      } else {
        entry.unanswered++;
      }
    }
    scoresByTeam.set(inst.teamId, entry);
  }

  const students: StudentProgress[] = memberships.map((m) => {
    const skills = skillsByUser.get(m.userId) ?? [];
    const strength = playerStrength(skills);
    const teamData = scoresByTeam.get(m.teamId);
    const avg = teamData && teamData.scores.length > 0
      ? teamData.scores.reduce((a, b) => a + b, 0) / teamData.scores.length
      : null;
    return {
      userId: m.userId,
      displayName: m.name,
      teamName: (teamNameById.get(m.teamId) ?? "").replace(/\s*\(vous\)\s*$/, ""),
      skills: skills.sort((a, b) => b.value - a.value),
      strength: Math.round(strength * 10) / 10,
      concepts: (progressByUser.get(m.userId) ?? []).sort((a, b) => a.mastery - b.mastery),
      averageScore: avg,
      situationsAnswered: teamData?.answered ?? 0,
      situationsUnanswered: teamData?.unanswered ?? 0,
      hintsUsed: hintsByTeam.get(m.teamId) ?? 0,
    };
  });

  const strengths = students.map((s) => s.strength);
  const avgStrength = strengths.length > 0
    ? strengths.reduce((a, b) => a + b, 0) / strengths.length
    : 0;
  const allScores = students.filter((s) => s.averageScore !== null).map((s) => s.averageScore!);
  const avgScore = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : null;

  return {
    gameId,
    scenarioTitle: scenarioByCode((game.scenarioSnapshot as { code?: string } | null)?.code).title,
    classAverage: { strength: Math.round(avgStrength * 10) / 10, averageScore: avgScore },
    students: students.sort((a, b) => a.strength - b.strength),
  };
}
