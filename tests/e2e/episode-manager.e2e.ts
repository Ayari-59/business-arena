import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import { coursDeLEpisode } from "../../src/pedagogy/cours/suites";
import { EPISODES_DE_DEMO } from "../../src/config/episodes/demos";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * L'ÉPISODE MANAGER, JOUÉ DE BOUT EN BOUT DANS UN VRAI NAVIGATEUR.
 *
 * Deux joueurs, un trimestre connu (`?hasard=11`) : l'un enquête puis décide
 * comme la stratégie « diagnostic d'abord », l'autre répond à tout par une
 * remise sans rien vérifier. Le bilan doit le dire, sur un poste de bureau
 * comme sur un téléphone, sans que la page déborde en largeur.
 */

/**
 * SOUS LICENCE. Sans licence, seuls les épisodes de démonstration se lancent, en
 * Découverte (services/acces.service.ts) ; ce parcours vérifie autre chose, sur des
 * épisodes et des niveaux qui n'en sont pas : chaque navigateur y est celui d'un
 * enseignant d'un établissement sous licence (tests/e2e/helpers/licence.ts). La règle
 * elle-même est gardée par acces.e2e.ts.
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
    await enseignantSousLicence(page.context(), { episodes: true });
    await page.goto(`${BASE}/entreprises/episode/trimestre-qui-derape?hasard=11`);
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
    expect(await page.getByText("Ce que les aléas vous ont réservé").count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.close();
  }, 120_000);

  it("sur un téléphone : la remise réflexe, et l'axe de travail qui va avec", async () => {
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    await enseignantSousLicence(contexte, { episodes: true });
    await contexte.addInitScript(() =>
      localStorage.setItem("install-prompt-ferme-le", String(Date.now())),
    );
    const page = await contexte.newPage();
    await page.goto(`${BASE}/entreprises/episode/trimestre-qui-derape?hasard=11`);
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
    // Sous le bilan, le cours du thème : ses chapitres, dans leur ordre.
    const cours = coursDeLEpisode("trimestre-qui-derape")!;
    expect(
      await page
        .locator(`[data-cours-du-theme="${cours.theme.code}"] [data-chapitre-du-theme]`)
        .evaluateAll((xs) => xs.map((x) => x.getAttribute("data-chapitre-du-theme"))),
    ).toEqual(cours.chapitres.map((c) => c.code));

    // Recommencer avec les mêmes aléas ramène à la première décision…
    await bouton(page, "Recommencer avec les mêmes aléas").click();
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
    expect(await page.getByText("Mêmes aléas pour les deux parties").count()).toBe(1);
    expect(await page.getByText("changé", { exact: true }).count()).toBe(6);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await contexte.close();
  }, 120_000);

  it("la liste mène à tous les épisodes, et le deuxième se joue jusqu'au bilan", async () => {
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    await enseignantSousLicence(contexte, { episodes: true });
    await contexte.addInitScript(() =>
      localStorage.setItem("install-prompt-ferme-le", String(Date.now())),
    );
    const page = await contexte.newPage();
    await page.goto(`${BASE}/entreprises/episode`);
    // Les épisodes sont rangés dans des tiroirs fermés à l'arrivée (un par
    // thème d'Arvel Distribution, un par métier pour les autres) : les cartes
    // sont dans la page, repliées. On compte donc aussi celles qu'on ne voit
    // pas, puis on vérifie qu'un tiroir déplié montre bien les siennes.
    expect(
      await page.getByRole("link", { name: /Jouer l'épisode/, includeHidden: true }).count(),
    ).toBe(EPISODES.length);
    expect(await page.getByRole("link", { name: /Jouer l'épisode/ }).count()).toBe(0);
    await page.locator("main details > summary").first().click();
    expect(await page.getByRole("link", { name: /Jouer l'épisode/ }).count()).toBeGreaterThan(0);
    expect(await debordement(page)).toBeLessThanOrEqual(0);

    await page.goto(`${BASE}/entreprises/episode/equipe-qui-s-epuise?hasard=4242`);
    await bouton(page, "Commencer l'épisode").click();
    await bouton(page, "Enquêter").click();
    await bouton(page, /Analyser les demandes/).click();
    await bouton(page, /Écouter trois conseillers/).click();
    await bouton(page, "Poser mon diagnostic").click();
    await principal(page, "Les retards font écrire les clients deux fois");
    await bouton(page, "Décider").click();
    await page.getByRole("spinbutton").fill("3.8");
    await decider(page, "Envoyer un accusé de réception");

    await bouton(page, "Continuer").click();
    await choisir(page, "Je le maintiens");
    await bouton(page, "Continuer").click();
    await bouton(page, /entretien avec Mathieu/).click();
    await expect
      .poll(() => page.getByText("plus calme depuis l'accusé de réception").count())
      .toBe(1);
    await bouton(page, "Décider").click();
    await decider(page, "Lui proposer 150 € de plus");
    for (const option of [
      "Créer une file d'expertise tournante",
      "Préparer des réponses types",
      "Accepter à l'essai",
      "Traiter d'abord les demandes les plus anciennes",
    ]) {
      await bouton(page, "Décider").click();
      await decider(page, option);
    }

    await expect
      .poll(() => page.getByRole("heading", { level: 1 }).textContent())
      .toContain("sous le budget");
    expect(await page.getByText("Votre diagnostic de la semaine 1 était juste").count()).toBe(1);
    const valeurs = await page
      .locator("li", { hasText: /^(Vous|Soulager la file d'abord)/ })
      .allTextContents();
    expect(valeurs[0]!.replace("Vous", "")).toBe(
      valeurs[1]!.replace("Soulager la file d'abord", ""),
    );
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await contexte.close();
  }, 120_000);
});

describe("les niveaux de difficulté", () => {
  it("en Expert : enquête courte, pas de conseil, une seule vérification, et le bilan le dit", async () => {
    const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
    await enseignantSousLicence(page.context(), { episodes: true });
    await page.goto(`${BASE}/entreprises/episode/trimestre-qui-derape?hasard=11&niveau=expert`);
    await expect.poll(() => page.getByLabel("Expert", { exact: false }).isChecked()).toBe(true);
    await bouton(page, "Commencer l'épisode").click();
    expect(await page.getByText("Niveau Expert", { exact: true }).count()).toBe(1);

    await bouton(page, "Enquêter").click();
    await expect.poll(() => page.getByText("Il vous reste 2,5 jours").count()).toBe(1);
    expect(await bouton(page, /Demander conseil/).count()).toBe(0);
    await bouton(page, /Détail par commercial/).click();
    await bouton(page, /Appeler un client perdu/).click();
    await bouton(page, "Poser mon diagnostic").click();
    await principal(page, "Les clients de Karim ne sont plus suivis");
    await bouton(page, "Décider").click();
    await page.getByRole("spinbutton").fill("34");
    await decider(page, "Réaffecter le portefeuille de Karim");

    // Décision 2 : une vérification, pas deux.
    await bouton(page, "Continuer").click();
    await choisir(page, "Je le maintiens");
    await bouton(page, "Continuer").click();
    await bouton(page, /Coût du créneau/).click();
    await expect.poll(() => bouton(page, /Stock disponible/).isDisabled()).toBe(true);
    expect(await page.getByText("une seule vérification").count()).toBe(1);
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
    await expect.poll(() => page.getByText(/niveau Expert · tirage n°/).count()).toBe(1);
    await page.close();
  }, 120_000);

  it("en Découverte : des repères, et l'effet de chaque choix tout de suite", async () => {
    const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
    await enseignantSousLicence(page.context(), { episodes: true });
    await page.goto(`${BASE}/entreprises/episode/trimestre-qui-derape?hasard=11`);
    await choisir(page, "Démonstration");
    await bouton(page, "Commencer l'épisode").click();
    expect(await page.getByText("Niveau Démonstration", { exact: true }).count()).toBe(1);
    // La première étape arrive du serveur (pedagogy/episodes/partie-servie.ts), son repère avec elle.
    await expect.poll(() => page.getByText("Repère ·").count()).toBe(1);
    await bouton(page, "Enquêter").click();
    expect(await bouton(page, /Demander conseil/).count()).toBe(1);
    await bouton(page, "Poser mon diagnostic").click();
    await principal(page, "Les clients de Karim ne sont plus suivis");
    await bouton(page, "Décider").click();
    await page.getByRole("spinbutton").fill("34");
    await choisir(page, "Réaffecter le portefeuille de Karim");
    await bouton(page, "Valider la décision").click();
    await expect
      .poll(() =>
        page.getByText(/Retour immédiat · Sur ce trimestre-ci, ce choix (rapporte|coûte)/).count(),
      )
      .toBe(1);
    expect(await page.locator("main").innerText()).not.toMatch(/undefined|NaN/);
    await page.close();
  }, 120_000);
});

/**
 * UN ÉPISODE REPREND AU MÊME ÉCRAN APRÈS UN RECHARGEMENT, ET L'ATTENTE NE VIDE PLUS LA PAGE (audit UX du
 * 11 novembre 2026, P1-6, P2-3, P2-4, P2-5 ; décisions du propriétaire). Sur un téléphone, sous licence :
 *  · le badge dit « Données fictives », sans « Démonstration » ;
 *  · une prévision hors de sa plage le dit sous le champ, « Entre 0 et 100 % » ;
 *  · pendant 1,5 s d'attente du serveur, la page garde sa hauteur, et l'en-tête n'avance qu'avec la
 *    réponse ; les phrases d'attente restent ;
 *  · un rechargement, à la conséquence, à l'étape suivante, puis au bilan, rend le même écran : le
 *    serveur rejoue la partie à partir de ses faits, gardés dans l'onglet, rien de la vue avec eux.
 * Avec E2E_CAPTURES, chaque écran est photographié à 390 px.
 */
