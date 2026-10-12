import { randomBytes } from "node:crypto";
import type { JsonWebKey } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { organisationSousLicence } from "./helpers/licence";
import { mesurerContraste } from "./helpers/contraste";
import { SimulateurLti, type Personne } from "../helpers/simulateur-lti";
import { CarnetDeNotes } from "../helpers/carnet-de-notes";

/**
 * LA NOTE D'UN EXAMEN DANS LE CARNET DE NOTES DE LA PLATEFORME (LTI Advantage, AGS 1.3),
 * DANS UN VRAI NAVIGATEUR, SUR LE BUILD DE PRODUCTION ET SA BASE.
 *
 * Le simulateur de plateforme (tests/helpers/simulateur-lti.ts) lance l'outil avec la
 * revendication du service de notes ; le carnet factice (tests/helpers/carnet-de-notes.ts)
 * sert le jeton et les notes, et vérifie la signature de l'outil par son JWKS PUBLIÉ.
 *
 * Parcours : l'enseignant ouvre l'activité depuis le cours (la page de l'activité dit que
 * la plateforme accepte les notes), crée un examen, y relie l'activité ; une candidate
 * passe l'examen depuis le cours ; l'enseignant publie ; la plateforme a reçu la note,
 * et l'encart l'affiche (« Notes envoyées à Moodle : 1/1 »). Puis le retrait et le renvoi.
 * Un seul bouton plein par écran, aucun texte sous le seuil de contraste, aucun
 * défilement de côté à 390.
 *
 * Le serveur doit tourner avec `LTI_HTTP_LOCAL=1` et une `LTI_PRIVATE_KEY`.
 * Captures : `CAPTURES=<dossier>`.
 */

const CAPTURES = process.env.CAPTURES;
let navigateur: Browser;
let sim: SimulateurLti;
let carnet: CarnetDeNotes;
let prof: Page;
let examenId = "";
let code = "";
let noteAffichee = "";
const contextes: BrowserContext[] = [];

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

async function nouvellePage(mobile = false): Promise<Page> {
  const ctx = await navigateur.newContext(
    mobile
      ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" }
      : { viewport: { width: 1280, height: 900 }, locale: "fr-FR" },
  );
  await ctx.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
  contextes.push(ctx);
  return ctx.newPage();
}

async function capture(p: Page, nom: string): Promise<void> {
  if (!CAPTURES) return;
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${CAPTURES}/${nom}.png`, fullPage: true });
}

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

const pleinsVisibles = (p: Page) =>
  p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("main .bouton-plein")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && e.checkVisibility({ visibilityProperty: true });
      })
      .map((e) => e.textContent?.trim() ?? ""),
  );

async function sansTexteIllisible(p: Page): Promise<void> {
  const fautes = (await mesurerContraste(p, "clair")).filter((m) => m.ratio < m.seuil);
  expect(fautes, JSON.stringify(fautes.slice(0, 5))).toEqual([]);
}

/** Un clic dans le cours : la page de lancement du simulateur, jusqu'à l'arrivée dans l'outil. */
async function lancer(page: Page, p: Personne): Promise<string> {
  await page.goto(sim.preparer({ ...p, revendications: carnet.revendication() }));
  await page.waitForURL((u) => u.origin === new URL(BASE).origin && !u.pathname.startsWith("/api/"), { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  return new URL(page.url()).pathname;
}

/** Un tour de l'arène, comme le joueur (examen.e2e.ts). */
async function jouerUnTour(p: Page, urlArene: string): Promise<void> {
  await p.goto(urlArene, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(400);
  }
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(800);
  const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
  if (await ouvrir.isVisible().catch(() => false)) {
    await ouvrir.click();
    await p.waitForTimeout(1_000);
    const note = p.getByRole("button", { name: /pris note/ }).first();
    if (await note.isVisible().catch(() => false)) await note.click();
  }
  const avancer = p.getByRole("button", { name: /^(Suivant|Continuer|Analyser|Décider|Accepter$)/ });
  for (let k = 0; k < 40; k++) {
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) break;
    const visibles = [];
    for (const b of await avancer.all()) if (await b.isVisible().catch(() => false)) visibles.push(b);
    if (visibles.length === 0) throw new Error("aucun bouton pour avancer dans le tour");
    await visibles[visibles.length - 1]!.click();
    await p.waitForTimeout(300);
  }
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  if (await garder.count()) await garder.first().click();
  await p.waitForURL(/simule/, { timeout: 180_000 });
}

/** Relit la page de l'examen jusqu'à ce que l'encart dise `attendu`. */
async function attendreLEncart(p: Page, attendu: RegExp): Promise<string> {
  let lu = "";
  for (let i = 0; i < 30; i++) {
    lu = (await p.locator("[data-resume-du-retour]").innerText().catch(() => "")).replace(/[  ]/g, " ");
    if (attendu.test(lu)) return lu;
    await p.waitForTimeout(2_000);
    await aller(p, `/teacher/examens/${examenId}`);
  }
  throw new Error(`l'encart dit « ${lu} »`);
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  sim = await new SimulateurLti().demarrer(BASE);
  carnet = await new CarnetDeNotes(
    () => sim.clientId,
    async () => ((await (await fetch(`${BASE}/api/lti/jwks`)).json()) as { keys: JsonWebKey[] }).keys,
  ).demarrer();
  const orgId = await organisationSousLicence("Lycée des notes e2e", { arene: "campus" });
  const d = sim.description();
  await base((c) =>
    c.query(
      `insert into lti_plateformes (nom, issuer, client_id, deployment_ids, url_authentification, url_jeton, url_jwks, organization_id, sel)
       values ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)`,
      [
        "Moodle de l'école",
        d.issuer,
        d.clientId,
        JSON.stringify(d.deploymentIds),
        d.urlAuthentification,
        carnet.urlJeton,
        d.urlJwks,
        orgId,
        randomBytes(16).toString("base64url"),
      ],
    ),
  );
}, 60_000);

