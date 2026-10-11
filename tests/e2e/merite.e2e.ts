import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { mesurerContraste } from "./helpers/contraste";

/**
 * MÉRITE OU CHANCE, DANS UN NAVIGATEUR : une partie solo jouée jusqu'au bilan,
 * sur le build de production et sa base.
 *
 *   1. PENDANT LA PARTIE, RIEN : aucun des trois blocs, aucun « marché
 *      possible » à l'écran avant la fin.
 *   2. AU BILAN, À 1280 ET 390 : les trois blocs (vos décisions tenaient-elles,
 *      ce que la partie montre, et ensuite), la distribution (trente points
 *      par rangée, votre partie marquée), la fourchette des places, aucun
 *      défilement de côté, et aucun bouton plein dans les trois blocs (le seul
 *      reste « Rejouer »).
 *   3. ET ENSUITE : un niveau ouvert se lance d'un lien qui règle /jouer ; un
 *      niveau fermé sans licence est montré, avec les tarifs, sans lien de
 *      lancement ; et /jouer ne présélectionne jamais un niveau fermé.
 *
 * Le joueur relève son prix de 8 % au premier tour et garde ensuite ce que le
 * formulaire lui propose : une partie ordinaire, pas un cas fabriqué.
 *
 * Captures (facultatives) : `CAPTURES=<dossier>`.
 */

const CAPTURES = process.env.CAPTURES;
let navigateur: Browser;
let ordi: BrowserContext;
let page: Page;
let urlArene: string;

async function jouerUnTour(p: Page, tour: number): Promise<void> {
  await p.goto(urlArene, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(400);
  }
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(900);
  const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
  if (await ouvrir.isVisible().catch(() => false)) {
    await ouvrir.click();
    await p.waitForTimeout(1_200);
    const note = p.getByRole("button", { name: /pris note/ }).first();
    if (await note.isVisible().catch(() => false)) await note.click();
  }
  let prixFixe = tour !== 1;
  for (let k = 0; k < 20; k++) {
    if (!prixFixe) {
      const prix = p.locator('input[name="price"]').first();
      if (await prix.isVisible().catch(() => false)) {
        const v = Number((await prix.inputValue()).replace(",", "."));
        await prix.fill(String(Math.round(v * 1.08 * 10) / 10));
        prixFixe = true;
      }
    }
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) break;
    await p.getByRole("button", { name: /^Suivant/ }).last().click();
    await p.waitForTimeout(250);
  }
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  if (await garder.count()) await garder.first().click();
  await p.waitForURL(/simule/, { timeout: 180_000 });
}

