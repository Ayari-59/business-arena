import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * UN CODE JUSTE PASSE TOUJOURS (lib/garde-des-codes.ts).
 *
 * Toute une classe sort par la même adresse IP. Au-delà de `MAX_CODES_FAUX_PAR_ADRESSE`
 * codes faux en quinze minutes, la porte se fermait pour TOUT le monde, y compris l'élève
 * qui tapait le bon code. La règle retenue : le code est cherché d'abord ; juste, il passe ;
 * faux, il compte toujours, et au-delà du plafond il est ralenti puis refusé avec l'attente.
 * Sur la base embarquée, avec les vraies migrations et la vraie garde.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

const magasin = new Map<string, string>();
const IP = "203.0.113.7";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": IP }),
  cookies: async () => ({
    get: (nom: string) => (magasin.has(nom) ? { name: nom, value: magasin.get(nom) } : undefined),
    set: (nom: string, valeur: string) => magasin.set(nom, valeur),
    delete: (nom: string) => magasin.delete(nom),
  }),
}));

class Redirection extends Error {
  constructor(readonly vers: string) {
    super(`redirection ${vers}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (vers: string) => {
    throw new Redirection(vers);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const { and, eq } = await import("drizzle-orm");
const { db } = await import("@/db");
const { loginAttempts } = await import("@/db/schema");
const { registerTeacher } = await import("@/services/auth.service");
const { createClassGame } = await import("@/services/game.service");
const { etablissementDeLEnseignantSousLicence } = await import("./helpers/licence");
const { MAX_CODES_FAUX_PAR_ADRESSE } = await import("@/config/reprise");
const { MARQUEUR_CODES_SAISIS } = await import("@/lib/garde-des-codes");
const { joinGameAction } = await import("@/app/join/actions");

let joinCode: string;

const formulaire = (champs: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) fd.set(k, v);
  return fd;
};

async function rejoindre(code: string, pseudo = "Léa"): Promise<{ error: string | null } | { vers: string }> {
  try {
    return await joinGameAction({ error: null }, formulaire({ code, pseudo }));
  } catch (e) {
    if (e instanceof Redirection) return { vers: e.vers };
    throw e;
  }
}

const echecsDeLAdresse = async () =>
  (
    await db
      .select()
      .from(loginAttempts)
      .where(and(eq(loginAttempts.email, MARQUEUR_CODES_SAISIS), eq(loginAttempts.ip, IP)))
  ).length;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "codes-justes@lycee.test",
    password: "motdepasse!",
    displayName: "M. Codes",
    schoolName: "Lycée de la Porte",
  });
  if ("error" in r) throw new Error(r.error);
  const partie = await createClassGame({
    teacherId: r.userId,
    organizationId: await etablissementDeLEnseignantSousLicence(r.userId),
    periodicity: "quarter",
    humanTeamsCount: 4,
    botCount: 0,
    seed: 11,
  });
  joinCode = partie.joinCode;
});

beforeEach(async () => {
  magasin.clear();
  await db.delete(loginAttempts).where(eq(loginAttempts.email, MARQUEUR_CODES_SAISIS));
  // Toute la classe s'est déjà trompée : le plafond de l'adresse est atteint.
  await db
    .insert(loginAttempts)
    .values(Array.from({ length: MAX_CODES_FAUX_PAR_ADRESSE }, () => ({ email: MARQUEUR_CODES_SAISIS, ip: IP })));
});

describe("au-delà du plafond de l'adresse", () => {
  it("un code JUSTE entre quand même dans la partie", async () => {
    const r = await rejoindre(joinCode);
    expect(r).toEqual({ vers: expect.stringMatching(/^\/arena\//) });
  });

  it("un code FAUX est encore compté, ralenti, et refusé avec l'attente", async () => {
    const t0 = Date.now();
    const r = await rejoindre("ZZZZZZ");
    expect("error" in r && r.error).toMatch(/Trop de tentatives, réessayez dans \d+ minute/);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(1_900);
    expect(await echecsDeLAdresse()).toBe(MAX_CODES_FAUX_PAR_ADRESSE + 1);
  });

  it("le code juste ne remet pas le compteur à zéro", async () => {
    await rejoindre(joinCode);
    expect(await echecsDeLAdresse()).toBe(MAX_CODES_FAUX_PAR_ADRESSE);
  });
});

describe("sous le plafond", () => {
  it("un code faux dit « inconnu », sans attendre, et compte", async () => {
    await db.delete(loginAttempts).where(eq(loginAttempts.email, MARQUEUR_CODES_SAISIS));
    const t0 = Date.now();
    const r = await rejoindre("ZZZZZZ");
    expect("error" in r && r.error).not.toMatch(/Trop de tentatives/);
    expect(Date.now() - t0).toBeLessThan(1_500);
    expect(await echecsDeLAdresse()).toBe(1);
  });
});
