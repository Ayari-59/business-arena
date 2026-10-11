import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * SANS LICENCE : NIVEAUX 1 À 3, ET LES SEULES DÉMONSTRATIONS. VÉRIFIÉ CÔTÉ SERVEUR.
 *
 * Décision du propriétaire (octobre 2026) : « Fermer les niveaux 4 à 6 et mettre
 * uniquement 5 épisodes en démo », pour tous ceux qui n'ont pas de licence active. Ce
 * test pose la règle là où elle doit tenir quel que soit l'écran : la création d'une
 * partie (solo et classe), l'ouverture d'un épisode. Et il garde ce qu'elle ne doit
 * jamais casser : une partie commencée se termine.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import {
  closeCurrentRound,
  createClassGame,
  createSoloGame,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import { accesAuxEpisodes, NiveauReserveError } from "@/services/acces.service";
import { episodeOuvert, EPISODES_DE_DEMO, niveauxDeLEpisode } from "@/config/episodes/demos";
import { creerCohorte, rattacherCohorte, rejoindreCohorte } from "@/services/cohortes.service";
import { enregistrerPartie } from "@/services/episode-parties.service";
import { deleteOrgLicence, listOrgLicences } from "@/services/licence.service";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { etablissementSousLicence } from "./helpers/licence";
import type { RoundDecisions } from "@/engine/types";

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

const MESSAGE = /Les niveaux 4 à 6 sont inclus dans les offres Enseignant et Établissement/;

let invite: string;
let sansLicence: { userId: string; orgId: string };
let sousLicence: { userId: string; orgId: string };

async function nouvelInvite(): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ email: `invite-${randomUUID()}@guest.test`, displayName: "Invité" })
    .returning({ id: users.id });
  return u!.id;
}

beforeAll(async () => {
  invite = await nouvelInvite();
  const r = await registerTeacher({
    email: "sans-licence@lycee.test",
    password: "motdepasse!",
    displayName: "Sans licence",
    schoolName: "Lycée sans licence",
  });
  if ("error" in r) throw new Error(r.error);
  sansLicence = { userId: r.userId, orgId: (await getTeacherOrgId(r.userId))! };
  sousLicence = await etablissementSousLicence("Accès");
});

const niveauDe = async (gameId: string) =>
  ((await db.select().from(games).where(eq(games.id, gameId)))[0]!.difficultyProfile as {
    level: number;
  }).level;

describe("le solo public sans licence", () => {
  it("se crée aux niveaux 1 à 3", async () => {
    for (const niveau of [1, 2, 3]) {
      const id = await createSoloGame(invite, "quarter", 2, niveau, false, "hotel");
      expect(await niveauDe(id)).toBe(niveau);
    }
  });

  it("refuse les niveaux 4 à 6, pour chaque entreprise, avec le message", async () => {
    for (const niveau of [4, 5, 6]) {
      for (const code of ["nova", "hotel", "conseil"]) {
        const essai = createSoloGame(invite, "quarter", 2, niveau, false, code);
        await expect(essai).rejects.toBeInstanceOf(NiveauReserveError);
        await expect(
          createSoloGame(invite, "quarter", 2, niveau, false, code),
        ).rejects.toThrow(MESSAGE);
      }
    }
  });

  it("le compte enseignant d'un établissement sans licence n'y change rien", async () => {
    await expect(
      createSoloGame(invite, "quarter", 2, 5, false, "nova", undefined, null, {
        licencePar: sansLicence.userId,
      }),
    ).rejects.toBeInstanceOf(NiveauReserveError);
  });

  it("l'enseignant connecté d'un établissement sous licence les ouvre", async () => {
    const id = await createSoloGame(invite, "quarter", 2, 6, false, "nova", undefined, null, {
      licencePar: sousLicence.userId,
    });
    expect(await niveauDe(id)).toBe(6);
  });
});

