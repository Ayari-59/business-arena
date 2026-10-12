import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { EPISODES, episodeParCode } from "../../src/pedagogy/episodes/registre";
import { EPISODES_DE_DEMO, estUneDemo } from "../../src/config/episodes/demos";
import { ATELIERS } from "../../src/config/ateliers";

/**
 * SANS LICENCE, DANS UN VRAI NAVIGATEUR : NIVEAUX 1 À 3, ET CINQ DÉMONSTRATIONS.
 *
 * Décision du propriétaire (octobre 2026) : « Fermer les niveaux 4 à 6 et mettre
 * uniquement 5 épisodes en démo », pour tous ceux qui n'ont pas de licence active. Ce
 * parcours regarde ce qu'en voit un visiteur sans compte et un enseignant sans licence :
 * les niveaux fermés restent visibles, marqués « Offre Classe, Programme ou Campus » avec le lien vers
 * les tarifs, et le serveur refuse un formulaire forgé ; au catalogue, les cinq démos
 * sont signalées et se jouent en Découverte, les autres sont marquées « Offre
 * Entreprise » et ne se lancent pas, même par leur adresse.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

async function contexte(mobile = false): Promise<BrowserContext> {
  const c = await navigateur.newContext(
    mobile
      ? { ...devices["iPhone 13"], locale: "fr-FR" }
      : { viewport: { width: 1280, height: 900 }, locale: "fr-FR" },
  );
  await c.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
  return c;
}

const NOMBRE_DE_DEMOS = EPISODES_DE_DEMO.length;
const NON_DEMO = EPISODES.find((e) => !estUneDemo(e.code))!;

/** Joue l'épisode affiché jusqu'au bilan, comme episodes-tous.e2e.ts. */
async function jouerJusquAuBilan(page: Page, placeholder: string): Promise<void> {
  for (let pas = 0; pas < 140; pas += 1) {
    if ((await page.getByText("Votre axe de travail").count()) > 0) return;
    const vu = await page.locator("main").innerText();
    expect(vu, "texte cassé").not.toMatch(/undefined|NaN/);
    for (const nom of await page.$$eval("input[type=radio]", (xs) => [
      ...new Set(xs.map((x) => (x as HTMLInputElement).name)),
    ])) {
      if (!(await page.$(`input[name="${nom}"]:checked`))) {
        await page.locator(`input[name="${nom}"]`).first().check();
      }
    }
    const prevision = page.getByRole("spinbutton");
    if ((await prevision.count()) > 0 && !(await prevision.inputValue())) {
      await prevision.fill(placeholder.replace(",", ".").replace("−", "-").replace(/\s/g, ""));
    }
    await page.locator("main button.bg-amber-400:not([disabled])").first().click();
  }
  throw new Error("le bilan n'a pas été atteint");
}

describe("/jouer sans licence", () => {
  it("les niveaux 4 à 6 restent visibles, marqués « Offre Classe, Programme ou Campus », avec le lien vers les tarifs", async () => {
    const c = await contexte(true);
    const page = await c.newPage();
    await aller(page, "/jouer");
    const encadre = page.locator("[data-niveaux-reserves]");
    await encadre.waitFor({ state: "visible" });
    const dit = await encadre.innerText();
    expect(dit).toContain("Les niveaux 4 à 6 · Offre Classe, Programme ou Campus");
    expect(dit).toContain("Les niveaux 4 à 6 sont inclus dans les offres Classe, Programme et Campus.");
    expect(await encadre.getByRole("link", { name: /Voir les offres/ }).getAttribute("href")).toBe(
      "/tarifs",
    );
    // Chaque niveau fermé se nomme comme tel, et reste à l'écran.
    for (const n of [4, 5, 6]) {
      const bouton = page.getByRole("button", { name: new RegExp(`^Niveau ${n} .*Offre Classe, Programme ou Campus$`) });
      expect(await bouton.count(), `niveau ${n}`).toBe(1);
      expect(await bouton.isVisible()).toBe(true);
    }
    for (const n of [1, 2, 3]) {
      expect(
        await page.getByRole("button", { name: new RegExp(`^Niveau ${n} .*Offre Classe, Programme ou Campus$`) }).count(),
      ).toBe(0);
    }
    // Une même borne pour les neuf entreprises : l'encadré le dit une fois, pas neuf badges.
    expect(await page.getByText("Niveaux 1-3").count()).toBe(0);
    // Le niveau fermé ne se choisit pas : on reste au plus haut permis.
    await page.getByRole("button", { name: /^Niveau 5/ }).click();
    expect(await page.locator("input[name=level]").inputValue()).toBe("3");
    await c.close();
  });

  it("le serveur refuse un formulaire forgé au niveau 5 : retour sur /jouer, message et lien", async () => {
    const c = await contexte();
    const page = await c.newPage();
    await aller(page, "/jouer");
    await page.evaluate(() => {
      (document.querySelector("input[name=level]") as HTMLInputElement).value = "5";
    });
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/jouer\?reserve=1/, { timeout: 30_000 });
    const statut = page.locator("[role=status]", { hasText: "Offres Enseignant" }).or(
      page.locator("[role=status]", { hasText: "offres Classe, Programme et Campus" }),
    );
    await statut.first().waitFor({ state: "visible" });
    expect(await statut.first().getByRole("link", { name: /tarifs/ }).getAttribute("href")).toBe(
      "/tarifs",
    );
    await c.close();
  });

  it("une partie de niveau 3 se lance normalement", async () => {
    const c = await contexte();
    const page = await c.newPage();
    await aller(page, "/jouer");
    expect(await page.locator("input[name=level]").inputValue()).toBe("3");
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\/|trop=1/, { timeout: 60_000 });
    if (page.url().includes("trop=1")) throw new Error("Plafond de parties par heure atteint.");
    await c.close();
  });

  it("un enseignant sous licence, connecté, crée au niveau 6", async () => {
    const c = await contexte();
    await enseignantSousLicence(c);
    const page = await c.newPage();
    await aller(page, "/jouer");
    expect(await page.locator("[data-niveaux-reserves]").count()).toBe(0);
    await page.getByRole("button", { name: /^Niveau 6/ }).click();
    expect(await page.locator("input[name=level]").inputValue()).toBe("6");
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\/|trop=1/, { timeout: 60_000 });
    if (page.url().includes("trop=1")) throw new Error("Plafond de parties par heure atteint.");
    await c.close();
  });
});

