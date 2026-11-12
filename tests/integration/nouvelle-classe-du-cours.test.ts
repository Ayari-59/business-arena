import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA CRÉATION D'UNE CLASSE DU COURS, CÔTÉ SERVEUR (audit UX du 11 novembre 2026, P2-6). Le formulaire
 * de /teacher/cours rechargeait la page sur un refus, la saisie perdue, et ne disait qu'une erreur à la
 * fois. L'action dit désormais toutes les erreurs d'un coup, chacune pour son champ, et rend la saisie
 * pour que le formulaire la remette (components/nouvelle-classe-du-cours.tsx) ; réussie, elle mène à
 * la page de la classe. Sous l'offre Classe, un autre parcours que celui de la licence est refusé, avec
 * sa raison.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
  notFound: () => {
    throw new Error("__notFound__");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn(), setSession: vi.fn(), clearSession: vi.fn() }));

import { getSession } from "@/lib/session";
import { creerClasseAction, type EtatDeLaNouvelleClasse } from "@/app/teacher/cours/actions";
import { etablissementSousLicence } from "./helpers/licence";

const VIDE: EtatDeLaNouvelleClasse = { erreurs: {}, valeurs: null };
const formulaire = (champs: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) f.set(k, v);
  return f;
};
const connecte = (userId: string) => vi.mocked(getSession).mockResolvedValue({ userId, role: "teacher" } as never);
/** L'adresse vers laquelle l'action redirige, ou rien. */
async function redirection(p: Promise<unknown>): Promise<string | null> {
  try {
    await p;
    return null;
  } catch (e) {
    const m = /^__redirect__(.*)$/.exec((e as Error).message);
    if (!m) throw e;
    return m[1]!;
  }
}

let sousClasse: string;

beforeAll(async () => {
  sousClasse = (await etablissementSousLicence("Classe seule", { arene: "classe", entreprises: ["hotel"], niveaux: [2] })).userId;
});

describe("créer une classe du cours", () => {
  it("sans nom ni parcours : les deux erreurs d'un coup, et la saisie rendue", async () => {
    connecte(sousClasse);
    const etat = await creerClasseAction(VIDE, formulaire({ nom: "  ", parcours: "", entreprise: "hotel", liberation: "chapitre" }));
    expect(etat.erreurs.nom).toMatch(/Donnez un nom à la classe/);
    expect(etat.erreurs.parcours).toMatch(/Choisissez le parcours du cours de la classe dans la liste/);
    expect(etat.valeurs).toEqual({ nom: "  ", parcours: "", entreprise: "hotel", liberation: "chapitre" });
  });

  it("un nom sans parcours : l'erreur du parcours seule, le nom gardé", async () => {
    connecte(sousClasse);
    const etat = await creerClasseAction(VIDE, formulaire({ nom: "BTS CG 1", parcours: "" }));
    expect(etat.erreurs).toEqual({ parcours: expect.stringMatching(/Choisissez le parcours/) });
    expect(etat.valeurs?.nom).toBe("BTS CG 1");
    expect(etat.valeurs?.liberation).toBe("tout");
  });

  it("réussie, elle mène à la page de la classe ; sous Classe, un second parcours est refusé, avec la raison", async () => {
    connecte(sousClasse);
    const vers = await redirection(creerClasseAction(VIDE, formulaire({ nom: "BTS CG 1", parcours: "bts-cg" })));
    expect(vers).toMatch(/^\/teacher\/cours\/[0-9a-f-]{36}\?creee=1$/);
    const refus = await creerClasseAction(VIDE, formulaire({ nom: "BTS CG 2", parcours: "comptabilite-generale" }));
    expect(refus.erreurs.parcours).toMatch(/une nouvelle classe suit le parcours de vos autres classes/);
    expect(refus.valeurs?.parcours).toBe("comptabilite-generale");
    // Un parcours qui n'est pas de la liste.
    expect((await creerClasseAction(VIDE, formulaire({ nom: "X", parcours: "inconnu" }))).erreurs.parcours).toMatch(/parcours/);
  });
});
