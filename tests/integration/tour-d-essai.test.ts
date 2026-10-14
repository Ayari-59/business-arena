import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE TOUR D'ESSAI, DE BOUT EN BOUT : une partie de classe à trois équipes et deux tours
 * d'essai. On JOUE l'essai (décisions, situations, clôtures), on bascule, on joue la
 * vraie partie jusqu'au bout, et l'on vérifie que rien de l'essai ne compte : ni le
 * classement, ni le bilan, ni le relevé, ni le profil des élèves, ni le carnet d'usage,
 * ni ce qu'un rejeu (« mérite ou chance ») lirait de la partie.
 *
 * Puis les bords : la bascule refusée pendant le calcul d'un tour d'essai, la clôture
 * refusée pendant la bascule, l'enchaînement automatique, et la partie sans essai, qui
 * se crée exactement comme avant.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  aidRequests,
  companyStates,
  decisions,
  gameRankings,
  gameRecoveries,
  games,
  kpis,
  learningProgress,
  playerSkills,
  players,
  roundResults,
  rounds,
  scores,
  situationInstances,
  teams,
  users,
} from "@/db/schema";
import { consignerLaGazette } from "@/services/gazette.service";
import {
  closeCurrentRound,
  createClassGame,
  distribuerUnCourrier,
  getGameView,
  getTeacherGames,
  getTeacherGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import {
  getGameGradeSheet,
  getTeacherUsageView,
  getTeamSituations,
  submitDiagnosis,
} from "@/services/pedagogy.service";
import { getPlayerProfile } from "@/services/profile.service";
import { lirePartieARejouer } from "@/services/merite.service";
import { activerParDefaut, momentAtteint, vueDeLEtudiant } from "@/services/pairs.service";
import {
  BasculeRefuseeError,
  commencerLaVraiePartie,
  revoirLEssai,
} from "@/services/tour-d-essai.service";
import { registerTeacher } from "@/services/auth.service";
import { situationByCode, scenarioByCode } from "@/config/scenarios/registry";
import { BASCULE_PENDANT_UN_CALCUL, graineDEssai, lireLEssai } from "@/config/tour-d-essai";
import type { CompanyState, EngineScenarioConfig } from "@/engine/types";
import { etablissementDeLEnseignantSousLicence } from "./helpers/licence";

const DECISIONS = {
  price: 59,
  productionPlan: 1000,
  marketingBudget: 3000,
  qualityBudget: 0,
  maintenanceBudget: 0,
};
const GRAINE = 4242;

let prof: string;
let organisation: string;
let gameId: string;
let joinCode: string;
const eleves: string[] = [];
let equipes: string[] = [];
/** Les clés du profil de la partie à sa création : ses réglages, rien d'autre. */
let clesALaCreation: string[] = [];

/** Tous les élèves valident, une situation est diagnostiquée, l'enseignant clôt. */
async function jouerUnTour(partie: string): Promise<void> {
  for (const eleve of eleves) {
    const { current } = await getTeamSituations(partie, eleve);
    const premiere = current.find((s) => s.status === "open");
    if (premiere) {
      const def = situationByCode.get(premiere.code)!;
      await submitDiagnosis({
        instanceId: premiere.instanceId,
        userId: eleve,
        selectedOptionIds: def.diagnosticOptions.filter((o) => o.correct).map((o) => o.id),
      }).catch(() => undefined); // un camarade de la même équipe l'a déjà rendue
    }
    await submitTeamDecisions({ gameId: partie, userId: eleve, payload: DECISIONS });
  }
  await closeCurrentRound({ gameId: partie, teacherId: prof });
}

const lire = async (id: string) => (await db.select().from(games).where(eq(games.id, id)))[0]!;
const compterPour = async (
  table: typeof decisions | typeof roundResults | typeof kpis | typeof scores | typeof aidRequests,
  ids: string[],
) => Number(await db.$count(table, inArray(table.teamId, ids)));

beforeAll(async () => {
  const r = await registerTeacher({
    email: "essai@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Essai",
    schoolName: "Lycée de la Répétition",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  organisation = await etablissementDeLEnseignantSousLicence(prof);

  const partie = await createClassGame({
    teacherId: prof,
    organizationId: organisation,
    periodicity: "quarter",
    humanTeamsCount: 3,
    botCount: 1,
    roundsCount: 3,
    seed: GRAINE,
    essai: { tours: 2, enchainement: "manuel" },
  });
  gameId = partie.gameId;
  joinCode = partie.joinCode;
  for (let i = 0; i < 3; i += 1) {
    const [u] = await db
      .insert(users)
      .values({ email: `eleve${i}@essai.test`, displayName: `Élève ${i}` })
      .returning({ id: users.id });
    eleves.push(u!.id);
    const j = await joinGameByCode({ code: joinCode, userId: u!.id, pseudo: `Élève ${i}` });
    if ("error" in j) throw new Error(j.error);
  }
  equipes = (await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, gameId))).map(
    (t) => t.id,
  );
  clesALaCreation = Object.keys((await lire(gameId)).difficultyProfile as object).sort();
}, 300_000);

describe("à la création", () => {
  it("la partie joue l'essai : sa graine, son scénario, ses deux tours", async () => {
    const g = await lire(gameId);
    const essai = lireLEssai(g.essai)!;
    expect(essai.phase).toBe("en_cours");
    expect(essai.tours).toBe(2);
    expect(essai.graine).toBe(GRAINE);
    expect(g.seed).toBe(graineDEssai(GRAINE));
    expect(g.seed).not.toBe(GRAINE);
    const snapshot = g.scenarioSnapshot as EngineScenarioConfig;
    expect(snapshot.roundsCount).toBe(2);
    expect(snapshot.scriptedEvents).toEqual([]);
    expect(essai.scenario!.roundsCount).toBe(3);
    expect(await db.$count(rounds, eq(rounds.gameId, gameId))).toBe(2);
  });

  it("chaque élève est dans une équipe, avec son code de reprise", async () => {
    expect(await db.$count(players, inArray(players.teamId, equipes))).toBe(3);
    expect(await db.$count(gameRecoveries, eq(gameRecoveries.gameId, gameId))).toBe(3);
  });
});

describe("pendant l'essai", () => {
  let maitriseAvant: string;
  let competencesAvant: string;

  beforeAll(async () => {
    maitriseAvant = JSON.stringify(await db.select().from(learningProgress));
    competencesAvant = JSON.stringify(await db.select().from(playerSkills));
    // L'animateur ANIME l'essai : un courrier à toute la classe, la Gazette du tour 2
    // retirée. Tout cela est de l'état de jeu, qui doit partir avec l'essai.
    await distribuerUnCourrier({ gameId, teacherId: prof });
    const consigne = await consignerLaGazette({ gameId, teacherId: prof, tour: 2, mode: "retire" });
    expect(consigne.ok).toBe(true);
    await jouerUnTour(gameId);
  }, 300_000);

  it("l'arène dit « essai » et les résultats s'affichent comme d'habitude", async () => {
    const vue = (await getGameView(gameId, eleves[0]!))!;
    expect(vue.essai?.phase).toBe("en_cours");
    expect(vue.currentRound).toBe(2);
    expect(vue.periods).toHaveLength(1);
    expect((await getTeacherGameView(gameId, prof))!.ranking.length).toBeGreaterThan(0);
  });

  it("le profil des élèves ne bouge pas : ni notions, ni compétences", async () => {
    expect(JSON.stringify(await db.select().from(learningProgress))).toBe(maitriseAvant);
    expect(JSON.stringify(await db.select().from(playerSkills))).toBe(competencesAvant);
    const debriefees = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(situationInstances)
      .where(and(inArray(situationInstances.teamId, equipes), eq(situationInstances.status, "debriefed")));
    expect(debriefees[0]!.n, "la situation de l'essai se débriefe quand même").toBeGreaterThan(0);
  });

  it("ni relevé de notes, ni carnet d'usage, ni liste à son tour d'essai faux", async () => {
    expect(await getGameGradeSheet(gameId, prof)).toBeNull();
    const usage = await getTeacherUsageView(prof);
    expect(usage.totals.games).toBe(0);
    const liste = await getTeacherGames(prof);
    expect(liste.map((g) => g.gameId)).toEqual([gameId]);
    expect(liste[0]!.essai?.tours).toBe(2);
  });

  it("l'évaluation entre coéquipiers n'ouvre aucun moment pendant l'essai", async () => {
    // Deux tours d'essai : la « mi-parcours » de l'essai tomberait après le premier.
    const g = await lire(gameId);
    expect(g.currentRound).toBe(2);
    expect(momentAtteint(g, 2, "mi_parcours")).toBe(false);
    expect(momentAtteint({ ...g, status: "finished" }, 2, "fin")).toBe(false);
    await activerParDefaut(prof, gameId);
    const vue = (await vueDeLEtudiant(gameId, eleves[0]!))!;
    expect(vue).not.toBeNull();
    expect(vue.moments).toEqual([]);
  });

  it("la bascule est refusée pendant le calcul d'un tour d'essai", async () => {
    await db
      .update(rounds)
      .set({ status: "resolving" })
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, 2)));
    const refus = commencerLaVraiePartie({ gameId, teacherId: prof });
    await expect(refus).rejects.toBeInstanceOf(BasculeRefuseeError);
    await expect(refus).rejects.toThrow(BASCULE_PENDANT_UN_CALCUL);
    expect(lireLEssai((await lire(gameId)).essai)!.phase).toBe("en_cours");
    await db
      .update(rounds)
      .set({ status: "open" })
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, 2)));
  });

  it("une clôture est refusée pendant la bascule, et le tour reste ouvert", async () => {
    const g = await lire(gameId);
    await db
      .update(games)
      .set({ essai: { ...lireLEssai(g.essai)!, phase: "bascule" } })
      .where(eq(games.id, gameId));
    await expect(closeCurrentRound({ gameId, teacherId: prof })).rejects.toThrow(/vraie partie/);
    const [tour2] = await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, 2)));
    expect(tour2!.status).toBe("open");
    await db.update(games).set({ essai: g.essai }).where(eq(games.id, gameId));
  });

  it("le dernier tour d'essai clos, la partie attend : ni terminée, ni podium", async () => {
    await jouerUnTour(gameId);
    const g = await lire(gameId);
    expect(g.status).toBe("running");
    expect(g.currentRound).toBe(2);
    expect(lireLEssai(g.essai)!.phase).toBe("termine");
    expect(await db.$count(rounds, eq(rounds.gameId, gameId))).toBe(2);
  }, 300_000);
});

