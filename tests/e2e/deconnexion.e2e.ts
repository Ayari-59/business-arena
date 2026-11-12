import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Locator, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence, jetonDeSession } from "./helpers/licence";
import { LIBELLE_DECONNEXION, NAVIGATION_ENSEIGNANT } from "../../src/config/navigation";

/**
 * « DÉCONNEXION », DANS UN VRAI NAVIGATEUR (le propriétaire, novembre 2026 : « Il me faut un bouton
 * déconnexion quand je suis connecté »).
 *
 * Connecté, la barre (sur grand écran) et la tête du menu (sur téléphone) disent « Déconnexion » à la
 * place de « Connexion » ; un clic ferme la session, mène à la page de connexion, et « Connexion »
 * revient. Sur grand écran, il n'y a plus de bouton « Menu » (novembre 2026, la maquette A) : chaque mot
 * ouvre son panneau, et les portes ne sont que dans la barre. La rangée de l'espace enseignant finit par « Déconnexion » sur
 * chacune de ses pages ; « Se déconnecter partout » est dans « Mon compte », et ferme aussi la
 * session d'un autre appareil. Le rendu, lui, est gardé par tests/architecture/deconnexion.test.ts.
 *
 * Avec E2E_CAPTURES, chaque écran est photographié, à 1 280 et à 390 px.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

/** Le grand écran ; le téléphone, au doigt (les cibles y font 44 px). L'invite d'installation est déjà fermée. */
async function contexte(largeur: 1280 | 390): Promise<BrowserContext> {
  const c = await navigateur.newContext(
    largeur === 390
      ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" }
      : { viewport: { width: 1280, height: 900 }, locale: "fr-FR" },
  );
  await c.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
  return c;
}

/** Une photo de l'écran, ou d'un élément, quand E2E_CAPTURES est posé. */
async function capturer(page: Page, nom: string, options: { element?: Locator; pleinePage?: boolean } = {}) {
  const dossier = process.env.E2E_CAPTURES;
  if (!dossier) return;
  mkdirSync(dossier, { recursive: true });
  const chemin = join(dossier, `${nom}.png`);
  if (options.element) await options.element.screenshot({ path: chemin });
  else await page.screenshot({ path: chemin, fullPage: options.pleinePage ?? false });
}

const barre = (p: Page) => p.getByRole("navigation", { name: "Navigation principale" });
const enTete = (p: Page) => p.locator("header[data-en-tete-du-site]");
const portesDuMenu = (p: Page) => p.locator("#plan-du-site [data-portes-du-menu]");
const rangee = (p: Page) => p.getByRole("navigation", { name: "Espace enseignant" });
const textes = (bloc: Locator) =>
  bloc.locator("a, button").evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()));
