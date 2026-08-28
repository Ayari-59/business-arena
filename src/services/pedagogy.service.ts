import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  concepts,
  decisionModels,
  gameRankings,
  games,
  hintUsages,
  hints,
  learningProgress,
  modelChoices,
  playerSkills,
  players,
  rounds,
  situationConcepts,
  situationInstances,
  situationModels,
  situations,
  teams,
  users,
} from "@/db/schema";
import { CONCEPTS, conceptByCode } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import type { SituationDef } from "@/config/scenarios/nova/situations";
import {
  MODEL_QUESTION_ID,
  type QuizQuestionDef,
} from "@/config/scenarios/situation-kit";
import {
  ALL_SITUATIONS,
  SCENARIOS,
  scenarioByCode,
  situationByCode,
} from "@/config/scenarios/registry";
import { presetFromProfile, quizModeFromProfile, type QuizMode } from "@/config/difficulty";
import { hintScoreMultiplier, nextUnlockableLevel } from "@/pedagogy/hints";
import { evaluateDiagnosis, evaluateQuiz } from "@/pedagogy/evaluation";
import { detectSituations } from "@/pedagogy/detection";
import { AXES, aggregateAxis, updateMastery } from "@/pedagogy/progress";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * Moteur pédagogique côté services (étapes 8-9, doc 03) : instancie les
 * situations, trace indices/diagnostics/choix de modèles, débriefe et met à
 * jour la progression. Les référentiels (concepts, modèles, situations) sont
 * des DONNÉES seedées de façon idempotente — jamais de contenu en dur ici.
 */

// ---------------------------------------------------------------------------
// Seed idempotent des référentiels (appelé à la création de partie)
// ---------------------------------------------------------------------------

const DOMAIN_TO_DB: Record<string, "market" | "commercial" | "costs" | "margins" | "thresholds" | "production" | "finance" | "profitability"> = {
  market: "market",
  commercial: "commercial",
  costs: "costs",
  margins: "margins",
  thresholds: "thresholds",
  production: "production",
  finance: "finance",
  profitability: "profitability",
};

export async function seedPedagogyReferentials(): Promise<void> {
  await db
    .insert(concepts)
    .values(
      CONCEPTS.map((c) => ({
        code: c.code,
        name: c.name,
        domain: DOMAIN_TO_DB[c.domain]!,
        definition: c.definition,
        layers: { intuition: c.intuition, method: c.method },
        formulas: c.formula ? [c.formula] : null,
        introDifficulty: 1,
      })),
    )
    .onConflictDoNothing({ target: concepts.code });

  await db
    .insert(decisionModels)
    .values(
      DECISION_MODELS.map((m) => ({
        code: m.code,
        name: m.name,
        description: m.description,
        objective: m.objective,
        difficulty: m.difficulty,
      })),
    )
    .onConflictDoNothing({ target: decisionModels.code });

  await db
    .insert(situations)
    .values(
      ALL_SITUATIONS.map((s) => ({
        code: s.code,
        titleKey: s.title,
        narrativeKey: s.narrative,
        problemKey: s.problem,
        diagnosticOptions: s.diagnosticOptions,
        trigger: s.trigger,
        difficulty: 1,
        weight: s.weight.toString(),
      })),
    )
    .onConflictDoNothing({ target: situations.code });

  // Jointures (hints, matrice de pertinence, concepts) — après résolution des ids
  const situationRows = await db.select().from(situations);
  const modelRows = await db.select().from(decisionModels);
  const conceptRows = await db.select().from(concepts);
  const situationIdByCode = new Map(situationRows.map((r) => [r.code, r.id]));
  const modelIdByCode = new Map(modelRows.map((r) => [r.code, r.id]));
  const conceptIdByCode = new Map(conceptRows.map((r) => [r.code, r.id]));

  const hintValues = ALL_SITUATIONS.flatMap((s) =>
    s.hints.map((h) => ({
      situationId: situationIdByCode.get(s.code)!,
      level: h.level,
      textKey: h.text,
      costRatio: h.costRatio.toString(),
    })),
  );
  if (hintValues.length > 0) await db.insert(hints).values(hintValues).onConflictDoNothing();

  const relevanceValues = ALL_SITUATIONS.flatMap((s) =>
    Object.entries(s.modelRelevance)
      .filter(([code]) => modelIdByCode.has(code))
      .map(([code, relevance]) => ({
        situationId: situationIdByCode.get(s.code)!,
        decisionModelId: modelIdByCode.get(code)!,
        relevance,
      })),
  );
  if (relevanceValues.length > 0)
    await db.insert(situationModels).values(relevanceValues).onConflictDoNothing();

  const conceptValues = ALL_SITUATIONS.flatMap((s) =>
    s.conceptCodes
      .filter((code) => conceptIdByCode.has(code))
      .map((code) => ({
        situationId: situationIdByCode.get(s.code)!,
        conceptId: conceptIdByCode.get(code)!,
      })),
  );
  if (conceptValues.length > 0)
    await db.insert(situationConcepts).values(conceptValues).onConflictDoNothing();
}

