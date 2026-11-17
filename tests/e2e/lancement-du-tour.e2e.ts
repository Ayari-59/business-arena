import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { licenceDeLEnseignant } from "./helpers/licence";
import { aller, ouvrirNavigateur, texte, unique } from "./helpers/browser";

/**
 * LE TOUR SUIVANT ATTEND LE PROFESSEUR (décision du propriétaire, novembre 2026).
 *
 * Dans une partie de classe neuve, « Clore et simuler » ne rouvre plus aussitôt le
 * tour suivant : la classe lit ses résultats et débriefe. L'élève voit pourquoi il ne
 * peut pas jouer ; le pilotage montre « Lancer le tour 2 » ; un clic, et l'élève joue.
 *
 * Captures (facultatives) : `E2E_CAPTURES=<dossier>` écrit le pilotage en attente à
 * 1280 et 390, avec et sans date au planning, et l'écran de l'élève en attente à 390.
 */

const EMAIL = unique("prof-lancement");
const MOTDEPASSE = "Lancement2026!";
const MESSAGE = "Le tour 2 n'est pas encore lancé : votre professeur l'ouvrira.";
const CAPTURES = process.env.E2E_CAPTURES;

let navigateur: Browser;
let prof: Page;
let eleve: Page;
let eleveContexte: BrowserContext;
let urlPartie: string;
let urlEleve: string;
let code: string;

async function capturer(page: Page, nom: string, largeur: number): Promise<void> {
  if (!CAPTURES) return;
  const avant = page.viewportSize();
  await page.setViewportSize({ width: largeur, height: largeur < 500 ? 844 : 900 });
  await page.waitForTimeout(400);
  // Le bandeau du tour, en tête : c'est lui que la capture doit montrer.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator("[data-lancement-du-tour]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(CAPTURES, `${nom}-${largeur}.png`) });
  if (avant) await page.setViewportSize(avant);
}

