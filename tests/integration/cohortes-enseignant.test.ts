import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * DES COHORTES CRÉÉES PAR L'ENSEIGNANT, VÉRIFIÉES CÔTÉ SERVEUR.
 *
 * Décision du propriétaire (octobre 2026) : « des cohortes créées par l'enseignant ».
 * Ce test pose les règles là où elles doivent tenir quel que soit l'écran :
 *  · pas d'essai en classe : sans licence de son établissement, la création est refusée,
 *    même pour une cohorte des seules démonstrations ;
 *  · sous licence, la cohorte porte l'organisation et le créateur, et n'ouvre à ses
 *    élèves (sans compte) que ses épisodes ;
 *  · un enseignant ne voit ni ne modifie la cohorte d'un autre, même en forgeant l'id ;
 *  · close, elle n'accepte plus personne ; une partie commencée se termine.
 * Les actions serveur sont appelées pour de vrai, la session étant celle qu'on leur
 * donne ; seule la redirection de Next est remplacée par une exception lisible.
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
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { episodeCohortes, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import {
  cohorteDeLEnseignant,
  cohortesDeLEnseignant,
  CohorteRefuseeError,
  creerCohorteDeLEnseignant,
  listerCohortes,
  rejoindreCohorte,
} from "@/services/cohortes.service";
import { accesAuxEpisodes } from "@/services/acces.service";
import { episodeOuvert, EPISODES_DE_DEMO, niveauxDeLEpisode } from "@/config/episodes/demos";
import { enregistrerPartie } from "@/services/episode-parties.service";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { etablissementSousLicence, poserUneLicence } from "./helpers/licence";
import {
  cloreCohorteAction,
  creerCohorteAction,
  renommerCohorteAction,
  renouvelerCodeDeCohorteAction,
  rouvrirCohorteAction,
} from "@/app/teacher/cohortes/actions";

const estDemo = (code: string) => (EPISODES_DE_DEMO as readonly string[]).includes(code);
const nonDemos = EPISODES.filter((e) => !estDemo(e.code));
/** Deux épisodes non démo dans la cohorte, un troisième hors d'elle. */
const [dansLaCohorte, aussiDansLaCohorte, horsCohorte] = nonDemos;
const demoHorsCohorte = EPISODES_DE_DEMO[0];

let sansLicence: { userId: string; orgId: string };
let prof: { userId: string; orgId: string };
let autreProf: { userId: string; orgId: string };

async function nouvelInvite(): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ email: `eleve-${randomUUID()}@guest.test`, displayName: "Élève" })
    .returning({ id: users.id });
  return u!.id;
}

const connecte = (userId: string) =>
  vi.mocked(getSession).mockResolvedValue({ userId, role: "teacher" } as never);

const formulaire = (champs: Record<string, string | string[]>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) {
    for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
  }
  return fd;
};

/** L'adresse où l'action renvoie : la redirection de Next, rendue lisible. */
async function redirection(action: Promise<unknown>): Promise<string> {
  try {
    await action;
  } catch (e) {
    const m = /^__redirect__(.*)$/.exec((e as Error).message);
    if (m) return m[1]!;
    throw e;
  }
  throw new Error("l'action n'a pas redirigé");
}

const lire = async (id: string) =>
  (await db.select().from(episodeCohortes).where(eq(episodeCohortes.id, id)))[0]!;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "prof-sans-licence@lycee.test",
    password: "motdepasse!",
    displayName: "Prof sans licence",
    schoolName: "Lycée sans licence",
  });
  if ("error" in r) throw new Error(r.error);
  sansLicence = { userId: r.userId, orgId: (await getTeacherOrgId(r.userId))! };
  prof = await etablissementSousLicence("Cohortes", { episodes: true });
  autreProf = await etablissementSousLicence("Collègue", { episodes: true });
});

beforeEach(() => {
  vi.mocked(getSession).mockReset();
});

