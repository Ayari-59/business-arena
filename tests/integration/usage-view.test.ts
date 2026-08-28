import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Carnet d'usage : l'agrégat de TOUTES les parties d'un enseignant.
 *
 * Ce que la vue par partie ne peut pas dire, et qu'on vérifie ici :
 *
 * - le carnet ne mélange pas les enseignants (une classe voisine n'y entre pas) ;
 * - les situations sont classées par score moyen croissant, les plus dures en tête ;
 * - une situation ouverte mais jamais débriefée ne compte pas, sans quoi une
 *   partie abandonnée ferait passer un énoncé pour infaisable ;
 * - un enseignant sans partie obtient un carnet vide, pas une erreur.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  createSoloGame,
  joinGameByCode,
  resolveCurrentRound,
  setQuizMode,
  submitTeamDecisions,
} from "@/services/game.service";
import {
  getTeamSituations,
  getTeacherUsageView,
  submitDiagnosis,
  unlockHint,
} from "@/services/pedagogy.service";
import { situationByCode } from "@/config/scenarios/registry";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let teacherId: string;
let voisinId: string;
let novaGameId: string;

/** Ouvre les indices demandés, répond, puis clôt le tour pour débriefer. */
async function jouerUnTour(gameId: string, userId: string, hints: number, options: string[]) {
  const { current } = await getTeamSituations(gameId, userId);
  const instanceId = current[0]!.instanceId;
  for (let i = 0; i < hints; i++) await unlockHint({ instanceId, userId });
  await submitDiagnosis({ instanceId, userId, selectedOptionIds: options });
  await resolveCurrentRound({ gameId, userId, playerDecisions: DECISIONS });
  return instanceId;
}

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values([
      { email: "carnet@test.local", displayName: "Enseignante" },
      { email: "voisin@test.local", displayName: "Collègue" },
    ])
    .returning({ id: users.id });
  teacherId = inserted[0]!.id;
  voisinId = inserted[1]!.id;

  // Deux parties pour l'enseignante, dans deux secteurs différents.
  novaGameId = await createSoloGame(teacherId, "quarter", 3);
  const boutiqueId = await createSoloGame(teacherId, "quarter", 3, undefined, false, "boutique");
  await setQuizMode({ gameId: novaGameId, teacherId, mode: "model" });

  // NOVA : trois indices ouverts et un diagnostic à moitié juste.
  await jouerUnTour(novaGameId, teacherId, 3, ["cover_fixed"]);
  // Boutique : aucun indice, diagnostic complet, donc un score plus élevé.
  const { current } = await getTeamSituations(boutiqueId, teacherId);
  const def = situationByCode.get(current[0]!.code)!;
  await submitDiagnosis({
    instanceId: current[0]!.instanceId,
    userId: teacherId,
    selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
  });
  await resolveCurrentRound({ gameId: boutiqueId, userId: teacherId, playerDecisions: DECISIONS });

  // La partie du collègue ne doit jamais apparaître dans le carnet.
  const voisineId = await createSoloGame(voisinId, "quarter", 3);
  await jouerUnTour(voisineId, voisinId, 5, []);
});

