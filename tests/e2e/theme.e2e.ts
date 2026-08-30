import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { CLE_THEME, THEMES, THEME_PAR_DEFAUT } from "../../src/config/themes";

/**
 * La bascule de thème, dans un vrai navigateur.
 *
 * Tout ce qui fait ce réglage se passe hors de React : un attribut posé sur
 * l'élément racine, une valeur rangée dans le navigateur, un script qui la
 * relit avant le premier affichage. Aucun test unitaire ne voit cet
 * enchaînement, et chacune de ses trois pièces peut marcher seule pendant que
 * l'ensemble ne fait rien : le choix serait alors bien enregistré, et oublié à
 * la page suivante.
 */
const AUTRE = THEMES.find((t) => t.code !== THEME_PAR_DEFAUT)!;

let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("la bascule de thème", () => {
  it("ouvre le site sur le thème par défaut", async () => {
    await aller(page, "/");
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(
      THEME_PAR_DEFAUT,
    );
  });

  it("le bouton annonce le thème vers lequel il mène, pas celui qui est actif", async () => {
    // Un bouton qui afficherait le thème COURANT se lirait comme un état, et on
    // cliquerait dessus en croyant y aller alors qu'on y est déjà.
    const bouton = page.getByRole("button", { name: `Passer au thème ${AUTRE.nom.toLowerCase()}` });
    await expect.poll(() => bouton.count()).toBe(1);
    expect((await bouton.innerText()).trim().toLowerCase()).toBe(AUTRE.nom.toLowerCase());
  });

  it("un clic change le thème et le bouton propose alors le retour", async () => {
    await page.getByRole("button", { name: `Passer au thème ${AUTRE.nom.toLowerCase()}` }).click();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(AUTRE.code);
    const retour = page.getByRole("button", {
      name: new RegExp(THEME_PAR_DEFAUT, "i"),
    });
    await expect.poll(() => retour.count()).toBe(1);
  });

  it("le choix survit au rechargement et au changement de page", async () => {
    // C'est ici que vivait le risque : le script d'amorçage lit une clé, le
    // bouton en écrit une autre, et personne ne voit rien avant de naviguer.
    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(AUTRE.code);
    await aller(page, "/entreprises");
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(AUTRE.code);
    expect(await page.evaluate((cle) => localStorage.getItem(cle), CLE_THEME)).toBe(AUTRE.code);
  });

  it("le thème est posé avant le premier affichage, pas après", async () => {
    // Sans le script d'amorçage, la page arrive en sombre puis bascule sous les
    // yeux du lecteur. On le vérifie sur le document brut, avant tout script de
    // l'application : l'attribut du serveur doit y être, et l'amorce juste après.
    const html = await page.evaluate(async () => (await fetch("/entreprises")).text());
    expect(html).toContain(`data-theme="${THEME_PAR_DEFAUT}"`);
    const amorce = html.indexOf("localStorage.getItem");
    expect(amorce, "le script d'amorçage est absent de la page servie").toBeGreaterThan(0);
    expect(amorce, "l'amorce arrive après le contenu").toBeLessThan(html.indexOf("</body>"));
  });

  it("le logo change de fichier avec le thème", async () => {
    // Le logo est une image : son nom, écrit en gris pâle, disparaîtrait sur
    // fond clair. Seule la feuille de style peut choisir le bon fichier.
    const fichier = () =>
      page.evaluate(
        () =>
          getComputedStyle(document.querySelector(".logo-arena")!).backgroundImage.match(
            /logo[-a-z]*\.svg/,
          )?.[0] ?? "aucun",
      );
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "clair";
    });
    expect(await fichier()).toBe("logo-light.svg");
    await page.evaluate((code) => {
      document.documentElement.dataset.theme = code;
    }, THEME_PAR_DEFAUT);
    expect(await fichier()).toBe("logo.svg");
  });
});
