import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { LE_PRET_DE_L_ANNEE } from "../../src/config/cours/bureaux/le-pret-de-l-annee";
import { LE_DOSSIER_DE_FINANCEMENT } from "../../src/config/cours/bureaux/le-dossier-de-financement";
import { L_ASSEMBLEE_DE_JUIN } from "../../src/config/cours/bureaux/l-assemblee-de-juin";
import type { Bureau, EtapeDuBureau } from "../../src/config/cours/bureaux/types";
import { LE_DOSSIER_DES_IMMOBILISATIONS } from "../../src/config/cours/enquetes/le-dossier-des-immobilisations";
import { LA_NOTE_DE_L_ANALYSTE } from "../../src/config/cours/enquetes/la-note-de-l-analyste";
import { LA_LIGNE_EN_CREDIT_BAIL } from "../../src/config/cours/scenarios/la-ligne-en-credit-bail";
import { LE_PRIX_DES_RESSOURCES } from "../../src/config/cours/scenarios/le-prix-des-ressources";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { cellulesASaisir, libelleDeCellule, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LES ACTIVITÉS DU LOT C, JOUÉES DANS LE NAVIGATEUR (novembre 2026) : trois bureaux, deux enquêtes, deux
 * scénarios, un par chapitre de financement. Pour chacun, au téléphone et sous licence : le chapitre et le
 * catalogue y mènent, la page ne porte aucun corrigé, puis la bonne suite se joue de bout en bout, chaque
 * geste corrigé par le serveur, jusqu'au « Travail rendu » ou au bilan de la meilleure suite.
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

/** Le chapitre et le catalogue mènent à l'activité, par son attribut. */
async function lesLiens(page: Page, attribut: string, code: string, chapitre: string, chemin: string) {
  await aller(page, `/cours/${chapitre}?entreprise=nova`);
  expect(await page.locator(`a[${attribut}="${code}"]`).getAttribute("href")).toBe(chemin);
  await aller(page, "/cours");
  expect(await page.locator(`a[${attribut}="${code}"]`).first().getAttribute("href")).toBe(chemin);
}

/** Remplit une écriture dans une carte (ou la page), en retirant les lignes de trop. */
async function saisir(zone: Page | ReturnType<Page["locator"]>, lignes: ReturnType<typeof enSaisie>) {
  for (const [k, l] of lignes.entries()) {
    const compte = zone.getByLabel(`Compte, ligne ${k + 1}`, { exact: true });
    if (!(await compte.count())) await zone.getByRole("button", { name: "Ajouter une ligne" }).click();
    await compte.fill(l.compte);
    await zone.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
    await zone.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
  }
  for (let n = 12; n > lignes.length; n--) {
    const retirer = zone.getByRole("button", { name: `Retirer la ligne ${n}`, exact: true });
    if (await retirer.count()) await retirer.click();
  }
}

async function jouerLEtape(page: Page, e: EtapeDuBureau) {
  await attendre(() => titreDeLEtape(page)).toBe(e.titre);
  if (e.type === "classement") {
    for (const x of e.elements) {
      const ligne = page.locator(`[data-element="${x.code}"]`);
      if (x.piece) await ligne.getByText("Ouvrir la pièce", { exact: true }).click();
      await ligne.getByRole("radio", { name: e.categories.find((k) => k.code === x.categorie)!.libelle, exact: true }).click();
    }
    await page.getByRole("button", { name: "Vérifier", exact: true }).click();
    await attendre(() => page.locator("[data-element] .encadre-gain").count()).toBe(e.elements.length);
  } else if (e.type === "etat") {
    for (const { ligne, colonne, cellule } of cellulesASaisir(e.grille)) {
      const nom = libelleDeCellule(e.grille, ligne, colonne);
      const v = cellule.valeur!;
      await page.getByLabel(nom, { exact: true }).pressSequentially(valeurASaisir(Math.abs(v)));
      if (v < 0) await page.getByRole("button", { name: `Changer le signe : ${nom}`, exact: true }).tap();
    }
    await page.getByRole("button", { name: "Vérifier", exact: true }).click();
    await attendre(() => page.locator("[data-etat-juste]").count()).toBe(1);
  } else if (e.type === "journal") {
    for (const [n, x] of e.ecritures.entries()) {
      await saisir(page, enSaisie(x.ecriture));
      await page.getByRole("button", { name: "Valider l'écriture" }).click();
      await attendre(() => page.locator("[data-ecriture-passee]").count()).toBe(n + 1);
    }
    await attendre(() => page.locator("[data-explication-du-bureau]").count()).toBe(1);
  } else if (e.type === "rectification") {
    for (const [n, x] of e.ecritures.entries()) {
      const carte = page.locator(`[data-rectification="${x.id}"]`);
      const ouvrir = carte.getByRole("button", { name: "Rectifier cette écriture", exact: true });
      if (await ouvrir.count()) await ouvrir.click();
      await carte.getByRole("radio", { name: e.raisons.find((k) => k.code === x.raison)!.libelle, exact: true }).click();
      await saisir(carte, enSaisie(x.ecriture));
      await carte.getByRole("button", { name: "Valider l'écriture" }).click();
      await attendre(() => page.locator("[data-rectifiee]").count()).toBe(n + 1);
    }
    await attendre(() => page.locator("[data-explication-du-bureau]").count()).toBe(1);
  } else {
    for (const q of e.questions) {
      await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: q.options.find((o) => o.juste)!.texte, exact: true }).click();
      await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
    }
  }
  expect(await debordement(page)).toBeLessThanOrEqual(1);
}

