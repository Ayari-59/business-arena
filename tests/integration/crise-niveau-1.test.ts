import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * UNE CRISE DE TRÉSORERIE SE JOUE, AU NIVEAU 1.
 *
 * Aux niveaux 1-2, la décision de financement est fermée : ni emprunt ni
 * augmentation de capital à saisir. La crise exigeait pourtant l'un ou l'autre
 * pour valider le tour — un bouton grisé réclamait ce que l'écran n'offrait pas,
 * puis l'entreprise était gelée deux tours plus tard : la partie ne se jouait
 * plus. Visible quand le niveau 1 est devenu le niveau de départ.
 *
 * Même jeu démesuré, deux niveaux : au 1, les associés recapitalisent d'office
 * et la partie continue ; au 3, la crise reste, avec ses leviers et son verrou.
 * Sur le vrai moteur, la vraie base, les vrais services.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companyStates, rounds, teams, users } from "@/db/schema";
import { createSoloGame, resolveCurrentRound } from "@/services/game.service";
import { getGameView } from "@/services/game-view.service";
import { bloqueLaValidation, verdictSauvetage } from "@/services/sauvetage";
import type { CompanyState, RoundDecisions } from "@/engine/types";

let userId: string;

// Une production et un budget démesurés : sans apport, la trésorerie passe sous le découvert autorisé.
const EN_CRISE: RoundDecisions = {
  price: 40,
  productionPlan: 5600,
  marketingBudget: 30000,
  qualityBudget: 0,
  maintenanceBudget: 0,
};

beforeAll(async () => {
  userId = (
    await db.insert(users).values({ email: "crise-n1@test.local", displayName: "Joueur" }).returning({ id: users.id })
  )[0]!.id;
});

describe("la même crise, selon le niveau", () => {
  it("niveau 3 : la crise est là, avec son exigence et son verrou", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 3);
    let vue = await getGameView(gameId, userId);
    for (let tour = 0; tour < 4 && !vue?.alerteTresorerie?.crise; tour++) {
      await resolveCurrentRound({ gameId, userId, playerDecisions: EN_CRISE });
      vue = await getGameView(gameId, userId);
    }
    expect(vue?.alerteTresorerie?.crise).toBe(true);
    expect(vue?.financeFermee).toBe(false);
    const exigence = vue!.exigenceSauvetage!;
    expect(exigence.manque).toBeGreaterThan(0);
    expect(bloqueLaValidation(verdictSauvetage(exigence, { emprunt: 0, apport: 0 }))).toBe(true);
  });

  it("niveau 1 : les associés recapitalisent d'office, la crise n'existe pas et rien ne bloque", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 1);
    await resolveCurrentRound({ gameId, userId, playerDecisions: EN_CRISE });
    const vue = (await getGameView(gameId, userId))!;
    // Le même jeu démesuré qui met le niveau 3 en crise n'en met pas le niveau 1…
    expect(vue.alerteTresorerie).toBeNull();
    // … le verrou ne s'applique pas : le joueur n'a ni emprunt ni apport à saisir…
    expect(vue.exigenceSauvetage).toBeNull();
    expect(vue.financeFermee).toBe(true);
    // … et l'enveloppe des associés, elle, a bien servi.
    expect(vue.capitalAllowance!.remaining).toBeLessThan(vue.capitalAllowance!.total);
  });

  it("niveau 1 : le tour enregistre l'apport comme une décision, et l'entreprise reste active", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 1);
    await resolveCurrentRound({ gameId, userId, playerDecisions: EN_CRISE });
    const equipe = (
      await db.select().from(teams).where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")))
    )[0]!;
    const tour = (await db.select().from(rounds).where(and(eq(rounds.gameId, gameId), eq(rounds.index, 1))))[0]!;
    const etat = (
      await db
        .select()
        .from(companyStates)
        .where(and(eq(companyStates.teamId, equipe.id), eq(companyStates.roundIndex, tour.index)))
    )[0]!.state as CompanyState;
    expect(etat.status ?? "active").toBe("active");
    expect(etat.capitalRaised ?? 0).toBeGreaterThanOrEqual(0);
  });
});

describe("quand l'enveloppe est épuisée, la crise suit son cours", () => {
  it("niveau 1 : à force de jouer démesuré, l'apport s'arrête et la crise revient — sans exigence ni blocage", async () => {
    const gameId = await createSoloGame(userId, "quarter", 3, 1);
    let vue = (await getGameView(gameId, userId))!;
    for (let tour = 0; tour < 5 && !vue.alerteTresorerie?.crise; tour++) {
      await resolveCurrentRound({ gameId, userId, playerDecisions: EN_CRISE });
      vue = (await getGameView(gameId, userId))!;
      // À aucun moment le joueur n'est bloqué par une exigence qu'il ne peut pas satisfaire.
      expect(vue.exigenceSauvetage).toBeNull();
    }
    expect(vue.alerteTresorerie?.crise).toBe(true);
    expect(vue.capitalAllowance!.remaining).toBe(0);
    // Le bandeau en tire la conséquence : « enveloppe épuisée », pas « empruntez ».
    expect(vue.financeFermee).toBe(true);
  }, 120000);
});
