import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { join } from "node:path";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { licenceDeLEnseignant } from "./helpers/licence";
import { aller, ouvrirNavigateur, texte, unique } from "./helpers/browser";

/**
 * PENDANT L'ATTENTE DU LANCEMENT, LE TOUR SUIVANT SE CACHE (décision du propriétaire,
 * après #399).
 *
 * Après la clôture, tant que l'enseignant n'a pas lancé le tour 2 : l'élève lit le
 * message d'attente et les résultats du tour clos, et rien d'autre du tour 2. Ni sa
 * situation (énoncé, QCM), ni « Passer au tour 2 », ni la feuille de décision, sur
 * ordinateur (1280) comme sur téléphone (390, parcours en cartes). L'enseignant lance :
 * le sondage de round-status recharge les deux pages, et tout revient.
 *
 * Le haut de l'arène se tait aussi pendant l'attente : ni le bandeau des courriers
 * annoncés (le professeur en distribue un pendant l'attente), ni la bande de marché,
 * ni l'ardoise du dirigeant (déployée ou repliée). Tous trois reviennent au lancement.
 * Sur téléphone, seule l'ardoise est servie en haut (le bandeau et la bande ne le sont
 * jamais : le parcours en cartes porte le courrier).
 *
 * Captures (facultatives) : `E2E_CAPTURES=<dossier>` écrit l'arène pendant l'attente,
 * puis après le lancement, à 1280 et à 390.
 */

const EMAIL = unique("prof-attente");
const MOTDEPASSE = "Attente2026!";
const MESSAGE = "Le tour 2 n'est pas encore lancé : votre professeur l'ouvrira.";
const CAPTURES = process.env.E2E_CAPTURES;

let navigateur: Browser;
let prof: Page;
let ordinateur: Page;
let ordinateurContexte: BrowserContext;
let telephone: Page;
let urlPartie: string;
let urlEleve: string;

async function capturer(page: Page, nom: string): Promise<void> {
  if (!CAPTURES) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const largeur = page.viewportSize()?.width ?? 0;
  await page.screenshot({ path: join(CAPTURES, `${nom}-${largeur}.png`), fullPage: true });
}

