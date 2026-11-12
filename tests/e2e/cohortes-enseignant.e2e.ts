import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { episodeParCode } from "../../src/pedagogy/episodes/registre";
import { estUneDemo, EPISODES_DE_DEMO } from "../../src/config/episodes/demos";
import { FICHES } from "../../src/config/episodes/fiches";
import { LICENCE_SANS_LES_EPISODES, REFUS_DE_COHORTE, REFUS_SANS_LICENCE } from "../../src/config/cohortes";
import { EPISODE_FERME_POUR_L_ELEVE } from "../../src/config/tarifs";
import { Client } from "pg";
import { insecables } from "../../src/lib/typographie";

/**
 * DES COHORTES CRÉÉES PAR L'ENSEIGNANT, DANS UN VRAI NAVIGATEUR.
 *
 * Le parcours complet d'un enseignant sous licence : il crée sa cohorte depuis son
 * espace, copie le lien ; un élève sans compte le suit, rejoint, et joue un épisode NON
 * démo de la cohorte jusqu'au bilan, mais pas un épisode hors cohorte ; l'enseignant le
 * voit dans la vue de l'animateur, projette le code, puis clôt la cohorte, qui refuse
 * alors un nouveau venu ; la page de la cohorte renvoie à la fiche enseignant de chaque épisode.
 * Sans licence, la page se montre, le formulaire est grisé, et
 * le serveur refuse la création forcée, avec le lien vers les tarifs. Depuis une fiche
 * d'épisode, le bouton arrive avec l'épisode coché. À 390 px, rien ne déborde.
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

/**
 * Avec E2E_CAPTURES (un dossier), l'écran photographié à 390 px, l'élément au milieu ; ou la page
 * entière, la barre collante du site laissée en tête de page (sinon, elle en couvre une partie). La
 * fenêtre reprend ensuite sa largeur.
 */
async function capturerA390(page: Page, nom: string, cible: string, pleine = false) {
  const dossier = process.env.E2E_CAPTURES;
  if (!dossier) return;
  mkdirSync(dossier, { recursive: true });
  const avant = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(cible).first().evaluate((e) => e.scrollIntoView({ block: "center" }));
  const style = pleine ? await page.addStyleTag({ content: "[data-en-tete-du-site]{position:static !important}" }) : null;
  await page.screenshot({ path: join(dossier, `${nom}.png`), fullPage: pleine });
  if (style) await style.evaluate((s) => (s as Element).remove());
  if (avant) await page.setViewportSize(avant);
}

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

/**
 * Sans offre épisodes, le formulaire est grisé sous son avis (audit UX du 29 octobre 2026,
 * P0-1) : on le constate, puis on le dégrise à la main, comme une page restée ouverte depuis
 * la fin de la licence, pour voir le serveur refuser quand même (comme parcours.e2e.ts).
 */