describe("créer une cohorte depuis l'espace enseignant", () => {
  it("sans licence : refusée par le serveur, même avec les seules démonstrations", async () => {
    await expect(
      creerCohorteDeLEnseignant({
        enseignantId: sansLicence.userId,
        nom: "Démos seules",
        episodes: [...EPISODES_DE_DEMO],
      }),
    ).rejects.toMatchObject({ raison: "licence" });

    connecte(sansLicence.userId);
    const vers = await redirection(
      creerCohorteAction(
        formulaire({ nom: "BTS MCO 2 · groupe A", episodes: [EPISODES_DE_DEMO[0], dansLaCohorte!.code] }),
      ),
    );
    expect(vers).toMatch(/^\/teacher\/cohortes\?refus=licence/);
    expect(await cohortesDeLEnseignant(sansLicence.userId)).toEqual([]);
  });

  it("une licence posée ensuite ouvre la création", async () => {
    const r = await registerTeacher({
      email: `devient-${randomUUID()}@lycee.test`,
      password: "motdepasse!",
      displayName: "Devient sous licence",
      schoolName: "Lycée qui achète",
    });
    if ("error" in r) throw new Error(r.error);
    const org = (await getTeacherOrgId(r.userId))!;
    const essai = () =>
      creerCohorteDeLEnseignant({ enseignantId: r.userId, nom: "Seconde 4", episodes: [EPISODES_DE_DEMO[1]] });
    await expect(essai()).rejects.toBeInstanceOf(CohorteRefuseeError);
    await poserUneLicence(org, r.userId, { episodes: true });
    await expect(essai()).resolves.toMatchObject({ nom: "Seconde 4" });
  });

  it("sous licence : rattachée à son organisation, à son créateur, avec les épisodes cochés", async () => {
    connecte(prof.userId);
    const vers = await redirection(
      creerCohorteAction(
        formulaire({
          nom: "  BTS MCO 2 · groupe A  ",
          // Un code inconnu est écarté, un doublon compté une fois, l'ordre est celui du registre.
          episodes: [aussiDansLaCohorte!.code, "episode-qui-n-existe-pas", dansLaCohorte!.code, dansLaCohorte!.code],
        }),
      ),
    );
    const id = /^\/teacher\/cohortes\/([0-9a-f-]{36})\?creee=1$/.exec(vers)![1]!;
    const c = await lire(id);
    expect(c.nom).toBe("BTS MCO 2 · groupe A");
    expect(c.organizationId).toBe(prof.orgId);
    expect(c.creePar).toBe(prof.userId);
    expect(c.episodes).toEqual([dansLaCohorte!.code, aussiDansLaCohorte!.code]);
    expect(c.closeLe).toBeNull();
    expect(c.code).toMatch(/^BTSMCO-[A-Z2-9]{4}$/);
  });

  it("refuse sans nom ou sans épisode, avec la raison", async () => {
    connecte(prof.userId);
    expect(await redirection(creerCohorteAction(formulaire({ nom: " ", episodes: [dansLaCohorte!.code] })))).toMatch(
      /refus=nom/,
    );
    expect(await redirection(creerCohorteAction(formulaire({ nom: "Vide" })))).toMatch(/refus=episodes/);
    expect(
      await redirection(creerCohorteAction(formulaire({ nom: "Inconnus", episodes: ["rien-du-tout"] }))),
    ).toMatch(/refus=episodes/);
  });
});

