import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { L_ECHEANCE_DE_JANVIER } from "../../src/config/cours/bureaux/l-echeance-de-janvier";
import { LE_BESOIN_DE_L_ANNEE_TYPE } from "../../src/config/cours/bureaux/le-besoin-de-l-annee-type";
import { LA_PREMIERE_CONSOLIDATION } from "../../src/config/cours/bureaux/la-premiere-consolidation";
import type { Bureau, EtapeDeClassement, EtapeDeReponse, EtapeDEtat } from "../../src/config/cours/bureaux/types";
import { BOUCLER_LE_PLAN_DE_LA_GAMME } from "../../src/config/cours/scenarios/boucler-le-plan-de-la-gamme";
import { LE_DOSSIER_VERT_DE_NOVA } from "../../src/config/cours/scenarios/le-dossier-vert-de-nova";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { meilleureSuiteDuPlan } from "../../src/config/cours/monde/boucler-le-plan";
import { meilleurDossier } from "../../src/config/cours/monde/dossier-vert-de-nova";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { cellulesASaisir, libelleDeCellule, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LES ACTIVITÉS DU LOT E, JOUÉES DANS LE NAVIGATEUR : une activité par chapitre (novembre 2026), de bout
 * en bout, sur téléphone, la bonne suite. Trois bureaux (l'échéance de janvier, le besoin de l'année type,
 * la première consolidation) et deux scénarios (boucler le plan de la gamme, le dossier vert de NOVA).
 * Sous licence, le chapitre et le catalogue y mènent, la page ne porte aucun corrigé, et chaque geste
 * est corrigé ou calculé par le serveur.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const titreDeLEtape = (p: Page) => p.locator("h2").first().innerText().then(espacesOrdinaires);
const attendre = <T>(f: () => Promise<T>) => expect.poll(f, { timeout: 20_000 });

async function telephone() {
  const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "fr-FR" });
  await enseignantSousLicence(ctx);
  return { ctx, page: await ctx.newPage() };
}

/** Le chapitre et le catalogue mènent à l'activité. */
async function liens(page: Page, chapitre: string, attribut: string, code: string, chemin: string) {
  await aller(page, `/cours/${chapitre}?entreprise=nova`);
  expect(await page.locator(`a[${attribut}="${code}"]`).getAttribute("href")).toBe(chemin);
  await aller(page, "/cours");
  expect(await page.locator(`a[${attribut}="${code}"]`).first().getAttribute("href")).toBe(chemin);
}

/** Joue un bureau de bout en bout, sans faute, jusqu'au travail rendu. */
async function jouerLeBureau(page: Page, b: Bureau) {
  const chemin = `/cours/bureau/${b.code}`;
  await aller(page, chemin);
  expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(b.titre));
  const html = espacesOrdinaires(await page.content());
  expect(html).not.toMatch(/categorie\\?"/);
  for (const e of b.etapes) {
    if (e.type === "classement") for (const x of e.elements) expect(html, x.pourquoi).not.toContain(espacesOrdinaires(x.pourquoi).slice(0, 40));
    if (e.type === "reponse") for (const q of e.questions) for (const o of q.options) expect(html, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
  }
  for (const [n, e] of b.etapes.entries()) {
    await attendre(() => titreDeLEtape(page)).toBe(espacesOrdinaires(e.titre));
    if (e.type === "classement") {
      const k = e as EtapeDeClassement;
      for (const x of k.elements) {
        const ligne = page.locator(`[data-element="${x.code}"]`);
        if (x.piece) {
          await ligne.getByText("Ouvrir la pièce", { exact: true }).click();
          expect(await ligne.locator(`[data-piece="${x.piece}"]`).isVisible()).toBe(true);
        }
        await ligne.getByRole("radio", { name: k.categories.find((c) => c.code === x.categorie)!.libelle, exact: true }).click();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-element] .encadre-gain").count()).toBe(k.elements.length);
    } else if (e.type === "etat") {
      const g = (e as EtapeDEtat).grille;
      for (const { ligne, colonne, cellule } of cellulesASaisir(g)) {
        const nom = libelleDeCellule(g, ligne, colonne);
        const v = cellule.valeur!;
        await page.getByLabel(nom, { exact: true }).pressSequentially(valeurASaisir(Math.abs(v)));
        if (v < 0) await page.getByRole("button", { name: `Changer le signe : ${nom}`, exact: true }).tap();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-etat-juste]").count()).toBe(1);
    } else if (e.type === "reponse") {
      for (const q of (e as EtapeDeReponse).questions) {
        await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: q.options.find((o) => o.juste)!.texte, exact: true }).click();
        await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
      }
    }
    expect(await debordement(page)).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: n === b.etapes.length - 1 ? "Rendre le travail" : "Étape suivante", exact: true }).click();
  }
  await expect.poll(() => page.locator("main").innerText().then(espacesOrdinaires)).toContain(`${b.etapes.length} étapes réussies du premier coup sur ${b.etapes.length}`);
  expect(await page.locator("[data-travail-rendu]").count()).toBe(1);
}

