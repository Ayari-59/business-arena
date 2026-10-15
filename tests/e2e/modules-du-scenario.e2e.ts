import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Locator, Page } from "playwright-core";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";

/**
 * LES MODULES DU SCÉNARIO, JOUÉS DANS UN VRAI NAVIGATEUR, À « BUDGÉTER ».
 *
 * Deux catalogues optionnels restent au jeu : les démarches qualité et les
 * programmes de R&D. Ils se décident à la fin de l'étape « Budgéter », à côté
 * du budget qualité et du budget R&D, repliés, et se déplient au clic. Une
 * partie solo NOVA au niveau proposé par défaut (Pilotage) ouvre les démarches
 * qualité. Le joueur en coche une, provoque un refus qui le ramène à la bonne
 * étape, module déplié, puis valide : le récapitulatif la range sous
 * « Budgéter ». Au tour suivant, le niveau d'après est proposé.
 *
 * Au niveau Stratégie (sous licence), les programmes de R&D s'y ajoutent ; un
 * programme lancé se lit dans « Déjà engagé » au tour suivant et s'arrête. Plus
 * aucune étape ne paraît pour un module retiré, et l'assurance ne s'appelle
 * plus « Assurance & risques ».
 */

let navigateur: Browser;
let contexte: BrowserContext;
let page: Page;
let urlArene = "";
let libelle = "";
const CAPTURES = process.env.E2E_CAPTURES ?? "";

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  contexte = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
  page = await contexte.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

const nav = (p: Page) => p.locator('[aria-label="Étapes de décision"]');
const sansParcourue = (t: string) => t.replace(/, parcourue$/, "");
/** Les titres de la barre d'étapes, dans l'ordre. */
const titresDesEtapes = async (p: Page) =>
  (await nav(p).locator("li button").evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label") ?? ""))).map(
    sansParcourue,
  );
/** L'étape affichée. */
const etapeCourante = async (p: Page) =>
  sansParcourue((await nav(p).locator('button[aria-current="step"]').getAttribute("aria-label")) ?? "");
/** Aller à une étape par la barre. */
async function allerA(p: Page, titre: string) {
  await nav(p).locator(`li button[aria-label^="${titre}"]`).click();
  await p.waitForTimeout(250);
  expect(await etapeCourante(p)).toBe(titre);
}
const unModule = (p: Page, decision: string) => p.locator(`[data-module-de-decision="${decision}"]`);
const estDeplie = (m: Locator) => m.locator("details").first().evaluate((d) => (d as HTMLDetailsElement).open);
async function deplier(m: Locator) {
  if (!(await estDeplie(m))) await m.locator("summary").first().click();
  expect(await estDeplie(m)).toBe(true);
}
async function replier(m: Locator) {
  if (await estDeplie(m)) await m.locator("summary").first().click();
  expect(await estDeplie(m)).toBe(false);
}
const lu = async (l: Locator) => (await l.innerText()).replace(/[  ]/g, " ");
/** L'en-tête du repli d'un module : titre, compte, coût. */
const resume = (m: Locator) => lu(m.locator("summary").first());
const echapper = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** La section de l'étape affichée. */
const etapeAffichee = (p: Page) => p.locator("section[data-etape]:not([hidden])").first();

/** Avance d'étape en étape jusqu'au bouton de validation. */
async function jusquALaValidation(p: Page) {
  for (let k = 0; k < 20; k++) {
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) return;
    await p.getByRole("button", { name: /^Suivant/ }).last().click();
    await p.waitForTimeout(250);
  }
}
/** Valide le tour, puis revient à l'arène : le récapitulatif des modules du tour clos. */
async function validerEtRelire(p: Page, url: string) {
  await jusquALaValidation(p);
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  await p.waitForTimeout(500);
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  if (await garder.count()) await garder.first().click();
  await p.waitForURL(/simule/, { timeout: 180_000 });
  await p.waitForLoadState("networkidle");
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.waitForLoadState("networkidle");
  const recap = p.locator("[data-modules-engages]").first();
  if (!(await recap.isVisible())) await p.getByRole("tab", { name: "Décisions" }).first().click();
  await recap.waitFor({ state: "visible", timeout: 30_000 });
  return recap;
}