// ---------------------------------------------------------------------------
// Instanciation des situations d'un tour (scriptées + détectées, doc 03 §1.1)
// ---------------------------------------------------------------------------

export async function openSituationsForRound(
  gameId: string,
  roundIndex: number,
  previousResults?: Record<string, CompanyRoundResult>,
): Promise<void> {
  const roundRow = (
    await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, roundIndex)))
  )[0];
  if (!roundRow) return;
  const humanTeams = await db
    .select()
    .from(teams)
    .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  if (humanTeams.length === 0) return;

  const situationRows = await db.select().from(situations);
  const situationIdByCode = new Map(situationRows.map((r) => [r.code, r.id]));

  // Les situations appartiennent au scénario JOUÉ : une partie d'hôtellerie
  // n'ouvre jamais une situation d'atelier. Le snapshot porte le code du
  // scénario de la partie (un code inconnu retombe sur NOVA).
  const gameRow = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  const snapshotCode = (gameRow?.scenarioSnapshot as { code?: string } | null)?.code;
  const definition = scenarioByCode(snapshotCode);

  const values: (typeof situationInstances.$inferInsert)[] = [];
  const scripted = definition.situations.filter(
    (s) => "round" in s.trigger && s.trigger.round === roundIndex,
  );
  for (const team of humanTeams) {
    for (const s of scripted) {
      const situationId = situationIdByCode.get(s.code);
      if (situationId)
        values.push({
          roundId: roundRow.id,
          teamId: team.id,
          situationId,
          origin: "scripted",
          status: "open",
          openedAt: new Date(),
        });
    }
    const result = previousResults?.[team.id];
    if (result) {
      const detected = new Set(
        detectSituations(result, {
          placement: presetFromProfile(gameRow?.difficultyProfile).decisions.placement,
        }),
      );
      // Résolution par le déclencheur porté par la situation, pas par une
      // convention de nommage : chaque scénario nomme ses situations librement.
      for (const s of definition.situations) {
        if (!("detect" in s.trigger) || !detected.has(s.trigger.detect)) continue;
        const situationId = situationIdByCode.get(s.code);
        if (situationId)
          values.push({
            roundId: roundRow.id,
            teamId: team.id,
            situationId,
            origin: "detected",
            status: "open",
            openedAt: new Date(),
          });
      }
    }
  }
  if (values.length > 0)
    await db.insert(situationInstances).values(values).onConflictDoNothing();
}

// ---------------------------------------------------------------------------
// Interactions joueur : indices, diagnostic, QCM de connaissances
// ---------------------------------------------------------------------------

async function loadInstanceForUser(instanceId: string, userId: string) {
  const instance = (
    await db.select().from(situationInstances).where(eq(situationInstances.id, instanceId))
  )[0];
  if (!instance) throw new Error("Situation introuvable");
  const membership = (
    await db
      .select()
      .from(players)
      .where(and(eq(players.teamId, instance.teamId), eq(players.userId, userId)))
  )[0];
  if (!membership) throw new Error("Vous n'êtes pas membre de cette équipe");
  const situationRow = (
    await db.select().from(situations).where(eq(situations.id, instance.situationId))
  )[0]!;
  const def = situationByCode.get(situationRow.code);
  if (!def) throw new Error("Définition de situation manquante");
  const teamRow = (await db.select().from(teams).where(eq(teams.id, instance.teamId)))[0];
  const gameRow = teamRow
    ? (await db.select().from(games).where(eq(games.id, teamRow.gameId)))[0]
    : undefined;
  return { instance, situationRow, def, game: gameRow };
}

async function unlockedLevels(instanceId: string): Promise<number[]> {
  const rows = await db
    .select({ level: hintUsages.level })
    .from(hintUsages)
    .where(eq(hintUsages.situationInstanceId, instanceId));
  return rows.map((r) => r.level);
}

/**
 * Plafond d'indices de la partie, et la phrase qui l'explique.
 *
 * Une seule definition pour les deux usages : le refus au moment du clic, et
 * l'affichage qui doit l'annoncer AVANT. Les avoir separes est ce qui a produit
 * un bouton propose puis refuse.
 */
