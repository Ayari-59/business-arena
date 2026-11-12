import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { chapitreParCode } from "../../src/config/cours/registre";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { episodeParCode } from "../../src/pedagogy/episodes/registre";
import { espacesOrdinaires } from "../../src/lib/typographie";

/**
 * L'ACCESSIBILITÉ, MESURÉE PAR AXE-CORE DANS UN VRAI NAVIGATEUR (audit UX du 11 novembre 2026, P2-11 ;
 * décision du propriétaire du même jour). Les quatre défauts nets de l'audit, chacun sur l'écran où il
 * a été vu :
 *  · la liste « Courrier au hasard » du pilotage, sans étiquette (défaut critique) ;
 *  · à 390 px, les zones qui défilent de côté sans nom ni clavier : le tableau des équipes du pilotage,
 *    la ligne du tableau de bord d'un épisode, la progression du profil ;
 *  · les cibles de moins de 24 px des pages de diplôme (critère 2.5.8 de WCAG 2.2) : 202 sur celle du
 *    bac STMG, 149 sur celle du BTS CG ;
 *  · les curseurs qui disaient « 1990 » sans « € » (`aria-valuetext`) : celui d'un chapitre ici, celui du
 *    prix de l'arène dans tests/e2e/mobile.e2e.ts.
 * axe-core est celui que l'audit a employé (4.13, dépendance de développement d'eslint-plugin-jsx-a11y).
 * Le pied de page et la barre du site ne sont pas mesurés ici : ils ont leur propre chantier.
 */

const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

/** Avec E2E_CAPTURES, l'écran est photographié (à 390 px dans ce fichier). */
async function capturer(page: Page, nom: string) {
  if (!process.env.E2E_CAPTURES) return;
  mkdirSync(process.env.E2E_CAPTURES, { recursive: true });
  await page.screenshot({ path: join(process.env.E2E_CAPTURES, `${nom}-390.png`) });
}

const contexte = (largeur: number) =>
  navigateur.newContext({ viewport: { width: largeur, height: largeur < 600 ? 844 : 900 }, locale: "fr-FR", bypassCSP: true });

/** Les violations des règles nommées, dans `cadre` (le contenu de la page, par défaut). */
async function violations(page: Page, regles: string[], cadre = "main"): Promise<{ id: string; cibles: string[] }[]> {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(
    async ([c, r]) => {
      const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe;
      const resultat = await axe.run({ include: [c] }, { runOnly: { type: "rule", values: r } });
      return resultat.violations.map((v) => ({ id: v.id, cibles: v.nodes.map((n) => n.target.join(" ")).slice(0, 8) }));
    },
    [cadre, regles] as const,
  );
}

/** Une zone défile-t-elle aux flèches du clavier, une fois atteinte par la tabulation ? */
async function defileAuClavier(page: Page, selecteur: string): Promise<boolean> {
  const zone = page.locator(selecteur).first();
  await zone.focus();
  const avant = await zone.evaluate((z) => z.scrollLeft);
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  return (await zone.evaluate((z) => z.scrollLeft)) > avant;
}

