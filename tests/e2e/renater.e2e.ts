import { createHmac, randomUUID } from "node:crypto";
import { cleDerivee } from "@/lib/cles";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { cohorteSousLicence, organisationSousLicence } from "./helpers/licence";
import { federationSimulee, pairesDuDossier, ServeurDeFederation, type Personne } from "../helpers/simulateur-saml";

/**
 * LA CONNEXION PAR L'ÉTABLISSEMENT (RENATER) DANS UN VRAI NAVIGATEUR, SUR LE BUILD DE
 * PRODUCTION.
 *
 * Une fédération simulée (tests/helpers/simulateur-saml.ts) sert, sur `localhost` (un
 * AUTRE site que le serveur, joint par 127.0.0.1 : la réponse arrive donc par un POST
 * d'un autre site, comme d'un vrai IdP) : l'agrégat signé, le service de découverte
 * (WAYF) et la page d'authentification des IdP, qui chiffre l'assertion pour le SP,
 * signe réponse et assertion, et poste à l'ACS par un formulaire auto-soumis.
 *
 * Le serveur tourne avec la configuration SAML pointant sur cette fédération :
 *   SAML_SP_PRIVATE_KEY, SAML_SP_CERT, SAML_FEDERATION_CERT_SHA256 (dossier E2E_SAML_CLES,
 *   hors du dépôt), SAML_FEDERATION_METADATA_URL=http://localhost:<port>/federation.xml,
 *   SAML_WAYF_URL=http://localhost:<port>/wayf, SAML_SP_ORIGIN=<E2E_BASE_URL>, SAML_HTTP_LOCAL=1.
 *
 * Parcours : les boutons (configurés) ; /admin/renater (lire l'agrégat, rattacher
 * l'université à son organisation sous licence) ; l'enseignant se connecte, arrive dans
 * son espace et crée une partie ; un étudiant arrive par le code, se connecte, rejoint ;
 * sur un autre appareil, il retrouve sa partie ; un établissement sans offre.
 */

const DOSSIER = process.env.E2E_SAML_CLES ?? "";
const PORT = Number(process.env.E2E_SAML_PORT ?? 5971);
const CAPTURES = process.env.CAPTURES_RENATER;

async function capture(page: Page, nom: string, entiere = true) {
  if (!CAPTURES) return;
  mkdirSync(CAPTURES, { recursive: true });
  await page.screenshot({ path: join(CAPTURES, `${nom}.png`), fullPage: entiere });
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

let navigateur: Browser;
let serveur: ServeurDeFederation;
let orgNom = "";
let codePartie = "";
let gameId = "";
const contextes: BrowserContext[] = [];

async function nouvellePage(largeur = 1280): Promise<Page> {
  const ctx = await navigateur.newContext(
    largeur === 390
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "fr-FR" }
      : { viewport: { width: largeur, height: 900 }, locale: "fr-FR" },
  );
  contextes.push(ctx);
  return ctx.newPage();
}