function hintCapOf(game: typeof games.$inferSelect): { cap: number; reason: string } {
  const preset = presetFromProfile(game.difficultyProfile);
  const cap = game.mode === "competition" ? Math.min(preset.hintMaxLevel, 3) : preset.hintMaxLevel;
  return {
    cap,
    reason:
      cap === 0
        ? `Niveau ${preset.name} : aucun indice, conditions réelles`
        : game.mode === "competition" && cap === 3
          ? "Mode compétition : indices limités aux niveaux 1 à 3"
          : `Niveau ${preset.name} : indices limités aux niveaux 1 à ${cap}`,
  };
}

/** Débloque le prochain indice (séquentiel, irréversible, tracé — doc 03 §4). */
export async function unlockHint(args: {
  instanceId: string;
  userId: string;
}): Promise<{ level: number; text: string }> {
  const { instance, situationRow, def } = await loadInstanceForUser(args.instanceId, args.userId);
  if (instance.status === "debriefed") throw new Error("Cette situation est déjà débriefée");
  const levels = await unlockedLevels(args.instanceId);
  const next = nextUnlockableLevel(levels);
  if (next === null) throw new Error("Tous les indices sont déjà débloqués");
  // Plafonds : niveau de difficulté de la partie (préréglage en données,
  // doc 08 §2), et §25 : jamais plus que le niveau 3 en mode compétition.
  const roundRow = (await db.select().from(rounds).where(eq(rounds.id, instance.roundId)))[0];
  if (roundRow) {
    const game = (await db.select().from(games).where(eq(games.id, roundRow.gameId)))[0];
    if (game) {
      const { cap, reason } = hintCapOf(game);
      if (next > cap) throw new Error(reason);
    }
  }
  const hintRow = (
    await db
      .select()
      .from(hints)
      .where(and(eq(hints.situationId, situationRow.id), eq(hints.level, next)))
  )[0];
  if (!hintRow) throw new Error("Indice introuvable");
  await db
    .insert(hintUsages)
    .values({
      situationInstanceId: args.instanceId,
      hintId: hintRow.id,
      level: next,
      userId: args.userId,
    })
    .onConflictDoNothing();
  const text = def.hints.find((h) => h.level === next)?.text ?? hintRow.textKey;
  return { level: next, text };
}

/** Enregistre le diagnostic (options cochées + texte libre) et le score F1. */
export async function submitDiagnosis(args: {
  instanceId: string;
  userId: string;
  selectedOptionIds: string[];
  freeText?: string;
}): Promise<{ score: number }> {
  const { instance, def } = await loadInstanceForUser(args.instanceId, args.userId);
  if (instance.status === "debriefed") throw new Error("Cette situation est déjà débriefée");
  const score = evaluateDiagnosis(args.selectedOptionIds, def.diagnosticOptions);
  await db
    .update(situationInstances)
    .set({
      diagnosis: { selected: args.selectedOptionIds, freeText: args.freeText ?? "", score },
      status: instance.status === "open" ? "diagnosed" : instance.status,
    })
    .where(eq(situationInstances.id, args.instanceId));
  return { score };
}

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
  const asked = askedQuestions(def, quizModeFromProfile(game?.difficultyProfile));
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

  for (const instance of instances) {
    if (instance.status === "debriefed") continue;
    const def = situationByCode.get(codeById.get(instance.situationId) ?? "");
    if (!def) continue;

    const levels = await unlockedLevels(instance.id);
    const diagScore =
      ((instance.diagnosis as { score?: number } | null)?.score as number | undefined) ?? 0;
    // Aucune question posée : le score repose ENTIÈREMENT sur le diagnostic.
    // Ne pas neutraliser la moitié « questions » reviendrait à plafonner
    // toutes les situations à 50 % pour une question jamais posée.
    let raw: number;
    if (askedQuestions(def, quizMode).length === 0) {
      raw = diagScore;
    } else {
      const quizStored = instance.quiz as { score?: number } | null;
      let knowledgeScore = quizStored?.score ?? null;
      if (knowledgeScore === null) {
        // instances antérieures au QCM : repli sur le choix de modèle historisé
        const choice = (
          await db
            .select()
            .from(modelChoices)
            .where(eq(modelChoices.situationInstanceId, instance.id))
        )[0];
        knowledgeScore = choice ? Number(choice.modelScore ?? 0) : 0;
      }
      raw = 0.5 * diagScore + 0.5 * knowledgeScore;
    }
    const score = raw * hintScoreMultiplier(levels, def.hints);

    await db
      .update(situationInstances)
      .set({
        status: "debriefed",
        diagnosis: {
          ...((instance.diagnosis as object) ?? {}),
          finalScore: score,
          hintLevelsUsed: levels,
        },
      })
      .where(eq(situationInstances.id, instance.id));

    // Progression des joueurs de l'équipe sur les concepts de la situation
    const members = await db
      .select()
      .from(players)
      .where(eq(players.teamId, instance.teamId));
    for (const member of members) {
      for (const conceptCode of def.conceptCodes) {
        const conceptId = conceptIdByCode.get(conceptCode);
        if (!conceptId) continue;
        const current = (
          await db
            .select()
            .from(learningProgress)
            .where(
              and(
                eq(learningProgress.userId, member.userId),
                eq(learningProgress.conceptId, conceptId),
              ),
            )
        )[0];
        const mastery = updateMastery(Number(current?.mastery ?? 0), score, def.weight);
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
              evidenceCount: (current?.evidenceCount ?? 0) + 1,
              lastEventAt: new Date(),
            },
          });
      }
      await recomputeSkills(member.userId);
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
function askedQuestions(def: SituationDef, mode: QuizMode): QuizQuestionDef[] {
  if (mode === "off") return [];
  if (mode === "model") return def.quiz.filter((q) => q.id === MODEL_QUESTION_ID);
  return def.quiz;
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

export interface SituationView {
  instanceId: string;
  code: string;
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
  diagnosis: { selected: string[]; freeText: string; score?: number; finalScore?: number } | null;
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
    concepts: { code: string; name: string }[];
    finalScore: number;
  } | null;
}

