import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  concepts,
  decisionModels,
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
} from "@/db/schema";
import { CONCEPTS, conceptByCode } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import type { SituationDef } from "@/config/scenarios/nova/situations";
import {
  ALL_SITUATIONS,
  scenarioByCode,
  situationByCode,
} from "@/config/scenarios/registry";
import { presetFromProfile, quizEnabledFromProfile } from "@/config/difficulty";
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
      const detected = new Set(detectSituations(result));
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
      const preset = presetFromProfile(game.difficultyProfile);
      const cap = game.mode === "competition" ? Math.min(preset.hintMaxLevel, 3) : preset.hintMaxLevel;
      if (next > cap) {
        throw new Error(
          cap === 0
            ? `Niveau ${preset.name} : aucun indice, conditions réelles`
            : game.mode === "competition" && cap === 3
              ? "Mode compétition : indices limités aux niveaux 1 à 3"
              : `Niveau ${preset.name} : indices limités aux niveaux 1 à ${cap}`,
        );
      }
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
  if (!quizEnabledFromProfile(game?.difficultyProfile)) {
    throw new Error("Les QCM sont désactivés pour cette partie");
  }
  const validIds = new Set(def.quiz.map((q) => q.id));
  const answers: Record<string, string> = {};
  for (const [questionId, optionId] of Object.entries(args.answers)) {
    if (validIds.has(questionId)) answers[questionId] = optionId;
  }
  const score = evaluateQuiz(answers, def.quiz);
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
  const quizEnabled = quizEnabledFromProfile(gameRow?.difficultyProfile);

  for (const instance of instances) {
    if (instance.status === "debriefed") continue;
    const def = situationByCode.get(codeById.get(instance.situationId) ?? "");
    if (!def) continue;

    const levels = await unlockedLevels(instance.id);
    const diagScore =
      ((instance.diagnosis as { score?: number } | null)?.score as number | undefined) ?? 0;
    // QCM désactivé par l'enseignant : le score repose ENTIÈREMENT sur le
    // diagnostic. Ne pas neutraliser la moitié « connaissances » reviendrait
    // à plafonner toutes les situations à 50 % pour une question jamais posée.
    let raw: number;
    if (!quizEnabled) {
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
    concepts: { code: string; name: string }[];
    finalScore: number;
  } | null;
}

function toView(
  instance: typeof situationInstances.$inferSelect,
  def: SituationDef,
  levels: number[],
  quizEnabled = true,
): SituationView {
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
    // QCM désactivé par l'enseignant : aucune question n'est servie, et le
    // score de la situation reposera entièrement sur le diagnostic.
    quizQuestions: quizEnabled
      ? def.quiz.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options.map(({ id, label }) => ({ id, label })), // sans les crédits
        }))
      : [],
    quizAnswers: quizStored?.answers ?? null,
    unlockedHints: def.hints
      .filter((h) => levels.includes(h.level))
      .map((h) => ({ level: h.level, text: h.text, costRatio: h.costRatio })),
    nextHint: (() => {
      const next = nextUnlockableLevel(levels);
      if (next === null || debriefed) return null;
      const hint = def.hints.find((h) => h.level === next);
      return hint ? { level: hint.level, costRatio: hint.costRatio } : null;
    })(),
    diagnosis,
    debrief: debriefed
      ? {
          correctOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
          quizCorrection: def.quiz.map((q) => ({
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
  const quizEnabled = quizEnabledFromProfile(game.difficultyProfile);

  const currentRound = gameRounds.find((r) => r.index === game.currentRound);
  const lastDebriefedRound = gameRounds
    .filter((r) => r.status === "resolved")
    .sort((a, b) => b.index - a.index)[0];

  const build = async (instance: typeof situationInstances.$inferSelect) => {
    const def = situationByCode.get(codeById.get(instance.situationId) ?? "");
    if (!def) return null;
    const levels = await unlockedLevels(instance.id);
    return toView(instance, def, levels, quizEnabled);
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
