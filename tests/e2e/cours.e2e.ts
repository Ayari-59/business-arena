import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";

/**
 * LE COURS PAR LA SIMULATION, JOUÉ DANS LE NAVIGATEUR.
 *
 * Le chapitre pilote se joue de bout en bout comme un élève qui ne se trompe pas :
 * chaque écriture passée à la main dans le journal, chaque question, chaque calcul,
 * jusqu'au « Chapitre terminé » qui compte toutes les étapes réussies du premier
 * coup. Puis le chemin de l'erreur (la remarque, l'indice, la correction après
 * deux essais), le mode classe, la reprise après un rechargement, et le téléphone.
 */

const chapitre = CHAPITRES[0]!;
const chemin = (entreprise: string, classe = false) =>
  `/cours/${chapitre.code}?entreprise=${entreprise}${classe ? "&classe" : ""}`;
const virgule = (x: number) => String(x).replace(".", ",");

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

async function nouvellePage(largeur = 1280, hauteur = 900): Promise<Page> {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, locale: "fr-FR" });
  return ctx.newPage();
}

describe("/cours : la carte du cours et le chapitre libre", () => {
  it("propose le chapitre pilote dans chacune des entreprises du cours, sans déborder sur téléphone", async () => {
    const page = await nouvellePage(390, 844);
    await aller(page, "/cours");
    for (const code of ENTREPRISES_DU_COURS) {
      expect(await page.locator(`a[href="${chemin(code)}"]`).count(), code).toBeGreaterThan(0);
    }
    expect(await page.getByText("En préparation").count()).toBeGreaterThan(0);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.context().close();
  }, 60_000);
});

describe("le chapitre pilote, joué sans faute", () => {
  it("chez LA TABLE D'AUGUSTIN : chaque étape réussie du premier coup, jusqu'au bilan", async () => {
    const code = "bistrot";
    const cas = casDeLEntreprise(code);
    const chapitre = chapitreDuCas(CHAPITRES[0]!, cas);
    const page = await nouvellePage();
    await aller(page, chemin(code));
    for (const [i, etape] of chapitre.etapes.entries()) {
      await expect.poll(() => page.locator("h1").innerText(), { timeout: 15_000 }).toBe(etape.titre);
      const avant = etatAvant(chapitre, cas, i);
      if (etape.type === "ecriture") {
        const lignes = enSaisie(etape.ecriture(cas));
        for (const [k, l] of lignes.entries()) {
          await page.getByLabel(`Compte, ligne ${k + 1}`, { exact: true }).fill(l.compte);
          if (l.debit) await page.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
          if (l.credit) await page.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
        }
        await page.getByRole("button", { name: "Valider l'écriture" }).click();
        await expect.poll(() => page.getByText("Écriture juste.").count()).toBe(1);
      } else if (etape.type === "choix" || etape.type === "comparaison") {
        const options =
          etape.type === "choix"
            ? etape.options(cas, avant)
            : etape.options(cas, etatAvant(chapitre, cas, indexDeLEtape(chapitre, etape.avantLEtape)), avant);
        await page.getByRole("radio", { name: options.find((o) => o.juste)!.texte }).click();
      } else if (etape.type === "montants") {
        for (const c of etape.champs(cas, avant)) await page.getByLabel(c.libelle, { exact: true }).fill(virgule(c.attendu));
        await page.getByRole("button", { name: "Vérifier" }).click();
      }
      const dernier = i === chapitre.etapes.length - 1;
      await page.getByRole("button", { name: dernier ? "Terminer le chapitre" : "Étape suivante" }).click();
    }
    const notees = chapitre.etapes.filter((e) => e.type !== "lecture").length;
    await expect
      .poll(() => page.locator("main").innerText(), { timeout: 15_000 })
      .toContain(`${notees} étapes réussies du premier coup sur ${notees}`);
    await page.context().close();
  }, 240_000);
});

