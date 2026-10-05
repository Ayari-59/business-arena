import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { episodeParCode } from "../../src/pedagogy/episodes/registre";

/**
 * DU BILAN AU PROFIL, DANS UN VRAI NAVIGATEUR.
 *
 * Une même personne (un même appareil) joue deux épisodes, puis en rejoue un :
 * le bilan dit si ses choix tenaient, ce que l'épisode a observé, et propose
 * la suite ; le profil s'ouvre après deux épisodes, montre ses scores avec
 * leur confiance et leurs preuves, et s'efface à la demande.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

/** Le parcours le plus simple : la première option partout, une source de temps en temps. */
async function jouer(page: Page, code: string, niveau = "standard") {
  const ep = episodeParCode(code)!;
  await page.goto(`${BASE}/entreprises/episode/${code}?hasard=7&niveau=${niveau}`);
  await page.getByRole("button", { name: "Commencer l'épisode" }).click();
  for (let pas = 0; pas < 120; pas += 1) {
    if ((await page.getByText("Votre axe de travail").count()) > 0) return;
    for (const nom of await page.$$eval("input[type=radio]", (xs) => [
      ...new Set(xs.map((x) => (x as HTMLInputElement).name)),
    ])) {
      if (!(await page.$(`input[name="${nom}"]:checked`))) {
        await page.locator(`input[name="${nom}"]`).first().check();
      }
    }
    const prevision = page.getByRole("spinbutton");
    if ((await prevision.count()) > 0 && !(await prevision.inputValue())) {
      await prevision.fill(ep.prevision.placeholder.replace(",", ".").replace(/\s/g, ""));
    }
    const source = page.locator("main button[aria-expanded=false]:not([disabled])").first();
    if ((await source.count()) > 0 && pas % 3 === 0) {
      await source.click();
      continue;
    }
    await page.locator("main button.bg-amber-400:not([disabled])").first().click();
  }
  throw new Error("le bilan n'a pas été atteint");
}

const section = (page: Page, titre: string) =>
  page.locator("section", { has: page.getByRole("heading", { name: titre }) });

async function suiteRecue(page: Page) {
  await expect
    .poll(() => page.getByText("le prochain épisode se cherche").count(), { timeout: 30_000 })
    .toBe(0);
}

describe("le profil décisionnel", () => {
  let contexte: BrowserContext;

  beforeAll(async () => {
    contexte = await navigateur.newContext({
      viewport: { width: 1280, height: 900 },
      locale: "fr-FR",
    });
  });

  afterAll(async () => {
    await contexte?.close();
  });

  it("après un épisode : trois blocs sous le bilan, et la suite proposée", async () => {
    const page = await contexte.newPage();
    const erreurs: string[] = [];
    page.on("pageerror", (e) => erreurs.push(e.message));
    await jouer(page, "depot-qui-deborde");

    const robustesse = section(page, "Vos choix tenaient-ils ?");
    await expect.poll(() => robustesse.innerText()).toMatch(/\d de vos 6 choix tiennent/);
    expect(await robustesse.innerText()).toMatch(/sur 30 tirages du hasard/);
    const observe = section(page, "Ce que cet épisode a observé");
    expect(await observe.innerText()).toMatch(/Diagnostiquer la cause :/);

    await suiteRecue(page);
    const ensuite = section(page, "Ensuite");
    expect(await ensuite.getByRole("link").count()).toBeGreaterThanOrEqual(1);
    expect(await ensuite.innerText()).toMatch(/Famille « .+ »/);
    expect(await ensuite.innerText()).toContain("s'ouvre après deux épisodes");
    expect(await page.locator("main").innerText()).not.toMatch(/undefined|NaN/);
    expect(erreurs).toEqual([]);
    await page.close();
  }, 120_000);

  it("après deux épisodes : le lien vers le profil ; une partie rejouée ne compte pas", async () => {
    const page = await contexte.newPage();
    await jouer(page, "agence-qui-demarre");
    await suiteRecue(page);
    const lien = page.getByRole("link", { name: "Voir mon profil décisionnel" });
    expect(await lien.count()).toBe(1);
    expect(await section(page, "Ensuite").innerText()).toContain("2 épisodes y comptent");

    await jouer(page, "depot-qui-deborde");
    await suiteRecue(page);
    expect(await page.getByText("Vous aviez déjà joué cet épisode").count()).toBe(1);
    await page.close();
  }, 180_000);

  it("le profil : scores, confiance, preuves, décisions, puis effacement", async () => {
    const page = await contexte.newPage();
    await page.goto(`${BASE}/entreprises/episode/profil`);
    expect(await page.getByRole("heading", { level: 1 }).textContent()).toBe(
      "Mon profil décisionnel",
    );
    expect(await page.getByText("Établi sur 2 épisodes").count()).toBe(1);
    const lignes = section(page, "Dix compétences de décision").locator("li.carte");
    expect(await lignes.count()).toBe(10);
    // Deux épisodes : au mieux un score indicatif, jamais établi.
    expect(await page.getByText("Indicatif", { exact: true }).count()).toBeGreaterThan(0);
    expect(await page.getByText("Établi", { exact: true }).count()).toBe(0);
    expect(await page.getByText(/Diagnostic de la semaine 1 juste \d fois sur 2/).count()).toBe(1);
    // Un clic ouvre les décisions qui fondent une ligne.
    await page
      .getByText(/observations qui fondent cette ligne/)
      .first()
      .click();
    expect(await page.locator("details[open] table tbody tr").count()).toBeGreaterThan(0);
    expect(await page.getByText("rejouée : seule la première partie compte").count()).toBe(1);
    expect(await page.getByText(/ne mesure ni la personnalité, ni le potentiel/).count()).toBe(1);
    expect(await page.locator("main").innerText()).not.toMatch(/undefined|NaN/);

    await page.getByRole("button", { name: "Effacer mes 3 parties" }).click();
    await expect.poll(() => page.getByText("3 parties effacées").count()).toBe(1);
    expect(await page.getByText("Aucun épisode ne compte encore").count()).toBe(1);
    await page.close();
  }, 120_000);
});

describe("une partie en Découverte", () => {
  it("se joue jusqu'au bilan, mais ne compte pas dans le profil", async () => {
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    await contexte.addInitScript(() =>
      localStorage.setItem("install-prompt-ferme-le", String(Date.now())),
    );
    const page = await contexte.newPage();
    await jouer(page, "tresorerie-qui-fond", "decouverte");
    await suiteRecue(page);
    expect(await page.getByText("Partie jouée en Découverte").count()).toBe(1);
    const debord = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(debord).toBeLessThanOrEqual(0);
    await page.goto(`${BASE}/entreprises/episode/profil`);
    expect(await page.getByText("en Découverte : ne compte pas").count()).toBe(1);
    expect(await page.getByText("Aucun épisode ne compte encore").count()).toBe(1);
    await contexte.close();
  }, 120_000);
});
