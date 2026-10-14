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
import { placerSousLicence } from "./helpers/licence";

let userId: string;

beforeAll(async () => {
  const inserted = await db
    .insert(users)
    .values({ email: "famille@test.local", displayName: "Famille" })
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  // Les niveaux 4 à 6 sont inclus dans les offres Enseignant et Établissement : ce
  // joueur est un enseignant d'un établissement sous licence (la règle elle-même est
  // gardée par acces-sans-licence.test.ts).
  await placerSousLicence(userId);
});

describe("une famille de scénarios se joue selon le niveau", () => {
  it("NOVA au niveau 1 est une enceinte, au niveau 4 la gamme (la Studio livrée prête), au niveau 5 la Studio à développer", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 1, false, "nova"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.scenarioCode).toBe("nova");
    // Niveau 4 : la gamme, sans la R&D (ouverte au niveau 5) ; la référence est livrée prête.
    const sansRd = (await getGameView(await createSoloGame(userId, "quarter", 3, 4, false, "nova"), userId))!;
    expect(sansRd.gamme!.find((p) => p.code === "nova-studio")!.rd ?? null).toBeNull();
    expect(sansRd.rdOffer).toBeNull();
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 5, false, "nova"), userId))!;
    expect(gamme.gamme?.map((p) => p.code)).toEqual(["nova-go", "nova-one", "nova-studio"]);
    expect(gamme.scenarioCode).toBe("nova-gamme");
    expect(gamme.gamme!.find((p) => p.code === "nova-studio")!.rd?.development?.available).toBe(false);
  });

  it("L'ESCALE au niveau 3 est une nuitée à prix moyen, au niveau 4 les trois chambres", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 3, false, "hotel"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.scenarioCode).toBe("hotel");
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 4, false, "hotel"), userId))!;
    expect(gamme.gamme?.map((p) => p.code)).toEqual(["chambre-standard", "chambre-superieure", "suite"]);
    expect(gamme.scenarioCode).toBe("hotel-gamme");
    expect(gamme.communicationOffer).not.toBeNull();
  });

  it("ATLAS CONSEIL au niveau 3 est une journée à taux moyen, au niveau 4 les trois offres, au niveau 5 la cyber à bâtir", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 3, false, "conseil"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.scenarioCode).toBe("conseil");
    // Niveau 4 : la gamme, sans la R&D (ouverte au niveau 5) ; la référence est livrée prête.
    const sansRd = (await getGameView(await createSoloGame(userId, "quarter", 3, 4, false, "conseil"), userId))!;
    expect(sansRd.gamme!.find((p) => p.code === "cyber")!.rd ?? null).toBeNull();
    expect(sansRd.rdOffer).toBeNull();
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 5, false, "conseil"), userId))!;
    expect(gamme.gamme?.map((p) => p.code)).toEqual(["audit", "transformation", "cyber"]);
    expect(gamme.scenarioCode).toBe("conseil-gamme");
    expect(gamme.gamme!.find((p) => p.code === "cyber")!.rd?.development?.available).toBe(false);
    expect(gamme.rdOffer).not.toBeNull();
    expect(gamme.communicationOffer).not.toBeNull();
  });

  it("LA TABLE D'AUGUSTIN au niveau 3 est un ticket moyen, au niveau 4 les quatre offres, au niveau 5 le traiteur à bâtir", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 3, false, "bistrot"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.scenarioCode).toBe("bistrot");
    // Niveau 4 : la gamme, sans la R&D (ouverte au niveau 5) ; la référence est livrée prête.
    const sansRd = (await getGameView(await createSoloGame(userId, "quarter", 3, 4, false, "bistrot"), userId))!;
    expect(sansRd.gamme!.find((p) => p.code === "traiteur")!.rd ?? null).toBeNull();
    expect(sansRd.rdOffer).toBeNull();
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 5, false, "bistrot"), userId))!;
    expect(gamme.gamme?.map((p) => p.code)).toEqual(["formule-midi", "carte-soir", "banquets", "traiteur"]);
    expect(gamme.scenarioCode).toBe("bistrot-gamme");
    expect(gamme.gamme!.find((p) => p.code === "traiteur")!.rd?.development?.available).toBe(false);
    expect(gamme.rdOffer).not.toBeNull();
    expect(gamme.communicationOffer).not.toBeNull();
  });

  it("PIXEL & CO au niveau 3 est une commande à panier moyen, au niveau 4 les quatre rayons, au niveau 5 la capsule à bâtir", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 3, false, "ecommerce"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.scenarioCode).toBe("ecommerce");
    // Niveau 4 : la gamme, sans la R&D (ouverte au niveau 5) ; la référence est livrée prête.
    const sansRd = (await getGameView(await createSoloGame(userId, "quarter", 3, 4, false, "ecommerce"), userId))!;
    expect(sansRd.gamme!.find((p) => p.code === "capsule")!.rd ?? null).toBeNull();
    expect(sansRd.rdOffer).toBeNull();
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 5, false, "ecommerce"), userId))!;
    expect(gamme.gamme?.map((p) => p.code)).toEqual(["decoration", "mobilier", "luminaires", "capsule"]);
    expect(gamme.scenarioCode).toBe("ecommerce-gamme");
    expect(gamme.gamme!.find((p) => p.code === "capsule")!.rd?.development?.available).toBe(false);
    expect(gamme.rdOffer).not.toBeNull();
    expect(gamme.communicationOffer).not.toBeNull();
  });

  it("MAILLE & CO au niveau 1 est un article, au niveau 3 la gamme de cinq références", async () => {
    const mono = (await getGameView(await createSoloGame(userId, "quarter", 3, 1, false, "boutique"), userId))!;
    expect(mono.gamme).toBeNull();
    expect(mono.vocabulary.unit).toBe("article");
    expect(mono.scenarioCode).toBe("boutique-mono");
    const gamme = (await getGameView(await createSoloGame(userId, "quarter", 3, 3, false, "boutique"), userId))!;
    expect(gamme.gamme?.length).toBe(5);
    expect(gamme.scenarioCode).toBe("boutique");
  });
});