describe("la bascule : « Commencer la vraie partie »", () => {
  let archiveId: string;
  let archive: string[] = [];

  beforeAll(async () => {
    ({ archiveId } = await commencerLaVraiePartie({ gameId, teacherId: prof }));
    archive = (
      await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, archiveId))
    ).map((t) => t.id);
  }, 300_000);

  it("la partie reprend sa graine et son scénario, au tour 1 de la vraie partie", async () => {
    const g = await lire(gameId);
    const essai = lireLEssai(g.essai)!;
    expect(essai.phase).toBe("fini");
    expect(essai.archive).toBe(archiveId);
    expect(essai.scenario, "le scénario réel n'attend plus dans `essai`").toBeUndefined();
    expect(g.seed).toBe(GRAINE);
    expect((g.scenarioSnapshot as EngineScenarioConfig).roundsCount).toBe(3);
    expect(g.currentRound).toBe(1);
    expect(g.status).toBe("running");
    const tours = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    expect(tours.map((t) => [t.index, t.status]).sort()).toEqual([
      [1, "open"],
      [2, "pending"],
      [3, "pending"],
    ]);
    const profil = g.difficultyProfile as Record<string, unknown>;
    expect(profil.activeEvents).toBeUndefined();
    expect(profil.pendingEvents).toBeUndefined();
    expect(profil.gazette, "la Gazette du vrai tour 1 part de zéro").toBeUndefined();
    // Le profil n'a plus que ses réglages : les clés de sa création, aucune autre.
    expect(Object.keys(profil).sort()).toEqual(clesALaCreation);
    // Et l'archive, elle, garde ce que l'essai a vécu, pour le débrief.
    const archiveProfil = (await lire(archiveId)).difficultyProfile as Record<string, unknown>;
    expect(archiveProfil.gazette).toBeDefined();
  });

  it("les équipes, leurs élèves et les codes restent", async () => {
    const g = await lire(gameId);
    expect(g.joinCode).toBe(joinCode);
    const apres = (await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, gameId))).map(
      (t) => t.id,
    );
    expect(apres.sort()).toEqual([...equipes].sort());
    expect(await db.$count(players, inArray(players.teamId, equipes))).toBe(3);
    expect(await db.$count(gameRecoveries, eq(gameRecoveries.gameId, gameId))).toBe(3);
  });

  it("toutes les entreprises repartent de l'état initial du scénario", async () => {
    const etats = await db.select().from(companyStates).where(inArray(companyStates.teamId, equipes));
    expect(etats.map((e) => e.roundIndex)).toEqual(equipes.map(() => 0));
    // L'état initial de l'essai, parti dans l'archive, est le même, à l'identifiant près.
    const initiauxDeLEssai = await db
      .select()
      .from(companyStates)
      .where(and(inArray(companyStates.teamId, archive), eq(companyStates.roundIndex, 0)));
    const sansId = (s: unknown) => {
      const { id: _id, ...reste } = s as CompanyState;
      void _id;
      return reste;
    };
    const parNom = (lignes: typeof etats) =>
      Object.fromEntries(lignes.map((l) => [(l.state as CompanyState).name, sansId(l.state)]));
    expect(parNom(etats)).toEqual(parNom(initiauxDeLEssai));
    for (const ligne of initiauxDeLEssai) {
      expect((ligne.state as CompanyState).id, "l'état suit l'identifiant de son équipe").toBe(ligne.teamId);
    }
  });

  it("rien de l'essai ne reste sous la partie", async () => {
    expect(await compterPour(decisions, equipes)).toBe(0);
    expect(await compterPour(roundResults, equipes)).toBe(0);
    expect(await compterPour(kpis, equipes)).toBe(0);
    expect(await compterPour(scores, equipes)).toBe(0);
    expect(await db.$count(gameRankings, eq(gameRankings.gameId, gameId))).toBe(0);
    const situations = await db
      .select({ roundId: situationInstances.roundId })
      .from(situationInstances)
      .where(inArray(situationInstances.teamId, equipes));
    const toursReels = (await db.select({ id: rounds.id }).from(rounds).where(eq(rounds.gameId, gameId))).map(
      (t) => t.id,
    );
    for (const s of situations) expect(toursReels).toContain(s.roundId);
  });

  it("l'archive garde l'essai joué, hors des listes et des compteurs", async () => {
    const a = await lire(archiveId);
    expect(a.essaiDe).toBe(gameId);
    expect(a.joinCode).toBeNull();
    expect(a.status).toBe("finished");
    expect(a.seed).toBe(graineDEssai(GRAINE));
    expect(archive).toHaveLength(4);
    expect(await db.$count(players, inArray(players.teamId, archive))).toBe(0);
    expect(await compterPour(roundResults, archive)).toBe(2 * 4);
    expect((await getTeacherGames(prof)).map((g) => g.gameId)).toEqual([gameId]);
    const revu = (await revoirLEssai({ gameId, teacherId: prof }))!;
    expect(revu.tours.map((t) => t.index)).toEqual([1, 2]);
    expect(revu.tours[0]!.equipes).toHaveLength(4);
    expect(revu.classement).toHaveLength(4);
    expect(await revoirLEssai({ gameId, teacherId: eleves[0]! })).toBeNull();
  });

  it("une seconde bascule ne refait rien", async () => {
    const r = await commencerLaVraiePartie({ gameId, teacherId: prof });
    expect(r.dejaFaite).toBe(true);
    expect(await db.$count(rounds, eq(rounds.gameId, gameId))).toBe(3);
  });
});