/** Un bureau ou une enquête, de bout en bout, du premier coup. */
async function jouerLeBureau(b: Bureau) {
  const enquete = b.format === "enquete";
  const chemin = `/cours/${enquete ? "enquete" : "bureau"}/${b.code}`;
  const page = await ctx.newPage();
  try {
    await lesLiens(page, enquete ? "data-enquete-du-chapitre" : "data-bureau-du-chapitre", b.code, b.reprend[0]!, chemin);
    await aller(page, chemin);
    expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(b.titre));
    const html = espacesOrdinaires(await page.content());
    expect(html).not.toMatch(/categorie\\?"/);
    expect(html).not.toMatch(/raison\\?"/);
    for (const e of b.etapes) for (const t of e.explication) expect(html, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
    for (const [i, e] of b.etapes.entries()) {
      await jouerLEtape(page, e);
      await page.getByRole("button", { name: i === b.etapes.length - 1 ? "Rendre le travail" : "Étape suivante", exact: true }).click();
    }
    await expect.poll(() => page.locator("main").innerText().then(espacesOrdinaires)).toContain(`${b.etapes.length} étapes réussies du premier coup sur ${b.etapes.length}`);
    expect(await page.locator("[data-travail-rendu]").count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(1);
  } finally {
    await page.close();
  }
}

/** Un scénario : la meilleure suite, jusqu'au bilan, puis les questions. */
async function jouerLeScenario(sc: Scenario) {
  const chemin = `/cours/scenario/${sc.code}`;
  const page = await ctx.newPage();
  try {
    await lesLiens(page, "data-scenario-du-chapitre", sc.code, sc.reprend[0]!, chemin);
    await aller(page, chemin);
    expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(sc.titre));
    const suites = (n: number): string[][] => (n === 0 ? [[]] : suites(n - 1).flatMap((x) => sc.decisions[n - 1]!.options.map((o) => [...x, o])));
    const meilleure = suites(sc.decisions.length).find((s) => sc.bilan(s).meilleure)!;
    const html = espacesOrdinaires(await page.content());
    expect(html).not.toContain(espacesOrdinaires(sc.situation([meilleure[0]!]).consigne));
    for (const q of sc.questions.questions) for (const o of q.options) expect(html, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
    for (const [i, code] of meilleure.entries()) {
      const decision = page.locator(`[data-decision="${i}"]`);
      await attendre(() => decision.count()).toBe(1);
      expect(await decision.locator("[data-consequence]").count()).toBe(0);
      await decision.locator(`[data-option="${code}"]`).click();
      await decision.getByRole("button", { name: "Décider", exact: true }).click();
      await attendre(() => decision.locator("[data-consequence]").count()).toBe(1);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
      await decision.getByRole("button", { name: i === meilleure.length - 1 ? "Voir le bilan" : "Décision suivante", exact: true }).click();
    }
    await attendre(() => page.locator("[data-bilan]").count()).toBe(1);
    expect(await page.locator("[data-bilan]").getAttribute("data-fin")).toBe(sc.bilan(meilleure).fin.code);
    expect(await page.locator("[data-bilan]").getAttribute("data-meilleure")).toBe("oui");
    for (const q of sc.questions.questions) {
      await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: q.options.find((o) => o.juste)!.texte, exact: true }).click();
      await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
    }
    await attendre(() => page.locator("[data-questions] [data-explication-du-bureau]").count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(1);
  } finally {
    await page.close();
  }
}

describe("les activités du lot C, au téléphone, sous licence", () => {
  it("sans licence, chacune dit qu'elle est réservée", async () => {
    const page = await navigateur.newPage();
    try {
      for (const [chemin, titre] of [
        [`/cours/bureau/${LE_PRET_DE_L_ANNEE.code}`, LE_PRET_DE_L_ANNEE.titre],
        [`/cours/enquete/${LA_NOTE_DE_L_ANALYSTE.code}`, LA_NOTE_DE_L_ANALYSTE.titre],
        [`/cours/scenario/${LE_PRIX_DES_RESSOURCES.code}`, LE_PRIX_DES_RESSOURCES.titre],
      ] as const) {
        await aller(page, chemin);
        const t = await page.locator("main").innerText().then(espacesOrdinaires);
        expect(t).toContain(espacesOrdinaires(titre));
        expect(t).toContain("Ce cas pratique est réservé aux établissements sous licence");
      }
    } finally {
      await page.context().close();
    }
  });

  it("au bureau : le prêt de l'année", () => jouerLeBureau(LE_PRET_DE_L_ANNEE), 300_000);
  it("au bureau : le dossier de financement", () => jouerLeBureau(LE_DOSSIER_DE_FINANCEMENT), 300_000);
  it("au bureau : l'assemblée de juin", () => jouerLeBureau(L_ASSEMBLEE_DE_JUIN), 300_000);
  it("enquête : le dossier des immobilisations", () => jouerLeBureau(LE_DOSSIER_DES_IMMOBILISATIONS), 300_000);
  it("enquête : la note de l'analyste", () => jouerLeBureau(LA_NOTE_DE_L_ANALYSTE), 300_000);
  it("scénario : la ligne en crédit-bail", () => jouerLeScenario(LA_LIGNE_EN_CREDIT_BAIL), 300_000);
  it("scénario : le prix des ressources", () => jouerLeScenario(LE_PRIX_DES_RESSOURCES), 300_000);
});
