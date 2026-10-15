import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * LES MODULES DU SCÉNARIO, DE L'ENVOI AU BILAN, EN BASE.
 *
 * Une équipe coche une démarche qualité et un programme de R&D : les choix sont
 * enregistrés avec ses décisions, passent au moteur à la clôture
 * (`own.payload as RoundDecisions`), et reviennent dans la vue du tour suivant
 * (le coût au résultat, le bilan « Modules engagés ce tour », et l'offre qui
 * les range dans « Déjà engagé »). Au tour 2, l'équipe arrête son programme et
 * achète le niveau suivant de sa démarche.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import { registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  getGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { roundDecisionsSchema } from "@/services/decision-schema";
import { refusDesModules } from "@/services/modules-offer";
import { poserUneLicence } from "./helpers/licence";

let teacherId: string;
let gameId: string;
let studentId: string;

beforeAll(async () => {
  const result = await registerTeacher({
    email: "modules@test.fr",
    password: "motdepasse!",
    displayName: "M. Projets",
    schoolName: "Lycée des Projets",
  });
  if ("error" in result) throw new Error(result.error);
  teacherId = result.userId;
  const orgId = (await getTeacherOrgId(teacherId))!;
  await poserUneLicence(orgId, teacherId);
  const game = await createClassGame({
    teacherId,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    level: 6,
    scenarioCode: "nova",
  });
  gameId = game.gameId;
  await db.update(games).set({ seed: 7 }).where(eq(games.id, gameId));
  const student = await db
    .insert(users)
    .values({ email: "eleve-modules@test.fr", displayName: "Élève" })
    .returning({ id: users.id });
  studentId = student[0]!.id;
  await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
});

describe("modules du scénario, en classe (NOVA, niveau 6)", () => {
  it("la vue offre les deux modules du scénario au tour 1, et eux seuls", async () => {
    const view = (await getGameView(gameId, studentId))!;
    expect(view.modulesOffer?.map((m) => m.decision)).toEqual(["qualityActions", "startedRdActionIds"]);
  });

  it("les choix enregistrés passent au moteur et reviennent dans la vue", async () => {
    const view = (await getGameView(gameId, studentId))!;
    const payload = roundDecisionsSchema.parse({
      ...view.proposedDecisions,
      qualityActions: [{ actionCode: "amelioration_composants", level: 1 }],
      startedRdActionIds: ["rd-process"],
    });
    expect(refusDesModules(payload, view.modulesOffer)).toEqual([]);
    await submitTeamDecisions({ gameId, userId: studentId, payload });
    await closeCurrentRound({ gameId, teacherId });

    const apres = (await getGameView(gameId, studentId))!;
    expect(apres.lastResult!.rdActionsCost).toBeGreaterThan(0);
    expect(apres.lastResult!.qualityActions?.started).toHaveLength(1);
    const bilan = apres.periods.at(-1)!.modules!;
    expect(bilan.lignes.find((l) => l.titre === "Programmes de R&D")!.engage).toEqual([
      "Optimisation du process de fabrication",
    ]);
    expect(bilan.lignes.find((l) => l.titre === "Démarches qualité")!.engage).toEqual([
      "Amélioration des composants (qualité audio) · niveau 1",
    ]);
    // Au tour 2, ce qui a démarré est « déjà engagé » et ne se recoche pas.
    const rd = apres.modulesOffer!.find((m) => m.decision === "startedRdActionIds")!;
    expect(rd.enCours.map((x) => x.libelle)).toEqual(["Optimisation du process de fabrication"]);
    expect(rd.elements.map((e) => e.id)).not.toContain("rd-process");
    const qualite = apres.modulesOffer!.find((m) => m.decision === "qualityActions")!;
    expect(qualite.elements.find((e) => e.id === "amelioration_composants")!.valeur).toBe("2");
  });

  it("au tour 2, le programme s'arrête et la démarche monte d'un niveau", async () => {
    const view = (await getGameView(gameId, studentId))!;
    const offre = view.modulesOffer!;
    const rd = offre.find((m) => m.decision === "startedRdActionIds")!;
    expect(rd.enCours[0]!.arret?.champ).toBe("module.arret.startedRdActionIds.rd-process");
    const payload = roundDecisionsSchema.parse({
      ...view.proposedDecisions,
      // La proposition du tour reprend l'envoi précédent : rien ne se relance.
      startedRdActionIds: undefined,
      stoppedModuleItems: [{ module: "startedRdActionIds", id: "rd-process" }],
      qualityActions: [{ actionCode: "amelioration_composants", level: 2 }],
    });
    // Le serveur juge l'envoi comme la feuille : rien à refuser.
    expect(refusDesModules(payload, offre)).toEqual([]);
    await submitTeamDecisions({ gameId, userId: studentId, payload });
    await closeCurrentRound({ gameId, teacherId });

    const apres = (await getGameView(gameId, studentId))!;
    const r = apres.lastResult!;
    // Le programme arrêté ne coûte plus ce tour, et ne se lit plus dans « Déjà engagé ».
    expect(r.rdActionsCost).toBeUndefined();
    expect(apres.modulesOffer!.find((m) => m.decision === "startedRdActionIds")!.enCours).toEqual([]);
    const bilan = apres.periods.at(-1)!.modules!;
    expect(bilan.lignes.find((l) => l.titre === "Programmes de R&D")!.arrete).toEqual([
      "Optimisation du process de fabrication",
    ]);
    expect(bilan.lignes.find((l) => l.titre === "Démarches qualité")!.engage).toEqual([
      "Amélioration des composants (qualité audio) · niveau 2",
    ]);
  });
});
