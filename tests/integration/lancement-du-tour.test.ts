import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * LE TOUR SUIVANT ATTEND LE PROFESSEUR, OU LE CALENDRIER (décision du propriétaire,
 * novembre 2026 : « Je ne veux pas que le tour suivant soit lancé systématiquement,
 * il faut que le prof le lance ou bien en fonction du calendrier de jeu. »).
 *
 * Une partie de classe NOUVELLE : après « Clore et simuler », le tour suivant n'est
 * pas jouable tant que l'enseignant ne l'a pas lancé, ou que la date du planning n'est
 * pas venue. Une partie déjà en cours (sans marqueur), le solo, le concours et le tour
 * d'essai enchaînent comme avant.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, rounds, users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  createSoloGame,
  getGameView,
  getTeacherGameView,
  joinGameByCode,
  resolveCurrentRound,
  setRoundWindows,
  submitTeamDecisions,
} from "@/services/game.service";
import { createGameCore } from "@/services/game-creation.service";
// Le lancement : importé par l'espace de noms, pour que ce fichier se lise rouge
// test par test sur le code d'avant, où la fonction n'existait pas.
import * as resolution from "@/services/round-resolution.service";
import type { RoundDecisions } from "@/engine/types";
import { getTeamSituations, submitDiagnosis, submitQuiz } from "@/services/pedagogy.service";
import { poserUneLicence } from "./helpers/licence";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

let teacherId: string;
let autreEnseignant: string;
let orgId: string;
let compteur = 0;

async function eleve(): Promise<string> {
  compteur += 1;
  const [u] = await db
    .insert(users)
    .values({ email: `eleve-${compteur}@guest.business-arena.local`, displayName: `Élève ${compteur}` })
    .returning({ id: users.id });
  return u!.id;
}

async function enseignant(email: string, nom: string): Promise<string> {
  const r = await registerTeacher({
    email,
    password: "motdepasse!",
    displayName: nom,
    schoolName: "Lycée du Calendrier",
  });
  if ("error" in r) throw new Error(r.error);
  return r.userId;
}

beforeAll(async () => {
  teacherId = await enseignant("lance@lycee.test", "Mme Lance");
  autreEnseignant = await enseignant("autre@lycee.test", "M. Autre");
  orgId = (await getTeacherOrgId(teacherId))!;
  await poserUneLicence(orgId, teacherId);
});

/** Une partie de classe neuve, un élève dedans. */
async function classeNeuve(): Promise<{ gameId: string; alice: string }> {
  const { gameId, joinCode } = await createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    scenarioCode: "conseil",
  });
  const alice = await eleve();
  const join = await joinGameByCode({ code: joinCode, userId: alice, pseudo: "Alice" });
  if (!("gameId" in join)) throw new Error("adhésion refusée");
  return { gameId, alice };
}

const lancer = (args: { gameId: string; teacherId: string; expectedRound: number }) =>
  (resolution as unknown as {
    lancerLeTour: (a: typeof args) => Promise<{ roundIndex: number; dejaLance: boolean }>;
  }).lancerLeTour(args);