async function lancerNova(p: Page, niveau?: number) {
  await p.goto(`${BASE}/jouer`, { waitUntil: "domcontentloaded" });
  await p.waitForLoadState("networkidle");
  await p.getByRole("button", { name: /NOVA/ }).first().click();
  if (niveau) await p.getByRole("button", { name: new RegExp(`^Niveau ${niveau}`) }).click();
  await p.getByRole("button", { name: "Lancer la partie" }).click();
  await p.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (p.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  }
  await p.waitForLoadState("networkidle");
  const url = p.url().split("?")[0]!.split("#")[0]!;
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(1_200);
  await p.locator('input[name^="ventesEstimees."]').first().fill("3000");
  return url;
}

describe("les modules du scénario, à « Budgéter »", () => {
  it("une partie solo NOVA n'a plus d'étape « Projets » : ses modules sont à « Budgéter », et là seulement", async () => {
    urlArene = await lancerNova(page);
    const titres = await titresDesEtapes(page);
    expect(titres).not.toContain("Projets");
    expect(titres).toEqual(expect.arrayContaining(["Vendre", "Budgéter"]));
    expect(titres).not.toContain("Assurance & risques");
    expect(await page.getByText("Quels projets engagez-vous").count()).toBe(0);
    // Le compteur suit la barre.
    expect((await nav(page).locator("[data-compteur-de-la-piste]").innerText()).replace(/\s+/g, " ")).toBe(
      `1 / ${titres.length} parcourue`,
    );
    // Une seule étape porte des modules.
    expect(await page.locator("[data-modules-de-decision]").count()).toBe(1);
    await allerA(page, "Budgéter");
    expect(await page.locator('[data-modules-de-decision="budgets"]').isVisible()).toBe(true);
    expect(await lu(page.locator('[data-engagements-du-tour="budgets"]'))).toMatch(/Engagements du tour/i);
    expect(await resume(unModule(page, "qualityActions"))).toContain("Démarches qualité");
  }, 240_000);

  it("un module est replié, se déplie au clic, et son en-tête dit ce qui est engagé", async () => {
    const qualite = unModule(page, "qualityActions");
    expect(await estDeplie(qualite), "replié par défaut").toBe(false);
    expect(await resume(qualite)).toMatch(/\d+ choix/);
    await deplier(qualite);
    const cases = qualite.locator('input[type="checkbox"]');
    const n = await cases.count();
    expect(n).toBeGreaterThan(1);
    // Chaque niveau dit ce qui se fait concrètement, sans tiret en milieu de phrase.
    const texteDuModule = await lu(qualite);
    expect(texteDuModule).toMatch(/· niveau 1 : /);
    expect(texteDuModule).not.toMatch(/ — /);
    const plafond = Number(/(\d+) démarches? au plus par tour/i.exec(await qualite.innerText())?.[1] ?? n);
    for (let i = 0; i < Math.min(plafond, n); i++) await cases.nth(i).check();
    if (n > plafond) expect(await cases.nth(plafond).isDisabled(), "case au-delà du plafond").toBe(true);
    for (let i = 1; i < Math.min(plafond, n); i++) await cases.nth(i).uncheck();
    expect(await cases.nth(n - 1).isDisabled()).toBe(false);
    libelle = ((await cases.nth(0).locator("xpath=..").innerText()).split(" · ")[0] ?? "").trim();
    expect(libelle.length).toBeGreaterThan(0);
    expect(await qualite.innerText()).toMatch(/Engagé ce tour : .*€/);
    // L'en-tête compte l'engagement et son coût, déplié comme replié.
    expect(await resume(qualite)).toMatch(/1 engagé/);
    expect(await resume(qualite)).toMatch(/\d[\d ]* €/);
    if (CAPTURES) await etapeAffichee(page).screenshot({ path: `${CAPTURES}/budgeter-ordinateur.png` });
    await replier(qualite);
    expect(await resume(qualite)).toMatch(/1 engagé/);
  }, 60_000);

  it("un arrêt refusé (rien ne tourne) ramène aux démarches qualité, module déplié, message dedans", async () => {
    const qualite = unModule(page, "qualityActions");
    await replier(qualite);
    // Une case « Arrêter » qui ne vise rien : celle d'un formulaire périmé ou forgé.
    await page.evaluate(() => {
      const form = document.querySelector("[data-modules-de-decision]")!.closest("form")!;
      const i = document.createElement("input");
      i.type = "checkbox";
      i.name = "module.arret.qualityActions.fantome";
      i.value = "1";
      i.checked = true;
      i.hidden = true;
      i.id = "arret-fantome";
      form.appendChild(i);
    });
    await allerA(page, "Vendre");
    await jusquALaValidation(page);
    await page.getByRole("button", { name: /Valider et simuler/ }).first().click();
    await page.waitForTimeout(600);
    expect(await etapeCourante(page)).toBe("Budgéter");
    expect(await estDeplie(qualite)).toBe(true);
    expect(await lu(qualite.locator("[data-refus-du-module]"))).toContain("arrêt");
    expect(await lu(page.locator("[data-recapitulatif-des-erreurs]"))).toContain("arrêt");
    if (CAPTURES) await qualite.screenshot({ path: `${CAPTURES}/refus-arret-ordinateur.png` });
    // Le lien du récapitulatif y ramène aussi, d'une autre étape.
    await replier(qualite);
    await allerA(page, "Vendre");
    await page.locator('[data-lien-du-refus="module:qualityActions"]').click();
    await page.waitForTimeout(400);
    expect(await etapeCourante(page)).toBe("Budgéter");
    expect(await estDeplie(qualite)).toBe(true);
    await page.evaluate(() => document.getElementById("arret-fantome")?.remove());
  }, 60_000);

  it("un brouillon restauré déplie le module où l'équipe a coché", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_200);
    expect(await page.locator("#arret-fantome").count()).toBe(0);
    await allerA(page, "Budgéter");
    const qualite = unModule(page, "qualityActions");
    expect(await estDeplie(qualite), "coché dans le brouillon : déplié").toBe(true);
    expect(await qualite.locator('input[type="checkbox"]').first().isChecked()).toBe(true);
    expect(await resume(qualite)).toMatch(/1 engagé/);
  }, 60_000);

  it("validé, le récapitulatif range la démarche sous « Budgéter »", async () => {
    const recap = await validerEtRelire(page, urlArene);
    expect(await lu(recap)).toContain("Modules engagés ce tour");
    const budgets = recap.locator('[data-modules-du-theme="budgets"]');
    expect(await lu(budgets)).toContain("Budgéter");
    expect(await lu(budgets)).toContain("Démarches qualité");
    expect(await lu(budgets)).toContain(libelle);
    expect(await lu(budgets)).toMatch(/Coût du tour \d[\d ]* €/);
    expect(await recap.locator("[data-modules-du-theme]").count()).toBe(1);
    if (CAPTURES) await recap.screenshot({ path: `${CAPTURES}/recapitulatif-ordinateur.png` });
  }, 240_000);

  it("au tour suivant, la démarche est « déjà engagée » et le niveau d'après est proposé ; sur téléphone, le module est replié", async () => {
    const passer = page.getByRole("button", { name: /Passer au tour 2/ });
    if (await passer.count()) await passer.first().click();
    await page.waitForTimeout(1_000);
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_000);
    await allerA(page, "Budgéter");
    const qualite = unModule(page, "qualityActions");
    expect(await resume(qualite)).toMatch(/1 en cours/);
    await deplier(qualite);
    expect(await qualite.locator("[data-modules-en-cours]").innerText()).toContain("niveau 1 atteint");
    expect(await texte(page)).toContain("niveau 2");

    // La même partie, sur un téléphone : mêmes cookies, autre écran, en parcours.
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
    for (let k = 0; k < 25 && !(await p2.locator('[data-modules-de-decision="budgets"]:visible').count()); k++) {
      const suivant = p2.getByRole("button", { name: /^Suivant/ }).last();
      if (!(await suivant.count())) break;
      await suivant.click();
      await p2.waitForTimeout(300);
    }
    const bloc = p2.locator('[data-modules-de-decision="budgets"]');
    expect(await bloc.isVisible(), "carte des modules « budgets » sur téléphone").toBe(true);
    const ouverts = await bloc
      .locator("details")
      .evaluateAll((ds) => ds.filter((x) => (x as HTMLDetailsElement).open).length);
    expect(ouverts).toBe(0);
    const h = await bloc.evaluate((b) => b.getBoundingClientRect().height);
    console.log(`[mesure] modules de l'étape budgets sur téléphone, repliés : ${Math.round(h)} px`);
    if (CAPTURES) await p2.screenshot({ path: `${CAPTURES}/budgets-telephone.png`, fullPage: false });
    const q2 = p2.locator('[data-module-de-decision="qualityActions"]');
    await q2.locator("summary").first().click();
    expect(await q2.locator("details").first().evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    if (CAPTURES) await p2.screenshot({ path: `${CAPTURES}/budgets-deplie-telephone.png`, fullPage: false });
    await tel.close();
  }, 180_000);
});

