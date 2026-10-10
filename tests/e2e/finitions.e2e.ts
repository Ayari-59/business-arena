import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * LOT P4 « FINITIONS », DANS UN NAVIGATEUR.
 *
 *   1. LA PROPOSITION DU PREMIER TOUR N'EST PAS UNE ESTIMATION : validée sans
 *      y toucher, elle n'est pas opposée au marché (« Vous aviez estimé… »
 *      n'apparaît pas au verdict).
 *   2. UNE PARTIE JOUÉE SE RETIENT SUR L'APPAREIL : le témoin que
 *      l'invitation à installer attend est posé dès le verdict d'un tour.
 *   3. LE SOMMAIRE D'UN TOUR CLOS : la face lue est marquée, et l'ancre
 *      s'arrête sous la barre collante, titre visible.
 *   4. UNE SEULE LIGNE D'EN-TÊTE SUR TÉLÉPHONE : au deuxième tour, « Tour 2/6 »
 *      n'est écrit qu'une fois à l'écran (la barre de la partie).
 */

let navigateur: Browser;
let ordi: BrowserContext;
let page: Page;
let urlArene: string;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  ordi = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
  page = await ordi.newPage();
  await page.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /NOVA/ }).first().click();
  await page.getByRole("button", { name: /^Niveau 3/ }).click();
  await page.getByRole("button", { name: "Lancer la partie" }).click();
  await page.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (page.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  }
  await page.waitForLoadState("networkidle");
  urlArene = page.url().split("?")[0]!.split("#")[0]!;
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("la proposition du premier tour", () => {
  it("avant toute partie jouée, l'appareil n'a pas de témoin", async () => {
    expect(await page.evaluate(() => localStorage.getItem("partie-jouee-le"))).toBeNull();
  });

  it("validée sans y toucher, elle n'est pas opposée au marché", async () => {
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_200);
    await page.locator("[data-proposition-de-ventes]:visible").first().waitFor({ timeout: 30_000 });
    const ouvrir = page.getByRole("button", { name: /Ouvrir le courrier/ }).first();
    if (await ouvrir.isVisible().catch(() => false)) {
      await ouvrir.click();
      await page.waitForTimeout(1_800);
      const note = page.getByRole("button", { name: /pris note/ }).first();
      if (await note.isVisible().catch(() => false)) await note.click();
    }
    for (let k = 0; k < 20; k++) {
      if (await page.getByRole("button", { name: /Valider et simuler/ }).count()) break;
      await page.getByRole("button", { name: /^Suivant/ }).last().click();
      await page.waitForTimeout(250);
    }
    // Le témoin part avec le formulaire : la proposition n'a pas été touchée.
    expect(await page.locator('input[name="propositionDeVentes"]').count()).toBe(1);
    await page.getByRole("button", { name: /Valider et simuler/ }).first().click();
    const garder = page.getByRole("button", { name: /Oui, je garde/ });
    if (await garder.count()) await garder.first().click();
    await page.waitForURL(/simule/, { timeout: 180_000 });
    await page.waitForLoadState("networkidle");
    const t = (await texte(page)).toLowerCase();
    expect(t).toContain("le marché a répondu");
    expect(t, "une proposition non touchée est opposée au marché").not.toContain("vous aviez estimé");
    expect(await page.locator("[data-ecart-d-estimation]").count()).toBe(0);
  }, 240_000);

  it("le verdict d'un tour pose le témoin d'une partie jouée", async () => {
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => localStorage.getItem("partie-jouee-le"))).not.toBeNull();
  });
});

describe("le sommaire d'un tour clos", () => {
  it("la face lue est marquée, et l'ancre ne cache pas son titre sous la barre collante", async () => {
    await page.getByRole("link", { name: /Voir les résultats/ }).first().click();
    await page.waitForURL(/\/arena\//, { timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    const tour = page.locator("#dernier-resultat");
    await tour.waitFor({ state: "visible", timeout: 30_000 });
    const sommaire = tour.getByRole("navigation", { name: /^Résultats du / });
    for (const face of ["Marché", "Finance", "Synthèse"]) {
      await sommaire.getByRole("link", { name: face, exact: true }).click();
      await page.waitForTimeout(1_000);
      const m = await page.evaluate((face) => {
        let barre = 0;
        for (const el of document.querySelectorAll<HTMLElement>("body *")) {
          const s = getComputedStyle(el);
          if (s.position !== "sticky" && s.position !== "fixed") continue;
          const r = el.getBoundingClientRect();
          if (r.top <= 1 && r.height > 0 && r.width > innerWidth / 2 && r.bottom < innerHeight / 3) {
            barre = Math.max(barre, r.bottom);
          }
        }
        const titre = [...document.querySelectorAll<HTMLElement>("[data-face-du-tour] > h3")].find(
          (h) => h.textContent?.trim() === face,
        )!;
        const actif = document.querySelector<HTMLElement>('[data-sommaire-du-tour] a[aria-current="location"]');
        return { barre, titre: titre.getBoundingClientRect().top, actif: actif?.textContent?.trim() };
      }, face);
      expect(m.actif, `après un clic sur « ${face} », la face marquée`).toBe(face);
      expect(m.titre, `le titre « ${face} » passe sous la barre collante`).toBeGreaterThanOrEqual(m.barre);
      expect(m.titre).toBeLessThan(400);
    }
  }, 120_000);
});

describe("sur téléphone, une seule ligne d'en-tête", () => {
  it("au deuxième tour, « Tour 2/6 » n'est écrit qu'une fois à l'écran", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await ordi.storageState(),
    });
    const q = await tel.newPage();
    await q.goto(urlArene, { waitUntil: "domcontentloaded" });
    await q.waitForLoadState("networkidle");
    await q.waitForTimeout(1_200);
    // Le plus petit élément qui écrit « Tour 2/6 » (le JSX le coupe en
    // plusieurs nœuds de texte : « Tour », « 2 », « / », « 6 »), visible dans
    // la fenêtre.
    const visibles = await q.evaluate(() => {
      const dit = (e: Element) => /Tour\s*2\s*\/\s*6/.test((e.textContent ?? "").replace(/\u00a0/g, " "));
      return [...document.querySelectorAll<HTMLElement>("body *")].filter((e) => {
        if (!dit(e) || [...e.children].some(dit)) return false;
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && s.visibility !== "hidden";
      }).length;
    });
    expect(visibles, "« Tour 2/6 » redit sous la barre").toBe(1);
    await tel.close();
  }, 120_000);
});
