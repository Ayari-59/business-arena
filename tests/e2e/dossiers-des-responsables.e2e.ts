import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";
import { ATELIERS } from "../../src/config/ateliers";
import { dossierEnseignant } from "../../src/config/ateliers/dossiers";
import { dossierDuResponsable } from "../../src/config/ateliers/dossiers-des-responsables";
import { ROLES } from "../../src/config/ateliers/roles";

/**
 * LES DOSSIERS DES RESPONSABLES, DANS UN VRAI NAVIGATEUR.
 *
 * Les gardes unitaires vérifient la DONNÉE : qu'aucun levier ne tombe entre
 * deux chaises, qu'aucune réponse ne passe côté élève. Elles ne disent rien
 * de la page, et c'est la page qu'on imprime. Ici : chaque atelier sert une
 * page de responsable qui répond, porte le titre du poste, la feuille de
 * décision, et aucun texte de la préparation ; et la page tient dans sa
 * feuille à l'impression.
 */
let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("les dossiers des responsables", () => {
  // Un rôle par atelier, en tournant : les cinq rôles sont vus, et chaque
  // atelier l'est une fois.
  ATELIERS.forEach((atelier, i) => {
    const role = ROLES[i % ROLES.length]!;
    it(`${atelier.code} · ${role.code} : la page répond, porte le poste, la feuille, et rien de l'enseignant`, async () => {
      const reponse = await page.goto(`${BASE}/animations/${atelier.code}/dossier/${role.code}`, {
        waitUntil: "domcontentloaded",
      });
      expect(reponse?.status(), `${atelier.code}/${role.code}`).toBe(200);
      await page.waitForLoadState("networkidle");
      const texte = (await page.locator("main").innerText()).replace(/[  ]/g, " ");
      expect(texte).toContain(role.titre);
      expect(await page.locator("[data-feuille-de-decision] table").count()).toBe(1);
      // Les tours en colonnes, tous.
      for (let t = 1; t <= atelier.reglages.tours; t++) {
        expect(texte, `${atelier.code}/${role.code} : la colonne du tour ${t} manque`).toContain(`Tour ${t}`);
      }
      // Les décisions du poste, telles que l'écran les nomme.
      const dossier = dossierDuResponsable(atelier, role.code);
      for (const d of dossier.decisions) {
        expect(texte, `${atelier.code}/${role.code} : « ${d.nom} » absente de la page`).toContain(d.nom);
      }
      if (role.code === "direction") {
        expect(await page.locator("[data-liste-de-controle] li").count()).toBeGreaterThan(0);
        expect(texte).toContain("note de justification");
      }
      // Rien de l'enseignant.
      const prof = dossierEnseignant(atelier);
      for (const s of prof.situations) {
        for (const c of s.corriges) {
          expect(texte, `${atelier.code}/${role.code} : l'explication de « ${s.situation.code} » est distribuée`).not.toContain(c.explication);
        }
      }
      for (const seance of atelier.seances) {
        expect(texte, `${atelier.code}/${role.code} : la préparation de la séance ${seance.numero} est distribuée`).not.toContain(seance.preparation);
      }
    }, 60_000);
  });

  it("le sommaire du dossier de l'équipe et la fiche mènent aux cinq dossiers", async () => {
    const atelier = ATELIERS[0]!;
    await aller(page, `/animations/${atelier.code}/dossier`);
    const sommaire = page.locator("[data-sommaire-des-responsables]");
    expect(await sommaire.count()).toBe(1);
    for (const r of ROLES) {
      expect(await sommaire.locator(`a[href="/animations/${atelier.code}/dossier/${r.code}"]`).count()).toBeGreaterThan(0);
    }
    expect(await sommaire.locator("[data-repartition] li").count()).toBeGreaterThan(0);
    await aller(page, `/animations/${atelier.code}`);
    for (const r of ROLES) {
      expect(await page.locator(`a[data-dossier-du-responsable="${r.code}"]`).count()).toBe(1);
    }
  }, 60_000);

  it("à l'impression, un dossier tient dans sa feuille", async () => {
    // Le document se photocopie : un tableau qui déborde de la page perd ses
    // dernières colonnes sur le papier, sans qu'aucune erreur ne le dise.
    const atelier = ATELIERS.find((a) => a.code === "cg1") ?? ATELIERS[0]!;
    for (const role of ["financier", "direction"] as const) {
      await aller(page, `/animations/${atelier.code}/dossier/${role}`);
      await page.emulateMedia({ media: "print" });
      const debord = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debord, `${atelier.code}/${role} : la page déborde à l'impression`).toBeLessThanOrEqual(0);
      // Ce qui ne s'imprime pas : les boutons et les liens de navigation.
      expect(await page.locator("main button:visible").count()).toBe(0);
      await page.emulateMedia({ media: null });
    }
  }, 60_000);

  it("un rôle inconnu répond 404", async () => {
    const reponse = await page.request.get(`${BASE}/animations/${ATELIERS[0]!.code}/dossier/juriste`);
    expect(reponse.status()).toBe(404);
  });
});
