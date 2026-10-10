import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { FICHES } from "../../src/config/episodes/fiches";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * LE CATALOGUE DES ÉPISODES, EN TIROIRS, DANS UN VRAI NAVIGATEUR.
 *
 * « Arvel Distribution découpé par thème, et les autres par métier. » Les
 * tiroirs sont fermés à l'arrivée ; on en ouvre un et il montre ses cartes ;
 * le sommaire et les ancres de la page d'avant (`#secteur-…`, le code d'une
 * famille) et `#famille-…` ouvrent le bon tiroir et y amènent la fenêtre ; un
 * téléphone de 390 px ne déborde pas, tiroir fermé comme ouvert.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const ouverts = (page: Page) => page.locator("main details[open]").count();
const tiroirOuvert = (page: Page, selecteur: string) =>
  page.locator(`${selecteur} > details`).evaluate((d) => (d as HTMLDetailsElement).open);
/** La cible est-elle dans la fenêtre, sous l'en-tête collant ? */
const enVue = (page: Page, id: string) =>
  page.evaluate((i) => {
    const r = document.getElementById(i)!.getBoundingClientRect();
    return r.top >= 0 && r.top < innerHeight / 2;
  }, id);
const debordement = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

describe("le catalogue des épisodes (/entreprises/episode)", () => {
  it("à l'arrivée : neuf tiroirs de thème, quatre de métier, tous fermés ; toutes les cartes y sont", async () => {
    const page = await navigateur.newPage({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
    await aller(page, "/entreprises/episode");
    expect(await page.locator("[data-tiroir-de-theme] > details").count()).toBe(9);
    expect(await page.locator("[data-tiroir-de-metier] > details").count()).toBe(4);
    expect(await ouverts(page)).toBe(0);
    expect(
      await page.getByRole("link", { name: /Jouer l'épisode/, includeHidden: true }).count(),
    ).toBe(EPISODES.length);
    expect(await page.getByRole("link", { name: /Jouer l'épisode/ }).count()).toBe(0);
    await page.close();
  });

  it("ouvrir un thème d'Arvel montre ses épisodes ; ouvrir un métier montre ses familles", async () => {
    const page = await navigateur.newPage({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
    await aller(page, "/entreprises/episode");
    await page.locator("#vendre > details > summary").click();
    expect(await tiroirOuvert(page, "#vendre")).toBe(true);
    expect(await page.locator("#vendre").getByRole("link", { name: /Jouer l'épisode/ }).count()).toBe(6);
    // Le chevron commun pivote avec SON tiroir, pas avec les autres.
    const rotation = (sel: string) =>
      page.locator(`${sel} > details > summary [data-chevron]`).evaluate((c) => getComputedStyle(c).rotate);
    await expect.poll(() => rotation("#vendre")).toBe("90deg"); // après sa transition
    expect(await rotation("#chiffres")).toBe("none");

    await page.locator("#secteur-sante > details > summary").click();
    const sante = page.locator("#secteur-sante");
    expect(await sante.getByRole("heading", { name: "Accueillir et orienter" }).isVisible()).toBe(true);
    expect(await sante.getByRole("link", { name: /Jouer l'épisode/ }).count()).toBe(15);
    await page.close();
  });

  it("le sommaire ouvre le tiroir qu'il nomme, même quand l'ancre est déjà dans l'adresse", async () => {
    const page = await navigateur.newPage({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
    await aller(page, "/entreprises/episode");
    const sommaire = page.getByRole("navigation", { name: "Sommaire du catalogue" });
    await sommaire.getByRole("link", { name: /Conseil/ }).click();
    await expect.poll(() => tiroirOuvert(page, "#secteur-conseil")).toBe(true);
    expect(page.url()).toMatch(/#secteur-conseil$/);
    await sommaire.getByRole("link", { name: /Financer et investir/ }).click();
    await expect.poll(() => tiroirOuvert(page, "#finance")).toBe(true);
    await expect.poll(() => enVue(page, "finance")).toBe(true);
    // On le referme, puis on reclique le même lien : pas de `hashchange`.
    await page.locator("#finance > details > summary").click();
    expect(await tiroirOuvert(page, "#finance")).toBe(false);
    await page.evaluate(() => scrollTo(0, 0));
    await sommaire.getByRole("link", { name: /Financer et investir/ }).click();
    await expect.poll(() => tiroirOuvert(page, "#finance")).toBe(true);
    await page.close();
  });

  for (const [ancre, tiroir, cible] of [
    ["#secteur-sante", "#secteur-sante", "secteur-sante"],
    ["#vendre", "#vendre", "vendre"],
    ["#famille-strategie", "#strategie", "strategie"],
    // Une famille rangée DANS le tiroir de son métier : le tiroir s'ouvre, la fenêtre va à la famille.
    ["#hotel-saison", "#secteur-hotellerie", "hotel-saison"],
    ["#famille-agro-amont", "#secteur-agroalimentaire", "agro-amont"],
  ] as const) {
    it(`l'adresse ${ancre} ouvre le bon tiroir et y mène`, async () => {
      const page = await navigateur.newPage({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
      await aller(page, `/entreprises/episode${ancre}`);
      await expect.poll(() => tiroirOuvert(page, tiroir)).toBe(true);
      await expect.poll(() => enVue(page, cible)).toBe(true);
      // Un seul tiroir ouvert : celui qu'on vise.
      expect(await ouverts(page)).toBe(1);
      await page.close();
    });
  }

  it("à 390 px : aucun débordement, résumés en une ou deux lignes, tiroir ouvert compris", async () => {
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    await contexte.addInitScript(() =>
      localStorage.setItem("install-prompt-ferme-le", String(Date.now())),
    );
    const page = await contexte.newPage();
    await aller(page, "/entreprises/episode");
    expect(await ouverts(page)).toBe(0);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    // Pleine largeur, et un résumé lisible sur une ou deux lignes.
    // Deux lignes au plus : celle du titre (text-lg, 28 px) et une ligne de texte
    // courant (24 px), soit 52 px ; 64 laisse la marge d'un arrondi.
    const resumes = await page.locator("main details > summary").evaluateAll((xs) =>
      xs.map((s) => {
        const r = s.getBoundingClientRect();
        return { largeur: r.width, hauteur: r.height, texte: s.textContent };
      }),
    );
    expect(resumes).toHaveLength(13);
    for (const r of resumes) {
      expect(r.largeur, r.texte ?? "").toBeGreaterThan(340);
      expect(r.hauteur, r.texte ?? "").toBeLessThanOrEqual(64);
    }
    await page.locator("#secteur-hotellerie > details > summary").click();
    expect(await page.locator("#secteur-hotellerie").getByRole("link", { name: /Jouer l'épisode/ }).count()).toBe(15);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await contexte.close();
  });
});

describe("le catalogue des fiches (/enseignants/episodes)", () => {
  it("les fiches, rangées de même, chacune une fois, tiroirs fermés à l'arrivée", async () => {
    const page = await navigateur.newPage({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
    await aller(page, "/enseignants/episodes");
    expect(await ouverts(page)).toBe(0);
    expect(
      await page.getByRole("link", { name: /Lire la fiche de l'épisode/, includeHidden: true }).count(),
    ).toBe(FICHES.length);
    const premier = page.locator("[data-tiroir-de-theme], [data-tiroir-de-metier]").first();
    await premier.locator("> details > summary").click();
    expect(await premier.getByRole("link", { name: /Lire la fiche/ }).count()).toBeGreaterThan(0);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.close();
  });
});
