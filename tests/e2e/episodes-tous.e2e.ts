import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * CHAQUE ÉPISODE SE JOUE JUSQU'AU BILAN.
 *
 * Les tests unitaires vérifient les modèles ; celui-ci vérifie que
 * l'interface commune sait jouer chaque définition : aucun écran ne casse,
 * aucun texte n'affiche « undefined » ou « NaN », et le bilan s'ouvre. Le
 * joueur choisit à chaque fois la première option et ouvre la première
 * source : le parcours le plus bête, qui passe par tous les écrans.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

async function jouer(page: Page, placeholder: string) {
  for (let pas = 0; pas < 120; pas += 1) {
    if ((await page.getByText("Votre axe de travail").count()) > 0) return;
    const texte = await page.locator("main").innerText();
    expect(texte, "texte cassé").not.toMatch(/undefined|NaN/);
    for (const nom of await page.$$eval("input[type=radio]", (xs) => [
      ...new Set(xs.map((x) => (x as HTMLInputElement).name)),
    ])) {
      if (!(await page.$(`input[name="${nom}"]:checked`))) {
        await page.locator(`input[name="${nom}"]`).first().check();
      }
    }
    const prevision = page.getByRole("spinbutton");
    if ((await prevision.count()) > 0 && !(await prevision.inputValue())) {
      await prevision.fill(placeholder.replace(",", ".").replace(/\s/g, ""));
    }
    const source = page.locator("main button[aria-expanded=false]:not([disabled])").first();
    if ((await source.count()) > 0 && pas % 3 === 0) {
      await source.click();
      continue;
    }
    const suite = page.locator("main button.bg-amber-400:not([disabled])").first();
    await suite.click();
  }
  throw new Error("le bilan n'a pas été atteint");
}

describe("les quinze épisodes", () => {
  for (const ep of EPISODES) {
    it(`${ep.numero} · ${ep.titre}`, async () => {
      const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
      const erreurs: string[] = [];
      page.on("pageerror", (e) => erreurs.push(e.message));
      await page.goto(`${BASE}/entreprises/episode/${ep.code}?hasard=7`);
      await page.getByRole("button", { name: "Commencer l'épisode" }).click();
      await jouer(page, ep.prevision.placeholder);
      expect(await page.getByRole("heading", { level: 1 }).textContent()).toBeTruthy();
      expect(erreurs).toEqual([]);
      await page.close();
    }, 90_000);
  }
});