const laSession = async (ctx: BrowserContext) => (await ctx.cookies()).find((c) => c.name === "ba_session");
const debordement = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Ouvre le menu du téléphone, attend sa tête et la fin de son ouverture (il s'ouvre en fondu). */
async function ouvrirLeMenu(p: Page): Promise<Locator> {
  await p.getByRole("button", { name: "Menu" }).click();
  const portes = portesDuMenu(p);
  await portes.waitFor({ state: "visible" });
  await p
    .locator("#plan-du-site")
    .evaluate((menu) => Promise.all(menu.getAnimations({ subtree: true }).map((a) => a.finished)));
  return portes;
}

describe("la barre du site, une fois connecté", () => {
  it("sur grand écran : « Déconnexion » à la place de « Connexion », dans la barre, et dans aucun panneau ; un clic déconnecte, « Connexion » revient", async () => {
    const ctx = await contexte(1280);
    await enseignantSousLicence(ctx);
    const p = await ctx.newPage();
    await aller(p, "/notions");
    const sortie = barre(p).getByRole("button", { name: LIBELLE_DECONNEXION, exact: true });
    expect(await sortie.isVisible(), "la barre ne montre pas « Déconnexion »").toBe(true);
    expect(await barre(p).getByRole("link", { name: "Connexion à l'espace enseignant" }).count()).toBe(0);
    expect(await barre(p).getByRole("link", { name: "Rejoindre avec un code" }).isVisible()).toBe(true);
    await capturer(p, "barre-1280", { element: enTete(p) });
    // Plus de bouton « Menu » sur grand écran, et les panneaux des mots ne portent pas les portes.
    expect(await p.getByRole("button", { name: "Menu" }).isVisible()).toBe(false);
    await barre(p).getByRole("button", { name: "Cours", exact: true }).click();
    const panneau = p.locator('[data-panneau-du-groupe="cours"]');
    await panneau.waitFor({ state: "visible" });
    expect(await panneau.getByRole("button", { name: LIBELLE_DECONNEXION }).count()).toBe(0);
    expect(await enTete(p).getByRole("button", { name: LIBELLE_DECONNEXION, exact: true }).count(), "« Déconnexion » en double").toBe(1);
    await p.keyboard.press("Escape");

    // Un clic : la session se ferme, la page de connexion s'ouvre, et la barre redit « Connexion ».
    await sortie.click();
    await p.waitForURL(`${BASE}/teacher/login`, { timeout: 30_000 });
    await p.waitForLoadState("networkidle");
    expect(await laSession(ctx), "le cookie de session reste après la déconnexion").toBeUndefined();
    await expect.poll(() => barre(p).getByRole("link", { name: "Connexion à l'espace enseignant" }).isVisible()).toBe(true);
    expect(await barre(p).getByRole("button", { name: LIBELLE_DECONNEXION }).count()).toBe(0);
    // L'espace est bien fermé : il renvoie à la connexion.
    await aller(p, "/teacher");
    expect(new URL(p.url()).pathname).toBe("/teacher/login");
    await ctx.close();
  }, 120_000);

  it("sur téléphone (390 px) : « Déconnexion » en tête du menu, 44 px au doigt ; un clic déconnecte, « Connexion » revient", async () => {
    const ctx = await contexte(390);
    await enseignantSousLicence(ctx);
    const p = await ctx.newPage();
    await aller(p, "/");
    await capturer(p, "barre-390", { element: enTete(p) });
    const portes = await ouvrirLeMenu(p);
    expect(await textes(portes)).toEqual(["Rejoindre", LIBELLE_DECONNEXION]);
    const sortie = portes.getByRole("button", { name: LIBELLE_DECONNEXION, exact: true });
    expect((await sortie.boundingBox())!.height, "« Déconnexion » trop bas au doigt").toBeGreaterThanOrEqual(43);
    expect(await debordement(p), "la page déborde à 390 px").toBeLessThanOrEqual(0);
    await capturer(p, "menu-390-connecte");

    await sortie.click();
    await p.waitForURL(`${BASE}/teacher/login`, { timeout: 30_000 });
    await p.waitForLoadState("networkidle");
    expect(await laSession(ctx)).toBeUndefined();
    // Le menu s'est refermé en changeant de page ; rouvert, sa tête redit « Connexion ».
    const portesApres = await ouvrirLeMenu(p);
    await expect.poll(() => textes(portesApres)).toEqual(["Rejoindre", "Connexion"]);
    await ctx.close();
  }, 120_000);

  it("non connecté, rien ne change : Rejoindre et Connexion, dans la barre et en tête du menu du téléphone", async () => {
    const ctx = await contexte(1280);
    const p = await ctx.newPage();
    await aller(p, "/notions");
    expect(await barre(p).getByRole("link", { name: "Connexion à l'espace enseignant" }).isVisible()).toBe(true);
    expect(await enTete(p).getByRole("button", { name: LIBELLE_DECONNEXION }).count()).toBe(0);
    await p.setViewportSize({ width: 390, height: 844 });
    expect(await textes(await ouvrirLeMenu(p))).toEqual(["Rejoindre", "Connexion"]);
    await ctx.close();
  }, 60_000);
});

describe("l'espace enseignant", () => {
  it("la rangée finit par « Déconnexion » sur chacune de ses pages ; l'accueil n'a plus de doublon", async () => {
    const ctx = await contexte(1280);
    await enseignantSousLicence(ctx);
    const p = await ctx.newPage();
    const pages = [...NAVIGATION_ENSEIGNANT.filter((x) => x.href.startsWith("/teacher")).map((x) => x.href), "/teacher/compte"];
    for (const href of pages) {
      await aller(p, href);
      const commandes = await textes(rangee(p));
      expect(commandes.at(-1), `${href} : la rangée ne finit pas par « Déconnexion »`).toBe(LIBELLE_DECONNEXION);
      expect(commandes.filter((c) => c === LIBELLE_DECONNEXION), href).toHaveLength(1);
      expect(await rangee(p).getByRole("button", { name: LIBELLE_DECONNEXION, exact: true }).isVisible(), href).toBe(true);
      expect(await p.getByRole("button", { name: /Se déconnecter/ }).count(), `${href} garde un ancien bouton`).toBe(
        href === "/teacher/compte" ? 1 : 0,
      );
    }
    // L'accueil : « Mon compte », puis « Déconnexion », au bout de la rangée.
    await aller(p, "/teacher");
    expect((await textes(rangee(p))).slice(-2)).toEqual(["Mon compte", LIBELLE_DECONNEXION]);
    await capturer(p, "rangee-1280", { element: rangee(p) });
    await capturer(p, "espace-enseignant-1280");
    await ctx.close();
  }, 180_000);

  it("sur téléphone, « Déconnexion » fait 44 px au bout de la rangée, et rien ne déborde", async () => {
    const ctx = await contexte(390);
    await enseignantSousLicence(ctx);
    const p = await ctx.newPage();
    await aller(p, "/teacher");
    const sortie = rangee(p).getByRole("button", { name: LIBELLE_DECONNEXION, exact: true });
    expect(await sortie.isVisible()).toBe(true);
    expect((await sortie.boundingBox())!.height, "« Déconnexion » trop bas au doigt").toBeGreaterThanOrEqual(43);
    expect(await debordement(p), "l'espace enseignant déborde à 390 px").toBeLessThanOrEqual(0);
    await rangee(p).scrollIntoViewIfNeeded();
    await capturer(p, "rangee-390", { element: rangee(p) });
    await capturer(p, "espace-enseignant-390");
    await ctx.close();
  }, 60_000);

  it("« Se déconnecter partout » est dans « Mon compte », et ferme aussi la session d'un autre appareil", async () => {
    const ctx = await contexte(1280);
    const { userId } = await enseignantSousLicence(ctx);
    // Un second appareil, connecté au même compte.
    const autre = await contexte(1280);
    await autre.addCookies([{ name: "ba_session", value: jetonDeSession(userId), url: BASE }]);
    const ailleurs = await autre.newPage();
    await aller(ailleurs, "/teacher");
    expect(new URL(ailleurs.url()).pathname, "le second appareil n'est pas connecté").toBe("/teacher");

    const p = await ctx.newPage();
    await aller(p, "/teacher");
    await rangee(p).getByRole("link", { name: "Mon compte" }).click();
    await p.waitForURL(`${BASE}/teacher/compte`, { timeout: 30_000 });
    const partout = p.locator("main [data-vos-connexions]").getByRole("button", { name: "Se déconnecter partout" });
    expect(await partout.isVisible(), "« Se déconnecter partout » n'est pas dans « Mon compte »").toBe(true);
    await capturer(p, "compte-1280", { pleinePage: true });

    await partout.click();
    await p.waitForURL(`${BASE}/teacher/login`, { timeout: 30_000 });
    expect(await laSession(ctx)).toBeUndefined();
    // L'autre appareil n'est plus connecté : sa session, plus ancienne que le geste, est refusée.
    await aller(ailleurs, "/teacher");
    expect(new URL(ailleurs.url()).pathname, "la session de l'autre appareil reste ouverte").toBe("/teacher/login");
    await autre.close();
    await ctx.close();
  }, 120_000);

  it("« Mon compte » à 390 px : la rubrique se lit, rien ne déborde", async () => {
    const ctx = await contexte(390);
    await enseignantSousLicence(ctx);
    const p = await ctx.newPage();
    await aller(p, "/teacher/compte");
    const rubrique = p.locator("main [data-vos-connexions]");
    expect(await rubrique.getByRole("button", { name: "Se déconnecter partout" }).isVisible()).toBe(true);
    expect(await debordement(p), "« Mon compte » déborde à 390 px").toBeLessThanOrEqual(0);
    await capturer(p, "compte-390", { pleinePage: true });
    await rubrique.scrollIntoViewIfNeeded();
    await capturer(p, "compte-connexions-390", { element: rubrique });
    await ctx.close();
  }, 60_000);
});
