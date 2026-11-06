import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { LE_REMPLACEMENT_DE_LA_CUISINE } from "../../src/config/cours/bureaux/le-remplacement-de-la-cuisine";
import { LA_FICHE_DE_STOCK_D_AVRIL } from "../../src/config/cours/bureaux/la-fiche-de-stock-d-avril";
import { LES_PIECES_DE_JANVIER } from "../../src/config/cours/bureaux/les-pieces-de-janvier";
import { LA_PAIE_DE_JANVIER } from "../../src/config/cours/bureaux/la-paie-de-janvier";
import type { Bureau } from "../../src/config/cours/bureaux/types";
import { LA_REVISION_DE_L_ASSISTANT } from "../../src/config/cours/enquetes/la-revision-de-l-assistant";
import { L_OBJECTIF_DU_PRESIDENT } from "../../src/config/cours/scenarios/l-objectif-du-president";
import { LE_CONTROLE_FISCAL } from "../../src/config/cours/scenarios/le-controle-fiscal";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { meilleureSuite as meilleureDuPresident } from "../../src/config/cours/monde/objectif-du-president";
import { meilleureSuite as meilleureDuControle } from "../../src/config/cours/monde/controle-fiscal-de-nova";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { cellulesASaisir, libelleDeCellule, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LES ACTIVITÉS DES CHAPITRES, LOT B, JOUÉES DANS LE NAVIGATEUR (décision du propriétaire, novembre 2026) :
 * quatre bureaux, une enquête et deux scénarios, chacun de bout en bout, sur téléphone, dans la bonne
 * suite. Sans licence, une activité dit qu'elle est réservée ; sous licence, la page de son chapitre et
 * le catalogue y mènent, la page ne porte aucun corrigé, et chaque geste est corrigé par le serveur.
 */

let navigateur: Browser;
let ctx: BrowserContext;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "fr-FR" });
  await enseignantSousLicence(ctx);
}, 120_000);

afterAll(async () => {
  await ctx?.close();
  await navigateur?.close();
});

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const titreDeLEtape = (p: Page) => p.locator("h2").first().innerText().then(espacesOrdinaires);
/** Une correction passe par le serveur : on lui laisse le temps de répondre. */
const attendre = <T>(f: () => Promise<T>) => expect.poll(f, { timeout: 20_000 });

/** La page du chapitre et le catalogue mènent à l'activité. */
async function lesLiens(page: Page, chemin: string, chapitre: string, attribut: string, code: string) {
  await aller(page, chapitre);
  expect(await page.locator(`a[${attribut}="${code}"]`).getAttribute("href")).toBe(chemin);
  await aller(page, "/cours");
  expect(await page.locator(`a[${attribut}="${code}"]`).first().getAttribute("href")).toBe(chemin);
}

/** Les écritures d'une étape de journal, une à une, dans le formulaire du bureau. */
async function saisir(zone: Page | ReturnType<Page["locator"]>, lignes: ReturnType<typeof enSaisie>) {
  // Autant de lignes au formulaire que l'écriture en compte : on en ajoute, on retire celles de trop.
  const comptes = zone.getByLabel(/^Compte, ligne \d+$/);
  while ((await comptes.count()) < lignes.length) await zone.getByRole("button", { name: "Ajouter une ligne", exact: true }).click();
  while ((await comptes.count()) > lignes.length) await zone.getByRole("button", { name: `Retirer la ligne ${await comptes.count()}`, exact: true }).click();
  for (const [k, l] of lignes.entries()) {
    await zone.getByLabel(`Compte, ligne ${k + 1}`, { exact: true }).fill(l.compte);
    await zone.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
    await zone.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
  }
}

