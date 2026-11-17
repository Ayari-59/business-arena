import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { enseignantSousLicence } from "./helpers/licence";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * LES DÉCISIONS DES ÉQUIPES, AU PILOTAGE ET NULLE PART AILLEURS.
 *
 * Trois équipes humaines et un bot. Pendant le tour :
 *   · Alice valide un prix reconnaissable (73,70 €) ; Chloé valide un prix sous
 *     le coût variable (20 €) ; Bruno n'envoie rien ;
 *   · le pilotage montre le prix d'Alice, le repère de Chloé, « aucune décision
 *     encore » pour Bruno, « décidé par le jeu » pour le bot, et compte une
 *     équipe avec un repère ; « Voir tout » déplie les autres décisions ;
 *   · le HTML du mur projeté et celui de l'arène de Bruno ne contiennent ni le
 *     prix d'Alice ni le repère de Chloé (le flux du serveur compris) ;
 *   · Alice valide de nouveau à 74,20 € : le pilotage, resté ouvert, le montre
 *     au sondage suivant, sans qu'on le recharge.
 */

const CAPTURES = process.env.CAPTURES;

let navigateur: Browser;
let seance: BrowserContext;
let prof: Page;
let urlPartie: string;
let code: string;
const eleves: Record<string, Page> = {};

/** Le HTML servi, flux du serveur compris, espaces insécables normalisés. */
async function html(page: Page): Promise<string> {
  return (await page.content()).replace(/[  ]|\\u202f|\\u00a0/g, " ");
}