/** La feuille de décision, en étapes : on avance sans rien changer, puis on valide. */
async function validerLesDecisions(page: Page): Promise<void> {
  await page.evaluate(() => {
    location.hash = "decisions";
  });
  await page.waitForTimeout(1_500);
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

/** Ce qui porte le tour 2 sur l'écran : sa situation, son passage, sa feuille. */
async function leTourSuivant(page: Page) {
  return {
    passer: await page.getByRole("button", { name: /Passer au tour/i }).count(),
    tourEnCours: await page.locator("#tour-en-cours").count(),
    situation: await page.locator("#situation, #analyser").count(),
    feuille: await page.locator("#decisions").count(),
    valider: await page.getByRole("button", { name: /Valider les décisions de l'équipe/ }).count(),
    // Les boutons du parcours en cartes (téléphone), en bas de l'écran.
    parcours: await page.getByRole("button", { name: /^(Décider|Analyser|Continuer)/ }).count(),
  };
}

/** Le haut de l'arène : le courrier annoncé, la bande de marché, l'ardoise. */
async function leHautDeLArene(page: Page) {
  return {
    courriers: await page.locator('[aria-label="Courrier distribué pour ce tour"]').count(),
    marche: await page.locator('section[aria-label="Le marché ce tour"]').count(),
    ardoise: await page.locator("#ardoise-du-dirigeant").count(),
    ardoiseRepliee: await page.locator("[data-ardoise-repliee]").count(),
  };
}

const RIEN_EN_HAUT = { courriers: 0, marche: 0, ardoise: 0, ardoiseRepliee: 0 };

/** Le message d'attente, espaces insécables normalisés comme `texte`. */
async function messageDAttente(page: Page): Promise<string> {
  return (await page.locator("[data-tour-en-attente]").innerText()).replace(/[\u00a0\u202f]/g, " ");
}

const RIEN = { passer: 0, tourEnCours: 0, situation: 0, feuille: 0, valider: 0, parcours: 0 };

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  prof = await (await navigateur.newContext()).newPage();
  ordinateurContexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  ordinateur = await ordinateurContexte.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("pendant l'attente du lancement, le tour suivant se cache", () => {
  it("un enseignant crée une partie, une élève rejoint et valide le tour 1", async () => {
    await aller(prof, "/teacher/login");
    await prof.getByRole("button", { name: "Créer un compte" }).click();
    await prof.fill('input[name="displayName"]', "Mme Attente");
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
    const code = (await prof.locator("#code-invitation").innerText()).trim();

    await aller(ordinateur, "/join");
    await ordinateur.fill('input[name="code"]', code);
    await ordinateur.fill('input[name="pseudo"]', "Inès");
    await ordinateur.getByRole("button", { name: "Valider", exact: true }).click();
    await ordinateur.waitForURL(/\/arena\//, { timeout: 60_000 });
    urlEleve = new URL(ordinateur.url()).pathname;
    // Le tour 1 se joue comme avant : sa situation et sa feuille sont là.
    await ordinateur.waitForSelector("#tour-en-cours", { timeout: 60_000 });
    await validerLesDecisions(ordinateur);

    // Le même élève, sur son téléphone (même session).
    telephone = await (
      await navigateur.newContext({
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
        locale: "fr-FR",
        storageState: await ordinateurContexte.storageState(),
      })
    ).newPage();
  }, 240_000);

  it("le professeur clôt le tour 1 : le tour 2 attend son lancement", async () => {
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: /Clore le tour 1 et simuler/ }).click({ timeout: 30_000 });
    await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
    await prof.locator("[data-podium-a-reveler] button").click({ timeout: 180_000 });
    await prof.waitForSelector("[data-lancement-du-tour]", { timeout: 120_000 });
    expect(await prof.getByRole("button", { name: "Lancer le tour 2", exact: true }).count()).toBe(1);

    // Pendant l'attente, le professeur distribue un courrier au marché pour le tour 2.
    await prof.getByRole("button", { name: "Distribuer le courrier", exact: true }).click({ timeout: 30_000 });
    await prof.waitForSelector("text=Courriers distribués ce tour", { timeout: 60_000 });
  }, 300_000);

  it("sur ordinateur (1280) : le message et les résultats du tour 1, rien du tour 2", async () => {
    await aller(ordinateur, urlEleve);
    expect(await messageDAttente(ordinateur)).toContain(MESSAGE);
    expect(await leTourSuivant(ordinateur)).toEqual(RIEN);
    // Ni courrier annoncé, ni bande de marché, ni ardoise en haut.
    expect(await leHautDeLArene(ordinateur)).toEqual(RIEN_EN_HAUT);
    // Les résultats du tour clos, dessous, comme avant : le rang du tour clos y est.
    expect(await ordinateur.locator("#dernier-resultat").count()).toBe(1);
    await capturer(ordinateur, "arene-en-attente");
  }, 120_000);

  it("sur téléphone (390) : le message et les résultats du tour 1, ni parcours ni feuille", async () => {
    await aller(telephone, urlEleve);
    expect(await messageDAttente(telephone)).toContain(MESSAGE);
    expect(await leTourSuivant(telephone)).toEqual(RIEN);
    expect(await leHautDeLArene(telephone)).toEqual(RIEN_EN_HAUT);
    const resultats = telephone.locator("[data-resultats-en-attente]");
    expect(await resultats.count()).toBe(1);
    expect(await resultats.innerText()).toContain("Ce que ça a donné");
    // Pas de défilement horizontal.
    const deborde = await telephone.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(deborde).toBe(false);
    await capturer(telephone, "arene-en-attente");
  }, 120_000);

  it("le professeur lance le tour 2 : les deux pages le montrent d'elles-mêmes", async () => {
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: "Lancer le tour 2", exact: true }).click({ timeout: 30_000 });
    await prof.waitForSelector("text=/Clore le tour 2 et simuler/", { timeout: 60_000 });

    // Sans recharger : le sondage de round-status fait revenir le tour.
    await ordinateur.bringToFront();
    await ordinateur.waitForSelector("[data-tour-en-attente]", { state: "detached", timeout: 90_000 });
    expect(await ordinateur.locator("#tour-en-cours").count()).toBe(1);
    await ordinateur.getByRole("button", { name: /Passer au tour 2/i }).click({ timeout: 30_000 });
    await ordinateur.waitForSelector("#situation", { timeout: 30_000 });
    // L'onglet « Décider » porte la feuille du tour 2.
    expect(await ordinateur.getByRole("tab", { name: /Décider/ }).count()).toBe(1);
    expect(await texte(ordinateur)).not.toContain(MESSAGE);
    // Le haut de l'arène revient : le courrier annoncé, la bande de marché, l'ardoise.
    expect(await leHautDeLArene(ordinateur)).toEqual({ courriers: 1, marche: 1, ardoise: 1, ardoiseRepliee: 1 });
    await capturer(ordinateur, "arene-apres-le-lancement");

    await telephone.bringToFront();
    await telephone.waitForSelector("[data-tour-en-attente]", { state: "detached", timeout: 90_000 });
    expect(await telephone.locator("[data-resultats-en-attente]").count()).toBe(0);
    expect(await telephone.getByRole("button", { name: /^(Décider|Analyser|Continuer)/ }).count()).toBeGreaterThan(0);
    // L'ardoise revient ; le bandeau et la bande ne sont jamais servis sur téléphone.
    expect(await leHautDeLArene(telephone)).toEqual({ courriers: 0, marche: 0, ardoise: 1, ardoiseRepliee: 1 });
    await capturer(telephone, "arene-apres-le-lancement");

    // Et la feuille du tour 2 se valide.
    await validerLesDecisions(ordinateur);
    await aller(prof, urlPartie);
    const bandeau = await prof.locator("#ce-tour-titre").locator("xpath=ancestor::section[1]").innerText();
    expect(bandeau).toContain("1/2");
  }, 300_000);
});
