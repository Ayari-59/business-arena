import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { EPISODES_DE_DEMO } from "../../src/config/episodes/demos";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import { EPISODE_FERME_POUR_L_ELEVE, REFUS_DE_LA_CLASSE } from "../../src/config/tarifs";

/**
 * LA GRILLE DANS UN VRAI NAVIGATEUR : CLASSE, CAMPUS, ÉPISODES À PART.
 *
 * Ce que l'intégration (`tests/integration/offres.test.ts`) ne voit pas :
 *  · l'enseignant sans licence lit la règle AVANT d'envoyer, puis le refus du serveur,
 *    avec le lien vers les tarifs ;
 *  · la ligne d'état de l'offre en tête de /teacher : Découverte, Classe, Campus avec
 *    son établissement et « + Épisodes manager » ;
 *  · un épisode non démo reste fermé à l'enseignant sous licence Classe, s'ouvre avec
 *    une licence qui inclut les épisodes ;
 *  · devant un élève (lien de classe), un épisode fermé ne vend rien ;
 *  · le formulaire de licence de /admin propose le type d'offre et la case épisodes.
 *
 * Avec CAPTURES_OFFRES (un dossier), le test laisse aussi les captures du rapport.
 */

const CAPTURES = process.env.CAPTURES_OFFRES;
const NON_DEMO = EPISODES.find((e) => !(EPISODES_DE_DEMO as readonly string[]).includes(e.code))!;

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const contexte = (largeur = 1280): Promise<BrowserContext> =>
  navigateur.newContext({ viewport: { width: largeur, height: 900 }, locale: "fr-FR" });

async function capture(page: Page, nom: string, options: { fullPage?: boolean } = {}) {
  if (!CAPTURES) return;
  await page.screenshot({ path: `${CAPTURES}/${nom}.png`, ...options });
}

async function enBase<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

describe("l'espace enseignant dit l'offre, et la classe ne s'ouvre pas sans elle", () => {
  it("sans licence : « Découverte », la règle avant l'envoi, puis le refus du serveur avec le lien", async () => {
    const c = await contexte();
    await enseignantSousLicence(c, { licence: false });
    const page = await c.newPage();
    await aller(page, "/teacher");
    const etat = page.locator("[data-etat-offre]");
    expect(await etat.getAttribute("data-etat-offre")).toBe("decouverte");
    expect(await etat.innerText()).toContain("Découverte : solo, niveaux 1 à 3");
    expect(await etat.getByRole("link", { name: "Demander un devis" }).getAttribute("href")).toBe(
      "/devis?offre=classe",
    );
    await capture(page, "teacher-etat-sans-licence");
    // Le formulaire s'ouvre (aucune partie) et dit la règle avant l'envoi.
    if ((await page.locator("#nouvelle-partie[open]").count()) === 0) {
      await page.locator("#nouvelle-partie > summary").click();
    }
    const avant = page.locator("[data-classe-sans-licence]");
    expect(await avant.innerText()).toContain(REFUS_DE_LA_CLASSE);
    // Même au niveau 1 : pas d'essai en classe.
    await page.selectOption('select[name="level"]', "1");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    await page.waitForSelector("text=/La partie n'a pas été créée/", { timeout: 30_000 });
    const alerte = page.locator("[role=alert]", { hasText: "La partie n'a pas été créée" });
    expect(await alerte.innerText()).toContain(REFUS_DE_LA_CLASSE);
    expect(await alerte.getByRole("link", { name: "Voir les tarifs" }).getAttribute("href")).toBe("/tarifs");
    await alerte.scrollIntoViewIfNeeded();
    await capture(page, "refus-classe-sans-licence");
    // Le concours aussi.
    const tiroir = page.locator("details", { hasText: "Organiser un concours" }).first();
    if (!(await tiroir.evaluate((d: HTMLDetailsElement) => d.open))) await tiroir.locator("summary").first().click();
    expect(await page.locator("[data-concours-sans-licence]").innerText()).toContain(REFUS_DE_LA_CLASSE);
    await page.fill('input[name="name"]', "Coupe sans licence");
    await page.getByRole("button", { name: /Créer le concours/ }).click();
    const refusConcours = page.locator("[role=alert]", { hasText: "Le concours n'a pas été créé" });
    await refusConcours.waitFor({ state: "visible", timeout: 30_000 });
    expect(await refusConcours.innerText()).toContain(REFUS_DE_LA_CLASSE);
    expect(await refusConcours.getByRole("link", { name: "Voir les tarifs" }).getAttribute("href")).toBe("/tarifs");
    expect(page.url()).toMatch(/\/teacher(\?|$)/);
    await c.close();
  });

  it("offre Classe : « Offre Classe · NOVA · niveau 3 Pilotage · jusqu'au … », et la partie de classe se crée", async () => {
    const c = await contexte();
    await enseignantSousLicence(c, { arene: "classe" });
    const page = await c.newPage();
    await aller(page, "/teacher");
    const etat = page.locator("[data-etat-offre]");
    expect(await etat.getAttribute("data-etat-offre")).toBe("active");
    const lu = await etat.innerText();
    expect(lu).toMatch(/^Offre Classe · NOVA · niveau 3 Pilotage · jusqu.au /);
    expect(lu).not.toContain("Épisodes manager");
    await capture(page, "teacher-etat-classe");
    expect(await page.locator("[data-classe-sans-licence]").count()).toBe(0);
    if ((await page.locator("#nouvelle-partie[open]").count()) === 0) {
      await page.locator("#nouvelle-partie > summary").click();
    }
    await page.selectOption('select[name="humanTeamsCount"]', "1");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    await page.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    await c.close();
  });

  it("offre Campus avec les épisodes : l'établissement, la fin, « + Épisodes manager »", async () => {
    const c = await contexte();
    await enseignantSousLicence(c, { arene: "campus", episodes: true });
    const page = await c.newPage();
    await aller(page, "/teacher");
    const lu = await page.locator("[data-etat-offre]").innerText();
    expect(lu).toMatch(/^Offre Campus · Lycée sous licence · jusqu.au /);
    expect(lu).toContain("+ Épisodes manager jusqu");
    await capture(page, "teacher-etat-campus-episodes");
    await c.close();
  });
});

