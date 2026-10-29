import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LES CODES SAISIS ET LES COMPTES INVITÉS (audit, P2-2 et P2-3).
 *
 * - P2-2 : les codes de partie, de classe et de cohorte n'avaient aucune limite de
 *   débit : un script pouvait les essayer tous. Chaque code inconnu compte
 *   désormais un échec pour l'adresse (`lib/garde-des-codes.ts`), et au-delà du
 *   plafond le code n'est même plus cherché.
 * - P2-3 : rejoindre une classe du cours ou une cohorte créait le compte invité
 *   AVANT de vérifier le code : une ligne `users` par requête sans cookie, sans
 *   limite. Le code se vérifie d'abord.
 */

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

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
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const invite = { getOrCreateGuestUserId: vi.fn(async () => "invite-cree"), getGuestUserId: vi.fn(async () => null) };
vi.mock("@/lib/guest", () => ({
  getOrCreateGuestUserId: () => invite.getOrCreateGuestUserId(),
  getGuestUserId: () => invite.getGuestUserId(),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

const garde = { refus: null as string | null, echec: vi.fn(async () => undefined), succes: vi.fn(async () => undefined) };
vi.mock("@/lib/garde-des-codes", () => ({ gardeDesCodes: async () => garde }));

vi.mock("@/services/cours.service", () => ({
  classeParCode: vi.fn(async () => null),
  rejoindreClasse: vi.fn(async () => ({ ok: true, nom: "Classe" })),
  enregistrerProgression: vi.fn(),
  quitterClasse: vi.fn(),
}));
vi.mock("@/services/cohortes.service", () => ({
  cohorteParCode: vi.fn(async () => null),
  rejoindreCohorte: vi.fn(async () => ({ ok: true, nom: "Cohorte" })),
  codeDeRepriseDuProfil: vi.fn(),
  quitterCohorte: vi.fn(),
  reprendreProfil: vi.fn(),
}));
vi.mock("@/services/game.service", () => ({
  CODE_DE_PARTIE_INCONNU: "inconnu",
  refusDeRejoindre: vi.fn(async () => "inconnu"),
  joinGameByCode: vi.fn(),
}));
vi.mock("@/services/rejoindre.service", () => ({ ouRejoindre: vi.fn(async () => null) }));

const { rejoindreClasseAction } = await import("@/app/cours/actions");
const { rejoindreCohorteAction, obtenirCodeDeRepriseAction, choisirObjectifAction } = await import(
  "@/app/entreprises/episode/actions"
);
const { joinGameAction } = await import("@/app/join/actions");

async function redirectionDe(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (e instanceof Redirection) return e.vers;
    throw e;
  }
  throw new Error("aucune redirection");
}

const formulaire = (champs: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  invite.getOrCreateGuestUserId.mockClear();
  garde.echec.mockClear();
  garde.refus = null;
});

describe("un code inconnu ne crée aucun compte invité et compte un échec", () => {
  it("classe du cours", async () => {
    const vers = await redirectionDe(rejoindreClasseAction(formulaire({ code: "ZZZZZZ", nom: "Léa" })));
    expect(vers).toContain("refus=inconnu");
    expect(invite.getOrCreateGuestUserId).not.toHaveBeenCalled();
    expect(garde.echec).toHaveBeenCalledTimes(1);
  });

  it("cohorte d'épisodes", async () => {
    const vers = await redirectionDe(rejoindreCohorteAction("ZZZZZZ"));
    expect(vers).toContain("inconnu=1");
    expect(invite.getOrCreateGuestUserId).not.toHaveBeenCalled();
    expect(garde.echec).toHaveBeenCalledTimes(1);
  });

  it("partie de classe", async () => {
    const r = await joinGameAction({ error: null }, formulaire({ code: "ZZZZZZ", pseudo: "Léa" }));
    expect(r.error).toBeTruthy();
    expect(invite.getOrCreateGuestUserId).not.toHaveBeenCalled();
    expect(garde.echec).toHaveBeenCalledTimes(1);
  });

  it("au-delà du plafond, le code n'est même plus cherché", async () => {
    garde.refus = "Trop de tentatives, réessayez dans 15 minutes.";
    const r = await joinGameAction({ error: null }, formulaire({ code: "ABCDEF", pseudo: "Léa" }));
    expect(r.error).toBe(garde.refus);
    const { refusDeRejoindre } = await import("@/services/game.service");
    expect(vi.mocked(refusDeRejoindre)).not.toHaveBeenCalledWith("ABCDEF");
  });

  it("sans identité, ni code de reprise ni objectif effacé ne créent de compte", async () => {
    await redirectionDe(obtenirCodeDeRepriseAction());
    await redirectionDe(choisirObjectifAction(formulaire({ objectif: "" })));
    expect(invite.getOrCreateGuestUserId).not.toHaveBeenCalled();
  });
});

describe("la porte unique des parties d'établissement compte aussi les échecs", () => {
  it("le code inconnu y est compté", () => {
    const source = readFileSync("src/app/etablissement/parties/actions.ts", "utf8");
    expect(source).toMatch(/gardeDesCodes\(\)/);
    expect(source).toMatch(/await garde\.echec\(\);\s*redirect\(`\/etablissement\/parties\?code=inconnu#code`\)/);
  });
});