describe("la partie d'un enseignant sans licence", () => {
  it("niveaux 4 à 6 marqués et non choisissables ; un envoi forgé est refusé avec le lien", async () => {
    const c = await contexte();
    await enseignantSousLicence(c, { licence: false });
    const page = await c.newPage();
    await aller(page, "/teacher");
    if ((await page.locator("#nouvelle-partie[open]").count()) === 0) {
      await page.locator("#nouvelle-partie > summary").click();
    }
    const options = await page.locator('select[name="level"] option').evaluateAll((xs) =>
      xs.map((o) => ({
        v: (o as HTMLOptionElement).value,
        texte: o.textContent ?? "",
        ferme: (o as HTMLOptionElement).disabled,
      })),
    );
    expect(options.map((o) => o.v)).toEqual(["1", "2", "3", "4", "5", "6"]);
    for (const o of options) {
      const ferme = Number(o.v) > 3;
      expect(o.ferme, o.v).toBe(ferme);
      expect(o.texte.includes("Offre Classe, Programme ou Campus"), o.v).toBe(ferme);
    }
    const message = page.locator("[data-niveaux-reserves]");
    expect(await message.innerText()).toContain(
      "Les niveaux 4 à 6 sont inclus dans les offres Classe, Programme et Campus.",
    );
    expect(await message.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe(
      "/tarifs",
    );
    // Un formulaire forgé : le serveur refuse, l'enseignant lit pourquoi, et où.
    await page.evaluate(() => {
      const o = document.querySelector('select[name="level"] option[value="5"]') as HTMLOptionElement;
      o.disabled = false;
    });
    await page.selectOption('select[name="level"]', "5");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    await page.waitForSelector("text=/La partie n'a pas été créée/", { timeout: 30_000 });
    const alerte = page.locator("[role=alert]", { hasText: "La partie n'a pas été créée" });
    expect(await alerte.innerText()).toContain("inclus dans les offres Classe, Programme et Campus");
    expect(await alerte.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe(
      "/tarifs",
    );
    await c.close();
  });

  it("un atelier de niveau 5 sans licence : visible, avec son message, non lançable", async () => {
    const atelier = ATELIERS.find((a) => a.reglages.niveau > 3 && !a.reglages.tournoi)!;
    const c = await contexte();
    const page = await c.newPage();
    await aller(page, `/animations/${atelier.code}`);
    const ferme = page.locator("[data-atelier-ferme]");
    await ferme.waitFor({ state: "visible" });
    expect(await ferme.innerText()).toContain("Offre Classe, Programme ou Campus");
    expect(await ferme.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe(
      "/tarifs",
    );
    expect(await page.getByRole("link", { name: /Créer la partie dans mon espace/ }).count()).toBe(0);
    // Sous licence, le bouton revient.
    await enseignantSousLicence(c);
    await aller(page, `/animations/${atelier.code}`);
    expect(await page.locator("[data-atelier-ferme]").count()).toBe(0);
    expect(await page.getByRole("link", { name: /Créer la partie dans mon espace/ }).count()).toBe(1);
    await c.close();
  });
});

describe("le catalogue des épisodes sans licence", () => {
  it("les démos en tête, signalées ; les autres visibles, marquées « Épisodes manager · sur devis », sans lien de jeu", async () => {
    const c = await contexte();
    const page = await c.newPage();
    await aller(page, "/entreprises/episode");
    const demos = page.locator("[data-demos-gratuites]");
    await demos.waitFor({ state: "visible" });
    expect(await demos.locator("[data-marque-demo]").count()).toBe(NOMBRE_DE_DEMOS);
    expect(await demos.getByRole("link", { name: /Jouer l'épisode/ }).count()).toBe(NOMBRE_DE_DEMOS);
    // Dans les tiroirs : les démos marquées, les autres fermées, toutes présentes.
    expect(await page.locator("[data-catalogue-des-episodes] [data-marque-demo]").count()).toBe(
      NOMBRE_DE_DEMOS,
    );
    expect(await page.locator("[data-episode-ferme]").count()).toBe(EPISODES.length - NOMBRE_DE_DEMOS);
    expect(await page.locator("[data-marque-offre]").count()).toBe(EPISODES.length - NOMBRE_DE_DEMOS);
    expect(await page.locator("[data-marque-offre]").first().textContent()).toBe("Épisodes manager · sur devis");
    expect(
      await page.getByRole("link", { name: /Jouer l'épisode/, includeHidden: true }).count(),
    ).toBe(2 * NOMBRE_DE_DEMOS);
    // Une carte fermée garde son titre et son accroche, et mène aux tarifs.
    const carte = page.locator(`[data-episode-ferme="${NON_DEMO.code}"]`);
    expect(await carte.textContent()).toContain(NON_DEMO.titre);
    expect(await carte.getByRole("link", { name: /Voir les offres/, includeHidden: true }).getAttribute("href")).toBe(
      "/tarifs",
    );
    await c.close();
  });

  it("à 390 px, rien ne déborde", async () => {
    const c = await contexte(true);
    const page = await c.newPage();
    await aller(page, "/entreprises/episode");
    await page.locator("#secteur-hotellerie > details > summary").click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);
    await c.close();
  });
});

describe("les épisodes sans licence", () => {
  it("l'adresse d'un épisode non démo : le message et le lien vers les tarifs, rien à jouer", async () => {
    const c = await contexte();
    const page = await c.newPage();
    await aller(page, `/entreprises/episode/${NON_DEMO.code}?niveau=expert`);
    const ferme = page.locator(`[data-episode-ferme="${NON_DEMO.code}"]`);
    await ferme.waitFor({ state: "visible" });
    const vu = await texte(page);
    expect(vu).toContain(NON_DEMO.titre);
    expect(vu).toContain("Épisodes manager · sur devis");
    expect(vu).toContain("Cet épisode est inclus dans l'offre Épisodes manager");
    expect(
      await ferme.getByRole("link", { name: "Demander un devis" }).getAttribute("href"),
    ).toBe("/devis?offre=episodes");
    expect(await page.getByRole("button", { name: "Commencer l'épisode" }).count()).toBe(0);
    // Les démos sont proposées à la place.
    for (const code of EPISODES_DE_DEMO) {
      expect(await page.locator(`a[href="/entreprises/episode/${code}"]`).count(), code).toBe(1);
    }
    await c.close();
  });

  for (const code of EPISODES_DE_DEMO) {
    it(`la démo ${code} se lance en Découverte, même demandée en Expert, et se joue jusqu'au bilan`, async () => {
      const ep = episodeParCode(code)!;
      const c = await contexte();
      const page = await c.newPage();
      const erreurs: string[] = [];
      page.on("pageerror", (e) => erreurs.push(e.message));
      await page.goto(`${BASE}/entreprises/episode/${code}?hasard=7&niveau=expert`);
      await page.getByRole("button", { name: "Commencer l'épisode" }).waitFor({ state: "visible" });
      // Un seul niveau à choisir ; les deux autres visibles, marqués.
      expect(await page.locator("input[name=niveau]").count()).toBe(1);
      expect(await page.locator("input[name=niveau]").getAttribute("value")).toBe("decouverte");
      const fermes = await page.locator("[data-niveaux-fermes] li").allInnerTexts();
      // Le lien porte le tirage (`?hasard=`) : c'est le lien qu'un enseignant donne à sa
      // classe. Devant un élève, les niveaux fermés ne portent aucune marque de vente.
      expect(fermes.map((t) => t.split("\n")[0])).toEqual(["Standard", "Expert"]);
      expect(await texte(page)).toContain("Les autres niveaux ne sont pas ouverts sur cet appareil.");
      await page.getByRole("button", { name: "Commencer l'épisode" }).click();
      await page.getByText("Niveau Découverte", { exact: true }).waitFor({ state: "visible" });
      await jouerJusquAuBilan(page, ep.prevision.placeholder);
      // La suite : sans licence, ce que l'offre apporte, et des démos seulement.
      await expect
        .poll(() => page.getByText("le prochain épisode se cherche").count(), { timeout: 30_000 })
        .toBe(0);
      await page.locator("[data-offre-entreprise]").waitFor({ state: "visible" });
      const proposes = await page
        .locator("#ensuite-titre ~ ul a")
        .evaluateAll((xs) => xs.map((a) => new URL((a as HTMLAnchorElement).href).pathname));
      for (const p of proposes) expect(estUneDemo(p.split("/").pop()!), p).toBe(true);
      expect(erreurs).toEqual([]);
      await c.close();
    }, 120_000);
  }
});
