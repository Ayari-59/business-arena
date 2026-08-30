import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { ACTION_PRINCIPALE, tousLesLiens } from "../../src/config/navigation";

/**
 * La navigation, à la largeur d'un téléphone comme à celle d'un vidéoprojecteur.
 *
 * Le défaut réparé ici ne se voyait dans aucun test unitaire : les liens du
 * menu étaient tous marqués « masqué en dessous de la barre des petits écrans »
 * et rien ne les remplaçait. Le code était juste, les liens présents dans le
 * document, et un élève sur son téléphone n'avait AUCUN moyen d'aller nulle
 * part. Seul un vrai navigateur, à une vraie largeur, peut le dire.
 *
 * La garde ne lit donc pas le document mais ce qui est réellement VISIBLE, et
 * elle parcourt le registre du plan : une page ajoutée demain sera vérifiée
 * sans qu'on y pense.
 */
const LARGEURS = [
  { nom: "téléphone", taille: { width: 390, height: 780 } },
  { nom: "grand écran", taille: { width: 1280, height: 900 } },
];

let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("le menu du site", () => {
  for (const largeur of LARGEURS) {
    it(`donne accès à tout le plan sur ${largeur.nom}`, async () => {
      await page.setViewportSize(largeur.taille);
      await aller(page, "/");

      const bouton = page.getByRole("button", { name: "Menu" });
      expect(await bouton.isVisible(), `pas de bouton de menu sur ${largeur.nom}`).toBe(true);
      await bouton.click();

      const invisibles: string[] = [];
      for (const lien of tousLesLiens()) {
        const cible = page.locator(`#plan-du-site a[href="${lien.href}"]`);
        if ((await cible.count()) !== 1 || !(await cible.first().isVisible())) {
          invisibles.push(`${lien.libelle} (${lien.href})`);
          continue;
        }
        // « Visible » au sens du document ne suffit pas : une entrée posée
        // sous le bas de l'écran est présente et hors d'atteinte. On la fait
        // donc défiler, puis on vérifie qu'elle occupe RÉELLEMENT une place
        // dans la fenêtre.
        await cible.scrollIntoViewIfNeeded();
        const boite = await cible.boundingBox();
        if (!boite || boite.y + boite.height <= 0 || boite.y >= largeur.taille.height) {
          invisibles.push(`${lien.libelle} (${lien.href}, hors écran)`);
        }
      }
      expect(invisibles, `injoignable sur ${largeur.nom} : ${invisibles.join(", ")}`).toEqual([]);
    });

    it(`la barre ne déborde pas sur ${largeur.nom}`, async () => {
      // L'encombrement d'origine : huit liens, deux boutons et une marque sur
      // une seule ligne. Le débordement horizontal ne se voit pas en lisant le
      // code, et il coupe la fin de la rangée.
      await page.setViewportSize(largeur.taille);
      await aller(page, "/");
      const debord = await page.evaluate(() => {
        const barre = document.querySelector("header");
        if (!barre) return -1;
        return barre.scrollWidth - barre.clientWidth;
      });
      expect(debord, `la barre déborde de ${debord} px sur ${largeur.nom}`).toBeLessThanOrEqual(0);
    });
  }

  it("se referme à la touche d'échappement", async () => {
    // Un menu resté ouvert recouvre la page qu'on vient d'ouvrir.
    await page.setViewportSize(LARGEURS[0]!.taille);
    await aller(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    const entree = page.locator(`#plan-du-site a[href="${ACTION_PRINCIPALE.href}"]`);
    expect(await entree.isVisible()).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => entree.isVisible()).toBe(false);
  });

  it("conduit à la page demandée, et se referme en arrivant", async () => {
    const lien = tousLesLiens().find((l) => l.href === "/notions")!;
    await page.getByRole("button", { name: "Menu" }).click();
    await page.locator(`#plan-du-site a[href="${lien.href}"]`).click();
    await page.waitForURL(new RegExp(`${lien.href}$`), { timeout: 30_000 });
    await expect
      .poll(() => page.locator(`#plan-du-site a[href="${lien.href}"]`).isVisible())
      .toBe(false);
  });

  it("signale la page où l'on se trouve", async () => {
    // Sans ce repère, le menu est une liste de départs sans point de départ.
    await page.setViewportSize(LARGEURS[1]!.taille);
    await aller(page, "/entreprises");
    await expect
      .poll(() => page.locator('a[href="/entreprises"][aria-current="page"]').count())
      .toBeGreaterThan(0);
  });
});
