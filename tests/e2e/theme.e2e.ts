import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { CLE_THEME, THEMES, THEME_DORIGINE, THEME_PAR_DEFAUT } from "../../src/config/themes";

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
const SERVI = THEMES.find((t) => t.code === THEME_PAR_DEFAUT)!;
/** Le nom accessible d'une position de l'interrupteur. */
const position = (nom: string) => `Thème ${nom.toLowerCase()}`;

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

  it("l'interrupteur est dans la barre, montre les deux thèmes et dit lequel est retenu", async () => {
    // Il a été un bouton unique, rangé dans le panneau « Menu » : on changeait
    // l'apparence derrière une carte qui couvre la page, et un nom de thème
    // seul ne disait pas s'il nommait l'état ou la destination. Les positions
    // sont donc visibles SANS ouvrir le menu, et la retenue s'annonce.
    for (const theme of THEMES) {
      await expect
        .poll(() => page.getByRole("button", { name: position(theme.nom) }).count())
        .toBe(1);
    }
    const retenu = page.getByRole("button", { name: position(SERVI.nom) });
    expect(await retenu.getAttribute("aria-pressed")).toBe("true");
    const autre = page.getByRole("button", { name: position(AUTRE.nom) });
    expect(await autre.getAttribute("aria-pressed")).toBe("false");
  });

  it("un clic sur l'autre position change le thème, et la marque passe avec", async () => {
    await page.getByRole("button", { name: position(AUTRE.nom) }).click();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(AUTRE.code);
    expect(
      await page.getByRole("button", { name: position(AUTRE.nom) }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      await page.getByRole("button", { name: position(SERVI.nom) }).getAttribute("aria-pressed"),
    ).toBe("false");
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
    // Sans le script d'amorçage, la page arrive sur le thème servi par défaut
    // puis bascule sous les yeux du lecteur. On le vérifie sur le document brut, avant tout script de
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
    }, THEME_DORIGINE);
    expect(await fichier()).toBe("logo.svg");
  });
});
