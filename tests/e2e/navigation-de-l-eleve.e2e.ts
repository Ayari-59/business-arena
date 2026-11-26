import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { coursDuDiplome, chapitresDuParcoursDansLOrdre } from "../../src/config/cours/par-diplome";
import { chapitreParCode } from "../../src/config/cours/registre";
import type { Chapitre } from "../../src/config/cours/types";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";
import { finDuParcours, parcoursDeReference } from "../../src/pedagogy/cours/navigation-de-l-eleve";

/**
 * L'ÉLÈVE SAIT OÙ IL EN EST ET OÙ ALLER ENSUITE (audit du cours du 25 novembre 2026, usage 1.2 à 1.5).
 *
 * Une élève de classe commence un chapitre, le quitte au milieu, revient sur « Ma classe », qui lui dit
 * « Reprendre, étape 4 sur 20 » ; elle le finit, passe au chapitre suivant du parcours de sa classe, et
 * revient à sa classe par le fil d'Ariane. À 1280 et à 390 px. Puis la liste d'un diplôme, repliée par
 * bloc, et la fin d'un parcours.
 */

const PARCOURS = "comptabilite-generale";
const ordre = chapitresDuParcoursDansLOrdre(PARCOURS);
const pilote = chapitreParCode("creation-premier-bilan")!;
const suivant = ordre[ordre.indexOf(pilote) + 1]!;
const ENTREPRISE = "nova";
const virgule = (x: number) => String(x).replace(".", ",");

let navigateur: Browser;
beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);
afterAll(async () => {
  await navigateur?.close();
});

const capturer = async (page: Page, nom: string, pleine = false) => {
  if (!process.env.E2E_CAPTURES) return;
  mkdirSync(process.env.E2E_CAPTURES, { recursive: true });
  await page.screenshot({ path: join(process.env.E2E_CAPTURES, `${nom}.png`), fullPage: pleine });
};

