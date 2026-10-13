import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { SUR_MESURE } from "../../src/config/sur-mesure";
import { LIBELLE_DU_DEVIS } from "../../src/config/tarifs";

/**
 * LES SITUATIONS SUR MESURE, LÀ OÙ ELLES SE MENTIONNENT : un paragraphe sur la
 * page des écoles et sur celle des enseignants, la bande finale des parcours.
 * Le texte est celui du module, et chaque page offre les deux gestes.
 */
let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
});

afterAll(async () => {
  await navigateur?.close();
});

describe("le paragraphe sur mesure", () => {
  for (const chemin of ["/ecoles", "/enseignants"]) {
    it(`${chemin} le porte, avec le rendez-vous et le devis`, async () => {
      await aller(page, chemin);
      const paragraphe = page.locator("[data-sur-mesure-paragraphe]");
      expect(await paragraphe.count()).toBe(1);
      const vu = await paragraphe.innerText();
      expect(vu).toContain(SUR_MESURE.titre);
      expect(vu).toContain(SUR_MESURE.promesse);
      expect(vu).toContain(SUR_MESURE.appel.rendezVous.libelle);
      expect(vu).toContain(LIBELLE_DU_DEVIS);
      expect(await paragraphe.locator(`a[href="${SUR_MESURE.appel.devis.href}"]`).count()).toBe(1);
    });
  }

  it("la bande finale des parcours dit la même promesse, et chaque diplôme nomme ses entreprises", async () => {
    await aller(page, "/parcours");
    const vu = await texte(page);
    expect(vu).toContain(SUR_MESURE.titre);
    expect(vu).toContain(SUR_MESURE.promesse);
    expect(vu).not.toContain("Les mêmes mécaniques servent d'autres référentiels");
    // Chaque diplôme déplié nomme les entreprises qui le servent.
    const tiroirs = page.locator("details[data-diplome]");
    const n = await tiroirs.count();
    expect(n).toBeGreaterThan(3);
    const premier = tiroirs.first();
    await premier.locator("summary").click();
    const entreprises = premier.locator("[data-entreprises-du-diplome]");
    expect(await entreprises.count()).toBe(1);
    expect(await entreprises.innerText()).toContain("Les entreprises qui servent ce diplôme");
  });
});
