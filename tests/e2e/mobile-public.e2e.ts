import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { NAVIGATION } from "../../src/config/navigation";

/**
 * LE SITE PUBLIC, AU POUCE.
 *
 * Six largeurs de téléphone, sans scroll horizontal ; un menu rangé par
 * produit, un mot par entrée, aux zones tactiles de 44 px ; des fiches qui se replient sur
 * téléphone et restent à plat sur grand écran ; un parcours d'orientation en
 * étapes ; une barre d'action basse qui se tait quand le bouton est déjà là.
 */

const LARGEURS = [320, 360, 375, 390, 414, 430];
const PAGES = [
  "/",
  "/enseignants",
  "/ecoles",
  "/entreprises",
  "/fonctionnalites",
  "/animations",
  "/guide",
  "/orientation",
  "/parcours",
  "/notions",
  "/tarifs",
  // Le devis venu du cours, et sa liste des parcours aux noms longs (audit produit du 10 novembre 2026, P1-4).
  "/devis?offre=classe&source=cours&parcours=but-gaco",
  "/integration",
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

describe("le menu, rangé par produit", () => {
  it("les deux portes en tête, puis les 5 groupes dépliés, d'au moins 44 px au doigt", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.locator("#plan-du-site");
    // En tête, Rejoindre et Connexion, et rien d'autre : la barre du téléphone ne les montre pas.
    const portes = menu.locator("[data-portes-du-menu] a");
    await portes.first().waitFor({ state: "visible" });
    expect(await portes.evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()))).toEqual(["Rejoindre", "Connexion"]);
    // Puis les groupes du plan, dans son ordre, chacun sous le mot de la barre et vers la même page :
    // sur téléphone, c'est par eux qu'on atteint la présentation de l'arène et les offres.
    expect(await menu.locator("[data-groupe-du-menu]").evaluateAll((els) => els.map((e) => e.getAttribute("data-groupe-du-menu")))).toEqual(
      NAVIGATION.map((g) => g.code),
    );
    for (const g of NAVIGATION) {
      const titre = menu.locator(`[data-groupe-du-menu="${g.code}"] [data-titre-du-groupe]`);
      expect((await titre.innerText()).trim(), g.code).toBe(g.titre);
      expect(await titre.getAttribute("href"), g.code).toBe(g.entree);
    }
    // Tout ce qui se touche fait 44 px de haut : les portes, les titres, les entrées.
    const hauteurs = await menu.locator("a").evaluateAll((els) =>
      els.map((e) => ({ mot: (e.textContent ?? "").trim(), haut: e.getBoundingClientRect().height })),
    );
    expect(hauteurs.length).toBeGreaterThan(NAVIGATION.length + 2);
    // min-h-11 = 44 px, au sous-pixel près (mesuré entre 43,4 et 43,7).
    for (const h of hauteurs) expect(h.haut, `« ${h.mot} » trop bas`).toBeGreaterThanOrEqual(43);
    // Le solo se voit sans rien déplier ; la barre d'action basse le propose aussi, sous son verbe.
    await menu.getByRole("link", { name: "Solo", exact: true }).waitFor({ state: "visible" });
    // Les 3 phrases de la pédagogie se lisent sous leur titre, sans déborder.
    const phrases = menu.locator("[data-phrase-du-groupe]");
    expect(await phrases.count()).toBe(NAVIGATION.filter((g) => g.phrase).length);
    for (let i = 0; i < (await phrases.count()); i += 1) expect(await phrases.nth(i).isVisible()).toBe(true);
    await contexte.close();
  });

  it("le menu déplié ne déborde pas, aux six largeurs", async () => {
    const fautes: string[] = [];
    for (const largeur of LARGEURS) {
      const { contexte, page } = await telephone(largeur);
      await ouvrir(page, "/");
      await page.getByRole("button", { name: "Menu" }).click();
      await page.locator("#plan-du-site [data-titre-du-groupe]").first().waitFor({ state: "visible" });
      const m = await page.evaluate(() => {
        const carte = document.querySelector("#plan-du-site .carte")!;
        const r = carte.getBoundingClientRect();
        return {
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          carte: carte.scrollWidth - carte.clientWidth,
          dehors: [...carte.querySelectorAll("a")]
            .filter((a) => {
              const b = a.getBoundingClientRect();
              return b.left < r.left - 0.5 || b.right > r.right + 0.5;
            })
            .map((a) => (a.textContent ?? "").trim()),
        };
      });
      if (m.page > 0 || m.carte > 0 || m.dehors.length > 0) fautes.push(`${largeur} px : ${JSON.stringify(m)}`);
      await contexte.close();
    }
    expect(fautes).toEqual([]);
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

  it("entreprises : sur grand écran aussi, la fiche est une carte et le détail s'ouvre à la demande", async () => {
    // LE REPLI VAUT SUR TOUS LES ÉCRANS (audit P3-07) : neuf fiches ouvertes
    // faisaient neuf mille pixels sur un ordinateur. Le détail reste fermé
    // après l'hydratation, et le résumé l'ouvre.
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    const page = await ctx.newPage();
    await ouvrir(page, "/entreprises");
    const fiche = page.locator("article").first();
    const detail = fiche.locator("details");
    await page.waitForLoadState("networkidle");
    expect(await detail.evaluate((d: HTMLDetailsElement) => d.open)).toBe(false);
    await fiche.getByText("Voir le détail de l'entreprise").click();
    expect(await detail.evaluate((d: HTMLDetailsElement) => d.open)).toBe(true);
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
    // UN SEUL BOUTON, DE 48 PX (audit P3-09) : l'appel de la page, jouer.
    // Lot P6 : sur la vitrine, il redit le bouton du héros, « Tester le
    // simulateur », et mène au même endroit.
    const appel = barre.getByRole("link", { name: "Tester le simulateur" });
    await appel.waitFor({ state: "visible" });
    expect(await appel.getAttribute("href")).toBe("/jouer");
    expect(await barre.getByRole("link").count(), "un seul lien dans la barre").toBe(1);
    const hauteur = (await barre.getByRole("link").boundingBox())!.height;
    expect(hauteur, `bouton de ${hauteur} px`).toBeGreaterThanOrEqual(48);
    await contexte.close();
  });

  it("côté enseignants, elle propose de choisir sa simulation", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/animations");
    await page.evaluate(() => window.scrollTo(0, 1200));
    const barre = page.locator("[data-barre-action]");
    await barre.getByRole("link", { name: "Choisir ma simulation" }).waitFor({ state: "visible" });
    expect(await barre.getByRole("link").count(), "un seul lien dans la barre").toBe(1);
    await contexte.close();
  });

  it("l'en-tête se retire quand on descend, et revient quand on remonte", async () => {
    const { contexte, page } = await telephone();
    await ouvrir(page, "/entreprises");
    const enTete = page.locator("[data-en-tete-du-site]");
    const haut = async () => (await enTete.boundingBox())!.y;
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForFunction(() => document.documentElement.dataset.defile === "bas");
    await page.waitForTimeout(400);
    expect(await haut(), "l'en-tête est sorti par le haut").toBeLessThan(-40);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForFunction(() => document.documentElement.dataset.defile === undefined);
    await page.waitForTimeout(400);
    expect(Math.round(await haut()), "l'en-tête est revenu").toBe(0);
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
