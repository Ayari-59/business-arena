import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { LA_CLOTURE_DU_STAGIAIRE as e, grilleDuResultat } from "../../src/config/cours/enquetes/la-cloture-du-stagiaire";
import type { EtapeDeClassement, EtapeDeRectification } from "../../src/config/cours/bureaux/types";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { cellulesASaisir, libelleDeCellule, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * L'ENQUÊTE, JOUÉE DANS LE NAVIGATEUR (config/cours/enquetes) : la clôture du stagiaire de NOVA, de bout
 * en bout, sur téléphone. Sans licence, l'enquête dit qu'elle est réservée ; sous licence, le chapitre
 * « La clôture » et le catalogue y mènent, la page ne porte aucun corrigé, et chaque geste est corrigé
 * par le serveur : tout marquer faux est refusé, l'écriture du stagiaire repassée telle quelle aussi
 * (une piste vient), puis tout se rend juste jusqu'au « Travail rendu ».
 */

const CHEMIN = `/cours/enquete/${e.code}`;
const tri = e.etapes.find((x) => x.id === "le-tri") as EtapeDeClassement;
const rectification = e.etapes.find((x) => x.id === "les-rectifications") as EtapeDeRectification;

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

describe("/cours/enquete : la clôture du stagiaire", () => {
  it("sans licence, l'enquête dit qu'elle est réservée", async () => {
    const page = await navigateur.newPage();
    await aller(page, CHEMIN);
    const texte = await page.locator("main").innerText().then(espacesOrdinaires);
    await page.context().close();
    expect(texte).toContain(e.titre);
    expect(texte).toContain("Ce cas pratique est réservé aux établissements sous licence");
  });

  it("sous licence, le chapitre et le catalogue y mènent, et elle se joue de bout en bout au téléphone, corrigée par le serveur", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    try {
      // Le chapitre « La clôture » et le catalogue mènent à l'enquête.
      await aller(page, "/cours/la-cloture");
      expect(await page.locator(`a[data-enquete-du-chapitre="${e.code}"]`).getAttribute("href")).toBe(CHEMIN);
      await aller(page, "/cours");
      expect(await page.locator(`a[data-enquete-du-chapitre="${e.code}"]`).first().getAttribute("href")).toBe(CHEMIN);

      await aller(page, CHEMIN);
      expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(e.titre);
      // Aucun corrigé dans la page : ni les pourquoi, ni les pistes, ni les raisons, ni les écritures justes.
      const html = espacesOrdinaires(await page.content());
      for (const t of [...tri.elements.map((x) => x.pourquoi), ...rectification.ecritures.flatMap((x) => [x.pourquoi, ...x.indices])]) {
        expect(html, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
      }
      expect(html).not.toMatch(/categorie\\?"/);
      expect(html).not.toMatch(/raison\\?"/);
      expect(html).not.toContain("9 861,11");

      // 1. Trier : tout « Fausse » d'abord, le serveur refuse ; puis juste.
      await attendre(() => titreDeLEtape(page)).toBe("Trier les écritures");
      for (const x of tri.elements) {
        const ligne = page.locator(`[data-element="${x.code}"]`);
        await ligne.getByText("Ouvrir la pièce", { exact: true }).click();
        expect(await ligne.locator(`[data-piece="${x.piece}"]`).isVisible()).toBe(true);
        await ligne.getByRole("radio", { name: "Fausse", exact: true }).click();
      }
      expect(await debordement(page)).toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.getByText(/lignes ne sont pas encore à leur place/).count()).toBe(1);
      expect(await page.locator("[data-element] .encadre-gain").count()).toBe(0);
      for (const x of tri.elements) {
        await page.locator(`[data-element="${x.code}"]`).getByRole("radio", { name: tri.categories.find((k) => k.code === x.categorie)!.libelle, exact: true }).click();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-element] .encadre-gain").count()).toBe(tri.elements.length);
      await suivante(page);

      // 2. Rectifier : les seules écritures fausses ; la première, repassée telle quelle, est refusée avec une piste.
      await attendre(() => titreDeLEtape(page)).toBe("Rectifier les écritures fausses");
      expect(await page.locator("[data-rectification]").count()).toBe(rectification.ecritures.length);
      for (const [n, x] of rectification.ecritures.entries()) {
        const carte = page.locator(`[data-rectification="${x.id}"]`);
        const ouvrir = carte.getByRole("button", { name: "Rectifier cette écriture", exact: true });
        if (await ouvrir.count()) await ouvrir.click();
        const raison = rectification.raisons.find((k) => k.code === x.raison)!.libelle;
        await carte.getByRole("radio", { name: raison, exact: true }).click();
        if (n === 0) {
          await carte.getByRole("button", { name: "Valider l'écriture" }).click();
          await attendre(() => carte.locator("[data-indice]").count()).toBe(1);
          expect(await carte.locator("[data-rectifiee]").count()).toBe(0);
        }
        for (const [k, l] of enSaisie(x.ecriture).entries()) {
          await carte.getByLabel(`Compte, ligne ${k + 1}`, { exact: true }).fill(l.compte);
          await carte.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
          await carte.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
        }
        await carte.getByRole("button", { name: "Valider l'écriture" }).click();
        await attendre(() => page.locator("[data-rectifiee]").count()).toBe(n + 1);
        expect(await debordement(page)).toBeLessThanOrEqual(1);
      }
      await attendre(() => page.locator("[data-explication-du-bureau]").count()).toBe(1);
      await suivante(page);

      // 3. Le vrai résultat : chaque case, au clavier du téléphone, le signe par son bouton.
      await attendre(() => titreDeLEtape(page)).toBe("Donner le vrai résultat");
      const g = grilleDuResultat();
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
      await suivante(page, true);

      // Le tri et la rectification ont chacun un essai manqué : une étape réussie du premier coup.
      await expect.poll(() => page.locator("main").innerText().then(espacesOrdinaires)).toContain(`1 étape réussie du premier coup sur ${e.etapes.length}`);
      expect(await page.locator("[data-travail-rendu]").count()).toBe(1);
      expect(await page.getByRole("button", { name: "Recommencer l'enquête", exact: true }).count()).toBe(1);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
    } finally {
      await ctx.close();
    }
  });
});