/** Ce que les trois blocs montrent, lu dans la page. */
async function lireLeMerite(p: Page) {
  const bloc = p.locator("[data-merite-de-la-partie]");
  await bloc.waitFor({ timeout: 60_000 });
  return p.evaluate(() => {
    const r = document.querySelector<HTMLElement>("[data-merite-de-la-partie]")!;
    const visibles = (sel: string) =>
      [...r.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getBoundingClientRect().width > 0).length;
    return {
      cas: r.dataset.cas ?? null,
      blocs: [...r.querySelectorAll<HTMLElement>("[data-bloc-du-merite]")].map((b) => b.dataset.blocDuMerite),
      verdict: r.querySelector("[data-verdict-du-merite]")?.textContent?.trim() ?? "",
      fourchette: r.querySelector("[data-fourchette-de-rang]")?.textContent?.trim() ?? "",
      pointsJoueur: visibles('[data-rangee="joueur"] span[title]'),
      pointsReference: visibles('[data-rangee="reference"] span[title]'),
      votrePartie: visibles("[data-votre-partie]"),
      constats: r.querySelectorAll("[data-constat]").length,
      niveau: Number(r.querySelector<HTMLElement>("[data-niveau-conseille]")?.dataset.niveauConseille ?? 0),
      lien: r.querySelector<HTMLAnchorElement>("[data-lien-de-la-suite]")?.getAttribute("href") ?? null,
      ferme: r.querySelector("[data-niveau-ferme]")?.textContent?.trim() ?? null,
      tarifs: r.querySelector<HTMLAnchorElement>("[data-niveau-ferme] a")?.getAttribute("href") ?? null,
      pleins: r.querySelectorAll(".bouton-plein").length,
      deCote: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  ordi = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
  page = await ordi.newPage();
  await page.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /NOVA/ }).first().click();
  await page.getByRole("button", { name: /^Niveau 3/ }).click();
  await page.getByRole("button", { name: "Lancer la partie" }).click();
  await page.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (page.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  }
  urlArene = page.url().split("?")[0]!.split("#")[0]!;
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("mérite ou chance, de la partie au bilan", () => {
  it("pendant la partie, aucun bloc et aucun marché possible", async () => {
    await jouerUnTour(page, 1);
    await page.goto(urlArene, { waitUntil: "networkidle" });
    expect(await page.locator("[data-merite-de-la-partie], [data-merite-en-attente]").count()).toBe(0);
    expect(await texte(page)).not.toMatch(/marchés possibles|La part du hasard/);
  }, 240_000);

  it("au bilan, à 1280 : les trois blocs, la distribution, la fourchette, aucun bouton plein", async () => {
    for (let t = 2; t <= 6; t++) {
      await page.goto(urlArene, { waitUntil: "networkidle" });
      if (await page.locator("[data-cloture-de-l-exercice]").count()) break;
      await jouerUnTour(page, t);
    }
    await page.goto(urlArene, { waitUntil: "networkidle" });
    await page.locator("[data-cloture-de-l-exercice]").waitFor({ timeout: 60_000 });
    const m = await lireLeMerite(page);
    expect(m.blocs).toEqual(["decisions", "constats", "ensuite"]);
    expect(["merite", "malchance", "chance", "lecon"]).toContain(m.cas);
    expect(m.verdict).toMatch(/^(Mérité|Malchance|Chance|Leçon)\. /);
    expect(m.fourchette).toMatch(/^Sur 30 marchés possibles, avec vos décisions : /);
    expect(m.pointsJoueur).toBe(30);
    expect(m.pointsReference).toBe(30);
    expect(m.votrePartie).toBe(1);
    expect(m.constats).toBeGreaterThanOrEqual(2);
    expect(m.niveau).toBeGreaterThanOrEqual(1);
    expect(m.pleins).toBe(0);
    expect(m.deCote).toBeLessThanOrEqual(0);
    // Le seul bouton plein du bilan reste « Rejouer ».
    expect(await page.locator("[data-actions-de-cloture] .bouton-plein").count()).toBe(1);
    // Les trois intitulés, en toutes lettres.
    const t = await texte(page);
    for (const titre of ["Vos décisions tenaient-elles ?", "Ce que la partie montre", "Et ensuite"]) {
      expect(t).toContain(titre);
    }
    console.info(`[merite e2e] ${urlArene} : ${JSON.stringify(m)}`);
    if (CAPTURES) {
      await page.screenshot({ path: `${CAPTURES}/bilan-solo-1280.png`, fullPage: true });
      await page.locator("[data-merite-de-la-partie]").screenshot({ path: `${CAPTURES}/merite-1280.png` });
    }
  }, 900_000);

  it("au bilan, chaque texte des trois blocs se lit (contraste mesuré)", async () => {
    await page.goto(urlArene, { waitUntil: "networkidle" });
    await page.locator("[data-merite-de-la-partie]").waitFor({ timeout: 60_000 });
    const dansLesBlocs = (await page.locator("[data-merite-de-la-partie]").innerText()).replace(/\s+/g, " ");
    // Le tableau caché (pour une synthèse vocale) n'est pas peint : il ne se mesure pas.
    const caches = await page.evaluate(() =>
      [...document.querySelectorAll("[data-merite-de-la-partie] .sr-only, [data-merite-de-la-partie] .sr-only *")].map(
        (e) => (e.textContent ?? "").replace(/\s+/g, " ").trim(),
      ),
    );
    const mesures = (await mesurerContraste(page, "clair")).filter((m) => {
      const t = m.texte.replace(/\s+/g, " ").trim();
      return dansLesBlocs.includes(t) && !caches.includes(t);
    });
    expect(mesures.length).toBeGreaterThan(15);
    const fautes = mesures.filter((m) => m.ratio < m.seuil);
    expect(fautes, JSON.stringify(fautes)).toEqual([]);
  }, 120_000);

  it("au bilan, à 390 : les mêmes blocs, sans défilement de côté", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await ordi.storageState(),
    });
    const q = await tel.newPage();
    await q.goto(urlArene, { waitUntil: "networkidle" });
    const m = await lireLeMerite(q);
    expect(m.blocs).toEqual(["decisions", "constats", "ensuite"]);
    expect(m.pointsJoueur).toBe(30);
    expect(m.pointsReference).toBe(30);
    expect(m.deCote).toBeLessThanOrEqual(0);
    // Aucun point ne sort de sa rangée.
    const debords = await q.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[data-rangee] span[title]")].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.left < 0 || r.right > innerWidth;
      }).length,
    );
    expect(debords).toBe(0);
    if (CAPTURES) {
      await q.screenshot({ path: `${CAPTURES}/bilan-solo-390.png`, fullPage: true });
      await q.locator("[data-merite-de-la-partie]").screenshot({ path: `${CAPTURES}/merite-390.png` });
    }
    await tel.close();
  }, 120_000);

  it("et ensuite : un niveau ouvert se lance, un niveau fermé se montre sans se lancer", async () => {
    await page.goto(urlArene, { waitUntil: "networkidle" });
    const m = await lireLeMerite(page);
    if (m.niveau > 3) {
      // Sans licence, les niveaux 4 à 6 sont fermés : montrés, pas lançables.
      expect(m.lien).toBeNull();
      expect(m.ferme).toMatch(/inclus dans/);
      expect(m.tarifs).toBe("/tarifs");
      if (CAPTURES) {
        await page
          .locator('[data-bloc-du-merite="ensuite"]')
          .screenshot({ path: `${CAPTURES}/ensuite-niveau-ferme-1280.png` });
      }
    } else {
      expect(m.ferme).toBeNull();
      expect(m.lien).toMatch(new RegExp(`^/jouer\\?secteur=[a-z-]+&niveau=${m.niveau}$`));
      await page.locator("[data-lien-de-la-suite]").click();
      await page.waitForURL(/\/jouer\?/, { timeout: 60_000 });
      await page.waitForLoadState("networkidle");
      expect(await texte(page)).toMatch(new RegExp(`Niveau ${m.niveau} · `));
    }
  }, 120_000);

  it("un niveau fermé demandé à /jouer n'y est pas présélectionné sans licence", async () => {
    const ctx = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/jouer?secteur=nova&niveau=5`, { waitUntil: "networkidle" });
    const t = await texte(p);
    expect(t).not.toMatch(/Niveau 5 · /);
    expect(t).toMatch(/Niveau 3 · /);
    await p.goto(`${BASE}/jouer?secteur=hotel&niveau=2`, { waitUntil: "networkidle" });
    expect(await texte(p)).toMatch(/Niveau 2 · /);
    await ctx.close();
  }, 120_000);
});
