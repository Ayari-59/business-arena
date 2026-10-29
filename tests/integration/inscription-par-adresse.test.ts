import { describe, expect, it, vi } from "vitest";

/**
 * L'INSCRIPTION ENSEIGNANT EST PLAFONNÉE PAR ADRESSE D'ORIGINE (audit, P2-4).
 *
 * Chaque inscription envoie un lien de confirmation à l'adresse saisie : sans limite, un
 * script créait des comptes au nom d'autant de tiers qu'il voulait, et leur faisait écrire.
 * Une adresse est déjà limitée à un compte (et à un lien toutes les quelques minutes) ;
 * l'adresse d'origine l'est maintenant aussi, comme la garde des codes.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

const magasin = new Map<string, string>();
let ip = "203.0.113.90";
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nom: string) => (magasin.has(nom) ? { value: magasin.get(nom) } : undefined),
    set: (nom: string, valeur: string) => magasin.set(nom, valeur),
    delete: (nom: string) => magasin.delete(nom),
  }),
  headers: async () => new Headers({ "x-real-ip": ip }),
}));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("REDIRECT");
  },
}));
vi.mock("@/lib/courriel", () => ({ envoyerCourriel: async () => ({ envoye: false, raison: "sans_cle" }) }));

const { registerAction } = await import("@/app/teacher/actions");
const { MAX_INSCRIPTIONS_PAR_ADRESSE } = await import("@/config/reprise");

const formulaire = (i: number) => {
  const f = new FormData();
  f.set("email", `inscrit-${i}@exemple.fr`);
  f.set("password", "motdepasse-assez-long");
  f.set("displayName", "Prof");
  return f;
};

async function inscrire(i: number): Promise<string> {
  try {
    const r = await registerAction({ error: null } as never, formulaire(i));
    return r?.error ?? "ok";
  } catch (e) {
    return (e as Error).message === "REDIRECT" ? "ok" : String(e);
  }
}

describe("inscription enseignant", () => {
  it("au-delà du plafond, une même adresse d'origine est refusée ; une autre ne l'est pas", async () => {
    expect(MAX_INSCRIPTIONS_PAR_ADRESSE).toBe(5);
    for (let i = 0; i < MAX_INSCRIPTIONS_PAR_ADRESSE; i++) expect(await inscrire(i), `inscription ${i}`).toBe("ok");
    expect(await inscrire(99)).toMatch(/Trop de tentatives/);
    ip = "203.0.113.91";
    expect(await inscrire(100)).toBe("ok");
  });
});