describe("l'erreur, le mode classe, la reprise et le téléphone", () => {
  async function jusquALApport(page: Page, url: string) {
    await aller(page, url);
    await page.getByRole("button", { name: "Étape suivante" }).click();
    await expect.poll(() => page.locator("h1").innerText()).toBe("Les apports des associés");
  }

  it("une écriture à l'envers est corrigée point par point ; un indice, puis la correction après deux essais", async () => {
    const cas = casDeLEntreprise("nova");
    const page = await nouvellePage();
    await jusquALApport(page, chemin("nova"));
    expect(await page.getByRole("button", { name: "Voir la correction" }).count()).toBe(0);
    await page.getByLabel("Compte, ligne 1", { exact: true }).fill("101");
    await page.getByLabel("Débit, ligne 1", { exact: true }).fill(String(cas.capital));
    await page.getByLabel("Compte, ligne 2", { exact: true }).fill("512");
    await page.getByLabel("Crédit, ligne 2", { exact: true }).fill(String(cas.capital));
    await page.getByRole("button", { name: "Valider l'écriture" }).click();
    await expect.poll(() => page.locator("main").innerText()).toContain("L'argent reçu en banque se passe au débit.");
    await page.getByRole("button", { name: "Un indice" }).click();
    expect(await page.locator("main").innerText()).toContain("compte de trésorerie, classe 5");
    await page.getByRole("button", { name: "Valider l'écriture" }).click();
    await page.getByRole("button", { name: "Voir la correction" }).click();
    await expect.poll(() => page.getByLabel("Compte, ligne 1", { exact: true }).inputValue()).toBe("512");
    expect(await page.getByRole("button", { name: "Étape suivante" }).count()).toBe(1);
    await page.context().close();
  }, 120_000);

  it("en classe, la correction se montre tout de suite ; le journal est ouvert", async () => {
    const page = await nouvellePage();
    await jusquALApport(page, chemin("hotel", true));
    expect(await page.getByText("Mode classe").count()).toBe(1);
    await page.getByRole("button", { name: "Voir la correction" }).click();
    await expect.poll(() => page.getByRole("button", { name: "Étape suivante" }).count()).toBe(1);
    await page.getByRole("button", { name: "Étape suivante" }).click();
    expect(await page.locator("details[open]").innerText()).toContain("Apport en capital");
    await page.context().close();
  }, 120_000);

  it("la progression survit à un rechargement, et la page tient sur un téléphone", async () => {
    const page = await nouvellePage(390, 844);
    await jusquALApport(page, chemin("transport"));
    await page.reload();
    await expect.poll(() => page.locator("h1").innerText()).toBe("Les apports des associés");
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.context().close();
  }, 120_000);
});

