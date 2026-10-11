import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { organisationSousLicence } from "./helpers/licence";
import { SimulateurLti, type Personne } from "../helpers/simulateur-lti";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import { REFUS_DE_LA_CLASSE } from "../../src/config/tarifs";

/**
 * LTI 1.3 DANS UN VRAI NAVIGATEUR, SUR LE BUILD DE PRODUCTION.
 *
 * Un simulateur de plateforme (tests/helpers/simulateur-lti.ts) tient le rôle de Moodle :
 * le navigateur ouvre sa page de lancement, qui poste la connexion OIDC à l'outil,
 * suit la redirection vers l'authentification du simulateur, qui poste à son tour
 * l'`id_token` signé au lancement de l'outil. Exactement le chemin d'un clic dans un
 * cours, formulaires auto-soumis compris.
 *
 * Le serveur doit tourner avec `LTI_HTTP_LOCAL=1` (le simulateur sert ses clés en HTTP
 * sur 127.0.0.1) et une `LTI_PRIVATE_KEY`.
 *
 * Parcours : l'enseignant configure l'activité vers une nouvelle partie ; deux élèves y
 * arrivent (l'un avec son prénom, l'autre le choisit) et jouent leur tour ; l'enseignant
 * les voit au pilotage. Puis une activité vers une cohorte sous licence épisodes ; une
 * activité non configurée ; une organisation sans licence ; la sélection de contenu ;
 * l'inscription dynamique et /admin/lti ; la page /integration.
 */

const CAPTURES = process.env.CAPTURES_LTI;
async function capture(page: Page, nom: string) {
  if (!CAPTURES) return;
  mkdirSync(CAPTURES, { recursive: true });
  await page.screenshot({ path: join(CAPTURES, `${nom}.png`), fullPage: true });
}

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

/** Inscrire le simulateur pour une organisation, comme le ferait /admin/lti. */
async function inscrire(s: SimulateurLti, orgId: string): Promise<void> {
  const d = s.description();
  await base((c) =>
    c.query(
      `insert into lti_plateformes (nom, issuer, client_id, deployment_ids, url_authentification, url_jeton, url_jwks, organization_id, sel)
       values ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)`,
      [
        "Simulateur",
        d.issuer,
        d.clientId,
        JSON.stringify(d.deploymentIds),
        d.urlAuthentification,
        d.urlJeton,
        d.urlJwks,
        orgId,
        randomBytes(16).toString("base64url"),
      ],
    ),
  );
}

let navigateur: Browser;
let sim: SimulateurLti;
let simSansLicence: SimulateurLti;
let orgId: string;
let gameId = "";
const contextes: BrowserContext[] = [];

async function nouvellePage(largeur = 1280): Promise<Page> {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: 900 } });
  contextes.push(ctx);
  return ctx.newPage();
}

