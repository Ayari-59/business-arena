import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";
import { espacesOrdinaires } from "../../src/lib/typographie";

/**
 * SANS CONFIGURATION SAML, AUCUNE PORTE VERS UNE ERREUR.
 *
 * Le serveur tourne SANS les variables SAML (clé du SP, épingle de l'agrégat) : le bouton
 * « Se connecter avec mon établissement » n'apparaît nulle part, et les routes
 * /api/saml/* répondent 503. Ce fichier se joue contre un serveur non configuré (le
 * parcours configuré est tests/e2e/renater.e2e.ts).
 */

let navigateur: Browser;
beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
});
afterAll(async () => {
  await navigateur?.close();
});

describe("la connexion par l'établissement, non configurée", () => {
  it("aucun bouton sur /teacher/login, /join ni l'invitation de cohorte", async () => {
    const page = await navigateur.newPage();
    for (const chemin of ["/teacher/login", "/join?code=ABC234", "/entreprises/episode/rejoindre?code=INCONNU-1"]) {
      await aller(page, chemin);
      expect(await page.locator("[data-connexion-etablissement]").count(), chemin).toBe(0);
      expect(await page.locator("body").innerText(), chemin).not.toContain("Se connecter avec mon établissement");
    }
    await page.close();
  });

  /**
   * LA CONNEXION SE DIT COMME ELLE EST (chantier « petits points de novembre », 11 novembre 2026) :
   * sans le bouton, /integration et le guide du référent la disent prévue, et disent comment on entre
   * aujourd'hui (config/connexion-etablissement.ts).
   */
  it("/integration et le guide du référent la disent prévue, et comment on entre aujourd'hui", async () => {
    const page = await navigateur.newPage();
    await aller(page, "/integration#renater");
    const section = espacesOrdinaires(await page.locator("#renater").innerText());
    expect(section).toContain("Prévue pour les établissements de la Fédération Éducation-Recherche");
    expect(section).toContain("s'ouvrira une fois l'inscription de Business Arena à la fédération faite");
    expect(section).toContain("Aujourd'hui, on entre par le code donné par l'enseignant, ou par son compte enseignant.");
    expect(section).not.toContain("mène au service de découverte de RENATER. On y choisit");
    await aller(page, "/guides/etablissement#renater");
    const etape = espacesOrdinaires(await page.locator("#renater").innerText());
    expect(etape).toContain("La connexion est prévue");
    expect(etape).not.toMatch(/» mène au service de découverte/);
    await aller(page, "/teacher/mot-de-passe-oublie");
    expect(await page.locator("[data-comptes-sans-mot-de-passe]").innerText()).not.toMatch(/RENATER|connexion par l'établissement/);
    await page.close();
  });

  it("les routes répondent 503", async () => {
    expect((await fetch(`${BASE}/api/saml/metadata`)).status).toBe(503);
    expect((await fetch(`${BASE}/api/saml/connexion`, { redirect: "manual" })).status).toBe(503);
    expect((await fetch(`${BASE}/api/saml/acs`, { method: "POST", body: new URLSearchParams({ SAMLResponse: "x" }) })).status).toBe(503);
  });
});
