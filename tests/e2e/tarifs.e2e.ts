import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte, unique } from "./helpers/browser";
import {
  LIBELLES_DU_DEVIS,
  MENTION_TVA,
  OFFRES_DU_DEVIS,
  OFFRES_ENSEIGNEMENT,
} from "../../src/config/tarifs";
import { VENDEUR } from "../../src/config/editeur";

/**
 * LA PAGE DES TARIFS, DANS UN VRAI NAVIGATEUR.
 *
 * Ce que la garde d'architecture (`tests/architecture/tarifs.test.ts`) ne voit
 * pas : la page répond sur le build servi, elle tient à 1280 et à 390 sans
 * défilement de côté, les trois cartes sont côte à côte et de même hauteur sur
 * un ordinateur, empilées sur un téléphone, et à aucun moment la fenêtre ne
 * montre plus d'un bouton plein en la parcourant. La vitrine y mène par sa
 * ligne sur les offres de l'arène, l'en-tête et le pied portent « Tarifs ».
 *
 * TOUT SE VEND SUR DEVIS : chaque offre mène à une demande de devis écrite, l'offre
 * pré-remplie ; la demande s'envoie, et la confirmation ne promet que ce qui est parti
 * (sur la base de recette, aucune clé d'envoi : l'accusé n'est pas annoncé).
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

async function ouvrir(largeur: 1280 | 390): Promise<Page> {
  const contexte =
    largeur === 390
      ? await navigateur.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" })
      : await navigateur.newContext({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
  const page = await contexte.newPage();
  await aller(page, "/tarifs");
  return page;
}

/** Les boutons pleins visibles dans la fenêtre, à la position de défilement courante. */
async function pleinsDansLaFenetre(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll(".bouton-plein")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
      })
      .map((e) => (e.textContent ?? "").trim()),
  );
}

/** Parcourt la page d'un bout à l'autre, une demi-fenêtre à la fois. */
async function auPlusUnPleinParEcran(page: Page): Promise<{ max: number; total: number }> {
  const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
  const fenetre = await page.evaluate(() => innerHeight);
  let max = 0;
  for (let y = 0; y <= hauteur; y += Math.round(fenetre / 2)) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    max = Math.max(max, (await pleinsDansLaFenetre(page)).length);
  }
  const total = await page.evaluate(() => document.querySelectorAll(".bouton-plein").length);
  return { max, total };
}