afterAll(async () => {
  for (const c of contextes) await c.close().catch(() => undefined);
  await navigateur?.close();
  await sim?.arreter();
  await carnet?.arreter();
});

describe("la note d'un examen part dans le carnet de la plateforme", () => {
  it("la page de l'activité dit que la plateforme accepte les notes", async () => {
    prof = await nouvellePage();
    expect(await lancer(prof, { sub: "prof-notes-e2e", role: "enseignant", prenom: "Claire", ressource: "act-notes", titre: "Partiel de gestion" })).toBe(
      "/lti/activite",
    );
    const encart = prof.locator('[data-retour-des-notes="accorde"]');
    expect(await encart.innerText()).toMatch(/^Moodle accepte les notes de cette activité : celles d'un examen y partiront à la publication des résultats\./);
    expect(await debordement(prof)).toBeLessThanOrEqual(0);
    await capture(prof, "activite-retour-des-notes-1280");
    const m = await nouvellePage(true);
    await m.context().addCookies(await prof.context().cookies());
    await aller(m, "/lti/activite");
    expect(await m.locator('[data-retour-des-notes="accorde"]').count()).toBe(1);
    expect(await debordement(m)).toBeLessThanOrEqual(0);
    await capture(m, "activite-retour-des-notes-390");
  });

  it("l'enseignant crée l'examen et y relie l'activité", async () => {
    await aller(prof, "/teacher/examens");
    await prof.getByLabel("Nom de l'examen").fill("Partiel de gestion");
    await prof.getByLabel("Niveau").selectOption("1");
    await prof.getByLabel("Nombre de tours").fill("1");
    await prof.getByRole("button", { name: "Créer l'examen" }).click();
    await prof.waitForURL(/\/teacher\/examens\/[0-9a-f-]{36}\?cree=1$/, { timeout: 120_000 });
    examenId = prof.url().match(/examens\/([0-9a-f-]{36})/)![1]!;
    code = (await prof.locator("#code-de-l-examen").textContent())!.trim();
    expect(await lancer(prof, { sub: "prof-notes-e2e", role: "enseignant", ressource: "act-notes" })).toBe("/lti/activite");
    await prof.getByRole("button", { name: /Relier l'activité à cet examen/ }).click();
    await prof.waitForURL(new RegExp(`/teacher/examens/${examenId}`), { timeout: 30_000 });
    await prof.waitForLoadState("networkidle");
    expect(await prof.locator('[data-retour-des-notes="accorde"]').count()).toBe(1);
    expect(await prof.locator("[data-resume-du-retour]").innerText()).toMatch(
      /Moodle accepte les notes de cet examen\. Elles y partiront à la publication des résultats/,
    );
  }, 180_000);

  it("une candidate passe l'examen depuis le cours", async () => {
    const ines = await nouvellePage(true);
    expect(await lancer(ines, { sub: "eleve-ines-e2e", role: "eleve", prenom: "Inès", ressource: "act-notes" })).toBe(`/examen/${code}`);
    expect(await ines.locator("[data-identification]").getAttribute("data-identification")).toBe("lti");
    await ines.getByRole("button", { name: "Commencer l'examen" }).click();
    await ines.waitForURL(/\/arena\/[0-9a-f-]{36}/, { timeout: 120_000 });
    const urlArene = ines.url().split("?")[0]!.split("#")[0]!;
    await jouerUnTour(ines, urlArene);
    await ines.goto(urlArene, { waitUntil: "networkidle" });
    await ines.locator("[data-recu-d-examen]").waitFor({ timeout: 60_000 });
    // Rien n'est parti : les résultats ne sont pas publiés.
    expect(carnet.notes).toHaveLength(0);
  }, 300_000);

  it("l'enseignant publie : la plateforme a reçu la note, l'encart l'affiche", async () => {
    // La copie est notée après la réponse à la candidate : on attend sa note.
    for (let i = 0; i < 30; i++) {
      await aller(prof, `/teacher/examens/${examenId}`);
      if ((await prof.locator('[data-etat="notee"]').count()) === 1) break;
      await prof.waitForTimeout(2_000);
    }
    noteAffichee = (await prof.locator('[data-etat="notee"] td').nth(3).innerText()).trim();
    expect(noteAffichee).toMatch(/^\d+(,\d)?$/);
    expect(await pleinsVisibles(prof)).toEqual(["Publier les résultats"]);
    await prof.getByRole("button", { name: "Publier les résultats" }).click();
    await prof.waitForURL(/fait=publie/, { timeout: 60_000 });
    const lu = await attendreLEncart(prof, /^Notes envoyées à Moodle : 1\/1$/);
    expect(lu).toBe("Notes envoyées à Moodle : 1/1");
    // La plateforme a reçu LA note, pour CETTE candidate, dans une colonne de l'outil.
    const [s] = carnet.notesDe("eleve-ines-e2e");
    expect(s).toMatchObject({
      scoreGiven: Number(noteAffichee.replace(",", ".")),
      scoreMaximum: 100,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
    });
    expect(carnet.refusDeJeton).toEqual([]);
    expect(carnet.colonnes.map((c) => c.label)).toEqual(["Business Arena · Partiel de gestion"]);
    expect((await pleinsVisibles(prof)).length).toBeLessThanOrEqual(1);
    await sansTexteIllisible(prof);
    expect(await debordement(prof)).toBeLessThanOrEqual(0);
    await prof.locator("[data-retour-des-notes]").scrollIntoViewIfNeeded();
    await capture(prof, "examen-notes-envoyees-1280");
    const m = await nouvellePage(true);
    await m.context().addCookies(await prof.context().cookies());
    await aller(m, `/teacher/examens/${examenId}`);
    expect((await m.locator("[data-resume-du-retour]").innerText()).replace(/[  ]/g, " ")).toBe("Notes envoyées à Moodle : 1/1");
    expect(await debordement(m)).toBeLessThanOrEqual(0);
    await capture(m, "examen-notes-envoyees-390");
  }, 180_000);

  it("« Renvoyer les notes » renvoie ; le retrait remet la note en attente", async () => {
    const avant = carnet.notes.length;
    await prof.getByRole("button", { name: "Renvoyer les notes" }).click();
    await prof.waitForURL(/fait=renvoi/, { timeout: 60_000 });
    expect(await texte(prof)).toContain("Les notes repartent vers la plateforme de cours");
    await attendreLEncart(prof, /^Notes envoyées à Moodle : 1\/1$/);
    for (let i = 0; i < 20 && carnet.notes.length === avant; i++) await prof.waitForTimeout(500);
    expect(carnet.notes).toHaveLength(avant + 1);
    expect(carnet.colonnes).toHaveLength(1);

    await prof.getByRole("button", { name: "Retirer la publication" }).click();
    await prof.waitForURL(/fait=retire/, { timeout: 60_000 });
    expect(await attendreLEncart(prof, /^Notes retirées de Moodle : 1\/1/)).toBe("Notes retirées de Moodle : 1/1 (en attente d'une nouvelle publication)");
    const derniere = carnet.notesDe("eleve-ines-e2e").at(-1)!;
    expect(derniere).toMatchObject({ gradingProgress: "Pending" });
    expect(derniere).not.toHaveProperty("scoreGiven");
    await sansTexteIllisible(prof);
  }, 180_000);

  it("la page /integration explique le retour des notes", async () => {
    for (const mobile of [false, true]) {
      const p = await nouvellePage(mobile);
      await aller(p, "/integration");
      const section = p.locator("#notes");
      expect(await section.innerText()).toMatch(/Assignment and Grade/);
      expect(await section.innerText()).toMatch(/à la publication des résultats, pas avant/);
      expect(await texte(p)).not.toMatch(/À venir : le renvoi des notes/);
      expect(await debordement(p)).toBeLessThanOrEqual(0);
      await section.scrollIntoViewIfNeeded();
      if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/integration-notes-${mobile ? 390 : 1280}.png`, fullPage: false });
    }
  });
});