describe("partie de classe neuve : le tour suivant attend", () => {
  it("après la clôture, le tour 2 n'est pas jouable et l'élève lit pourquoi", async () => {
    const { gameId, alice } = await classeNeuve();
    await submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });

    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).rejects.toThrow(
      "Le tour 2 n'est pas encore lancé : votre professeur l'ouvrira.",
    );
    const vue = await getGameView(gameId, alice);
    expect(vue!.currentRound).toBe(2);
    // Les résultats du tour clos restent lisibles.
    expect(vue!.lastResult).not.toBeNull();
    expect(vue!.playLock.playable).toBe(false);
    expect(vue!.playLock.message).toBe("Le tour 2 n'est pas encore lancé : votre professeur l'ouvrira.");

    const pilotage = await getTeacherGameView(gameId, teacherId);
    expect(pilotage!.lancement).toEqual({ enAttente: true, ouvertureAuto: null });
    // On ne clôt pas un tour que personne n'a pu jouer.
    await expect(closeCurrentRound({ gameId, teacherId, expectedRound: 2 })).rejects.toThrow(
      /pas encore lancé/,
    );
  });

  it("le bouton du professeur ouvre le tour : l'élève joue", async () => {
    const { gameId, alice } = await classeNeuve();
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });

    const r = await lancer({ gameId, teacherId, expectedRound: 2 });
    expect(r).toEqual({ roundIndex: 2, dejaLance: false });
    const vue = await getGameView(gameId, alice);
    expect(vue!.playLock.playable).toBe(true);
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).resolves.toEqual({
      roundIndex: 2,
    });
    expect((await getTeacherGameView(gameId, teacherId))!.lancement).toBeNull();

    // Un double clic ne fait rien de plus.
    expect(await lancer({ gameId, teacherId, expectedRound: 2 })).toEqual({ roundIndex: 2, dejaLance: true });
    // Et le tour lancé se clôt comme avant.
    await expect(closeCurrentRound({ gameId, teacherId, expectedRound: 2 })).resolves.toMatchObject({
      roundIndex: 2,
      alreadyClosed: false,
    });
  });

  it("la date du planning ouvre le tour sans clic", async () => {
    const { gameId, alice } = await classeNeuve();
    const passee = new Date(Date.now() - 60_000);
    await setRoundWindows({ gameId, teacherId, windows: [{ index: 2, opensAt: passee, deadline: null }] });
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });

    const vue = await getGameView(gameId, alice);
    expect(vue!.playLock.playable).toBe(true);
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).resolves.toEqual({
      roundIndex: 2,
    });
  });

  it("une date à venir : le tour s'ouvrira seul, le professeur peut l'ouvrir plus tôt", async () => {
    const { gameId, alice } = await classeNeuve();
    const demain = new Date(Date.now() + 24 * 3600_000);
    await setRoundWindows({ gameId, teacherId, windows: [{ index: 2, opensAt: demain, deadline: null }] });
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });

    const pilotage = await getTeacherGameView(gameId, teacherId);
    expect(pilotage!.lancement).toEqual({ enAttente: true, ouvertureAuto: demain.toISOString() });
    const avant = await getGameView(gameId, alice);
    expect(avant!.playLock.playable).toBe(false);
    expect(avant!.playLock.message).toMatch(/^Ce tour ouvre le /);

    await lancer({ gameId, teacherId, expectedRound: 2 });
    expect((await getGameView(gameId, alice))!.playLock.playable).toBe(true);
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).resolves.toBeTruthy();
  });

  it("le bouton est refusé à un autre enseignant et pour un autre tour", async () => {
    const { gameId, alice } = await classeNeuve();
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });

    await expect(lancer({ gameId, teacherId: autreEnseignant, expectedRound: 2 })).rejects.toThrow(
      /Seul l'enseignant qui a créé la partie/,
    );
    await expect(lancer({ gameId, teacherId, expectedRound: 3 })).rejects.toThrow(/n'est pas le tour à lancer/);
    await expect(lancer({ gameId, teacherId, expectedRound: 1 })).rejects.toThrow(/n'est pas le tour à lancer/);
    // Rien n'a été lancé.
    expect((await getGameView(gameId, alice))!.playLock.playable).toBe(false);
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).rejects.toThrow(
      /pas encore lancé/,
    );
  });

  it("le temps du tour se mesure depuis son lancement, pas depuis la clôture", async () => {
    const { gameId, alice } = await classeNeuve();
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    // La clôture, reculée d'une heure : le débrief a duré.
    const [tour1] = await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, 1)));
    await db
      .update(rounds)
      .set({ resolvedAt: new Date(Date.now() - 3600_000) })
      .where(eq(rounds.id, tour1!.id));
    await lancer({ gameId, teacherId, expectedRound: 2 });
    await submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS });
    const { getObservationSeance } = await import("@/services/observation.service");
    const obs = await getObservationSeance(gameId, teacherId);
    const t2 = obs!.tours.find((t) => t.index === 2)!;
    expect(t2.minutesMedianes).toBe(0);
  });
});

/** La première situation du tour en cours de l'élève, celle que l'arène lui montrerait. */
async function situationDuTour(gameId: string, userId: string) {
  const s = (await getTeamSituations(gameId, userId)).current[0];
  if (!s) throw new Error("aucune situation ouverte pour ce tour");
  return s;
}