describe("l'épisode repris au même écran, et l'attente qui garde la page", () => {
  const capturer = async (page: Page, nom: string) => {
    const dossier = process.env.E2E_CAPTURES;
    if (!dossier) return;
    mkdirSync(dossier, { recursive: true });
    await page.screenshot({ path: join(dossier, `${nom}-390.png`) });
  };
  const espaces = (t: string) => t.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
  const ralentir = (page: Page) =>
    page.route("**/api/episodes/partie", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
  const hauteur = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight);
  const moment = (page: Page) => page.locator("[data-moment-de-l-episode]").innerText().then(espaces);
  const titre = (page: Page) => page.getByRole("heading", { level: 1 }).textContent().then((t) => espaces(t ?? ""));
  // Les chiffres du verdict montent depuis zéro (components/chiffre-qui-arrive.tsx) : on les lit arrivés.
  const chiffresArrives = (page: Page) =>
    page.waitForFunction(() => !document.documentElement.hasAttribute("data-chiffres-arrivent"), undefined, { timeout: 15_000 });
  // La phrase d'attente se lit à l'écran : dans la fenêtre, et sous ce qui se colle en haut dans le pire cas,
  // l'en-tête du site montré (il revient quand la page remonte) et la ligne du tableau de bord dessous.
  const aLEcran = (page: Page, texte: string) =>
    page.evaluate((t) => {
      const p = [...document.querySelectorAll("[role=status]")].find((e) => e.textContent?.includes(t));
      if (!p) return false;
      const r = p.getBoundingClientRect();
      const enTete = document.querySelector("body > header")?.getBoundingClientRect().height ?? 0;
      const ligne = document.querySelector("[data-ligne-du-tableau]")?.getBoundingClientRect().height ?? 0;
      return r.bottom - 8 > enTete + ligne && r.bottom <= window.innerHeight;
    }, texte);

  it("sous licence, sur un téléphone : badge, plage de la prévision, attente, et reprise à chaque écran", async () => {
    // Sans le service worker du site : il relaie les appels à l'API, et une route posée par le test ne les
    // verrait plus passer une fois qu'il contrôle la page (le ralenti ne ralentirait rien).
    // Mouvement réduit : la scène remonte d'un coup à son haut (le défilement doux laisserait la photo
    // entre deux positions), et les chiffres du verdict s'écrivent arrivés.
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR", serviceWorkers: "block", reducedMotion: "reduce" });
    await enseignantSousLicence(contexte, { episodes: true });
    await contexte.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
    const page = await contexte.newPage();
    await page.goto(`${BASE}/entreprises/episode/trimestre-qui-derape?hasard=11`);
    expect(espaces(await page.locator("[data-badge-de-l-episode]").innerText())).toBe("Données fictives");

    // « Le trimestre se prépare… » : la page garde la hauteur de l'introduction, l'en-tête attend.
    await ralentir(page);
    const avantDeCommencer = await hauteur(page);
    await bouton(page, "Commencer l'épisode").click();
    await page.getByText("Le trimestre se prépare…").waitFor();
    expect(await hauteur(page)).toBeGreaterThanOrEqual(avantDeCommencer - 2);
    expect(await moment(page)).toBe("Avant de commencer");
    await expect.poll(() => aLEcran(page, "Le trimestre se prépare…")).toBe(true);
    await capturer(page, "episode-le-trimestre-se-prepare");
    await expect.poll(() => titre(page), { timeout: 15_000 }).toBe("La transformation décroche");
    await page.unroute("**/api/episodes/partie");

    await bouton(page, "Enquêter").click();
    await bouton(page, "Poser mon diagnostic").click();
    await principal(page, "Les clients de Karim ne sont plus suivis");
    await bouton(page, "Décider").click();
    // Une prévision hors de sa plage : la plage se dit sous le champ, et la décision attend.
    await choisir(page, "Réaffecter le portefeuille de Karim");
    await page.getByRole("spinbutton").fill("1100");
    await expect.poll(() => page.locator("[data-prevision-hors-plage]").innerText().then(espaces)).toBe("Entre 0 et 100 %");
    expect(await bouton(page, "Valider la décision").isDisabled()).toBe(true);
    await page.locator("[data-prevision-hors-plage]").scrollIntoViewIfNeeded();
    await capturer(page, "episode-prevision-hors-plage");
    await page.getByRole("spinbutton").fill("34");
    expect(await page.locator("[data-prevision-hors-plage]").count()).toBe(0);

    // « Les semaines passent… » : la page garde sa hauteur, l'en-tête reste à la décision jusqu'à la réponse.
    await ralentir(page);
    const avantDeValider = await hauteur(page);
    const momentDeLaDecision = await moment(page);
    await bouton(page, "Valider la décision").click();
    await page.getByText("Les semaines passent…").waitFor();
    expect(await hauteur(page)).toBeGreaterThanOrEqual(avantDeValider - 2);
    expect(await moment(page)).toBe(momentDeLaDecision);
    expect(await page.locator('[data-avancement] li[aria-label="Décision 1, prise"]').count()).toBe(0);
    await expect.poll(() => aLEcran(page, "Les semaines passent…")).toBe(true);
    await capturer(page, "episode-les-semaines-passent");
    await expect.poll(() => moment(page), { timeout: 15_000 }).toMatch(/^Fin de semaine \d+$/);
    expect(await page.locator('[data-avancement] li[aria-label="Décision 1, prise"]').count()).toBe(1);
    await page.unroute("**/api/episodes/partie");

    // Rechargé à la conséquence : le même verdict, le même en-tête.
    const consequence = page.getByRole("region", { name: "Conséquence de votre décision" });
    await chiffresArrives(page);
    const verdict = espaces(await consequence.innerText());
    const finDeSemaine = await moment(page);
    await page.reload();
    await expect.poll(() => consequence.count(), { timeout: 15_000 }).toBe(1);
    await chiffresArrives(page);
    expect(espaces(await consequence.innerText())).toBe(verdict);
    expect(await moment(page)).toBe(finDeSemaine);
    await capturer(page, "episode-repris-apres-rechargement");
    // Ce que l'onglet garde : des faits, rien de la vue du serveur.
    const garde = (await page.evaluate(() => sessionStorage.getItem("episode:trimestre-qui-derape:partie")))!;
    expect(Object.keys(JSON.parse(garde)).sort()).toEqual(
      ["v", "code", "graine", "cle", "niveau", "ecran", "etape", "phase", "decisions", "consultes", "jours", "diagnostic", "reevaluation", "prevision", "choix", "precedente"].sort(),
    );
    expect(garde).not.toMatch(/verdict|bilan|tableau|semaines/);

    // Rechargé à l'étape suivante : la même étape.
    await bouton(page, "Continuer").click();
    await expect.poll(() => titre(page)).toBe("Les artisans veulent être livrés demain");
    await page.reload();
    await expect.poll(() => titre(page), { timeout: 15_000 }).toBe("Les artisans veulent être livrés demain");

    // Jusqu'au bilan, puis rechargé au bilan : le même bilan.
    await bouton(page, "Continuer").click();
    await choisir(page, "Je le maintiens");
    await bouton(page, "Continuer").click();
    await bouton(page, "Décider").click();
    await decider(page, "Garantir la livraison le lendemain");
    for (const option of ["Confier six de ses comptes à Thomas", "Proposer un escompte", "Contre-proposer 4 %", "Relancer tous les devis"]) {
      await bouton(page, "Décider").click();
      await decider(page, option);
    }
    await expect.poll(() => page.getByText("Votre axe de travail").count(), { timeout: 15_000 }).toBe(1);
    const bilan = await titre(page);
    await page.reload();
    await expect.poll(() => page.getByText("Votre axe de travail").count(), { timeout: 15_000 }).toBe(1);
    expect(await titre(page)).toBe(bilan);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    // « Recommencer » vide l'onglet : un rechargement ramène à l'introduction.
    await bouton(page, /^Recommencer$/).click();
    await page.reload();
    await expect.poll(() => moment(page), { timeout: 15_000 }).toBe("Avant de commencer");
    await contexte.close();
  }, 240_000);

  it("hors licence, une démonstration dit « Démonstration · données fictives »", async () => {
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/entreprises/episode/${EPISODES_DE_DEMO[0]}`);
    expect(espaces(await page.locator("[data-badge-de-l-episode]").innerText())).toBe("Démonstration · données fictives");
    await contexte.close();
  }, 60_000);
});
