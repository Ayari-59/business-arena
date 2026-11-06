import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Locator, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { LE_MOIS_DE_MARS_DE_NOVA } from "../../src/config/cours/bureaux/le-mois-de-mars-de-nova";
import { LES_JEUX_DE_NOEL } from "../../src/config/cours/bureaux/les-jeux-de-noel";
import { LES_PARTENAIRES_AU_31_MARS } from "../../src/config/cours/bureaux/les-partenaires-au-31-mars";
import type { Bureau, EtapeDuBureau } from "../../src/config/cours/bureaux/types";
import { LE_JOURNAL_DE_L_APPRENTI } from "../../src/config/cours/enquetes/le-journal-de-l-apprenti";
import { LES_EFFETS_DE_L_INTERIMAIRE } from "../../src/config/cours/enquetes/les-effets-de-l-interimaire";
import * as C from "../../src/config/cours/scenarios/les-comptes-que-voulait-le-president";
import * as E from "../../src/config/cours/scenarios/les-escomptes-de-janvier";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { enSaisie, type LigneSaisie } from "../../src/pedagogy/cours/correcteur";
import { cellulesASaisir, libelleDeCellule, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LES ACTIVITÉS DU LOT A, JOUÉES DANS LE NAVIGATEUR : trois bureaux, deux enquêtes, deux scénarios, de
 * bout en bout, sur téléphone, sous licence. Pour chacune : le chapitre qu'elle reprend et le catalogue y
 * mènent ; la page ne porte aucun corrigé ; chaque geste est corrigé par le serveur, jusqu'au « Travail
 * rendu » ou au bilan de la meilleure suite. Sans licence, une activité dit qu'elle est réservée.
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

/** Remplit le formulaire d'écriture : ajoute les lignes qui manquent, vide celles de trop. */
async function saisir(zone: Locator, lignes: readonly LigneSaisie[]) {
  let n = await zone.getByLabel(/^Compte, ligne \d+$/).count();
  while (n < lignes.length) {
    await zone.getByRole("button", { name: "Ajouter une ligne", exact: true }).click();
    n += 1;
  }
  for (let k = 0; k < n; k++) {
    const l = lignes[k] ?? { compte: "", debit: "", credit: "" };
    await zone.getByLabel(`Compte, ligne ${k + 1}`, { exact: true }).fill(l.compte);
    await zone.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
    await zone.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
  }
}

/** Joue une étape juste, du premier coup. */
async function jouerLEtape(page: Page, e: EtapeDuBureau) {
  await attendre(() => titreDeLEtape(page)).toBe(espacesOrdinaires(e.titre));
  switch (e.type) {
    case "classement": {
      for (const x of e.elements) {
        const ligne = page.locator(`[data-element="${x.code}"]`);
        if (x.piece) {
          await ligne.getByText("Ouvrir la pièce", { exact: true }).click();
          expect(await ligne.locator(`[data-piece="${x.piece}"]`).isVisible()).toBe(true);
        }
        await ligne.getByRole("radio", { name: e.categories.find((k) => k.code === x.categorie)!.libelle, exact: true }).click();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-element] .encadre-gain").count()).toBe(e.elements.length);
      return;
    }
    case "etat": {
      for (const { ligne, colonne, cellule } of cellulesASaisir(e.grille)) {
        const nom = libelleDeCellule(e.grille, ligne, colonne);
        const v = cellule.valeur!;
        await page.getByLabel(nom, { exact: true }).pressSequentially(valeurASaisir(Math.abs(v)));
        if (v < 0) await page.getByRole("button", { name: `Changer le signe : ${nom}`, exact: true }).tap();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      await attendre(() => page.locator("[data-etat-juste]").count()).toBe(1);
      return;
    }
    case "journal": {
      for (const [n, x] of e.ecritures.entries()) {
        await saisir(page.locator("main"), enSaisie(x.ecriture));
        await page.getByRole("button", { name: "Valider l'écriture" }).click();
        await attendre(() => page.locator("[data-ecriture-passee]").count()).toBe(n + 1);
      }
      await attendre(() => page.locator("[data-explication-du-bureau]").count()).toBe(1);
      return;
    }
    case "rectification": {
      expect(await page.locator("[data-rectification]").count()).toBe(e.ecritures.length);
      for (const [n, x] of e.ecritures.entries()) {
        const carte = page.locator(`[data-rectification="${x.id}"]`);
        const ouvrir = carte.getByRole("button", { name: "Rectifier cette écriture", exact: true });
        if (await ouvrir.count()) await ouvrir.click();
        await carte.getByRole("radio", { name: e.raisons.find((k) => k.code === x.raison)!.libelle, exact: true }).click();
        await saisir(carte, enSaisie(x.ecriture));
        await carte.getByRole("button", { name: "Valider l'écriture" }).click();
        await attendre(() => page.locator("[data-rectifiee]").count()).toBe(n + 1);
      }
      await attendre(() => page.locator("[data-explication-du-bureau]").count()).toBe(1);
      return;
    }
    case "reponse": {
      for (const q of e.questions) {
        await page.locator(`[data-question="${q.id}"]`).getByRole("radio", { name: q.options.find((o) => o.juste)!.texte, exact: true }).click();
        await attendre(() => page.locator(`[data-question="${q.id}"] .encadre-gain`).count()).toBe(1);
      }
      return;
    }
  }
}

const BUREAUX: readonly { b: Bureau; chapitre: string; chemin: string; lien: string }[] = [
  { b: LE_MOIS_DE_MARS_DE_NOVA, chapitre: "charges-produits-encaissements", chemin: "bureau", lien: "data-bureau-du-chapitre" },
  { b: LES_PARTENAIRES_AU_31_MARS, chapitre: "les-flux-de-l-entreprise", chemin: "bureau", lien: "data-bureau-du-chapitre" },
  { b: LES_JEUX_DE_NOEL, chapitre: "ventes-et-achats-au-complet", chemin: "bureau", lien: "data-bureau-du-chapitre" },
  { b: LE_JOURNAL_DE_L_APPRENTI, chapitre: "creation-premier-bilan", chemin: "enquete", lien: "data-enquete-du-chapitre" },
  { b: LES_EFFETS_DE_L_INTERIMAIRE, chapitre: "le-compte-client", chemin: "enquete", lien: "data-enquete-du-chapitre" },
];

const SCENARIOS: readonly { s: Scenario; chapitre: string; meilleure: readonly string[]; autre: readonly string[]; finDeLAutre: string }[] = [
  { s: E.LES_ESCOMPTES_DE_JANVIER, chapitre: "remises-et-reglements", meilleure: Object.values(E.meilleureSuite().suite), autre: ["demande", "deduire", "demande"], finDeLAutre: "fournisseur" },
  { s: C.LES_COMPTES_QUE_VOULAIT_LE_PRESIDENT, chapitre: "le-cadre-de-la-comptabilite", meilleure: Object.values(C.meilleureSuite().suite), autre: ["oublier", "choisir", "garder"], finDeLAutre: "embellis" },
];

async function sousLicence() {
  const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "fr-FR" });
  await enseignantSousLicence(ctx);
  return ctx;
}