describe("le cours en classe : l'enseignant crée, l'élève rejoint, l'erreur remonte", () => {
  it("une classe sur L'ESCALE : l'élève la rejoint, se trompe, et l'enseignant le voit", async () => {
    const ctxProf = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    await enseignantSousLicence(ctxProf);
    const prof = await ctxProf.newPage();
    await aller(prof, "/teacher/cours");
    await prof.getByLabel("Nom de la classe").fill("BTS CG 1 e2e");
    await prof.getByLabel("Entreprise du cas").selectOption("hotel");
    await prof.getByRole("button", { name: "Créer la classe" }).click();
    await prof.waitForURL(/\/teacher\/cours\/[0-9a-f-]{36}/, { timeout: 60_000 });
    const code = (await prof.locator("[data-code-de-classe]").innerText()).trim();
    expect(code).toMatch(/^BTSCG1-/);

    const eleve = await nouvellePage();
    await aller(eleve, `/cours/rejoindre?code=${code}`);
    await eleve.getByLabel("Prénom ou pseudonyme").fill("Camille");
    await eleve.getByRole("button", { name: "Rejoindre la classe" }).click();
    await eleve.waitForURL(/\/cours\?classe=rejointe/, { timeout: 60_000 });
    expect(await eleve.locator("[data-classe-du-cours]").innerText()).toContain("BTS CG 1 e2e");

    // L'entreprise imposée l'emporte sur celle de l'adresse.
    await aller(eleve, chemin("nova"));
    await expect.poll(() => eleve.locator("[data-en-classe]").innerText()).toContain("Camille");
    expect(await eleve.locator("main").innerText()).toContain("L'ESCALE");
    await eleve.getByRole("button", { name: "Étape suivante" }).click();
    const cas = casDeLEntreprise("hotel");
    await eleve.getByLabel("Compte, ligne 1", { exact: true }).fill("101");
    await eleve.getByLabel("Débit, ligne 1", { exact: true }).fill(String(cas.capital));
    await eleve.getByLabel("Compte, ligne 2", { exact: true }).fill("512");
    await eleve.getByLabel("Crédit, ligne 2", { exact: true }).fill(String(cas.capital));
    await eleve.getByRole("button", { name: "Valider l'écriture" }).click();
    await expect.poll(() => eleve.locator("main").innerText()).toContain("se passe au débit");

    await expect
      .poll(
        async () => {
          await prof.reload();
          return prof.locator("[data-etape='apport']").innerText();
        },
        { timeout: 30_000 },
      )
      .toContain("L'argent reçu en banque se passe au débit.");
    expect(await prof.locator("[data-eleve='Camille']").count()).toBe(1);
    await ctxProf.close();
    await eleve.context().close();
  }, 180_000);
});

describe("le seuil de rentabilité, chapitre réservé", () => {
  it("sans licence, le chapitre dit qu'il est réservé ; sous licence, il se joue de bout en bout sans faute", async () => {
    const libre = await nouvellePage();
    await aller(libre, "/cours/seuil-de-rentabilite?entreprise=bistrot");
    expect(await libre.locator("main").innerText()).toContain("réservé aux établissements sous licence");
    await libre.context().close();

    const code = "bistrot";
    const cas = casDeLEntreprise(code);
    const chapitre = CHAPITRES.find((c) => c.code === "seuil-de-rentabilite")!;
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await aller(page, `/cours/${chapitre.code}?entreprise=${code}`);
    const etat = { soldes: {} };
    for (const [i, etape] of chapitre.etapes.entries()) {
      await expect.poll(() => page.locator("h1").innerText(), { timeout: 15_000 }).toBe(etape.titre);
      if (etape.type === "tri") {
        for (const el of etape.elements(cas)) {
          const libelle = etape.categories.find((k) => k.code === el.categorie)!.libelle;
          await page.locator(`[data-element="${el.libelle}"]`).getByRole("radio", { name: libelle }).click();
        }
        await page.getByRole("button", { name: "Vérifier" }).click();
      } else if (etape.type === "montants") {
        for (const c of etape.champs(cas, etat)) await page.getByLabel(c.libelle, { exact: true }).fill(virgule(c.attendu));
        await page.getByRole("button", { name: "Vérifier" }).click();
      } else if (etape.type === "choix") {
        await page.getByRole("radio", { name: etape.options(cas, etat).find((o) => o.juste)!.texte }).click();
      } else if (etape.type === "curseur") {
        await page.getByLabel("Ventes du mois, au clavier").fill(String(etape.cible(cas).attendu));
        await page.getByRole("button", { name: "Valider cette position" }).click();
      }
      const dernier = i === chapitre.etapes.length - 1;
      await page.getByRole("button", { name: dernier ? "Terminer le chapitre" : "Étape suivante" }).click();
    }
    const notees = chapitre.etapes.filter((e) => e.type !== "lecture").length;
    await expect
      .poll(() => page.locator("main").innerText(), { timeout: 15_000 })
      .toContain(`${notees} étapes réussies du premier coup sur ${notees}`);
    await ctx.close();
  }, 240_000);
});