describe("la partie de classe", () => {
  const classe = (orgId: string, teacherId: string, level: number) =>
    createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      level,
      scenarioCode: "nova",
    });

  it("sans licence : niveaux 1 à 3 seulement, refus motivé au-delà", async () => {
    await expect(classe(sansLicence.orgId, sansLicence.userId, 3)).resolves.toBeTruthy();
    await expect(classe(sansLicence.orgId, sansLicence.userId, 4)).rejects.toThrow(MESSAGE);
    await expect(classe(sansLicence.orgId, sansLicence.userId, 6)).rejects.toBeInstanceOf(
      NiveauReserveError,
    );
  });

  it("avec licence : les six niveaux", async () => {
    for (const niveau of [4, 5, 6]) {
      const { gameId } = await classe(sousLicence.orgId, sousLicence.userId, niveau);
      expect(await niveauDe(gameId)).toBe(niveau);
    }
  });

  it("une partie de niveau 5 commencée sous licence se joue jusqu'au bout sans elle", async () => {
    const e = await etablissementSousLicence("Fin de licence");
    const partie = await classe(e.orgId, e.userId, 5);
    const eleve = await nouvelInvite();
    const j = await joinGameByCode({ code: partie.joinCode, userId: eleve, pseudo: "Élève" });
    if ("error" in j) throw new Error(j.error);

    // La licence disparaît (fin de contrat, erreur de saisie corrigée) …
    for (const l of await listOrgLicences(e.orgId)) await deleteOrgLicence(l.id);
    await expect(classe(e.orgId, e.userId, 5)).rejects.toBeInstanceOf(NiveauReserveError);

    // … la partie commencée continue : décisions rendues, tour clos.
    await submitTeamDecisions({ gameId: partie.gameId, userId: eleve, payload: DECISIONS });
    const clos = await closeCurrentRound({ gameId: partie.gameId, teacherId: e.userId });
    expect(clos.roundIndex).toBe(1);
    expect(await niveauDe(partie.gameId)).toBe(5);
  });
});

describe("les épisodes", () => {
  const nonDemo = EPISODES.find((e) => !(EPISODES_DE_DEMO as readonly string[]).includes(e.code))!;
  const demo = EPISODES_DE_DEMO[0];

  it("sans licence : un épisode non démo est refusé, une démo s'ouvre en Découverte seulement", async () => {
    const acces = await accesAuxEpisodes({ userId: invite, sessionUserId: null });
    expect(acces.licence).toBe(false);
    expect(episodeOuvert(acces, nonDemo.code)).toBe(false);
    expect(niveauxDeLEpisode(acces, demo)).toEqual(["decouverte"]);
    // Un enseignant connecté sans licence non plus.
    const prof = await accesAuxEpisodes({ userId: invite, sessionUserId: sansLicence.userId });
    expect(episodeOuvert(prof, nonDemo.code)).toBe(false);
  });

  it("le compte rattaché à un établissement sous licence ouvre tout", async () => {
    const acces = await accesAuxEpisodes({ userId: invite, sessionUserId: sousLicence.userId });
    expect(acces).toEqual({ licence: true, source: "compte" });
    expect(niveauxDeLEpisode(acces, nonDemo.code)).toEqual(["decouverte", "standard", "expert"]);
  });

  it("la cohorte d'une organisation sous licence : ses membres jouent les épisodes non démo", async () => {
    const manager = await nouvelInvite();
    const c = await creerCohorte("Acmé · sous licence", sousLicence.orgId);
    await rejoindreCohorte(manager, c.code);
    const acces = await accesAuxEpisodes({ userId: manager });
    expect(acces).toEqual({ licence: true, source: "cohorte" });
    expect(episodeOuvert(acces, nonDemo.code, "expert")).toBe(true);
  });

  it("une cohorte sans organisation, ou d'une organisation sans licence : les démos seules", async () => {
    const m1 = await nouvelInvite();
    const m2 = await nouvelInvite();
    const libre = await creerCohorte("Cohorte sans organisation");
    const sans = await creerCohorte("Cohorte sans licence", sansLicence.orgId);
    await rejoindreCohorte(m1, libre.code);
    await rejoindreCohorte(m2, sans.code);
    for (const m of [m1, m2]) {
      const acces = await accesAuxEpisodes({ userId: m });
      expect(acces.licence).toBe(false);
      expect(episodeOuvert(acces, nonDemo.code)).toBe(false);
    }
    // Rattachée depuis /admin à l'organisation sous licence : tout s'ouvre.
    await rattacherCohorte(libre.id, sousLicence.orgId);
    expect((await accesAuxEpisodes({ userId: m1 })).licence).toBe(true);
  });

  it("une partie d'épisode non démo déjà jouée est toujours gardée : on ne casse pas une partie", async () => {
    const manager = await nouvelInvite();
    const r = await enregistrerPartie(manager, {
      cle: randomUUID(),
      code: nonDemo.code,
      niveau: "standard",
      graine: 3,
      chemin: nonDemo.references[0]!.chemin,
      consultes: [],
      jours: 2,
      diagnostic: nonDemo.diagnostics[0]!.id,
      reevaluation: { choix: "maintient", principal: null },
      prevision: nonDemo.prevision.min,
      confiance: 50,
    });
    expect(r.ok).toBe(true);
  });
});
