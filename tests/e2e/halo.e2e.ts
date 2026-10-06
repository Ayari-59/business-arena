import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";

/**
 * LE HALO ÉCLAIRE LE TITRE, IL NE LE VOILE PAS.
 *
 * Le disque de laiton posé derrière les en-têtes se peignait en réalité
 * par-dessus le texte : sur « Pour les enseignants », le titre passait de
 * 19,3:1 à 8,1:1 de contraste, et ses mots n'avaient pas la même couleur.
 * La mesure de contraste du dépôt ne pouvait pas le voir : elle lit les fonds
 * empilés SOUS un texte, pas ce qui est peint dessus.
 *
 * On mesure donc le rendu lui-même : l'encre la plus sombre du titre, sur une
 * capture, avec le halo puis sans lui. Si le halo est bien derrière, l'encre
 * ne bouge pas.
 */

const PAGES = ["/enseignants", "/animations", "/entreprises", "/entreprises/episode", "/jouer"];

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

/** La clarté relative (0 noir, 1 blanc) de l'encre d'un titre, lue sur sa capture. */
async function encreDuTitre(page: Page, theme: string): Promise<number> {
  const titre = page.locator("main h1").first();
  const png = (await titre.screenshot()).toString("base64");
  return page.evaluate(
    async ({ png, sombre }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const toile = document.createElement("canvas");
      toile.width = image.width;
      toile.height = image.height;
      const ctx = toile.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const { data } = ctx.getImageData(0, 0, image.width, image.height);
      const lin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      const clartes: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        clartes.push(
          0.2126 * lin(data[i]!) + 0.7152 * lin(data[i + 1]!) + 0.0722 * lin(data[i + 2]!),
        );
      }
      clartes.sort((a, b) => a - b);
      // L'encre : les pixels les plus foncés en thème clair, les plus clairs en thème sombre.
      return sombre
        ? clartes[Math.floor(clartes.length * 0.98)]!
        : clartes[Math.floor(clartes.length * 0.02)]!;
    },
    { png, sombre: theme === "sombre" },
  );
}

describe("le halo des en-têtes", () => {
  for (const theme of ["clair", "sombre"]) {
    for (const chemin of PAGES) {
      it(`laisse son encre au titre de ${chemin}, thème ${theme}`, async () => {
        const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 800 } });
        await contexte.addInitScript((t) => {
          try {
            localStorage.setItem("arena-theme", t);
          } catch {
            /* rien */
          }
        }, theme);
        const page = await contexte.newPage();
        await aller(page, chemin);
        expect(await page.locator(".halo-de-page").count(), "la page a un halo").toBe(1);
        const avec = await encreDuTitre(page, theme);
        await page.addStyleTag({ content: ".halo-de-page { display: none !important; }" });
        const sans = await encreDuTitre(page, theme);
        expect(Math.abs(avec - sans), `encre ${avec} avec le halo, ${sans} sans`).toBeLessThan(
          0.005,
        );
        await contexte.close();
      }, 60_000);
    }
  }
});