async function capture(p: Page, nom: string): Promise<void> {
  if (!CAPTURES) return;
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${CAPTURES}/${nom}.png`, fullPage: true });
}

/** Le tableau des équipes seul, pour le regarder de près. */
async function captureDuTableau(p: Page, nom: string): Promise<void> {
  if (!CAPTURES) return;
  await p
    .locator("section", { has: p.getByRole("heading", { name: /Équipes · état des décisions/ }) })
    .screenshot({ path: `${CAPTURES}/${nom}-tableau.png` });
}

/** La feuille de décision, au premier écran (« Vendre »). */
async function auxDecisions(p: Page): Promise<void> {
  await aller(p, new URL(p.url()).pathname);
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(1_500);
}

/** Fixe le prix, avance jusqu'au bout de la feuille et valide. */
async function validerAuPrix(p: Page, prix: string): Promise<void> {
  await auxDecisions(p);
  const champ = p.locator('input[name="price"]').first();
  await champ.waitFor({ timeout: 30_000 });
  await champ.fill(prix);
  for (let i = 0; i < 12; i += 1) {
    const suivant = p.getByRole("button", { name: /^Suivant/ }).first();
    if (!(await suivant.isVisible().catch(() => false))) break;
    await suivant.click();
    await p.waitForTimeout(300);
  }
  await p
    .getByRole("button", { name: /Valider les décisions de l.équipe|Remplacer les décisions validées/ })
    .first()
    .click({ timeout: 30_000 });
  const garde = p.getByRole("button", { name: /je garde ces valeurs/ });
  if (await garde.isVisible({ timeout: 3_000 }).catch(() => false)) await garde.click();
  await p.waitForTimeout(2_500);
  await aller(p, new URL(p.url()).pathname);
  expect(await texte(p)).toContain("Décisions enregistrées");
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  seance = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  await enseignantSousLicence(seance);
  prof = await seance.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("les décisions des équipes dans le pilotage", () => {
  it("l'enseignant crée une partie à trois équipes et un bot ; trois élèves rejoignent", async () => {
    await aller(prof, "/teacher");
    if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) {
      await prof.locator("#nouvelle-partie > summary").click();
    }
    await prof.selectOption('select[name="humanTeamsCount"]', "3");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    urlPartie = new URL(prof.url()).pathname;
    code = (await prof.locator("#code-invitation").innerText()).trim();

    for (const nom of ["Alice", "Bruno", "Chloé"]) {
      const p = await (await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" })).newPage();
      await aller(p, "/join");
      await p.fill('input[name="code"]', code);
      await p.fill('input[name="pseudo"]', nom);
      await p.getByRole("button", { name: "Valider", exact: true }).click();
      await p.waitForURL(/\/arena\/[0-9a-f-]{36}/, { timeout: 60_000 });
      await p.waitForLoadState("networkidle");
      eleves[nom] = p;
    }
  }, 240_000);

  it("Alice valide à 73,70 € ; Chloé valide sous le coût variable ; Bruno n'envoie rien", async () => {
    await validerAuPrix(eleves.Alice!, "73.7");
    await validerAuPrix(eleves.Chloé!, "20");
  }, 240_000);

  it("le pilotage montre les décisions, l'équipe sans décision, le bot et le repère compté", async () => {
    await aller(prof, urlPartie);
    const vu = await texte(prof);
    expect(vu).toContain("73,70 €");
    expect(vu).toContain("Prix sous le coût variable : chaque vente fait perdre de l'argent.");
    expect(vu).toContain("Aucune décision encore.");
    expect(vu).toContain("Décidé par le jeu.");
    expect(vu).toContain("1 équipe a un repère à regarder.");
    expect(await prof.locator('[data-decisions-de-l-equipe="validee"]').count()).toBe(2);
    expect(await prof.locator("[data-repere]").count()).toBeGreaterThanOrEqual(1);
    await capture(prof, "pilotage-decisions-1280");
    await captureDuTableau(prof, "pilotage-decisions-1280");

    // « Voir tout » déplie les autres décisions de l'équipe.
    const voirTout = prof.locator("[data-decisions-de-l-equipe] details > summary").first();
    await voirTout.click();
    expect(await prof.locator("[data-decisions-de-l-equipe] details[open]").count()).toBe(1);
    expect(await texte(prof)).toContain("Commande exceptionnelle");
    await capture(prof, "pilotage-decisions-deplie-1280");
    await captureDuTableau(prof, "pilotage-decisions-deplie-1280");

    // À 390 px : la page ne déborde pas, et la ligne se lit.
    const telephone = await seance.newPage();
    await telephone.setViewportSize({ width: 390, height: 844 });
    await aller(telephone, urlPartie);
    expect(await texte(telephone)).toContain("73,70 €");
    const deborde = await telephone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(deborde).toBeLessThanOrEqual(0);
    await telephone.locator("[data-decisions-de-l-equipe] details > summary").first().click();
    await capture(telephone, "pilotage-decisions-390");
    await captureDuTableau(telephone, "pilotage-decisions-390");
    await telephone.close();
  }, 180_000);

  it("ni le mur projeté ni l'arène d'une autre équipe ne les montrent", async () => {
    const mur = await seance.newPage();
    await mur.setViewportSize({ width: 1920, height: 1080 });
    await aller(mur, `${urlPartie}/projection`);
    expect(await texte(mur)).toContain("validé");
    for (const [ou, page] of [
      ["le mur", mur],
      ["l'arène de Bruno", eleves.Bruno!],
    ] as const) {
      if (page !== mur) await aller(page, new URL(page.url()).pathname);
      const source = await html(page);
      expect(source, `${ou} montre le prix d'Alice`).not.toContain("73,70");
      expect(source, `${ou} porte le prix d'Alice`).not.toMatch(/"price":73\.7\b/);
      expect(source, `${ou} montre le repère de Chloé`).not.toContain("Prix sous le coût variable");
      expect(source, `${ou} montre la ligne du pilotage`).not.toContain("data-decisions-de-l-equipe");
    }
    await mur.close();
  }, 120_000);

  it("Alice valide de nouveau : le pilotage resté ouvert le montre au sondage suivant", async () => {
    await aller(prof, urlPartie);
    // L'onglet du pilotage est celui qu'on regarde : un onglet caché ne sonde pas.
    await prof.bringToFront();
    expect(await prof.evaluate(() => document.hidden)).toBe(false);
    expect(await texte(prof)).toContain("73,70 €");
    // Le délai court du premier clic d'Alice à l'affichage : il majore le vrai.
    const depart = Date.now();
    await validerAuPrix(eleves.Alice!, "74.2");
    await prof.waitForFunction(
      () => document.body.innerText.replace(/[  ]/g, " ").includes("74,20 €"),
      undefined,
      { timeout: 45_000, polling: 500 },
    );
    const delai = Date.now() - depart;
    // Le sondeur passe toutes les 12 s en séance : la saisie d'Alice, un sondage et le rendu.
    expect(delai).toBeLessThan(40_000);
    if (CAPTURES) {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(`${CAPTURES}/delai-du-rafraichissement.txt`, `${delai} ms\n`);
    }
  }, 180_000);
});