async function forcerLaCreation(page: Page, nom: string, episodes: string[]) {
  await aller(page, "/teacher/cohortes");
  const formulaire = page.locator("#nouvelle-cohorte");
  if ((await formulaire.getAttribute("open")) === null) {
    await formulaire.locator(":scope > summary").click();
  }
  expect(await page.locator("#nouvelle-cohorte fieldset[data-formulaire-sans-offre]").count()).toBe(1);
  expect(await page.getByLabel("Nom de la cohorte").isDisabled()).toBe(true);
  expect(await page.getByRole("button", { name: "Créer la cohorte" }).isDisabled()).toBe(true);
  await page.evaluate(() =>
    document.querySelectorAll("[data-formulaire-sans-offre]").forEach((f) => f.removeAttribute("disabled")),
  );
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
    await enseignantSousLicence(ctxProf, { episodes: true });
    const prof = await ctxProf.newPage();

    // La page est dans la navigation de l'espace, à côté des parties.
    await aller(prof, "/teacher/cohortes");
    expect(
      await prof.getByRole("navigation", { name: "Espace enseignant" }).getByRole("link", { name: "Cohortes", exact: true }).getAttribute("aria-current"),
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
    // Chaque épisode de la cohorte renvoie à sa fiche enseignant (audit UX du 11 novembre 2026, P2-9).
    expect(FICHES.some((f) => f.code === DANS_LA_COHORTE)).toBe(true);
    const versLaFiche = prof.locator(`[data-episodes-de-la-cohorte] [data-fiche-de-l-episode="${DANS_LA_COHORTE}"]`);
    expect(await versLaFiche.getAttribute("href")).toBe(`/enseignants/episodes/${DANS_LA_COHORTE}`);
    expect((await versLaFiche.innerText()).trim()).toBe("La fiche enseignant de l'épisode");
    expect((await ctxProf.request.get(`${BASE}/enseignants/episodes/${DANS_LA_COHORTE}`)).status()).toBe(200);

    // Copier le lien : le presse-papiers porte bien le lien affiché.
    await prof.getByRole("button", { name: "Copier le lien" }).click();
    await expect.poll(() => prof.locator("[data-copier-le-lien]").textContent()).toBe("Lien copié");
    expect(await prof.evaluate(() => navigator.clipboard.readText())).toBe(lien);

    // L'affichage projetable du code.
    await prof.getByRole("link", { name: "Projeter le code" }).click();
    await prof.waitForURL(/\/projection$/);
    expect((await prof.locator("[data-code-projete]").textContent())!.trim()).toBe(code);
    expect(await prof.getByText("Personne n'a encore rejoint.").count()).toBe(1);
    // Comme la projection d'une partie : pas de barre du site au mur. Connecté, sa porte dirait
    // « Déconnexion » (novembre 2026) : c'est la barre elle-même qu'on cherche.
    expect(await prof.locator("header[data-en-tete-du-site]").isVisible()).toBe(false);
    expect(await prof.getByRole("button", { name: "Déconnexion", exact: true }).first().isVisible()).toBe(false);

    // L'élève, sans compte, suit le lien copié.
    const ctxEleve = await contexte();
    const eleve = await ctxEleve.newPage();
    await eleve.goto(lien);
    expect(await eleve.getByRole("heading", { level: 1 }).textContent()).toBe(insecables(`Rejoindre « ${NOM} »`));
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
    // Devant un élève (il suit une cohorte), pas de message de vente : une phrase neutre.
    // La phrase du propriétaire (audit UX du 11 novembre 2026, P2-7) : l'élève a suivi le lien de son groupe.
    expect(EPISODE_FERME_POUR_L_ELEVE).toBe("Cet épisode n'est plus ouvert pour votre groupe ; prévenez votre animateur.");
    expect(await eleve.locator("[data-episode-ferme-eleve]").innerText()).toBe(insecables(EPISODE_FERME_POUR_L_ELEVE));
    await capturerA390(eleve, "eleve-episode-ferme-390", "[data-episode-ferme-eleve]");
    expect(await eleve.getByText("Épisodes manager · sur devis").count()).toBe(0);
    // Dans le contenu de la page (la barre du site porte « Tarifs » partout, comme le pied).
    expect(await eleve.locator("main").getByRole("link", { name: /devis|tarifs/i }).count()).toBe(0);
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
    expect(await prof.getByRole("heading", { level: 1 }).textContent()).toBe(insecables(`Cohorte « ${NOM} »`));
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
    expect(await retard.getByRole("heading", { level: 1 }).textContent()).toBe(insecables(`« ${NOM} » est close`));
    expect(await retard.getByRole("button", { name: "Rejoindre la cohorte" }).count()).toBe(0);

    await ctxProf.close();
    await ctxEleve.close();
    await ctxRetard.close();
  }, 240_000);
});

describe("un enseignant sous licence Classe seule (sans les épisodes)", () => {
  it("la création est refusée : les épisodes se vendent à part", async () => {
    const ctx = await contexte();
    await enseignantSousLicence(ctx, { arene: "classe" });
    const page = await ctx.newPage();
    await aller(page, "/teacher/cohortes");
    expect(await page.locator("[data-cohortes-sans-licence]").count()).toBe(1);
    await forcerLaCreation(page, "Seconde 4", [EPISODES_DE_DEMO[0]]);
    // Le refus revient dans le formulaire, sans recharger la page, la saisie gardée (audit UX du
    // 11 novembre 2026, P2-6).
    const refus = page.locator('[data-refus-de-cohorte="licence"]');
    await refus.waitFor({ state: "visible" });
    expect(await refus.textContent()).toContain(REFUS_SANS_LICENCE);
    expect(await page.getByLabel("Nom de la cohorte").inputValue()).toBe("Seconde 4");
    expect(await page.locator(`input[name="episodes"][value="${EPISODES_DE_DEMO[0]}"]`).isChecked()).toBe(true);
    expect(await page.getByText("Aucune cohorte pour l'instant.").count()).toBe(1);
    await ctx.close();
  });
});