describe("la vraie partie, jouée jusqu'au bout, ignore l'essai", () => {
  let maitriseAvant: string;

  beforeAll(async () => {
    maitriseAvant = JSON.stringify(await db.select().from(learningProgress));
    await jouerUnTour(gameId);
  }, 300_000);

  it("le classement ne cumule que la vraie partie", async () => {
    const resultats = await db
      .select()
      .from(roundResults)
      .where(inArray(roundResults.teamId, equipes));
    expect(resultats).toHaveLength(4);
    const classement = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
    for (const ligne of classement) {
      const cumul = (ligne.detail as { cumulativeNetIncome?: number }).cumulativeNetIncome ?? 0;
      const seul = Number(resultats.find((r) => r.teamId === ligne.teamId)!.netIncome);
      expect(cumul).toBeCloseTo(seul, 1);
    }
  });

  it("le bilan de l'arène ne relit que les tours réels", async () => {
    const vue = (await getGameView(gameId, eleves[0]!))!;
    expect(vue.periods.map((p) => p.round)).toEqual([1]);
    expect(vue.essai?.phase).toBe("fini");
  });

  it("le relevé ne compte qu'un tour, et le profil bouge enfin", async () => {
    const releve = (await getGameGradeSheet(gameId, prof))!;
    expect(releve.roundsResolved).toBe(1);
    expect(JSON.stringify(await db.select().from(learningProgress))).not.toBe(maitriseAvant);
    const profil = (await getPlayerProfile(eleves[0]!))!;
    expect(profil.games.map((g) => g.gameId)).toEqual([gameId]);
    expect(profil.games[0]!.currentRound).toBe(2);
  });

  it("le carnet d'usage compte la partie, pas son archive", async () => {
    const usage = await getTeacherUsageView(prof);
    expect(usage.totals.games).toBe(1);
  });

  it("la partie finie, ce qu'un rejeu lirait est la seule vraie partie", async () => {
    await jouerUnTour(gameId);
    await jouerUnTour(gameId);
    const g = await lire(gameId);
    expect(g.status).toBe("finished");
    const tours = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    expect(tours.every((t) => t.status === "resolved")).toBe(true);
    expect(tours).toHaveLength(3);
    // « Mérite ou chance » rejoue une partie depuis sa graine et ses états de départ :
    // ce sont ceux de la vraie partie, et la lecture rend ce qu'elle rend à toute
    // partie de classe.
    expect(g.seed).toBe(GRAINE);
    expect(await lirePartieARejouer(gameId)).toBe("pas-solo");
    const resultats = await db.select().from(roundResults).where(inArray(roundResults.teamId, equipes));
    expect(resultats).toHaveLength(3 * 4);
  }, 600_000);
});

