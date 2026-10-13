import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { mesurerContraste } from "./helpers/contraste";
import { GUIDES, cheminDuGuide } from "../../src/config/guides";

/**
 * LES GUIDES DE PRISE EN MAIN, DANS UN VRAI NAVIGATEUR, sur le build de production.
 *
 *   · /guides et les quatre guides se chargent, à 1280 et à 390 : chaque capture arrive
 *     (la réduite sur téléphone), aucun défilement de côté, au plus un bouton plein ;
 *   · chaque texte passe le seuil de contraste ;
 *   · imprimés (`emulateMedia print`), ils n'ont plus ni barre du site, ni pied de page,
 *     ni navigation, et chaque capture reste entière ;
 *   · les portes d'entrée mènent au bon guide : le pied de page, l'espace enseignant,
 *     l'arène, /integration, /join et la connexion des enseignants.
 */

const PAGES = ["/guides", ...GUIDES.map((g) => cheminDuGuide(g.public))];

let navigateur: Browser;
let ordi: BrowserContext;
let tel: BrowserContext;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  ordi = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  tel = await navigateur.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" });
  for (const c of [ordi, tel]) {
    await c.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
  }
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Les aplats orange visibles dans le contenu : un seul bouton plein par écran, au plus. */
const pleinsVisibles = (p: Page) =>
  p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("main .bouton-plein")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && e.checkVisibility({ visibilityProperty: true });
      })
      .map((e) => e.textContent?.trim() ?? ""),
  );

/** Toutes les images chargées (le chargement différé déclenché), et leur source retenue. */
async function images(p: Page): Promise<{ src: string; largeur: number; srcset: string }[]> {
  return p.evaluate(async () => {
    const imgs = [...document.querySelectorAll<HTMLImageElement>("main img[data-capture]")];
    for (const i of imgs) i.loading = "eager";
    await Promise.all(imgs.map((i) => (i.complete ? null : i.decode().catch(() => null))));
    return imgs.map((i) => ({ src: i.currentSrc, largeur: i.naturalWidth, srcset: i.srcset }));
  });
}

describe("les guides de prise en main, à l'écran", () => {
  for (const chemin of PAGES) {
    it(`${chemin} se charge à 1280 et à 390, ses captures arrivent, un seul bouton plein`, async () => {
      for (const [ctx, largeur] of [
        [ordi, 1280],
        [tel, 390],
      ] as const) {
        const p = await ctx.newPage();
        await aller(p, chemin);
        expect(await p.getByRole("heading", { level: 1 }).count(), `${chemin} à ${largeur}`).toBe(1);
        expect(await debordement(p), `${chemin} déborde à ${largeur}`).toBeLessThanOrEqual(0);
        expect((await pleinsVisibles(p)).length, `${chemin} à ${largeur}`).toBeLessThanOrEqual(1);
        if (chemin !== "/guides") {
          const vues = await images(p);
          expect(vues.length, `${chemin} : aucune capture`).toBeGreaterThan(4);
          for (const v of vues) expect(v.largeur, `${v.src} ne s'affiche pas`).toBeGreaterThan(0);
          // Deux tailles proposées ; l'ordinateur prend la pleine.
          for (const v of vues) expect(v.srcset).toMatch(/-768\.webp 768w, .+\.webp 1280w$/);
          if (largeur === 1280) expect(vues.every((v) => !v.src.endsWith("-768.webp"))).toBe(true);
        } else {
          expect(await p.locator("[data-carte-du-guide]").count()).toBe(GUIDES.length);
        }
        await p.close();
      }
    }, 120_000);
  }

  it("un téléphone à écran simple densité reçoit la version réduite", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
    const p = await ctx.newPage();
    await aller(p, cheminDuGuide("etudiant"));
    const vues = await images(p);
    expect(vues.length).toBeGreaterThan(4);
    expect(vues.every((v) => v.src.endsWith("-768.webp")), JSON.stringify(vues.slice(0, 2))).toBe(true);
    await ctx.close();
  }, 60_000);

  it("chaque texte passe le seuil de contraste", async () => {
    const p = await ordi.newPage();
    const fautes: string[] = [];
    for (const chemin of PAGES) {
      await aller(p, chemin);
      for (const m of await mesurerContraste(p, "clair")) {
        if (m.ratio < m.seuil) fautes.push(`${chemin} : « ${m.texte.slice(0, 50)} » ${m.ratio.toFixed(2)} < ${m.seuil}`);
      }
    }
    await p.close();
    expect(fautes, fautes.join("\n")).toEqual([]);
  }, 180_000);
});

