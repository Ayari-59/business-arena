import { createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LTI 1.3, DE BOUT EN BOUT CÔTÉ SERVEUR : un simulateur de plateforme (sa paire de clés,
 * son JWKS sur un serveur local) joue la connexion OIDC puis poste un `id_token` signé
 * aux VRAIES routes de l'outil. Les cookies passent par un bocal en mémoire qui tient
 * lieu de navigateur ; la base est celle des migrations (PGlite).
 *
 * Ce qui est vérifié : les lancements Enseignant et Élève, la configuration de
 * l'activité, la licence de l'organisation de la plateforme, chaque refus de sécurité
 * (signature, nonce rejoué, émetteur, déploiement, expiration, `alg: none`, audience,
 * state), l'inscription dynamique (jeton valable, inconnu, réutilisé), la sélection de
 * contenu (jeton de réponse vérifiable par la clé publique de l'outil) et le JWKS.
 */

const bocal = new Map<string, { valeur: string; options?: Record<string, unknown> }>();
vi.mock("next/headers", () => {
  const magasin = {
    get: (nom: string) => (bocal.has(nom) ? { name: nom, value: bocal.get(nom)!.valeur } : undefined),
    set: (nom: string, valeur: string, options?: Record<string, unknown>) => {
      if (options?.maxAge === 0) bocal.delete(nom);
      else bocal.set(nom, { valeur, options });
    },
    delete: (nom: string) => bocal.delete(nom),
  };
  return {
    cookies: async () => magasin,
    headers: async () => new Headers({ host: "outil.test", "x-forwarded-proto": "https" }),
  };
});
vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  episodeMembres,
  ltiComptes,
  ltiLiens,
  ltiPlateformes,
  ltiRefus,
  organizationMembers,
  organizations,
  players,
  teams,
  users,
} from "@/db/schema";
import { GET as jwks } from "@/app/api/lti/jwks/route";
import { GET as connexionGet } from "@/app/api/lti/connexion/route";
import { POST as lancementPost } from "@/app/api/lti/lancement/route";
import { POST as selectionPost } from "@/app/api/lti/selection/route";
import { GET as ouvertureGet } from "@/app/api/lti/ouverture/route";
import { GET as inscriptionGet, POST as inscriptionPost } from "@/app/api/lti/inscription/route";
import { inscrirePlateforme, creerJetonInscription } from "@/lti/plateformes";
import { hacherSub } from "@/lti/comptes";
import { viderCacheJwks } from "@/lti/reseau";
import { clesDeLOutil } from "@/lti/cles";
import { decoderContexte, COOKIE_CONTEXTE } from "@/lti/contexte";
import { createClassGame } from "@/services/game.service";
import { creerCohorteDeLEnseignant } from "@/services/cohortes.service";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { creerCohorteAction, creerPartieAction, relierPartieAction } from "@/app/lti/activite/actions";
import { entrerAction } from "@/app/lti/eleve/actions";
import { poserUneLicence } from "./helpers/licence";
import { jetonNone, ROLE, SimulateurLti, signerRS256, type Personne } from "../helpers/simulateur-lti";

const OUTIL = "https://outil.test";
let sim: SimulateurLti;

async function organisation(nom: string): Promise<string> {
  const [o] = await db
    .insert(organizations)
    .values({ name: nom, slug: `lti-${nom.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}` })
    .returning();
  return o!.id;
}

/** Un compte d'administration de l'organisation, pour signer la licence posée. */
async function administrateur(orgId: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ email: `admin-${orgId}-${Math.random()}@lycee.test`, displayName: "Admin" })
    .returning();
  await db.insert(organizationMembers).values({ userId: u!.id, organizationId: orgId, role: "org_admin" });
  return u!.id;
}

