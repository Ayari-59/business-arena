import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME, chapitreParCode } from "../../src/config/cours/registre";
import { CAS_DE_SYNTHESE, casDuChapitre, motsDuContenu } from "../../src/config/cours/situations";
import { programmeDuDiplome } from "../../src/config/cours/programme";
import { THEMES, themeDuChapitre } from "../../src/config/cours/themes";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitresDeLaNotion, suitesDuChapitre } from "../../src/pedagogy/cours/suites";
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

/** Les tableaux de l'étape elle-même : celui du rappel de l'énoncé, replié, n'en est pas un. */
const tableauxDeLEtape = (p: Page) =>
  p.evaluate(() => [...document.querySelectorAll("[data-tableau-du-cas]")].filter((t) => !t.closest("[data-rappel-enonce]")).length);
const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

async function nouvellePage(largeur = 1280, hauteur = 900): Promise<Page> {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, locale: "fr-FR" });
  return ctx.newPage();
}

describe("/cours : le catalogue par thème et le chapitre libre", () => {
  it("propose le chapitre pilote dans chacune des entreprises du cours, range chaque chapitre une fois sous son thème, n'annonce que ce qui vient, sans déborder sur téléphone", async () => {
    const page = await nouvellePage(390, 844);
    await aller(page, "/cours");
    for (const code of ENTREPRISES_DU_COURS) {
      expect(await page.locator(`a[href="${chemin(code)}"]`).count(), code).toBeGreaterThan(0);
    }
    // Les quatre briques et leur enchaînement, avant le catalogue.
    expect(await page.locator("[data-articulation] [data-brique]").count()).toBe(4);
    // Un tiroir par thème, fermés à l'arrivée : la page est un index, pas une carte à dérouler.
    expect(await page.locator("details[data-theme]").count()).toBe(THEMES.length);
    expect(await page.locator("details[data-theme][open]").count()).toBe(0);
    // Chaque chapitre une fois dans le catalogue, sous son thème.
    for (const c of CHAPITRES) {
      const lignes = page.locator(`details[data-theme] [data-chapitre="${c.code}"]`);
      expect(await lignes.count(), c.code).toBe(1);
      expect(
        await page.locator(`details[data-theme="${themeDuChapitre(c.code)!.code}"] [data-chapitre="${c.code}"]`).count(),
        c.code,
      ).toBe(1);
    }
    // Ce qui vient se compte sur le programme d'un parcours qui se construit, jamais à la main.
    const aVenir = PARCOURS.filter((p) => p.enPreparation).filter((p) => {
      const prevus = Object.values(PROGRAMME[p.code]).reduce((n, titres) => n + (titres?.length ?? 0), 0);
      return prevus > CHAPITRES.filter((c) => c.parcours === p.code).length;
    });
    expect(await page.locator("[data-a-venir]").count()).toBe(aVenir.length);
    // Chaque cas de synthèse paraît une fois, sous le thème des chapitres qu'il reprend.
    // Chaque chapitre porte son cas pratique dédié, sur sa ligne.
    for (const c of CHAPITRES) {
      expect(await page.locator(`details[data-theme] [data-chapitre="${c.code}"] [data-cas-du-chapitre="${casDuChapitre(c.code)!.code}"]`).count(), c.code).toBe(1);
    }
    for (const s of CAS_DE_SYNTHESE) {
      expect(
        await page.locator(`details[data-theme="${themeDuChapitre(s.reprend[0]!)!.code}"] [data-situation-de-cours="${s.code}"]`).count(),
        s.code,
      ).toBe(1);
    }
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.context().close();
  }, 60_000);

  it("le diplôme choisi compile son programme : couverture, ateliers, chapitres et épisodes", async () => {
    const page = await nouvellePage(390, 844);
    await aller(page, "/cours");
    // Le formulaire marche sans script : choisir, puis compiler.
    await page.locator('[data-filtre-diplome] select[name="diplome"]').selectOption("bac-pro-mcv");
    await page.locator("[data-filtre-diplome]").getByRole("button", { name: "Compiler le programme" }).click();
    await page.waitForURL(/diplome=bac-pro-mcv/);
    const programme = page.locator('[data-programme="bac-pro-mcv"]');
    expect(await programme.count()).toBe(1);
    const attendu = programmeDuDiplome("bac-pro-mcv")!;
    expect(await programme.locator("[data-couverture-du-programme]").innerText()).toContain(
      `${attendu.couverture.travaillees} entrées sur ${attendu.couverture.total}`,
    );
    expect(await programme.locator("[data-chapitre]").count()).toBe(
      attendu.themes.reduce((n, t) => n + t.chapitres.length, 0),
    );
    expect(await programme.locator("[data-episode]").count()).toBe(attendu.episodes.length);
    expect(await programme.locator('a[href="/parcours/bac-pro-mcv"]').count()).toBeGreaterThan(0);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    // Un diplôme qui a ses ateliers les propose.
    await aller(page, "/cours?diplome=bts-mco");
    expect(await page.locator('[data-programme="bts-mco"] a[href="/animations/mco"]').count()).toBe(1);
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
      if (etape.tableau) expect(await tableauxDeLEtape(page)).toBe(1);
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

    // Et maintenant, jouez-le : la partie s'ouvre chez la même entreprise, au niveau de la mission.
    const mission = page.locator("[data-jouez-le]");
    expect(await mission.innerText()).toContain("Résultats › Finance › Bilan");
    const jouer = mission.getByRole("link", { name: `Jouer ${cas.entreprise} au niveau 1` });
    expect(await jouer.getAttribute("href")).toBe(`/jouer?secteur=${code}&niveau=1`);
    await jouer.click();
    await page.waitForURL(/\/jouer\?secteur=bistrot&niveau=1/, { timeout: 60_000 });
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

    // Au mur : l'étape projetée, la remarque comptée, aucun nom d'élève.
    await prof.getByRole("link", { name: "Projeter l'étape « Les apports des associés »" }).click();
    await prof.waitForURL(/\/projection\?/, { timeout: 60_000 });
    await expect.poll(() => prof.locator("[data-remarques-projetees]").innerText()).toContain("L'argent reçu en banque se passe au débit.");
    expect(await prof.locator("[data-remarques-projetees]").innerText()).toContain("1 élève");
    expect(await prof.locator("main").innerText()).not.toContain("Camille");

    // L'élève corrige, avance, se trompe à la question à choix, puis trouve.
    await eleve.getByLabel("Compte, ligne 1", { exact: true }).fill("512");
    await eleve.getByLabel("Compte, ligne 2", { exact: true }).fill("101");
    await eleve.getByRole("button", { name: "Valider l'écriture" }).click();
    await expect.poll(() => eleve.getByText("Écriture juste.").count()).toBe(1);
    await eleve.getByRole("button", { name: "Étape suivante" }).click();
    const emprunt = chapitreDuCas(chapitre, cas).etapes.find((e) => e.id === "emprunt")!;
    if (emprunt.type !== "ecriture") throw new Error("L'étape « emprunt » n'est plus une écriture.");
    for (const [k, l] of enSaisie(emprunt.ecriture(cas)).entries()) {
      await eleve.getByLabel(`Compte, ligne ${k + 1}`, { exact: true }).fill(l.compte);
      if (l.debit) await eleve.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
      if (l.credit) await eleve.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
    }
    await eleve.getByRole("button", { name: "Valider l'écriture" }).click();
    await expect.poll(() => eleve.getByText("Écriture juste.").count()).toBe(1);
    await eleve.getByRole("button", { name: "Étape suivante" }).click();
    const fausse = "Oui : emprunter coûte de l'argent.";
    const juste = "Non : c'est une ressource, une dette qu'il faudra rembourser.";
    await eleve.getByRole("radio", { name: fausse }).click();
    await eleve.getByRole("radio", { name: juste }).click();
    await expect.poll(() => eleve.getByRole("button", { name: "Étape suivante" }).count()).toBe(1);

    // La projection de la question compte chaque réponse, et ne montre la bonne que sur demande.
    const projection = new URL(prof.url());
    projection.searchParams.set("etape", "emprunt-charge");
    await aller(prof, `${projection.pathname}${projection.search}`);
    const reponse = (texte: string) => prof.locator(`[data-reponse="${texte}"]`);
    await expect
      .poll(
        async () => {
          await prof.reload();
          return [await reponse(fausse).getAttribute("data-eleves"), await reponse(juste).getAttribute("data-eleves")];
        },
        { timeout: 30_000 },
      )
      .toEqual(["1", "1"]);
    expect(await reponse("Non : c'est un produit, l'entreprise s'enrichit.").getAttribute("data-eleves")).toBe("0");
    expect(await prof.locator("[data-juste]").count()).toBe(0);
    await prof.getByRole("link", { name: "Montrer la réponse" }).click();
    await expect.poll(() => reponse(juste).getAttribute("data-juste")).toBe("true");
    expect(await reponse(fausse).getAttribute("data-juste")).toBe("false");
    expect(await prof.locator("main").innerText()).not.toContain("Camille");
    await ctxProf.close();
    await eleve.context().close();
  }, 240_000);
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
          await page.locator(`[data-element="${el.libelle}"]`).getByRole("radio", { name: libelle, exact: true }).click();
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

describe.each([
  { code: "la-paie", entreprise: "hotel" },
  { code: "l-emprunt", entreprise: "transport" },
  { code: "immobilisations", entreprise: "batiment" },
  { code: "les-stocks", entreprise: "ecommerce" },
  { code: "la-cloture", entreprise: "boutique" },
  { code: "la-cloture", entreprise: "bistrot" },
  { code: "remises-et-reglements", entreprise: "conseil" },
  { code: "cout-complet", entreprise: "nova" },
  // Au téléphone, des montants négatifs : l'élève tape les chiffres, puis le bouton de signe.
  { code: "cout-complet", entreprise: "fitness", telephone: true },
  { code: "la-cloture", entreprise: "nova", telephone: true },
  { code: "cout-par-produit", entreprise: "ecommerce" },
  { code: "cout-par-produit", entreprise: "boutique", telephone: true },
  { code: "budget-de-tresorerie", entreprise: "ecommerce", telephone: true },
  { code: "budget-de-tresorerie", entreprise: "transport" },
  { code: "analyse-des-ecarts", entreprise: "boutique", telephone: true },
  { code: "analyse-des-ecarts", entreprise: "hotel" },
  { code: "tableau-de-bord", entreprise: "nova", telephone: true },
  { code: "tableau-de-bord", entreprise: "conseil" },
  { code: "decider-prix-fabriquer-acheter", entreprise: "nova", telephone: true },
  { code: "decider-prix-fabriquer-acheter", entreprise: "hotel" },
  { code: "depreciations-et-provisions", entreprise: "transport" },
  { code: "depreciations-et-provisions", entreprise: "bistrot", telephone: true },
  { code: "regularisations-de-fin-d-exercice", entreprise: "boutique" },
  { code: "regularisations-de-fin-d-exercice", entreprise: "hotel", telephone: true },
  { code: "soldes-intermediaires-de-gestion", entreprise: "boutique" },
  { code: "soldes-intermediaires-de-gestion", entreprise: "batiment", telephone: true },
  { code: "bilan-fonctionnel-et-bfr", entreprise: "transport" },
  { code: "bilan-fonctionnel-et-bfr", entreprise: "nova", telephone: true },
  { code: "les-flux-de-l-entreprise", entreprise: "hotel" },
  { code: "les-flux-de-l-entreprise", entreprise: "fitness", telephone: true },
  { code: "charges-produits-encaissements", entreprise: "ecommerce" },
  { code: "charges-produits-encaissements", entreprise: "conseil", telephone: true },
  { code: "prix-cout-et-marge", entreprise: "bistrot" },
  { code: "prix-cout-et-marge", entreprise: "transport", telephone: true },
  { code: "taux-de-marque-et-coefficient", entreprise: "boutique" },
  { code: "taux-de-marque-et-coefficient", entreprise: "bistrot", telephone: true },
  { code: "indicateurs-du-point-de-vente", entreprise: "boutique", telephone: true },
  { code: "indicateurs-du-point-de-vente", entreprise: "ecommerce" },
  { code: "indicateurs-du-point-de-vente", entreprise: "bistrot" },
  { code: "stock-du-point-de-vente", entreprise: "boutique" },
  { code: "stock-du-point-de-vente", entreprise: "ecommerce", telephone: true },
  { code: "prevoir-les-ventes", entreprise: "bistrot", telephone: true },
  { code: "prevoir-les-ventes", entreprise: "boutique" },
  { code: "budget-du-point-de-vente", entreprise: "ecommerce" },
  { code: "budget-du-point-de-vente", entreprise: "boutique", telephone: true },
  { code: "seuil-du-point-de-vente", entreprise: "bistrot" },
  { code: "seuil-du-point-de-vente", entreprise: "ecommerce", telephone: true },
  { code: "promotion-qui-paie", entreprise: "boutique" },
  { code: "promotion-qui-paie", entreprise: "ecommerce", telephone: true },
  { code: "assortiment", entreprise: "bistrot", telephone: true },
  { code: "assortiment", entreprise: "boutique" },
  { code: "equipe-et-planning", entreprise: "bistrot" },
  { code: "equipe-et-planning", entreprise: "boutique", telephone: true },
  { code: "tableau-de-bord-du-manager", entreprise: "ecommerce", telephone: true },
  { code: "tableau-de-bord-du-manager", entreprise: "bistrot" },
  { code: "negocier-le-prix", entreprise: "conseil" },
  { code: "negocier-le-prix", entreprise: "batiment", telephone: true },
  { code: "remises-et-conditions", entreprise: "transport" },
  { code: "remises-et-conditions", entreprise: "conseil", telephone: true },
  { code: "valeur-d-un-client", entreprise: "fitness" },
  { code: "valeur-d-un-client", entreprise: "fitness", telephone: true },
  { code: "cout-d-acquisition", entreprise: "ecommerce" },
  { code: "cout-d-acquisition", entreprise: "ecommerce", telephone: true },
  { code: "commissions-des-partenaires", entreprise: "ecommerce" },
  { code: "commissions-des-partenaires", entreprise: "ecommerce", telephone: true },
  { code: "portefeuille-abc", entreprise: "boutique" },
  { code: "portefeuille-abc", entreprise: "ecommerce", telephone: true },
  { code: "tableau-de-bord-commercial", entreprise: "batiment" },
  { code: "tableau-de-bord-commercial", entreprise: "transport", telephone: true },
  { code: "marche-et-part-de-marche", entreprise: "nova" },
  { code: "marche-et-part-de-marche", entreprise: "hotel", telephone: true },
  { code: "segmenter-et-cibler", entreprise: "transport" },
  { code: "segmenter-et-cibler", entreprise: "fitness", telephone: true },
  { code: "prix-psychologique", entreprise: "bistrot" },
  { code: "prix-psychologique", entreprise: "conseil", telephone: true },
  { code: "demande-et-prix", entreprise: "fitness" },
  { code: "demande-et-prix", entreprise: "boutique", telephone: true },
  { code: "ce-que-rapporte-la-communication", entreprise: "hotel" },
  { code: "ce-que-rapporte-la-communication", entreprise: "bistrot", telephone: true },
  { code: "canaux-de-distribution", entreprise: "ecommerce" },
  { code: "canaux-de-distribution", entreprise: "nova", telephone: true },
  { code: "lire-le-compte-de-resultat", entreprise: "boutique" },
  { code: "lire-le-compte-de-resultat", entreprise: "conseil", telephone: true },
  { code: "lire-le-bilan", entreprise: "ecommerce" },
  { code: "lire-le-bilan", entreprise: "hotel", telephone: true },
  { code: "valeur-ajoutee-et-partage", entreprise: "nova" },
  { code: "valeur-ajoutee-et-partage", entreprise: "bistrot", telephone: true },
  { code: "rentabilite", entreprise: "transport" },
  { code: "rentabilite", entreprise: "fitness", telephone: true },
  { code: "fonds-de-roulement-et-tresorerie", entreprise: "batiment" },
  { code: "fonds-de-roulement-et-tresorerie", entreprise: "ecommerce", telephone: true },
  { code: "financer-l-entreprise", entreprise: "hotel" },
  { code: "financer-l-entreprise", entreprise: "boutique", telephone: true },
  { code: "effectif-et-masse-salariale", entreprise: "conseil" },
  { code: "effectif-et-masse-salariale", entreprise: "batiment", telephone: true },
  { code: "salaire-brut-net-cout", entreprise: "hotel" },
  { code: "salaire-brut-net-cout", entreprise: "fitness", telephone: true },
  // Les cas pratiques s'ouvrent et se jouent comme un chapitre réservé.
  { code: "suivre-la-baisse-du-concurrent", entreprise: "nova" },
  { code: "suivre-la-baisse-du-concurrent", entreprise: "hotel", telephone: true },
  { code: "la-facture-contestee", entreprise: "batiment" },
  { code: "la-facture-contestee", entreprise: "conseil", telephone: true },
  { code: "le-rendez-vous-a-la-banque", entreprise: "fitness" },
  { code: "le-rendez-vous-a-la-banque", entreprise: "transport", telephone: true },
  { code: "commander-pour-la-promotion", entreprise: "boutique" },
  { code: "commander-pour-la-promotion", entreprise: "bistrot", telephone: true },
  { code: "quel-prix-pour-la-saison", entreprise: "hotel" },
  { code: "quel-prix-pour-la-saison", entreprise: "fitness", telephone: true },
  { code: "la-remise-du-grand-compte", entreprise: "transport" },
  { code: "la-remise-du-grand-compte", entreprise: "batiment", telephone: true },
  { code: "embaucher-pour-la-saison", entreprise: "boutique" },
  { code: "embaucher-pour-la-saison", entreprise: "conseil", telephone: true },
  // Le cas dédié de chaque chapitre, joué une fois, en alternant ordinateur et téléphone.
  { code: "l-acompte-du-client", entreprise: "nova" },
  { code: "rembourser-une-part-du-pret", entreprise: "conseil", telephone: true },
  { code: "la-commande-du-31-janvier", entreprise: "transport" },
  { code: "l-escompte-demande-par-le-client", entreprise: "bistrot", telephone: true },
  { code: "la-prime-exceptionnelle", entreprise: "batiment" },
  { code: "un-deuxieme-pret", entreprise: "hotel", telephone: true },
  { code: "un-second-equipement", entreprise: "fitness" },
  { code: "le-stock-qui-manque", entreprise: "boutique", telephone: true },
  { code: "acheter-avant-la-cloture", entreprise: "ecommerce" },
  { code: "la-creance-qui-se-degrade", entreprise: "nova", telephone: true },
  { code: "l-assurance-sur-plusieurs-annees", entreprise: "conseil" },
  { code: "la-hausse-des-salaires", entreprise: "transport", telephone: true },
  { code: "l-investisseuse-au-capital", entreprise: "bistrot" },
  { code: "un-technicien-plutot-qu-un-prestataire", entreprise: "batiment", telephone: true },
  { code: "ce-qu-exige-le-fonds", entreprise: "hotel" },
  { code: "le-fournisseur-raccourcit-ses-delais", entreprise: "fitness", telephone: true },
  { code: "l-annuite-du-pret", entreprise: "boutique" },
  { code: "quand-le-taux-monte", entreprise: "ecommerce", telephone: true },
  { code: "vendre-plus-financer-plus", entreprise: "nova" },
  { code: "le-fournisseur-augmente", entreprise: "conseil", telephone: true },
  { code: "le-loyer-qui-augmente", entreprise: "transport" },
  { code: "un-nouveau-client-regulier", entreprise: "bistrot", telephone: true },
  { code: "la-cle-contestee", entreprise: "conseil" },
  { code: "un-trimestre-de-croissance", entreprise: "hotel", telephone: true },
  { code: "l-objectif-du-commercial", entreprise: "fitness" },
  { code: "regler-le-voyant", entreprise: "boutique", telephone: true },
  { code: "monter-son-prix", entreprise: "ecommerce" },
  { code: "garder-sa-part-de-marche", entreprise: "conseil", telephone: true },
  { code: "quel-segment-conquerir", entreprise: "nova" },
  { code: "une-promotion-trop-forte", entreprise: "ecommerce", telephone: true },
  { code: "repercuter-la-hausse-du-fournisseur", entreprise: "bistrot" },
  { code: "une-rallonge-pour-la-campagne", entreprise: "fitness", telephone: true },
  { code: "l-intermediaire-veut-payer-plus-tard", entreprise: "ecommerce" },
  { code: "la-remise-autorisee", entreprise: "conseil", telephone: true },
  { code: "la-remise-par-palier", entreprise: "transport" },
  { code: "le-programme-de-fidelite", entreprise: "fitness", telephone: true },
  { code: "couper-le-budget-de-campagne", entreprise: "ecommerce" },
  { code: "la-mise-en-avant-payante", entreprise: "ecommerce", telephone: true },
  { code: "abandonner-les-petits-comptes", entreprise: "ecommerce" },
  { code: "l-objectif-de-taux-de-service", entreprise: "conseil", telephone: true },
  { code: "l-etiquette-du-concurrent", entreprise: "ecommerce" },
  { code: "moins-de-clients-le-mois-prochain", entreprise: "bistrot", telephone: true },
  { code: "alleger-le-stock", entreprise: "boutique" },
  { code: "prevoir-le-trimestre-creux", entreprise: "ecommerce", telephone: true },
  { code: "reviser-le-budget", entreprise: "boutique" },
  { code: "ferme-pour-travaux", entreprise: "boutique", telephone: true },
  { code: "jusqu-ou-remiser", entreprise: "ecommerce" },
  { code: "retirer-une-reference", entreprise: "bistrot", telephone: true },
  { code: "l-accord-de-branche", entreprise: "boutique" },
  { code: "le-trimestre-face-a-l-objectif", entreprise: "ecommerce", telephone: true },
  { code: "l-augmentation-generale", entreprise: "hotel" },
  { code: "la-prime-de-fin-d-annee", entreprise: "fitness", telephone: true },
] as { code: string; entreprise: string; telephone?: boolean }[])("le chapitre réservé $code chez $entreprise", ({ code: chapitreCode, entreprise, telephone }) => {
  it("sans licence, il dit qu'il est réservé ; sous licence, il se joue sans faute", async () => {
    const libre = await nouvellePage();
    await aller(libre, `/cours/${chapitreCode}?entreprise=${entreprise}`);
    expect(await libre.locator("main").innerText()).toContain(`${motsDuContenu(chapitreCode).reserve} aux établissements sous licence`);
    await libre.context().close();

    const code = entreprise;
    const cas = casDeLEntreprise(code);
    const chapitre = chapitreDuCas(chapitreParCode(chapitreCode)!, cas);
    const ctx = await navigateur.newContext({
      viewport: telephone ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      hasTouch: telephone ?? false,
      locale: "fr-FR",
    });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await aller(page, `/cours/${chapitre.code}?entreprise=${code}`);
    for (const [i, etape] of chapitre.etapes.entries()) {
      await expect.poll(() => page.locator("h1").innerText(), { timeout: 15_000 }).toBe(etape.titre);
      if (etape.tableau) expect(await tableauxDeLEtape(page)).toBe(1);
      // Le rappel plié de l'énoncé, sur chaque étape notée d'un contenu qui s'ouvre sur un énoncé chiffré.
      const enonce = chapitre.etapes[0]!;
      expect(await page.locator("[data-rappel-enonce]").count(), etape.id).toBe(
        etape.type !== "lecture" && enonce.type === "lecture" && enonce.tableau ? 1 : 0,
      );
      const avant = etatAvant(chapitre, cas, i);
      if (etape.type === "ecriture") {
        for (const [k, l] of enSaisie(etape.ecriture(cas)).entries()) {
          await page.getByLabel(`Compte, ligne ${k + 1}`, { exact: true }).fill(l.compte);
          if (l.debit) await page.getByLabel(`Débit, ligne ${k + 1}`, { exact: true }).fill(l.debit);
          if (l.credit) await page.getByLabel(`Crédit, ligne ${k + 1}`, { exact: true }).fill(l.credit);
        }
        await page.getByRole("button", { name: "Valider l'écriture" }).click();
        await expect.poll(() => page.getByText("Écriture juste.").count()).toBe(1);
        if (etape.vue === "paie") expect(await page.getByRole("figure", { name: "Les comptes de la paie" }).count()).toBe(1);
      } else if (etape.type === "tri") {
        for (const el of etape.elements(cas)) {
          const libelle = etape.categories.find((k) => k.code === el.categorie)!.libelle;
          await page.locator(`[data-element="${el.libelle}"]`).getByRole("radio", { name: libelle, exact: true }).click();
        }
        await page.getByRole("button", { name: "Vérifier" }).click();
      } else if (etape.type === "montants") {
        for (const c of etape.champs(cas, avant)) {
          if (!telephone) {
            await page.getByLabel(c.libelle, { exact: true }).fill(virgule(c.attendu));
            continue;
          }
          await page.getByLabel(c.libelle, { exact: true }).pressSequentially(virgule(Math.abs(c.attendu)));
          if (c.attendu < 0) await page.getByRole("button", { name: `Changer le signe : ${c.libelle}`, exact: true }).tap();
        }
        await page.getByRole("button", { name: "Vérifier" }).click();
      } else if (etape.type === "choix") {
        await page.getByRole("radio", { name: etape.options(cas, avant).find((o) => o.juste)!.texte }).click();
      } else if (etape.type === "curseur") {
        const libelle = etape.grandeur?.(cas).libelle ?? "Ventes du mois";
        await page.getByLabel(`${libelle}, au clavier`, { exact: true }).fill(String(etape.cible(cas).attendu));
        await page.getByRole("button", { name: "Valider cette position" }).click();
      }
      const dernier = i === chapitre.etapes.length - 1;
      await page.getByRole("button", { name: dernier ? motsDuContenu(chapitre.code).terminer : "Étape suivante" }).click();
    }
    const notees = chapitre.etapes.filter((e) => e.type !== "lecture").length;
    await expect
      .poll(() => page.locator("main").innerText(), { timeout: 15_000 })
      .toContain(`${notees} étapes réussies du premier coup sur ${notees}`);
    // Et ensuite : les cas pratiques qui reprennent le chapitre, ou les chapitres que le cas reprend.
    const suites = suitesDuChapitre(chapitre.code);
    const lus = (attribut: string) =>
      page.locator(`[data-et-ensuite] [${attribut}]`).evaluateAll((xs, a) => xs.map((x) => x.getAttribute(a)), attribut);
    expect(await lus("data-suite-situation")).toEqual(suites.situations.map((l) => l.code));
    expect(await lus("data-chapitre-repris")).toEqual(suites.reprend.map((l) => l.code));
    expect(await lus("data-suite-episode")).toEqual(suites.episodes.map((l) => l.code));
    if (telephone) expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await ctx.close();
  }, 240_000);
});

describe("les liens dans les deux sens", () => {
  it("l'ancre d'un thème ouvre son tiroir dans le catalogue", async () => {
    const page = await nouvellePage(390, 844);
    await aller(page, "/cours#theme-vente");
    await expect.poll(() => page.locator('details[data-theme="vente"]').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    expect(await page.locator('details[data-theme="marketing"]').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
    await page.context().close();
  }, 60_000);

  it("une fiche notion nomme les chapitres qui la font vivre, et y mène", async () => {
    const notion = CONCEPTS.find((c) => chapitresDeLaNotion(c.code).length > 0)!;
    const premier = chapitresDeLaNotion(notion.code)[0]!;
    const page = await nouvellePage(390, 844);
    await aller(page, `/notions#${notion.code}`);
    const fiche = page.locator(`details[id="${notion.code}"]`);
    // L'ancre peut déjà avoir ouvert la fiche : on ne la referme pas.
    if (!(await fiche.evaluate((d) => (d as HTMLDetailsElement).open))) await fiche.locator("summary").click();
    const lien = fiche.locator(`[data-dans-le-cours] [data-chapitre-de-la-notion="${premier.code}"]`);
    expect(await lien.innerText()).toBe(premier.titre);
    await lien.click();
    await page.waitForURL(new RegExp(`/cours/${premier.code}`));
    expect(await page.locator("main").innerText()).toContain(premier.titre);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.context().close();
  }, 60_000);
});

describe("un chapitre qui ne vaut pas pour toutes les entreprises", () => {
  it("demandé chez un hôtel, « Les stocks » dit pourquoi et se joue chez une entreprise qui a un stock", async () => {
    const chapitre = CHAPITRES.find((c) => c.code === "les-stocks")!;
    const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await aller(page, "/cours/les-stocks?entreprise=hotel");
    const note = page.locator("[data-entreprise-remplacee]");
    await expect.poll(() => note.count()).toBe(1);
    expect(await note.innerText()).toContain("ne joue pas ce chapitre");
    const cas = casDeLEntreprise(chapitre.entreprises!.codes[0]!);
    expect(await note.innerText()).toContain(cas.entreprise);
    await expect.poll(() => page.locator("h1").innerText(), { timeout: 15_000 }).toBe(chapitre.etapes[0]!.titre);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await ctx.close();
  }, 120_000);
});