/** Joue un bureau ou une enquête de bout en bout, chaque étape juste du premier coup. */
async function jouerLeBureau(page: Page, b: Bureau) {
  expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(b.titre));
  const html = espacesOrdinaires(await page.content());
  expect(html).not.toMatch(/categorie\\?"/);
  for (const e of b.etapes) for (const t of e.explication) expect(html, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
  for (const [n, e] of b.etapes.entries()) {
    await attendre(() => titreDeLEtape(page)).toBe(espacesOrdinaires(e.titre));
    if (e.type === "classement") {
      for (const x of e.elements) {
        const ligne = page.locator(`[data-element="${x.code}"]`);
        if (x.piece) {
          await ligne.getByText("Ouvrir la pièce", { exact: true }).click();
          expect(await ligne.locator(`[data-piece="${x.piece}"]`).isVisible()).toBe(true);
        }
        await ligne.getByRole("radio", { name: e.categories.find((k) => k.code === x.categorie)!.libelle, exact: true }).click();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-element] .encadre-gain").count()).toBe(e.elements.length);
    }
    if (e.type === "etat") {
      for (const { ligne, colonne, cellule } of cellulesASaisir(e.grille)) {
        const nom = libelleDeCellule(e.grille, ligne, colonne);
        const v = cellule.valeur!;
        await page.getByLabel(nom, { exact: true }).pressSequentially(valeurASaisir(Math.abs(v)));
        if (v < 0) await page.getByRole("button", { name: `Changer le signe : ${nom}`, exact: true }).tap();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-etat-juste]").count()).toBe(1);
    }
    if (e.type === "journal") {
      for (const [k, x] of e.ecritures.entries()) {
        await saisir(page, enSaisie(x.ecriture));
        await page.getByRole("button", { name: "Valider l'écriture" }).click();
        await attendre(() => page.locator("[data-ecriture-passee]").count()).toBe(k + 1);
      }
      await attendre(() => page.locator("[data-explication-du-bureau]").count()).toBe(1);
    }
    if (e.type === "rectification") {
      for (const [k, x] of e.ecritures.entries()) {
        const carte = page.locator(`[data-rectification="${x.id}"]`);
        const ouvrir = carte.getByRole("button", { name: "Rectifier cette écriture", exact: true });
        if (await ouvrir.count()) await ouvrir.click();
        await carte.getByRole("radio", { name: e.raisons.find((r) => r.code === x.raison)!.libelle, exact: true }).click();
        await saisir(carte, enSaisie(x.ecriture));
        await carte.getByRole("button", { name: "Valider l'écriture" }).click();
        await attendre(() => page.locator("[data-rectifiee]").count()).toBe(k + 1);
      }
      await attendre(() => page.locator("[data-explication-du-bureau]").count()).toBe(1);
    }
    if (e.type === "reponse") {
      for (const q of e.questions) {
        await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: q.options.find((o) => o.juste)!.texte, exact: true }).click();
        await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
      }
    }
    expect(await debordement(page)).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: n === b.etapes.length - 1 ? "Rendre le travail" : "Étape suivante", exact: true }).click();
  }
  await attendre(() => page.locator("[data-travail-rendu]").count()).toBe(1);
  expect(espacesOrdinaires(await page.locator("main").innerText())).toContain(`${b.etapes.length} étapes réussies du premier coup sur ${b.etapes.length}`);
  expect(await debordement(page)).toBeLessThanOrEqual(1);
}