describe("la situation du tour qui attend son lancement", () => {
  it("y répondre est refusé avec les mots de la validation ; après le lancement, c'est accepté", async () => {
    const { gameId, alice } = await classeNeuve();
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    const s = await situationDuTour(gameId, alice);
    const options = s.diagnosticOptions.slice(0, 1).map((o) => o.id);
    const reponses = Object.fromEntries(s.quizQuestions.map((q) => [q.id, q.options[0]!.id]));

    const message = "Le tour 2 n'est pas encore lancé : votre professeur l'ouvrira.";
    await expect(
      submitDiagnosis({ instanceId: s.instanceId, userId: alice, selectedOptionIds: options }),
    ).rejects.toThrow(message);
    await expect(submitQuiz({ instanceId: s.instanceId, userId: alice, answers: reponses })).rejects.toThrow(
      message,
    );
    // Rien n'a été écrit : la situation reste ouverte.
    expect((await situationDuTour(gameId, alice)).status).toBe("open");

    await lancer({ gameId, teacherId, expectedRound: 2 });
    await expect(
      submitDiagnosis({ instanceId: s.instanceId, userId: alice, selectedOptionIds: options }),
    ).resolves.toBeTruthy();
    if (s.quizQuestions.length > 0) {
      await expect(
        submitQuiz({ instanceId: s.instanceId, userId: alice, answers: reponses }),
      ).resolves.toBeTruthy();
    }
  });

  it("une date à venir : le refus dit la date, comme la validation", async () => {
    const { gameId, alice } = await classeNeuve();
    const demain = new Date(Date.now() + 24 * 3600_000);
    await setRoundWindows({ gameId, teacherId, windows: [{ index: 2, opensAt: demain, deadline: null }] });
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    const s = await situationDuTour(gameId, alice);
    const message = (await getGameView(gameId, alice))!.playLock.message!;
    expect(message).toMatch(/^Ce tour ouvre le /);
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).rejects.toThrow(message);
    await expect(
      submitDiagnosis({ instanceId: s.instanceId, userId: alice, selectedOptionIds: [] }),
    ).rejects.toThrow(message);
  });

  it("au premier tour, et dans une partie qui enchaîne, rien ne change", async () => {
    const { gameId, alice } = await classeNeuve();
    const s1 = await situationDuTour(gameId, alice);
    await expect(
      submitDiagnosis({ instanceId: s1.instanceId, userId: alice, selectedOptionIds: [] }),
    ).resolves.toBeTruthy();

    const avant = await classeNeuve();
    const [g] = await db.select().from(games).where(eq(games.id, avant.gameId));
    const { lancementDesTours: _retire, ...profil } = g!.difficultyProfile as Record<string, unknown>;
    await db.update(games).set({ difficultyProfile: profil }).where(eq(games.id, avant.gameId));
    await closeCurrentRound({ gameId: avant.gameId, teacherId, expectedRound: 1 });
    const s2 = await situationDuTour(avant.gameId, avant.alice);
    await expect(
      submitDiagnosis({ instanceId: s2.instanceId, userId: avant.alice, selectedOptionIds: [] }),
    ).resolves.toBeTruthy();
  });
});

describe("ce qui enchaîne comme avant", () => {
  it("une partie de classe d'avant (sans marqueur) ouvre le tour suivant aussitôt", async () => {
    const { gameId, alice } = await classeNeuve();
    // Une partie créée avant ce changement n'a pas de marqueur.
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    const { lancementDesTours: _retire, ...profil } = g!.difficultyProfile as Record<string, unknown>;
    await db.update(games).set({ difficultyProfile: profil }).where(eq(games.id, gameId));

    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    expect((await getGameView(gameId, alice))!.playLock.playable).toBe(true);
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).resolves.toEqual({
      roundIndex: 2,
    });
    expect((await getTeacherGameView(gameId, teacherId))!.lancement).toBeNull();
  });

  it("le solo résout et rouvre aussitôt (ADR-04)", async () => {
    const joueur = await eleve();
    const gameId = await createSoloGame(joueur, "quarter", 3, undefined, false, "conseil");
    await resolveCurrentRound({ gameId, userId: joueur, playerDecisions: DECISIONS });
    expect((await getGameView(gameId, joueur))!.playLock.playable).toBe(true);
    await expect(
      resolveCurrentRound({ gameId, userId: joueur, playerDecisions: DECISIONS }),
    ).resolves.toMatchObject({ roundIndex: 2 });
  });

  it("une partie de concours enchaîne ses tours", async () => {
    const { gameId, teams } = await createGameCore({
      organizationId: orgId,
      createdBy: teacherId,
      periodicity: "quarter",
      kind: "class",
      humanTeams: [{ name: "Les Requins" }],
      botCount: 0,
      mode: "competition",
      scenarioCode: "conseil",
    });
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    expect((g!.difficultyProfile as Record<string, unknown>).lancementDesTours).toBeUndefined();
    const joueur = await eleve();
    const { players } = await import("@/db/schema");
    await db.insert(players).values({ teamId: teams[0]!.id, userId: joueur, role: "captain" });
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    await expect(submitTeamDecisions({ gameId, userId: joueur, payload: DECISIONS })).resolves.toEqual({
      roundIndex: 2,
    });
  });

  it("le tour d'essai enchaîne ses tours, et sa bascule vers la vraie partie aussi", async () => {
    const { gameId, joinCode } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      scenarioCode: "conseil",
      essai: { tours: 2, enchainement: "auto" },
    });
    const alice = await eleve();
    await joinGameByCode({ code: joinCode, userId: alice, pseudo: "Alice" });

    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    // Le second tour d'essai s'ouvre aussitôt, comme avant.
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).resolves.toEqual({
      roundIndex: 2,
    });
    const fin = await closeCurrentRound({ gameId, teacherId, expectedRound: 2 });
    expect(fin.finDeLEssai).toBe(true);
    // La vraie partie a commencé d'elle-même : son premier tour se joue.
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    expect(g!.currentRound).toBe(1);
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).resolves.toEqual({
      roundIndex: 1,
    });
    // Puis la vraie partie suit la règle : son tour 2 attend le professeur.
    await closeCurrentRound({ gameId, teacherId, expectedRound: 1 });
    await expect(submitTeamDecisions({ gameId, userId: alice, payload: DECISIONS })).rejects.toThrow(
      /pas encore lancé/,
    );
  });
});
