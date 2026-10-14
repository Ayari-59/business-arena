import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * LA GAZETTE DE L'ARÈNE, BASE COMPRISE.
 *
 *   · solo : un article à chaque tour ; ce que la clôture archive est
 *     exactement ce que le joueur a lu ; l'article ne raconte que ce qui
 *     tombe, et une prévision démentie ne tombe jamais ;
 *   · classe : l'enseignant voit le tour en cours et l'aperçu du suivant, le
 *     remplace par le sien, le retire, rend la main au journal ; tout est
 *     contrôlé côté serveur ; l'archive garde ce que la classe a lu.
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
  createSoloGame,
  distribuerUnCourrier,
  getGameView,
  getTeacherGameView,
  joinGameByCode,
  resolveCurrentRound,
  submitTeamDecisions,
} from "@/services/game.service";
import { consignerLaGazette, gazetteDuPilotage } from "@/services/gazette.service";
import { lireLEdition } from "@/config/gazette/edition";
import type { ArticleDeLaGazette } from "@/config/gazette/types";
import type { RoundDecisions } from "@/engine/types";
import { poserUneLicence } from "./helpers/licence";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

const lu = (a: ArticleDeLaGazette | null) => (a ? { titre: a.titre, chapo: a.chapo, sujets: a.sujets } : null);

describe("solo : un article à chaque tour, archivé tel qu'il a été lu", () => {
  for (const [niveau, scenario] of [
    [1, "nova"],
    [3, "hotel"],
  ] as const) {
    it(`${scenario}, niveau ${niveau}`, async () => {
      const [u] = await db
        .insert(users)
        .values({ email: `gazette-${scenario}@test.local`, displayName: "Lecteur" })
        .returning({ id: users.id });
      const userId = u!.id;
      const gameId = await createSoloGame(userId, "quarter", 3, niveau, false, scenario);
      const lus: ReturnType<typeof lu>[] = [];
      for (let tour = 1; tour <= 6; tour++) {
        const avant = (await getGameView(gameId, userId))!;
        const article = avant.gazette.article;
        expect(article, `tour ${tour}`).not.toBeNull();
        expect(article!.tour).toBe(tour);
        expect(article!.titre.length).toBeGreaterThan(10);
        expect(avant.gazette.porteLeMarche).toBe(true);
        expect(avant.gazette.revue.map((a) => a.tour)).toEqual(
          Array.from({ length: tour - 1 }, (_, i) => tour - 1 - i),
        );
        lus.push(lu(article));
        // Ce qui est raconté comme un fait ou une prévision tient : c'est dans le
        // tirage annoncé ou en cours ; un démenti n'y est jamais.
        const annonces = new Set([
          ...avant.upcomingDraw.filter((c) => c.teamId === null).map((c) => c.code),
          ...avant.courriersEnCours.filter((c) => c.teamId === null).map((c) => c.code),
        ]);
        for (const x of article!.sujets) {
          if (x.code === null) continue;
          expect(annonces.has(x.code), `${x.code} tour ${tour}`).toBe(!x.dementi);
        }
        if (niveau <= 2) expect(article!.sujets.every((x) => x.fiabilite === "fait")).toBe(true);
        await resolveCurrentRound({ gameId, userId, playerDecisions: avant.proposedDecisions });
        const apres = (await getGameView(gameId, userId))!;
        // Ce qui est tombé : les nouveautés racontées y sont, les démentis non.
        const tombes = apres.periods.at(-1)!.events;
        for (const x of article!.sujets) {
          if (x.code === null || !x.nouveau) continue;
          expect(tombes.includes(x.code), `${x.code} tour ${tour}`).toBe(!x.dementi);
        }
      }
      const fin = (await getGameView(gameId, userId))!;
      expect(fin.status).toBe("finished");
      expect(fin.gazette.article).toBeNull();
      // L'archive, du plus récent au plus ancien, est exactement ce qui a été lu.
      expect(fin.gazette.revue.map(lu)).toEqual([...lus].reverse());
      // Six tours, six titres différents.
      expect(new Set(lus.map((x) => x!.titre)).size).toBe(6);
    }, 240_000);
  }
});