describe("P2-11 · les défauts nets de l'audit, mesurés", () => {
  it("les pages de diplôme : aucune cible sous 24 px, à 390 et à 1 280 px", async () => {
    for (const largeur of [390, 1280]) {
      const ctx = await contexte(largeur);
      const page = await ctx.newPage();
      for (const diplome of ["stmg", "bts-cg"]) {
        await aller(page, `/cours?diplome=${diplome}`);
        expect(await violations(page, ["target-size"]), `${diplome} à ${largeur} px`).toEqual([]);
        if (largeur === 390 && diplome === "stmg") {
          // Les liens des cas pratiques et le résumé « Objectifs », à 24 px de haut.
          await page.locator("[data-objectifs]").first().scrollIntoViewIfNeeded();
          await page.evaluate(() => window.scrollBy(0, -160));
          await capturer(page, "page-du-diplome-cibles-de-24-px");
        }
      }
      await ctx.close();
    }
  }, 180_000);

  it("le pilotage d'une partie : la liste du courrier a son étiquette, le tableau des équipes défile au clavier", async () => {
    const ctx = await contexte(390);
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await aller(page, "/teacher");
    if ((await page.locator("#nouvelle-partie[open]").count()) === 0) await page.locator("#nouvelle-partie > summary").click();
    await page.selectOption('select[name="humanTeamsCount"]', "3");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    await page.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    expect(await violations(page, ["select-name", "scrollable-region-focusable", "aria-allowed-attr", "aria-prohibited-attr"])).toEqual([]);
    expect(await page.locator('select[name="eventCode"]').first().getAttribute("aria-label")).toBeTruthy();
    // Le tableau des équipes et le relevé de notes : des régions nommées, dans la tabulation.
    for (const nom of [/Les équipes et l'état de leurs décisions/, /Le relevé de notes/]) {
      const zone = page.getByRole("region", { name: nom });
      expect(await zone.count(), String(nom)).toBe(1);
      expect(await zone.getAttribute("tabindex")).toBe("0");
    }
    // Celles qui débordent à 390 px défilent aux flèches : le relevé (8 colonnes) au moins.
    const zones = page.locator("main [data-zone-qui-defile]");
    let debordantes = 0;
    for (let i = 0; i < (await zones.count()); i++) {
      const zone = zones.nth(i);
      if (!(await zone.evaluate((z) => z.scrollWidth > z.clientWidth))) continue;
      debordantes += 1;
      await zone.scrollIntoViewIfNeeded();
      await zone.focus();
      const avant = await zone.evaluate((z) => z.scrollLeft);
      for (let k = 0; k < 6; k++) await page.keyboard.press("ArrowRight");
      await expect.poll(() => zone.evaluate((z) => z.scrollLeft)).toBeGreaterThan(avant);
      await capturer(page, "pilotage-tableau-qui-defile-au-clavier");
    }
    expect(debordantes).toBeGreaterThan(0);
    await ctx.close();
  }, 180_000);

  it("l'introduction d'un épisode : la ligne du tableau de bord se nomme et défile au clavier", async () => {
    const ctx = await contexte(390);
    const page = await ctx.newPage();
    await aller(page, "/entreprises/episode/client-qui-s-en-va");
    expect(
      await violations(page, ["scrollable-region-focusable", "nested-interactive", "aria-allowed-attr", "aria-prohibited-attr", "summary-name"]),
    ).toEqual([]);
    const ligne = page.locator("[data-indicateurs-qui-defilent]");
    expect(await ligne.getAttribute("tabindex")).toBe("0");
    expect(await ligne.getAttribute("aria-label")).toBeTruthy();
    // La ligne garde, dans son nom, les valeurs qu'elle montre.
    const nom = (await page.locator("[data-ligne-du-tableau] > summary").getAttribute("aria-label")) ?? "";
    expect(nom).toContain(episodeParCode("client-qui-s-en-va")!.nomDuTableau);
    if (await ligne.evaluate((z) => z.scrollWidth > z.clientWidth)) expect(await defileAuClavier(page, "[data-indicateurs-qui-defilent]")).toBe(true);
    await capturer(page, "introduction-ligne-du-tableau-au-clavier");
    await ctx.close();
  }, 120_000);

  it("le profil décisionnel : la progression défile au clavier", async () => {
    const ctx = await contexte(390);
    await enseignantSousLicence(ctx, { episodes: true });
    const page = await ctx.newPage();
    await jouerUnEpisode(page, "trimestre-qui-derape");
    await aller(page, "/entreprises/episode/profil");
    const zone = page.getByRole("region", { name: /Vos épisodes, dans l'ordre où vous les avez joués/ });
    await expect.poll(() => zone.count(), { timeout: 30_000 }).toBe(1);
    expect(await violations(page, ["scrollable-region-focusable"], "section[aria-labelledby='progression-titre']")).toEqual([]);
    if (await zone.evaluate((z) => z.scrollWidth > z.clientWidth)) expect(await defileAuClavier(page, "section[aria-labelledby='progression-titre'] [data-zone-qui-defile]")).toBe(true);
    await capturer(page, "profil-progression-au-clavier");
    await ctx.close();
  }, 240_000);

  it("le curseur d'un chapitre dit sa valeur avec son unité, comme son étiquette", async () => {
    const ctx = await contexte(390);
    const enonce = chapitreParCode("seuil-de-rentabilite")!;
    const entreprise = enonce.entreprises?.codes[0] ?? "nova";
    const ordonne = chapitreDuCas(enonce, casDeLEntreprise(entreprise));
    const index = ordonne.etapes.findIndex((e) => e.type === "curseur");
    expect(index).toBeGreaterThanOrEqual(0);
    await ctx.addInitScript(([cle, i]) => {
      if (!window.localStorage.getItem(cle as string)) window.localStorage.setItem(cle as string, JSON.stringify({ index: i, etapes: {} }));
    }, [`cours:${enonce.code}:${entreprise}`, index] as const);
    const page = await ctx.newPage();
    await aller(page, `/cours/${enonce.code}?entreprise=${entreprise}`);
    await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(ordonne.etapes[index]!.titre);
    const curseur = page.locator('[data-simulation] input[type="range"]').first();
    // Ce que l'étiquette montre après « : » (« 1 990 unités »), le curseur le dit (« 1990 » sans unité avant).
    const dit = async () => espacesOrdinaires((await curseur.getAttribute("aria-valuetext")) ?? "");
    const montre = async () => espacesOrdinaires(await curseur.locator("xpath=ancestor::label").locator("span").first().innerText()).split(" : ").pop()!.trim();
    const avant = await dit();
    expect(avant).toMatch(/\d \D+$/);
    expect(avant).toBe(await montre());
    // Déplacé au clavier, il dit sa nouvelle valeur, toujours avec son unité.
    await curseur.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(dit).not.toBe(avant);
    expect(await dit()).toBe(await montre());
    await ctx.close();
  }, 120_000);
});

/** Un épisode joué jusqu'au bilan, en prenant chaque fois le premier choix proposé. */
async function jouerUnEpisode(page: Page, code: string) {
  const ep = episodeParCode(code)!;
  await aller(page, `/entreprises/episode/${code}?hasard=7`);
  await page.getByRole("button", { name: "Commencer l'épisode" }).click();
  for (let pas = 0; pas < 120; pas += 1) {
    if ((await page.getByText("Votre axe de travail").count()) > 0) break;
    for (const nom of await page.$$eval("input[type=radio]", (xs) => [...new Set(xs.map((x) => (x as HTMLInputElement).name))])) {
      if (!(await page.$(`input[name="${nom}"]:checked`))) await page.locator(`input[name="${nom}"]`).first().check();
    }
    const prevision = page.getByRole("spinbutton");
    // Le texte d'exemple s'écrit avec le vrai signe moins, que le champ refuse.
    if ((await prevision.count()) > 0 && !(await prevision.inputValue())) await prevision.fill(ep.prevision.placeholder.replace(",", ".").replace("−", "-").replace(/\s/g, ""));
    await page.locator("main button.bg-amber-400:not([disabled])").first().click();
  }
  // Le bilan garde la partie au serveur : le profil ne la compte qu'une fois gardée.
  await expect.poll(() => page.getByText("le prochain épisode se cherche").count(), { timeout: 30_000 }).toBe(0);
  expect(await page.getByText("n'a pas pu être gardée").count()).toBe(0);
}