describe("l'élève entré par le code", () => {
  it("joue un épisode non démo de la cohorte, mais pas un épisode hors cohorte", async () => {
    const c = await creerCohorteDeLEnseignant({
      enseignantId: prof.userId,
      nom: "Terminale STMG",
      episodes: [dansLaCohorte!.code],
    });
    const eleve = await nouvelInvite();
    expect((await rejoindreCohorte(eleve, c.code)).ok).toBe(true);
    const acces = await accesAuxEpisodes({ userId: eleve });
    expect(acces).toEqual({ licence: true, source: "cohorte", episodes: [dansLaCohorte!.code] });
    expect(niveauxDeLEpisode(acces, dansLaCohorte!.code)).toEqual(["decouverte", "standard", "expert"]);
    // Hors de la cohorte, la règle sans licence : rien pour un non démo, la Découverte pour une démo.
    expect(episodeOuvert(acces, horsCohorte!.code)).toBe(false);
    expect(niveauxDeLEpisode(acces, demoHorsCohorte)).toEqual(["decouverte"]);
  });

  it("une licence par ailleurs (son compte) ouvre tout, cohorte restreinte ou non", async () => {
    const c = await creerCohorteDeLEnseignant({
      enseignantId: prof.userId,
      nom: "Avec compte",
      episodes: [dansLaCohorte!.code],
    });
    const eleve = await nouvelInvite();
    await rejoindreCohorte(eleve, c.code);
    const acces = await accesAuxEpisodes({ userId: eleve, sessionUserId: autreProf.userId });
    expect(acces).toEqual({ licence: true, source: "compte" });
    expect(episodeOuvert(acces, horsCohorte!.code, "expert")).toBe(true);
  });

  it("une cohorte dont l'organisation perd sa licence n'ouvre plus que les démos", async () => {
    const e = await etablissementSousLicence("Licence qui s'arrête", { episodes: true });
    const c = await creerCohorteDeLEnseignant({
      enseignantId: e.userId,
      nom: "Fin de contrat",
      episodes: [dansLaCohorte!.code],
    });
    const eleve = await nouvelInvite();
    await rejoindreCohorte(eleve, c.code);
    const { deleteOrgLicence, listOrgLicences } = await import("@/services/licence.service");
    for (const l of await listOrgLicences(e.orgId)) await deleteOrgLicence(l.id);
    const acces = await accesAuxEpisodes({ userId: eleve });
    expect(acces.licence).toBe(false);
    expect(episodeOuvert(acces, dansLaCohorte!.code)).toBe(false);
  });
});

describe("un enseignant ne voit que ses cohortes", () => {
  it("ni lecture ni modification de la cohorte d'un autre, même avec son identifiant", async () => {
    const sienne = await creerCohorteDeLEnseignant({
      enseignantId: autreProf.userId,
      nom: "La classe du collègue",
      episodes: [dansLaCohorte!.code],
    });
    const avant = await lire(sienne.id);

    expect((await cohortesDeLEnseignant(prof.userId)).map((c) => c.id)).not.toContain(sienne.id);
    expect(await cohorteDeLEnseignant(prof.userId, sienne.id)).toBeNull();
    expect(await cohorteDeLEnseignant(prof.userId, "pas-un-uuid")).toBeNull();

    connecte(prof.userId);
    const refus = /^\/teacher\/cohortes\?refus=introuvable$/;
    expect(await redirection(renommerCohorteAction(sienne.id, formulaire({ nom: "Volée" })))).toMatch(refus);
    expect(await redirection(cloreCohorteAction(sienne.id))).toMatch(refus);
    expect(await redirection(rouvrirCohorteAction(sienne.id))).toMatch(refus);
    expect(await redirection(renouvelerCodeDeCohorteAction(sienne.id))).toMatch(refus);
    expect(await redirection(renommerCohorteAction("pas-un-uuid", formulaire({ nom: "x" })))).toMatch(refus);

    // Rien n'a bougé.
    expect(await lire(sienne.id)).toEqual(avant);

    // Son créateur, lui, la renomme.
    connecte(autreProf.userId);
    expect(await redirection(renommerCohorteAction(sienne.id, formulaire({ nom: "1re STMG 2" })))).toBe(
      `/teacher/cohortes/${sienne.id}?fait=renommee`,
    );
    expect((await lire(sienne.id)).nom).toBe("1re STMG 2");
  });

  it("sans session, l'action renvoie à la connexion", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect(await redirection(cloreCohorteAction(randomUUID()))).toBe("/teacher/login");
  });
});