/** La connexion OIDC par la vraie route : rend le state et le nonce tirés. */
async function connexion(s: SimulateurLti = sim): Promise<{ state: string; nonce: string; reponse: Response }> {
  const q = new URLSearchParams({
    iss: s.issuer,
    login_hint: "indice",
    target_link_uri: `${OUTIL}/api/lti/lancement`,
    client_id: s.clientId,
    lti_deployment_id: s.deploymentId,
  });
  const reponse = await connexionGet(new Request(`${OUTIL}/api/lti/connexion?${q}`));
  expect(reponse.status).toBe(302);
  const loc = new URL(reponse.headers.get("location")!);
  return { state: loc.searchParams.get("state")!, nonce: loc.searchParams.get("nonce")!, reponse };
}

/** Le lancement par la vraie route, avec un id_token donné. */
async function lancer(idToken: string, state: string): Promise<Response> {
  const corps = new URLSearchParams({ id_token: idToken, state });
  return lancementPost(
    new Request(`${OUTIL}/api/lti/lancement`, {
      method: "POST",
      body: corps,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }),
  );
}

/** Connexion puis lancement, comme le navigateur : la destination. */
async function lancement(p: Personne, s: SimulateurLti = sim): Promise<string> {
  bocal.clear();
  const { state, nonce } = await connexion(s);
  const r = await lancer(s.idToken(p, nonce), state);
  expect(r.status, await r.clone().text()).toBe(303);
  return new URL(r.headers.get("location")!).pathname + new URL(r.headers.get("location")!).search;
}

const contexte = () => decoderContexte(bocal.get(COOKIE_CONTEXTE)?.valeur);

async function attendreRedirection(f: () => Promise<unknown>): Promise<string> {
  try {
    await f();
  } catch (e) {
    const m = /__redirect__(.*)$/.exec((e as Error).message);
    if (m) return m[1]!;
    throw e;
  }
  throw new Error("aucune redirection");
}

let orgId: string;
let orgSansLicence: string;
let simSansLicence: SimulateurLti;

beforeAll(async () => {
  sim = await new SimulateurLti().demarrer(OUTIL);
  simSansLicence = await new SimulateurLti().demarrer(OUTIL);
  orgId = await organisation("Lycée LTI");
  await poserUneLicence(orgId, await administrateur(orgId), { arene: "campus", episodes: true });
  await inscrirePlateforme({ nom: "Moodle", ...sim.description(), organizationId: orgId, inscription: "manuelle" });
  orgSansLicence = await organisation("Lycée sans licence");
  await inscrirePlateforme({
    nom: "Moodle 2",
    ...simSansLicence.description(),
    organizationId: orgSansLicence,
    inscription: "manuelle",
  });
});

afterAll(async () => {
  await sim.arreter();
  await simSansLicence.arreter();
});

beforeEach(() => {
  viderCacheJwks();
});

describe("le JWKS de l'outil", () => {
  it("publie la clé publique, avec son kid, et jamais la partie privée", async () => {
    const r = jwks();
    expect(r.status).toBe(200);
    const { keys } = (await r.json()) as { keys: Record<string, string>[] };
    expect(keys.length).toBeGreaterThanOrEqual(1);
    expect(keys[0]).toMatchObject({ kty: "RSA", alg: "RS256", use: "sig" });
    expect(keys[0]!.kid).toBe(clesDeLOutil().kid);
    for (const k of keys) for (const prive of ["d", "p", "q", "dp", "dq", "qi"]) expect(k[prive]).toBeUndefined();
  });
});

