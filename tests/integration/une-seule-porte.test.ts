import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * UNE PORTE POUR TOUS LES CODES D'ÉLÈVE (audit d'octobre 2026).
 *
 * « Rejoindre une partie » est la seule entrée de la barre. Un code de classe du
 * cours ou de cohorte d'épisodes y recevait « Code de partie inconnu » : l'élève
 * restait bloqué. `ouRejoindre` reconnaît ces codes et donne la page qui les
 * prend ; un code qui n'est rien n'en donne aucune.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { creerClasse } from "@/services/cours.service";
import { creerCohorte } from "@/services/cohortes.service";
import { ouRejoindre } from "@/services/rejoindre.service";

let classe: { id: string; code: string };
let cohorte: { code: string };

beforeAll(async () => {
  const [u] = await db.insert(users).values({ email: `${randomUUID()}@test.local`, displayName: "x" }).returning({ id: users.id });
  classe = (await creerClasse({ enseignantId: u!.id, nom: "BTS CG 1 · porte", entreprise: null }))!;
  cohorte = await creerCohorte("Cohorte de la porte");
});

describe("une seule porte", () => {
  it("un code de classe du cours mène à la classe, même tapé en minuscules", async () => {
    expect(await ouRejoindre(classe.code)).toBe(`/cours/rejoindre?code=${encodeURIComponent(classe.code)}`);
    expect(await ouRejoindre(`  ${classe.code.toLowerCase()} `)).toBe(`/cours/rejoindre?code=${encodeURIComponent(classe.code)}`);
  });

  it("un code de cohorte d'épisodes mène à la cohorte", async () => {
    expect(await ouRejoindre(cohorte.code)).toBe(`/entreprises/episode/rejoindre?code=${encodeURIComponent(cohorte.code)}`);
  });

  it("un code qui n'est rien ne mène nulle part", async () => {
    expect(await ouRejoindre("ZZZZZZ")).toBeNull();
    expect(await ouRejoindre("")).toBeNull();
  });
});