describe("clore et renouveler", () => {
  it("close : plus de nouveaux participants ; une partie commencée se termine", async () => {
    const c = await creerCohorteDeLEnseignant({
      enseignantId: prof.userId,
      nom: "À clore",
      episodes: [dansLaCohorte!.code],
    });
    const membre = await nouvelInvite();
    await rejoindreCohorte(membre, c.code);
    // Le membre a ouvert l'épisode : la page s'est rendue sous la licence de la cohorte.
    expect(episodeOuvert(await accesAuxEpisodes({ userId: membre }), dansLaCohorte!.code, "standard")).toBe(
      true,
    );

    connecte(prof.userId);
    expect(await redirection(cloreCohorteAction(c.id))).toBe(`/teacher/cohortes/${c.id}?fait=close`);
    expect((await lire(c.id)).closeLe).toBeInstanceOf(Date);

    // Personne de nouveau…
    const retardataire = await nouvelInvite();
    expect(await rejoindreCohorte(retardataire, c.code)).toMatchObject({ ok: false, close: true });
    // … le membre reste membre (rejoindre à nouveau ne le sort pas) …
    expect((await rejoindreCohorte(membre, c.code)).ok).toBe(true);
    // … la cohorte n'ouvre plus de nouvel épisode …
    expect(episodeOuvert(await accesAuxEpisodes({ userId: membre }), dansLaCohorte!.code)).toBe(false);
    // … mais la partie commencée avant la clôture se termine et reste gardée.
    const ep = dansLaCohorte!;
    const r = await enregistrerPartie(membre, {
      cle: randomUUID(),
      code: ep.code,
      niveau: "standard",
      graine: 3,
      chemin: ep.references[0]!.chemin,
      consultes: [],
      jours: 2,
      diagnostic: ep.diagnostics[0]!.id,
      reevaluation: { choix: "maintient", principal: null },
      prevision: ep.prevision.min,
      confiance: 50,
    });
    expect(r.ok).toBe(true);

    // Rouverte : tout revient.
    expect(await redirection(rouvrirCohorteAction(c.id))).toBe(`/teacher/cohortes/${c.id}?fait=rouverte`);
    expect((await rejoindreCohorte(retardataire, c.code)).ok).toBe(true);
    expect(episodeOuvert(await accesAuxEpisodes({ userId: membre }), dansLaCohorte!.code)).toBe(true);
  });

  it("un nouveau code : l'ancien n'ouvre plus rien, les membres restent", async () => {
    const c = await creerCohorteDeLEnseignant({
      enseignantId: prof.userId,
      nom: "Code qui a fuité",
      episodes: [dansLaCohorte!.code],
    });
    const membre = await nouvelInvite();
    await rejoindreCohorte(membre, c.code);
    connecte(prof.userId);
    await redirection(renouvelerCodeDeCohorteAction(c.id));
    const nouveau = (await lire(c.id)).code;
    expect(nouveau).not.toBe(c.code);
    expect(await rejoindreCohorte(await nouvelInvite(), c.code)).toMatchObject({ ok: false });
    expect((await rejoindreCohorte(await nouvelInvite(), nouveau)).ok).toBe(true);
    expect(episodeOuvert(await accesAuxEpisodes({ userId: membre }), dansLaCohorte!.code)).toBe(true);
    expect((await cohorteDeLEnseignant(prof.userId, c.id))!.membres).toBe(2);
  });
});

describe("l'administration voit tout", () => {
  it("toutes les cohortes, avec l'enseignant créateur", async () => {
    const toutes = await listerCohortes();
    const duProf = toutes.filter((c) => c.creePar?.email && c.organisation?.id === prof.orgId);
    expect(duProf.length).toBeGreaterThan(0);
    expect(duProf.every((c) => c.creePar!.nom === "Cohortes")).toBe(true);
    expect(toutes.some((c) => c.organisation?.id === autreProf.orgId)).toBe(true);
  });
});
