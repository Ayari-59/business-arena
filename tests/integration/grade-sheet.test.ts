import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Relevé de notes : ce qui termine la séance de l'enseignant.
 *
 * Le produit s'arrêtait à l'avant-dernière étape : maîtrise de la classe,
 * indices ouverts, classement au score composite, et rien de tout cela n'est
 * une note. Ce que ce test fixe :
 *
 * - deux mesures séparées, la note tirée des situations rendues et la
 *   performance de gestion, jamais fondues en une ;
 * - une situation non rendue comptée à part, jamais moyennée à zéro ;
 * - les indices se lisent en points perdus, pour distinguer une note basse
 *   due à une erreur d'analyse d'une note basse due à l'aide reçue ;
 * - le relevé d'un enseignant reste le sien.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import {
  getGameGradeSheet,
  getTeamSituations,
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

let prof: string;
let orgId: string;
let gameId: string;
let bonne: string;
let aidee: string;
let muette: string;

async function eleve(email: string, nom: string): Promise<string> {
  const r = await db
    .insert(users)
    .values({ email, displayName: nom })
    .returning({ id: users.id });
  return r[0]!.id;
}

/** Répond au diagnostic de la situation courante, juste ou faux. */
async function repondre(userId: string, juste: boolean) {
  const { current } = await getTeamSituations(gameId, userId);
  const vue = current[0]!;
  const def = situationByCode.get(vue.code)!;
  const options = def.diagnosticOptions;
  await submitDiagnosis({
    instanceId: vue.instanceId,
    userId,
    selectedOptionIds: juste
      ? options.filter((o) => o.correct).map((o) => o.id)
      : options.filter((o) => !o.correct).map((o) => o.id),
  });
  return vue.instanceId;
}

beforeAll(async () => {
  const r = await registerTeacher({
    email: "releve@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Relevé",
    schoolName: "Lycée du Relevé",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  orgId = (await getTeacherOrgId(prof))!;

  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 3,
    botCount: 1,
  });
  gameId = partie.gameId;

  bonne = await eleve("bonne@test.local", "Bonne");
  aidee = await eleve("aidee@test.local", "Aidée");
  muette = await eleve("muette@test.local", "Muette");
  for (const [id, pseudo] of [
    [bonne, "Bonne"],
    [aidee, "Aidée"],
    [muette, "Muette"],
  ] as const) {
    const j = await joinGameByCode({ code: partie.joinCode, userId: id, pseudo });
    if ("error" in j) throw new Error(j.error);
  }

  // une équipe répond juste sans aide, une répond juste avec trois indices,
  // une joue son tour sans rien rendre
  await repondre(bonne, true);
  const instanceAidee = (await getTeamSituations(gameId, aidee)).current[0]!.instanceId;
  for (let i = 0; i < 3; i++) await unlockHint({ instanceId: instanceAidee, userId: aidee });
  await repondre(aidee, true);

  for (const id of [bonne, aidee, muette]) {
    await submitTeamDecisions({ gameId, userId: id, payload: DECISIONS });
  }
  await closeCurrentRound({ gameId, teacherId: prof });
});

describe("relevé de notes", () => {
  it("porte une note sur 20 par équipe, et les élèves qui la composent", async () => {
    const releve = (await getGameGradeSheet(gameId, prof))!;
    expect(releve.teams).toHaveLength(3); // les bots ne sont pas notés
    expect(releve.roundsResolved).toBe(1);

    for (const equipe of releve.teams) {
      expect(equipe.students.length).toBe(1);
    }
    const noms = releve.teams.flatMap((e) => e.students).sort();
    expect(noms).toEqual(["Aidée", "Bonne", "Muette"]);
  });

  it("l'aide reçue se lit en points perdus, pas en note inexpliquée", async () => {
    const releve = (await getGameGradeSheet(gameId, prof))!;
    const equipeDe = (nom: string) => releve.teams.find((e) => e.students.includes(nom))!;

    const sansAide = equipeDe("Bonne");
    const avecAide = equipeDe("Aidée");

    // même diagnostic juste des deux côtés
    expect(sansAide.diagnosisAverage).toBeCloseTo(avecAide.diagnosisAverage!, 9);
    // mais la note diffère, et l'écart est exactement le malus affiché
    expect(avecAide.note!).toBeLessThan(sansAide.note!);
    expect(sansAide.hintsUsed).toBe(0);
    expect(sansAide.hintPenalty).toBe(0);
    expect(avecAide.hintsUsed).toBe(3);
    expect(avecAide.hintPenalty).toBeGreaterThan(0);
    expect(sansAide.note! - avecAide.note!).toBeCloseTo(avecAide.hintPenalty, 2);
  });

  it("une équipe qui n'a rien rendu n'est pas notée zéro", async () => {
    const releve = (await getGameGradeSheet(gameId, prof))!;
    const silencieuse = releve.teams.find((e) => e.students.includes("Muette"))!;
    expect(silencieuse.answered).toBe(0);
    expect(silencieuse.unanswered).toBe(1);
    // null, et non 0 : l'enseignant décide ce que vaut un travail non rendu
    expect(silencieuse.note).toBeNull();
    expect(silencieuse.average).toBeNull();
  });

  it("la note et la performance de gestion restent deux colonnes", async () => {
    const releve = (await getGameGradeSheet(gameId, prof))!;
    for (const equipe of releve.teams) {
      // toutes ont joué le tour, donc toutes ont un classement
      expect(equipe.rank, equipe.name).not.toBeNull();
      expect(equipe.bpi, equipe.name).not.toBeNull();
    }
    // et la note ne se déduit pas du classement : l'équipe muette est classée
    const silencieuse = releve.teams.find((e) => e.students.includes("Muette"))!;
    expect(silencieuse.bpi).not.toBeNull();
    expect(silencieuse.note).toBeNull();
  });

  it("le détail situation par situation accompagne la moyenne", async () => {
    const releve = (await getGameGradeSheet(gameId, prof))!;
    const sansAide = releve.teams.find((e) => e.students.includes("Bonne"))!;
    expect(sansAide.situations).toHaveLength(1);
    expect(sansAide.situations[0]!.round).toBe(1);
    expect(sansAide.situations[0]!.answered).toBe(true);
    expect(sansAide.situations[0]!.title).not.toBe("");
  });

  it("le relevé d'un enseignant n'est pas lisible par un autre", async () => {
    const autre = await registerTeacher({
      email: "voisine@lycee.test",
      password: "motdepasse!",
      displayName: "Mme Voisine",
      schoolName: "Lycée Voisin",
    });
    if ("error" in autre) throw new Error(autre.error);
    expect(await getGameGradeSheet(gameId, autre.userId)).toBeNull();
  });
});
