import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { NAVIGATION, lienDuPlan, liensDAcces, liensDeTete, tousLesLiens } from "../../src/config/navigation";

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

/**
 * Toutes les adresses du plan : les mots de la barre, qui sont aussi les titres des groupes du
 * menu déplié, les entrées des groupes et les deux portes. Sur téléphone, la barre ne montre pas
 * ses mots : c'est le menu déplié qui doit tout porter.
 */
const ADRESSES = [...new Set([...liensDeTete(), ...tousLesLiens()].map((l) => l.href))];

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

      // Les groupes sont dépliés (novembre 2026) : il n'y a rien à ouvrir pour
      // atteindre une entrée. Une page peut s'y lire deux fois (le titre
      // « Cours » et l'entrée « Diplômes » mènent à /cours) : chaque lien doit
      // se voir.
      const invisibles: string[] = [];
      for (const href of ADRESSES) {
        const cibles = page.locator(`#plan-du-site a[href="${href}"]`);
        const n = await cibles.count();
        if (n === 0) {
          invisibles.push(`${href} (absent)`);
          continue;
        }
        for (let i = 0; i < n; i += 1) {
          const cible = cibles.nth(i);
          if (!(await cible.isVisible())) {
            invisibles.push(`${href} (masqué)`);
            continue;
          }
          // « Visible » au sens du document ne suffit pas : une entrée posée
          // sous le bas de l'écran est présente et hors d'atteinte. On la fait
          // donc défiler, puis on vérifie qu'elle occupe RÉELLEMENT une place
          // dans la fenêtre.
          await cible.scrollIntoViewIfNeeded();
          const boite = await cible.boundingBox();
          if (!boite || boite.y + boite.height <= 0 || boite.y >= largeur.taille.height) {
            invisibles.push(`${href} (hors écran)`);
          }
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

    it(`le menu déplié tient dans sa carte sur ${largeur.nom}`, async () => {
      // Un mot par entrée : les entrées passent à la ligne, et aucune ne sort de
      // la carte ni ne fait défiler la page de côté.
      await page.setViewportSize(largeur.taille);
      await aller(page, "/");
      await page.getByRole("button", { name: "Menu" }).click();
      await page.locator("#plan-du-site [data-titre-du-groupe]").first().waitFor({ state: "visible" });
      const mesure = await page.evaluate(() => {
        const carte = document.querySelector("#plan-du-site .carte")!;
        const r = carte.getBoundingClientRect();
        const dehors = [...carte.querySelectorAll("a")]
          .filter((a) => {
            const b = a.getBoundingClientRect();
            return b.left < r.left - 0.5 || b.right > r.right + 0.5;
          })
          .map((a) => a.textContent?.trim());
        return {
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          carte: carte.scrollWidth - carte.clientWidth,
          dehors,
        };
      });
      expect(mesure.page, JSON.stringify(mesure)).toBeLessThanOrEqual(0);
      expect(mesure.carte, JSON.stringify(mesure)).toBeLessThanOrEqual(0);
      expect(mesure.dehors, JSON.stringify(mesure)).toEqual([]);
      await page.keyboard.press("Escape");
    });
  }

  it("se referme à la touche d'échappement", async () => {
    // Un menu resté ouvert recouvre la page qu'on vient d'ouvrir.
    await page.setViewportSize(LARGEURS[0]!.taille);
    await aller(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    const entree = page.locator(`#plan-du-site a[href="${liensDAcces()[0]!.href}"]`);
    expect(await entree.isVisible()).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => entree.isVisible()).toBe(false);
  });

  it("conduit à la page demandée, et se referme en arrivant", async () => {
    const lien = lienDuPlan("/notions");
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
    await page.getByRole("button", { name: "Menu" }).click();
    const courante = page.locator('#plan-du-site a[href="/entreprises"][aria-current="page"]');
    await courante.waitFor({ state: "visible" });
    expect((await courante.innerText()).trim()).toBe(lienDuPlan("/entreprises").libelle);
    await page.keyboard.press("Escape");
  });
});

/**
 * UN MENU PAR PRODUIT, UN MOT PAR ENTRÉE (novembre 2026).
 *
 * La barre, le menu déplié et le pied de page lisent le même registre : ces
 * gardes vérifient, dans un vrai navigateur, que les trois disent les mêmes
 * mots, vers les mêmes pages, que la page courante se marque dans chacun, et
 * que le pied de page tient en cinq colonnes sur grand écran et en deux sur
 * téléphone.
 */
