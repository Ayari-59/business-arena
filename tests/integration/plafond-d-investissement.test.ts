import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LE PLAFOND D'INVESTISSEMENT, DE L'ACTION AU MOTEUR, SUR UNE VRAIE BASE.
 *
 * Depuis octobre 2026, aucun niveau n'ouvre l'investissement sans les
 * embauches. Le plafond reste pour les parties créées AVANT cette répartition,
 * qui gardent leurs leviers d'alors (l'investissement sans les RH aux niveaux 1
 * à 3, `REPARTITION_AVANT_2026_10_11`). Une telle partie de niveau 3 refuse
 * d'acheter plus de capacité que l'équipe ne fait tourner, avec le message du
 * propriétaire, et accepte en dessous ; une partie de niveau 4 accepte.
 * L'action est appelée telle que le formulaire l'appelle.
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
import { games, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSoloGame } from "@/services/game.service";
import { getGameView } from "@/services/game-view.service";
import { placerSousLicence } from "./helpers/licence";

const { playRoundAction } = await import("@/app/arena/[gameId]/actions");

beforeAll(async () => {
  invite = (
    await db.insert(users).values({ email: "plafond@test.local", displayName: "Joueur" }).returning({ id: users.id })
  )[0]!.id;
  // Les niveaux 4 à 6 se jouent sous licence (règle gardée ailleurs).
  await placerSousLicence(invite);
});

/** Une partie créée avant la répartition d'octobre 2026 : son profil ne figeait que le niveau. */
async function commeAvantLaRepartition(gameId: string) {
  const row = (await db.select().from(games).where(eq(games.id, gameId)))[0]!;
  const profil = row.difficultyProfile as { difficulty: { level: number; name: string } } & Record<string, unknown>;
  await db
    .update(games)
    .set({ difficultyProfile: { ...profil, difficulty: { level: profil.difficulty.level, name: profil.difficulty.name } } })
    .where(eq(games.id, gameId));
}

/** Le formulaire d'un tour : les décisions proposées, et des machines achetées. */
async function formulaire(gameId: string, achats: { typeCode: string; quantity: number }[]) {
  const vue = (await getGameView(gameId, invite))!;
  const d = vue.proposedDecisions;
  const fd = new FormData();
  fd.set("price", String(d.price));
  fd.set("productionPlan", String(Math.max(1, Math.round(d.productionPlan))));
  fd.set("marketingBudget", String(d.marketingBudget));
  fd.set("qualityBudget", String(d.qualityBudget));
  fd.set("maintenanceBudget", String(d.maintenanceBudget));
  fd.set("newLoan", "0");
  fd.set("equipmentBuyJson", JSON.stringify(achats));
  fd.set("equipmentSellJson", "[]");
  return { fd, vue };
}

describe("le plafond, joué", () => {
  it("aujourd'hui, au niveau 3, ni investissement ni plafond", async () => {
    const gameId = await createSoloGame(invite, "quarter", 3, 3, false, "hotel");
    expect((await getGameView(gameId, invite))!.plafondInvestissement).toBeNull();
  });

  it("niveau 3 d'avant la répartition, L'ESCALE : au-delà de l'équipe, refusé avec le message ; en dessous, le tour se joue", async () => {
    const gameId = await createSoloGame(invite, "quarter", 3, 3, false, "hotel");
    await commeAvantLaRepartition(gameId);
    const { fd, vue } = await formulaire(gameId, [{ typeCode: "chambre_renovee", quantity: 2 }]);
    const p = vue.plafondInvestissement!;
    expect(p.applique).toBe(true);
    // 14 personnes servent 8 493 nuitées, les chambres en offrent 5 400 : 3 093 de marge.
    expect(p.marge).toBe(Math.floor(p.mainDOeuvre - p.machine));
    expect(2 * 1800).toBeGreaterThan(p.marge);
    const refus = await playRoundAction(gameId, { error: null }, fd);
    expect(refus.erreurs).toHaveLength(1);
    expect(refus.erreurs![0]!.champ).toBe("equipmentBuy.chambre_renovee");
    expect(refus.erreurs![0]!.message.replace(/[  ]/g, " ")).toBe(
      `Investissement : votre équipe de 14 personnes peut servir 8 493 nuitées par tour ; vos chambres en offrent déjà 5 400. Au-delà de ${p.marge.toLocaleString("fr-FR").replace(/[  ]/g, " ")} nuitées de capacité en plus, une chambre resterait fermée. Les embauches s'ouvrent au niveau 4.`,
    );
    expect((await getGameView(gameId, invite))!.currentRound).toBe(1);

    const enDessous = await formulaire(gameId, [{ typeCode: "chambre_renovee", quantity: 1 }]);
    redirections.length = 0;
    const ok = await playRoundAction(gameId, { error: null }, enDessous.fd);
    expect(ok.error).toBeNull();
    expect(redirections[0]).toMatch(/\?simule=1$/);
    const apres = (await getGameView(gameId, invite))!;
    expect(apres.currentRound).toBe(2);
    // La chambre achetée est commandée : le plafond du tour 2 la compte déjà.
    expect(apres.plafondInvestissement!.machine).toBe(p.machine + 1800);
    expect(apres.plafondInvestissement!.marge).toBe(p.marge - 1800);
  }, 180_000);

  it("niveau 3 d'avant la répartition, TRANSPORT : la même semi-remorque est refusée ; niveau 4, elle passe", async () => {
    const n3 = await createSoloGame(invite, "quarter", 3, 3, false, "transport");
    await commeAvantLaRepartition(n3);
    const a = await formulaire(n3, [{ typeCode: "semi_remorque", quantity: 1 }]);
    expect(a.vue.plafondInvestissement!.applique).toBe(true);
    const refus = await playRoundAction(n3, { error: null }, a.fd);
    expect(refus.erreurs?.[0]?.champ).toBe("equipmentBuy.semi_remorque");
    expect(refus.error).toMatch(/^Investissement : votre équipe de 10 personnes peut acheminer/);

    const n4 = await createSoloGame(invite, "quarter", 3, 4, false, "transport");
    const b = await formulaire(n4, [{ typeCode: "semi_remorque", quantity: 1 }]);
    expect(b.vue.plafondInvestissement!.applique).toBe(false);
    redirections.length = 0;
    const ok = await playRoundAction(n4, { error: null }, b.fd);
    expect(ok.error).toBeNull();
    expect((await getGameView(n4, invite))!.currentRound).toBe(2);
  }, 180_000);
});
