import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { devices, type Browser, type Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";

/**
 * LE TOUR D'ESSAI, DANS UN VRAI NAVIGATEUR, SUR LE BUILD DE PRODUCTION.
 *
 * L'animateur crée une partie de classe avec un tour d'essai. Une équipe le joue sur
 * ordinateur (1280), une autre le regarde sur téléphone (390) : toutes deux lisent le
 * bandeau « ne compte pas ». L'animateur clôt l'essai, la classe lit ses résultats,
 * puis il commence la vraie partie : les équipes repartent de zéro au tour 1, sous
 * l'annonce « La vraie partie commence », et l'animateur peut revoir l'essai.
 *
 * Les captures vont dans `CAPTURES_ESSAI` quand la variable est posée.
 */

const CAPTURES = process.env.CAPTURES_ESSAI;

let navigateur: Browser;
let prof: Page;
let ordinateur: Page;
let telephone: Page;
let urlPartie = "";
let code = "";
let urlArene = "";
let urlAreneTel = "";

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

/** Pas de défilement horizontal de la page : la règle de toutes les largeurs. */
async function sansDebord(p: Page): Promise<void> {
  const deborde = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(deborde, `${p.url()} déborde de ${deborde} px`).toBeLessThanOrEqual(1);
}

async function capture(p: Page, nom: string): Promise<void> {
  if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/${nom}.png`, fullPage: true });
}

async function rejoindre(p: Page, pseudo: string): Promise<string> {
  await aller(p, "/join");
  await p.fill('input[name="code"]', code);
  await p.fill('input[name="pseudo"]', pseudo);
  await p.getByRole("button", { name: "Rejoindre la partie" }).click();
  await p.waitForURL(/\/arena\//, { timeout: 60_000 });
  return p.url().split("?")[0]!.split("#")[0]!;
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  const ctxProf = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
  await enseignantSousLicence(ctxProf);
  prof = await ctxProf.newPage();
  ordinateur = await (
    await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } })
  ).newPage();
  telephone = await (await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" })).newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("le tour d'essai, de la création à la vraie partie", () => {
  it("l'animateur crée une partie avec un tour d'essai, et l'ardoise le dit", async () => {
    await aller(prof, "/teacher");
    if ((await prof.locator("#nouvelle-partie[open]").count()) === 0 && (await prof.locator("#nouvelle-partie").count()) > 0) {
      await prof.locator("#nouvelle-partie > summary").click();
    }
    const choix = prof.locator("[data-tour-d-essai-choix]");
    expect(await choix.innerText()).toContain("Les équipes s'entraînent ; rien ne compte ; la partie repart ensuite de zéro.");
    // « Aucun » reste le défaut.
    expect(await prof.locator('input[name="toursDEssai"][value=""]').isChecked()).toBe(true);
    await prof.selectOption('select[name="humanTeamsCount"]', "2");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.locator('input[name="toursDEssai"][value="1"]').check();
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    urlPartie = new URL(prof.url()).pathname;
    code = (await prof.locator("#code-invitation").innerText()).trim();

    const vu = await texte(prof);
    // Le surtitre de l'ardoise est mis en capitales par la feuille de style.
    expect(vu).toMatch(/Tour d'essai · ne compte pas/i);
    expect(await prof.getByRole("button", { name: /Clore le tour d'essai 1 et simuler/ }).count()).toBe(1);
    // Pendant l'essai, « commencer » est le second geste, en filet : un seul plein.
    const commencer = prof.getByRole("button", { name: "Commencer la vraie partie" });
    expect(await commencer.count()).toBe(1);
    expect(await commencer.getAttribute("class")).not.toContain("bouton-plein");
    await capture(prof, "enseignant-essai-1280");
    await prof.setViewportSize({ width: 390, height: 844 });
    await prof.reload({ waitUntil: "networkidle" });
    await sansDebord(prof);
    await capture(prof, "enseignant-essai-390");
    await prof.setViewportSize({ width: 1280, height: 900 });
  }, 180_000);

  it("une équipe joue l'essai sur ordinateur, une autre le lit sur téléphone : le bandeau est là", async () => {
    urlArene = await rejoindre(ordinateur, "Inès");
    urlAreneTel = await rejoindre(telephone, "Malo");
    for (const p of [ordinateur, telephone]) {
      const bandeau = p.locator('[data-bandeau-d-essai="essai"]');
      await bandeau.waitFor({ timeout: 30_000 });
      expect(await bandeau.isVisible()).toBe(true);
      expect(await bandeau.innerText()).toContain("Tour d'essai 1/1 · ne compte pas");
      await sansDebord(p);
    }
    await capture(ordinateur, "eleve-essai-1280");
    await capture(telephone, "eleve-essai-390");

    // L'équipe de l'ordinateur joue son tour d'essai, comme pour de vrai.
    await ordinateur.evaluate(() => (location.hash = "decisions"));
    await ordinateur.waitForTimeout(1_500);
    for (let i = 0; i < 12; i += 1) {
      const suivant = ordinateur.getByRole("button", { name: /^Suivant/ }).first();
      if (!(await suivant.isVisible().catch(() => false))) break;
      await suivant.click();
      await ordinateur.waitForTimeout(300);
    }
    await ordinateur.getByRole("button", { name: /Valider les décisions de l'équipe/ }).click({ timeout: 30_000 });
    const garde = ordinateur.getByRole("button", { name: /je garde ces valeurs/ });
    if (await garde.isVisible().catch(() => false)) await garde.click();
    await ordinateur.waitForTimeout(2_500);
  }, 240_000);

  it("l'animateur clôt l'essai : la classe lit ses résultats, la vraie partie attend", async () => {
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: /Clore le tour d'essai 1 et simuler/ }).click({ timeout: 30_000 });
    await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
    await prof.waitForSelector("text=Essai terminé", { timeout: 120_000 });
    const commencer = prof.getByRole("button", { name: "Commencer la vraie partie" });
    expect(await commencer.getAttribute("class"), "l'essai fini, c'est LE geste attendu").toContain("bouton-plein");
    await capture(prof, "enseignant-essai-termine-1280");

    for (const [p, url] of [
      [ordinateur, urlArene],
      [telephone, urlAreneTel],
    ] as const) {
      await p.goto(url, { waitUntil: "networkidle" });
      const bandeau = p.locator('[data-bandeau-d-essai="essai"]');
      expect(await bandeau.innerText()).toContain("Tour d'essai terminé · ne compte pas");
      // Les résultats de l'essai se lisent, pour apprendre.
      expect(await texte(p)).toMatch(/Tours passés/i);
      await sansDebord(p);
    }
    await capture(ordinateur, "eleve-essai-termine-1280");
    await capture(telephone, "eleve-essai-termine-390");
  }, 240_000);

  it("« Commencer la vraie partie » : l'équipe repart de zéro au tour 1 réel", async () => {
    await prof.getByRole("button", { name: "Commencer la vraie partie" }).click();
    const dialogue = prof.getByRole("dialog");
    expect(await dialogue.innerText()).toContain("Toutes les entreprises repartent de l'état initial du scénario.");
    await dialogue.getByRole("button", { name: "Commencer la vraie partie" }).click();
    await prof.waitForSelector("text=Revoir le tour d'essai", { timeout: 120_000 });
    expect(await texte(prof)).toContain("La vraie partie a commencé");
    expect(await prof.locator("#code-invitation").innerText()).toBe(code);
    await capture(prof, "enseignant-vraie-partie-1280");

    for (const [p, url, largeur] of [
      [ordinateur, urlArene, "1280"],
      [telephone, urlAreneTel, "390"],
    ] as const) {
      await p.goto(url, { waitUntil: "networkidle" });
      const bandeau = p.locator('[data-bandeau-d-essai="depart"]');
      await bandeau.waitFor({ timeout: 30_000 });
      expect(await bandeau.innerText()).toContain("La vraie partie commence");
      const vu = await texte(p);
      expect(vu, "aucun tour passé : la vraie partie n'a rien joué").not.toMatch(/Tours passés/i);
      expect(vu).not.toContain("ne compte pas");
      await sansDebord(p);
      await capture(p, `eleve-vraie-partie-${largeur}`);
    }

    // En base : chaque équipe n'a plus que son état initial, le même que celui de l'essai.
    await base(async (c) => {
      const partie = urlPartie.split("/").pop()!;
      const { rows } = await c.query(
        `select s.round_index, s.state - 'id' as etat, t.name
           from company_states s join teams t on t.id = s.team_id
          where t.game_id = $1 order by t.name`,
        [partie],
      );
      expect(rows.map((r) => r.round_index)).toEqual(rows.map(() => 0));
      const { rows: essai } = await c.query(
        `select s.state - 'id' as etat, t.name
           from company_states s join teams t on t.id = s.team_id
           join games a on a.id = t.game_id
          where a.essai_de = $1 and s.round_index = 0 order by t.name`,
        [partie],
      );
      expect(rows.map((r) => [r.name, r.etat])).toEqual(essai.map((r) => [r.name, r.etat]));
    });
  }, 240_000);

  it("l'animateur revoit le tour d'essai, à 1280 et à 390", async () => {
    await prof.getByRole("link", { name: /Revoir le tour d'essai/ }).click();
    await prof.waitForURL(/\/essai$/, { timeout: 30_000 });
    const vu = await texte(prof);
    expect(vu).toContain("Revoir le tour d'essai");
    expect(vu).toMatch(/Tour d'essai 1/i);
    expect(await prof.locator("[data-essai-tour]").count()).toBe(1);
    // Un volume reconduit se lit en unités entières, pas en millièmes.
    expect(await prof.locator("[data-essai-tour]").innerText()).not.toMatch(/\d,\d{3}\b/);
    await sansDebord(prof);
    await capture(prof, "revoir-essai-1280");
    await prof.setViewportSize({ width: 390, height: 844 });
    await prof.reload({ waitUntil: "networkidle" });
    await sansDebord(prof);
    await capture(prof, "revoir-essai-390");
    await aller(prof, urlPartie);
    await sansDebord(prof);
    await capture(prof, "enseignant-vraie-partie-390");
    await prof.setViewportSize({ width: 1280, height: 900 });
  }, 120_000);
});
