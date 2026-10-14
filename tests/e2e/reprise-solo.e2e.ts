import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * UNE PARTIE SOLO SE RETROUVE, DANS UN VRAI NAVIGATEUR.
 *
 * Le joueur lance une partie, la quitte, revient : on lui propose de la
 * reprendre — sur /jouer comme sur l'accueil, qui reste pourtant statique. Puis
 * son téléphone « perd » ses cookies : le code personnel, noté dans le menu de
 * la partie, la lui rend sur un appareil neuf.
 */

let navigateur: Browser;
let contexte: BrowserContext;
let page: Page;
let urlPartie = "";
let code = "";

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
  page = await contexte.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("reprendre une partie solo", () => {
  it("un premier visiteur n'a rien à reprendre", async () => {
    await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    expect(await page.locator("[data-reprendre-ma-partie]").count()).toBe(0);
    await page.getByRole("heading", { name: "Lancez votre première partie" }).waitFor();
  });

  it("lance une partie", async () => {
    await page.getByRole("button", { name: /NOVA/ }).click();
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\/|trop=1/, { timeout: 60_000 });
    if (page.url().includes("trop=1")) {
      throw new Error(
        "Plafond de parties par heure atteint sur cette base : libérer le compteur (games.creator_ip).",
      );
    }
    await page.waitForLoadState("networkidle");
    urlPartie = page.url().replace(/[?#].*$/, "");
  });

  it("la propose en tête de /jouer, et reprend au clic", async () => {
    await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const carte = page.locator("[data-reprendre-ma-partie]");
    await carte.waitFor({ state: "visible" });
    expect(await carte.innerText()).toMatch(/Tour 1 sur \d+/);
    await page.getByRole("heading", { name: "Lancez une nouvelle partie" }).waitFor();
    // Elle passe avant le formulaire, pas après.
    const yCarte = (await carte.boundingBox())!.y;
    const yFormulaire = (await page.getByRole("button", { name: "Lancer la partie" }).boundingBox())!.y;
    expect(yCarte).toBeLessThan(yFormulaire);

    await carte.getByRole("link", { name: "Reprendre" }).click();
    await page.waitForURL(urlPartie);
  });

  it("la propose aussi sur l'accueil, qui reste servi statique", async () => {
    const reponse = await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    expect(reponse!.status()).toBe(200);
    await page.locator("[data-reprendre-ma-partie]").waitFor({ state: "visible", timeout: 15_000 });
    await page.locator("[data-reprendre-ma-partie]").getByRole("link", { name: "Reprendre" }).click();
    await page.waitForURL(urlPartie);
  });

  it("prolonge le cookie invité à chaque visite", async () => {
    await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    const cookie = (await contexte.cookies()).find((c) => c.name === "ba_guest");
    expect(cookie, "cookie invité absent").toBeDefined();
    const restant = cookie!.expires - Date.now() / 1000;
    // Un an, à quelques minutes près — pas l'année entamée à la création.
    expect(restant).toBeGreaterThan(60 * 60 * 24 * 364);
  });

  it("donne le code dans « Garder ma partie »", async () => {
    await page.goto(urlPartie, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const html = await page.content();
    expect(html).toContain("Garder ma partie");
    const m = html.match(/\b([A-HJKMNP-Z2-9]{4})-([A-HJKMNP-Z2-9]{4})\b/);
    expect(m, "aucun code de reprise dans la page").not.toBeNull();
    code = m![0];
  });

  it("sur un appareil sans cookie, la partie est introuvable…", async () => {
    const neuf = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    const p = await neuf.newPage();
    await p.goto(urlPartie, { waitUntil: "domcontentloaded" });
    // Le statut reste 200 quand la page se diffuse déjà : c'est le contenu qui dit « 404 ».
    await p.getByRole("heading", { name: "Cette page n'existe pas" }).waitFor();

    // … jusqu'à ce que le code la rende.
    await p.goto(`${BASE}/reprendre`, { waitUntil: "domcontentloaded" });
    await p.waitForLoadState("networkidle");
    await p.getByLabel(/Votre code de reprise/).fill(code);
    await p.getByRole("button", { name: "Reprendre ma partie" }).click();
    await p.waitForURL(urlPartie, { timeout: 30_000 });
    await p.waitForLoadState("networkidle");
    // Et la carte « partie en cours » la montre désormais sur cet appareil.
    await p.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await p.locator("[data-reprendre-ma-partie]").waitFor({ state: "visible" });
    await neuf.close();
  });
});