describe("carnet d'usage de l'enseignant", () => {
  it("compte les parties, les équipes et les situations débriefées", async () => {
    const usage = await getTeacherUsageView(teacherId);
    expect(usage.totals.games).toBe(2);
    expect(usage.totals.teams).toBe(2);
    expect(usage.totals.situationsDebriefed).toBe(2);
    expect(usage.totals.hintsUnlocked).toBe(3);
  });

  it("n'agrège que les parties de cet enseignant", async () => {
    const usage = await getTeacherUsageView(teacherId);
    const codes = usage.situations.map((s) => s.code);
    // le collègue a ouvert cinq indices : ils ne franchissent pas la cloison
    expect(usage.totals.hintsUnlocked).toBe(3);
    expect(usage.sectors.map((s) => s.code).sort()).toEqual(["boutique", "nova"]);
    expect(codes).toHaveLength(2);

    const duVoisin = await getTeacherUsageView(voisinId);
    expect(duVoisin.totals.games).toBe(1);
    expect(duVoisin.totals.hintsUnlocked).toBe(5);
  });

  it("classe les situations par score moyen croissant, la plus dure en tête", async () => {
    const usage = await getTeacherUsageView(teacherId);
    const scores = usage.situations.map((s) => s.averageScore!);
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);

    const nova = usage.situations.find((s) => s.code === "nova_t1_takeover")!;
    expect(nova.debriefed).toBe(1);
    expect(nova.unanswered).toBe(0);
    expect(nova.averageHints).toBe(3);
    expect(nova.scenario).not.toBe("");
    expect(nova.averageScore!).toBeLessThan(usage.situations[1]!.averageScore!);
  });

  it("détaille les indices niveau par niveau, toujours sur cinq lignes", async () => {
    const usage = await getTeacherUsageView(teacherId);
    expect(usage.hintsByLevel.map((h) => h.level)).toEqual([1, 2, 3, 4, 5]);
    expect(usage.hintsByLevel.map((h) => h.count)).toEqual([1, 1, 1, 0, 0]);
  });

  it("remonte la maîtrise des notions des élèves passés par ces parties", async () => {
    const usage = await getTeacherUsageView(teacherId);
    expect(usage.concepts.length).toBeGreaterThan(0);
    const averages = usage.concepts.map((c) => c.average);
    expect([...averages].sort((a, b) => a - b)).toEqual(averages);
    for (const c of usage.concepts) expect(c.students).toBeGreaterThan(0);
  });

  it("une situation répondue mais pas encore débriefée ne compte pas", async () => {
    // Le tour 2 de la partie NOVA a ouvert une situation. L'équipe y répond,
    // mais l'enseignante n'a pas clôturé le tour : tant que le débriefing n'a
    // pas eu lieu, il n'y a pas de score définitif, donc rien à moyenner. La
    // faire entrer ici afficherait un zéro qui passerait pour un échec.
    const ouverte = (await getTeamSituations(novaGameId, teacherId)).current[0]!;
    const def = situationByCode.get(ouverte.code)!;
    await submitDiagnosis({
      instanceId: ouverte.instanceId,
      userId: teacherId,
      selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
    });
    expect((await getTeamSituations(novaGameId, teacherId)).current[0]!.status).toBe("diagnosed");

    const usage = await getTeacherUsageView(teacherId);
    expect(usage.totals.situationsDebriefed).toBe(2);
    expect(usage.situations.reduce((n, s) => n + s.debriefed, 0)).toBe(2);
    expect(usage.situations.some((s) => s.code === ouverte.code)).toBe(false);
  });

  it("un enseignant sans partie obtient un carnet vide, pas une erreur", async () => {
    const nouveau = await db
      .insert(users)
      .values({ email: "nouvelle@test.local", displayName: "Nouvelle" })
      .returning({ id: users.id });
    const usage = await getTeacherUsageView(nouveau[0]!.id);
    expect(usage.totals).toEqual({
      games: 0,
      finishedGames: 0,
      teams: 0,
      situationsDebriefed: 0,
      hintsUnlocked: 0,
    });
    expect(usage.situations).toEqual([]);
    expect(usage.sectors).toEqual([]);
    expect(usage.concepts).toEqual([]);
  });

  it("compte les parties terminées à part des parties créées", async () => {
    await db.update(games).set({ status: "finished" });
    const usage = await getTeacherUsageView(teacherId);
    expect(usage.totals.games).toBe(2);
    expect(usage.totals.finishedGames).toBe(2);
  });
});