/** Un clic dans le cours : la page de lancement du simulateur, jusqu'à l'arrivée dans l'outil. */
async function lancer(page: Page, p: Personne, s: SimulateurLti = sim): Promise<string> {
  await page.goto(s.preparer(p));
  await page.waitForURL((u) => u.origin === new URL(BASE).origin && !u.pathname.startsWith("/api/"), { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  return new URL(page.url()).pathname;
}

/** Joue le tour avec les valeurs proposées (comme parcours.e2e.ts). */
async function jouerLeTour(page: Page): Promise<void> {
  const raccourci = page.getByRole("button", { name: /Prendre mes décisions/ }).first();
  if (await raccourci.isVisible().catch(() => false)) await raccourci.click();
  else await page.getByRole("tab", { name: /Décider/ }).first().click();
  for (let i = 0; i < 10; i++) {
    const suivant = page.getByRole("button", { name: /^Suivant/ }).first();
    if (!(await suivant.isVisible().catch(() => false))) break;
    await suivant.click();
  }
  await page.getByRole("button", { name: /Valider les décisions de l'équipe/ }).click();
  const garder = page.getByRole("button", { name: /je garde ces valeurs/ });
  if (await garder.isVisible({ timeout: 5_000 }).catch(() => false)) await garder.click();
  await page.waitForTimeout(2_000);
  await aller(page, new URL(page.url()).pathname);
  expect(await texte(page)).toContain("Décisions enregistrées");
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  sim = await new SimulateurLti().demarrer(BASE);
  simSansLicence = await new SimulateurLti().demarrer(BASE);
  // Une licence Campus qui inclut les épisodes : la partie de classe ET la cohorte.
  orgId = await organisationSousLicence("Lycée LTI e2e", { arene: "campus", episodes: true });
  await inscrire(sim, orgId);
  const sansLicence = await base(async (c) => {
    const { rows } = await c.query(
      "insert into organizations (name, slug, kind) values ($1, $2, 'school') returning id",
      ["Lycée sans licence LTI", `e2e-${randomUUID()}`],
    );
    return rows[0].id as string;
  });
  await inscrire(simSansLicence, sansLicence);
});

afterAll(async () => {
  for (const c of contextes) await c.close().catch(() => undefined);
  await navigateur?.close();
  await sim?.arreter();
  await simSansLicence?.arreter();
});

describe("une activité reliée à une partie de classe", () => {
  let prof: Page;

  it("l'enseignant arrive sur l'écran de l'activité et crée la partie", async () => {
    prof = await nouvellePage();
    expect(await lancer(prof, { sub: "prof-e2e", role: "enseignant", prenom: "Claire", ressource: "act-partie", titre: "Simulation du trimestre", cours: "BTS MCO 1" })).toBe("/lti/activite");
    const vu = await texte(prof);
    expect(vu).toContain("Que doit ouvrir cette activité ?");
    expect(vu).toContain("Simulation du trimestre");
    expect(vu).toContain("Une nouvelle partie de classe");
    expect(vu).toContain("Une nouvelle cohorte d'épisodes");
    await capture(prof, "activite-enseignant");
    await prof.selectOption('select[name="humanTeamsCount"]', "2");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.selectOption('select[name="level"]', "2");
    await prof.getByRole("button", { name: /Créer la partie et y relier/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    gameId = new URL(prof.url()).pathname.split("/").pop()!;
  });

  it("son lancement suivant le mène au pilotage", async () => {
    expect(await lancer(prof, { sub: "prof-e2e", role: "enseignant", ressource: "act-partie" })).toBe(`/teacher/games/${gameId}`);
  });

  let lea: Page;
  let max: Page;
  it("une élève dont la plateforme envoie le prénom arrive dans la partie", async () => {
    lea = await nouvellePage();
    expect(await lancer(lea, { sub: "eleve-lea", role: "eleve", prenom: "Léa", ressource: "act-partie" })).toBe(`/arena/${gameId}`);
    await capture(lea, "eleve-dans-sa-partie");
  });

  it("un élève sans prénom le choisit, puis entre", async () => {
    max = await nouvellePage();
    expect(await lancer(max, { sub: "eleve-max", role: "eleve", ressource: "act-partie" })).toBe("/lti/eleve");
    expect(await texte(max)).toContain("Votre prénom, et vous entrez");
    await max.fill('input[name="pseudo"]', "Max");
    await max.getByRole("button", { name: "Entrer dans la partie" }).click();
    await max.waitForURL(new RegExp(`/arena/${gameId}`), { timeout: 30_000 });
  });

  it("les deux jouent leur tour", async () => {
    await jouerLeTour(lea);
    await jouerLeTour(max);
  });

  it("l'enseignant les voit au pilotage", async () => {
    await aller(prof, `/teacher/games/${gameId}`);
    const vu = await texte(prof);
    expect(vu).toContain("Léa");
    expect(vu).toContain("Max");
  });
});

describe("une activité pas encore configurée", () => {
  it("l'élève lit que son enseignant n'a pas encore choisi la partie", async () => {
    const p = await nouvellePage();
    expect(await lancer(p, { sub: "eleve-attente", role: "eleve", prenom: "Nora", ressource: "act-vide" })).toBe("/lti/eleve");
    expect(await texte(p)).toContain("Votre enseignant n'a pas encore choisi la partie");
    await capture(p, "activite-pas-encore-configuree");
  });
});

describe("une activité reliée à une cohorte d'épisodes (licence avec épisodes)", () => {
  it("l'enseignant crée la cohorte, l'élève y est inscrit en cliquant", async () => {
    const prof = await nouvellePage();
    expect(await lancer(prof, { sub: "prof-cohorte", role: "enseignant", ressource: "act-cohorte", cours: "Management" })).toBe("/lti/activite");
    const code = EPISODES[0]!.code;
    const caseACocher = prof.locator(`input[name="episodes"][value="${code}"]`);
    await prof.locator(`details[data-repliable]:has(input[value="${code}"]) > summary`).click();
    await caseACocher.check();
    await prof.getByRole("button", { name: /Créer la cohorte et y relier/ }).click();
    await prof.waitForURL(/\/teacher\/cohortes\//, { timeout: 30_000 });
    const eleve = await nouvellePage();
    const arrivee = await lancer(eleve, { sub: "eleve-cohorte", role: "eleve", ressource: "act-cohorte" });
    expect(arrivee).toBe("/entreprises/episode/profil");
    expect(await texte(eleve)).toContain("Management");
  });
});

describe("une organisation sans licence", () => {
  it("l'enseignant voit le message habituel et le lien vers les tarifs", async () => {
    const p = await nouvellePage();
    expect(await lancer(p, { sub: "prof-sans", role: "enseignant", ressource: "act" }, simSansLicence)).toBe("/lti/activite");
    const vu = await texte(p);
    expect(vu).toContain(REFUS_DE_LA_CLASSE);
    expect(await p.getByRole("link", { name: "Voir les tarifs" }).count()).toBeGreaterThan(0);
    expect(await p.locator('select[name="level"]').count()).toBe(0);
  });

  it("l'élève lit que l'activité n'est pas encore ouverte, sans un mot de vente", async () => {
    const p = await nouvellePage();
    expect(await lancer(p, { sub: "eleve-sans", role: "eleve", ressource: "act" }, simSansLicence)).toBe("/lti/eleve");
    // Le contenu de la page, sans l'en-tête du site (dont le menu mène aux tarifs).
    const vu = await p.locator("main").innerText();
    expect(vu).toContain("Cette activité n'est pas encore ouverte");
    expect(vu).toContain("Prévenez votre enseignant");
    expect(vu).not.toMatch(/tarif|licence|offre|devis/i);
  });
});

describe("la sélection de contenu", () => {
  it("l'enseignant choisit sa partie ; la plateforme reçoit le jeton de réponse", async () => {
    const p = await nouvellePage();
    await p.goto(sim.preparer({ sub: "prof-e2e", role: "enseignant", selection: true }));
    await p.waitForSelector(`input[value="partie:${gameId}"]`, { timeout: 30_000 });
    await p.check(`input[value="partie:${gameId}"]`);
    await p.getByRole("button", { name: "Ajouter l'activité" }).click();
    await p.waitForURL(`${sim.base}/retour-selection`, { timeout: 30_000 });
    expect(sim.reponsesDeSelection).toHaveLength(1);
    const charge = JSON.parse(Buffer.from(sim.reponsesDeSelection[0]!.split(".")[1]!, "base64url").toString());
    expect(charge["https://purl.imsglobal.org/spec/lti-dl/claim/content_items"][0].custom.ba_cible).toBe(`partie:${gameId}`);
  });
});

/** Une session d'administrateur général, signée comme lib/session.ts. */
async function administrateur(ctx: BrowserContext): Promise<void> {
  const userId = await base(async (c) => {
    const { rows } = await c.query(
      "insert into users (email, display_name, is_platform_admin) values ($1, 'Admin E2E', true) returning id",
      [`admin-${randomUUID()}@e2e.test`],
    );
    return rows[0].id as string;
  });
  const now = Date.now();
  const corps = Buffer.from(JSON.stringify({ id: userId, role: "teacher", v: 1, iat: now, exp: now + 3600_000 })).toString("base64url");
  const signature = createHmac("sha256", process.env.AUTH_SECRET!).update(corps).digest("hex").slice(0, 32);
  await ctx.addCookies([{ name: "ba_session", value: `${corps}.${signature}`, url: BASE }]);
}

describe("l'inscription dynamique depuis /admin/lti", () => {
  it("l'administrateur crée un jeton ; la plateforme colle l'adresse et l'outil s'inscrit", async () => {
    const admin = await nouvellePage();
    await administrateur(admin.context());
    await aller(admin, "/admin/lti");
    const vu = await texte(admin);
    expect(vu).toContain("Les adresses à donner à l'établissement");
    expect(vu).toContain(`${BASE}/api/lti/connexion`);
    await admin.locator("#jetons select[name=organisation]").selectOption({ label: "Lycée LTI e2e" });
    await admin.getByRole("button", { name: "Créer un jeton d'inscription" }).click();
    await admin.waitForURL(/fait=jeton/, { timeout: 30_000 });
    await admin.waitForLoadState("networkidle");
    await capture(admin, "admin-lti");
    const adresse = (await admin.locator("[data-jeton-lti] code").first().innerText()).trim();
    expect(adresse).toMatch(/\/api\/lti\/inscription\?jeton=/);

    const plateforme = await new SimulateurLti().demarrer(BASE);
    try {
      const page = await nouvellePage();
      await page.goto(
        `${adresse}&openid_configuration=${encodeURIComponent(`${plateforme.base}/.well-known/openid-configuration`)}&registration_token=t`,
      );
      expect(await texte(page)).toContain("Lycée LTI e2e");
      await page.getByRole("button", { name: "Inscrire Business Arena" }).click();
      await page.waitForSelector("text=Business Arena est inscrit", { timeout: 30_000 });
      expect(plateforme.inscriptions).toHaveLength(1);
      // L'adresse a servi : elle ne sert plus.
      await page.goto(`${adresse}&openid_configuration=${encodeURIComponent(`${plateforme.base}/.well-known/openid-configuration`)}`);
      expect(await texte(page)).toContain("n'est plus valable");
      // La plateforme inscrite lance aussitôt.
      const prof = await nouvellePage();
      expect(await lancer(prof, { sub: "prof-dyn", role: "enseignant", ressource: "r" }, plateforme)).toBe("/lti/activite");
    } finally {
      await plateforme.arreter();
    }
  });
});

describe("la page /integration", () => {
  for (const largeur of [1280, 390]) {
    it(`se lit à ${largeur} px, sans défilement horizontal`, async () => {
      const p = await nouvellePage(largeur);
      await aller(p, "/integration");
      const vu = await texte(p);
      expect(vu).toContain("Ajouter Business Arena à Moodle en deux minutes");
      expect(vu).toContain(`/api/lti/jwks`);
      expect(vu).toMatch(/Aucun courriel ni nom de famille d.élève/);
      const debord = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(debord).toBeLessThanOrEqual(0);
      await capture(p, `integration-${largeur}`);
    });
  }
});
