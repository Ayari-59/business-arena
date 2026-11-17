import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { CHIFFRES_DU_COURS, chapitresDeLaTuile, contenusDuTheme } from "../../src/config/chiffres-du-cours";
import { NOMBRE_D_ATELIERS } from "../../src/config/ateliers";
import { NOMBRE_D_EPISODES } from "../../src/config/familles-des-episodes";
import { DECOUVERTE_PAR_DEFAUT } from "../../src/config/decouverte";
import { diplomesParNiveau } from "../../src/config/cours/programme";
import { THEMES } from "../../src/config/cours/themes";

/**
 * LES COMPTEURS DES CONTENUS, SUR LE HTML RENDU (chantier des compteurs, novembre 2026).
 *
 * Le build servi affiche les nombres que la source calcule (config/chiffres-du-cours.ts,
 * config/chiffres-du-site.ts), les mêmes sur l'accueil et sur /cours ; la tuile du BTS NDRC dit les
 * 15 chapitres de son parcours, l'option BTS MHR B et C n'a plus de tuile à elle ; /enseignants dit
 * 12 formations aux deux endroits ; l'atelier STMG ne nomme plus la seconde sur /animations ; la phrase
 * des démonstrations de /entreprises/offre suit le réglage de la Découverte (une base neuve : le
 * réglage par défaut). Avec `E2E_CAPTURES`, chaque écran changé se capture à 390 px.
 */

let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const nombres = (t: string, mot: string) => [...t.matchAll(new RegExp(`(\\d+) ${mot}`, "g"))].map((m) => Number(m[1]));

async function capture(nom: string, selecteur?: string) {
  if (!process.env.E2E_CAPTURES) return;
  mkdirSync(process.env.E2E_CAPTURES, { recursive: true });
  const chemin = join(process.env.E2E_CAPTURES, `${nom}-390.png`);
  if (selecteur) await page.locator(selecteur).first().screenshot({ path: chemin });
  else await page.screenshot({ path: chemin, fullPage: true });
}

describe("l'accueil et /cours affichent les mêmes totaux, ceux de la source", () => {
  it("chapitres, cas pratiques, ateliers et épisodes", async () => {
    for (const chemin of ["/", "/cours"]) {
      await aller(page, chemin);
      const t = await texte(page);
      const vus = {
        chapitres: nombres(t, "chapitres"),
        cas: nombres(t, "cas pratiques"),
        ateliers: nombres(t, "ateliers"),
        episodes: nombres(t, "épisodes"),
      };
      expect(vus.chapitres, chemin).toContain(CHIFFRES_DU_COURS.chapitres);
      expect(vus.cas, chemin).toContain(CHIFFRES_DU_COURS.casPratiques);
      expect(vus.ateliers, chemin).toContain(NOMBRE_D_ATELIERS);
      expect(vus.episodes, chemin).toContain(NOMBRE_D_EPISODES);
      // Aucun total plus grand que celui de la source : le registre entier ne s'affiche nulle part.
      expect(Math.max(...vus.chapitres), chemin).toBe(CHIFFRES_DU_COURS.chapitres);
      expect(Math.max(...vus.cas), chemin).toBe(CHIFFRES_DU_COURS.casPratiques);
    }
    const t = await texte(page);
    expect(t).toContain(`${CHIFFRES_DU_COURS.chapitres} chapitres en ${THEMES.length} thèmes`);
  });

  it("chaque thème du catalogue dit les nombres que la source lui compte", async () => {
    await aller(page, "/cours");
    for (const theme of THEMES) {
      const n = contenusDuTheme(theme);
      const resume = (await page.locator(`[data-theme="${theme.code}"] summary`).innerText()).replace(/[  ]/g, " ");
      if (n.nombreDeChapitres > 0) expect(resume, theme.code).toContain(`${n.nombreDeChapitres} chapitre`);
      if (n.nombreDeCas > 0) expect(resume, theme.code).toContain(`${n.nombreDeCas} cas pratique`);
    }
  });
});

describe("les tuiles des diplômes sur /cours", () => {
  it("chaque tuile dit les chapitres de son parcours : 15 pour le BTS NDRC, et l'option MHR B et C est fondue", async () => {
    await aller(page, "/cours");
    expect(await page.locator('[data-diplome-tuile="bts-mhr-bc"]').count()).toBe(0);
    expect(await page.locator("[data-diplome-tuile]").filter({ hasText: "Pas encore de chapitre" }).count()).toBe(0);
    const tuiles = diplomesParNiveau().flatMap((g) => g.formations).filter((f) => !f.optionDe);
    expect(await page.locator("[data-diplome-tuile]").count()).toBe(tuiles.length);
    for (const f of tuiles) {
      const n = chapitresDeLaTuile(f.code);
      expect((await page.locator(`[data-diplome-tuile="${f.code}"]`).innerText()).replace(/[  ]/g, " "), f.code).toContain(`${n} chapitre`);
    }
    expect(await page.locator('[data-diplome-tuile="bts-ndrc"]').innerText()).toContain("15 chapitres");
    await page.locator("#formation").scrollIntoViewIfNeeded();
    await capture("cours-tuiles", "[data-entree-par-diplome]");
  });
});

describe("/enseignants", () => {
  it("dit 12 formations aux deux endroits, l'option BTS MHR B et C comptée avec son diplôme", async () => {
    await aller(page, "/enseignants");
    const t = await texte(page);
    expect(t).not.toMatch(/13\s+formations/);
    expect(t).toMatch(/12\s+formations servies/i);
    expect(t).toContain("12 formations");
    await capture("enseignants");
  });
});

describe("/animations", () => {
  it("l'atelier STMG ne nomme plus la seconde", async () => {
    await aller(page, "/animations");
    const t = await texte(page);
    expect(t).not.toMatch(/seconde option/i);
    expect(t).toMatch(/première et terminale/i);
    await capture("animations");
  });
});

describe("/entreprises/offre", () => {
  it("la phrase des démonstrations suit le réglage de la Découverte", async () => {
    await aller(page, "/entreprises/offre");
    const t = await texte(page);
    expect(await page.locator("[data-demos]").getAttribute("data-demos")).toBe(String(DECOUVERTE_PAR_DEFAUT.demos.length));
    expect(t).toContain(`${DECOUVERTE_PAR_DEFAUT.demos.length} épisodes de démonstration se jouent gratuitement`);
    expect(t).toContain(`${NOMBRE_D_EPISODES} épisodes manager`);
    await capture("entreprises-offre");
  });
});
