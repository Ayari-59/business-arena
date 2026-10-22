import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { TOURS_MAX_AU_TRIMESTRE } from "../../src/config/scenarios/rounds";
import { MOIS_MAX } from "../../src/config/scenarios/calendrier-mensuel";

/**
 * LE NOMBRE DE TOURS LIBRE (décision du propriétaire) : au trimestre, jusqu'à douze
 * tours ; au mois, sur le calendrier, jusqu'à dix-huit ; à l'année, une partie ne
 * s'allonge pas.
 *
 * Sur /jouer, les durées longues ne se proposent qu'au trimestre et au mois. Dans
 * l'espace enseignant, le champ est libre : une partie de douze tours ou de dix-huit
 * mois se crée et le dit, une partie de douze ans est refusée avec la raison.
 */
let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

describe("/jouer : les durées longues, au trimestre et au mois", () => {
  it("la tuile des douze tours s'offre au trimestre, disparaît à l'année, et le choix retombe sur la partie écrite ; au mois, dix-huit", async () => {
    const page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    await aller(page, "/jouer");
    await page.getByRole("button", { name: /Options du marché/ }).click();
    const douze = page.getByRole("button", { name: `${TOURS_MAX_AU_TRIMESTRE} tours`, exact: true });
    await douze.click();
    expect(await douze.getAttribute("aria-pressed")).toBe("true");
    expect(await page.locator('input[name="roundsCount"]').inputValue()).toBe(String(TOURS_MAX_AU_TRIMESTRE));
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: /Une année/ }).click();
    expect(await douze.count()).toBe(0);
    expect(await page.locator('input[name="roundsCount"]').inputValue()).toBe("");
    await page.getByRole("button", { name: /Un mois/ }).click();
    const dixHuit = page.getByRole("button", { name: `${MOIS_MAX} tours`, exact: true });
    await dixHuit.click();
    expect(await page.locator('input[name="roundsCount"]').inputValue()).toBe(String(MOIS_MAX));
    await page.close();
  }, 60_000);
});

describe("l'espace enseignant : un champ libre", () => {
  let prof: Page;

  beforeAll(async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    prof = await ctx.newPage();
  }, 60_000);

  async function nouvellePartie(tours: string, periodicite: "quarter" | "month" | "year", moisDeDepart?: string): Promise<void> {
    await aller(prof, "/teacher");
    if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) {
      await prof.locator("#nouvelle-partie > summary").click();
    }
    await prof.selectOption('select[name="humanTeamsCount"]', "1");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.selectOption('select[name="periodicity"]', periodicite);
    await prof.locator('input[name="roundsCount"]').fill(tours);
    if (moisDeDepart) await prof.selectOption('select[name="moisDeDepart"]', moisDeDepart);
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
  }

  it("douze tours au trimestre : la partie se crée et annonce ses douze tours", async () => {
    await nouvellePartie(String(TOURS_MAX_AU_TRIMESTRE), "quarter");
    await prof.waitForURL(/\/teacher\/games\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    await expect.poll(() => prof.locator("main").innerText()).toContain(`/${TOURS_MAX_AU_TRIMESTRE}`);
  }, 120_000);

  it("dix-huit mois à partir de juin : la partie se crée et annonce ses dix-huit tours", async () => {
    await nouvellePartie(String(MOIS_MAX), "month", "6");
    await prof.waitForURL(/\/teacher\/games\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    await expect.poll(() => prof.locator("main").innerText()).toContain(`/${MOIS_MAX}`);
  }, 120_000);

  it("douze tours à l'année : refusée, avec la raison", async () => {
    await nouvellePartie(String(TOURS_MAX_AU_TRIMESTRE), "year");
    await expect.poll(() => prof.locator("body").innerText(), { timeout: 30_000 }).toMatch(/seul le trimestre/);
    expect(prof.url()).not.toMatch(/\/teacher\/games\/[0-9a-f-]{36}$/);
  }, 120_000);
});
