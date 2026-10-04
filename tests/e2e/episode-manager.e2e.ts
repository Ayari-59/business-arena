import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * L'ÉPISODE MANAGER, JOUÉ DE BOUT EN BOUT DANS UN VRAI NAVIGATEUR.
 *
 * Deux joueurs, un trimestre connu (`?hasard=11`) : l'un enquête puis décide
 * comme la stratégie « diagnostic d'abord », l'autre répond à tout par une
 * remise sans rien vérifier. Le bilan doit le dire, sur un poste de bureau
 * comme sur un téléphone, sans que la page déborde en largeur.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const bouton = (page: Page, nom: string | RegExp) => page.getByRole("button", { name: nom });
const choisir = (page: Page, libelle: string) => page.getByLabel(libelle, { exact: false }).check();

/** Le diagnostic propose les mêmes causes deux fois : la principale, puis la seconde. */
const principal = (page: Page, libelle: string) =>
  page
    .getByRole("group", { name: /problème principal/ })
    .getByLabel(libelle)
    .check();

async function decider(page: Page, option: string) {
  await choisir(page, option);
  await bouton(page, "Valider la décision").click();
  await bouton(page, /^(Continuer|Voir le bilan)$/).click();
}

async function debordement(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

describe("l'épisode « Le trimestre qui dérape »", () => {
  it("sur un poste de bureau : enquêter, diagnostiquer, et le bilan le reconnaît", async () => {
    const page = await navigateur.newPage({
      viewport: { width: 1280, height: 900 },
      locale: "fr-FR",
    });
    await page.goto(`${BASE}/entreprises/episode?hasard=11`);
    await bouton(page, "Commencer l'épisode").click();

    // Décision 1 : le signal, l'enquête qui coûte du temps, le diagnostic.
    await bouton(page, "Enquêter").click();
    await bouton(page, /Détail par commercial/).click();
    await bouton(page, /Appeler un client perdu/).click();
    await expect.poll(() => page.getByText("Il vous reste 3,5 jours").count()).toBe(1);
    await bouton(page, "Poser mon diagnostic").click();
    await principal(page, "Les clients de Karim ne sont plus suivis");
    await bouton(page, "Décider").click();
    await page.getByRole("spinbutton").fill("34");
    await decider(page, "Réaffecter le portefeuille de Karim");

    // Décision 2 : réévaluer, vérifier, décider.
    await bouton(page, "Continuer").click();
    await choisir(page, "Je le maintiens");
    await bouton(page, "Continuer").click();
    await bouton(page, /Coût du créneau/).click();
    await bouton(page, /Stock disponible/).click();
    await bouton(page, "Décider").click();
    await decider(page, "Garantir la livraison le lendemain");

    // Décision 3 : Julie, surchargée par les comptes de Karim.
    await bouton(page, "Décider").click();
    await bouton(page, /portefeuille et l'agenda de Julie/).click();
    await expect.poll(() => page.getByText("Julie suit 52 comptes").count()).toBe(1);
    await decider(page, "Confier six de ses comptes à Thomas");

    // Décisions 4 à 6.
    await bouton(page, "Décider").click();
    await bouton(page, /Balance âgée/).click();
    await decider(page, "Proposer un escompte");
    await bouton(page, "Décider").click();
    await bouton(page, /Le poids de Delta/).click();
    await decider(page, "Contre-proposer 4 %");
    await bouton(page, "Décider").click();
    await decider(page, "Relancer tous les devis");

    await expect
      .poll(() => page.getByRole("heading", { level: 1 }).textContent())
      .toContain("de marge, pénalités déduites");
    // Le joueur a joué exactement la stratégie de référence : même résultat, même hasard.
    const valeurs = await page
      .locator("li", { hasText: /^(Vous|Diagnostic d'abord)/ })
      .allTextContents();
    expect(valeurs).toHaveLength(2);
    expect(valeurs[0]!.replace("Vous", "")).toBe(valeurs[1]!.replace("Diagnostic d'abord", ""));
    expect(await page.getByText("Votre diagnostic de la semaine 1 était juste").count()).toBe(1);
    expect(
      await page.getByRole("figure", { name: "Votre trimestre, semaine par semaine" }).count(),
    ).toBe(1);
    expect(await page.getByText("Ce que le hasard vous a réservé").count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.close();
  }, 120_000);

  it("sur un téléphone : la remise réflexe, et l'axe de travail qui va avec", async () => {
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    await contexte.addInitScript(() =>
      localStorage.setItem("install-prompt-ferme-le", String(Date.now())),
    );
    const page = await contexte.newPage();
    await page.goto(`${BASE}/entreprises/episode?hasard=11`);
    await bouton(page, "Commencer l'épisode").click();

    await bouton(page, "Enquêter").click();
    await bouton(page, "Poser mon diagnostic").click();
    await principal(page, "Nos prix ne sont plus compétitifs");
    await bouton(page, "Décider").click();
    // Sans prévision chiffrée, la décision ne se valide pas.
    await choisir(page, "Remise de 5 % sur les grands comptes");
    expect(await bouton(page, "Valider la décision").isDisabled()).toBe(true);
    await page.getByRole("spinbutton").fill("36");
    await bouton(page, "Valider la décision").click();
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await bouton(page, "Continuer").click();

    await bouton(page, "Continuer").click();
    await choisir(page, "Je le maintiens");
    await bouton(page, "Continuer").click();
    await bouton(page, "Décider").click();
    await decider(page, "S'aligner par une remise de 3 %");
    await bouton(page, "Décider").click();
    await decider(page, "Lui accorder une prime exceptionnelle");
    await bouton(page, "Décider").click();
    await decider(page, "Relancer les impayés");
    await bouton(page, "Décider").click();
    await decider(page, "Accepter les 8 %");
    await bouton(page, "Décider").click();
    await decider(page, "Remise de 5 % sur tout pour finir");

    await expect.poll(() => page.getByText("Votre axe de travail").count()).toBe(1);
    expect(await page.getByText("Vérifier la cause avant d'agir").count()).toBe(1);
    expect(await page.getByText("vous avez choisi la remise 3 fois sur 3").count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(0);

    // Rejouer avec le même hasard ramène à la première décision…
    await bouton(page, "Recommencer avec le même hasard").click();
    await expect
      .poll(() => page.getByRole("heading", { level: 1 }).textContent())
      .toBe("La transformation décroche");

    // … et le bilan suivant met les deux parties côte à côte.
    await bouton(page, "Enquêter").click();
    await bouton(page, "Poser mon diagnostic").click();
    await principal(page, "Les clients de Karim ne sont plus suivis");
    await bouton(page, "Décider").click();
    await page.getByRole("spinbutton").fill("36");
    await decider(page, "Réaffecter le portefeuille de Karim");
    await bouton(page, "Continuer").click();
    await choisir(page, "Je le maintiens");
    await bouton(page, "Continuer").click();
    await bouton(page, "Décider").click();
    await decider(page, "Garantir la livraison le lendemain");
    for (const option of [
      "Confier six de ses comptes à Thomas",
      "Proposer un escompte",
      "Contre-proposer 4 %",
      "Relancer tous les devis",
    ]) {
      await bouton(page, "Décider").click();
      await decider(page, option);
    }
    await expect.poll(() => page.getByText("Votre partie précédente, et celle-ci").count()).toBe(1);
    expect(await page.getByText("Même hasard pour les deux parties").count()).toBe(1);
    expect(await page.getByText("changé", { exact: true }).count()).toBe(6);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await contexte.close();
  }, 120_000);
});