describe("/tarifs", () => {
  for (const largeur of [1280, 390] as const) {
    it(`à ${largeur} px : répond, sans défilement de côté, un seul bouton plein par écran`, async () => {
      const page = await ouvrir(largeur);
      expect(await page.locator("main h1").innerText()).toBe("Tarifs");
      const debord = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debord, "défilement de côté").toBeLessThanOrEqual(0);
      // Le prix et « par an » sont deux éléments de flex : innerText les
      // sépare d'un saut de ligne. On lit le texte comme on le voit.
      const lu = (await texte(page)).replace(/\s+/g, " ");
      for (const attendu of ["490 € par an", "990 € par an", "Sur devis", MENTION_TVA, VENDEUR.nom]) {
        expect(lu, attendu).toContain(attendu);
      }
      expect(lu).not.toMatch(/\bHT\b|\bTTC\b|TVA 20/);
      const { max, total } = await auPlusUnPleinParEcran(page);
      expect(total, "boutons pleins dans la page").toBe(1);
      expect(max, "boutons pleins dans une même fenêtre").toBe(1);
      const plein = page.locator("main .bouton-plein");
      expect(await plein.innerText()).toBe("Demander un devis");
      expect(await plein.getAttribute("href")).toBe("/devis?offre=campus");
      // Aucun paiement en ligne, plus de « Commander » : des demandes de devis.
      expect(await page.getByRole("link", { name: /Commander/ }).count()).toBe(0);
      expect(await page.getByRole("link", { name: /payer/i }).count()).toBe(0);
      const devis = await page
        .locator('main a[href^="/devis?offre="]')
        .evaluateAll((xs) => xs.map((a) => a.getAttribute("href")));
      expect(new Set(devis)).toEqual(new Set(OFFRES_DU_DEVIS.map((o) => `/devis?offre=${o}`)));
      // L'adresse de contact, en texte, près des devis.
      expect(await page.locator("[data-contact]").innerText()).toContain(VENDEUR.contact);
      await page.context().close();
    });
  }

  it("à 1280, les trois cartes côte à côte et de même hauteur ; à 390, empilées", async () => {
    const mesurer = async (page: Page) =>
      page.evaluate(() =>
        [...document.querySelectorAll("[data-offre]")].map((c) => {
          const r = c.getBoundingClientRect();
          return { x: Math.round(r.left), y: Math.round(r.top + scrollY), h: Math.round(r.height) };
        }),
      );
    const large = await ouvrir(1280);
    const l = await mesurer(large);
    expect(l).toHaveLength(OFFRES_ENSEIGNEMENT.length);
    expect(new Set(l.map((c) => c.y)).size, "pas sur une même rangée").toBe(1);
    expect(Math.max(...l.map((c) => c.h)) - Math.min(...l.map((c) => c.h)), "hauteurs").toBeLessThanOrEqual(1);
    // Les boutons tombent au pied des cartes, donc alignés.
    const pieds = await large.evaluate(() =>
      [...document.querySelectorAll("[data-offre] a")].map((a) => Math.round(a.getBoundingClientRect().bottom)),
    );
    expect(new Set(pieds).size, "boutons non alignés").toBe(1);
    await large.context().close();

    const etroit = await ouvrir(390);
    const e = await mesurer(etroit);
    expect(new Set(e.map((c) => c.x)).size, "pas dans une même colonne").toBe(1);
    expect(e[0]!.y).toBeLessThan(e[1]!.y);
    expect(e[1]!.y).toBeLessThan(e[2]!.y);
    await etroit.context().close();
  });

  it("les conditions se replient, avec le chevron commun", async () => {
    const page = await ouvrir(1280);
    const repli = page.locator("details", { hasText: "Conditions de vente" });
    expect(await repli.evaluate((d: HTMLDetailsElement) => d.open)).toBe(false);
    expect(await repli.locator("summary [data-chevron]").count()).toBe(1);
    await repli.locator("summary").click();
    expect(await repli.evaluate((d: HTMLDetailsElement) => d.open)).toBe(true);
    expect(await repli.innerText()).toContain("Pas de reconduction tacite");
    await page.context().close();
  });
});

describe("le site mène aux tarifs", () => {
  it("la ligne de la vitrine mène à /tarifs", async () => {
    const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
    const page = await contexte.newPage();
    await aller(page, "/");
    const lien = page.getByRole("link", { name: "les offres Classe et Campus" });
    expect(await lien.getAttribute("href")).toBe("/tarifs");
    await lien.click();
    await page.waitForURL(/\/tarifs$/);
    expect(await page.locator("main h1").innerText()).toBe("Tarifs");
    await contexte.close();
  });

  it("le menu porte « Tarifs »", async () => {
    const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    const page = await contexte.newPage();
    await aller(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    const groupe = page.locator('#plan-du-site button[aria-controls^="groupe-"]', { hasText: "Tarifs et contact" });
    if ((await groupe.getAttribute("aria-expanded")) === "false") await groupe.click();
    const lien = page.locator('#plan-du-site a[href="/tarifs"]');
    await lien.waitFor({ state: "visible" });
    expect(await lien.innerText()).toContain("Tarifs");
    await contexte.close();
  });
});

describe("« Tarifs » se trouve sans ouvrir le menu (audit C-07)", () => {
  for (const largeur of [1024, 1280] as const) {
    it(`à ${largeur} px, dans l'en-tête, sans débordement de la barre`, async () => {
      const contexte = await navigateur.newContext({ viewport: { width: largeur, height: 900 }, locale: "fr-FR" });
      const page = await contexte.newPage();
      await aller(page, "/enseignants");
      const enTete = page.locator("header").first();
      const lien = enTete.locator('a[href="/tarifs"]');
      expect(await lien.isVisible()).toBe(true);
      const mesure = await enTete.evaluate((h) => {
        const barre = h.getBoundingClientRect();
        const enfants = [...h.querySelectorAll("a, button")].filter((e) => (e as HTMLElement).offsetParent);
        const droite = Math.max(...enfants.map((e) => e.getBoundingClientRect().right));
        // Deux liens qui se chevauchent sur une même ligne seraient un débordement silencieux.
        const rects = enfants.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
        let chevauchements = 0;
        for (let i = 0; i < rects.length; i++)
          for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i]!, b = rects[j]!;
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) chevauchements++;
          }
        return { largeur: barre.width, droite, hauteur: barre.height, chevauchements, scroll: h.scrollWidth - h.clientWidth };
      });
      expect(mesure.droite, JSON.stringify(mesure)).toBeLessThanOrEqual(largeur);
      expect(mesure.scroll, JSON.stringify(mesure)).toBeLessThanOrEqual(0);
      expect(mesure.chevauchements, JSON.stringify(mesure)).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBeLessThanOrEqual(0);
      await contexte.close();
    });
  }

  it("dans le pied de page, avec l'adresse de contact en texte", async () => {
    const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    const page = await contexte.newPage();
    await aller(page, "/enseignants");
    const pied = page.locator("footer");
    expect(await pied.locator('a[href="/tarifs"]').count()).toBe(1);
    expect(await pied.locator("[data-contact-pied]").innerText()).toBe(VENDEUR.contact);
    await contexte.close();
  });

  for (const chemin of ["/enseignants", "/ecoles", "/fonctionnalites"]) {
    it(`${chemin} : une ligne de prix et le lien vers les tarifs dans la bande finale`, async () => {
      const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
      const page = await contexte.newPage();
      await aller(page, chemin);
      const ligne = page.locator("[data-ligne-de-prix]");
      const lu = (await ligne.innerText()).replace(/[\u202f\u00a0]/g, " ");
      expect(lu).toContain("490 € par an");
      expect(lu).toContain("990 € par an");
      expect(await ligne.getByRole("link", { name: "Voir les tarifs" }).getAttribute("href")).toBe("/tarifs");
      await contexte.close();
    });
  }
});