describe("les guides de prise en main, imprimés", () => {
  it("ni barre du site, ni pied de page, ni navigation ; les captures entières ; l'en-tête de page posé", async () => {
    const p = await ordi.newPage();
    for (const g of GUIDES) {
      await aller(p, cheminDuGuide(g.public));
      await p.emulateMedia({ media: "print" });
      const vu = await p.evaluate(() => {
        const affiche = (s: string) =>
          [...document.querySelectorAll<HTMLElement>(s)].some((e) => e.checkVisibility({ visibilityProperty: true }));
        return {
          barre: affiche("[data-en-tete-du-site]"),
          pied: affiche("body > footer, footer"),
          navigation: affiche("main nav"),
          bouton: affiche("[data-bouton-pdf]"),
          etapes: document.querySelectorAll("[data-etape-du-guide]").length,
          figures: [...document.querySelectorAll(".capture-du-guide")].every(
            (f) => getComputedStyle(f).breakInside === "avoid",
          ),
          entete: [...document.querySelectorAll("style")].some((s) => /@top-left\{content:"Business Arena · /.test(s.textContent ?? "")),
        };
      });
      expect(vu, g.public).toEqual({
        barre: false,
        pied: false,
        navigation: false,
        bouton: false,
        etapes: g.etapes.length,
        figures: true,
        entete: true,
      });
      await p.emulateMedia({ media: "screen" });
    }
    await p.close();
  }, 120_000);

  it("le bouton « Télécharger en PDF » ouvre l'impression du navigateur", async () => {
    const p = await ordi.newPage();
    await aller(p, cheminDuGuide("enseignant"));
    await p.evaluate(() => {
      (window as unknown as { imprime: number }).imprime = 0;
      window.print = () => {
        (window as unknown as { imprime: number }).imprime += 1;
      };
    });
    await p.getByRole("button", { name: "Télécharger en PDF" }).click();
    expect(await p.evaluate(() => (window as unknown as { imprime: number }).imprime)).toBe(1);
    await p.close();
  }, 60_000);
});

describe("les portes d'entrée mènent au bon guide", () => {
  async function suivre(p: Page, lien: ReturnType<Page["locator"]>, attendu: string): Promise<void> {
    expect(await lien.getAttribute("href")).toBe(attendu);
    await lien.click();
    await p.waitForURL(`${BASE}${attendu}`, { timeout: 30_000 });
    expect(await p.getByRole("heading", { level: 1 }).count()).toBe(1);
  }

  it("le pied de page d'une page publique, vers /guides", async () => {
    const p = await ordi.newPage();
    await aller(p, "/notions");
    await suivre(p, p.locator("footer [data-lien-des-guides]"), "/guides");
    await p.close();
  }, 60_000);

  it("/integration, vers le guide du référent ; /join et la connexion, vers les leurs", async () => {
    const p = await ordi.newPage();
    await aller(p, "/integration");
    await suivre(p, p.locator("[data-lien-guide-referent]"), "/guides/etablissement");
    await aller(p, "/join");
    await suivre(p, p.getByRole("link", { name: /Première fois/ }), "/guides/etudiant");
    await aller(p, "/teacher/login");
    await suivre(p, p.getByRole("link", { name: /Première fois/ }), "/guides/enseignant");
    await p.close();
  }, 90_000);

  it("l'espace enseignant, vers le guide de l'enseignant ; l'arène, vers celui de l'étudiant", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const prof = await ctx.newPage();
    await aller(prof, "/teacher");
    // La pastille « Aide » de l'espace enseignant mène au guide de l'enseignant.
    const pastille = prof.getByRole("navigation", { name: "Espace enseignant" }).getByRole("link", { name: "Aide", exact: true });
    if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) await prof.locator("#nouvelle-partie > summary").click();
    await prof.selectOption('select[name="humanTeamsCount"]', "1");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    const code = (await prof.locator("#code-invitation").innerText()).trim();
    await aller(prof, "/teacher");
    await suivre(prof, pastille, "/guides/enseignant");

    const eleve = await (await navigateur.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await aller(eleve, `/join?code=${code}`);
    await eleve.fill('input[name="pseudo"]', "Léa");
    await eleve.getByRole("button", { name: "Rejoindre la partie" }).click();
    await eleve.waitForURL(/\/arena\//, { timeout: 60_000 });
    await eleve.waitForLoadState("networkidle");
    const lien = eleve.locator("main [data-lien-guide-etudiant]:visible").first();
    await lien.waitFor({ timeout: 60_000 });
    await suivre(eleve, lien, "/guides/etudiant");
    await eleve.context().close();
    await ctx.close();
  }, 180_000);
});