/** Joue la meilleure suite d'un scénario, puis ses questions. */
async function jouerLeScenario(page: Page, s: Scenario, suite: readonly string[]) {
  expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(s.titre));
  const html = espacesOrdinaires(await page.content());
  expect(html).not.toMatch(/juste\\?"/);
  expect(html).not.toContain(espacesOrdinaires(s.situation([s.decisions[0]!.options[0]!]).consigne));
  for (const [i, code] of suite.entries()) {
    const decision = page.locator(`[data-decision="${i}"]`);
    await attendre(() => decision.count()).toBe(1);
    expect(await decision.locator("[data-consequence]").count()).toBe(0);
    await decision.locator(`[data-option="${code}"]`).click();
    await decision.getByRole("button", { name: "Décider", exact: true }).click();
    await attendre(() => decision.locator("[data-consequence]").count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(1);
    await decision.getByRole("button", { name: i === suite.length - 1 ? "Voir le bilan" : "Décision suivante", exact: true }).click();
  }
  await attendre(() => page.locator("[data-bilan]").count()).toBe(1);
  expect(await page.locator("[data-bilan]").getAttribute("data-meilleure")).toBe("oui");
  for (const q of s.questions.questions) {
    await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: q.options.find((o) => o.juste)!.texte, exact: true }).click();
    await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
  }
  await attendre(() => page.locator("[data-questions] [data-explication-du-bureau]").count()).toBe(1);
  expect(await debordement(page)).toBeLessThanOrEqual(1);
}

const BUREAUX = [
  { b: LE_REMPLACEMENT_DE_LA_CUISINE, chapitre: "/cours/immobilisations?entreprise=bistrot", format: "bureau" },
  { b: LA_FICHE_DE_STOCK_D_AVRIL, chapitre: "/cours/les-stocks?entreprise=ecommerce", format: "bureau" },
  { b: LES_PIECES_DE_JANVIER, chapitre: "/cours/regularisations-de-fin-d-exercice", format: "bureau" },
  { b: LA_PAIE_DE_JANVIER, chapitre: "/cours/la-paie?entreprise=transport", format: "bureau" },
  { b: LA_REVISION_DE_L_ASSISTANT, chapitre: "/cours/le-dossier-de-revision", format: "enquete" },
] as const;

const SCENARIOS = [
  { s: L_OBJECTIF_DU_PRESIDENT, chapitre: "/cours/depreciations-et-provisions", suite: (() => { const m = meilleureDuPresident().suite; return [m.creance, m.litige, m.stock]; })() },
  { s: LE_CONTROLE_FISCAL, chapitre: "/cours/securiser-les-processus", suite: (() => { const m = meilleureDuControle().suite; return [m.armoire, m.fichier, m.ecart]; })() },
] as const;

describe("les activités du lot B", () => {
  it("sans licence, chaque activité dit qu'elle est réservée", async () => {
    const page = await navigateur.newPage();
    try {
      for (const { b, format } of BUREAUX) {
        await aller(page, `/cours/${format}/${b.code}`);
        expect(espacesOrdinaires(await page.locator("main").innerText())).toContain("Ce cas pratique est réservé aux établissements sous licence");
      }
      for (const { s } of SCENARIOS) {
        await aller(page, `/cours/scenario/${s.code}`);
        expect(espacesOrdinaires(await page.locator("main").innerText())).toContain("Ce cas pratique est réservé aux établissements sous licence");
      }
    } finally {
      await page.context().close();
    }
  });

  for (const { b, chapitre, format } of BUREAUX) {
    it(`${b.code} : le chapitre et le catalogue y mènent, et il se joue de bout en bout au téléphone`, async () => {
      const page = await ctx.newPage();
      try {
        const chemin = `/cours/${format}/${b.code}`;
        await lesLiens(page, chemin, chapitre, format === "bureau" ? "data-bureau-du-chapitre" : "data-enquete-du-chapitre", b.code);
        await aller(page, chemin);
        await jouerLeBureau(page, b);
      } finally {
        await page.close();
      }
    });
  }

  for (const { s, chapitre, suite } of SCENARIOS) {
    it(`${s.code} : le chapitre et le catalogue y mènent, et la meilleure suite se joue au téléphone`, async () => {
      const page = await ctx.newPage();
      try {
        const chemin = `/cours/scenario/${s.code}`;
        await lesLiens(page, chemin, chapitre, "data-scenario-du-chapitre", s.code);
        await aller(page, chemin);
        await jouerLeScenario(page, s, suite);
      } finally {
        await page.close();
      }
    });
  }
});