describe("la demande de devis, de la carte à la confirmation", () => {
  for (const offre of OFFRES_DU_DEVIS) {
    it(`« Demander un devis » (${offre}) : formulaire pré-rempli, envoi, confirmation honnête`, async () => {
      const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
      const page = await contexte.newPage();
      await aller(page, "/tarifs");
      await page.locator(`main a[href="/devis?offre=${offre}"]`).first().click();
      await page.waitForURL(new RegExp(`/devis\\?offre=${offre}$`));
      await page.waitForLoadState("networkidle");
      const libelles = LIBELLES_DU_DEVIS[offre];
      expect(await page.locator('select[name="offre"]').inputValue()).toBe(offre);
      const formulaire = page.locator("[data-formulaire-devis]");
      for (const l of [libelles.organisation, libelles.identifiant, libelles.effectif]) {
        // textContent : les étiquettes sont en capitales par le style, pas dans le texte.
        expect(await formulaire.textContent(), l).toContain(l);
      }
      const email = unique(`devis-${offre}`);
      await page.fill('input[name="nom"]', "Claire Martin");
      await page.fill('input[name="fonction"]', offre === "entreprise" ? "Responsable formation" : "Proviseure adjointe");
      await page.fill('input[name="organisation"]', offre === "entreprise" ? "Groupe Durand" : "Lycée Pasteur");
      await page.fill('input[name="identifiant"]', offre === "entreprise" ? "12345678900012" : "0590001A");
      await page.fill('input[name="effectif"]', "6");
      await page.fill('input[name="email"]', email);
      await page.fill('textarea[name="message"]', "Pour la rentrée.");
      await page.getByRole("button", { name: "Envoyer la demande de devis" }).click();
      const confirme = page.locator("[data-devis-confirme]");
      await confirme.waitFor({ state: "visible", timeout: 30_000 });
      const lu = await confirme.innerText();
      expect(lu).toContain(libelles.offre);
      expect(lu).toContain(VENDEUR.nom);
      expect(lu).toContain(MENTION_TVA);
      expect(lu).toContain(`Une question : ${VENDEUR.contact}`);
      // Sur la base de recette, aucune clé d'envoi : l'accusé n'est pas annoncé comme parti.
      expect(await confirme.locator("[data-accuse]").getAttribute("data-accuse")).toBe("non-envoye");
      expect(lu).not.toContain("Un accusé de réception est parti");
      await contexte.close();
    });
  }
});
