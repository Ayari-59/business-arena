import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";

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

  it("les routes répondent 503", async () => {
    expect((await fetch(`${BASE}/api/saml/metadata`)).status).toBe(503);
    expect((await fetch(`${BASE}/api/saml/connexion`, { redirect: "manual" })).status).toBe(503);
    expect((await fetch(`${BASE}/api/saml/acs`, { method: "POST", body: new URLSearchParams({ SAMLResponse: "x" }) })).status).toBe(503);
  });
});
