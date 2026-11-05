import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { LE_DECOUVERT_DE_NOVA as s } from "../../src/config/cours/scenarios/le-decouvert-de-nova";
import { meilleureSuite, resultatDeLaSuite } from "../../src/config/cours/monde/decouvert-de-nova";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";

/**
 * LE SCÉNARIO À EMBRANCHEMENTS, JOUÉ DANS LE NAVIGATEUR (config/cours/scenarios) : le découvert de NOVA,
 * de bout en bout, sur téléphone, deux fois. Sans licence, il dit qu'il est réservé ; sous licence, le
 * chapitre et le catalogue y mènent, la page ne porte ni branche ni corrigé, et chaque choix est calculé
 * par le serveur. Une première suite, sans rien faire, finit sur un prélèvement rejeté ; on recommence,
 * et la meilleure suite finit sur le mois tenu, puis les questions se corrigent.
 */

const CHEMIN = `/cours/scenario/${s.code}`;
const eur = (x: number) => espacesOrdinaires(montantEcrit(x).replace(/^-/, "−"));

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const texteDe = (p: Page, selecteur: string) => p.locator(selecteur).innerText().then(espacesOrdinaires);
/** Un choix passe par le serveur : on lui laisse le temps de répondre. */
const attendre = <T>(f: () => Promise<T>) => expect.poll(f, { timeout: 20_000 });

/** Joue une suite de choix, décision par décision, jusqu'au bilan. */
async function jouer(page: Page, suite: readonly string[]) {
  for (const [i, code] of suite.entries()) {
    const decision = page.locator(`[data-decision="${i}"]`);
    await attendre(() => decision.count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(1);
    // Avant le choix, aucune conséquence à l'écran.
    expect(await decision.locator("[data-consequence]").count()).toBe(0);
    await decision.locator(`[data-option="${code}"]`).click();
    await decision.getByRole("button", { name: "Décider", exact: true }).click();
    await attendre(() => decision.locator("[data-consequence]").count()).toBe(1);
    await decision.getByRole("button", { name: i === suite.length - 1 ? "Voir le bilan" : "Décision suivante", exact: true }).click();
  }
  await attendre(() => page.locator("[data-bilan]").count()).toBe(1);
  expect(await debordement(page)).toBeLessThanOrEqual(1);
}

describe("/cours/scenario : le découvert de NOVA", () => {
  it("sans licence, le scénario dit qu'il est réservé", async () => {
    const page = await navigateur.newPage();
    await aller(page, CHEMIN);
    const texte = await page.locator("main").innerText().then(espacesOrdinaires);
    await page.context().close();
    expect(texte).toContain(espacesOrdinaires(s.titre));
    expect(texte).toContain("Ce cas pratique est réservé aux établissements sous licence");
  });

  it("sous licence, le chapitre et le catalogue y mènent, et deux suites se jouent de bout en bout au téléphone", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    try {
      // Le chapitre « Financer et placer la trésorerie » et le catalogue mènent au scénario.
      await aller(page, "/cours/financer-et-placer-la-tresorerie?entreprise=nova");
      expect(await page.locator(`a[data-scenario-du-chapitre="${s.code}"]`).getAttribute("href")).toBe(CHEMIN);
      await aller(page, "/cours");
      expect(await page.locator(`a[data-scenario-du-chapitre="${s.code}"]`).first().getAttribute("href")).toBe(CHEMIN);

      await aller(page, CHEMIN);
      expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(s.titre));
      // La page ne porte que la première décision : ni conséquence, ni bilan, ni corrigé.
      const html = espacesOrdinaires(await page.content());
      const b = meilleureSuite();
      expect(html).not.toMatch(/Le mois coûte|La meilleure suite|Relancée, CampusTech/);
      expect(html).not.toContain(espacesOrdinaires(s.situation(["attendre"]).consigne));
      for (const q of s.questions.questions) for (const o of q.options) expect(html, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
      expect(html).not.toMatch(/juste\\?"/);

      // 1. Sans rien faire : attendre CampusTech, payer, rester au découvert. Le loyer est rejeté.
      const rejet = ["attendre", "payer", "decouvert"] as const;
      await jouer(page, rejet);
      expect(await page.locator("[data-bilan]").getAttribute("data-fin")).toBe("rejet");
      expect(await page.locator("[data-bilan]").getAttribute("data-meilleure")).toBe("non");
      expect(await texteDe(page, "[data-suite-de-l-eleve]")).toContain(eur(resultatDeLaSuite({ client: "attendre", fournisseur: "payer", banque: "decouvert" }).cout));
      expect(await texteDe(page, "[data-meilleure-suite]")).toContain(eur(b.cout));

      // 2. On recommence : la meilleure suite tient le mois.
      await page.getByRole("button", { name: "Recommencer le scénario", exact: true }).click();
      await attendre(() => page.locator('[data-decision="0"]').count()).toBe(1);
      await jouer(page, [b.suite.client, b.suite.fournisseur, b.suite.banque]);
      expect(await page.locator("[data-bilan]").getAttribute("data-fin")).toBe("tenu");
      expect(await page.locator("[data-bilan]").getAttribute("data-meilleure")).toBe("oui");
      expect(await texteDe(page, "[data-suite-de-l-eleve]")).toContain(eur(b.cout));

      // Les questions : une fausse d'abord, puis les bonnes, corrigées par le serveur.
      const [q1, q2] = s.questions.questions;
      const fausse = q1!.options.find((o) => !o.juste)!;
      await page.locator(`[data-question="${q1!.id}"]`).getByRole("radio", { name: fausse.texte, exact: true }).click();
      await attendre(() => page.locator(`[data-question="${q1!.id}"] .encadre-perte`).count()).toBe(1);
      for (const q of [q1!, q2!]) {
        await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: q.options.find((o) => o.juste)!.texte, exact: true }).click();
        await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
      }
      await attendre(() => page.locator("[data-questions] [data-explication-du-bureau]").count()).toBe(1);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
    } finally {
      await ctx.close();
    }
  });
});
