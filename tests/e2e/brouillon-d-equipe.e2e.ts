import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { enseignantSousLicence } from "./helpers/licence";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * LE BROUILLON D'ÉQUIPE, DANS DE VRAIS NAVIGATEURS (`config/brouillon-d-equipe.ts`).
 *
 * Deux équipes humaines et un bot. Alice et Bruno sont dans la même équipe, Chloé dans
 * l'autre ; chacun a son navigateur (son contexte, ses cookies, son stockage).
 *   · le pilotage de l'enseignant est ouvert quand Alice saisit son prix (71 €) : il
 *     montre le brouillon au sondage suivant, sans rechargement manuel ;
 *   · Alice saisit un prix (71 €) : Bruno ouvre la feuille et le retrouve, « Modifié par
 *     Alice » ;
 *   · Alice le change (79 €) pendant que Bruno a la feuille ouverte : Bruno voit le bandeau
 *     au sondage suivant, sans que son champ change ; « Recharger » le lui donne ;
 *   · le pilotage le montre « pas encore validé », avec Alice ; le mur et l'arène de Chloé
 *     ne le montrent pas (le flux du serveur compris) ;
 *   · la clôture reconduit l'équipe, comme sans décision : le tour 2 ne propose pas 79 € ;
 *   · au tour 2, Alice valide 77 € : à la clôture, c'est ce prix qui a été joué.
 */

const CAPTURES = process.env.CAPTURES;
const VUE = { width: 1280, height: 900 };

let navigateur: Browser;
let seance: BrowserContext;
let prof: Page;
let urlPartie: string;
let urlArene: string;
let code: string;
const eleves: Record<string, Page> = {};
const contextes: Record<string, BrowserContext> = {};

async function html(page: Page): Promise<string> {
  return (await page.content()).replace(/[  ]|\\u202f|\\u00a0/g, " ");
}