/** Le bouton, le WAYF de la fédération, l'IdP : jusqu'au retour sur Business Arena. */
async function seConnecter(page: Page, personne: Personne, etablissement = "Université de Test"): Promise<string> {
  serveur.personne = personne;
  await page.locator("[data-connexion-etablissement] a").click();
  await page.waitForURL((u) => u.hostname === "localhost" && u.pathname === "/wayf", { timeout: 30_000 });
  await page.getByRole("link", { name: etablissement }).click();
  await page.waitForURL((u) => u.origin === new URL(BASE).origin && !u.pathname.startsWith("/api/"), { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  const u = new URL(page.url());
  return u.pathname + u.search;
}

const enseignant = (n: string, domaine = "univ-test.fr"): Personne => ({
  pairwiseId: `${n}@${domaine}`,
  scopedAffiliations: [`faculty@${domaine}`, `member@${domaine}`],
  schac: domaine,
  displayName: `Mme ${n}`,
  mail: `${n}@${domaine}`,
});
const etudiant = (n: string, domaine = "univ-test.fr"): Personne => ({
  pairwiseId: `${n}@${domaine}`,
  scopedAffiliations: [`student@${domaine}`, `member@${domaine}`],
  schac: domaine,
  displayName: `Étudiant ${n}`,
  mail: `${n}@${domaine}`,
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
  const signature = createHmac("sha256", cleDerivee("session", process.env.AUTH_SECRET!)).update(corps).digest("hex").slice(0, 32);
  await ctx.addCookies([{ name: "ba_session", value: `${corps}.${signature}`, url: BASE }]);
}

beforeAll(async () => {
  if (!DOSSIER) throw new Error("E2E_SAML_CLES manquant : le dossier des clés de la fédération simulée");
  navigateur = await ouvrirNavigateur();
  const paires = pairesDuDossier((n) => readFileSync(join(DOSSIER, n), "utf8"));
  const sim = federationSimulee(`http://localhost:${PORT}`, paires);
  serveur = await new ServeurDeFederation(sim, PORT).demarrer();
  serveur.chiffrerPour = paires.sp.certificat;
  orgNom = `Université de Test e2e ${randomUUID().slice(0, 6)}`;
  await organisationSousLicence(orgNom, { arene: "campus", episodes: true });
});

afterAll(async () => {
  for (const c of contextes) await c.close().catch(() => undefined);
  await navigateur?.close();
  await serveur?.arreter();
});

describe("le bouton « Se connecter avec mon établissement », configuré", () => {
  for (const largeur of [1280, 390]) {
    it(`/teacher/login et /join à ${largeur} px : un bouton secondaire, sans débord`, async () => {
      const page = await nouvellePage(largeur);
      for (const [chemin, nom] of [
        ["/teacher/login", "bouton-teacher-login"],
        ["/join?code=ABC234", "bouton-join"],
      ] as const) {
        await aller(page, chemin);
        const bouton = page.locator("[data-connexion-etablissement] a");
        await expect(bouton.isVisible()).resolves.toBe(true);
        expect(await bouton.innerText()).toBe("Se connecter avec mon établissement");
        // Secondaire : un filet, jamais l'aplat orange (un seul bouton plein par écran).
        expect(await bouton.getAttribute("class")).toContain("bouton-filet");
        expect(await bouton.getAttribute("class")).not.toContain("bouton-plein");
        const href = await bouton.getAttribute("href");
        expect(href).toContain("/api/saml/connexion");
        if (chemin.startsWith("/join")) expect(decodeURIComponent(href!)).toContain("retour=/join?code=ABC234");
        const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(debord, `${chemin} déborde`).toBeLessThanOrEqual(0);
        await bouton.scrollIntoViewIfNeeded();
        await capture(page, `${nom}-${largeur}`, false);
      }
    });
  }

  it("sur l'invitation d'une cohorte : le bouton ramène à l'invitation", async () => {
    const code = await cohorteSousLicence("Cohorte RENATER e2e");
    const page = await nouvellePage();
    await aller(page, `/entreprises/episode/rejoindre?code=${code}`);
    const href = await page.locator("[data-connexion-etablissement] a").getAttribute("href");
    expect(decodeURIComponent(href!)).toContain(`retour=/entreprises/episode/rejoindre?code=${code}`);
  });

  it("les métadonnées du SP sont servies", async () => {
    const r = await fetch(`${BASE}/api/saml/metadata`);
    expect(r.status).toBe(200);
    expect(await r.text()).toContain('entityID="https://www.business-arena.fr/saml"');
  });
});

describe("/admin/renater", () => {
  it("l'administrateur lit l'agrégat, cherche l'université et la rattache à son organisation", async () => {
    const page = await nouvellePage();
    await administrateur(page.context());
    await aller(page, "/admin/renater");
    await page.getByRole("button", { name: "Relire l'agrégat maintenant" }).click();
    await page.waitForURL(/fait=agregat/, { timeout: 60_000 });
    expect(await texte(page)).toContain("Agrégat relu et vérifié.");
    await page.fill('input[name="q"]', "Test");
    await page.getByRole("button", { name: "Chercher" }).click();
    await page.waitForURL(/q=Test/);
    await page.locator('[data-idp="https://idp.univ-test.fr/idp/shibboleth"] a', { hasText: "Choisir" }).click();
    await page.waitForURL(/idp=/);
    expect(await page.inputValue('input[name="idp"]')).toBe("https://idp.univ-test.fr/idp/shibboleth");
    const valeur = await page.locator('select[name="organisation"] option', { hasText: orgNom }).getAttribute("value");
    await page.selectOption('select[name="organisation"]', valeur!);
    await page.getByRole("button", { name: "Rattacher l'établissement" }).click();
    await page.waitForURL(/fait=rattache/, { timeout: 30_000 });
    const rattachements = await page.locator("[data-rattachement]").allInnerTexts();
    expect(rattachements.some((t) => t.includes(orgNom) && t.includes("idp.univ-test.fr"))).toBe(true);
    await capture(page, "admin-renater");
  });
});

describe("l'enseignant de l'université", () => {
  it("se connecte avec son établissement, arrive dans son espace et crée une partie", async () => {
    const page = await nouvellePage();
    await aller(page, "/teacher/login");
    const arrivee = await seConnecter(page, enseignant("laurent"));
    expect(arrivee).toBe("/teacher");
    expect(await texte(page)).toContain("Mes parties");
    if ((await page.locator("#nouvelle-partie[open]").count()) === 0) await page.locator("#nouvelle-partie > summary").click();
    await page.selectOption('select[name="humanTeamsCount"]', "2");
    await page.selectOption('select[name="botCount"]', "1");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    await page.waitForURL(/\/teacher\/games\//, { timeout: 30_000 });
    gameId = new URL(page.url()).pathname.split("/").pop()!;
    codePartie = (await page.locator("#code-invitation").innerText()).trim();
    expect(codePartie).toMatch(/^[A-Z2-9]{6}$/);
    // Le compte : rattaché à l'organisation de l'université, nom transmis, courriel gardé.
    const ligne = await base(async (c) =>
      (
        await c.query(
          `select o.name, u.display_name, s.courriel from saml_comptes s join users u on u.id = s.user_id
           join organization_members m on m.user_id = u.id join organizations o on o.id = m.organization_id
           where s.role = 'enseignant' and u.display_name = 'Mme laurent'`,
        )
      ).rows[0],
    );
    expect(ligne).toMatchObject({ name: orgNom, courriel: "laurent@univ-test.fr" });
  });
});

describe("l'étudiant", () => {
  it("arrive par le code, se connecte avec son établissement, revient au code et rejoint la partie", async () => {
    const page = await nouvellePage(390);
    await aller(page, `/join?code=${codePartie}`);
    const arrivee = await seConnecter(page, etudiant("ines"));
    expect(arrivee).toBe(`/join?code=${codePartie}`);
    await page.fill('input[name="pseudo"]', "Inès");
    await page.getByRole("button", { name: "Rejoindre la partie" }).click();
    await page.waitForURL(/\/arena\//, { timeout: 30_000 });
    expect(new URL(page.url()).pathname).toBe(`/arena/${gameId}`);
    // Ni nom ni courriel de l'étudiant en base.
    const etudiants = await base(async (c) =>
      (
        await c.query(
          "select u.display_name, u.email, s.courriel from saml_comptes s join users u on u.id = s.user_id where s.role = 'etudiant'",
        )
      ).rows as { display_name: string; email: string; courriel: string | null }[],
    );
    expect(etudiants.length).toBeGreaterThan(0);
    for (const e of etudiants) {
      expect(e.display_name).not.toMatch(/Étudiant/);
      expect(e.email).toMatch(/@guest\.business-arena\.local$/);
      expect(e.courriel).toBeNull();
    }
  });

  it("sur un autre appareil, retrouve sa partie dans « Vos parties et cohortes »", async () => {
    const page = await nouvellePage(1280);
    await aller(page, "/join");
    const arrivee = await seConnecter(page, etudiant("ines"));
    // Venu de /join sans code : il y revient ; « Vos parties et cohortes » est la page de l'étudiant.
    expect(arrivee).toBe("/join");
    await aller(page, "/etablissement/parties");
    const parties = page.locator("[data-partie-rejointe]");
    expect(await parties.count()).toBe(1);
    expect(await parties.first().innerText()).toContain("Partie de classe");
    await capture(page, "etudiant-vos-parties-et-cohortes");
    await parties.first().getByRole("link", { name: "Reprendre" }).click();
    await page.waitForURL(new RegExp(`/arena/${gameId}`), { timeout: 30_000 });
  });

  it("sans code, la connexion mène à « Vos parties et cohortes »", async () => {
    const page = await nouvellePage(390);
    await aller(page, "/etablissement/refus?motif=inconnu");
    const arrivee = await seConnecter(page, etudiant("ines"));
    expect(arrivee).toBe("/etablissement/parties");
    expect(await page.locator("[data-partie-rejointe]").count()).toBe(1);
    await capture(page, "etudiant-vos-parties-390");
  });
});

describe("un établissement de la fédération sans offre", () => {
  it("l'enseignant lit que l'établissement n'a pas encore d'offre ; l'étudiant joue comme invité", async () => {
    const page = await nouvellePage();
    await aller(page, "/teacher/login");
    const arrivee = await seConnecter(page, enseignant("martin", "ecole-inconnue.fr"), "École sans offre");
    expect(arrivee).toBe("/etablissement/sans-offre");
    expect(await texte(page)).toContain("Votre établissement n'a pas encore d'offre Business Arena");
    expect(await page.getByRole("link", { name: "Demander un devis" }).getAttribute("href")).toBe("/devis");
    expect(await page.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe("/tarifs");
    await capture(page, "etablissement-sans-offre");

    const eleve = await nouvellePage(390);
    await aller(eleve, "/join");
    expect(await seConnecter(eleve, etudiant("paul", "ecole-inconnue.fr"), "École sans offre")).toBe("/join");
  });
});

describe("la section RENATER de /integration", () => {
  it("dit ce que voit l'utilisateur, les données reçues, et à qui c'est ouvert", async () => {
    const page = await nouvellePage();
    await aller(page, "/integration#renater");
    const section = page.locator("#renater");
    const t = await section.innerText();
    expect(t).toContain("Se connecter avec l'établissement (RENATER)");
    expect(t).toContain("Fédération Éducation-Recherche");
    expect(t).toContain("pairwise-id");
    await section.scrollIntoViewIfNeeded();
    if (CAPTURES) await section.screenshot({ path: join(CAPTURES, "integration-renater.png") });
  });
});
