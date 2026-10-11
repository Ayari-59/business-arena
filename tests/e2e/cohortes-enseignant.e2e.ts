import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { episodeParCode } from "../../src/pedagogy/episodes/registre";
import { estUneDemo, EPISODES_DE_DEMO } from "../../src/config/episodes/demos";
import { FICHES } from "../../src/config/episodes/fiches";
import { REFUS_SANS_LICENCE } from "../../src/config/cohortes";

/**
 * DES COHORTES CRÉÉES PAR L'ENSEIGNANT, DANS UN VRAI NAVIGATEUR.
 *
 * Le parcours complet d'un enseignant sous licence : il crée sa cohorte depuis son
 * espace, copie le lien ; un élève sans compte le suit, rejoint, et joue un épisode NON
 * démo de la cohorte jusqu'au bilan, mais pas un épisode hors cohorte ; l'enseignant le
 * voit dans la vue de l'animateur, projette le code, puis clôt la cohorte, qui refuse
 * alors un nouveau venu. Sans licence, la page se montre et le serveur refuse la
 * création, avec le lien vers les tarifs. Depuis une fiche d'épisode, le bouton arrive
 * avec l'épisode coché. À 390 px, rien ne déborde.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

/** Le code d'un épisode non démo pour la cohorte, et un autre, hors d'elle. */
const DANS_LA_COHORTE = "depot-qui-deborde";
const HORS_COHORTE = "trimestre-qui-derape";
const NOM = "BTS MCO 2 · groupe A";

async function contexte(mobile = false): Promise<BrowserContext> {
  const c = await navigateur.newContext(
    mobile
      ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" }
      : {
          viewport: { width: 1280, height: 900 },
          locale: "fr-FR",
          permissions: ["clipboard-read", "clipboard-write"],
        },
  );
  await c.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
  return c;
}

const debordement = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Les aplats orange visibles dans la fenêtre : un seul bouton plein par écran. */
const pleinsVisibles = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".bouton-plein")]
      .filter((e) => {
        // `checkVisibility` : le contenu d'un <details> fermé garde ses dimensions dans
        // Chromium (content-visibility), mais il n'est pas affiché.
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && e.checkVisibility({ visibilityProperty: true });
      })
      .map((e) => e.textContent?.trim() ?? ""),
  );

/** Coche un épisode dans le formulaire : on ouvre son repli s'il est fermé. */
async function cocher(page: Page, code: string) {
  const caseACocher = page.locator(`input[name="episodes"][value="${code}"]`);
  if (!(await caseACocher.isVisible())) {
    await page.locator(`details[data-repliable]:has(input[value="${code}"]) > summary`).click();
  }
  await caseACocher.check();
}

/** Crée une cohorte par l'écran et rend la page de la cohorte. */
async function creer(page: Page, nom: string, episodes: string[]) {
  await aller(page, "/teacher/cohortes");
  const formulaire = page.locator("#nouvelle-cohorte");
  if ((await formulaire.getAttribute("open")) === null) {
    await formulaire.locator(":scope > summary").click();
  }
  await page.getByLabel("Nom de la cohorte").fill(nom);
  for (const code of episodes) await cocher(page, code);
  await page.getByRole("button", { name: "Créer la cohorte" }).click();
}

/** Joue l'épisode jusqu'au bilan (comme cohorte.e2e.ts). */
async function jouer(page: Page, code: string) {
  const ep = episodeParCode(code)!;
  await page.getByRole("button", { name: "Commencer l'épisode" }).click();
  for (let pas = 0; pas < 120; pas += 1) {
    if ((await page.getByText("Votre axe de travail").count()) > 0) break;
    for (const nom of await page.$$eval("input[type=radio]", (xs) => [
      ...new Set(xs.map((x) => (x as HTMLInputElement).name)),
    ])) {
      if (!(await page.$(`input[name="${nom}"]:checked`))) {
        await page.locator(`input[name="${nom}"]`).first().check();
      }
    }
    const prevision = page.getByRole("spinbutton");
    if ((await prevision.count()) > 0 && !(await prevision.inputValue())) {
      await prevision.fill(ep.prevision.placeholder.replace(",", ".").replace(/\s/g, ""));
    }
    await page.locator("main button.bg-amber-400:not([disabled])").first().click();
  }
  await expect
    .poll(() => page.getByText("le prochain épisode se cherche").count(), { timeout: 30_000 })
    .toBe(0);
  expect(await page.getByText("Votre axe de travail").count()).toBeGreaterThan(0);
}

