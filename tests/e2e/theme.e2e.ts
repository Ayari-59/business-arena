import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { COULEUR_DU_PAPIER, COULEUR_DU_TABLEAU } from "../../src/config/themes";

/**
 * L'habillage unique, dans un vrai navigateur : le papier, et le tableau.
 *
 * Le site a eu deux thèmes et un interrupteur. Il n'en a plus qu'un, qui ne
 * se choisit pas. Ce qui se vérifie ici est ce que ce retrait pourrait laisser
 * derrière lui : un ancien choix « sombre » resté dans un navigateur qui
 * rallumerait la nuit, un interrupteur oublié dans une barre, un tableau qui
 * aurait perdu son ardoise.
 */

/** `#rrggbb` en trois canaux. */
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Deux couleurs à un cran près : oklch passe par un arrondi en sRGB. */
function proches(a: number[], b: number[]): boolean {
  return a.every((v, i) => Math.abs(v - b[i]!) <= 2);
}

/**
 * La couleur peinte, en canaux sRGB. getComputedStyle rend une couleur oklch
 * sous la forme `lab(…)` : on la fait peindre par un canevas, qui la rend en
 * octets.
 */
const PEINTE = `(couleur) => {
  const c = document.createElement("canvas").getContext("2d");
  c.fillStyle = couleur;
  c.fillRect(0, 0, 1, 1);
  return [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}`;

let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("le papier et le tableau", () => {
  it("le site s'ouvre sur le papier", async () => {
    await aller(page, "/");
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("clair");
    const fond: number[] = await page.evaluate(
      `(${PEINTE})(getComputedStyle(document.body).backgroundColor)`,
    );
    expect(proches(fond, rgb(COULEUR_DU_PAPIER)), `fond de page ${fond}`).toBe(true);
  });

  it("le grain du papier se pose sur le halo, sans l'effacer", async () => {
    // Le relief a un temps remplacé le halo laiton du fond par le grain : les
    // deux images se disputaient la même propriété, et rien ne l'a signalé.
    const fond: string = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
    expect(fond, "grain").toMatch(/^url\(/);
    expect(fond, "halo").toContain("radial-gradient");
  });

  it("aucun interrupteur de thème ne reste dans la barre", async () => {
    expect(await page.getByRole("button", { name: /^Thème / }).count()).toBe(0);
    expect(await page.locator('[aria-label="Thème du site"]').count()).toBe(0);
  });

  it("un ancien choix « sombre » resté dans le navigateur ne rallume pas la nuit", async () => {
    await page.evaluate(() => localStorage.setItem("arena-theme", "sombre"));
    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("clair");
    await page.evaluate(() => localStorage.removeItem("arena-theme"));
  });

  it("une bande à contre-jour est un tableau : l'ardoise, et sa craie", async () => {
    await aller(page, "/enseignants");
    const bande: { fond: number[]; texte: number[] } = await page.evaluate(`(() => {
      const peinte = ${PEINTE};
      const b = document.querySelector("main .contre-jour");
      return {
        fond: peinte(getComputedStyle(b).backgroundColor),
        texte: peinte(getComputedStyle(b.querySelector("p, h2, li") ?? b).color),
      };
    })()`);
    expect(proches(bande.fond, rgb(COULEUR_DU_TABLEAU)), `fond du tableau ${bande.fond}`).toBe(
      true,
    );
    // La craie, ou le laiton clair : un texte lumineux sur l'ardoise, pas
    // l'encre brune du papier.
    const [r, g, b] = bande.texte.map((v) => v / 255);
    const lumiere = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    expect(lumiere, `texte du tableau ${bande.texte}`).toBeGreaterThan(0.4);
  });

  it("le logo prend l'encre sur le papier", async () => {
    // Le logo est une image : son nom, écrit en craie, disparaîtrait sur le
    // papier. Seule la feuille de style peut choisir le bon fichier.
    const fichier = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".logo-arena")!).backgroundImage.match(
          /logo[-a-z]*\.svg/,
        )?.[0] ?? "aucun",
    );
    expect(fichier).toBe("logo-light.svg");
  });

  it("aucune amorce ne relit un thème avant l'affichage : il n'y a plus rien à relire", async () => {
    const html = await page.evaluate(async () => (await fetch("/entreprises")).text());
    expect(html).toContain('data-theme="clair"');
    expect(html).not.toContain("localStorage.getItem");
  });
});