describe("un enseignant sans licence", () => {
  it("voit la page ; la création est refusée par le serveur, avec le lien vers les tarifs", async () => {
    const ctx = await contexte();
    await enseignantSousLicence(ctx, { licence: false });
    const page = await ctx.newPage();
    await aller(page, "/teacher/cohortes");
    const avertissement = page.locator("[data-cohortes-sans-licence]");
    expect(await avertissement.count()).toBe(1);
    expect(await avertissement.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe(
      "/tarifs",
    );

    // Même une cohorte des seules démonstrations.
    await forcerLaCreation(page, "Seconde 3", [EPISODES_DE_DEMO[0]]);
    const refus = page.locator('[data-refus-de-cohorte="licence"]');
    await refus.waitFor({ state: "visible" });
    expect(await refus.getAttribute("role")).toBe("alert");
    expect(await refus.textContent()).toContain(REFUS_SANS_LICENCE);
    expect(await refus.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe("/tarifs");
    expect(await page.getByText("Aucune cohorte pour l'instant.").count()).toBe(1);
    await ctx.close();
  }, 120_000);
});

describe("une cohorte refusée garde la saisie (audit UX du 11 novembre 2026, P2-6)", () => {
  it("sans épisode : le nom reste ; sans nom : les épisodes cochés restent", async () => {
    const ctx = await contexte();
    await enseignantSousLicence(ctx, { episodes: true });
    const page = await ctx.newPage();
    await creer(page, "Terminale STMG · groupe C", []);
    const refus = page.locator("[data-refus-de-cohorte]");
    await refus.waitFor({ state: "visible" });
    expect(await refus.getAttribute("data-refus-de-cohorte")).toBe("episodes");
    expect(await refus.textContent()).toContain(REFUS_DE_COHORTE.episodes);
    // La page ne s'est pas rechargée, le nom tapé est là.
    expect(new URL(page.url()).search).toBe("");
    expect(await page.getByLabel("Nom de la cohorte").inputValue()).toBe("Terminale STMG · groupe C");
    await capturerA390(page, "cohorte-refus-sans-episode-390", "[data-refus-de-cohorte]", true);
    // Puis sans nom, deux épisodes cochés : le refus du nom, et les deux cases toujours cochées.
    await page.getByLabel("Nom de la cohorte").fill("");
    for (const code of [DANS_LA_COHORTE, HORS_COHORTE]) await cocher(page, code);
    await page.getByRole("button", { name: "Créer la cohorte" }).click();
    await expect.poll(() => refus.getAttribute("data-refus-de-cohorte")).toBe("nom");
    for (const code of [DANS_LA_COHORTE, HORS_COHORTE]) {
      expect(await page.locator(`input[name="episodes"][value="${code}"]`).isChecked(), code).toBe(true);
    }
    expect(await page.locator('input[name="episodes"]:checked').count()).toBe(2);
    await capturerA390(page, "cohorte-refus-sans-nom-390", "[data-refus-de-cohorte]", true);
    // Et le nom donné, la cohorte se crée avec les deux épisodes.
    await page.getByLabel("Nom de la cohorte").fill("Terminale STMG · groupe C");
    await page.getByRole("button", { name: "Créer la cohorte" }).click();
    await page.waitForURL(/\/teacher\/cohortes\/[0-9a-f-]{36}\?creee=1$/);
    expect(await page.locator("[data-episodes-de-la-cohorte] li").count()).toBe(2);
    await ctx.close();
  }, 120_000);
});

describe("la fin de la licence épisodes (audit UX du 11 novembre 2026, P2-7)", () => {
  it("la page de la cohorte prévient l'enseignant", async () => {
    const ctx = await contexte();
    const { orgId } = await enseignantSousLicence(ctx, { episodes: true });
    const page = await ctx.newPage();
    await creer(page, "Licence qui s'arrête", [DANS_LA_COHORTE]);
    await page.waitForURL(/\/teacher\/cohortes\/[0-9a-f-]{36}\?creee=1$/);
    const adresse = new URL(page.url()).pathname;
    // Sous licence : aucun avertissement.
    expect(await page.locator("[data-licence-sans-episodes]").count()).toBe(0);
    // La licence s'arrête (comme à sa date de fin).
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    try {
      await c.query("update org_licences set ends_at = now() - interval '1 day', starts_at = now() - interval '30 days' where organization_id = $1", [orgId]);
    } finally {
      await c.end();
    }
    await aller(page, adresse);
    const avis = page.locator("[data-licence-sans-episodes]");
    expect(await avis.count()).toBe(1);
    expect(await avis.innerText()).toContain(insecables(LICENCE_SANS_LES_EPISODES));
    await capturerA390(page, "cohorte-licence-sans-episodes-390", "[data-licence-sans-episodes]");
    await ctx.close();
  }, 120_000);
});

describe("depuis une fiche enseignant d'épisode", () => {
  it("le bouton mène au formulaire, l'épisode pré-coché et son repli ouvert", async () => {
    const fiche = FICHES.find((f) => !estUneDemo(f.code))!;
    const ctx = await contexte();
    await enseignantSousLicence(ctx, { episodes: true });
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
    await enseignantSousLicence(ctx, { episodes: true });
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
      insecables("Rejoindre « Terminale STMG · groupe B »"),
    );
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await aller(page, `/enseignants/episodes/${FICHES[0]!.code}`);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await ctx.close();
  }, 120_000);
});