/** La feuille de décision, en étapes : on avance sans rien changer, puis on valide. */
async function validerLesDecisions(page: Page): Promise<void> {
  await page.evaluate(() => {
    location.hash = "decisions";
  });
  await page.waitForTimeout(1_500);
  // Après un tour clos, la feuille du tour suivant s'ouvre d'un geste.
  const passer = page.getByRole("button", { name: /Passer au tour/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await page.waitForTimeout(1_000);
  }
  for (let i = 0; i < 24; i += 1) {
    if (await page.getByRole("button", { name: /Valider les décisions de l'équipe/ }).first().isVisible().catch(() => false)) break;
    const suivant = page.getByRole("button", { name: /^(Suivant|Continuer)/ }).last();
    if (!(await suivant.isVisible().catch(() => false))) break;
    await suivant.click();
    await page.waitForTimeout(300);
  }
  await page.getByRole("button", { name: /Valider les décisions de l'équipe/ }).first().click({ timeout: 30_000 });
  const garde = page.getByRole("button", { name: /je garde ces valeurs/ });
  if (await garde.isVisible().catch(() => false)) await garde.click();
  await page.waitForTimeout(2_500);
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  prof = await (await navigateur.newContext()).newPage();
  eleveContexte = await navigateur.newContext();
  eleve = await eleveContexte.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("le tour suivant attend le professeur", () => {
  it("un enseignant crée une partie, une élève rejoint et valide le tour 1", async () => {
    await aller(prof, "/teacher/login");
    await prof.getByRole("button", { name: "Créer un compte" }).click();
    await prof.fill('input[name="displayName"]', "Mme Lancement");
    await prof.fill('input[name="schoolName"]', "Lycée du Débrief");
    await prof.fill('input[name="email"]', EMAIL);
    await prof.fill('input[name="password"]', MOTDEPASSE);
    await prof.getByRole("button", { name: "Créer mon compte enseignant" }).click();
    await prof.waitForURL(/\/teacher$/, { timeout: 60_000 });
    await licenceDeLEnseignant(EMAIL, "pose", { arene: "classe" });
    await aller(prof, "/teacher");
    await prof.selectOption('select[name="humanTeamsCount"]', "2");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    urlPartie = new URL(prof.url()).pathname;
    code = (await prof.locator("#code-invitation").innerText()).trim();

    await aller(eleve, "/join");
    await eleve.fill('input[name="code"]', code);
    await eleve.fill('input[name="pseudo"]', "Inès");
    await eleve.getByRole("button", { name: "Valider", exact: true }).click();
    await eleve.waitForURL(/\/arena\//, { timeout: 60_000 });
    urlEleve = new URL(eleve.url()).pathname;
    await validerLesDecisions(eleve);
  }, 240_000);

  it("la clôture ne rouvre pas le tour 2 : le pilotage propose de le lancer", async () => {
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: /Clore le tour 1 et simuler/ }).click({ timeout: 30_000 });
    await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
    await prof.locator("[data-podium-a-reveler] button").click({ timeout: 180_000 });
    await prof.waitForSelector("[data-lancement-du-tour]", { timeout: 120_000 });
    expect(await prof.getByRole("button", { name: /Clore le tour 2 et simuler/ }).count()).toBe(0);
    expect(await prof.getByRole("button", { name: "Lancer le tour 2", exact: true }).count()).toBe(1);
    expect(await prof.locator("[data-lancement-du-tour]").innerText()).toContain("attend votre lancement");
    await capturer(prof, "pilotage-en-attente", 1280);
    await capturer(prof, "pilotage-en-attente", 390);
  }, 300_000);

  it("l'élève voit ses résultats et pourquoi elle ne peut pas jouer", async () => {
    await aller(eleve, urlEleve);
    const vu = await texte(eleve);
    expect(vu).toContain(MESSAGE);
    // Le bouton de validation, s'il est là, est grisé : on ne valide pas un tour fermé.
    await eleve.evaluate(() => {
      location.hash = "decisions";
    });
    await eleve.waitForTimeout(1_000);
    const valider = eleve.getByRole("button", { name: /Valider les décisions de l'équipe/ });
    for (let i = 0; i < (await valider.count()); i += 1) {
      expect(await valider.nth(i).isDisabled()).toBe(true);
    }
    // Sur téléphone, la même phrase.
    const telephone = await (
      await navigateur.newContext({
        viewport: { width: 390, height: 844 },
        storageState: await eleveContexte.storageState(),
      })
    ).newPage();
    await aller(telephone, urlEleve);
    expect(await texte(telephone)).toContain(MESSAGE);
    if (CAPTURES) {
      await telephone.screenshot({ path: join(CAPTURES, "eleve-en-attente-390.png") });
      await telephone.locator(`text=${MESSAGE}`).first().scrollIntoViewIfNeeded();
      await telephone.screenshot({ path: join(CAPTURES, "eleve-en-attente-message-390.png") });
    }
    await telephone.context().close();
  }, 180_000);

  it("une date au planning : le pilotage dit que le tour s'ouvrira seul", async () => {
    await aller(prof, urlPartie);
    await prof.getByText("Planning des tours", { exact: true }).first().click();
    await prof.fill('input[name="opensAt-2"]', "2030-01-15T08:30");
    await prof.getByRole("button", { name: "Enregistrer le planning des tours" }).click();
    await prof.waitForSelector("text=/s.ouvrira seul le 15 janvier 2030/", { timeout: 60_000 });
    await capturer(prof, "pilotage-date-au-planning", 1280);
    await capturer(prof, "pilotage-date-au-planning", 390);
    // L'élève lit la date.
    await aller(eleve, urlEleve);
    expect(await texte(eleve)).toContain("Ce tour ouvre le 15 janvier 2030");
  }, 180_000);

  it("le professeur lance le tour 2 plus tôt : l'élève joue", async () => {
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: "Lancer le tour 2", exact: true }).click({ timeout: 30_000 });
    await prof.waitForSelector("text=/Clore le tour 2 et simuler/", { timeout: 60_000 });

    await aller(eleve, urlEleve);
    expect(await texte(eleve)).not.toContain(MESSAGE);
    await validerLesDecisions(eleve);

    await aller(prof, urlPartie);
    const bandeau = await prof.locator("#ce-tour-titre").locator("xpath=ancestor::section[1]").innerText();
    expect(bandeau).toContain("équipes ont validé");
    expect(bandeau).toContain("1/2");
  }, 240_000);
});