/** Joue un scénario sur sa meilleure suite, puis ses questions. */
async function jouerLeScenario(page: Page, s: Scenario, suite: readonly string[]) {
  await aller(page, `/cours/scenario/${s.code}`);
  expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(s.titre));
  const html = espacesOrdinaires(await page.content());
  for (const o of s.decisions[0]!.options) expect(html).not.toContain(espacesOrdinaires(s.situation([o]).consigne));
  for (const q of s.questions.questions) for (const o of q.options) expect(html, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
  expect(html).not.toMatch(/juste\\?"/);
  for (const [i, code] of suite.entries()) {
    const decision = page.locator(`[data-decision="${i}"]`);
    await attendre(() => decision.count()).toBe(1);
    expect(await decision.locator("[data-consequence]").count()).toBe(0);
    await decision.locator(`[data-option="${code}"]`).click();
    await decision.getByRole("button", { name: "Décider", exact: true }).click();
    await attendre(() => decision.locator("[data-consequence]").count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(1);
    await decision.getByRole("button", { name: i === suite.length - 1 ? "Voir le bilan" : "Décision suivante", exact: true }).click();
  }
  await attendre(() => page.locator("[data-bilan]").count()).toBe(1);
  expect(await page.locator("[data-bilan]").getAttribute("data-meilleure")).toBe("oui");
  for (const q of s.questions.questions) {
    await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: q.options.find((o) => o.juste)!.texte, exact: true }).click();
    await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
  }
  await attendre(() => page.locator("[data-questions] [data-explication-du-bureau]").count()).toBe(1);
  expect(await debordement(page)).toBeLessThanOrEqual(1);
}

describe("les bureaux du lot E", () => {
  for (const b of [L_ECHEANCE_DE_JANVIER, LE_BESOIN_DE_L_ANNEE_TYPE, LA_PREMIERE_CONSOLIDATION]) {
    it(`${b.titre} : sans licence, réservé ; sous licence, le chapitre y mène, et il se joue de bout en bout`, async () => {
      const anonyme = await navigateur.newPage();
      await aller(anonyme, `/cours/bureau/${b.code}`);
      const texte = await anonyme.locator("main").innerText().then(espacesOrdinaires);
      await anonyme.context().close();
      expect(texte).toContain("Ce cas pratique est réservé aux établissements sous licence");

      const { ctx, page } = await telephone();
      try {
        await liens(page, b.reprend[0]!, "data-bureau-du-chapitre", b.code, `/cours/bureau/${b.code}`);
        await jouerLeBureau(page, b);
      } finally {
        await ctx.close();
      }
    });
  }
});

describe("les scénarios du lot E", () => {
  const cas: [Scenario, readonly string[]][] = [
    [BOUCLER_LE_PLAN_DE_LA_GAMME, [meilleureSuiteDuPlan().suite.montant, meilleureSuiteDuPlan().suite.duree]],
    [LE_DOSSIER_VERT_DE_NOVA, [meilleurDossier().suite.ligne, meilleurDossier().suite.pret]],
  ];
  for (const [s, suite] of cas) {
    it(`${s.titre} : le chapitre y mène, et la meilleure suite se joue de bout en bout`, async () => {
      const { ctx, page } = await telephone();
      try {
        await liens(page, s.reprend[0]!, "data-scenario-du-chapitre", s.code, `/cours/scenario/${s.code}`);
        await jouerLeScenario(page, s, suite);
      } finally {
        await ctx.close();
      }
    });
  }
});
