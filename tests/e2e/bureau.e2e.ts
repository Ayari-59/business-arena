import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { RAPPROCHEMENT_DE_MARS as b, grilleDeLEtat } from "../../src/config/cours/bureaux/rapprochement-de-mars";
import type { EtapeDeClassement, EtapeDeReponse, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { cellulesASaisir, libelleDeCellule, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LE BUREAU, JOUÉ DANS LE NAVIGATEUR (config/cours/bureaux) : la pile de mars de MAILLE & CO, de bout en
 * bout, sur téléphone, comme un élève qui ne se trompe qu'une fois. Sans licence, le bureau dit qu'il est
 * réservé ; sous licence, le chapitre et le catalogue y mènent, la page ne porte aucun corrigé, et chaque
 * geste est corrigé par le serveur : un pointage faux est refusé, puis tout se rend juste jusqu'au
 * « Travail rendu ».
 */

const CHEMIN = `/cours/bureau/${b.code}`;
const etape = <T>(id: string) => b.etapes.find((e) => e.id === id) as T;

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const titreDeLEtape = (p: Page) => p.locator("h2").first().innerText().then(espacesOrdinaires);
/** Une correction passe par le serveur : on lui laisse le temps de répondre. */
const attendre = <T>(f: () => Promise<T>) => expect.poll(f, { timeout: 20_000 });
const suivante = (p: Page, dernier = false) => p.getByRole("button", { name: dernier ? "Rendre le travail" : "Étape suivante", exact: true }).click();

describe("/cours/bureau : le rapprochement de mars", () => {
  it("sans licence, le bureau dit qu'il est réservé", async () => {
    const page = await navigateur.newPage();
    await aller(page, CHEMIN);
    const texte = await page.locator("main").innerText().then(espacesOrdinaires);
    await page.context().close();
    expect(texte).toContain(b.titre);
    expect(texte).toContain("Ce cas pratique est réservé aux établissements sous licence");
  });

  it("sous licence, le chapitre et le catalogue y mènent, et il se joue de bout en bout au téléphone, corrigé par le serveur", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    try {
      // Le chapitre « Fournisseurs et banque » et le catalogue mènent au bureau.
      await aller(page, "/cours/fournisseurs-et-banque?entreprise=boutique");
      expect(await page.locator(`a[data-bureau-du-chapitre="${b.code}"]`).getAttribute("href")).toBe(CHEMIN);
      await aller(page, "/cours");
      expect(await page.locator(`a[data-bureau-du-chapitre="${b.code}"]`).first().getAttribute("href")).toBe(CHEMIN);

      await aller(page, CHEMIN);
      expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(b.titre);
      // Aucun corrigé dans la page : ni les pourquoi, ni les retours, ni les calculs de l'état.
      const html = espacesOrdinaires(await page.content());
      const pile = etape<EtapeDeClassement>("la-pile");
      const reponse = etape<EtapeDeReponse>("la-reponse");
      for (const t of [...pile.elements.map((x) => x.pourquoi), ...reponse.questions.flatMap((q) => q.options.map((o) => o.retour))]) {
        expect(html, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
      }
      // La clé d'une catégorie attendue (`"categorie":`, échappée ou non dans la charge de la page).
      expect(html).not.toMatch(/categorie\\?"/);

      // 1. Classer la pile : chaque pièce s'ouvre, puis se range.
      await attendre(() => titreDeLEtape(page)).toBe("Classer la pile");
      for (const x of pile.elements) {
        const ligne = page.locator(`[data-element="${x.code}"]`);
        await ligne.getByText("Ouvrir la pièce", { exact: true }).click();
        expect(await ligne.locator(`[data-piece="${x.piece}"]`).isVisible()).toBe(true);
        await ligne.getByRole("radio", { name: pile.categories.find((k) => k.code === x.categorie)!.libelle, exact: true }).click();
      }
      expect(await debordement(page)).toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-element] .encadre-gain").count()).toBe(pile.elements.length);
      await suivante(page);

      // 2. Pointer : tout « pointé » d'abord, le serveur refuse ; puis juste.
      await attendre(() => titreDeLEtape(page)).toBe("Pointer le relevé face au compte");
      const pointage = etape<EtapeDeClassement>("le-pointage");
      for (const x of pointage.elements) await page.locator(`[data-element="${x.code}"]`).getByRole("radio", { name: "Pointée", exact: true }).click();
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.getByText(/lignes ne sont pas encore à leur place/).count()).toBe(1);
      expect(await page.locator("[data-element] .encadre-gain").count()).toBe(0);
      for (const x of pointage.elements) {
        await page.locator(`[data-element="${x.code}"]`).getByRole("radio", { name: pointage.categories.find((k) => k.code === x.categorie)!.libelle, exact: true }).click();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-element] .encadre-gain").count()).toBe(pointage.elements.length);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
      await suivante(page);

      // 3. L'état de rapprochement : chaque case, au clavier du téléphone, le signe par son bouton.
      await attendre(() => titreDeLEtape(page)).toBe("Dresser l'état de rapprochement");
      const g = grilleDeLEtat();
      for (const { ligne, colonne, cellule } of cellulesASaisir(g)) {
        const nom = libelleDeCellule(g, ligne, colonne);
        const v = cellule.valeur!;
        await page.getByLabel(nom, { exact: true }).pressSequentially(valeurASaisir(Math.abs(v)));
        if (v < 0) await page.getByRole("button", { name: `Changer le signe : ${nom}`, exact: true }).tap();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-etat-juste]").count()).toBe(1);
      expect(await page.locator("[data-calculs-du-tableau]").count()).toBe(1);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
      await suivante(page);

      // 4. Les écritures, une à une.
      await attendre(() => titreDeLEtape(page)).toBe("Passer les écritures");
      const journal = etape<EtapeDuJournal>("les-ecritures");
      for (const [n, x] of journal.ecritures.entries()) {
        for (const [k, l] of enSaisie(x.ecriture).entries()) {
          await page.getByLabel(`Compte, ligne ${k + 1}`, { exact: true }).fill(l.compte);
          if (l.debit) await page.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
          if (l.credit) await page.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
        }
        await page.getByRole("button", { name: "Valider l'écriture" }).click();
        await attendre(() => page.locator("[data-ecriture-passee]").count()).toBe(n + 1);
        expect(await page.getByText("Écriture juste.").count()).toBe(1);
      }
      await attendre(() => page.locator("[data-explication-du-bureau]").count()).toBe(1);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
      await suivante(page);

      // 5. Répondre à la gérante.
      await attendre(() => titreDeLEtape(page)).toBe("Répondre à la gérante");
      for (const q of reponse.questions) {
        const bonne = q.options.find((o) => o.juste)!;
        await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: bonne.texte, exact: true }).click();
        await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
      }
      await suivante(page, true);

      const notees = b.etapes.length;
      await expect
        .poll(() => page.locator("main").innerText().then(espacesOrdinaires))
        .toContain(`${notees - 1} étapes réussies du premier coup sur ${notees}`);
      expect(await page.locator("[data-travail-rendu]").count()).toBe(1);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
    } finally {
      await ctx.close();
    }
  });
});