function toView(
  instance: typeof situationInstances.$inferSelect,
  def: SituationDef,
  levels: number[],
  quizMode: QuizMode = "full",
  hintCap: { cap: number; reason: string } = { cap: 5, reason: "" },
): SituationView {
  const asked = askedQuestions(def, quizMode);
  const modelAsked = asked.some((q) => q.id === MODEL_QUESTION_ID);
  const debriefed = instance.status === "debriefed";
  const diagnosis = instance.diagnosis as SituationView["diagnosis"];
  const quizStored = instance.quiz as { answers?: Record<string, string>; score?: number } | null;
  return {
    instanceId: instance.id,
    code: def.code,
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
    diagnosis,
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
          // questions retirerait aussi la leçon centrale de la situation.
          modelInsight: modelAsked ? null : modelInsight(def),
          concepts: def.conceptCodes
            .map((code) => conceptByCode.get(code))
            .filter((c): c is NonNullable<typeof c> => Boolean(c))
            .map((c) => ({ code: c.code, name: c.name })),
          finalScore: diagnosis?.finalScore ?? 0,
        }
      : null,
  };
}

/** Situations de l'équipe du joueur : tour courant (à traiter) + tour débriefé. */
export async function getTeamSituations(
  gameId: string,
  userId: string,
): Promise<{ current: SituationView[]; debriefed: SituationView[] }> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return { current: [], debriefed: [] };
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humanIds = teamRows.filter((t) => t.controller === "human").map((t) => t.id);
  const membership = (
    await db
      .select()
      .from(players)
      .where(and(inArray(players.teamId, humanIds.length ? humanIds : ["-"]), eq(players.userId, userId)))
  )[0];
  if (!membership) return { current: [], debriefed: [] };

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
  if (instances.length === 0) return { current: [], debriefed: [] };

  const situationRows = await db.select().from(situations);
  const codeById = new Map(situationRows.map((r) => [r.id, r.code]));
  const quizMode = quizModeFromProfile(game.difficultyProfile);
  const hintCap = hintCapOf(game);

  const currentRound = gameRounds.find((r) => r.index === game.currentRound);
  const lastDebriefedRound = gameRounds
    .filter((r) => r.status === "resolved")
    .sort((a, b) => b.index - a.index)[0];

  const build = async (instance: typeof situationInstances.$inferSelect) => {
    const def = situationByCode.get(codeById.get(instance.situationId) ?? "");
    if (!def) return null;
    const levels = await unlockedLevels(instance.id);
    return toView(instance, def, levels, quizMode, hintCap);
  };

  const current: SituationView[] = [];
  const debriefed: SituationView[] = [];
  for (const instance of instances) {
    const view = await build(instance);
    if (!view) continue;
    if (currentRound && instance.roundId === currentRound.id && instance.status !== "debriefed") {
      current.push(view);
    } else if (lastDebriefedRound && instance.roundId === lastDebriefedRound.id) {
      debriefed.push(view);
    }
  }
  return { current, debriefed };
}

export interface TeacherPedagogyView {
  conceptMastery: { code: string; name: string; average: number; students: number }[];
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

  return {
    conceptMastery,
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
      rendues.map((l) => {
        const diag = l.rawDiagnosis ?? 0;
        return l.quiz !== null ? 0.5 * diag + 0.5 * l.quiz : diag;
      }),
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