describe("l'enchaînement automatique, et la partie sans essai", () => {
  it("le dernier tour d'essai clos, la vraie partie commence d'elle-même", async () => {
    const partie = await createClassGame({
      teacherId: prof,
      organizationId: organisation,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      seed: 77,
      essai: { tours: 1, enchainement: "auto" },
    });
    const r = await closeCurrentRound({ gameId: partie.gameId, teacherId: prof, expectedRound: 1 });
    expect(r.alreadyClosed).toBe(false);
    const g = await lire(partie.gameId);
    expect(lireLEssai(g.essai)!.phase).toBe("fini");
    expect(g.currentRound).toBe(1);
    expect(g.seed).toBe(77);
    const [ouvert] = await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, partie.gameId), eq(rounds.index, 1)));
    expect(ouvert!.status).toBe("open");
  }, 300_000);

  it("sans essai, la partie se crée exactement comme avant", async () => {
    const avec = await createClassGame({
      teacherId: prof,
      organizationId: organisation,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
      seed: 99,
      essai: { tours: 1, enchainement: "manuel" },
    });
    const sans = await createClassGame({
      teacherId: prof,
      organizationId: organisation,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
      seed: 99,
    });
    const g = await lire(sans.gameId);
    expect(g.essai).toBeNull();
    expect(g.seed).toBe(99);
    // Le scénario d'une partie sans essai est celui que la vraie partie d'un essai
    // retrouve à la bascule : la même composition, à la même graine.
    expect(g.scenarioSnapshot).toEqual(lireLEssai((await lire(avec.gameId)).essai)!.scenario);
    expect((g.scenarioSnapshot as EngineScenarioConfig).roundsCount).toBe(
      scenarioByCode("nova").scenario.roundsCount,
    );
    expect(await db.$count(rounds, eq(rounds.gameId, sans.gameId))).toBe(
      scenarioByCode("nova").scenario.roundsCount,
    );
    const vue = (await getTeacherGameView(sans.gameId, prof))!;
    expect(vue.essai).toBeNull();
    expect(vue.essaiDe).toBeNull();
  });
});
