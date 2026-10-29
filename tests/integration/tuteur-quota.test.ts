import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

/**
 * LE TUTEUR IA : UN INTERRUPTEUR PAR PARTIE, UN QUOTA PAR ÉLÈVE.
 *
 * Chaque question part chez Anthropic. L'enseignant doit pouvoir couper le tuteur de sa
 * partie, et un élève ne doit pas pouvoir en poser plus que le quota : les deux se
 * vérifient côté serveur, sur la base, avant tout envoi.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { createClassGame } from "@/services/game.service";
import {
  questionsRestantes,
  reglerLeTuteur,
  rendreUneQuestion,
  reserverUneQuestion,
  tuteurActifPour,
} from "@/services/tuteur.service";
import {
  MESSAGE_QUOTA_ATTEINT,
  MESSAGE_TUTEUR_COUPE,
  QUESTIONS_AU_TUTEUR_PAR_PARTIE,
} from "@/config/tuteur";
import { etablissementSousLicence } from "./helpers/licence";

let prof: { userId: string; orgId: string };
let autre: { userId: string; orgId: string };
let gameId: string;

async function eleve(): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ email: `guest-tuteur-${Date.now()}-${Math.random()}@guest.business-arena.local`, displayName: "Élève" })
    .returning({ id: users.id });
  return u!.id;
}

beforeAll(async () => {
  prof = await etablissementSousLicence("Tuteur");
  autre = await etablissementSousLicence("Voisin");
  const g = await createClassGame({
    teacherId: prof.userId,
    organizationId: prof.orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    seed: 5,
  });
  gameId = g.gameId;
}, 60_000);

describe("le quota de questions", () => {
  it("laisse poser exactement le quota, puis refuse avec un message clair", async () => {
    const id = await eleve();
    for (let i = 1; i <= QUESTIONS_AU_TUTEUR_PAR_PARTIE; i += 1) {
      const r = await reserverUneQuestion(gameId, id);
      expect(r).toEqual({ ok: true, restantes: QUESTIONS_AU_TUTEUR_PAR_PARTIE - i });
    }
    expect(await reserverUneQuestion(gameId, id)).toEqual({ ok: false, reason: MESSAGE_QUOTA_ATTEINT });
    expect(await questionsRestantes(gameId, id)).toBe(0);
  });

  it("tient sous des envois simultanés", async () => {
    const id = await eleve();
    const r = await Promise.all(
      Array.from({ length: QUESTIONS_AU_TUTEUR_PAR_PARTIE + 5 }, () => reserverUneQuestion(gameId, id)),
    );
    expect(r.filter((x) => x.ok).length).toBe(QUESTIONS_AU_TUTEUR_PAR_PARTIE);
  });

  it("est propre à chaque élève, et une réponse ratée rend la question", async () => {
    const id = await eleve();
    await reserverUneQuestion(gameId, id);
    expect(await questionsRestantes(gameId, id)).toBe(QUESTIONS_AU_TUTEUR_PAR_PARTIE - 1);
    await rendreUneQuestion(gameId, id);
    expect(await questionsRestantes(gameId, id)).toBe(QUESTIONS_AU_TUTEUR_PAR_PARTIE);
  });
});

describe("l'interrupteur de la partie", () => {
  it("est allumé par défaut", async () => {
    expect(await tuteurActifPour(gameId)).toBe(true);
  });

  it("ne bouge pas pour un autre enseignant", async () => {
    await expect(reglerLeTuteur({ gameId, teacherId: autre.userId, actif: false })).rejects.toThrow();
    expect(await tuteurActifPour(gameId)).toBe(true);
  });

  it("coupé par l'enseignant, il refuse toute question, même avec du quota", async () => {
    await reglerLeTuteur({ gameId, teacherId: prof.userId, actif: false });
    const id = await eleve();
    expect(await reserverUneQuestion(gameId, id)).toEqual({ ok: false, reason: MESSAGE_TUTEUR_COUPE });
    expect(await questionsRestantes(gameId, id)).toBe(QUESTIONS_AU_TUTEUR_PAR_PARTIE);
    await reglerLeTuteur({ gameId, teacherId: prof.userId, actif: true });
    expect((await reserverUneQuestion(gameId, id)).ok).toBe(true);
  });
});

describe("l'action du tuteur", () => {
  it("réserve la question (interrupteur et quota) AVANT d'appeler l'IA", () => {
    const source = readFileSync("src/app/arena/[gameId]/ai-actions.ts", "utf8");
    const corps = source.slice(source.indexOf("export async function tutorChatAction"));
    const reserve = corps.indexOf("reserverUneQuestion(");
    expect(reserve).toBeGreaterThan(0);
    expect(reserve).toBeLessThan(corps.indexOf("generate("));
    expect(corps).toContain("if (!reserve.ok) return");
  });

  it("l'arène cache le tuteur coupé, et l'enseignant a son réglage dans la page de la partie", () => {
    expect(readFileSync("src/app/arena/[gameId]/page.tsx", "utf8")).toContain("tuteurActifPour(gameId)");
    const pilotage = readFileSync("src/app/teacher/games/[gameId]/page.tsx", "utf8");
    expect(pilotage).toContain("reglerLeTuteurAction");
    expect(pilotage).toContain("data-reglage-tuteur");
  });
});