async function capture(p: Page, nom: string): Promise<void> {
  if (!CAPTURES) return;
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${CAPTURES}/${nom}.png` });
}

/** La feuille de décision, au premier écran (« Vendre »). */
async function auxDecisions(p: Page): Promise<void> {
  await aller(p, urlArene);
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(1_500);
  const passer = p.getByRole("button", { name: /Passer au tour/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(1_000);
  }
}

const prix = (p: Page) => p.locator('input[name="price"]').first();

/** Saisir un prix, puis changer d'étape : le brouillon de l'équipe part sans attendre. */
async function saisirLePrix(p: Page, valeur: string): Promise<void> {
  const champ = prix(p);
  await champ.waitFor({ timeout: 30_000 });
  await champ.fill(valeur);
  await p.getByRole("button", { name: /^Suivant/ }).first().click();
  // L'enregistrement part à la sortie de l'étape ; la mention suit sa réponse.
  await p.waitForTimeout(2_000);
  await p.waitForFunction(
    () => /Modifié par vous à \d\d:\d\d/.test(document.body.innerText),
    undefined,
    { timeout: 20_000, polling: 250 },
  );
}

async function valider(p: Page): Promise<void> {
  for (let i = 0; i < 12; i += 1) {
    const suivant = p.getByRole("button", { name: /^Suivant/ }).first();
    if (!(await suivant.isVisible().catch(() => false))) break;
    await suivant.click();
    await p.waitForTimeout(300);
  }
  await p.getByRole("button", { name: /Valider les décisions de l.équipe/ }).first().click({ timeout: 30_000 });
  const garde = p.getByRole("button", { name: /je garde ces valeurs/ });
  if (await garde.isVisible({ timeout: 3_000 }).catch(() => false)) await garde.click();
  await p.waitForTimeout(2_500);
  await aller(p, urlArene);
  expect(await texte(p)).toContain("Décisions enregistrées");
}

/** « Clore et simuler », révéler le classement, lancer le tour suivant. */
async function cloreEtLancer(tour: number): Promise<void> {
  await aller(prof, urlPartie);
  await prof.getByRole("button", { name: new RegExp(`Clore le tour ${tour} et simuler`) }).click({ timeout: 30_000 });
  await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
  await prof.locator("[data-podium-a-reveler] button").click({ timeout: 180_000 });
  const lancer = prof.getByRole("button", { name: `Lancer le tour ${tour + 1}`, exact: true });
  await lancer.click({ timeout: 120_000 });
  await prof.waitForSelector(`text=/Clore le tour ${tour + 1} et simuler/`, { timeout: 60_000 });
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  seance = await navigateur.newContext({ viewport: VUE, locale: "fr-FR" });
  await enseignantSousLicence(seance);
  prof = await seance.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("le brouillon d'équipe", () => {
  it("l'enseignant crée une partie à deux équipes ; Alice, Chloé et Bruno rejoignent", async () => {
    await aller(prof, "/teacher");
    if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) {
      await prof.locator("#nouvelle-partie > summary").click();
    }
    await prof.selectOption('select[name="humanTeamsCount"]', "2");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    urlPartie = new URL(prof.url()).pathname;
    code = (await prof.locator("#code-invitation").innerText()).trim();

    // L'affectation va à l'équipe la moins remplie : Alice, puis Chloé, puis Bruno avec Alice.
    for (const nom of ["Alice", "Chloé", "Bruno"]) {
      const c = await navigateur.newContext({ viewport: VUE, locale: "fr-FR" });
      const p = await c.newPage();
      await aller(p, "/join");
      await p.fill('input[name="code"]', code);
      await p.fill('input[name="pseudo"]', nom);
      await p.getByRole("button", { name: "Valider", exact: true }).click();
      await p.waitForURL(/\/arena\/[0-9a-f-]{36}/, { timeout: 60_000 });
      await p.waitForLoadState("networkidle");
      eleves[nom] = p;
      contextes[nom] = c;
    }
    urlArene = new URL(eleves.Alice!.url()).pathname;
    await aller(prof, urlPartie);
    const tableau = await texte(prof);
    expect(tableau).toMatch(/Alice[\s\S]*Bruno|Bruno[\s\S]*Alice/);
  }, 240_000);

  it("le pilotage ouvert voit apparaître le brouillon d'Alice, sans rechargement manuel", async () => {
    // L'enseignant a son pilotage ouvert, sur l'ordinateur et sur un téléphone.
    await aller(prof, urlPartie);
    const tel = await seance.newPage();
    await tel.setViewportSize({ width: 390, height: 844 });
    await aller(tel, urlPartie);
    for (const p of [prof, tel]) {
      expect((await texte(p)).toLowerCase()).not.toContain("brouillon · pas encore validé");
      // Une marque posée sur la fenêtre : un rechargement complet l'effacerait.
      await p.evaluate(() => {
        (window as unknown as { sansRechargement: boolean }).sansRechargement = true;
      });
    }

    await auxDecisions(eleves.Alice!);
    await saisirLePrix(eleves.Alice!, "71");

    // Le sondage du pilotage passe toutes les 12 s : 30 s au plus.
    for (const [p, nom] of [
      [prof, "pilotage-brouillon-apparu-1280"],
      [tel, "pilotage-brouillon-apparu-390"],
    ] as const) {
      await p.bringToFront();
      await p.waitForSelector('[data-decisions-de-l-equipe="brouillon"]', { timeout: 30_000 });
      const vu = await texte(p);
      expect(vu.toLowerCase()).toContain("brouillon · pas encore validé");
      expect(vu).toMatch(/Modifié par Alice à \d\d:\d\d/);
      expect(vu).toContain("71,00 €");
      expect(await p.evaluate(() => (window as unknown as { sansRechargement?: boolean }).sansRechargement)).toBe(true);
      const ligne = p.locator('[data-decisions-de-l-equipe="brouillon"]').first();
      await ligne.scrollIntoViewIfNeeded();
      await capture(p, nom);
    }
    const deborde = await tel.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(deborde).toBeLessThanOrEqual(0);
    await tel.close();
  }, 180_000);

  it("Alice saisit un prix ; Bruno, sur un autre navigateur, le retrouve « Modifié par Alice »", async () => {
    await auxDecisions(eleves.Alice!);
    await saisirLePrix(eleves.Alice!, "71");

    const bruno = eleves.Bruno!;
    await auxDecisions(bruno);
    await bruno.waitForFunction(
      () => (document.querySelector('input[name="price"]') as HTMLInputElement | null)?.value === "71",
      undefined,
      { timeout: 15_000, polling: 250 },
    );
    expect(await texte(bruno)).toMatch(/Brouillon de l.équipe · Modifié par Alice à \d\d:\d\d/);
    await capture(bruno, "feuille-modifie-par-1280");

    // Sur téléphone, le même brouillon.
    const tel = await (
      await navigateur.newContext({
        viewport: { width: 390, height: 844 },
        locale: "fr-FR",
        storageState: await contextes.Bruno!.storageState(),
      })
    ).newPage();
    await aller(tel, urlArene);
    await tel.evaluate(() => {
      location.hash = "decisions";
    });
    await tel.waitForTimeout(2_000);
    expect(await texte(tel)).toMatch(/Modifié par Alice à \d\d:\d\d/);
    const deborde = await tel.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(deborde).toBeLessThanOrEqual(0);
    await capture(tel, "feuille-modifie-par-390");
    eleves.BrunoTel = tel;
  }, 180_000);

  it("Alice change le prix pendant que Bruno a la feuille ouverte : un bandeau, pas un écrasement", async () => {
    const bruno = eleves.Bruno!;
    // Alice revient à la première étape, où se trouve le prix.
    await auxDecisions(eleves.Alice!);
    await saisirLePrix(eleves.Alice!, "79");
    // Le sondage de l'arène passe toutes les 12 s en séance.
    await bruno.bringToFront();
    await bruno.waitForSelector("[data-bandeau-du-brouillon]", { timeout: 40_000 });
    expect(await texte(bruno)).toMatch(/Brouillon modifié par Alice à \d\d:\d\d\./);
    // Ce que Bruno a sous les yeux n'a pas bougé.
    expect(await prix(bruno).inputValue()).toBe("71");
    await capture(bruno, "feuille-bandeau-1280");
    const tel = eleves.BrunoTel!;
    await tel.bringToFront();
    await tel.waitForSelector("[data-bandeau-du-brouillon]", { timeout: 40_000 });
    await capture(tel, "feuille-bandeau-390");
    await tel.close();

    await bruno.bringToFront();
    await bruno.getByRole("button", { name: "Recharger", exact: true }).click();
    await bruno.waitForFunction(
      () => (document.querySelector('input[name="price"]') as HTMLInputElement | null)?.value === "79",
      undefined,
      { timeout: 15_000, polling: 250 },
    );
    expect(await bruno.locator("[data-bandeau-du-brouillon]").count()).toBe(0);
    expect(await texte(bruno)).toMatch(/Modifié par Alice à \d\d:\d\d/);
  }, 180_000);

  it("le pilotage le montre « pas encore validé », avec Alice ; le mur et Chloé ne le voient pas", async () => {
    await aller(prof, urlPartie);
    const vu = await texte(prof);
    // Le marqueur est en capitales par la feuille de style : innerText les rend.
    expect(vu.toLowerCase()).toContain("brouillon · pas encore validé");
    expect(vu).toMatch(/Modifié par Alice à \d\d:\d\d/);
    expect(vu).toContain("79,00 €");
    expect(await prof.locator('[data-decisions-de-l-equipe="brouillon"]').count()).toBe(1);
    await prof
      .locator("section", { has: prof.getByRole("heading", { name: /Équipes · état des décisions/ }) })
      .screenshot(CAPTURES ? { path: `${CAPTURES}/pilotage-brouillon-1280-tableau.png` } : {});
    await capture(prof, "pilotage-brouillon-1280");

    const mur = await seance.newPage();
    await mur.setViewportSize({ width: 1920, height: 1080 });
    await aller(mur, `${urlPartie}/projection`);
    const chloe = eleves.Chloé!;
    await auxDecisions(chloe);
    for (const [ou, page] of [
      ["le mur", mur],
      ["l'arène de Chloé", chloe],
    ] as const) {
      const source = await html(page);
      expect(source, `${ou} montre le prix du brouillon`).not.toContain("79,00");
      expect(source, `${ou} porte la saisie du brouillon`).not.toMatch(/"price":"79"/);
      expect(source, `${ou} nomme l'auteur du brouillon`).not.toContain("Modifié par Alice");
      expect(source, `${ou} montre la ligne du pilotage`).not.toContain("data-decisions-de-l-equipe");
    }
    expect(await prix(chloe).inputValue()).not.toBe("79");
    await mur.close();
  }, 180_000);

  it("la clôture reconduit l'équipe : le tour 2 ne part pas du brouillon", async () => {
    await cloreEtLancer(1);
    await aller(prof, urlPartie);
    const alice = eleves.Alice!;
    await auxDecisions(alice);
    await prix(alice).waitFor({ timeout: 30_000 });
    // La proposition du tour 2 vient de la reconduction, pas des 79 € du brouillon.
    expect(await prix(alice).inputValue()).not.toBe("79");
    expect(await texte(alice)).not.toMatch(/Tour 1 : 79/);
    // Et plus aucun brouillon d'équipe n'est annoncé.
    expect(await texte(alice)).not.toMatch(/Modifié par/);
  }, 420_000);

  it("au tour 2, Alice valide 77 € : c'est ce prix qui est joué", async () => {
    const alice = eleves.Alice!;
    await auxDecisions(alice);
    await saisirLePrix(alice, "77");
    await aller(alice, urlArene);
    await auxDecisions(alice);
    await valider(alice);
    await cloreEtLancer(2);
    await auxDecisions(alice);
    await prix(alice).waitFor({ timeout: 30_000 });
    // Le tour 3 propose le prix joué au tour 2, et le repère le dit pratiqué.
    expect(await prix(alice).inputValue()).toBe("77");
    expect(await texte(alice)).toMatch(/Tour 2 : 77 € pratiqué/);
  }, 600_000);
});
