import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import {
  ACTION_PRINCIPALE,
  GROUPE_OUVERT,
  NAVIGATION,
  lienDuPlan,
  liensDAcces,
  liensDeTete,
  tousLesLiens,
} from "../../src/config/navigation";

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

      // Le plan est un accordéon, et UN de ses groupes s'ouvre déjà déplié —
      // celui de l'orientation et du contact, par décision de `navigation.ts`.
      // Cliquer sur tous les boutons le REFERMAIT donc, et ses deux entrées
      // étaient comptées injoignables alors qu'elles s'affichaient à l'écran :
      // c'est le test qui avait pris du retard sur le produit. On ne déplie
      // que ce qui est replié.
      const groupes = page.locator('#plan-du-site button[aria-controls^="groupe-"]');
      for (let i = 0; i < (await groupes.count()); i += 1) {
        const bouton = groupes.nth(i);
        if ((await bouton.getAttribute("aria-expanded")) === "false") await bouton.click();
      }

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
    // Déplier les groupes de l'accordéon pour atteindre le lien voulu.
    const groupes = page.locator('#plan-du-site button[aria-controls^="groupe-"]');
    for (let i = 0; i < (await groupes.count()); i += 1) await groupes.nth(i).click();
    await page.locator(`#plan-du-site a[href="${lien.href}"]`).click();
    await page.waitForURL(new RegExp(`${lien.href}$`), { timeout: 30_000 });
    await expect
      .poll(() => page.locator(`#plan-du-site a[href="${lien.href}"]`).isVisible())
      .toBe(false);
  });

  it("signale la page où l'on se trouve", async () => {
    // Sans ce repère, le menu est une liste de départs sans point de départ.
    // Le repère vit dans le menu (la navigation n'est plus dans la barre) : on
    // l'ouvre et on déplie les groupes pour retrouver la page courante marquée.
    await page.setViewportSize(LARGEURS[1]!.taille);
    await aller(page, "/entreprises");
    await page.getByRole("button", { name: "Menu" }).click();
    const groupes = page.locator('#plan-du-site button[aria-controls^="groupe-"]');
    for (let i = 0; i < (await groupes.count()); i += 1) await groupes.nth(i).click();
    await expect
      .poll(() =>
        page.locator('#plan-du-site a[href="/entreprises"][aria-current="page"]').count(),
      )
      .toBeGreaterThan(0);
  });
});

/**
 * UN SEUL PLAN PAR PUBLIC, LES MÊMES MOTS PARTOUT (octobre 2026).
 *
 * La barre, le menu et le pied de page lisent le même registre : ces gardes
 * vérifient, dans un vrai navigateur, que les trois disent la même chose, que
 * la page courante se marque dans chacun, et que le pied de page tient en
 * quatre colonnes sur grand écran et en une pile sur téléphone.
 */
describe("la barre, le menu et le pied de page lisent le même plan", () => {
  const titres = (locator: ReturnType<Page["locator"]>) =>
    locator.evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));

  it("sur grand écran, la barre porte les titres des groupes, et les deux portes", async () => {
    await page.setViewportSize(LARGEURS[1]!.taille);
    await aller(page, "/enseignants");
    const barre = page.getByRole("navigation", { name: "Navigation principale" });
    const aPlat = barre.locator("ul li a");
    expect(await titres(aPlat)).toEqual(liensDeTete().map((l) => l.libelle));
    expect(await aPlat.evaluateAll((els) => els.map((e) => e.getAttribute("href")))).toEqual(
      liensDeTete().map((l) => l.href),
    );
    for (const l of liensDAcces()) {
      expect(await barre.getByRole("link", { name: l.libelle, exact: true }).isVisible(), l.libelle).toBe(true);
    }
    // La page courante se marque dans la barre : « Enseignants » sur /enseignants.
    expect(await barre.locator('ul li a[aria-current="page"]').innerText()).toBe("Enseignants");

    // Le menu déplie les mêmes groupes, sous les mêmes titres, et marque la page.
    await page.getByRole("button", { name: "Menu" }).click();
    const groupes = page.locator('#plan-du-site button[aria-controls^="groupe-"]');
    const titresDuMenu = (await titres(groupes)).map((t) => t.split(/\s+/)[0]!);
    expect(titresDuMenu).toEqual(NAVIGATION.map((g) => g.titre.split(/\s+/)[0]!));
    expect(titresDuMenu.filter((t) => liensDeTete().some((l) => l.libelle === t))).toEqual(
      liensDeTete().map((l) => l.libelle),
    );
    // Seul « Jouer » est déplié à l'ouverture.
    expect(await groupes.evaluateAll((b) => b.map((x) => x.getAttribute("aria-expanded")))).toEqual(
      NAVIGATION.map((g) => (g.code === GROUPE_OUVERT ? "true" : "false")),
    );
    await page.locator('#plan-du-site button[aria-controls="groupe-enseignants"]').click();
    const courante = page.locator('#plan-du-site a[aria-current="page"]');
    await courante.waitFor({ state: "visible" });
    expect(await courante.getAttribute("href")).toBe("/enseignants");
    expect(await courante.innerText()).toBe(lienDuPlan("/enseignants").libelle);
    await page.keyboard.press("Escape");
  });

  it("les règles du jeu portent leur nom, sous leur adresse d'origine", async () => {
    await aller(page, "/guide");
    expect(await page.getByRole("heading", { level: 1 }).innerText()).toBe(lienDuPlan("/guide").libelle);
    expect(await page.title()).toContain("Règles du jeu");
  });

  for (const largeur of LARGEURS) {
    it(`le pied de page déroule le plan sur ${largeur.nom}`, async () => {
      await page.setViewportSize(largeur.taille);
      await aller(page, "/notions");
      const pied = page.locator("footer [data-plan-du-pied]");
      await pied.scrollIntoViewIfNeeded();
      // Un bloc par groupe, sous le titre du groupe, dans l'ordre du plan.
      const blocs = pied.locator("[data-groupe-du-pied]");
      expect(await blocs.evaluateAll((els) => els.map((e) => e.getAttribute("data-groupe-du-pied")))).toEqual(
        NAVIGATION.map((g) => g.code),
      );
      // Chaque lien du plan y est, sauf la page où l'on est, posée en texte et marquée.
      for (const lien of tousLesLiens()) {
        if (lien.href === "/notions") {
          expect(await pied.locator('[aria-current="page"]').innerText()).toBe(lien.libelle);
          continue;
        }
        const a = pied.locator(`a[href="${lien.href}"]`);
        expect(await a.count(), `${lien.href} manque au pied de page`).toBe(1);
        expect(await a.innerText(), lien.href).toContain(lien.libelle);
      }
      expect(await pied.locator('a[href="/notions"]').count(), "le pied propose la page où l'on est").toBe(0);
      // Quatre colonnes sur grand écran, une pile sur téléphone.
      const gauches = await pied.locator(":scope > div").evaluateAll((els) =>
        els.map((e) => Math.round(e.getBoundingClientRect().left)),
      );
      expect(gauches).toHaveLength(4);
      expect(new Set(gauches).size, `colonnes à ${gauches.join(", ")}`).toBe(largeur.nom === "téléphone" ? 1 : 4);
      // L'adresse de contact, en texte, et aucun débordement.
      expect((await page.locator("footer [data-contact-pied]").innerText()).trim().length).toBeGreaterThan(3);
      const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(debord, `la page déborde de ${debord} px`).toBeLessThanOrEqual(0);
    });
  }
});