describe("un enseignant sous licence crée sa cohorte", () => {
  it("crée, copie le lien ; un élève rejoint, joue un épisode non démo ; l'enseignant le voit", async () => {
    expect(estUneDemo(DANS_LA_COHORTE) || estUneDemo(HORS_COHORTE)).toBe(false);
    const ctxProf = await contexte();
    await enseignantSousLicence(ctxProf);
    const prof = await ctxProf.newPage();

    // La page est dans la navigation de l'espace, à côté des parties.
    await aller(prof, "/teacher/cohortes");
    expect(
      await prof.getByRole("link", { name: "Mes cohortes" }).first().getAttribute("aria-current"),
    ).toBe("page");
    expect(await prof.locator("[data-cohortes-sans-licence]").count()).toBe(0);
    // Aucune cohorte : le formulaire est ouvert, et un seul bouton plein se voit.
    expect(await prof.locator("#nouvelle-cohorte").getAttribute("open")).not.toBeNull();
    expect(await pleinsVisibles(prof)).toEqual(["Créer la cohorte"]);

    await creer(prof, NOM, [DANS_LA_COHORTE]);
    await prof.waitForURL(/\/teacher\/cohortes\/[0-9a-f-]{36}\?creee=1$/);
    expect(await prof.getByRole("heading", { level: 1 }).textContent()).toBe(NOM);
    const code = (await prof.locator("#code-de-la-cohorte").textContent())!.trim();
    expect(code).toMatch(/^BTSMCO-[A-Z2-9]{4}$/);
    const lien = (await prof.locator("[data-lien-de-la-cohorte]").textContent())!.trim();
    expect(lien).toBe(`${BASE}/entreprises/episode/rejoindre?code=${code}`);
    expect(await prof.locator("[data-episodes-de-la-cohorte] li").count()).toBe(1);
    expect(await pleinsVisibles(prof)).toEqual(["Copier le lien"]);

    // Copier le lien : le presse-papiers porte bien le lien affiché.
    await prof.getByRole("button", { name: "Copier le lien" }).click();
    await expect.poll(() => prof.locator("[data-copier-le-lien]").textContent()).toBe("Lien copié");
    expect(await prof.evaluate(() => navigator.clipboard.readText())).toBe(lien);

    // L'affichage projetable du code.
    await prof.getByRole("link", { name: "Projeter le code" }).click();
    await prof.waitForURL(/\/projection$/);
    expect((await prof.locator("[data-code-projete]").textContent())!.trim()).toBe(code);
    expect(await prof.getByText("Personne n'a encore rejoint.").count()).toBe(1);
    // Comme la projection d'une partie : pas de barre du site au mur.
    expect(await prof.getByRole("link", { name: "Espace enseignant" }).first().isVisible()).toBe(false);

    // L'élève, sans compte, suit le lien copié.
    const ctxEleve = await contexte();
    const eleve = await ctxEleve.newPage();
    await eleve.goto(lien);
    expect(await eleve.getByRole("heading", { level: 1 }).textContent()).toBe(`Rejoindre « ${NOM} »`);
    await eleve.getByRole("button", { name: "Rejoindre la cohorte" }).click();
    await expect
      .poll(() => eleve.getByText(`Vous avez rejoint la cohorte « ${NOM} »`).count())
      .toBe(1);
    const titre = episodeParCode(DANS_LA_COHORTE)!.titre;
    const versLEpisode = eleve.locator("[data-episodes-de-ma-cohorte] a", { hasText: titre });
    expect(await versLEpisode.count()).toBe(1);
    await versLEpisode.click();
    await eleve.waitForURL(new RegExp(`/entreprises/episode/${DANS_LA_COHORTE}\\?hasard=`));
    await jouer(eleve, DANS_LA_COHORTE);

    // Un épisode non démo hors de la cohorte ne s'ouvre pas.
    await aller(eleve, `/entreprises/episode/${HORS_COHORTE}`);
    expect(await eleve.getByRole("button", { name: "Commencer l'épisode" }).count()).toBe(0);
    expect(await eleve.getByText("Offre Entreprise").count()).toBeGreaterThan(0);
    // Au catalogue, la cohorte a sa section, ses épisodes se jouent, les autres non.
    await aller(eleve, "/entreprises/episode");
    expect(
      await eleve.locator(`[data-episodes-de-la-cohorte] a[href="/entreprises/episode/${DANS_LA_COHORTE}"]`).count(),
    ).toBe(1);
    expect(await eleve.locator(`[data-episode-ferme="${HORS_COHORTE}"]`).count()).toBe(1);

    // L'enseignant voit le participant : dans sa liste, puis dans la vue de l'animateur.
    await aller(prof, "/teacher/cohortes");
    const carte = prof.locator(`[data-cohorte="${code}"]`);
    expect(await carte.textContent()).toContain("1 participant");
    expect(await pleinsVisibles(prof)).toEqual(["+ Nouvelle cohorte"]);
    await carte.getByRole("link", { name: "Vue de l'animateur" }).click();
    await prof.waitForURL(/\/entreprises\/episode\/animation\//);
    expect(await prof.getByRole("heading", { level: 1 }).textContent()).toBe(`Cohorte « ${NOM} »`);
    expect(await prof.getByText(/1 membre, dont 1 avec au moins un épisode/).count()).toBe(1);

    // Clore : un nouveau venu est refusé.
    await aller(prof, "/teacher/cohortes");
    await prof.locator(`[data-cohorte="${code}"]`).getByRole("link", { name: "Diffuser le code" }).click();
    await prof.waitForURL(/\/teacher\/cohortes\/[0-9a-f-]{36}$/);
    await prof.getByText("Clore la cohorte", { exact: true }).first().click();
    await prof.locator("form button", { hasText: "Clore la cohorte" }).click();
    await prof.waitForURL(/fait=close$/);
    expect(await prof.locator("[data-cohorte-close]").count()).toBe(1);
    const ctxRetard = await contexte();
    const retard = await ctxRetard.newPage();
    await retard.goto(lien);
    expect(await retard.getByRole("heading", { level: 1 }).textContent()).toBe(`« ${NOM} » est close`);
    expect(await retard.getByRole("button", { name: "Rejoindre la cohorte" }).count()).toBe(0);

    await ctxProf.close();
    await ctxEleve.close();
    await ctxRetard.close();
  }, 240_000);
});

describe("un enseignant sans licence", () => {
  it("voit la page ; la création est refusée par le serveur, avec le lien vers les tarifs", async () => {
    const ctx = await contexte();
    await enseignantSousLicence(ctx, { licence: false });
    const page = await ctx.newPage();
    await aller(page, "/teacher/cohortes");
    const avertissement = page.locator("[data-cohortes-sans-licence]");
    expect(await avertissement.count()).toBe(1);
    expect(await avertissement.getByRole("link", { name: "Voir les tarifs" }).getAttribute("href")).toBe(
      "/tarifs",
    );

    // Même une cohorte des seules démonstrations.
    await creer(page, "Seconde 3", [EPISODES_DE_DEMO[0]]);
    await page.waitForURL(/refus=licence/);
    const refus = page.locator('[data-refus-de-cohorte="licence"]');
    expect(await refus.getAttribute("role")).toBe("alert");
    expect(await refus.textContent()).toContain(REFUS_SANS_LICENCE);
    expect(await refus.getByRole("link", { name: "Voir les tarifs" }).getAttribute("href")).toBe("/tarifs");
    expect(await page.getByText("Aucune cohorte pour l'instant.").count()).toBe(1);
    await ctx.close();
  }, 120_000);
});

describe("depuis une fiche enseignant d'épisode", () => {
  it("le bouton mène au formulaire, l'épisode pré-coché et son repli ouvert", async () => {
    const fiche = FICHES.find((f) => !estUneDemo(f.code))!;
    const ctx = await contexte();
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await aller(page, `/enseignants/episodes/${fiche.code}`);
    // Le signalement provisoire du lot précédent est parti.
    expect(await page.getByText("Sans licence, cet épisode ne s'ouvre pas").count()).toBe(0);
    const bouton = page.getByRole("link", { name: "Créer une cohorte avec cet épisode" });
    expect(await bouton.count()).toBe(1);
    await bouton.click();
    await page.waitForURL(new RegExp(`/teacher/cohortes\\?episode=${fiche.code}`));
    await page.waitForLoadState("networkidle");
    const caseCochee = page.locator(`input[name="episodes"][value="${fiche.code}"]`);
    expect(await caseCochee.isChecked()).toBe(true);
    expect(await caseCochee.isVisible()).toBe(true);
    expect(await page.locator('input[name="episodes"]:checked').count()).toBe(1);
    await ctx.close();
  }, 120_000);
});

describe("à 390 px", () => {
  it("rien ne déborde : la liste, le formulaire ouvert, la cohorte, la projection, l'invitation, la fiche", async () => {
    const ctx = await contexte(true);
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await aller(page, "/teacher/cohortes");
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    // Le plus grand repli ouvert (le négoce, rangé par thème).
    await page.locator("details[data-repliable] > summary").first().click();
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.getByLabel("Nom de la cohorte").fill("Terminale STMG · groupe B");
    await page.locator('input[name="episodes"]').first().check();
    await page.getByRole("button", { name: "Créer la cohorte" }).click();
    await page.waitForURL(/\/teacher\/cohortes\/[0-9a-f-]{36}\?creee=1$/);
    await page.waitForLoadState("networkidle");
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    const code = (await page.locator("#code-de-la-cohorte").textContent())!.trim();
    await aller(page, `${new URL(page.url()).pathname}/projection`);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await aller(page, "/teacher/cohortes");
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    // L'élève qui tape le code projeté, sans lien.
    await aller(page, "/entreprises/episode/rejoindre");
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.getByLabel("Code de la cohorte").fill(code.toLowerCase());
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.waitForURL(/rejoindre\?code=/);
    expect(await page.getByRole("heading", { level: 1 }).textContent()).toBe(
      "Rejoindre « Terminale STMG · groupe B »",
    );
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await aller(page, `/enseignants/episodes/${FICHES[0]!.code}`);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await ctx.close();
  }, 120_000);
});
