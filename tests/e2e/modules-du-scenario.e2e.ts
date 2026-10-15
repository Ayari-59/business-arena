import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Locator, Page } from "playwright-core";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";

/**
 * LES MODULES DU SCÉNARIO, JOUÉS DANS UN VRAI NAVIGATEUR, CHACUN DANS SON ÉTAPE.
 *
 * Les modules ne s'empilent plus dans une étape « Projets » : chacun se décide à
 * la fin de l'étape de son thème (`config/etapes-des-modules`), replié, et se
 * déplie au clic. Une partie solo NOVA au niveau proposé par défaut (Pilotage)
 * ouvre les démarches qualité (Budgéter), les politiques RH et la formation
 * (Équipe & RSE). Le joueur coche une démarche et une politique RH, provoque deux
 * refus qui le ramènent à la bonne étape, module déplié, puis valide : le
 * récapitulatif range ce qui a été engagé sous le même thème. Au tour suivant,
 * la politique RH s'arrête.
 *
 * Au niveau Stratégie (sous licence), la stratégie de prix se décide dans la
 * première étape (« Vos références », la gamme de NOVA à ce niveau), et un plan
 * de crise dans « Assurance & risques ».
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

describe("les modules du scénario, rangés dans l'étape de leur thème", () => {
  it("une partie solo NOVA n'a plus d'étape « Projets » : ses modules sont dans Budgéter et Équipe & RSE", async () => {
    urlArene = await lancerNova(page);
    const titres = await titresDesEtapes(page);
    expect(titres).not.toContain("Projets");
    expect(titres).toEqual(expect.arrayContaining(["Vendre", "Budgéter", "Équipe & RSE"]));
    expect(await page.getByText("Quels projets engagez-vous").count()).toBe(0);
    // Le compteur suit la barre.
    expect((await nav(page).locator("[data-compteur-de-la-piste]").innerText()).replace(/\s+/g, " ")).toBe(
      `1 / ${titres.length} parcourue`,
    );
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
    await replier(qualite);
    expect(await resume(qualite)).toMatch(/1 engagé/);

    // LA POLITIQUE RH, DANS « ÉQUIPE & RSE ».
    await allerA(page, "Équipe & RSE");
    const rh = unModule(page, "activeHRPolicyIds");
    expect(await rh.count(), "politiques RH absentes d'Équipe & RSE").toBe(1);
    expect(await rh.isVisible()).toBe(true);
    expect(await estDeplie(rh)).toBe(false);
    await deplier(rh);
    const caseRh = rh.locator('input[type="checkbox"]').first();
    await caseRh.check();
    libelleRh = ((await caseRh.locator("xpath=..").innerText()).split(" · ")[0] ?? "").trim();
    expect(libelleRh.length).toBeGreaterThan(0);
    expect(await rh.innerText()).toMatch(/Engagé ce tour : .*€/);
    // La formation se décide par un effectif, dans la même étape.
    expect(await unModule(page, "trainingEnrollments").locator('input[type="number"]').count()).toBeGreaterThan(0);
    if (CAPTURES) {
      await etapeAffichee(page).screenshot({ path: `${CAPTURES}/equipe-ordinateur.png` });
      await allerA(page, "Budgéter");
      await etapeAffichee(page).screenshot({ path: `${CAPTURES}/budgeter-ordinateur.png` });
    }
  }, 60_000);

  it("un effectif refusé ramène à « Équipe & RSE », module de formation déplié, focus sur le champ", async () => {
    await allerA(page, "Équipe & RSE");
    const formation = unModule(page, "trainingEnrollments");
    await deplier(formation);
    const champ = formation.locator('input[type="number"]').first();
    const max = Number(await champ.getAttribute("max"));
    expect(max).toBeGreaterThan(0);
    await champ.fill(String(max + 1));
    await replier(formation);
    await jusquALaValidation(page);
    expect(await etapeCourante(page)).not.toBe("Équipe & RSE");
    await page.getByRole("button", { name: /Valider et simuler/ }).first().click();
    await page.waitForTimeout(600);
    expect(await etapeCourante(page)).toBe("Équipe & RSE");
    expect(await estDeplie(formation), "le module fautif se déplie").toBe(true);
    const nom = await champ.getAttribute("name");
    expect(await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.name)).toBe(nom);
    expect(await page.locator("[data-recapitulatif-des-erreurs]").isVisible()).toBe(true);
    if (CAPTURES) await formation.screenshot({ path: `${CAPTURES}/refus-formation-ordinateur.png` });
    await champ.fill("");
    await page.waitForTimeout(300);
    expect(await page.locator("[data-recapitulatif-des-erreurs]").count()).toBe(0);
  }, 60_000);

  it("un arrêt refusé (rien ne tourne) ramène aux politiques RH, module déplié, message dedans", async () => {
    const rh = unModule(page, "activeHRPolicyIds");
    await replier(rh);
    // Une case « Arrêter » qui ne vise rien : celle d'un formulaire périmé ou forgé.
    await page.evaluate(() => {
      const form = document.querySelector("[data-modules-de-decision]")!.closest("form")!;
      const i = document.createElement("input");
      i.type = "checkbox";
      i.name = "module.arret.activeHRPolicyIds.fantome";
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
    expect(await etapeCourante(page)).toBe("Équipe & RSE");
    expect(await estDeplie(rh)).toBe(true);
    expect(await lu(rh.locator("[data-refus-du-module]"))).toContain("arrêt");
    expect(await lu(page.locator("[data-recapitulatif-des-erreurs]"))).toContain("arrêt");
    if (CAPTURES) await rh.screenshot({ path: `${CAPTURES}/refus-arret-ordinateur.png` });
    // Le lien du récapitulatif y ramène aussi, d'une autre étape.
    await replier(rh);
    await allerA(page, "Budgéter");
    await page.locator('[data-lien-du-refus="module:activeHRPolicyIds"]').click();
    await page.waitForTimeout(400);
    expect(await etapeCourante(page)).toBe("Équipe & RSE");
    expect(await estDeplie(rh)).toBe(true);
    await page.evaluate(() => document.getElementById("arret-fantome")?.remove());
  }, 60_000);

  it("un brouillon restauré déplie les modules où l'équipe a coché, et eux seuls", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_200);
    expect(await page.locator("#arret-fantome").count()).toBe(0);
    await allerA(page, "Équipe & RSE");
    const rh = unModule(page, "activeHRPolicyIds");
    expect(await estDeplie(rh), "coché dans le brouillon : déplié").toBe(true);
    expect(await rh.locator('input[type="checkbox"]').first().isChecked()).toBe(true);
    expect(await resume(rh)).toMatch(/1 engagé/);
    expect(await estDeplie(unModule(page, "trainingEnrollments")), "rien de coché : replié").toBe(false);
    await allerA(page, "Budgéter");
    expect(await estDeplie(unModule(page, "qualityActions"))).toBe(true);
    expect(await estDeplie(unModule(page, "hsActions"))).toBe(false);
  }, 60_000);

  it("validé, le récapitulatif range chaque module sous le thème de son étape", async () => {
    const recap = await validerEtRelire(page, urlArene);
    expect(await lu(recap)).toContain("Modules engagés ce tour");
    const budgets = recap.locator('[data-modules-du-theme="budgets"]');
    expect(await lu(budgets)).toContain("Budgéter");
    expect(await lu(budgets)).toContain("Démarches qualité");
    expect(await lu(budgets)).toContain(libelle);
    expect(await lu(budgets)).toMatch(/Coût du tour \d[\d ]* €/);
    expect(await lu(budgets)).not.toContain("Politiques RH");
    const equipe = recap.locator('[data-modules-du-theme="equipe"]');
    expect(await lu(equipe)).toContain("Équipe & RSE");
    expect(await lu(equipe)).toContain("Politiques RH");
    expect(await lu(equipe)).toContain(libelleRh);
    if (CAPTURES) await recap.screenshot({ path: `${CAPTURES}/recapitulatif-ordinateur.png` });
  }, 240_000);

  it("au tour suivant, la démarche est « déjà engagée » et le niveau d'après est proposé", async () => {
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
  }, 120_000);

  it("au tour 2, la politique RH se lit dans « Déjà engagé » et s'arrête ; sur téléphone, les modules sont repliés", async () => {
    await allerA(page, "Équipe & RSE");
    const rh = unModule(page, "activeHRPolicyIds");
    expect(await resume(rh)).toMatch(/1 en cours/);
    await deplier(rh);
    const engage = rh.locator("[data-modules-en-cours]");
    expect(await engage.innerText()).toContain(libelleRh);
    if (CAPTURES) await rh.screenshot({ path: `${CAPTURES}/arret-ordinateur.png` });

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
    for (const etape of ["budgets", "equipe"]) {
      for (let k = 0; k < 25 && !(await p2.locator(`[data-modules-de-decision="${etape}"]:visible`).count()); k++) {
        const suivant = p2.getByRole("button", { name: /^Suivant/ }).last();
        if (!(await suivant.count())) break;
        await suivant.click();
        await p2.waitForTimeout(300);
      }
      const bloc = p2.locator(`[data-modules-de-decision="${etape}"]`);
      expect(await bloc.isVisible(), `carte des modules « ${etape} » sur téléphone`).toBe(true);
      // Chaque module y est replié : une ligne par module.
      const ouverts = await bloc.locator("details").evaluateAll((ds) => ds.filter((x) => (x as HTMLDetailsElement).open).length);
      expect(ouverts).toBe(0);
      const h = await bloc.evaluate((b) => b.getBoundingClientRect().height);
      console.log(`[mesure] modules de l'étape ${etape} sur téléphone, repliés : ${Math.round(h)} px`);
      if (CAPTURES) await p2.screenshot({ path: `${CAPTURES}/${etape}-telephone.png`, fullPage: false });
    }
    const rh2 = p2.locator('[data-module-de-decision="activeHRPolicyIds"]');
    await rh2.locator("summary").first().click();
    expect(await rh2.locator("details").first().evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    if (CAPTURES) await p2.screenshot({ path: `${CAPTURES}/arret-telephone.png`, fullPage: false });
    await tel.close();

    await engage.getByLabel("Arrêter").first().check();
    expect(await resume(rh)).toMatch(/1 arrêt/);
    const recap = await validerEtRelire(page, urlArene);
    const equipe = recap.locator('[data-modules-du-theme="equipe"]');
    expect(await lu(equipe), await lu(recap)).toMatch(new RegExp(`arrêté : ${echapper(libelleRh)}`));
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
    await allerA(page, "Équipe & RSE");
    const rh = unModule(page, "activeHRPolicyIds");
    await deplier(rh);
    const engage = rh.locator("[data-modules-en-cours]");
    if (await engage.count()) expect(await engage.innerText()).not.toContain(libelleRh);
    expect(await rh.innerText()).toContain(libelleRh);
  }, 120_000);
});

describe("au niveau Stratégie : la stratégie de prix à la vente, un plan de crise à « Assurance & risques »", () => {
  let p: Page;
  let ctx: BrowserContext;
  let url = "";
  let strategie = "";
  let plan = "";
  let politique = "";

  it("la stratégie de prix se décide dans la première étape, repliée puis dépliée", async () => {
    ctx = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
    await enseignantSousLicence(ctx);
    p = await ctx.newPage();
    url = await lancerNova(p, 5);
    const titres = await titresDesEtapes(p);
    expect(titres).not.toContain("Projets");
    expect(titres).toContain("Assurance & risques");
    expect(titres).toContain("Équipe & RSE");
    // La première étape (« Vendre », « Vos références » en gamme) porte la stratégie de prix.
    expect(await etapeCourante(p)).toBe(titres[0]);
    const prix = unModule(p, "activePricingStrategyIds");
    expect(await prix.isVisible()).toBe(true);
    expect(await prix.evaluate((m) => m.closest("[data-etape]")?.getAttribute("data-etape"))).toBe("0");
    expect(await estDeplie(prix)).toBe(false);
    if (CAPTURES) {
      await p.locator('[data-engagements-du-tour="vendre"]').screenshot({ path: `${CAPTURES}/vendre-replie-ordinateur.png` });
    }
    await deplier(prix);
    const c = prix.locator('input[type="checkbox"]').first();
    await c.check();
    strategie = ((await c.locator("xpath=..").innerText()).split(" · ")[0] ?? "").trim();
    expect(await resume(prix)).toMatch(/1 engagé/);
    if (CAPTURES) await prix.screenshot({ path: `${CAPTURES}/strategie-de-prix-ordinateur.png` });
  }, 240_000);

  it("une politique RH dans « Équipe & RSE », un plan de crise dans « Assurance & risques »", async () => {
    await allerA(p, "Équipe & RSE");
    const rh = unModule(p, "activeHRPolicyIds");
    expect(await rh.isVisible()).toBe(true);
    await deplier(rh);
    const c = rh.locator('input[type="checkbox"]').first();
    await c.check();
    politique = ((await c.locator("xpath=..").innerText()).split(" · ")[0] ?? "").trim();

    await allerA(p, "Assurance & risques");
    const crise = unModule(p, "activeCrisisPlanIds");
    expect(await crise.isVisible()).toBe(true);
    expect(await estDeplie(crise)).toBe(false);
    await deplier(crise);
    const cp = crise.locator('input[type="checkbox"]').first();
    await cp.check();
    plan = ((await cp.locator("xpath=..").innerText()).split(" · ")[0] ?? "").trim();
    expect(await resume(crise)).toMatch(/1 engagé/);
    if (CAPTURES) await etapeAffichee(p).screenshot({ path: `${CAPTURES}/assurance-et-risques-ordinateur.png` });
    // Un module ne se range qu'à une étape : aucun n'est en double.
    for (const d of ["activePricingStrategyIds", "activeHRPolicyIds", "activeCrisisPlanIds"]) {
      expect(await unModule(p, d).count(), d).toBe(1);
    }
  }, 60_000);

  it("validé, chaque choix se lit au récapitulatif sous le bon thème", async () => {
    const recap = await validerEtRelire(p, url);
    const vendre = recap.locator('[data-modules-du-theme="vendre"]');
    expect(await lu(vendre)).toContain("Stratégie de prix");
    expect(await lu(vendre)).toContain(strategie);
    const equipe = recap.locator('[data-modules-du-theme="equipe"]');
    expect(await lu(equipe)).toContain("Équipe & RSE");
    expect(await lu(equipe)).toContain(politique);
    const assurance = recap.locator('[data-modules-du-theme="assurance"]');
    expect(await lu(assurance)).toContain("Assurance & risques");
    expect(await lu(assurance)).toContain("Plans de crise");
    expect(await lu(assurance)).toContain(plan);
    if (CAPTURES) await recap.screenshot({ path: `${CAPTURES}/recapitulatif-strategie-ordinateur.png` });
    await ctx.close();
  }, 240_000);
});