const contexte = (largeur: number): Promise<BrowserContext> =>
  largeur < 640
    ? navigateur.newContext({ viewport: { width: largeur, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: "fr-FR" })
    : navigateur.newContext({ viewport: { width: largeur, height: 900 }, locale: "fr-FR" });

const titre = (p: Page) => p.locator("h1").innerText().then(espacesOrdinaires);
const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Les étapes `de` à `jusqua` (exclue) d'un chapitre, jouées justes, comme un élève qui ne se trompe pas. */
async function jouer(page: Page, source: Chapitre, de: number, jusqua: number, telephone: boolean) {
  const cas = casDeLEntreprise(ENTREPRISE);
  const chapitre = chapitreDuCas(source, cas);
  for (let i = de; i < jusqua; i++) {
    const etape = chapitre.etapes[i]!;
    await expect.poll(() => titre(page), { timeout: 15_000 }).toBe(etape.titre);
    const avant = etatAvant(chapitre, cas, i);
    if (etape.type === "ecriture") {
      for (const [k, l] of enSaisie(etape.ecriture(cas)).entries()) {
        await page.getByLabel(`Compte, ligne ${k + 1}`, { exact: true }).fill(l.compte);
        if (l.debit) await page.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
        if (l.credit) await page.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
      }
      await page.getByRole("button", { name: "Valider l'écriture" }).click();
      await expect.poll(() => page.getByText("Écriture juste.").count()).toBe(1);
    } else if (etape.type === "choix" || etape.type === "comparaison") {
      const options =
        etape.type === "choix" ? etape.options(cas, avant) : etape.options(cas, etatAvant(chapitre, cas, indexDeLEtape(chapitre, etape.avantLEtape)), avant);
      await page.getByRole("radio", { name: options.find((o) => o.juste)!.texte, exact: true }).click();
    } else if (etape.type === "montants") {
      for (const c of etape.champs(cas, avant)) {
        if (!telephone) {
          await page.getByLabel(c.libelle, { exact: true }).fill(virgule(c.attendu));
          continue;
        }
        await page.getByLabel(c.libelle, { exact: true }).pressSequentially(virgule(Math.abs(c.attendu)));
        if (c.attendu < 0) await page.getByRole("button", { name: `Changer le signe : ${c.libelle}`, exact: true }).tap();
      }
      await page.getByRole("button", { name: "Vérifier", exact: true }).click();
    } else if (etape.type === "curseur") {
      await page.getByLabel(`${etape.grandeur?.(cas).libelle ?? "Ventes du mois"}, au clavier`, { exact: true }).fill(String(etape.cible(cas).attendu));
      await page.getByRole("button", { name: "Valider cette position" }).click();
    } else if (etape.type === "simulation") {
      const solution = etape.defi(cas).solution;
      for (const l of etape.leviers(cas)) await page.getByLabel(`${l.libelle}, au clavier`, { exact: true }).fill(virgule(solution[l.code]!));
      await page.getByRole("button", { name: "Valider cette position" }).click();
    } else if (etape.type !== "lecture") {
      throw new Error(`étape ${etape.id} (${etape.type}) : ce parcours ne sait pas la jouer`);
    }
    await page.getByRole("button", { name: i === chapitre.etapes.length - 1 ? "Terminer le chapitre" : "Étape suivante" }).click();
  }
}

describe.each([1280, 390])("à %i px : commencer, quitter, reprendre, finir, passer au suivant, revenir à sa classe", (largeur) => {
  it("« Reprendre, étape 4 sur 20 », « Chapitre suivant », puis « Ma classe » par le fil d'Ariane", async () => {
    expect(suivant.libre).toBe(false);
    const telephone = largeur < 640;
    const n = pilote.etapes.length;

    // L'enseignante, sous licence Campus, crée la classe sur le parcours de comptabilité générale, chez NOVA.
    const ctxProf = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    await enseignantSousLicence(ctxProf);
    const prof = await ctxProf.newPage();
    await aller(prof, "/teacher/cours");
    await prof.getByLabel("Nom de la classe").fill(`Navigation ${largeur}`);
    await prof.getByLabel("Parcours du cours").selectOption(PARCOURS);
    await prof.getByLabel("Entreprise du cas").selectOption(ENTREPRISE);
    await prof.getByRole("button", { name: "Créer la classe" }).click();
    await prof.waitForURL(/\/teacher\/cours\/[0-9a-f-]{36}/, { timeout: 60_000 });
    const code = (await prof.locator("[data-code-de-classe]").innerText().then(espacesOrdinaires)).trim();

    // Inès rejoint.
    const ctx = await contexte(largeur);
    const eleve = await ctx.newPage();
    await aller(eleve, `/cours/rejoindre?code=${encodeURIComponent(code)}`);
    await eleve.getByLabel("Prénom ou pseudonyme").fill("Inès");
    await eleve.getByRole("button", { name: "Rejoindre la classe" }).click();
    await eleve.waitForURL(/\/cours\?classe=rejointe/, { timeout: 60_000 });
    const ligne = eleve.locator(`[data-chapitre-de-ma-classe="${pilote.code}"]`);
    expect(await ligne.locator("[data-etat-du-chapitre]").getAttribute("data-etat-du-chapitre")).toBe("a-faire");
    expect(espacesOrdinaires(await ligne.locator("[data-etat-du-chapitre]").innerText())).toBe("à faire");
    expect(await eleve.locator("[data-commencer-en-classe]").getAttribute("data-etat-du-bouton")).toBe("a-faire");
    expect(espacesOrdinaires(await eleve.locator("[data-commencer-en-classe]").innerText())).toMatch(/^Commencer : /);

    // Elle commence le chapitre pilote et s'arrête à la 4e étape.
    await ligne.getByRole("link").click();
    await eleve.waitForURL(new RegExp(`/cours/${pilote.code}\\?`), { timeout: 60_000 });
    await jouer(eleve, pilote, 0, 3, telephone);
    await expect.poll(() => titre(eleve), { timeout: 15_000 }).toBe(chapitreDuCas(pilote, casDeLEntreprise(ENTREPRISE)).etapes[3]!.titre);

    // Elle quitte, puis revient sur « Ma classe » : le bouton reprend où elle s'est arrêtée.
    const bouton = eleve.locator("[data-commencer-en-classe]");
    await expect
      .poll(
        async () => {
          await aller(eleve, "/cours");
          return espacesOrdinaires(await bouton.innerText());
        },
        { timeout: 30_000 },
      )
      .toBe(`Reprendre, étape 4 sur ${n} : ${espacesOrdinaires(pilote.titre)}`);
    expect(await bouton.getAttribute("data-etat-du-bouton")).toBe("en-cours");
    expect(await bouton.getAttribute("data-commencer-en-classe")).toBe(pilote.code);
    expect(espacesOrdinaires(await ligne.locator("[data-etat-du-chapitre]").innerText())).toBe(`en cours, étape 4 sur ${n}`);
    expect(await debordement(eleve)).toBeLessThanOrEqual(0);
    await capturer(eleve, `ma-classe-reprendre-${largeur}`);

    // Elle reprend, et le finit.
    await bouton.click();
    await eleve.waitForURL(new RegExp(`/cours/${pilote.code}\\?`), { timeout: 60_000 });
    await jouer(eleve, pilote, 3, n, telephone);

    // La fin mène au chapitre suivant du parcours de sa classe, et ramène à sa classe.
    const aSuivre = eleve.locator(`[data-suite-du-parcours="suivant"] a[data-chapitre-suivant-du-parcours="${suivant.code}"]`);
    await aSuivre.waitFor({ state: "visible", timeout: 15_000 });
    expect(espacesOrdinaires(await aSuivre.innerText())).toBe(`Chapitre suivant : ${espacesOrdinaires(suivant.titre)}`);
    const retour = eleve.locator("[data-retour-du-chapitre]");
    expect(await retour.getAttribute("href")).toBe("/cours#ma-classe");
    expect(espacesOrdinaires(await retour.innerText())).toBe("Retour à ma classe");
    expect(await eleve.locator('a[href="/cours"]', { hasText: "Retour au cours" }).count()).toBe(0);
    expect(await debordement(eleve)).toBeLessThanOrEqual(0);
    await capturer(eleve, `fin-avec-chapitre-suivant-${largeur}`);

    await aSuivre.click();
    await eleve.waitForURL(new RegExp(`/cours/${suivant.code}\\?`), { timeout: 60_000 });
    await expect.poll(() => titre(eleve), { timeout: 15_000 }).toBe(chapitreDuCas(suivant, casDeLEntreprise(ENTREPRISE)).etapes[0]!.titre);

    // Le fil d'Ariane : « Ma classe › chapitre » ; elle revient à sa classe.
    const fil = eleve.getByRole("navigation", { name: "Fil d'Ariane" });
    expect(espacesOrdinaires(await fil.innerText()).replace(/\s+/g, " ")).toBe(`Ma classe › ${espacesOrdinaires(suivant.titre)}`);
    expect(await fil.locator('[aria-current="page"]').innerText().then(espacesOrdinaires)).toBe(espacesOrdinaires(suivant.titre));
    await fil.getByRole("link", { name: "Ma classe" }).click();
    await eleve.waitForURL(/\/cours#ma-classe$/, { timeout: 60_000 });
    await expect.poll(() => ligne.locator("[data-etat-du-chapitre]").getAttribute("data-etat-du-chapitre"), { timeout: 15_000 }).toBe("fait");
    expect(espacesOrdinaires(await ligne.locator("[data-etat-du-chapitre]").innerText())).toBe("fait");
    await capturer(eleve, `ma-classe-apres-${largeur}`);

    await ctx.close();
    await ctxProf.close();
  }, 400_000);
});

describe("la liste d'un diplôme, repliée par bloc, et la fin d'un parcours", () => {
  it.each([1280, 390])("à %i px : un bloc ouvert, chaque bloc avec son nombre de chapitres ; le fil d'Ariane du chapitre y ramène", async (largeur) => {
    const ctx = await contexte(largeur);
    const page = await ctx.newPage();
    const cours = coursDuDiplome("bts-cg")!;
    await aller(page, "/cours?diplome=bts-cg");
    const blocs = page.locator('[data-programme="bts-cg"] details[data-bloc-du-diplome]');
    expect(await blocs.count()).toBe(cours.blocs.length);
    const ouverts = await blocs.evaluateAll((ds) => ds.map((d, k) => ((d as HTMLDetailsElement).open ? k : -1)).filter((k) => k >= 0));
    const premierAvecChapitres = cours.blocs.findIndex((b) => b.chapitres.length > 0);
    expect(ouverts).toEqual([premierAvecChapitres]);
    const resumes = await blocs.locator("[data-resume-du-bloc]").allInnerTexts();
    cours.blocs.forEach((b, k) => {
      const n = b.chapitres.length;
      expect(espacesOrdinaires(resumes[k]!)).toMatch(n === 0 ? /^pas encore de chapitre/ : new RegExp(`^${n} chapitres?`));
    });
    // À 390 px, la liste tenait en 17 650 px (audit, usage 1.5) : repliée, elle se lit en quelques écrans.
    const hauteur = await page.locator('[data-programme="bts-cg"]').evaluate((el) => el.getBoundingClientRect().height);
    if (largeur < 640) expect(hauteur).toBeLessThan(9_000);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    if (process.env.E2E_CAPTURES) await page.locator('[data-programme="bts-cg"]').screenshot({ path: join(process.env.E2E_CAPTURES, `diplome-replie-${largeur}.png`) });

    // Le fil d'Ariane d'un chapitre du BTS CG : Cours › BTS CG › son bloc › le chapitre ; le bloc y mène, ouvert.
    const libre = cours.blocs.flatMap((b) => b.chapitres).find((l) => l.chapitre.libre)!.chapitre;
    const rang = cours.blocs.findIndex((b) => b.chapitres.some((l) => l.chapitre.code === libre.code));
    await aller(page, `/cours/${libre.code}?entreprise=${libre.entreprises?.codes[0] ?? ENTREPRISE}&diplome=bts-cg`);
    const fil = page.getByRole("navigation", { name: "Fil d'Ariane" });
    await fil.waitFor();
    expect(espacesOrdinaires(await fil.innerText()).replace(/\s+/g, " ")).toBe(
      `Cours › BTS CG › ${espacesOrdinaires(cours.blocs[rang]!.bloc ?? "Autres chapitres du parcours")} › ${espacesOrdinaires(libre.titre)}`,
    );
    await fil.getByRole("link", { name: "BTS CG" }).click();
    await page.waitForURL(/\/cours\?diplome=bts-cg#programme$/, { timeout: 60_000 });
    await aller(page, `/cours/${libre.code}?entreprise=${libre.entreprises?.codes[0] ?? ENTREPRISE}&diplome=bts-cg`);
    await fil.locator(`a[href="/cours?diplome=bts-cg#bloc-${rang + 1}"]`).click();
    await page.waitForURL(new RegExp(`#bloc-${rang + 1}$`), { timeout: 60_000 });
    await expect.poll(() => page.locator(`#bloc-${rang + 1}`).evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    await ctx.close();
  }, 120_000);

  it.each([1280, 390])("à %i px : le dernier chapitre du parcours du BTS CG dit que le parcours est fini, et ramène à sa place dans la liste", async (largeur) => {
    const ctx = await contexte(largeur);
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    const ordreBts = coursDuDiplome("bts-cg")!.blocs.flatMap((b) => b.chapitres).sort((a, b) => a.rang - b.rang).map((l) => l.chapitre);
    const dernier = ordreBts.at(-1)!;
    const entreprise = dernier.entreprises?.codes[0] ?? ENTREPRISE;
    await aller(page, `/cours/${dernier.code}?entreprise=${entreprise}&diplome=bts-cg`);
    await page.evaluate(([cle, n]) => window.localStorage.setItem(cle as string, JSON.stringify({ index: n, etapes: {} })), [`cours:${dernier.code}:${entreprise}`, dernier.etapes.length]);
    await page.reload();
    const fin = page.locator('[data-suite-du-parcours="fin"] [data-fin-du-parcours]');
    await fin.waitFor({ state: "visible", timeout: 15_000 });
    expect(espacesOrdinaires(await fin.innerText())).toBe(finDuParcours(parcoursDeReference(dernier, { diplome: "bts-cg" })));
    expect(await page.locator("[data-retour-du-chapitre]").getAttribute("href")).toBe(`/cours?diplome=bts-cg#chapitre-${dernier.code}`);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await capturer(page, `fin-de-parcours-${largeur}`);
    await page.locator("[data-retour-du-chapitre]").click();
    await page.waitForURL(new RegExp(`/cours\\?diplome=bts-cg#chapitre-${dernier.code}$`), { timeout: 60_000 });
    await expect.poll(() => page.locator(`#chapitre-${dernier.code}`).isVisible(), { timeout: 15_000 }).toBe(true);
    await ctx.close();
  }, 120_000);
});
