import { beforeAll, describe, expect, it, vi } from "vitest";

/** L'objectif choisi est gardé avec le profil, et se rend au profil sur demande. */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { choisirObjectif, objectifDe } from "@/services/episode-objectifs.service";

let lea: string;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ email: "lea@objectifs.test", displayName: "Léa" })
    .returning({ id: users.id });
  lea = u!.id;
});

describe("l'objectif du manager", () => {
  it("n'existe pas tant qu'on ne l'a pas choisi", async () => {
    expect(await objectifDe(lea)).toBeNull();
  });

  it("se choisit, se change, et se rend au profil", async () => {
    expect(await choisirObjectif(lea, "R9")).toBe("R9");
    expect(await objectifDe(lea)).toBe("R9");
    expect(await choisirObjectif(lea, "R2")).toBe("R2");
    expect(await objectifDe(lea)).toBe("R2");
    expect(await choisirObjectif(lea, null)).toBeNull();
    expect(await objectifDe(lea)).toBeNull();
  });

  it("refuse ce qui ne se choisit pas, et efface plutôt que de garder une valeur fausse", async () => {
    await choisirObjectif(lea, "R5");
    expect(await choisirObjectif(lea, "R7")).toBeNull();
    expect(await objectifDe(lea)).toBeNull();
    expect(await choisirObjectif(lea, "<script>")).toBeNull();
  });
});