describe("la barre, le menu et le pied de page lisent le même plan", () => {
  const textes = (locator: ReturnType<Page["locator"]>) =>
    locator.evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
  const adresses = (locator: ReturnType<Page["locator"]>) =>
    locator.evaluateAll((els) => els.map((e) => e.getAttribute("href")));

  it("sur grand écran, la barre porte les mots des groupes et les deux portes ; le menu, les mêmes", async () => {
    await page.setViewportSize(LARGEURS[1]!.taille);
    await aller(page, "/tarifs");
    const barre = page.getByRole("navigation", { name: "Navigation principale" });
    const aPlat = barre.locator("ul li a");
    expect(await textes(aPlat)).toEqual(liensDeTete().map((l) => l.libelle));
    expect(await adresses(aPlat)).toEqual(liensDeTete().map((l) => l.href));
    // Les portes : un mot à l'écran, un nom plus long qui commence par lui.
    for (const l of liensDAcces()) {
      const porte = barre.getByRole("link", { name: l.nom ?? l.libelle, exact: true });
      expect(await porte.isVisible(), l.libelle).toBe(true);
      expect((await porte.innerText()).trim()).toBe(l.libelle);
      expect(l.nom ?? l.libelle).toMatch(new RegExp(`^${l.libelle}`));
    }
    // La page courante se marque dans la barre : « Offres » sur /tarifs.
    expect(await barre.locator('ul li a[aria-current="page"]').innerText()).toBe("Offres");

    // Le menu déplié : les deux portes en tête, puis les mêmes mots, vers les
    // mêmes pages, dans le même ordre, et la page courante marquée.
    await page.getByRole("button", { name: "Menu" }).click();
    const portes = page.locator("#plan-du-site [data-portes-du-menu] a");
    await portes.first().waitFor({ state: "visible" });
    expect(await textes(portes)).toEqual(liensDAcces().map((l) => l.libelle));
    expect(await adresses(portes)).toEqual(liensDAcces().map((l) => l.href));
    const titres = page.locator("#plan-du-site [data-titre-du-groupe]");
    expect(await textes(titres)).toEqual(NAVIGATION.map((g) => g.titre));
    expect(await adresses(titres)).toEqual(liensDeTete().map((l) => l.href));
    expect(await adresses(page.locator('#plan-du-site a[aria-current="page"]'))).toEqual(["/tarifs"]);
    // Sous chaque titre, ses entrées, d'un mot.
    for (const g of NAVIGATION) {
      expect(await textes(page.locator(`#plan-du-site [data-groupe-du-menu="${g.code}"] ul a`)), g.titre).toEqual(
        g.liens.map((l) => l.libelle),
      );
    }
    await page.keyboard.press("Escape");
  });

  it("les règles du jeu : « Règles » au menu, sous leur adresse d'origine ; la page garde son titre", async () => {
    await aller(page, "/guide");
    expect(lienDuPlan("/guide").libelle).toBe("Règles");
    expect(await page.getByRole("heading", { level: 1 }).innerText()).toBe("Règles du jeu");
    expect(await page.title()).toContain("Règles du jeu");
  });

  for (const largeur of LARGEURS) {
    it(`le pied de page déroule le plan sur ${largeur.nom}`, async () => {
      await page.setViewportSize(largeur.taille);
      await aller(page, "/notions");
      const pied = page.locator("footer [data-plan-du-pied]");
      await pied.scrollIntoViewIfNeeded();
      // Un bloc par groupe, dans l'ordre du plan, sous le mot de la barre, vers la même page.
      const blocs = pied.locator("[data-groupe-du-pied]");
      expect(await blocs.evaluateAll((els) => els.map((e) => e.getAttribute("data-groupe-du-pied")))).toEqual(
        NAVIGATION.map((g) => g.code),
      );
      for (const [i, g] of NAVIGATION.entries()) {
        const titre = blocs.nth(i).locator(":scope > :first-child");
        expect((await titre.innerText()).trim(), g.code).toBe(g.titre);
        expect(await titre.getAttribute("href"), g.code).toBe(g.entree);
      }
      // Chaque entrée y est, sauf la page où l'on est, posée en texte et marquée.
      for (const lien of NAVIGATION.flatMap((g) => g.liens)) {
        if (lien.href === "/notions") {
          expect(await pied.locator('[aria-current="page"]').innerText()).toBe(lien.libelle);
          continue;
        }
        const a = pied.locator(`ul a[href="${lien.href}"]`);
        expect(await a.count(), `${lien.href} manque au pied de page`).toBe(1);
        expect((await a.innerText()).trim(), lien.href).toBe(lien.libelle);
      }
      expect(await pied.locator('a[href="/notions"]').count(), "le pied propose la page où l'on est").toBe(0);
      // Cinq colonnes sur une rangée sur grand écran ; deux colonnes sur trois rangées sur téléphone.
      const cases = await blocs.evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { gauche: Math.round(r.left), haut: Math.round(r.top) };
        }),
      );
      expect(cases).toHaveLength(5);
      const colonnes = new Set(cases.map((c) => c.gauche)).size;
      const rangees = new Set(cases.map((c) => c.haut)).size;
      expect(colonnes, `colonnes à ${cases.map((c) => c.gauche).join(", ")}`).toBe(largeur.nom === "téléphone" ? 2 : 5);
      expect(rangees, `rangées à ${cases.map((c) => c.haut).join(", ")}`).toBe(largeur.nom === "téléphone" ? 3 : 1);
      // L'adresse de contact, en texte, et aucun débordement.
      expect((await page.locator("footer [data-contact-pied]").innerText()).trim().length).toBeGreaterThan(3);
      const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(debord, `la page déborde de ${debord} px`).toBeLessThanOrEqual(0);
    });
  }
});