/** Le chapitre et le catalogue mènent à l'activité. */
async function lesLiens(page: Page, chapitre: string, attribut: string, code: string, chemin: string) {
  await aller(page, `/cours/${chapitre}?entreprise=nova`);
  expect(await page.locator(`a[${attribut}="${code}"]`).first().getAttribute("href")).toBe(chemin);
  await aller(page, "/cours");
  expect(await page.locator(`a[${attribut}="${code}"]`).first().getAttribute("href")).toBe(chemin);
}

describe("les activités du lot A", () => {
  it("sans licence, une activité dit qu'elle est réservée", async () => {
    const page = await navigateur.newPage();
    await aller(page, `/cours/bureau/${LE_MOIS_DE_MARS_DE_NOVA.code}`);
    const texte = await page.locator("main").innerText().then(espacesOrdinaires);
    await page.context().close();
    expect(texte).toContain(espacesOrdinaires(LE_MOIS_DE_MARS_DE_NOVA.titre));
    expect(texte).toContain("Ce cas pratique est réservé aux établissements sous licence");
  });

  it.each(BUREAUX.map((x) => [x.b.code, x] as const))("%s : se joue de bout en bout au téléphone, corrigé par le serveur", async (_code, { b, chapitre, chemin, lien }) => {
    const ctx = await sousLicence();
    const page = await ctx.newPage();
    try {
      const adresse = `/cours/${chemin}/${b.code}`;
      await lesLiens(page, chapitre, lien, b.code, adresse);
      await aller(page, adresse);
      expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(b.titre));
      const html = espacesOrdinaires(await page.content());
      for (const e of b.etapes) for (const t of e.explication) expect(html, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
      expect(html).not.toMatch(/categorie\\?"/);
      for (const [i, e] of b.etapes.entries()) {
        await jouerLEtape(page, e);
        expect(await debordement(page)).toBeLessThanOrEqual(1);
        await page.getByRole("button", { name: i === b.etapes.length - 1 ? "Rendre le travail" : "Étape suivante", exact: true }).click();
      }
      const n = b.etapes.length;
      await expect.poll(() => page.locator("main").innerText().then(espacesOrdinaires), { timeout: 20_000 }).toContain(`${n} étapes réussies du premier coup sur ${n}`);
      expect(await page.locator("[data-travail-rendu]").count()).toBe(1);
    } finally {
      await ctx.close();
    }
  });

  it.each(SCENARIOS.map((x) => [x.s.code, x] as const))("%s : une suite qui finit mal, puis la meilleure, au téléphone", async (_code, { s, chapitre, meilleure, autre, finDeLAutre }) => {
    const ctx = await sousLicence();
    const page = await ctx.newPage();
    const jouer = async (suite: readonly string[]) => {
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
    };
    try {
      const adresse = `/cours/scenario/${s.code}`;
      await lesLiens(page, chapitre, "data-scenario-du-chapitre", s.code, adresse);
      await aller(page, adresse);
      expect(espacesOrdinaires(await page.locator("h1").innerText())).toBe(espacesOrdinaires(s.titre));
      const html = espacesOrdinaires(await page.content());
      expect(html).not.toContain(espacesOrdinaires(s.situation([s.decisions[0]!.options[0]!]).consigne));
      for (const q of s.questions.questions) for (const o of q.options) expect(html, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));

      await jouer(autre);
      expect(await page.locator("[data-bilan]").getAttribute("data-fin")).toBe(finDeLAutre);
      expect(await page.locator("[data-bilan]").getAttribute("data-meilleure")).toBe("non");

      await page.getByRole("button", { name: "Recommencer le scénario", exact: true }).click();
      await attendre(() => page.locator('[data-decision="0"]').count()).toBe(1);
      await jouer(meilleure);
      expect(await page.locator("[data-bilan]").getAttribute("data-meilleure")).toBe("oui");
      for (const q of s.questions.questions) {
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
