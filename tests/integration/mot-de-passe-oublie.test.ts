import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LE MOT DE PASSE OUBLIÉ DES ENSEIGNANTS (migration 0054,
 * services/mot-de-passe-oublie.service.ts), sur la base embarquée avec les vraies migrations.
 *
 *  · la demande répond toujours la même chose, compte existant ou non, compte RENATER/LTI ;
 *  · le jeton est aléatoire, gardé haché, valable une heure, à usage unique ;
 *  · la réinitialisation impose la règle de l'inscription, et ferme les autres sessions ;
 *  · plafonds par adresse IP et par destinataire ;
 *  · purge des jetons expirés, effacement avec le compte.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

const magasin = new Map<string, string>();
let ip = "198.51.100.1";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": ip }),
  cookies: async () => ({
    get: (nom: string) => (magasin.has(nom) ? { name: nom, value: magasin.get(nom) } : undefined),
    set: (nom: string, valeur: string) => magasin.set(nom, valeur),
    delete: (nom: string) => magasin.delete(nom),
  }),
}));
// `after` : le travail part tout de suite et l'on peut l'attendre.
const differes: Promise<unknown>[] = [];
vi.mock("next/server", () => ({ after: (f: () => Promise<unknown>) => differes.push(f()) }));
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

const envoyes: { a: string; texte: string }[] = [];
vi.mock("@/lib/courriel", () => ({
  envoyerCourriel: async (c: { a: string; texte: string }) => {
    envoyes.push(c);
    return { envoye: true };
  },
}));

const { eq } = await import("drizzle-orm");
const { db } = await import("@/db");
const { jetonsDeReinitialisation, users } = await import("@/db/schema");
const { loginTeacher, registerTeacher } = await import("@/services/auth.service");
const svc = await import("@/services/mot-de-passe-oublie.service");
const { DUREE_DU_JETON_DE_REINITIALISATION_MS, MAX_DEMANDES_DE_REINITIALISATION_PAR_ADRESSE, REPONSE_A_LA_DEMANDE } =
  await import("@/config/mot-de-passe-oublie");
const { PLAFOND_PAR_DESTINATAIRE_PAR_JOUR } = await import("@/config/plafonds-des-formulaires");
const { setSession, getSession } = await import("@/lib/session");
const { purger } = await import("@/services/purge.service");
const { supprimerCompteEnseignant } = await import("@/services/effacement.service");
const { demanderUneReinitialisationAction, reinitialiserLeMotDePasseAction } = await import(
  "@/app/teacher/mot-de-passe-oublie/actions"
);

const ANCIEN = "ancien-mot-de-passe";
let n = 0;
async function prof(): Promise<{ userId: string; email: string }> {
  n += 1;
  const email = `oubli-${n}@lycee.test`;
  const r = await registerTeacher({ email, password: ANCIEN, displayName: "Prof", schoolName: "Lycée" });
  if ("error" in r) throw new Error(r.error);
  return { userId: r.userId, email };
}

const jetonDuDernierCourriel = () => {
  const m = /reinitialiser\?jeton=([A-Za-z0-9_-]+)/.exec(envoyes.at(-1)?.texte ?? "");
  if (!m) throw new Error("aucun lien dans le courriel");
  return decodeURIComponent(m[1]!);
};

const formulaire = (champs: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  envoyes.length = 0;
  differes.length = 0;
  magasin.clear();
});

describe("la demande", () => {
  it("répond le même message pour un compte existant, inconnu ou sans mot de passe (RENATER)", async () => {
    const p = await prof();
    await db.insert(users).values({ email: "renater@univ.test", displayName: "Fédéré", provenance: "renater" });
    const reponses = [];
    for (const email of [p.email, "personne@lycee.test", "renater@univ.test"]) {
      ip = `198.51.100.${10 + reponses.length}`;
      reponses.push(await demanderUneReinitialisationAction({ message: null, error: null }, formulaire({ email })));
    }
    await Promise.all(differes);
    for (const r of reponses) expect(r).toEqual({ message: REPONSE_A_LA_DEMANDE, error: null });
    // Un seul courriel : au compte qui a un mot de passe.
    expect(envoyes.map((e) => e.a)).toEqual([p.email]);
  });

  it("le jeton est gardé haché, jamais en clair", async () => {
    const p = await prof();
    expect(await svc.demanderUneReinitialisation({ email: p.email })).toEqual({ etat: "envoye" });
    const jeton = jetonDuDernierCourriel();
    const lignes = await db.select().from(jetonsDeReinitialisation).where(eq(jetonsDeReinitialisation.userId, p.userId));
    expect(lignes).toHaveLength(1);
    expect(lignes[0]!.empreinte).not.toContain(jeton);
    expect(lignes[0]!.empreinte).toMatch(/^[0-9a-f]{64}$/);
    expect(lignes[0]!.expireLe.getTime() - lignes[0]!.createdAt.getTime()).toBe(DUREE_DU_JETON_DE_REINITIALISATION_MS);
  });

  it("plafond par adresse IP : au-delà, la demande est refusée sans rien envoyer", async () => {
    ip = "198.51.100.99";
    const p = await prof();
    for (let i = 0; i < MAX_DEMANDES_DE_REINITIALISATION_PAR_ADRESSE; i++) {
      await demanderUneReinitialisationAction({ message: null, error: null }, formulaire({ email: `x${i}@lycee.test` }));
    }
    const r = await demanderUneReinitialisationAction({ message: null, error: null }, formulaire({ email: p.email }));
    await Promise.all(differes);
    expect(r.error).toMatch(/Trop de tentatives/);
    expect(envoyes).toHaveLength(0);
  });

  it("plafond par destinataire : au-delà, plus aucun courriel, en silence", async () => {
    const p = await prof();
    for (let i = 0; i < PLAFOND_PAR_DESTINATAIRE_PAR_JOUR; i++) {
      expect((await svc.demanderUneReinitialisation({ email: p.email })).etat).toBe("envoye");
    }
    expect(await svc.demanderUneReinitialisation({ email: p.email })).toEqual({ etat: "plafond" });
    expect(envoyes).toHaveLength(PLAFOND_PAR_DESTINATAIRE_PAR_JOUR);
  });
});

