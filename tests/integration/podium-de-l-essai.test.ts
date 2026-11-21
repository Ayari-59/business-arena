import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE PODIUM DU TOUR D'ESSAI, RELU DANS L'ARCHIVE (services/podium-de-l-essai.service.ts).
 *
 * Une partie de classe à deux équipes et un concurrent, un tour d'essai, la vraie partie
 * lancée d'elle-même à sa clôture : l'essai part aussitôt dans l'archive. Le podium de
 * l'essai s'y relit, sous le rideau (rien avant la révélation), tant que la vraie
 * partie n'a clos aucun tour ; et sa révélation ne touche pas la vraie partie.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gameRankings, games, rounds, users } from "@/db/schema";
import { createClassGame, joinGameByCode } from "@/services/game.service";
import { registerTeacher } from "@/services/auth.service";
import {
  podiumDeLEssaiPourLEleve,
  RevelationDeLEssaiImpossible,
  revelerLeClassementDeLEssai,
  tourDEssaiALaUne,
} from "@/services/podium-de-l-essai.service";
import { lireLEssai } from "@/config/tour-d-essai";
import { etablissementDeLEnseignantSousLicence } from "./helpers/licence";
import { cloreEtLancer } from "./helpers/lancement";

let prof: string;
let autre: string;
let gameId: string;
const eleves: string[] = [];

const lire = async () => (await db.select().from(games).where(eq(games.id, gameId)))[0]!;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "podium@lycee.test",
    password: "motdepasse!",
    displayName: "M. Podium",
    schoolName: "Lycée du Podium",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const r2 = await registerTeacher({
    email: "autre@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Autre",
    schoolName: "Lycée Voisin",
  });
  if ("error" in r2) throw new Error(r2.error);
  autre = r2.userId;
  const organisation = await etablissementDeLEnseignantSousLicence(prof);
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: organisation,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    roundsCount: 3,
    seed: 2026,
    essai: { tours: 1, enchainement: "auto" },
  });
  gameId = partie.gameId;
  for (let i = 0; i < 2; i += 1) {
    const [u] = await db
      .insert(users)
      .values({ email: `eleve${i}@podium.test`, displayName: `Élève ${i}` })
      .returning({ id: users.id });
    eleves.push(u!.id);
    const j = await joinGameByCode({ code: partie.joinCode, userId: u!.id, pseudo: `Élève ${i}` });
    if ("error" in j) throw new Error(j.error);
  }
  await cloreEtLancer({ gameId, teacherId: prof });
}, 300_000);

describe("l'essai clos, la vraie partie commencée d'elle-même", () => {
  it("l'essai est dans l'archive, à la une : la vraie partie n'a clos aucun tour", async () => {
    const g = await lire();
    expect(lireLEssai(g.essai)!.phase).toBe("fini");
    const tour = await tourDEssaiALaUne({ gameId, essai: g.essai, vraiTourClos: false });
    expect(tour).toMatchObject({ tour: 1, revele: false });
  });

  it("le rideau : avant la révélation, l'élève ne reçoit aucune marche", async () => {
    const g = await lire();
    const vu = await podiumDeLEssaiPourLEleve({ gameId, userId: eleves[0]!, essai: g.essai, vraiTourClos: false });
    expect(vu).toEqual({ revele: false, marches: [] });
  });

  it("seul l'animateur de la partie révèle l'essai", async () => {
    await expect(revelerLeClassementDeLEssai({ gameId, teacherId: autre })).rejects.toThrow();
    const g = await lire();
    expect((await tourDEssaiALaUne({ gameId, essai: g.essai, vraiTourClos: false }))!.revele).toBe(false);
  });

  it("révélé : l'élève voit les trois premières places de l'essai, la sienne dite « vous »", async () => {
    await revelerLeClassementDeLEssai({ gameId, teacherId: prof });
    const g = await lire();
    for (const eleve of eleves) {
      const vu = await podiumDeLEssaiPourLEleve({ gameId, userId: eleve, essai: g.essai, vraiTourClos: false });
      expect(vu!.revele).toBe(true);
      expect(vu!.marches.map((m) => m.rang)).toEqual([1, 2, 3]);
      expect(vu!.marches.filter((m) => m.moi)).toHaveLength(1);
    }
  });

  it("la révélation de l'essai ne touche pas la vraie partie : ni classement, ni tour révélé", async () => {
    expect(await db.$count(gameRankings, eq(gameRankings.gameId, gameId))).toBe(0);
    const tours = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
    expect(tours.every((t) => t.rankingRevealedAt === null)).toBe(true);
  });

  it("le premier vrai tour clos, l'essai quitte la une", async () => {
    await cloreEtLancer({ gameId, teacherId: prof });
    const g = await lire();
    expect(await tourDEssaiALaUne({ gameId, essai: g.essai, vraiTourClos: true })).toBeNull();
    expect(
      await podiumDeLEssaiPourLEleve({ gameId, userId: eleves[0]!, essai: g.essai, vraiTourClos: true }),
    ).toBeNull();
    await expect(revelerLeClassementDeLEssai({ gameId, teacherId: prof })).rejects.toBeInstanceOf(
      RevelationDeLEssaiImpossible,
    );
  }, 300_000);
});