describe("une équipe restée sans joueur ne compte pas comme un échec", () => {
  it("la moyenne ne retient que les équipes réellement composées", async () => {
    // Le cas de classe ordinaire : deux équipes annoncées, une seule remplie.
    // L'équipe vide reçoit la même situation, la clôture la débriefe avec un
    // score de zéro, et la moyenne tombe de moitié. Une situation réussie
    // passait ainsi sous la barre à cause d'élèves absents.
    const inscription = await registerTeacher({
      email: "classe@lycee.test",
      password: "motdepasse!",
      displayName: "Mme Vide",
      schoolName: "Lycée du Test",
    });
    if ("error" in inscription) throw new Error(inscription.error);
    const prof = inscription.userId;
    const orgId = (await getTeacherOrgId(prof))!;

    const { gameId, joinCode } = await createClassGame({
      teacherId: prof,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
    });

    const eleve = await db
      .insert(users)
      .values({ email: "seul@test.local", displayName: "Seul" })
      .returning({ id: users.id });
    const eleveId = eleve[0]!.id;
    const rejoint = await joinGameByCode({ code: joinCode, userId: eleveId, pseudo: "Seul" });
    if ("error" in rejoint) throw new Error(rejoint.error);

    const { current } = await getTeamSituations(gameId, eleveId);
    const def = situationByCode.get(current[0]!.code)!;
    await submitDiagnosis({
      instanceId: current[0]!.instanceId,
      userId: eleveId,
      selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
    });
    await submitTeamDecisions({ gameId, userId: eleveId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId: prof });

    // Le score que l'élève voit sur son propre débriefing est la référence :
    // le carnet doit afficher celui-là, et non sa moitié.
    const vue = (await getTeamSituations(gameId, eleveId)).debriefed[0]!;
    const scoreEleve = vue.debrief!.finalScore;
    expect(scoreEleve).toBeGreaterThan(0);

    const usage = await getTeacherUsageView(prof);
    const ligne = usage.situations.find((s) => s.code === def.code)!;
    expect(ligne.debriefed).toBe(1);
    expect(ligne.averageScore).toBeCloseTo(scoreEleve, 9);
    expect(usage.totals.situationsDebriefed).toBe(1);
  });
});

describe("une équipe muette n'est pas une situation ratée", () => {
  it("le silence est compté à part, jamais moyenné comme un zéro", async () => {
    // Deux équipes composées : l'une répond, l'autre joue son tour sans rien
    // rendre. Le débriefing inscrit un zéro pour la seconde. Le confondre avec
    // un score ferait passer une situation traitée correctement pour un énoncé
    // infaisable : à l'écran, six lignes à 0 % pour des situations que
    // personne n'avait tentées.
    const inscription = await registerTeacher({
      email: "muette@lycee.test",
      password: "motdepasse!",
      displayName: "M. Silence",
      schoolName: "Lycée du Silence",
    });
    if ("error" in inscription) throw new Error(inscription.error);
    const prof = inscription.userId;
    const orgId = (await getTeacherOrgId(prof))!;

    const { gameId, joinCode } = await createClassGame({
      teacherId: prof,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
    });

    const inserted = await db
      .insert(users)
      .values([
        { email: "parle@test.local", displayName: "Parle" },
        { email: "muet@test.local", displayName: "Muet" },
      ])
      .returning({ id: users.id });
    const [parle, muet] = [inserted[0]!.id, inserted[1]!.id];
    for (const [userId, pseudo] of [
      [parle, "Parle"],
      [muet, "Muet"],
    ] as const) {
      const r = await joinGameByCode({ code: joinCode, userId, pseudo });
      if ("error" in r) throw new Error(r.error);
    }

    // l'une répond, l'autre se contente de jouer son tour
    const { current } = await getTeamSituations(gameId, parle);
    const def = situationByCode.get(current[0]!.code)!;
    await submitDiagnosis({
      instanceId: current[0]!.instanceId,
      userId: parle,
      selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
    });
    await submitTeamDecisions({ gameId, userId: parle, payload: DECISIONS });
    await submitTeamDecisions({ gameId, userId: muet, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId: prof });

    const ligne = (await getTeacherUsageView(prof)).situations.find((s) => s.code === def.code)!;
    expect(ligne.debriefed).toBe(1);
    expect(ligne.unanswered).toBe(1);
    // et surtout : le score est celui de l'équipe qui a répondu, pas sa moitié
    const vue = (await getTeamSituations(gameId, parle)).debriefed[0]!;
    expect(ligne.averageScore).toBeCloseTo(vue.debrief!.finalScore, 9);
  });

  it("une situation que personne ne traite n'a pas de score et ferme la marche", async () => {
    const inscription = await registerTeacher({
      email: "personne@lycee.test",
      password: "motdepasse!",
      displayName: "Mme Personne",
      schoolName: "Lycée Personne",
    });
    if ("error" in inscription) throw new Error(inscription.error);
    const prof = inscription.userId;
    const orgId = (await getTeacherOrgId(prof))!;
    const { gameId, joinCode } = await createClassGame({
      teacherId: prof,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
    });
    const eleve = await db
      .insert(users)
      .values({ email: "passif@test.local", displayName: "Passif" })
      .returning({ id: users.id });
    const r = await joinGameByCode({ code: joinCode, userId: eleve[0]!.id, pseudo: "Passif" });
    if ("error" in r) throw new Error(r.error);

    await submitTeamDecisions({ gameId, userId: eleve[0]!.id, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId: prof });

    const usage = await getTeacherUsageView(prof);
    const ligne = usage.situations[0]!;
    expect(ligne.debriefed).toBe(0);
    expect(ligne.unanswered).toBe(1);
    // null, et non zéro : rien n'a été tenté, il n'y a rien à noter
    expect(ligne.averageScore).toBeNull();
    // et elle ne s'affiche pas comme la situation la plus dure du carnet
    expect(usage.situations.filter((s) => s.averageScore !== null)).toHaveLength(0);
  });
});

