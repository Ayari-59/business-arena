import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";

/**
 * LE PODIUM DU TOUR D'ESSAI, SUR L'ÉCRAN DES ÉLÈVES ET SUR LE MUR.
 *
 * Le constat du propriétaire : « À la fin du tour d'essai il n'y a pas de podium. »
 * Deux parties de classe à deux équipes humaines et un concurrent, un tour d'essai
 * chacune :
 *  · A, la vraie partie lancée par l'animateur : l'essai clos, rien ne se voit avant
 *    la révélation ; révélé, l'élève (1280 et 390) et le mur voient le podium de
 *    l'essai ; la vraie partie commencée, l'élève le retrouve dans « Revoir le tour
 *    d'essai », et le mur le garde tant qu'aucun vrai tour n'est clos ;
 *  · B, la vraie partie lancée d'elle-même à la clôture de l'essai : rien avant la
 *    révélation, que l'animateur fait depuis le pilotage ; puis le même podium.
 *
 * Les captures vont dans `CAPTURES_PODIUM_ESSAI` quand la variable est posée.
 */

const CAPTURES = process.env.CAPTURES_PODIUM_ESSAI;

let navigateur: Browser;
const contextes: BrowserContext[] = [];

async function capture(p: Page, nom: string): Promise<void> {
  if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/${nom}.png`, fullPage: true });
}

/** Pas de défilement horizontal de la page : la règle de toutes les largeurs. */
async function sansDebord(p: Page): Promise<void> {
  const deborde = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(deborde, `${p.url()} déborde de ${deborde} px`).toBeLessThanOrEqual(1);
}

interface Seance {
  prof: Page;
  mur: Page;
  ordinateur: Page;
  telephone: Page;
  urlPartie: string;
  urlArene: string;
  urlAreneTel: string;
}

async function nouvellePage(options: Parameters<Browser["newContext"]>[0]): Promise<Page> {
  const ctx = await navigateur.newContext(options);
  contextes.push(ctx);
  return ctx.newPage();
}

async function rejoindre(p: Page, code: string, pseudo: string): Promise<string> {
  await aller(p, "/join");
  await p.fill('input[name="code"]', code);
  await p.fill('input[name="pseudo"]', pseudo);
  await p.getByRole("button", { name: "Valider", exact: true }).click();
  await p.waitForURL(/\/arena\//, { timeout: 60_000 });
  return p.url().split("?")[0]!.split("#")[0]!;
}

/** Une partie de classe à deux équipes et un concurrent, avec un tour d'essai. */
async function ouvrirLaSeance(auto: boolean): Promise<Seance> {
  const ctxProf = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
  contextes.push(ctxProf);
  await enseignantSousLicence(ctxProf);
  const prof = await ctxProf.newPage();
  const mur = await ctxProf.newPage();
  await aller(prof, "/teacher");
  if ((await prof.locator("#nouvelle-partie[open]").count()) === 0 && (await prof.locator("#nouvelle-partie").count()) > 0) {
    await prof.locator("#nouvelle-partie > summary").click();
  }
  await prof.selectOption('select[name="humanTeamsCount"]', "2");
  await prof.selectOption('select[name="botCount"]', "1");
  await prof.locator('input[name="toursDEssai"][value="1"]').check();
  if (auto) await prof.locator('input[name="enchainementDeLEssai"]').check();
  await prof.getByRole("button", { name: /Créer la partie/ }).click();
  await prof.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
  const urlPartie = new URL(prof.url()).pathname;
  const code = (await prof.locator("#code-invitation").innerText()).trim();
  const ordinateur = await nouvellePage({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
  const telephone = await nouvellePage({ ...devices["iPhone 13"], locale: "fr-FR" });
  const urlArene = await rejoindre(ordinateur, code, "Inès");
  const urlAreneTel = await rejoindre(telephone, code, "Malo");
  return { prof, mur, ordinateur, telephone, urlPartie, urlArene, urlAreneTel };
}

async function clore(s: Seance): Promise<void> {
  await aller(s.prof, s.urlPartie);
  await s.prof.getByRole("button", { name: /Clore le tour d'essai 1 et simuler/ }).click({ timeout: 30_000 });
  await s.prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
}

/** Le mur, sur son panneau « Classement », révélation passée : l'état final. */
async function regarderLeMur(s: Seance): Promise<string> {
  await s.mur.goto(new URL(`${s.urlPartie}/projection`, s.prof.url()).toString(), { waitUntil: "networkidle" });
  await s.mur.locator('nav[aria-label="Panneau projeté"] button', { hasText: "Classement" }).click();
  await s.mur.keyboard.press("Escape");
  await s.mur.waitForTimeout(800);
  return texte(s.mur);
}

/** Les deux écrans d'élève, rechargés : ce que chacun lit du podium de l'essai. */
async function regarderLesEleves(s: Seance): Promise<{ ordinateur: string; telephone: string }> {
  const vu: Record<string, string> = {};
  for (const [nom, p, url] of [
    ["ordinateur", s.ordinateur, s.urlArene],
    ["telephone", s.telephone, s.urlAreneTel],
  ] as const) {
    await p.goto(url, { waitUntil: "networkidle" });
    vu[nom] = await texte(p);
  }
  return vu as { ordinateur: string; telephone: string };
}

async function podiumDeLEleve(p: Page): Promise<{ voile: number; podium: number; titre: string }> {
  const bloc = p.locator("[data-podium-de-l-essai]");
  return {
    voile: await p.locator('[data-podium-de-l-essai="voile"]').count(),
    podium: await bloc.locator("[data-podium]").count(),
    titre: (await bloc.count()) > 0 ? await bloc.first().innerText() : "",
  };
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 120_000);

afterAll(async () => {
  for (const c of contextes) await c.close().catch(() => undefined);
  await navigateur?.close();
});

describe("A · la vraie partie lancée par l'animateur", () => {
  let s: Seance;

  it("l'essai clos et pas encore révélé : ni l'élève ni le mur ne voient le podium", async () => {
    s = await ouvrirLaSeance(false);
    await clore(s);
    await s.prof.waitForSelector("text=Essai terminé", { timeout: 120_000 });
    await regarderLesEleves(s);
    await capture(s.ordinateur, "A1-eleve-avant-revelation-1280");
    await capture(s.telephone, "A1-eleve-avant-revelation-390");
    const mur = await regarderLeMur(s);
    await capture(s.mur, "A1-mur-avant-revelation-1280");
    for (const p of [s.ordinateur, s.telephone]) {
      const vu = await podiumDeLEleve(p);
      expect(vu.podium, "aucun podium avant la révélation").toBe(0);
      expect(vu.voile, "l'élève lit que l'enseignant révélera le classement").toBe(1);
      expect(vu.titre).toContain("sera révélé par votre enseignant");
      await sansDebord(p);
    }
    expect(await s.mur.locator("[data-podium]").count(), "le mur respecte le rideau").toBe(0);
    expect(mur).toContain("Classement sous embargo");
  }, 420_000);

  it("révélé : l'élève, sur ordinateur et téléphone, et le mur voient le podium de l'essai", async () => {
    await aller(s.prof, s.urlPartie);
    await s.prof.getByRole("button", { name: "Révéler le classement" }).click({ timeout: 30_000 });
    await s.prof.waitForSelector("text=/révélé aux élèves/", { timeout: 60_000 });
    await regarderLesEleves(s);
    await capture(s.ordinateur, "A2-eleve-podium-1280");
    await capture(s.telephone, "A2-eleve-podium-390");
    const mur = await regarderLeMur(s);
    await capture(s.mur, "A2-mur-podium-1280");
    for (const p of [s.ordinateur, s.telephone]) {
      const vu = await podiumDeLEleve(p);
      expect(vu.podium, `${p.url()} : le podium de l'essai`).toBe(1);
      expect(vu.titre).toContain("Podium du tour d'essai · ne compte pas");
      await sansDebord(p);
    }
    expect(await s.mur.locator('[data-podium="projection"]').count(), "le mur joue le podium").toBe(1);
    expect(mur).toMatch(/Tour d'essai · ne compte pas/i);
  }, 300_000);

  it("la vraie partie commencée : l'élève le retrouve dans « Revoir le tour d'essai », le mur le garde", async () => {
    await aller(s.prof, s.urlPartie);
    await s.prof.getByRole("button", { name: "Commencer la vraie partie" }).click();
    await s.prof.getByRole("dialog").getByRole("button", { name: "Commencer la vraie partie" }).click();
    await s.prof.waitForSelector("text=Revoir le tour d'essai", { timeout: 120_000 });
    await regarderLesEleves(s);
    for (const p of [s.ordinateur, s.telephone]) {
      const revoir = p.locator("[data-podium-de-l-essai] summary", { hasText: "Revoir le tour d'essai" });
      expect(await revoir.count(), `${p.url()} : « Revoir le tour d'essai »`).toBe(1);
      await revoir.click();
      expect(await p.locator("[data-podium-de-l-essai] [data-podium]").isVisible()).toBe(true);
      await sansDebord(p);
    }
    await capture(s.ordinateur, "A3-eleve-revoir-1280");
    await capture(s.telephone, "A3-eleve-revoir-390");
    const mur = await regarderLeMur(s);
    await capture(s.mur, "A3-mur-apres-bascule-1280");
    expect(await s.mur.locator('[data-podium="projection"]').count()).toBe(1);
    expect(mur).toMatch(/Tour d'essai · ne compte pas/i);
    // La page de l'animateur garde aussi le podium de l'essai.
    await aller(s.prof, `${s.urlPartie}/essai`);
    expect(await s.prof.locator("[data-podium]").count()).toBe(1);
    await capture(s.prof, "A3-revoir-l-essai-enseignant-1280");
  }, 300_000);
});

