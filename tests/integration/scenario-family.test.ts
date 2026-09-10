import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * UNE FAMILLE SE JOUE SELON LE NIVEAU.
 *
 * L'enseignant ou le joueur choisit « NOVA » ou « MAILLE & CO » ; c'est le
 * niveau de difficulté qui décide de la variante réellement créée : un seul
 * produit aux premiers niveaux, la gamme au-delà. La règle vit dans le
 * registre, mais c'est à la création de la partie qu'elle doit s'appliquer,
 * base comprise : ce test crée quatre parties et lit ce qu'elles jouent.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSoloGame, getGameView } from "@/services/game.service";

let userId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "famille@test.local", displayName: "Famille" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
});

describe("une famille de scénarios se joue selon le niveau", () => {
  it("NOVA au niveau 1 est une enceinte, au niveau 4 la gamme avec la Studio à développer", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 1, false, "nova"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.scenarioIcon).toBe("🔊");
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 4, false, "nova"), userId))!;
    expect(gamme.gamme?.map((p) => p.code)).toEqual(["nova-go", "nova-one", "nova-studio"]);
    expect(gamme.scenarioIcon).toBe("🎚️");
    expect(gamme.gamme!.find((p) => p.code === "nova-studio")!.rd?.development?.available).toBe(false);
  });

  it("L'ESCALE au niveau 3 est une nuitée à prix moyen, au niveau 4 les trois chambres", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 3, false, "hotel"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.scenarioIcon).toBe("🛎️");
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 4, false, "hotel"), userId))!;
    expect(gamme.gamme?.map((p) => p.code)).toEqual(["chambre-standard", "chambre-superieure", "suite"]);
    expect(gamme.scenarioIcon).toBe("🏨");
    expect(gamme.communicationOffer).not.toBeNull();
  });

  it("ATLAS CONSEIL au niveau 3 est une journée à taux moyen, au niveau 4 les trois offres et la cyber à bâtir", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 3, false, "conseil"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.scenarioIcon).toBe("📊");
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 4, false, "conseil"), userId))!;
    expect(gamme.gamme?.map((p) => p.code)).toEqual(["audit", "transformation", "cyber"]);
    expect(gamme.scenarioIcon).toBe("🧭");
    expect(gamme.gamme!.find((p) => p.code === "cyber")!.rd?.development?.available).toBe(false);
    expect(gamme.rdOffer).not.toBeNull();
    expect(gamme.communicationOffer).not.toBeNull();
  });

  it("MAILLE & CO au niveau 1 est un article, au niveau 3 la gamme de cinq références", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 1, false, "boutique"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.vocabulary.unit).toBe("article");
    expect(mono.scenarioIcon).toBe("🧣");
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 3, false, "boutique"), userId))!;
    expect(gamme.gamme?.length).toBe(5);
    expect(gamme.scenarioIcon).toBe("👗");
  });
});
