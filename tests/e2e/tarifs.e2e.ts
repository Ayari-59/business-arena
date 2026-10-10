import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { OFFRES_ENSEIGNEMENT } from "../../src/config/tarifs";

/**
 * LA PAGE DES TARIFS, DANS UN VRAI NAVIGATEUR.
 *
 * Ce que la garde d'architecture (`tests/architecture/tarifs.test.ts`) ne voit
 * pas : la page répond sur le build servi, elle tient à 1280 et à 390 sans
 * défilement de côté, les trois cartes sont côte à côte et de même hauteur sur
 * un ordinateur, empilées sur un téléphone, et à aucun moment la fenêtre ne
 * montre plus d'un bouton plein en la parcourant. La vitrine y mène par sa
 * ligne « licence établissement », et le menu porte « Tarifs ».
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

async function ouvrir(largeur: 1280 | 390): Promise<Page> {
  const contexte =
    largeur === 390
      ? await navigateur.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" })
      : await navigateur.newContext({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
  const page = await contexte.newPage();
  await aller(page, "/tarifs");
  return page;
}

/** Les boutons pleins visibles dans la fenêtre, à la position de défilement courante. */
async function pleinsDansLaFenetre(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll(".bouton-plein")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
      })
      .map((e) => (e.textContent ?? "").trim()),
  );
}

/** Parcourt la page d'un bout à l'autre, une demi-fenêtre à la fois. */
async function auPlusUnPleinParEcran(page: Page): Promise<{ max: number; total: number }> {
  const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
  const fenetre = await page.evaluate(() => innerHeight);
  let max = 0;
  for (let y = 0; y <= hauteur; y += Math.round(fenetre / 2)) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    max = Math.max(max, (await pleinsDansLaFenetre(page)).length);
  }
  const total = await page.evaluate(() => document.querySelectorAll(".bouton-plein").length);
  return { max, total };
}

describe("/tarifs", () => {
  for (const largeur of [1280, 390] as const) {
    it(`à ${largeur} px : répond, sans défilement de côté, un seul bouton plein par écran`, async () => {
      const page = await ouvrir(largeur);
      expect(await page.locator("main h1").innerText()).toBe("Tarifs");
      const debord = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debord, "défilement de côté").toBeLessThanOrEqual(0);
      // Le prix et « HT / an » sont deux éléments de flex : innerText les
      // sépare d'un saut de ligne. On lit le texte comme on le voit.
      const lu = (await texte(page)).replace(/\s+/g, " ");
      for (const attendu of ["490 € HT / an", "588 € TTC", "990 € HT / an", "1 188 € TTC", "Sur devis"]) {
        expect(lu, attendu).toContain(attendu);
      }
      const { max, total } = await auPlusUnPleinParEcran(page);
      expect(total, "boutons pleins dans la page").toBe(1);
      expect(max, "boutons pleins dans une même fenêtre").toBe(1);
      const plein = page.locator("main .bouton-plein");
      expect(await plein.innerText()).toBe("Demander un bon de commande");
      expect(await plein.getAttribute("href")).toBe("/rendez-vous");
      // Aucun paiement en ligne : « Commander » mène au rendez-vous.
      expect(await page.getByRole("link", { name: "Commander", exact: true }).getAttribute("href")).toBe(
        "/rendez-vous",
      );
      expect(await page.getByRole("link", { name: /payer/i }).count()).toBe(0);
      await page.context().close();
    });
  }

  it("à 1280, les trois cartes côte à côte et de même hauteur ; à 390, empilées", async () => {
    const mesurer = async (page: Page) =>
      page.evaluate(() =>
        [...document.querySelectorAll("[data-offre]")].map((c) => {
          const r = c.getBoundingClientRect();
          return { x: Math.round(r.left), y: Math.round(r.top + scrollY), h: Math.round(r.height) };
        }),
      );
    const large = await ouvrir(1280);
    const l = await mesurer(large);
    expect(l).toHaveLength(OFFRES_ENSEIGNEMENT.length);
    expect(new Set(l.map((c) => c.y)).size, "pas sur une même rangée").toBe(1);
    expect(Math.max(...l.map((c) => c.h)) - Math.min(...l.map((c) => c.h)), "hauteurs").toBeLessThanOrEqual(1);
    // Les boutons tombent au pied des cartes, donc alignés.
    const pieds = await large.evaluate(() =>
      [...document.querySelectorAll("[data-offre] a")].map((a) => Math.round(a.getBoundingClientRect().bottom)),
    );
    expect(new Set(pieds).size, "boutons non alignés").toBe(1);
    await large.context().close();

    const etroit = await ouvrir(390);
    const e = await mesurer(etroit);
    expect(new Set(e.map((c) => c.x)).size, "pas dans une même colonne").toBe(1);
    expect(e[0]!.y).toBeLessThan(e[1]!.y);
    expect(e[1]!.y).toBeLessThan(e[2]!.y);
    await etroit.context().close();
  });

  it("les conditions se replient, avec le chevron commun", async () => {
    const page = await ouvrir(1280);
    const repli = page.locator("details", { hasText: "Conditions de vente" });
    expect(await repli.evaluate((d: HTMLDetailsElement) => d.open)).toBe(false);
    expect(await repli.locator("summary [data-chevron]").count()).toBe(1);
    await repli.locator("summary").click();
    expect(await repli.evaluate((d: HTMLDetailsElement) => d.open)).toBe(true);
    expect(await repli.innerText()).toContain("Pas de reconduction tacite");
    await page.context().close();
  });
});

describe("le site mène aux tarifs", () => {
  it("la ligne de la vitrine mène à /tarifs", async () => {
    const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
    const page = await contexte.newPage();
    await aller(page, "/");
    const lien = page.getByRole("link", { name: "licence établissement" });
    expect(await lien.getAttribute("href")).toBe("/tarifs");
    await lien.click();
    await page.waitForURL(/\/tarifs$/);
    expect(await page.locator("main h1").innerText()).toBe("Tarifs");
    await contexte.close();
  });

  it("le menu porte « Tarifs »", async () => {
    const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    const page = await contexte.newPage();
    await aller(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    const groupe = page.locator('#plan-du-site button[aria-controls^="groupe-"]', { hasText: "Tarifs et contact" });
    if ((await groupe.getAttribute("aria-expanded")) === "false") await groupe.click();
    const lien = page.locator('#plan-du-site a[href="/tarifs"]');
    await lien.waitFor({ state: "visible" });
    expect(await lien.innerText()).toContain("Tarifs");
    await contexte.close();
  });
});
