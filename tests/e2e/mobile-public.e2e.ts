import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * LE SITE PUBLIC, AU POUCE.
 *
 * Six largeurs de téléphone, sans scroll horizontal ; un menu rangé par
 * intention, aux zones tactiles de 44 px ; des fiches qui se replient sur
 * téléphone et restent à plat sur grand écran ; un parcours d'orientation en
 * étapes ; une barre d'action basse qui se tait quand le bouton est déjà là.
 */

const LARGEURS = [320, 360, 375, 390, 414, 430];
const PAGES = [
  "/",
  "/enseignants",
  "/entreprises",
  "/fonctionnalites",
  "/animations",
  "/guide",
  "/orientation",
  "/parcours",
  "/notions",
];

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

async function telephone(largeur = 390): Promise<{ contexte: BrowserContext; page: Page }> {
  const contexte = await navigateur.newContext({
    ...devices["iPhone 13"],
    viewport: { width: largeur, height: 780 },
    locale: "fr-FR",
  });
  // L'invitation à installer occupe le même bord que la barre d'action : on la
  // tait ici, comme le ferait un visiteur qui l'a déjà fermée.
  await contexte.addInitScript(() => {
    try {
      localStorage.setItem("install-prompt-ferme-le", String(Date.now()));
    } catch {
      /* rien */
    }
  });
  return { contexte, page: await contexte.newPage() };
}