describe("les épisodes non démo suivent la licence épisodes, pas la licence de l'arène", () => {
  it("avec une licence Classe : l'épisode non démo reste fermé ; avec les épisodes : il s'ouvre", async () => {
    const classe = await contexte();
    await enseignantSousLicence(classe, { arene: "classe" });
    const p1 = await classe.newPage();
    await aller(p1, `/entreprises/episode/${NON_DEMO.code}`);
    await p1.locator(`[data-episode-ferme="${NON_DEMO.code}"]`).waitFor({ state: "visible" });
    expect(await p1.getByRole("button", { name: "Commencer l'épisode" }).count()).toBe(0);
    // L'enseignant n'est pas un élève : il lit l'offre et le devis.
    expect(await texte(p1)).toContain("Épisodes manager · sur devis");
    await classe.close();

    const episodes = await contexte();
    await enseignantSousLicence(episodes, { arene: "classe", episodes: true });
    const p2 = await episodes.newPage();
    await aller(p2, `/entreprises/episode/${NON_DEMO.code}`);
    await p2.getByRole("button", { name: "Commencer l'épisode" }).waitFor({ state: "visible" });
    expect(await p2.locator("[data-niveaux-fermes]").count()).toBe(0);
    expect(await texte(p2)).not.toContain("sur devis");
    await episodes.close();
  });

  it("devant un élève (lien de classe), l'épisode fermé ne vend rien", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, `/entreprises/episode/${NON_DEMO.code}?hasard=12`);
    const neutre = page.locator("[data-episode-ferme-eleve]");
    expect(await neutre.innerText()).toBe(EPISODE_FERME_POUR_L_ELEVE);
    const lu = await texte(page);
    expect(lu).not.toMatch(/sur devis|Demander un devis|Voir les tarifs/);
    await capture(page, "episode-ferme-eleve-390", { fullPage: true });
    await c.close();
  });
});

describe("le formulaire de licence de /admin", () => {
  it("propose les offres du catalogue (Classe, Programme, Campus, réseaux, épisodes), la case des épisodes, un montant calculé sans taxe", async () => {
    const c = await contexte();
    const { userId, orgId } = await enseignantSousLicence(c, { licence: false });
    const nom = `Lycée du formulaire ${Date.now()}`;
    await enBase(async (b) => {
      await b.query("update users set is_platform_admin = true where id = $1", [userId]);
      await b.query("update organizations set name = $2 where id = $1", [orgId, nom]);
    });
    const page = await c.newPage();
    await aller(page, "/admin");
    const bloc = page.locator("div.rounded-xl.bg-slate-950", { hasText: nom }).first();
    await bloc.locator("details", { hasText: "Licence" }).locator("summary").click();
    const formulaire = bloc.locator("[data-formulaire-licence]");
    // Les offres du catalogue (/admin/offres) qui ouvrent l'arène ou les épisodes.
    const options = await formulaire.locator('select[name="offre"] option').allInnerTexts();
    expect(options[0]).toMatch(/^Offre Classe · 290/);
    expect(options[1]).toMatch(/^Offre Programme · 990/);
    expect(options[2]).toMatch(/^Offre Campus · 1\s990/);
    expect(options).toContain("Épisodes manager, en cours ou en école · sur devis");
    expect(await formulaire.locator('input[name="episodes"][type="checkbox"]').count()).toBe(1);
    // Le prix catalogue de l'offre, et le montant facturé qui s'en calcule.
    expect(await formulaire.locator('input[name="prixCatalogue"]').inputValue()).toBe("290");
    expect((await formulaire.locator("[data-montant-facture]").innerText()).replace(/[\u00a0\u202f]/g, " ")).toContain(
      "Montant facturé : 290 €",
    );
    expect(await formulaire.textContent()).not.toMatch(/\bHT\b|\bTTC\b/);
    expect(await formulaire.locator('input[name="maxTeachers"]').count()).toBe(0);
    await formulaire.scrollIntoViewIfNeeded();
    await capture(page, "admin-formulaire-licence");

    // Une licence Campus avec les épisodes, posée par le formulaire.
    await formulaire.locator('select[name="offre"]').selectOption("campus");
    await formulaire.locator('input[name="episodes"]').check();
    await formulaire.locator('input[name="label"]').fill("Année 2026-2027");
    await formulaire.locator('input[name="startsAt"]').fill("2026-09-01");
    await formulaire.locator('input[name="endsAt"]').fill("2027-08-31");
    await formulaire.getByRole("button", { name: "Enregistrer la licence" }).click();
    await expect
      .poll(() =>
        enBase(async (b) => (await b.query("select arene, episodes, max_teachers, offre_code, prix_catalogue_cents, amount_cents, nature from org_licences where organization_id = $1", [orgId])).rows),
      )
      .toEqual([
        {
          arene: "campus",
          episodes: true,
          max_teachers: null,
          offre_code: "campus",
          prix_catalogue_cents: 199000,
          amount_cents: 199000,
          nature: "vendue",
        },
      ]);
    await c.close();
  });
});