describe("le compteur d'élèves des notions", () => {
  it("compte les élèves distincts, deux équipes valant deux élèves", async () => {
    // Relevé en recette : la ligne de situation passait à 2 équipes pendant que
    // le bloc des notions restait à « 1 élève ». Deux compteurs côte à côte qui
    // ne bougent pas ensemble se lisent comme une incohérence. Ils ne comptent
    // pas la même chose (des équipes d'un côté, des élèves de l'autre), et ce
    // test fixe ce que compte le second : des personnes distinctes.
    const inscription = await registerTeacher({
      email: "deux@lycee.test",
      password: "motdepasse!",
      displayName: "Mme Deux",
      schoolName: "Lycée Deux",
    });
    if ("error" in inscription) throw new Error(inscription.error);
    const prof = inscription.userId;
    const orgId = (await getTeacherOrgId(prof))!;
    const { gameId, joinCode } = await createClassGame({
      teacherId: prof,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
    });

    const inserted = await db
      .insert(users)
      .values([
        { email: "eleve-a@test.local", displayName: "A" },
        { email: "eleve-b@test.local", displayName: "B" },
      ])
      .returning({ id: users.id });
    const deux = [inserted[0]!.id, inserted[1]!.id];
    for (const userId of deux) {
      const r = await joinGameByCode({ code: joinCode, userId, pseudo: "Eleve" });
      if ("error" in r) throw new Error(r.error);
    }

    for (const userId of deux) {
      const { current } = await getTeamSituations(gameId, userId);
      const def = situationByCode.get(current[0]!.code)!;
      await submitDiagnosis({
        instanceId: current[0]!.instanceId,
        userId,
        selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
      });
      await submitTeamDecisions({ gameId, userId, payload: DECISIONS });
    }
    await closeCurrentRound({ gameId, teacherId: prof });

    const usage = await getTeacherUsageView(prof);
    expect(usage.situations[0]!.debriefed).toBe(2);
    expect(usage.concepts.length).toBeGreaterThan(0);
    // deux élèves distincts, donc deux : le compteur suit bien les personnes
    for (const c of usage.concepts) expect(c.students, c.name).toBe(2);
  });
});