describe("la réinitialisation", () => {
  it("impose la règle des mots de passe sans consommer le lien, puis change le mot de passe une seule fois", async () => {
    const p = await prof();
    await svc.demanderUneReinitialisation({ email: p.email });
    const jeton = jetonDuDernierCourriel();
    expect(await svc.jetonUtilisable(jeton)).toBe(true);

    const court = await svc.reinitialiserLeMotDePasse({ jeton, motDePasse: "court" });
    expect(court).toMatchObject({ ok: false, champ: "password" });
    expect(await svc.jetonUtilisable(jeton)).toBe(true);

    const r = await svc.reinitialiserLeMotDePasse({ jeton, motDePasse: "nouveau-mot-de-passe" });
    expect(r).toEqual({ ok: true, userId: p.userId });
    expect(await loginTeacher({ email: p.email, password: "nouveau-mot-de-passe" })).toHaveProperty("userId");
    expect(await loginTeacher({ email: p.email, password: ANCIEN })).toHaveProperty("error");

    // Usage unique.
    expect(await svc.jetonUtilisable(jeton)).toBe(false);
    expect(await svc.reinitialiserLeMotDePasse({ jeton, motDePasse: "encore-un-autre" })).toEqual({
      ok: false,
      erreur: svc.LIEN_INVALIDE,
    });
  });

  it("refuse un lien expiré, et un jeton inventé", async () => {
    const p = await prof();
    await svc.demanderUneReinitialisation({ email: p.email });
    const jeton = jetonDuDernierCourriel();
    const plusTard = new Date(Date.now() + DUREE_DU_JETON_DE_REINITIALISATION_MS + 1000);
    expect(await svc.jetonUtilisable(jeton, plusTard)).toBe(false);
    expect((await svc.reinitialiserLeMotDePasse({ jeton, motDePasse: "nouveau-mot", maintenant: plusTard })).ok).toBe(false);
    expect((await svc.reinitialiserLeMotDePasse({ jeton: "A".repeat(43), motDePasse: "nouveau-mot" })).ok).toBe(false);
  });

  it("ferme les sessions existantes et invalide les autres liens du compte", async () => {
    const p = await prof();
    const avant = (await db.select().from(users).where(eq(users.id, p.userId)))[0]!;
    await setSession(p.userId, "teacher", avant.sessionVersion);
    expect(await getSession()).not.toBeNull();

    await svc.demanderUneReinitialisation({ email: p.email });
    const premier = jetonDuDernierCourriel();
    await svc.demanderUneReinitialisation({ email: p.email });
    const second = jetonDuDernierCourriel();

    const fin = await reinitialiserLeMotDePasseAction(
      { error: null },
      formulaire({ jeton: second, password: "nouveau-mot-de-passe", confirmation: "nouveau-mot-de-passe" }),
    ).catch((e: unknown) => e);
    expect(fin).toBeInstanceOf(Redirection);
    expect((fin as Redirection).vers).toBe("/teacher/login?reinitialise=1");

    expect(await getSession()).toBeNull();
    expect(await svc.jetonUtilisable(premier)).toBe(false);
  });

  it("refuse deux mots de passe différents", async () => {
    const r = await reinitialiserLeMotDePasseAction(
      { error: null },
      formulaire({ jeton: "x", password: "nouveau-mot-de-passe", confirmation: "autre-chose" }),
    );
    expect(r.champ).toBe("confirmation");
  });
});

describe("RGPD", () => {
  it("la purge retire les jetons expirés et garde les autres", async () => {
    const p = await prof();
    await svc.demanderUneReinitialisation({ email: p.email, maintenant: new Date(Date.now() - 2 * 60 * 60 * 1000) });
    await svc.demanderUneReinitialisation({ email: p.email });
    const bilan = await purger({ envoyer: async () => ({ envoye: true }) });
    expect(bilan.jetonsDeReinitialisation).toBeGreaterThanOrEqual(1);
    const restants = await db.select().from(jetonsDeReinitialisation).where(eq(jetonsDeReinitialisation.userId, p.userId));
    expect(restants).toHaveLength(1);
  });

  it("supprimer le compte emporte ses jetons", async () => {
    const p = await prof();
    await svc.demanderUneReinitialisation({ email: p.email });
    const jeton = jetonDuDernierCourriel();
    expect((await supprimerCompteEnseignant(p.userId)).ok).toBe(true);
    expect(await db.select().from(jetonsDeReinitialisation).where(eq(jetonsDeReinitialisation.userId, p.userId))).toHaveLength(0);
    expect(await svc.jetonUtilisable(jeton)).toBe(false);
  });
});
