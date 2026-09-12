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
  roundResults,
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
import { buildConsequenceContext, buildInterpretation, buildTriggerContext, detectSituations } from "@/pedagogy/detection";
import type { ConsequenceFact, InterpretationFact } from "@/pedagogy/detection";
import { AXES, aggregateAxis, updateMastery } from "@/pedagogy/progress";
import { adaptiveHintMultiplier, playerStrength } from "@/pedagogy/adaptivity";
import { computeRawSituationScore } from "@/pedagogy/scoring";
import type { CompanyRoundResult } from "@/engine/types";
import { markStepCompleted } from "@/services/learning-progress.service";
/**
 * Moteur pédagogique côté services — barrel de compatibilité.
 *
 * Le service historique (1800+ lignes) a été décomposé (refactoring V2,
 * étape 9) en services à responsabilité unique :
 *   - pedagogy-seed.service       : seed idempotent des référentiels
 *   - situation-instance.service  : ouverture / chargement des situations
 *   - hints.service               : plafond et déblocage des indices
 *   - diagnosis.service           : diagnostic + score F1
 *   - debrief.service             : QCM, rattrapage, débriefing, vue (toView)
 *   - pedagogy-reporting.service  : vues lecture élève / enseignant
 *
 * Ce fichier ne fait que ré-exporter leur API publique : les appelants qui
 * importent depuis @/services/pedagogy.service n'ont rien à changer.
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
            triggerContext: buildTriggerContext(s.trigger.detect, result),
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
  const { instance, situationRow, def, game } = await loadInstanceForUser(args.instanceId, args.userId);
  if (instance.status === "debriefed") throw new Error("Cette situation est déjà débriefée");
  const levels = await unlockedLevels(args.instanceId);
  const next = nextUnlockableLevel(levels);
  if (next === null) throw new Error("Tous les indices sont déjà débloqués");
  if (game) {
    const { cap, reason } = hintCapOf(game);
    if (next > cap) throw new Error(reason);
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

    // Mark granted learning steps as completed for team members
    const grantedSteps = def.grantedLearningSteps ?? [];
    const members = membersByTeam.get(instance.teamId) ?? [];
    for (const member of members) {
      for (const stepId of grantedSteps) {
        try {
          await markStepCompleted(member.userId, stepId);
        } catch (error) {
          // Silently skip if step doesn't exist or prerequisites aren't met
          // (this allows situations to grant steps that don't exist yet without breaking)
        }
      }
    }

    // Only track learning progress if the team submitted a diagnosis (V1-5: measure only)
    const diagnosisSubmitted = (instance.diagnosis as { selected?: string[] } | null)?.selected !== undefined;
    if (!diagnosisSubmitted) continue;

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
function askedQuestions(def: SituationDef, mode: QuizMode): QuizQuestionDef[] {
  if (mode === "off") return [];
  if (mode === "model") return def.quiz.filter((q) => q.id === MODEL_QUESTION_ID);
  return def.quiz;
}

export interface AnalyticalHint {
  code: string;
  name: string;
  objective: string;
  difficulty: number;
  keyPoints: string[];
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
      // concurrents choisy à la création.
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

// Re-exports from modular services
export {
  getTeamSituations,
  type DebriefedRound,
  type TeacherPedagogyView,
  getTeacherPedagogyView,
  getGameGradeSheet,
  getStudentProgressView,
} from "@/services/pedagogy-reporting.service";

export type { SituationView } from "@/services/debrief.service";
