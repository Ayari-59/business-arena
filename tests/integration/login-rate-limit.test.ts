import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LA CONNEXION ENSEIGNANT SE DÉFEND.
 *
 * Constaté (audit croisé §07) : aucune limitation de tentatives, aucune
 * révocation de session. Ici, sur une base réelle (pglite, migrations
 * réelles) : cinq échecs par e-mail ou par adresse sur quinze minutes
 * bloquent le sixième essai, une connexion réussie purge le compteur, et
 * « Se déconnecter partout » rend refusé tout jeton antérieur.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

// Les cookies de la requête, simulés : un simple magasin par test.
const magasin = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nom: string) => (magasin.has(nom) ? { value: magasin.get(nom) } : undefined),
    set: (nom: string, valeur: string) => magasin.set(nom, valeur),
    delete: (nom: string) => magasin.delete(nom),
  }),
}));

const { FENETRE_TENTATIVES_MS, MAX_ECHECS, bumpSessionVersion, loginTeacher, registerTeacher } =
  await import("@/services/auth.service");
const { DUREE_SESSION_MS, encodeToken, getSession, setSession } = await import("@/lib/session");

let prof: string;
const EMAIL = "garde@lycee.test";
const MDP = "motdepasse!";

beforeAll(async () => {
  const r = await registerTeacher({
    email: EMAIL,
    password: MDP,
    displayName: "Mme Garde",
    schoolName: "Lycée de la Garde",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
});

describe("limitation des tentatives", () => {
  it("le même message pour un mot de passe faux, trop court, ou un e-mail inconnu", async () => {
    const t0 = Date.now();
    const faux = await loginTeacher({ email: EMAIL, password: "mauvais-mot", ip: "10.0.0.1", now: t0 });
    const court = await loginTeacher({ email: EMAIL, password: "abc", ip: "10.0.0.1", now: t0 });
    const inconnu = await loginTeacher({ email: "personne@lycee.test", password: MDP, ip: "10.0.0.1", now: t0 });
    expect(faux).toEqual({ error: "Identifiants incorrects." });
    expect(court).toEqual(faux);
    expect(inconnu).toEqual(faux);
  });

  it("au sixième échec, le compte est bloqué avec le délai restant, puis libéré après la fenêtre", async () => {
    const t0 = Date.now() + 60 * 60 * 1000; // une fenêtre plus tard : compteur propre
    for (let i = 0; i < MAX_ECHECS; i++) {
      const r = await loginTeacher({ email: EMAIL, password: "mauvais-mot", ip: "10.0.0.2", now: t0 + i * 1000 });
      expect(r).toEqual({ error: "Identifiants incorrects." });
    }
    const bloque = await loginTeacher({ email: EMAIL, password: MDP, ip: "10.0.0.2", now: t0 + 6000 });
    expect("error" in bloque && bloque.error).toMatch(/^Trop de tentatives, réessayez dans \d+ minutes?\.$/);
    expect("retryAfterMinutes" in bloque && bloque.retryAfterMinutes).toBe(15);

    // Le bon mot de passe ne passe pas non plus tant que la fenêtre court.
    const encore = await loginTeacher({ email: EMAIL, password: MDP, ip: "10.0.0.2", now: t0 + 5 * 60 * 1000 });
    expect("retryAfterMinutes" in encore && encore.retryAfterMinutes).toBe(10);

    // Fenêtre écoulée : la connexion réussit et purge le compteur.
    const apres = await loginTeacher({ email: EMAIL, password: MDP, ip: "10.0.0.2", now: t0 + FENETRE_TENTATIVES_MS + 1 });
    expect("userId" in apres && apres.userId).toBe(prof);
    const suivant = await loginTeacher({ email: EMAIL, password: "mauvais-mot", ip: "10.0.0.2", now: t0 + FENETRE_TENTATIVES_MS + 2 });
    expect(suivant).toEqual({ error: "Identifiants incorrects." });
  });

  it("l'adresse compte aussi : cinq échecs sur des e-mails différents bloquent l'adresse", async () => {
    const t0 = Date.now() + 3 * 60 * 60 * 1000;
    for (let i = 0; i < MAX_ECHECS; i++) {
      await loginTeacher({ email: `inconnu${i}@lycee.test`, password: "nimportequoi", ip: "10.0.0.3", now: t0 + i });
    }
    const bloque = await loginTeacher({ email: EMAIL, password: MDP, ip: "10.0.0.3", now: t0 + 10 });
    expect("retryAfterMinutes" in bloque).toBe(true);
    // Une autre adresse, le même e-mail : rien ne le bloque.
    const ailleurs = await loginTeacher({ email: EMAIL, password: MDP, ip: "10.0.0.4", now: t0 + 10 });
    expect("userId" in ailleurs).toBe(true);
  });
});

describe("un succès n'efface que les échecs de son propre e-mail (audit, P1-3)", () => {
  it("alterner des essais sur la victime et une connexion à son propre compte ne remet pas le compteur à zéro", async () => {
    const attaquant = "attaquant@lycee.test";
    const r = await registerTeacher({
      email: attaquant,
      password: "son-propre-mdp",
      displayName: "M. Attaquant",
      schoolName: "Lycée de l'Attaque",
    });
    if ("error" in r) throw new Error(r.error);
    const t0 = Date.now() + 5 * 60 * 60 * 1000;
    const ip = "10.0.0.66";
    // Quatre essais sur la victime, puis une connexion réussie à son compte, deux fois.
    let t = t0;
    for (let tour = 0; tour < 2; tour++) {
      for (let i = 0; i < MAX_ECHECS - 1; i++) {
        await loginTeacher({ email: EMAIL, password: `essai-${tour}-${i}`, ip, now: (t += 10) });
      }
      const lui = await loginTeacher({ email: attaquant, password: "son-propre-mdp", ip: "10.0.0.67", now: (t += 10) });
      expect("userId" in lui).toBe(true);
      await loginTeacher({ email: attaquant, password: "son-propre-mdp", ip, now: (t += 10) });
    }
    // La victime est bloquée, même avec le bon mot de passe et depuis une autre adresse.
    const victime = await loginTeacher({ email: EMAIL, password: MDP, ip: "10.0.0.68", now: (t += 10) });
    expect("retryAfterMinutes" in victime).toBe(true);
  });

  it("un e-mail inconnu ou un mot de passe court coûtent un calcul bcrypt, comme un e-mail connu", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    const espion = vi.spyOn(bcrypt, "compare");
    try {
      const t0 = Date.now() + 7 * 60 * 60 * 1000;
      await loginTeacher({ email: "fantome@lycee.test", password: "nimportequoi", ip: "10.0.0.70", now: t0 });
      expect(espion).toHaveBeenCalledTimes(1);
      await loginTeacher({ email: "fantome2@lycee.test", password: "abc", ip: "10.0.0.71", now: t0 });
      expect(espion).toHaveBeenCalledTimes(2);
    } finally {
      espion.mockRestore();
    }
  });
});

describe("session horodatée et révocable", () => {
  it("un cookie sans iat ni exp (ancien format) ne vaut pas une session", async () => {
    magasin.set("ba_session", `${prof}.teacher.deadbeefdeadbeefdeadbeefdeadbeef`);
    expect(await getSession()).toBeNull();
  });

  it("un jeton valide ouvre la session ; la version incrémentée le ferme", async () => {
    await setSession(prof, "teacher", 1);
    expect(await getSession()).toEqual({ userId: prof, role: "teacher" });

    const nouvelle = await bumpSessionVersion(prof);
    expect(nouvelle).toBe(2);
    // Même cookie, version dépassée : refusé.
    expect(await getSession()).toBeNull();

    // Une nouvelle connexion émet un jeton pour la version courante.
    const r = await loginTeacher({ email: EMAIL, password: MDP, ip: "10.0.0.9", now: Date.now() + 9 * 60 * 60 * 1000 });
    if (!("userId" in r)) throw new Error(r.error);
    await setSession(r.userId, "teacher", r.sessionVersion);
    expect(await getSession()).toEqual({ userId: prof, role: "teacher" });
  });

  it("un jeton forgé pour un autre compte, ou expiré, est refusé", async () => {
    const now = Date.now();
    magasin.set(
      "ba_session",
      encodeToken({ id: prof, role: "teacher", v: 2, iat: now - DUREE_SESSION_MS - 1, exp: now - 1 }),
    );
    expect(await getSession()).toBeNull();
    magasin.set(
      "ba_session",
      encodeToken({ id: "00000000-0000-0000-0000-000000000000", role: "teacher", v: 1, iat: now, exp: now + 1000 }),
    );
    expect(await getSession()).toBeNull();
  });
});
