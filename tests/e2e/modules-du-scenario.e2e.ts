import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * LES MODULES DU SCÉNARIO, JOUÉS DANS UN VRAI NAVIGATEUR.
 *
 * Une partie solo NOVA au niveau proposé par défaut (Pilotage) ouvre les
 * démarches qualité et l'hygiène et sécurité. Le joueur trouve l'étape
 * « Projets », coche une démarche, valide ; le récapitulatif du tour dit ce
 * qui a été engagé et ce que cela a coûté, et la démarche est « déjà engagée »
 * au tour suivant.
 */

let navigateur: Browser;
let contexte: BrowserContext;
let page: Page;
let urlArene = "";
let libelle = "";

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  contexte = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
  page = await contexte.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

/** Avance d'étape en étape jusqu'à ce que `visible` paraisse, ou jusqu'au bouton de validation. */
async function avancerJusqua(p: Page, visible: string): Promise<boolean> {
  for (let k = 0; k < 20; k++) {
    if (await p.locator(`${visible}:visible`).count()) return true;
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) return false;
    await p.getByRole("button", { name: /^Suivant/ }).last().click();
    await p.waitForTimeout(250);
  }
  return false;
}

describe("les modules du scénario, de la feuille au récapitulatif", () => {
  it("une partie solo NOVA propose l'étape « Projets »", async () => {
    await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /NOVA/ }).first().click();
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
    if (page.url().includes("trop=1")) {
      throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
    }
    await page.waitForLoadState("networkidle");
    urlArene = page.url().split("?")[0]!.split("#")[0]!;
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_200);
    await page.locator('input[name^="ventesEstimees."]').first().fill("3000");
    expect(await avancerJusqua(page, "[data-modules-de-decision]"), "étape Projets introuvable").toBe(true);
    const bloc = page.locator("[data-modules-de-decision]");
    expect(await bloc.innerText()).toContain("Démarches qualité");
    expect(await bloc.innerText()).toContain("ce tour");
  }, 240_000);

  it("le plafond grise les cases restantes, et décocher les libère", async () => {
    const qualite = page.locator('[data-module-de-decision="qualityActions"]');
    const cases = qualite.locator('input[type="checkbox"]');
    const n = await cases.count();
    expect(n).toBeGreaterThan(1);
    const plafondTexte = await qualite.innerText();
    const plafond = Number(/(\d+) démarches? au plus par tour/.exec(plafondTexte)?.[1] ?? n);
    for (let i = 0; i < Math.min(plafond, n); i++) await cases.nth(i).check();
    if (n > plafond) {
      expect(await cases.nth(plafond).isDisabled(), "case au-delà du plafond").toBe(true);
    }
    for (let i = 1; i < Math.min(plafond, n); i++) await cases.nth(i).uncheck();
    expect(await cases.nth(n - 1).isDisabled()).toBe(false);
    // On garde une seule démarche cochée, la première.
    libelle = ((await cases.nth(0).locator("xpath=..").innerText()).split(" · ")[0] ?? "").trim();
    expect(libelle.length).toBeGreaterThan(0);
    expect(await qualite.innerText()).toMatch(/Engagé ce tour : .*€/);
  }, 60_000);

  it("validé, le récapitulatif dit ce qui a été engagé", async () => {
    for (let k = 0; k < 20; k++) {
      if (await page.getByRole("button", { name: /Valider et simuler/ }).count()) break;
      await page.getByRole("button", { name: /^Suivant/ }).last().click();
      await page.waitForTimeout(250);
    }
    await page.getByRole("button", { name: /Valider et simuler/ }).first().click();
    const garder = page.getByRole("button", { name: /Oui, je garde/ });
    if (await garder.count()) await garder.first().click();
    await page.waitForURL(/simule/, { timeout: 180_000 });
    await page.waitForLoadState("networkidle");

    await page.goto(urlArene, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const recap = page.locator("[data-modules-engages]").first();
    if (!(await recap.isVisible())) {
      await page.getByRole("tab", { name: "Décisions" }).first().click();
    }
    await recap.waitFor({ state: "visible", timeout: 30_000 });
    const lu = (await recap.innerText()).replace(/[\u00a0\u202f]/g, " ");
    expect(lu).toContain("Modules engagés ce tour");
    expect(lu).toContain("Démarches qualité");
    expect(lu).toContain(libelle);
    expect(lu, lu).toMatch(/Coût du tour \d[\d ]* €/);
  }, 240_000);

  it("au tour suivant, la démarche est « déjà engagée » et le niveau d'après est proposé", async () => {
    const passer = page.getByRole("button", { name: /Passer au tour 2/ });
    if (await passer.count()) await passer.first().click();
    await page.waitForTimeout(1_000);
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_000);
    expect(await avancerJusqua(page, "[data-modules-de-decision]")).toBe(true);
    const qualite = page.locator('[data-module-de-decision="qualityActions"]');
    expect(await qualite.locator("[data-modules-en-cours]").innerText()).toContain("niveau 1 atteint");
    expect(await texte(page)).toContain("niveau 2");
  }, 120_000);
});