describe("B · la vraie partie lancée d'elle-même à la fin de l'essai", () => {
  let s: Seance;

  it("l'essai clos, la vraie partie commence : rien avant la révélation", async () => {
    s = await ouvrirLaSeance(true);
    await clore(s);
    await s.prof.waitForSelector("text=Revoir le tour d'essai", { timeout: 120_000 });
    await capture(s.prof, "B1-pilotage-apres-bascule-1280");
    await regarderLesEleves(s);
    await capture(s.ordinateur, "B1-eleve-avant-revelation-1280");
    await capture(s.telephone, "B1-eleve-avant-revelation-390");
    const mur = await regarderLeMur(s);
    await capture(s.mur, "B1-mur-avant-revelation-1280");
    for (const p of [s.ordinateur, s.telephone]) {
      const vu = await podiumDeLEleve(p);
      expect(vu.podium, "aucun podium avant la révélation").toBe(0);
      expect(vu.voile, "l'élève lit que l'enseignant révélera le classement").toBe(1);
      await sansDebord(p);
    }
    expect(await s.mur.locator("[data-podium]").count(), "le mur respecte le rideau").toBe(0);
    expect(mur, "le mur sait qu'il y a un classement d'essai à révéler").toContain("Classement sous embargo");
  }, 420_000);

  it("l'animateur révèle l'essai depuis le pilotage : l'élève et le mur voient le podium", async () => {
    await aller(s.prof, s.urlPartie);
    const geste = s.prof.locator("[data-podium-de-l-essai-a-reveler]");
    await geste.getByRole("button", { name: "Révéler le classement de l'essai" }).click({ timeout: 30_000 });
    await s.prof.waitForSelector("text=/Classement de l'essai révélé/", { timeout: 60_000 });
    await capture(s.prof, "B2-pilotage-essai-revele-1280");
    await regarderLesEleves(s);
    await capture(s.ordinateur, "B2-eleve-podium-1280");
    await capture(s.telephone, "B2-eleve-podium-390");
    const mur = await regarderLeMur(s);
    await capture(s.mur, "B2-mur-podium-1280");
    for (const p of [s.ordinateur, s.telephone]) {
      const vu = await podiumDeLEleve(p);
      expect(vu.podium, `${p.url()} : le podium de l'essai`).toBe(1);
      expect(vu.titre).toContain("Podium du tour d'essai · ne compte pas");
      expect(await p.locator("[data-podium-de-l-essai] [data-podium]").isVisible()).toBe(true);
      await sansDebord(p);
    }
    expect(await s.mur.locator('[data-podium="projection"]').count(), "le mur joue le podium").toBe(1);
    expect(mur).toMatch(/Tour d'essai · ne compte pas/i);
  }, 300_000);
});
