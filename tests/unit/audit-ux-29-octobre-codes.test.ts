import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LES CODES D'ÉLÈVE APRÈS L'AUDIT UX DU 29 OCTOBRE 2026 (audit-ux/rapport.md).
 *
 *  · P1-3 : le prénom tapé sur /join suit un code de classe jusqu'à /cours/rejoindre, et
 *    revient dans son champ après un refus ; le code et le prénom reviennent sur /join ;
 *  · P1-4 : un code bloqué par la garde des codes (trop d'essais depuis l'adresse) dit
 *    « trop d'essais » et l'attente, pas « ce code ne mène à aucune classe » ;
 *  · P2-8 : /join, qui prend tous les codes, ne parle plus de « code de partie ».
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
vi.mock("@/lib/guest", () => ({
  getOrCreateGuestUserId: vi.fn(async () => "invite"),
  getGuestUserId: vi.fn(async () => null),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

const garde = { refus: null as string | null, echec: vi.fn(async () => undefined), succes: vi.fn(async () => undefined) };
vi.mock("@/lib/garde-des-codes", async (original) => ({
  ...(await original<typeof import("@/lib/garde-des-codes")>()),
  gardeDesCodes: async () => garde,
}));

const classe = { trouvee: false };
vi.mock("@/services/cours.service", () => ({
  classeParCode: vi.fn(async () => (classe.trouvee ? { code: "BTS1-7K3P", nom: "BTS 1" } : null)),
  rejoindreClasse: vi.fn(async () => ({ ok: false, refus: "pleine" })),
  enregistrerProgression: vi.fn(),
  quitterClasse: vi.fn(),
}));
vi.mock("@/services/game.service", () => ({
  CODE_DE_PARTIE_INCONNU: "Code de partie inconnu.",
  refusDeRejoindre: vi.fn(async () => "Code de partie inconnu."),
  joinGameByCode: vi.fn(),
}));
const ailleurs = { vers: null as string | null };
vi.mock("@/services/rejoindre.service", () => ({ ouRejoindre: vi.fn(async () => ailleurs.vers) }));

const { joinGameAction } = await import("@/app/join/actions");
const { rejoindreClasseAction } = await import("@/app/cours/actions");
const { CODE_INCONNU_PARTOUT, refusTropDEssais } = await import("@/lib/code-de-partie");

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
  garde.refus = null;
  classe.trouvee = false;
  ailleurs.vers = null;
});

describe("P1-3 · le prénom n'est pas redemandé", () => {
  it("un code de classe tapé sur /join emporte le prénom jusqu'à /cours/rejoindre", async () => {
    ailleurs.vers = "/cours/rejoindre?code=BTS1-7K3P";
    const vers = await redirectionDe(joinGameAction({ error: null }, formulaire({ code: "BTS1-7K3P", pseudo: "Léa" })));
    expect(vers).toBe("/cours/rejoindre?code=BTS1-7K3P&nom=L%C3%A9a");
  });

  it("un autre code (cohorte, concours) part sans prénom : sa page n'en demande pas", async () => {
    ailleurs.vers = "/compete?code=ABCDEF";
    const vers = await redirectionDe(joinGameAction({ error: null }, formulaire({ code: "ABCDEF", pseudo: "Léa" })));
    expect(vers).toBe("/compete?code=ABCDEF");
  });

  it("après un refus sur /join, le code et le prénom reviennent", async () => {
    const r = await joinGameAction({ error: null }, formulaire({ code: "ZZZZZZ", pseudo: "Léa" }));
    expect(r.values).toEqual({ code: "ZZZZZZ", pseudo: "Léa" });
  });

  it("après un refus de la classe, le prénom revient dans l'adresse", async () => {
    classe.trouvee = true;
    const vers = await redirectionDe(rejoindreClasseAction(formulaire({ code: "BTS1-7K3P", nom: "Léa" })));
    expect(vers).toContain("refus=pleine");
    expect(vers).toContain("&nom=L%C3%A9a");
  });
});

describe("P1-4 · trop d'essais depuis l'adresse", () => {
  it("un code juste, bloqué par la garde, dit « trop d'essais » et l'attente", async () => {
    classe.trouvee = true;
    garde.refus = "Trop de tentatives, réessayez dans 12 minutes.";
    const vers = await redirectionDe(rejoindreClasseAction(formulaire({ code: "BTS1-7K3P", nom: "Léa" })));
    expect(vers).toContain("refus=trop");
    expect(vers).toContain("attente=12");
    expect(vers).not.toContain("refus=inconnu");
  });

  it("la phrase dit l'attente, et que même un code juste attend", () => {
    expect(refusTropDEssais("12")).toMatch(/Réessayez dans 12 minutes/);
    expect(refusTropDEssais("12")).toMatch(/même un code juste/);
    expect(refusTropDEssais("1")).toMatch(/dans 1 minute ;/);
    // Une attente illisible ou absurde dans l'adresse ne s'affiche pas telle quelle.
    expect(refusTropDEssais("<script>")).toMatch(/dans 15 minutes/);
    expect(refusTropDEssais("9999")).toMatch(/dans 60 minutes/);
  });
});

describe("P2-8 · /join prend tous les codes, et son refus le dit", () => {
  it("un code qui n'ouvre rien ne parle pas de « code de partie »", async () => {
    const r = await joinGameAction({ error: null }, formulaire({ code: "ZZZZZZ", pseudo: "Léa" }));
    expect(r.error).toBe(CODE_INCONNU_PARTOUT);
    expect(r.error).not.toMatch(/Code de partie inconnu/);
    expect(r.error).toMatch(/partie, classe, cohorte, concours ni examen/);
  });
});