describe("la connexion OIDC", () => {
  it("renvoie vers l'authentification de la plateforme avec state, nonce et redirection", async () => {
    const { reponse, state, nonce } = await connexion();
    const loc = new URL(reponse.headers.get("location")!);
    expect(loc.origin + loc.pathname).toBe(`${sim.base}/auth`);
    expect(loc.searchParams.get("redirect_uri")).toBe(`${OUTIL}/api/lti/lancement`);
    expect(loc.searchParams.get("response_mode")).toBe("form_post");
    expect(loc.searchParams.get("scope")).toBe("openid");
    expect(state.length).toBeGreaterThan(20);
    expect(nonce).not.toBe(state);
    // Le cookie de vérification : SameSite=None, Secure, HttpOnly.
    const cookie = reponse.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/ba_lti_state=/);
    expect(cookie).toMatch(/SameSite=none/i);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("refuse un émetteur inconnu, et le note au journal", async () => {
    const q = new URLSearchParams({ iss: "https://inconnu.test", login_hint: "x", target_link_uri: `${OUTIL}/api/lti/lancement` });
    const r = await connexionGet(new Request(`${OUTIL}/api/lti/connexion?${q}`));
    expect(r.status).toBe(400);
    const refus = await db.select().from(ltiRefus).where(eq(ltiRefus.issuer, "https://inconnu.test"));
    expect(refus.map((x) => x.motif)).toContain("émetteur inconnu ou plateforme désactivée");
  });

  it("refuse une cible hors de l'outil", async () => {
    const q = new URLSearchParams({ iss: sim.issuer, login_hint: "x", target_link_uri: "https://ailleurs.test/vol" });
    const r = await connexionGet(new Request(`${OUTIL}/api/lti/connexion?${q}`));
    expect(r.status).toBe(400);
  });
});

describe("le lancement Enseignant", () => {
  it("crée le compte à la première venue, rattaché à l'organisation de la plateforme, sans garder le sub en clair", async () => {
    const chemin = await lancement({
      sub: "prof-1",
      role: "enseignant",
      prenom: "Claire",
      nom: "Claire Martin",
      courriel: "claire.martin@lycee.test",
      ressource: "activite-1",
      titre: "Simulation du trimestre",
    });
    expect(chemin).toBe("/lti/activite");
    const ctx = contexte()!;
    expect(ctx.r).toBe("enseignant");
    const [compte] = await db.select().from(ltiComptes).where(eq(ltiComptes.userId, ctx.u));
    expect(compte!.subHache).not.toContain("prof-1");
    const [p] = await db.select().from(ltiPlateformes).where(eq(ltiPlateformes.clientId, sim.clientId));
    expect(compte!.subHache).toBe(hacherSub(p!.sel, "prof-1"));
    expect(compte!.courriel).toBe("claire.martin@lycee.test");
    const [membre] = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, ctx.u));
    expect(membre).toMatchObject({ organizationId: orgId, role: "teacher" });
    const [u] = await db.select().from(users).where(eq(users.id, ctx.u));
    expect(u!.displayName).toBe("Claire Martin");
    expect(u!.passwordHash).toBeNull();
    expect(bocal.has("ba_session")).toBe(true);
  });

  it("retrouve le même compte au lancement suivant", async () => {
    await lancement({ sub: "prof-1", role: "enseignant", ressource: "activite-1" });
    const premier = contexte()!.u;
    await lancement({ sub: "prof-1", role: "enseignant", ressource: "activite-1" });
    expect(contexte()!.u).toBe(premier);
  });

  it("un administrateur de la plateforme est un enseignant ; un rôle inconnu, un élève", async () => {
    bocal.clear();
    const { state, nonce } = await connexion();
    const jeton = sim.idToken({ sub: "admin-1", role: "eleve", ressource: "activite-1" }, nonce, {
      "https://purl.imsglobal.org/spec/lti/claim/roles": [ROLE.admin],
    });
    const r = await lancer(jeton, state);
    expect(r.status).toBe(303);
    expect(contexte()!.r).toBe("enseignant");
  });
});

