import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * L'EFFECTIF D'UNE CLASSE SOUS L'OFFRE CLASSE (décision du propriétaire, octobre 2026 :
 * « une classe max 35 élèves »).
 *
 * Sous l'offre Classe, une partie de classe et une classe du cours accueillent au plus
 * `ELEVES_PAR_CLASSE` élèves : le suivant reçoit un refus qui lui dit de prévenir son
 * enseignant. L'élève déjà inscrit revient toujours. Programme lève le plafond.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { coursEleves, players, teams, users } from "@/db/schema";
import { ELEVES_PAR_CLASSE, refusDeLEffectif } from "@/config/tarifs";
import { createClassGame } from "@/services/game-creation.service";
import { joinGameByCode } from "@/services/game.service";
import { creerClasse, rejoindreClasse } from "@/services/cours.service";
import { etablissementSousLicence } from "./helpers/licence";

async function eleves(n: number): Promise<string[]> {
  const lignes = await db
    .insert(users)
    .values(Array.from({ length: n }, () => ({ email: `${randomUUID()}@guest.test`, displayName: "Élève" })))
    .returning({ id: users.id });
  return lignes.map((l) => l.id);
}

/** Une partie de classe déjà remplie de `n` élèves, posés directement dans sa première équipe. */
async function partieRemplie(perimetre: Parameters<typeof etablissementSousLicence>[1], n: number) {
  const prof = await etablissementSousLicence("Effectif", perimetre);
  const partie = await createClassGame({
    teacherId: prof.userId,
    organizationId: prof.orgId,
    periodicity: "quarter",
    humanTeamsCount: 2,
    botCount: 1,
    scenarioCode: "nova",
    level: 3,
  });
  const [equipe] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.gameId, partie.gameId), eq(teams.controller, "human")));
  const inscrits = await eleves(n);
  await db.insert(players).values(inscrits.map((userId) => ({ teamId: equipe!.id, userId, role: "member" as const })));
  return { code: partie.joinCode, inscrits, prof };
}

describe("une partie de classe sous l'offre Classe", () => {
  let partie: Awaited<ReturnType<typeof partieRemplie>>;
  beforeAll(async () => {
    partie = await partieRemplie({ arene: "classe", entreprises: ["nova"], niveaux: [3] }, ELEVES_PAR_CLASSE);
  }, 60_000);

  it("au plafond, l'élève de plus reçoit le refus", async () => {
    const [nouveau] = await eleves(1);
    expect(await joinGameByCode({ code: partie.code, userId: nouveau! })).toEqual({ error: refusDeLEffectif("partie") });
  });

  it("l'élève déjà inscrit revient", async () => {
    const r = await joinGameByCode({ code: partie.code, userId: partie.inscrits[0]! });
    expect("gameId" in r).toBe(true);
  });

  it("un de moins que le plafond : l'élève entre", async () => {
    const autre = await partieRemplie({ arene: "classe", entreprises: ["nova"], niveaux: [3] }, ELEVES_PAR_CLASSE - 1);
    const [nouveau] = await eleves(1);
    expect("gameId" in (await joinGameByCode({ code: autre.code, userId: nouveau! }))).toBe(true);
  }, 60_000);
});

describe("une partie de classe sous l'offre Programme", () => {
  it("pas de plafond : l'élève de plus entre", async () => {
    const partie = await partieRemplie({ arene: "programme", entreprises: ["nova"] }, ELEVES_PAR_CLASSE);
    const [nouveau] = await eleves(1);
    expect("gameId" in (await joinGameByCode({ code: partie.code, userId: nouveau! }))).toBe(true);
  }, 60_000);
});

describe("une classe du cours sous l'offre Classe", () => {
  let code: string;
  let inscrits: string[];
  beforeAll(async () => {
    const prof = await etablissementSousLicence("Cours", { arene: "classe", entreprises: ["nova"], niveaux: [3] });
    const classe = (await creerClasse({ enseignantId: prof.userId, nom: "BTS CG 1 · effectif", entreprise: null, parcours: "comptabilite-generale" }))!;
    code = classe.code;
    inscrits = await eleves(ELEVES_PAR_CLASSE);
    await db.insert(coursEleves).values(inscrits.map((userId, i) => ({ userId, classeId: classe.id, nom: `Élève ${i}` })));
  }, 60_000);

  it("au plafond, l'élève de plus reçoit le refus", async () => {
    const [nouveau] = await eleves(1);
    expect(await rejoindreClasse(nouveau!, code, "Zoé")).toEqual({ ok: false, refus: "pleine" });
  });

  it("l'élève déjà inscrit change son prénom", async () => {
    expect((await rejoindreClasse(inscrits[0]!, code, "Léa")).ok).toBe(true);
  });
});
