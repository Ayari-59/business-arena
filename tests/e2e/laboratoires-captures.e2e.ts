import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { CHAPITRES } from "../../src/config/cours/registre";

/**
 * LES LABORATOIRES DU COURS, À L'ÉCRAN : CE QUE LES GARDES NE VOIENT PAS.
 *
 * La garde générique (`tests/cours/laboratoires.test.ts`) vérifie les chiffres d'un laboratoire ;
 * le parcours du cours (`cours.e2e.ts`) joue sa solution. Ni l'un ni l'autre ne regarde la page.
 * Ici, quatre laboratoires s'ouvrent tels qu'un élève les trouve, à 1 280 px et à 390 px de large,
 * en clair et sous une préférence sombre du système (le site n'a qu'un habillage : la page doit
 * rester la même, et lisible) : un laboratoire à graphique, un laboratoire à levier à choix, un
 * laboratoire à quatre leviers, et celui des ventes. Chaque fois, le graphique est là s'il est
 * déclaré, et rien ne déborde en largeur. Avec CAPTURES_LABORATOIRES (un dossier), le test laisse
 * les captures, en double densité.
 */

const CAPTURES = process.env.CAPTURES_LABORATOIRES;

const LABORATOIRES = [
  { chapitre: "seuil-de-rentabilite", etape: "le-laboratoire-de-la-securite", nom: "graphique" },
  { chapitre: "le-budget-flexible", etape: "laboratoire-du-centre", nom: "levier-a-choix" },
  { chapitre: "les-ecarts-et-leurs-responsables", etape: "le-laboratoire", nom: "quatre-leviers" },
  { chapitre: "analyse-des-ecarts", etape: "le-laboratoire-des-ventes", nom: "ventes" },
] as const;

const LARGEURS = [1280, 390] as const;
const THEMES = ["light", "dark"] as const;

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

describe.each(LABORATOIRES)("le laboratoire $etape ($chapitre)", ({ chapitre: code, etape: id, nom }) => {
  const chapitre = CHAPITRES.find((c) => c.code === code)!;
  const index = chapitre.etapes.findIndex((e) => e.id === id);
  const etape = chapitre.etapes[index]!;

  it.each(LARGEURS.flatMap((largeur) => THEMES.map((theme) => ({ largeur, theme }))))("à $largeur px, préférence $theme : le graphique s'il est déclaré, rien ne déborde", async ({ largeur, theme }) => {
    expect(etape.type).toBe("simulation");
    const ctx = await navigateur.newContext({
      viewport: { width: largeur, height: largeur < 600 ? 844 : 900 },
      deviceScaleFactor: 2,
      colorScheme: theme,
      hasTouch: largeur < 600,
      locale: "fr-FR",
    });
    await enseignantSousLicence(ctx);
    // L'élève arrive à l'étape du laboratoire : la progression du chapitre vit dans le navigateur.
    await ctx.addInitScript(([cle, i]) => window.localStorage.setItem(cle as string, JSON.stringify({ index: i, etapes: {} })), [`cours:${code}:nova`, index] as const);
    const page = await ctx.newPage();
    await aller(page, `/cours/${code}?entreprise=nova`);
    await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(etape.titre);
    await page.locator("[data-laboratoire]").waitFor();
    const declare = etape.type === "simulation" && etape.graphique !== undefined;
    expect(await page.locator("[data-graphique-du-laboratoire]").count(), "graphique").toBe(declare ? 1 : 0);
    if (declare) expect(await page.locator("[data-graphique-du-laboratoire] polyline").count()).toBeGreaterThan(0);
    // Rien ne déborde : ni la page, ni le laboratoire, ni un tableau dans son cadre.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "page").toBeLessThanOrEqual(0);
    const debords = await page.evaluate(() =>
      [...document.querySelectorAll("[data-laboratoire], [data-laboratoire] *")]
        .filter((x) => {
          const r = x.getBoundingClientRect();
          return r.width > 0 && (r.right > window.innerWidth + 0.5 || r.left < -0.5);
        })
        .map((x) => `${x.tagName.toLowerCase()} ${(x.textContent ?? "").trim().slice(0, 40)}`),
    );
    expect(debords, "éléments hors de l'écran").toEqual([]);
    const tableaux = await page.evaluate(() => [...document.querySelectorAll("[data-laboratoire] table")].map((t) => t.scrollWidth - (t.parentElement?.clientWidth ?? t.scrollWidth)).filter((e) => e > 1));
    expect(tableaux, "tableaux qui défilent").toEqual([]);
    if (CAPTURES) await page.screenshot({ path: `${CAPTURES}/${nom}-${largeur}-${theme === "light" ? "clair" : "sombre"}.png`, fullPage: true });
    await ctx.close();
  });
});
