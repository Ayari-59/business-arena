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
import { accesAuxEpisodes, ClasseReserveError, NiveauReserveError } from "@/services/acces.service";
import { NiveauGroupeReserveError } from "@/services/game-creation.service";
import { NIVEAU_GROUPE_EN_PUBLIC } from "@/config/tarifs";
import { niveauReserve } from "@/config/vitrine-solo";
import { REFUS_DE_LA_CLASSE } from "@/config/tarifs";
import { episodeOuvert, EPISODES_DE_DEMO, niveauxDeLEpisode } from "@/config/episodes/demos";
import { creerCohorte, rattacherCohorte, rejoindreCohorte } from "@/services/cohortes.service";
import { enregistrerPartie } from "@/services/episode-parties.service";
import { deleteOrgLicence, listOrgLicences } from "@/services/licence.service";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { etablissementSousLicence } from "./helpers/licence";
import type { RoundDecisions } from "@/engine/types";

/** Les démonstrations de la Découverte (par défaut), que l'accès porte jusqu'aux pages. */
const DEMOS_PAR_DEFAUT = { demos: [...EPISODES_DE_DEMO], niveauDesDemos: "decouverte" };

const DECISIONS: RoundDecisions = {
  price: 59,
  productionPlan: 4800,
  marketingBudget: 6000,
  qualityBudget: 3000,
  maintenanceBudget: 4000,
};

const MESSAGE = /Les niveaux 4 à 6 sont inclus dans les offres Classe, Programme et Campus/;

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
  sousLicence = await etablissementSousLicence("Accès", { episodes: true });
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

  it("sans licence : aucune partie de classe, à aucun niveau (pas d'essai en classe), refus motivé", async () => {
    // Décision du propriétaire (octobre 2026) : la classe sans licence fermait d'abord
    // les niveaux 4 à 6 ; elle se ferme désormais entière (tests/integration/offres.test.ts).
    for (const niveau of [1, 3, 4, 6]) {
      await expect(classe(sansLicence.orgId, sansLicence.userId, niveau)).rejects.toBeInstanceOf(
        ClasseReserveError,
      );
    }
    await expect(classe(sansLicence.orgId, sansLicence.userId, 3)).rejects.toThrow(REFUS_DE_LA_CLASSE);
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
    await expect(classe(e.orgId, e.userId, 5)).rejects.toBeInstanceOf(ClasseReserveError);

    // … la partie commencée continue : décisions rendues, tour clos.
    await submitTeamDecisions({ gameId: partie.gameId, userId: eleve, payload: DECISIONS });
    const clos = await closeCurrentRound({ gameId: partie.gameId, teacherId: e.userId });
    expect(clos.roundIndex).toBe(1);
    expect(await niveauDe(partie.gameId)).toBe(5);
  });
});

/**
 * LE NIVEAU 7 « GROUPE » : INCLUS DANS LES OFFRES, EN SOLO, AVEC NOVA EN GAMME.
 *
 * Décision du propriétaire (octobre 2026) : il sort de l'avant-première. Le drapeau
 * d'administration de la plateforme ne le commande plus — c'est la licence, comme
 * pour les niveaux 4 à 6. Deux gardes techniques restent, et ce sont elles que le
 * serveur doit tenir quel que soit l'écran :
 *   · NOVA en gamme seulement (seul scénario qui porte un bloc `groupe`) ;
 *   · en solo seulement : en classe, le rachat du fournisseur partagé ne déplace
 *     que des concurrents simulés.
 */
describe("le niveau 7 « Groupe »", () => {
  it("sans licence, l'enseignant ne crée pas de partie solo au niveau 7", async () => {
    await expect(
      createSoloGame(invite, "quarter", 2, 7, false, "nova", undefined, null, {
        licencePar: sansLicence.userId,
      }),
    ).rejects.toBeInstanceOf(NiveauReserveError);
    // Le refus dit ce qu'il faut, et ses deux restrictions : pas « les niveaux 4 à 6 ».
    await expect(
      createSoloGame(invite, "quarter", 2, 7, false, "nova", undefined, null, {
        licencePar: sansLicence.userId,
      }),
    ).rejects.toThrow(NIVEAU_GROUPE_EN_PUBLIC.inclus);
  });

  it("aucun réglage de la Découverte ne l'ouvre sans licence (règle éteinte, entreprise rouverte)", () => {
    // Les deux leviers d'admin rouvrent le PARCOURS, jamais ce qui est hors de lui.
    const eteinte = { active: false, entrepriseOuverte: "", niveauMaxAutres: 6 };
    const novaOuverte = { active: true, entrepriseOuverte: "nova", niveauMaxAutres: 3 };
    expect(niveauReserve(eteinte, "nova", 7)).toBe(true);
    expect(niveauReserve(novaOuverte, "nova", 7)).toBe(true);
    expect(niveauReserve(eteinte, "nova", 6)).toBe(false);
    expect(niveauReserve(novaOuverte, "nova", 7, true)).toBe(false);
  });

  it("avec licence, l'enseignant crée une partie solo au niveau 7", async () => {
    const id = await createSoloGame(invite, "quarter", 2, 7, false, "nova", undefined, null, {
      licencePar: sousLicence.userId,
    });
    expect(await niveauDe(id)).toBe(7);
  });

  it("avec licence, une partie de CLASSE au niveau 7 est refusée, et le refus dit pourquoi", async () => {
    const essai = createClassGame({
      teacherId: sousLicence.userId,
      organizationId: sousLicence.orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
      level: 7,
      scenarioCode: "nova",
    });
    await expect(essai).rejects.toBeInstanceOf(NiveauGroupeReserveError);
    await expect(
      createClassGame({
        teacherId: sousLicence.userId,
        organizationId: sousLicence.orgId,
        periodicity: "quarter",
        humanTeamsCount: 2,
        botCount: 1,
        level: 7,
        scenarioCode: "nova",
      }),
    ).rejects.toThrow(/ne se joue qu'en solo pour l'instant/);
  });

  it("la garde technique tient : sans bloc de groupe, le niveau 7 est refusé même sous licence", async () => {
    await expect(
      createSoloGame(invite, "quarter", 2, 7, false, "hotel", undefined, null, {
        licencePar: sousLicence.userId,
      }),
    ).rejects.toThrow(/ne se joue qu'avec NOVA, en gamme/);
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

  it("le compte rattaché à un établissement dont la licence inclut les épisodes ouvre tout", async () => {
    const acces = await accesAuxEpisodes({ userId: invite, sessionUserId: sousLicence.userId });
    expect(acces).toEqual({ licence: true, source: "compte", ...DEMOS_PAR_DEFAUT });
    expect(niveauxDeLEpisode(acces, nonDemo.code)).toEqual(["decouverte", "standard", "expert"]);
  });

  it("la cohorte d'une organisation sous licence épisodes : ses membres jouent les épisodes non démo", async () => {
    const manager = await nouvelInvite();
    const c = await creerCohorte("Acmé · sous licence", sousLicence.orgId);
    await rejoindreCohorte(manager, c.code);
    const acces = await accesAuxEpisodes({ userId: manager });
    expect(acces).toEqual({ licence: true, source: "cohorte", ...DEMOS_PAR_DEFAUT });
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