async function ouvrir(page: Page, chemin: string) {
  await page.goto(`${BASE}${chemin}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

describe("aucun scroll horizontal, aux six largeurs", () => {
  for (const largeur of LARGEURS) {
    it(`${largeur} px`, async () => {
      const { contexte, page } = await telephone(largeur);
      const fautes: string[] = [];
      for (const chemin of PAGES) {
        await ouvrir(page, chemin);
        const { sw, cw } = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
        }));
        if (sw > cw) fautes.push(`${chemin} : ${sw} > ${cw}`);
      }
      await contexte.close();
      expect(fautes).toEqual([]);
    });
  }
});

describe("le menu, rangé par intention", () => {
  it("quatre intentions, des groupes d'au moins 44 px", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    for (const titre of ["Jouer", "Enseignants", "Établissements", "Découvrir"]) {
      const groupe = page.locator("#plan-du-site button[aria-controls^='groupe-']", {
        hasText: titre,
      });
      await groupe.first().waitFor({ state: "visible" });
      const boite = (await groupe.first().boundingBox())!;
      expect(boite.height, `groupe « ${titre} » trop bas`).toBeGreaterThanOrEqual(43.5); // min-h-11 = 44 px, au sous-pixel près
    }
    // « Jouer » est ouvert d'office : on joue sans chercher.
    await page.getByRole("link", { name: /Jouer maintenant/ }).waitFor({ state: "visible" });
    await contexte.close();
  });
});

describe("les fiches se replient sur téléphone, restent à plat ailleurs", () => {
  it("entreprises : la carte d'abord, le détail à la demande", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/entreprises");
    const fiche = page.locator("article").first();
    const detail = fiche.locator("details");
    expect(await detail.evaluate((d: HTMLDetailsElement) => d.open)).toBe(false);
    await fiche.getByText("Voir le détail de l'entreprise").click();
    expect(await detail.evaluate((d: HTMLDetailsElement) => d.open)).toBe(true);
    await contexte.close();
  });

  it("entreprises : sur grand écran, tout est ouvert et le bouton a disparu", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    const page = await ctx.newPage();
    await ouvrir(page, "/entreprises");
    const detail = page.locator("article").first().locator("details");
    await page.waitForFunction(() => document.querySelector("article details")?.hasAttribute("open"));
    expect(await detail.evaluate((d: HTMLDetailsElement) => d.open)).toBe(true);
    expect(await page.locator("article").first().getByText("Voir le détail de l'entreprise").isVisible()).toBe(false);
    await ctx.close();
  });

  it("fonctionnalités : les modèles s'ouvrent à la demande", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/fonctionnalites");
    const resume = page.getByText("Afficher les modèles d'analyse");
    await resume.scrollIntoViewIfNeeded();
    await resume.click();
    const premier = page.locator("details", { has: resume }).locator("p.font-medium").first();
    await premier.waitFor({ state: "visible" });
    await contexte.close();
  });

  it("guide : une ancre ouvre la section visée", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/guide#etablissements");
    await page.waitForFunction(
      () => (document.querySelector("#etablissements > details") as HTMLDetailsElement | null)?.open === true,
    );
    await contexte.close();
  });
});

describe("l'orientation, une question à la fois", () => {
  it("quatre étapes, puis la recommandation", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/orientation");
    await page.getByText("Étape 1 sur 4").waitFor({ state: "visible" });
    expect(await page.locator("select[name=objectif]").isVisible()).toBe(false);

    await page.locator("select[name=diplome]").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByText("Étape 2 sur 4").waitFor({ state: "visible" });

    // Un choix à deux boutons avance seul.
    await page.getByRole("button", { name: /Premier semestre/ }).click();
    await page.getByText("Étape 3 sur 4").waitFor({ state: "visible" });

    await page.locator("select[name=objectif]").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByText("Étape 4 sur 4").waitFor({ state: "visible" });

    await page.getByRole("button", { name: "Voir ma recommandation" }).click();
    await page.getByText("Ce que nous vous conseillons").waitFor({ state: "visible" });
    await page.getByText("Entreprise", { exact: true }).waitFor({ state: "visible" });
    expect(await page.locator("input[name=email]").isVisible()).toBe(true);
    await contexte.close();
  });

  it("sur grand écran, le formulaire est celui d'avant : tout est visible", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    const page = await ctx.newPage();
    await ouvrir(page, "/orientation");
    for (const nom of ["diplome", "objectif", "message", "email"]) {
      expect(await page.locator(`[name=${nom}]`).first().isVisible(), nom).toBe(true);
    }
    await ctx.close();
  });
});

describe("la barre d'action basse", () => {
  it("se tait tant que le bouton principal est à l'écran, puis se montre", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/");
    const barre = page.locator("[data-barre-action]");
    await page.waitForFunction(() => document.querySelector("[data-barre-action]")?.hasAttribute("inert"));
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForFunction(() => !document.querySelector("[data-barre-action]")?.hasAttribute("inert"));
    await barre.getByRole("link", { name: "Choisir ma simulation" }).waitFor({ state: "visible" });
    expect(await barre.getByRole("link", { name: "Jouer" }).isVisible()).toBe(true);
    await contexte.close();
  });

  it("côté enseignant, elle propose l'espace enseignant", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/animations");
    await page.evaluate(() => window.scrollTo(0, 1200));
    const barre = page.locator("[data-barre-action]");
    await barre.getByRole("link", { name: "Enseignant" }).waitFor({ state: "visible" });
    await contexte.close();
  });

  it("se ferme, et ne revient pas pendant la session", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/entreprises");
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.getByRole("button", { name: "Fermer la barre d'actions" }).click();
    await ouvrir(page, "/fonctionnalites");
    await page.evaluate(() => window.scrollTo(0, 1200));
    expect(await page.locator("[data-barre-action]").count()).toBe(1);
    await page.waitForFunction(() => document.querySelector("[data-barre-action]")?.hasAttribute("inert"));
    await contexte.close();
  });

  it("n'existe pas là où l'on joue ou remplit un formulaire, ni sur grand écran", async () => {
    const { contexte, page } = await telephone();
    for (const chemin of ["/jouer", "/rendez-vous", "/join"]) {
      await ouvrir(page, chemin);
      expect(await page.locator("[data-barre-action]").count(), chemin).toBe(0);
    }
    await contexte.close();
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
    const grand = await ctx.newPage();
    await ouvrir(grand, "/entreprises");
    await grand.evaluate(() => window.scrollTo(0, 1200));
    expect(await grand.locator("[data-barre-action]").isVisible()).toBe(false);
    await ctx.close();
  });
});
