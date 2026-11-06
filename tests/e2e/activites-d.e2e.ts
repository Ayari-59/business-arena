import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { LE_BILAN_FINANCIER_POUR_LA_BANQUE } from "../../src/config/cours/bureaux/le-bilan-financier-pour-la-banque";
import { LE_DIAGNOSTIC_POUR_L_ASSEMBLEE } from "../../src/config/cours/bureaux/le-diagnostic-pour-l-assemblee";
import { LE_TABLEAU_DE_FINANCEMENT_DE_NOVA } from "../../src/config/cours/bureaux/le-tableau-de-financement-de-nova";
import { LES_SOLDES_POUR_LA_BANQUE } from "../../src/config/cours/bureaux/les-soldes-pour-la-banque";
import type { Bureau } from "../../src/config/cours/bureaux/types";
import { LE_BILAN_FONCTIONNEL_DE_L_ALTERNANT } from "../../src/config/cours/enquetes/le-bilan-fonctionnel-de-l-alternant";
import { LE_TABLEAU_DES_FLUX_DE_L_ASSISTANTE } from "../../src/config/cours/enquetes/le-tableau-des-flux-de-l-assistante";
import { LES_COMPTES_ANNUELS_DU_STAGIAIRE } from "../../src/config/cours/enquetes/les-comptes-annuels-du-stagiaire";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { cellulesASaisir, libelleDeCellule, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LES ACTIVITÉS DU LOT D, JOUÉES DANS LE NAVIGATEUR : trois bureaux et trois enquêtes de la comptabilité
 * générale, chacune de bout en bout, sur téléphone, sous licence, par la bonne suite. Le chapitre et le
 * catalogue y mènent ; la page ne porte aucun corrigé ; le premier classement, tout rangé dans la première
 * catégorie, est refusé par le serveur ; puis tout se rend juste jusqu'au « Travail rendu ».
 */

const ACTIVITES: readonly Bureau[] = [
  LES_SOLDES_POUR_LA_BANQUE,
  LE_BILAN_FONCTIONNEL_DE_L_ALTERNANT,
  LE_BILAN_FINANCIER_POUR_LA_BANQUE,
  LES_COMPTES_ANNUELS_DU_STAGIAIRE,
  LE_DIAGNOSTIC_POUR_L_ASSEMBLEE,
  LE_TABLEAU_DE_FINANCEMENT_DE_NOVA,
  LE_TABLEAU_DES_FLUX_DE_L_ASSISTANTE,
];

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const titreDeLEtape = (p: Page) => p.locator("h2").first().innerText().then(espacesOrdinaires);
const attendre = <T>(f: () => Promise<T>) => expect.poll(f, { timeout: 20_000 });
const suivante = (p: Page, dernier = false) => p.getByRole("button", { name: dernier ? "Rendre le travail" : "Étape suivante", exact: true }).click();

describe.each(ACTIVITES)("lot D : $code", (b) => {
  const format = b.format ?? "bureau";
  const chemin = `/cours/${format}/${b.code}`;
  const lien = format === "enquete" ? "data-enquete-du-chapitre" : "data-bureau-du-chapitre";

  it("sous licence, le chapitre et le catalogue y mènent, et elle se joue de bout en bout au téléphone", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    try {
      await aller(page, `/cours/${b.reprend[0]}`);
      expect(await page.locator(`a[${lien}="${b.code}"]`).getAttribute("href")).toBe(chemin);
      await aller(page, "/cours");
      expect(await page.locator(`a[${lien}="${b.code}"]`).first().getAttribute("href")).toBe(chemin);

      await aller(page, chemin);
      expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(b.titre));
      // Aucun corrigé dans la page.
      const html = espacesOrdinaires(await page.content());
      for (const e of b.etapes) {
        const corriges = [...e.explication, ...(e.type === "classement" ? e.elements.map((x) => x.pourquoi) : []), ...(e.type === "reponse" ? e.questions.flatMap((q) => q.options.map((o) => o.retour)) : [])];
        for (const t of corriges) expect(html, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
      }
      expect(html).not.toMatch(/categorie\\?"/);

      let premier = true;
      for (const [i, e] of b.etapes.entries()) {
        await attendre(() => titreDeLEtape(page)).toBe(espacesOrdinaires(e.titre));
        if (e.type === "classement") {
          if (premier) {
            // Tout dans la première catégorie : le serveur refuse.
            for (const x of e.elements) await page.locator(`[data-element="${x.code}"]`).getByRole("radio", { name: e.categories[0]!.libelle, exact: true }).click();
            await page.getByRole("button", { name: "Vérifier", exact: true }).click();
            await attendre(() => page.getByText(/pas encore à (leur|sa) place/).count()).toBeGreaterThan(0);
            expect(await page.locator("[data-element] .encadre-gain").count()).toBe(0);
            premier = false;
          }
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
        } else if (e.type === "etat") {
          for (const { ligne, colonne, cellule } of cellulesASaisir(e.grille)) {
            const nom = libelleDeCellule(e.grille, ligne, colonne);
            const v = cellule.valeur!;
            await page.getByLabel(nom, { exact: true }).pressSequentially(valeurASaisir(Math.abs(v)));
            if (v < 0) await page.getByRole("button", { name: `Changer le signe : ${nom}`, exact: true }).tap();
          }
          await page.getByRole("button", { name: "Vérifier", exact: true }).click();
          await attendre(() => page.locator("[data-etat-juste]").innerText().then(espacesOrdinaires)).toBe(espacesOrdinaires(e.reussite!));
          expect(await page.locator("[data-calculs-du-tableau]").count()).toBe(1);
        } else if (e.type === "reponse") {
          for (const q of e.questions) {
            const bonne = q.options.find((o) => o.juste)!;
            await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: bonne.texte, exact: true }).click();
            await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
          }
        }
        expect(await debordement(page)).toBeLessThanOrEqual(1);
        await suivante(page, i === b.etapes.length - 1);
      }

      await expect.poll(() => page.locator("main").innerText().then(espacesOrdinaires)).toContain(`${b.etapes.length - 1} étapes réussies du premier coup sur ${b.etapes.length}`);
      expect(await page.locator("[data-travail-rendu]").count()).toBe(1);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
    } finally {
      await ctx.close();
    }
  });
});