describe("au niveau Stratégie : un programme de R&D à « Budgéter », lancé puis arrêté", () => {
  let p: Page;
  let ctx: BrowserContext;
  let url = "";
  let programme = "";

  it("les deux modules se décident à « Budgéter » ; aucune étape pour un module retiré", async () => {
    ctx = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
    await enseignantSousLicence(ctx);
    p = await ctx.newPage();
    url = await lancerNova(p, 5);
    const titres = await titresDesEtapes(p);
    expect(titres).not.toContain("Projets");
    expect(titres).not.toContain("Assurance & risques");
    expect(titres).toContain("Budgéter");
    expect(await p.locator("[data-modules-de-decision]").count()).toBe(1);
    await allerA(p, "Budgéter");
    for (const d of ["qualityActions", "startedRdActionIds"]) {
      expect(await unModule(p, d).isVisible(), d).toBe(true);
      expect(await estDeplie(unModule(p, d)), d).toBe(false);
    }
    for (const d of ["activePricingStrategyIds", "activeHRPolicyIds", "activeCrisisPlanIds", "financingDraws"]) {
      expect(await unModule(p, d).count(), d).toBe(0);
    }
    const rd = unModule(p, "startedRdActionIds");
    await deplier(rd);
    const c = rd.locator('input[type="checkbox"]').first();
    await c.check();
    programme = ((await c.locator("xpath=..").innerText()).split(" · ")[0] ?? "").trim();
    expect(programme.length).toBeGreaterThan(0);
    expect(await resume(rd)).toMatch(/1 engagé/);
    if (CAPTURES) await etapeAffichee(p).screenshot({ path: `${CAPTURES}/budgeter-strategie-ordinateur.png` });
  }, 240_000);

  it("validé, le programme se lit au récapitulatif sous « Budgéter »", async () => {
    const recap = await validerEtRelire(p, url);
    const budgets = recap.locator('[data-modules-du-theme="budgets"]');
    expect(await lu(budgets)).toContain("Programmes de R&D");
    expect(await lu(budgets)).toContain(programme);
    if (CAPTURES) await recap.screenshot({ path: `${CAPTURES}/recapitulatif-strategie-ordinateur.png` });
  }, 240_000);

  it("au tour 2, le programme est « déjà engagé » et s'arrête ; le récapitulatif le dit arrêté", async () => {
    const passer = p.getByRole("button", { name: /Passer au tour 2/ });
    if (await passer.count()) await passer.first().click();
    await p.waitForTimeout(1_000);
    await p.evaluate(() => {
      location.hash = "decisions";
    });
    await p.waitForTimeout(1_000);
    await p.locator('input[name^="ventesEstimees."]').first().fill("3000");
    await allerA(p, "Budgéter");
    const rd = unModule(p, "startedRdActionIds");
    expect(await resume(rd)).toMatch(/1 en cours/);
    await deplier(rd);
    const engage = rd.locator("[data-modules-en-cours]");
    expect(await engage.innerText()).toContain(programme);
    await engage.getByLabel("Arrêter").first().check();
    expect(await resume(rd)).toMatch(/1 arrêt/);
    if (CAPTURES) await rd.screenshot({ path: `${CAPTURES}/arret-ordinateur.png` });
    const recap = await validerEtRelire(p, url);
    const budgets = recap.locator('[data-modules-du-theme="budgets"]');
    expect(await lu(budgets), await lu(recap)).toMatch(new RegExp(`arrêté : ${echapper(programme)}`));
    await ctx.close();
  }, 300_000);
});