describe("classe : l'enseignant garde la main", () => {
  let teacherId: string;
  let orgId: string;
  let gameId: string;
  let studentId: string;

  beforeAll(async () => {
    const result = await registerTeacher({
      email: "gazette@test.fr",
      password: "motdepasse!",
      displayName: "M. Gazette",
      schoolName: "Lycée de la Presse",
    });
    if ("error" in result) throw new Error(result.error);
    teacherId = result.userId;
    orgId = (await getTeacherOrgId(teacherId))!;
    await poserUneLicence(orgId, teacherId);
    const game = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
    });
    gameId = game.gameId;
    await db.update(games).set({ seed: 7 }).where(eq(games.id, gameId));
    const [s] = await db
      .insert(users)
      .values({ email: "eleve-gazette@test.fr", displayName: "Élève" })
      .returning({ id: users.id });
    studentId = s!.id;
    await joinGameByCode({ code: game.joinCode, userId: studentId, pseudo: "Élève" });
  }, 120_000);

  it("le pilotage montre le tour en cours et l'aperçu du suivant", async () => {
    const g = (await gazetteDuPilotage(gameId, teacherId))!;
    expect(g.tours.map((t) => [t.tour, t.etat])).toEqual([
      [1, "en-cours"],
      [2, "a-paraitre"],
    ]);
    expect(g.tours.every((t) => t.consigne === null && t.genere.auteur === "gazette")).toBe(true);
    // Ce que l'élève lit au tour en cours est ce que le pilotage montre.
    const vue = (await getGameView(gameId, studentId))!;
    expect(lu(vue.gazette.article)).toEqual(lu(g.tours[0]!.genere));
    // Un élève, ou un autre compte, ne voit pas le pilotage.
    expect(await gazetteDuPilotage(gameId, studentId)).toBeNull();
  });

  it("refuse ce qui sort des règles, côté serveur", async () => {
    const titre = "Grève des dockers au port";
    const texte = "Le port est bloqué depuis lundi : les livraisons de la semaine attendront.";
    expect(await consignerLaGazette({ gameId, teacherId: studentId, tour: 2, mode: "retire" })).toMatchObject({
      ok: false,
    });
    expect(await consignerLaGazette({ gameId, teacherId, tour: 3, mode: "retire" })).toMatchObject({
      ok: false,
      erreur: expect.stringMatching(/plus modifiable/),
    });
    expect(
      await consignerLaGazette({ gameId, teacherId, tour: 2, mode: "remplace", titre, texte: "x".repeat(500) }),
    ).toMatchObject({ ok: false, erreur: expect.stringMatching(/trop long/) });
    expect(
      await consignerLaGazette({ gameId, teacherId, tour: 2, mode: "remplace", titre: "", texte }),
    ).toMatchObject({ ok: false, erreur: expect.stringMatching(/trop court/) });
    // Une partie solo n'a pas d'enseignant.
    const [u] = await db
      .insert(users)
      .values({ email: "solo-gazette@test.local", displayName: "Solo" })
      .returning({ id: users.id });
    const solo = await createSoloGame(u!.id, "quarter", 3, 1, false, "nova");
    expect(await consignerLaGazette({ gameId: solo, teacherId: u!.id, tour: 1, mode: "retire" })).toMatchObject({
      ok: false,
      erreur: expect.stringMatching(/partie de classe/),
    });
  });

  it("remplacer l'article du tour suivant : la classe le lit à l'ouverture, sans savoir qu'il est de vous", async () => {
    const titre = "Grève des dockers au port";
    const texte = "Le port est bloqué depuis lundi : les livraisons de la semaine attendront.";
    expect(await consignerLaGazette({ gameId, teacherId, tour: 2, mode: "remplace", titre, texte })).toEqual({
      ok: true,
    });
    const g = (await gazetteDuPilotage(gameId, teacherId))!;
    expect(g.tours[1]!.consigne).toEqual({ mode: "remplace", titre, texte });
    // Le tour en cours n'a pas bougé.
    const avant = (await getGameView(gameId, studentId))!;
    expect(avant.gazette.article!.auteur).toBe("gazette");
    const luAuTour1 = lu(avant.gazette.article);

    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });

    const vue = (await getGameView(gameId, studentId))!;
    expect(vue.currentRound).toBe(2);
    expect(vue.gazette.article).toMatchObject({ tour: 2, titre, chapo: texte, sujets: [] });
    // Remplacé, il ne raconte plus le marché : les circulaires reviennent.
    expect(vue.gazette.porteLeMarche).toBe(false);
    // L'archive garde ce que la classe a lu au tour 1.
    expect(vue.gazette.revue.map(lu)).toEqual([luAuTour1]);
  });

  it("ne pas publier, puis rendre la main au journal", async () => {
    expect(await consignerLaGazette({ gameId, teacherId, tour: 2, mode: "retire" })).toEqual({ ok: true });
    let vue = (await getGameView(gameId, studentId))!;
    expect(vue.gazette.article).toBeNull();
    expect(vue.gazette.porteLeMarche).toBe(false);

    expect(await consignerLaGazette({ gameId, teacherId, tour: 2, mode: "retablir" })).toEqual({ ok: true });
    vue = (await getGameView(gameId, studentId))!;
    expect(vue.gazette.article!.auteur).toBe("gazette");
    expect(vue.gazette.porteLeMarche).toBe(true);
    const pilotage = (await gazetteDuPilotage(gameId, teacherId))!;
    expect(lu(vue.gazette.article)).toEqual(lu(pilotage.tours[0]!.genere));
  });

  it("un courrier de marché distribué par l'enseignant entre dans l'article du tour", async () => {
    await distribuerUnCourrier({ gameId, teacherId, eventCode: "rate_hike" });
    const vue = (await getGameView(gameId, studentId))!;
    const codes = vue.gazette.article!.sujets.map((x) => x.code);
    // Raconté s'il a sa place (deux nouvelles au plus) ; jamais contredit.
    if (!codes.includes("rate_hike")) expect(vue.gazette.article!.sujets.filter((x) => !x.dementi)).toHaveLength(2);
    for (const x of vue.gazette.article!.sujets.filter((y) => y.sujet === "taux" && !y.dementi))
      expect(x.sens).toBe("hausse");
  });

  it("retirer l'article du tour suivant : rien ne paraît, et l'archive le sait", async () => {
    expect(await consignerLaGazette({ gameId, teacherId, tour: 3, mode: "retire" })).toEqual({ ok: true });
    const lu2 = lu((await getGameView(gameId, studentId))!.gazette.article);
    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });
    const vue = (await getGameView(gameId, studentId))!;
    expect(vue.currentRound).toBe(3);
    expect(vue.gazette.article).toBeNull();
    expect(vue.gazette.revue.map((a) => a.tour)).toEqual([2, 1]);
    expect(lu(vue.gazette.revue[0]!)).toEqual(lu2);
    const [g] = await db.select().from(games).where(eq(games.id, gameId));
    const edition = lireLEdition(g!.difficultyProfile);
    expect(Object.keys(edition.parus).sort()).toEqual(["1", "2"]);
    // Le tour en cours se ferme comme les autres, et le tour 3 paraît « retiré » à sa clôture.
    await submitTeamDecisions({ gameId, userId: studentId, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId });
    const [g2] = await db.select().from(games).where(eq(games.id, gameId));
    expect(lireLEdition(g2!.difficultyProfile).parus["3"]).toEqual({ tour: 3, retire: true });
    // Le reste du profil n'a pas bougé : la partie se joue toujours.
    expect((await getTeacherGameView(gameId, teacherId))!.currentRound).toBe(4);
  });
});
