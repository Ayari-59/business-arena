import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { SCENARIO_CHOICES } from "../../src/config/scenarios/registry";
import { formationsServies, sertEnClair } from "../../src/config/scenarios/formations-servies";

/**
 * LE CHOIX DE L'ENTREPRISE DIT QUI ELLE SERT. Chaque carte de /jouer porte
 * « Sert : STMG, BTS CG et DCG », lu dans le registre des formations servies ;
 * sur téléphone, où la carte ne montre que la photo, la légende de
 * l'entreprise choisie le dit.
 */
let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
});

afterAll(async () => {
  await navigateur?.close();
});

describe("les formations servies sur /jouer", () => {
  it("sur ordinateur, chaque carte dit les formations que son entreprise sert", async () => {
    const page: Page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
    await aller(page, "/jouer");
    const cartes = page.locator("[data-carte-entreprise] [data-sert]");
    expect(await cartes.count()).toBe(SCENARIO_CHOICES.length);
    for (const s of SCENARIO_CHOICES) {
      const carte = page.locator(`[data-carte-entreprise="${s.code}"] [data-sert]`);
      expect(await carte.innerText(), s.code).toContain(`Sert : ${sertEnClair(formationsServies(s.code))}`);
    }
    await page.close();
  });

  it("sur téléphone, la légende de l'entreprise choisie dit ses formations, et suit le choix", async () => {
    const page: Page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    await aller(page, "/jouer");
    const premiere = SCENARIO_CHOICES[0]!;
    expect(await page.locator("[data-sert-legende]").innerText()).toContain(
      sertEnClair(formationsServies(premiere.code)),
    );
    const autre = SCENARIO_CHOICES.find((s) => s.code !== premiere.code)!;
    await page.locator(`[data-carte-entreprise="${autre.code}"]`).click();
    expect(await page.locator("[data-sert-legende]").innerText()).toContain(
      sertEnClair(formationsServies(autre.code)),
    );
    // Les cartes, elles, ne le portent pas à cette largeur : le 3 × 3 reste intact.
    const visibles = await page.locator("[data-carte-entreprise] [data-sert]:visible").count();
    expect(visibles).toBe(0);
    expect(await texte(page)).toContain("Sert : ");
    await page.close();
  });
});
