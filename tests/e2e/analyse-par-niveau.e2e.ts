import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * L'ANALYSE EST PLUS COURTE AU NIVEAU 1, DANS UN VRAI NAVIGATEUR.
 *
 * Même entreprise, même tour, deux niveaux : au premier, trois causes et trois
 * modèles dont chacun dit à quoi il sert ; au quatrième, les quatre et quatre
 * d'avant, sans phrase d'aide.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

async function jusqueLAnalyse(niveau: number): Promise<{ page: Page; fermer: () => Promise<void> }> {
  const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
  await contexte.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
  const page = await contexte.newPage();
  await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /NOVA/ }).click();
  await page.getByRole("button", { name: new RegExp(`^Niveau ${niveau}`) }).click();
  await page.getByRole("button", { name: "Lancer la partie" }).click();
  await page.waitForURL(/\/arena\/|trop=1/, { timeout: 60_000 });
  if (page.url().includes("trop=1")) throw new Error("Plafond de parties par heure atteint (games.creator_ip).");
  await page.waitForLoadState("networkidle");
  for (let k = 0; k < 10; k++) {
    const analyser = page.getByRole("button", { name: /^Analyser/ });
    if (await analyser.count()) {
      await analyser.click();
      break;
    }
    await page.getByRole("button", { name: /^(Continuer|Analyser|Décider)/ }).last().click();
    await page.waitForTimeout(250);
  }
  await page.locator("input[type=radio][name^=quiz_]").first().waitFor({ state: "attached" });
  return { page, fermer: () => contexte.close() };
}

describe("le niveau de départ", () => {
  it("sans toucher au curseur, une partie solo démarre au niveau 1 · Découverte", async () => {
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    expect(await page.locator("input[name=level]").inputValue()).toBe("1");
    await page.getByText(/Niveau\s*1\s*·\s*Découverte/).first().waitFor({ state: "visible" });
    await contexte.close();
  });
});

describe("l'analyse selon le niveau", () => {
  it("niveau 1 : trois causes, trois modèles expliqués", async () => {
    const { page, fermer } = await jusqueLAnalyse(1);
    expect(await page.locator("input[type=checkbox]").count()).toBe(3);
    const modeles = page.locator("input[type=radio][name^=quiz_]");
    expect(await modeles.count()).toBe(3);
    // Chaque modèle porte sa phrase d'objectif : l'étiquette contient plus que le nom.
    const etiquettes = await page.locator("label:has(input[type=radio][name^=quiz_])").allInnerTexts();
    for (const e of etiquettes) expect(e.trim().split("\n").length, e).toBeGreaterThan(1);
    await fermer();
  });

  it("niveau 4 : toutes les causes et quatre modèles, sans phrase d'aide", async () => {
    const { page, fermer } = await jusqueLAnalyse(4);
    // La situation n'est pas la même qu'au niveau 1 (la gamme remplace le produit unique) :
    // on ne compte pas ses causes, on vérifie qu'aucune n'est retirée — au moins quatre.
    expect(await page.locator("input[type=checkbox]").count()).toBeGreaterThanOrEqual(4);
    expect(await page.locator("input[type=radio][name^=quiz_]").count()).toBe(4);
    const etiquettes = await page.locator("label:has(input[type=radio][name^=quiz_])").allInnerTexts();
    for (const e of etiquettes) expect(e.trim().split("\n").length, e).toBe(1);
    await fermer();
  });
});
