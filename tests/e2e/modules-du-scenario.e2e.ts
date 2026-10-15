import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * LES MODULES DU SCÉNARIO, JOUÉS DANS UN VRAI NAVIGATEUR.
 *
 * Une partie solo NOVA au niveau proposé par défaut (Pilotage) ouvre les
 * démarches qualité, l'hygiène et sécurité, et les modules rendus jouables
 * depuis qui suivent les mêmes leviers : formation, politiques RH,
 * maintenance, contrats fournisseurs. Le joueur trouve l'étape « Projets »,
 * coche une démarche et une politique RH, valide ; le récapitulatif du tour
 * dit ce qui a été engagé et ce que cela a coûté. Au tour suivant, les deux
 * sont « déjà engagées », la politique RH s'arrête, et le récapitulatif le dit.
 */

let navigateur: Browser;
let contexte: BrowserContext;
let page: Page;
let urlArene = "";
let libelle = "";
let libelleRh = "";
const CAPTURES = process.env.E2E_CAPTURES ?? "";

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
    // Un module rendu jouable : une politique RH, cochée elle aussi.
    const rh = page.locator('[data-module-de-decision="activeHRPolicyIds"]');
    expect(await rh.count(), "politiques RH absentes de l'étape Projets").toBe(1);
    const caseRh = rh.locator('input[type="checkbox"]').first();
    await caseRh.check();
    libelleRh = ((await caseRh.locator("xpath=..").innerText()).split(" · ")[0] ?? "").trim();
    expect(libelleRh.length).toBeGreaterThan(0);
    expect(await rh.innerText()).toMatch(/Engagé ce tour : .*€/);
    // Les autres modules du niveau : la formation se décide par un effectif.
    const formation = page.locator('[data-module-de-decision="trainingEnrollments"]');
    expect(await formation.locator('input[type="number"]').count()).toBeGreaterThan(0);
    if (CAPTURES) {
      await page.locator("[data-modules-de-decision]").screenshot({ path: `${CAPTURES}/projets-ordinateur.png` });
    }
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
    expect(lu).toContain("Politiques RH");
    expect(lu).toContain(libelleRh);
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

  it("au tour 2, la politique RH se lit dans « Déjà engagé » et s'arrête", async () => {
    const rh = page.locator('[data-module-de-decision="activeHRPolicyIds"]');
    const engage = rh.locator("[data-modules-en-cours]");
    expect(await engage.innerText()).toContain(libelleRh);
    if (CAPTURES) {
      await rh.screenshot({ path: `${CAPTURES}/arret-ordinateur.png` });
      // La même étape, sur un téléphone : mêmes cookies, autre écran.
      const tel = await navigateur.newContext({
        locale: "fr-FR",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        storageState: await contexte.storageState(),
      });
      const p2 = await tel.newPage();
      await p2.goto(`${urlArene}#decisions`, { waitUntil: "domcontentloaded" });
      await p2.waitForLoadState("networkidle");
      await p2.waitForTimeout(1_200);
      await p2.locator('input[name^="ventesEstimees."]').first().fill("3000");
      if (await avancerJusqua(p2, "[data-modules-de-decision]")) {
        await p2.locator('[data-module-de-decision="activeHRPolicyIds"]').screenshot({ path: `${CAPTURES}/arret-telephone.png` });
        await p2.locator('[data-module-de-decision="trainingEnrollments"]').screenshot({ path: `${CAPTURES}/formation-telephone.png` });
        await p2.screenshot({ path: `${CAPTURES}/projets-telephone.png`, fullPage: false });
      }
      await tel.close();
    }
    await engage.getByLabel("Arrêter").first().check();
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
    const recaps = page.locator("[data-modules-engages]");
    if (!(await recaps.first().isVisible())) {
      await page.getByRole("tab", { name: "Décisions" }).first().click();
    }
    await recaps.first().waitFor({ state: "visible", timeout: 30_000 });
    const lus = (await recaps.allInnerTexts()).join("\n").replace(/[\u00a0\u202f]/g, " ");
    expect(lus, lus).toMatch(new RegExp(`arrêté : ${libelleRh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    if (CAPTURES) await recaps.first().screenshot({ path: `${CAPTURES}/recapitulatif-ordinateur.png` });
  }, 300_000);

  it("au tour 3, la politique arrêtée ne tourne plus", async () => {
    const passer = page.getByRole("button", { name: /Passer au tour 3/ });
    if (await passer.count()) await passer.first().click();
    await page.waitForTimeout(1_000);
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_000);
    await page.locator('input[name^="ventesEstimees."]').first().fill("3000");
    expect(await avancerJusqua(page, "[data-modules-de-decision]")).toBe(true);
    const rh = page.locator('[data-module-de-decision="activeHRPolicyIds"]');
    const engage = rh.locator("[data-modules-en-cours]");
    if (await engage.count()) expect(await engage.innerText()).not.toContain(libelleRh);
    // Elle se propose de nouveau, comme tout ce qui ne tourne pas.
    expect(await rh.innerText()).toContain(libelleRh);
  }, 120_000);
});