describe("l'activité reliée à une partie de classe", () => {
  let gameId: string;
  let enseignantId: string;

  it("l'enseignant crée la partie depuis l'écran de l'activité ; ses lancements suivants mènent au pilotage", async () => {
    await lancement({ sub: "prof-2", role: "enseignant", prenom: "Paul", ressource: "activite-partie" });
    enseignantId = contexte()!.u;
    const fd = new FormData();
    fd.set("scenarioCode", "nova");
    fd.set("humanTeamsCount", "2");
    fd.set("botCount", "1");
    fd.set("periodicity", "quarter");
    fd.set("level", "2");
    fd.set("quizMode", "full");
    fd.set("answerFormat", "qcm");
    fd.set("variableWorld", "on");
    const vers = await attendreRedirection(() => creerPartieAction(fd));
    expect(vers).toMatch(/^\/teacher\/games\//);
    gameId = vers.split("/").pop()!;
    const [lien] = await db.select().from(ltiLiens).where(eq(ltiLiens.resourceLinkId, "activite-partie"));
    expect(lien).toMatchObject({ cibleType: "partie", gameId, configurePar: enseignantId });
    expect(await lancement({ sub: "prof-2", role: "enseignant", ressource: "activite-partie" })).toBe(
      `/teacher/games/${gameId}`,
    );
  });

  it("l'élève avec un prénom arrive dans la partie, réparti dans une équipe ; ni courriel ni nom gardés", async () => {
    const chemin = await lancement({
      sub: "eleve-1",
      role: "eleve",
      prenom: "Léa",
      nom: "Léa Dupont",
      courriel: "lea@eleves.test",
      ressource: "activite-partie",
    });
    expect(chemin).toBe(`/arena/${gameId}`);
    const ctx = contexte()!;
    expect(ctx.r).toBe("eleve");
    expect(bocal.has("ba_session")).toBe(false);
    expect(bocal.get("ba_guest")?.valeur.startsWith(ctx.u)).toBe(true);
    const [u] = await db.select().from(users).where(eq(users.id, ctx.u));
    expect(u!.displayName).toBe("Léa");
    expect(u!.email).not.toContain("lea@");
    const [compte] = await db.select().from(ltiComptes).where(eq(ltiComptes.userId, ctx.u));
    expect(compte!.courriel).toBeNull();
    const joueurs = await db
      .select()
      .from(players)
      .innerJoin(teams, eq(teams.id, players.teamId))
      .where(and(eq(players.userId, ctx.u), eq(teams.gameId, gameId)));
    expect(joueurs).toHaveLength(1);
  });

  it("l'élève sans prénom le choisit à l'arrivée, puis entre", async () => {
    expect(await lancement({ sub: "eleve-2", role: "eleve", ressource: "activite-partie" })).toBe("/lti/eleve");
    const fd = new FormData();
    fd.set("pseudo", "Max");
    expect(await attendreRedirection(() => entrerAction(fd))).toBe(`/arena/${gameId}`);
    const [u] = await db.select().from(users).where(eq(users.id, contexte()!.u));
    expect(u!.displayName).toBe("Max");
  });

  it("relier une partie qui n'est pas à l'enseignant est refusé", async () => {
    await lancement({ sub: "prof-3", role: "enseignant", ressource: "activite-autre" });
    const fd = new FormData();
    fd.set("gameId", gameId);
    expect(await attendreRedirection(() => relierPartieAction(fd))).toBe("/lti/activite?refus=introuvable");
  });
});

describe("l'activité pas encore configurée", () => {
  it("l'élève attend : il est mené à l'écran d'attente, sans partie", async () => {
    expect(await lancement({ sub: "eleve-3", role: "eleve", prenom: "Nora", ressource: "activite-vide" })).toBe(
      "/lti/eleve",
    );
  });
});

describe("l'activité reliée à une cohorte d'épisodes (licence Campus + épisodes)", () => {
  it("l'enseignant crée la cohorte ; l'élève y est inscrit au lancement", async () => {
    await lancement({ sub: "prof-4", role: "enseignant", ressource: "activite-cohorte", cours: "BTS MCO" });
    const fd = new FormData();
    fd.set("nom", "BTS MCO 1");
    fd.append("episodes", EPISODES[0]!.code);
    const vers = await attendreRedirection(() => creerCohorteAction(fd));
    expect(vers).toMatch(/^\/teacher\/cohortes\//);
    const cohorteId = vers.split("/").pop()!;
    expect(await lancement({ sub: "eleve-5", role: "eleve", ressource: "activite-cohorte" })).toBe(
      "/entreprises/episode/profil?bienvenue=1",
    );
    const [m] = await db.select().from(episodeMembres).where(eq(episodeMembres.userId, contexte()!.u));
    expect(m!.cohorteId).toBe(cohorteId);
  });
});

describe("une organisation sans licence", () => {
  it("l'enseignant arrive sur l'écran de l'activité, et la création de partie est refusée par la règle de la classe", async () => {
    expect(await lancement({ sub: "prof-5", role: "enseignant", ressource: "a" }, simSansLicence)).toBe("/lti/activite");
    const fd = new FormData();
    fd.set("level", "2");
    expect(await attendreRedirection(() => creerPartieAction(fd))).toBe("/lti/activite?refus=classe");
    const fd2 = new FormData();
    fd2.set("nom", "Cohorte");
    fd2.append("episodes", EPISODES[0]!.code);
    expect(await attendreRedirection(() => creerCohorteAction(fd2))).toBe("/lti/activite?refus=cohorte-licence");
  });

  it("l'élève est mené à l'écran d'attente ; l'organisation n'ouvre rien", async () => {
    const { organisationOuverte } = await import("@/lti/acces");
    expect(await lancement({ sub: "eleve-6", role: "eleve", ressource: "a" }, simSansLicence)).toBe("/lti/eleve");
    expect(await organisationOuverte(orgSansLicence)).toBe(false);
    expect(await organisationOuverte(orgId)).toBe(true);
  });
});

describe("les refus du lancement", () => {
  const eleve: Personne = { sub: "eleve-refus", role: "eleve", ressource: "activite-refus" };

  async function refuse(fabriquer: (nonce: string) => string, motif: string, s: SimulateurLti = sim) {
    bocal.clear();
    const { state, nonce } = await connexion(s);
    const r = await lancer(fabriquer(nonce), state);
    expect(r.status).toBe(400);
    const html = await r.text();
    expect(html).toContain("Ce lancement n&#39;a pas pu être vérifié");
    expect(bocal.has(COOKIE_CONTEXTE)).toBe(false);
    const lignes = await db.select().from(ltiRefus).where(eq(ltiRefus.motif, motif));
    expect(lignes.length, `motif « ${motif} » absent du journal`).toBeGreaterThan(0);
    for (const l of await db.select().from(ltiRefus)) expect(l.motif).not.toMatch(/eyJ/);
  }

  it("signature fausse (autre clé, même kid)", async () => {
    const autre = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    await refuse((n) => signerRS256(sim.charge(eleve, n), autre, sim.kid), "signature invalide");
  });

  it("alg none", async () => {
    await refuse((n) => jetonNone(sim.charge(eleve, n)), "algorithme refusé : none");
  });

  it("alg HS256 (la clé publique prise pour un secret)", async () => {
    await refuse((n) => signerRS256(sim.charge(eleve, n), sim.privee, sim.kid, "HS256"), "algorithme refusé : HS256");
  });

  it("émetteur inconnu", async () => {
    await refuse((n) => sim.idToken(eleve, n, { iss: "https://pirate.test" }), "émetteur ou client_id non inscrit");
  });

  it("audience fausse", async () => {
    await refuse((n) => sim.idToken(eleve, n, { aud: "un-autre-client" }), "émetteur ou client_id non inscrit");
  });

  it("deployment_id non inscrit", async () => {
    await refuse(
      (n) => sim.idToken(eleve, n, { "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "dep-inconnu" }),
      "deployment_id non inscrit",
    );
  });

  it("jeton expiré (au-delà des soixante secondes de tolérance)", async () => {
    const passe = Math.floor(Date.now() / 1000) - 3600;
    await refuse((n) => sim.idToken(eleve, n, { iat: passe - 300, exp: passe }), "jeton expiré");
  });

  it("jeton émis dans le futur", async () => {
    await refuse((n) => sim.idToken(eleve, n, { iat: Math.floor(Date.now() / 1000) + 600 }), "jeton émis dans le futur");
  });

  it("une horloge décalée de trente secondes passe", async () => {
    bocal.clear();
    const { state, nonce } = await connexion();
    const maintenant = Math.floor(Date.now() / 1000);
    const r = await lancer(sim.idToken(eleve, nonce, { iat: maintenant + 30, exp: maintenant - 30 }), state);
    expect(r.status).toBe(303);
  });

  it("version LTI autre que 1.3.0", async () => {
    await refuse(
      (n) => sim.idToken(eleve, n, { "https://purl.imsglobal.org/spec/lti/claim/version": "1.1" }),
      "version LTI autre que 1.3.0",
    );
  });

  it("nonce inconnu (jamais tiré par l'outil)", async () => {
    await refuse(() => sim.idToken(eleve, "nonce-invente"), "nonce inconnu, expiré ou déjà utilisé");
  });

  it("nonce rejoué : le même id_token posté deux fois", async () => {
    bocal.clear();
    const { state, nonce } = await connexion();
    const jeton = sim.idToken(eleve, nonce);
    expect((await lancer(jeton, state)).status).toBe(303);
    const r = await lancer(jeton, state);
    expect(r.status).toBe(400);
  });

  it("state différent de celui tiré avec le nonce", async () => {
    bocal.clear();
    const { nonce } = await connexion();
    const r = await lancer(sim.idToken(eleve, nonce), "un-autre-state");
    expect(r.status).toBe(400);
    expect((await db.select().from(ltiRefus).where(eq(ltiRefus.motif, "state différent de celui de la connexion"))).length).toBe(1);
  });

  it("state du cookie différent du state posté", async () => {
    bocal.clear();
    const { state, nonce } = await connexion();
    bocal.set("ba_lti_state", { valeur: "cookie-d-un-autre-onglet" });
    expect((await lancer(sim.idToken(eleve, nonce), state)).status).toBe(400);
  });

  it("sans cookie (cookies tiers bloqués), la vérification en base suffit", async () => {
    bocal.clear();
    const { state, nonce } = await connexion();
    bocal.delete("ba_lti_state");
    expect((await lancer(sim.idToken(eleve, nonce), state)).status).toBe(303);
  });

  it("plateforme désactivée", async () => {
    bocal.clear();
    const { state, nonce } = await connexion();
    await db.update(ltiPlateformes).set({ actif: false }).where(eq(ltiPlateformes.clientId, sim.clientId));
    try {
      expect((await lancer(sim.idToken(eleve, nonce), state)).status).toBe(400);
    } finally {
      await db.update(ltiPlateformes).set({ actif: true }).where(eq(ltiPlateformes.clientId, sim.clientId));
    }
  });
});

describe("le lancement reçu dans une iframe", () => {
  it("propose d'ouvrir une nouvelle fenêtre ; le ticket ne sert qu'une fois", async () => {
    bocal.clear();
    const { state, nonce } = await connexion();
    const r = await lancer(sim.idToken({ sub: "eleve-iframe", role: "eleve", ressource: "x", affichage: "iframe" }, nonce), state);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-security-policy")).toContain(`frame-ancestors ${sim.base}`);
    expect(bocal.has(COOKIE_CONTEXTE)).toBe(false);
    const html = await r.text();
    const lien = /href="(\/api\/lti\/ouverture\?ticket=[^"]+)"/.exec(html)![1]!;
    const ouvre = await ouvertureGet(new Request(`${OUTIL}${lien}`));
    expect(ouvre.status).toBe(303);
    expect(new URL(ouvre.headers.get("location")!).pathname).toBe("/lti/eleve");
    expect(contexte()!.r).toBe("eleve");
    expect((await ouvertureGet(new Request(`${OUTIL}${lien}`))).status).toBe(410);
  });
});

describe("l'inscription dynamique", () => {
  let nouvelle: SimulateurLti;
  let org: string;
  beforeAll(async () => {
    nouvelle = await new SimulateurLti().demarrer(OUTIL);
    org = await organisation("Université dynamique");
  });
  afterAll(() => nouvelle.arreter());

  const adresse = (jeton: string) =>
    `${OUTIL}/api/lti/inscription?jeton=${jeton}&openid_configuration=${encodeURIComponent(`${nouvelle.base}/.well-known/openid-configuration`)}&registration_token=jeton-plateforme`;
  const poster = (jeton: string) =>
    inscriptionPost(
      new Request(`${OUTIL}/api/lti/inscription`, {
        method: "POST",
        body: new URLSearchParams({
          jeton,
          openid_configuration: `${nouvelle.base}/.well-known/openid-configuration`,
          registration_token: "jeton-plateforme",
        }),
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
    );

  it("refuse un jeton inconnu, sans rien demander à la plateforme", async () => {
    // Aucun appel réseau, ni en GET ni en POST (audit, P2-1) : la configuration était
    // lue AVANT le jeton en POST, et n'importe qui faisait appeler une adresse au serveur.
    const reseau = vi.spyOn(globalThis, "fetch");
    try {
      const r = await inscriptionGet(new Request(adresse("jeton-inconnu-0123456789")));
      expect(r.status).toBe(403);
      expect((await poster("jeton-inconnu-0123456789")).status).toBe(403);
      expect(reseau).not.toHaveBeenCalled();
    } finally {
      reseau.mockRestore();
    }
    expect(nouvelle.inscriptions).toHaveLength(0);
  });

  it("avec un jeton valable : confirmation, puis inscription auprès de la plateforme", async () => {
    const jeton = await creerJetonInscription({ organizationId: org, adminId: await administrateur(org) });
    const page = await inscriptionGet(new Request(adresse(jeton)));
    expect(page.status).toBe(200);
    expect(page.headers.get("content-security-policy")).toContain(`frame-ancestors ${nouvelle.base}`);
    expect(await page.text()).toContain("Université dynamique");

    const r = await poster(jeton);
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("org.imsglobal.lti.close");
    expect(nouvelle.inscriptions).toHaveLength(1);
    const envoi = nouvelle.inscriptions[0]!;
    expect(envoi.autorisation).toBe("Bearer jeton-plateforme");
    expect(envoi.corps).toMatchObject({
      initiate_login_uri: `${OUTIL}/api/lti/connexion`,
      redirect_uris: [`${OUTIL}/api/lti/lancement`],
      jwks_uri: `${OUTIL}/api/lti/jwks`,
    });
    const conf = envoi.corps["https://purl.imsglobal.org/spec/lti-tool-configuration"] as { claims: string[] };
    expect(conf.claims).not.toContain("email");
    const [p] = await db.select().from(ltiPlateformes).where(eq(ltiPlateformes.issuer, nouvelle.issuer));
    expect(p).toMatchObject({
      clientId: nouvelle.clientId,
      deploymentIds: [nouvelle.deploymentId],
      organizationId: org,
      inscription: "dynamique",
      actif: true,
    });
    // La plateforme inscrite lance aussitôt.
    expect(await lancement({ sub: "prof-dyn", role: "enseignant", ressource: "r" }, nouvelle)).toBe("/lti/activite");
  });

  it("refuse un jeton déjà utilisé", async () => {
    const jeton = await creerJetonInscription({ organizationId: org, adminId: await administrateur(org) });
    expect((await poster(jeton)).status).toBe(200);
    const avant = nouvelle.inscriptions.length;
    const r = await poster(jeton);
    expect(r.status).toBe(403);
    expect(nouvelle.inscriptions.length).toBe(avant);
  });
});

describe("la sélection de contenu (Deep Linking 2.0)", () => {
  it("l'enseignant choisit une partie ; la réponse est signée par la clé publiée de l'outil ; l'activité posée arrive reliée", async () => {
    // Un enseignant et une de ses parties.
    await lancement({ sub: "prof-dl", role: "enseignant", ressource: "pour-creer-le-compte" });
    const enseignantId = contexte()!.u;
    const { gameId } = await createClassGame({
      teacherId: enseignantId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 2,
      botCount: 1,
      level: 2,
    });

    bocal.clear();
    const { state, nonce } = await connexion();
    const r = await lancer(sim.idToken({ sub: "prof-dl", role: "enseignant", selection: true }, nonce), state);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-security-policy")).toContain(`frame-ancestors ${sim.base}`);
    const html = await r.text();
    expect(html).toContain(`value="partie:${gameId}"`);
    const ticket = /name="ticket" value="([^"]+)"/.exec(html)![1]!;

    const poster = (cible: string) =>
      selectionPost(
        new Request(`${OUTIL}/api/lti/selection`, {
          method: "POST",
          body: new URLSearchParams({ ticket, cible }),
          headers: { "content-type": "application/x-www-form-urlencoded" },
        }),
      );
    const reponse = await poster(`partie:${gameId}`);
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get("content-security-policy")).toContain(`form-action 'self' ${sim.base}`);
    const retour = await reponse.text();
    expect(retour).toContain(`action="${sim.base}/retour-selection"`);
    const jwt = /name="JWT" value="([^"]+)"/.exec(retour)![1]!;

    // Vérifiable par la clé publique PUBLIÉE (JWKS) de l'outil.
    const [e, c, s] = jwt.split(".") as [string, string, string];
    const entete = JSON.parse(Buffer.from(e, "base64url").toString());
    expect(entete.alg).toBe("RS256");
    const { keys } = (await jwks().json()) as { keys: { kid: string }[] };
    const jwk = keys.find((k) => k.kid === entete.kid)!;
    const cle = createPublicKey({ key: jwk as never, format: "jwk" });
    expect(verify("RSA-SHA256", Buffer.from(`${e}.${c}`), cle, Buffer.from(s, "base64url"))).toBe(true);
    const charge = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(charge).toMatchObject({
      iss: sim.clientId,
      aud: sim.issuer,
      "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingResponse",
      "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id": sim.deploymentId,
      "https://purl.imsglobal.org/spec/lti-dl/claim/data": "donnees-opaques",
    });
    const [item] = charge["https://purl.imsglobal.org/spec/lti-dl/claim/content_items"];
    expect(item).toMatchObject({
      type: "ltiResourceLink",
      url: `${OUTIL}/api/lti/lancement`,
      custom: { ba_cible: `partie:${gameId}` },
    });

    // Le ticket ne sert qu'une fois.
    expect((await poster(`partie:${gameId}`)).status).toBe(400);

    // L'activité posée par la plateforme porte la cible : l'élève arrive directement.
    expect(
      await lancement({ sub: "eleve-dl", role: "eleve", prenom: "Inès", ressource: "activite-dl", custom: item.custom }),
    ).toBe(`/arena/${gameId}`);
  });

  it("une cible qui n'est pas à l'enseignant est refusée", async () => {
    const autre = await lancement({ sub: "prof-dl-2", role: "enseignant", ressource: "z" }).then(() => contexte()!.u);
    const cohorte = await creerCohorteDeLEnseignant({ enseignantId: autre, nom: "C", episodes: [EPISODES[0]!.code] });
    bocal.clear();
    const { state, nonce } = await connexion();
    const html = await (await lancer(sim.idToken({ sub: "prof-dl", role: "enseignant", selection: true }, nonce), state)).text();
    const ticket = /name="ticket" value="([^"]+)"/.exec(html)![1]!;
    const r = await selectionPost(
      new Request(`${OUTIL}/api/lti/selection`, {
        method: "POST",
        body: new URLSearchParams({ ticket, cible: `cohorte:${cohorte.id}` }),
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
    );
    expect(r.status).toBe(400);
  });

  it("un élève ne peut pas sélectionner de contenu", async () => {
    bocal.clear();
    const { state, nonce } = await connexion();
    const r = await lancer(sim.idToken({ sub: "eleve-x", role: "eleve", selection: true }, nonce), state);
    expect(r.status).toBe(403);
  });
});

describe("rien de l'id_token n'est rendu sans échappement", () => {
  it("un titre de cours piégé ne devient pas du HTML dans l'écran de sélection", async () => {
    // Le titre de la partie vient de l'enseignant, celui du cours de la plateforme ; la page
    // de sélection n'affiche que des données échappées.
    const { echapper } = await import("@/lti/html");
    expect(echapper(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });
});
