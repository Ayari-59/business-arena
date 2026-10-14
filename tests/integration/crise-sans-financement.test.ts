import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA CRISE DE TRÉSORERIE À UN NIVEAU QUI N'OUVRE PAS LE FINANCEMENT.
 *
 * Depuis octobre 2026, l'emprunt et l'apport des associés s'ouvrent au niveau
 * 4. Le verrou de sauvetage, lui, réclamait un emprunt à tous les niveaux : à
 * un niveau 2 en crise, la validation se bloquait devant des leviers absents de
 * l'écran, et la partie ne pouvait plus avancer.
 *
 * La règle tenue ici : sans financement au niveau joué, pas de verrou. La
 * banque couvre par le découvert, à son taux, et cède les créances au-delà du
 * plafond ; l'alerte le dit sans réclamer d'emprunt, et le tour de crise se
 * valide et se joue. L'action est appelée telle que le formulaire l'appelle.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
const redirections: string[] = [];
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirections.push(url);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("next/server", () => ({ after: () => undefined }));
let invite = "";
vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => invite }));

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSoloGame, getGameView, resolveCurrentRound } from "@/services/game.service";
import type { RoundDecisions } from "@/engine/types";

const { playRoundAction } = await import("@/app/arena/[gameId]/actions");

/** Produire beaucoup, vendre à perte, dépenser le reste : la crise en un tour. */
const RUINEUSE: RoundDecisions = {
  price: 10,
  productionPlan: 9000,
  marketingBudget: 60000,
  qualityBudget: 40000,
  maintenanceBudget: 30000,
};

let gameId = "";

beforeAll(async () => {
  invite = (
    await db.insert(users).values({ email: "crise-n2@test.local", displayName: "Joueur" }).returning({ id: users.id })
  )[0]!.id;
  gameId = await createSoloGame(invite, "quarter", 3, 2);
});

describe("crise de trésorerie au niveau 2", () => {
  it("le niveau 2 n'ouvre ni l'emprunt ni l'apport", async () => {
    const vue = (await getGameView(gameId, invite))!;
    expect(vue.enabledDecisions.finance).toBe(false);
    // La banque se lit quand même : le découvert consenti est servi au formulaire.
    expect(vue.bankFile).not.toBeNull();
  });

  it("le tour qui bascule en crise lève l'alerte, sans exiger d'emprunt", async () => {
    await resolveCurrentRound({ gameId, userId: invite, playerDecisions: RUINEUSE });
    const vue = (await getGameView(gameId, invite))!;
    expect(vue.lastResult!.treasury!.crisis).toBe(true);
    const alerte = vue.alerteTresorerie!;
    expect(alerte.crise).toBe(true);
    expect(alerte.financementOuvert).toBe(false);
    expect(alerte.niveauDuFinancement).toBe(4);
    // LE POINT : aucun verrou de sauvetage.
    expect(vue.exigenceSauvetage).toBeNull();
  });

  it("le tour de crise se valide par l'action, et la partie avance", async () => {
    const vue = (await getGameView(gameId, invite))!;
    const d = vue.proposedDecisions;
    const fd = new FormData();
    fd.set("price", String(d.price));
    fd.set("productionPlan", String(Math.max(1, Math.round(d.productionPlan))));
    fd.set("marketingBudget", String(d.marketingBudget));
    fd.set("qualityBudget", String(d.qualityBudget));
    fd.set("maintenanceBudget", String(d.maintenanceBudget));
    redirections.length = 0;
    const etat = await playRoundAction(gameId, { error: null }, fd);
    expect(etat.error).toBeNull();
    expect(redirections[0]).toMatch(/\?simule=1$/);
    expect((await getGameView(gameId, invite))!.currentRound).toBe(3);
  }, 120_000);
});
