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
import { NAVIGATION } from "../../src/config/navigation";

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
 * Le pied de page n'est pas mesuré ici : il a son propre chantier. La barre du site et ses panneaux le
 * sont, depuis la maquette A (12 novembre 2026), en bas de ce fichier.
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

/**
 * LA BARRE DU SITE ET SES PANNEAUX (le propriétaire, 12 novembre 2026, la maquette A). Le motif
 * « disclosure navigation » : chaque mot est un bouton qui dit ce qu'il ouvre (`aria-controls`) et
 * s'il l'a ouvert (`aria-expanded`), le panneau ne porte que des liens, et aucun rôle de menu
 * d'application. Mesurés par axe-core, panneau par panneau à 1 280 px et groupe par groupe à 390 px ;
 * puis le focus visible, l'ordre de tabulation et la demande de moins de mouvement.
 */
describe("la barre du site, ses panneaux et le menu du téléphone", () => {
  const REGLES = [
    "aria-allowed-attr",
    "aria-prohibited-attr",
    "aria-valid-attr-value",
    "aria-hidden-focus",
    "button-name",
    "link-name",
    "list",
    "listitem",
    "nested-interactive",
    "duplicate-id-aria",
    "color-contrast",
    "target-size",
  ];
  const fondus = (page: Page, selecteur: string) =>
    page.locator(selecteur).evaluate((e) => Promise.all(e.getAnimations({ subtree: true }).map((a) => a.finished)));

  it("à 1 280 px : chaque panneau ouvert passe axe-core, son mot dit qu'il l'a ouvert, et aucun rôle de menu", async () => {
    const ctx = await contexte(1280);
    const page = await ctx.newPage();
    await aller(page, "/notions");
    expect(await violations(page, REGLES, "header"), "la barre fermée").toEqual([]);
    for (const g of NAVIGATION) {
      await page.locator(`[data-mot-de-la-barre="${g.code}"]`).click();
      await page.locator(`[data-panneau-du-groupe="${g.code}"]`).waitFor({ state: "visible" });
      await fondus(page, `[data-panneau-du-groupe="${g.code}"]`);
      expect(await violations(page, REGLES, "header"), `le panneau « ${g.titre} »`).toEqual([]);
      const deplies = await page.locator("[data-mot-de-la-barre]").evaluateAll((els) =>
        els.map((e) => [e.getAttribute("data-mot-de-la-barre"), e.getAttribute("aria-expanded"), e.getAttribute("aria-controls")]),
      );
      expect(deplies).toEqual(NAVIGATION.map((x) => [x.code, String(x.code === g.code), `panneau-${x.code}`]));
    }
    expect(await page.locator("header [role^='menu']").count(), "un rôle de menu d'application dans la barre").toBe(0);
    await ctx.close();
  }, 180_000);

  it("à 390 px : la liste des groupes et chaque groupe ouvert passent axe-core", async () => {
    const ctx = await contexte(390);
    const page = await ctx.newPage();
    await aller(page, "/notions");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.locator("#plan-du-site [data-liste-des-groupes]").waitFor({ state: "visible" });
    await fondus(page, "#plan-du-site");
    expect(await violations(page, REGLES, "header"), "la liste des groupes").toEqual([]);
    await capturer(page, "menu-liste");
    for (const g of NAVIGATION) {
      await page.locator(`#plan-du-site [data-groupe-du-menu="${g.code}"]`).click();
      await page.locator(`#plan-du-site [data-groupe-du-plan="${g.code}"]`).waitFor({ state: "visible" });
      await fondus(page, "#plan-du-site");
      expect(await violations(page, REGLES, "header"), `le groupe « ${g.titre} »`).toEqual([]);
      await page.locator(`#plan-du-site [data-groupe-du-plan="${g.code}"]`).getByRole("button", { name: /^Retour/ }).click();
    }
    await ctx.close();
  }, 180_000);

  it("au clavier : le focus se voit sur le mot et dans son panneau, et la tabulation suit l'ordre de lecture", async () => {
    const ctx = await contexte(1280);
    const page = await ctx.newPage();
    await aller(page, "/notions");
    // Le lien d'évitement, le logo, puis les mots dans l'ordre de la barre.
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("href"))).toBe("#main");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe("Accueil");
    const anneau = () =>
      page.evaluate(() => {
        const s = getComputedStyle(document.activeElement!);
        return { style: s.outlineStyle, largeur: parseFloat(s.outlineWidth) };
      });
    for (const g of NAVIGATION) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement?.getAttribute("data-mot-de-la-barre")), "l'ordre des mots").toBe(g.code);
      const a = await anneau();
      expect(a.style, `« ${g.titre} » : pas d'anneau de focus`).not.toBe("none");
      expect(a.largeur, g.titre).toBeGreaterThanOrEqual(2);
    }
    // Ouvert au clavier, le panneau suit son mot : la tabulation y entre, l'anneau s'y voit.
    await page.locator('[data-mot-de-la-barre="aide"]').focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-panneau-du-groupe="aide"]').waitFor({ state: "visible" });
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.hasAttribute("data-appel-du-groupe"))).toBe(true);
    expect((await anneau()).style, "le bouton du panneau : pas d'anneau de focus").not.toBe("none");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.hasAttribute("data-entree-du-panneau"))).toBe(true);
    expect((await anneau()).style, "une carte : pas d'anneau de focus").not.toBe("none");
    await ctx.close();
  }, 120_000);

  it("moins de mouvement : le panneau et le menu s'ouvrent sans animation", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR", reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await aller(page, "/notions");
    await page.locator('[data-mot-de-la-barre="cours"]').click();
    const panneau = page.locator('[data-panneau-du-groupe="cours"]');
    await panneau.waitFor({ state: "visible" });
    expect(await panneau.evaluate((e) => e.getAnimations({ subtree: true }).length), "le panneau s'anime malgré la demande").toBe(0);
    expect(
      await page.locator('[data-mot-de-la-barre="cours"] span').evaluate((e) => getComputedStyle(e).transitionProperty),
      "le trait du mot glisse malgré la demande",
    ).toBe("none");
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Menu" }).click();
    await page.locator("#plan-du-site [data-liste-des-groupes]").waitFor({ state: "visible" });
    expect(await page.locator("#plan-du-site").evaluate((e) => e.getAnimations({ subtree: true }).length), "le menu s'anime malgré la demande").toBe(0);
    await page.locator('#plan-du-site [data-groupe-du-menu="aide"]').click();
    expect(await page.locator("#plan-du-site").evaluate((e) => e.getAnimations({ subtree: true }).length), "le groupe s'anime malgré la demande").toBe(0);
    await ctx.close();
  }, 60_000);
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
