import { espacesOrdinaires, insecables } from "../../src/lib/typographie";
import { FORMATIONS_RETIREES, chapitrePropose } from "../../src/config/formations-proposees";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME, chapitreParCode } from "../../src/config/cours/registre";
import { CAS_DE_SYNTHESE, casDuChapitre, motsDuContenu } from "../../src/config/cours/situations";
import { chapitreLibreParDefaut, chapitresLibresParDiplome, essaiDuDiplome, essaiPour } from "../../src/config/cours/chapitres-libres";
import { formationsAvecUnePage } from "../../src/config/couverture";
import { programmeDuDiplome } from "../../src/config/cours/programme";
import { coursDuDiplome, couvertureDuCoursEnClair } from "../../src/config/cours/par-diplome";
import { THEMES, themeDuChapitre } from "../../src/config/cours/themes";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitresDeLaNotion, suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { cellulesASaisir, libelleDeCellule, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";

/**
 * LE COURS PAR LA SIMULATION, JOUÉ DANS LE NAVIGATEUR.
 *
 * Le chapitre pilote se joue de bout en bout comme un élève qui ne se trompe pas :
 * chaque écriture passée à la main dans le journal, chaque question, chaque calcul,
 * jusqu'au « Chapitre terminé » qui compte toutes les étapes réussies du premier
 * coup. Puis le chemin de l'erreur (la remarque, l'indice, la correction après
 * deux essais), le mode classe, la reprise après un rechargement, et le téléphone.
 *
 * Le chapitre pilote n'est plus libre depuis novembre 2026 (un chapitre libre par diplôme, le
 * premier de son parcours : config/cours/chapitres-libres.ts) : il se joue sous licence. L'essai
 * par défaut, celui des pages sans diplôme, est `essai`.
 */

const chapitre = CHAPITRES[0]!;
const essai = chapitreLibreParDefaut();
const entreprisesDeLEssai = ENTREPRISES_DU_COURS.filter((e) => !essai.entreprises || essai.entreprises.codes.includes(e));
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

/**
 * LES TABLEAUX QUI DÉFILENT EN LARGEUR (observation du propriétaire, novembre 2026) : chaque tableau du
 * cours tient dans son cadre, sans défilement de côté ; on rend le tableau et l'écart, en pixels.
 */
const tableauxQuiDebordent = (p: Page) =>
  p.evaluate(() =>
    [...document.querySelectorAll("main table")]
      .map((t) => ({
        titre: (t.closest("figure")?.querySelector("figcaption")?.textContent ?? t.querySelector("th")?.textContent ?? "").trim().slice(0, 60),
        ecart: t.scrollWidth - (t.parentElement?.clientWidth ?? t.scrollWidth),
        // La cellule la plus large, pour savoir quoi raccourcir.
        plusLarge: [...t.querySelectorAll("th, td")].reduce<Element | null>((a, c) => (!a || c.scrollWidth > a.scrollWidth ? c : a), null)?.textContent?.trim().slice(0, 40) ?? "",
      }))
      .filter((x) => x.ecart > 1),
  );

async function nouvellePage(largeur = 1280, hauteur = 900): Promise<Page> {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, locale: "fr-FR" });
  return ctx.newPage();
}

/** Une page d'enseignant sous licence : le chapitre pilote est réservé. */
async function pageSousLicence(largeur = 1280, hauteur = 900): Promise<Page> {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, locale: "fr-FR" });
  await enseignantSousLicence(ctx);
  return ctx.newPage();
}

describe("/cours : le catalogue par thème et le chapitre libre", () => {
  it("propose l'essai par défaut dans chacune de ses entreprises, range chaque chapitre une fois sous son thème, n'annonce que ce qui vient, sans déborder sur téléphone", async () => {
    const page = await nouvellePage(390, 844);
    await aller(page, "/cours");
    for (const code of entreprisesDeLEssai) {
      expect(await page.locator(`a[href="/cours/${essai.code}?entreprise=${code}"]`).count(), code).toBeGreaterThan(0);
    }
    // Les quatre briques et leur enchaînement, avant le catalogue.
    expect(await page.locator("[data-articulation] [data-brique]").count()).toBe(4);
    // Un tiroir par thème, fermés à l'arrivée : la page est un index, pas une carte à dérouler.
    expect(await page.locator("details[data-theme]").count()).toBe(THEMES.length);
    expect(await page.locator("details[data-theme][open]").count()).toBe(0);
    // Chaque chapitre proposé une fois dans le catalogue, sous son thème ; un chapitre retiré
    // (config/formations-proposees.ts) n'y est plus.
    for (const c of CHAPITRES.filter((x) => !chapitrePropose(x)))
      expect(await page.locator(`details[data-theme] [data-chapitre="${c.code}"]`).count(), c.code).toBe(0);
    for (const c of CHAPITRES.filter(chapitrePropose)) {
      const lignes = page.locator(`details[data-theme] [data-chapitre="${c.code}"]`);
      expect(await lignes.count(), c.code).toBe(1);
      expect(
        await page.locator(`details[data-theme="${themeDuChapitre(c.code)!.code}"] [data-chapitre="${c.code}"]`).count(),
        c.code,
      ).toBe(1);
    }
    // Ce qui vient se compte sur le programme d'un parcours qui se construit, jamais à la main ;
    // il s'annonce sous le thème de ses chapitres écrits : sans chapitre encore, il n'a pas de thème.
    const aVenir = PARCOURS.filter((p) => p.enPreparation).filter((p) => {
      const prevus = Object.values(PROGRAMME[p.code]).reduce((n, titres) => n + (titres?.length ?? 0), 0);
      const ecrits = CHAPITRES.filter((c) => c.parcours === p.code).length;
      return ecrits > 0 && prevus > ecrits;
    });
    expect(await page.locator("[data-a-venir]").count()).toBe(aVenir.length);
    // Chaque cas de synthèse paraît une fois, sous le thème des chapitres qu'il reprend.
    // Chaque chapitre porte son cas pratique dédié, sur sa ligne.
    for (const c of CHAPITRES.filter(chapitrePropose)) {
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

  it("le diplôme choisi montre son parcours : couverture, blocs, chapitres dans l'ordre, ateliers et épisodes", async () => {
    const page = await nouvellePage(390, 844);
    await aller(page, "/cours");
    // « Votre formation ? » : une tuile par diplôme, du bac STMG au DSCG (config/formations-proposees.ts) ;
    // la tuile est un lien, sans script.
    expect(await page.locator("[data-diplome-tuile]").first().getAttribute("data-diplome-tuile")).toBe("stmg");
    for (const code of FORMATIONS_RETIREES) expect(await page.locator(`[data-diplome-tuile="${code}"]`).count(), code).toBe(0);
    await page.locator('[data-diplome-tuile="bts-mco"]').click();
    await page.waitForURL(/diplome=bts-mco/);
    const programme = page.locator('[data-programme="bts-mco"]');
    expect(await programme.count()).toBe(1);
    const attendu = programmeDuDiplome("bts-mco")!;
    // L'en-tête dit ce que le cours couvre, pas l'arène (audit du 10 novembre 2026).
    expect(await programme.locator("[data-couverture-du-programme]").innerText().then(espacesOrdinaires)).toContain(
      couvertureDuCoursEnClair(coursDuDiplome("bts-mco")!),
    );
    expect(await programme.locator("[data-chapitre]").count()).toBe(
      attendu.themes.reduce((n, t) => n + t.chapitres.length, 0),
    );
    expect(await programme.locator("[data-episode]").count()).toBe(attendu.episodes.length);
    expect(await programme.locator('a[href="/parcours/bts-mco"]').count()).toBeGreaterThan(0);
    // Les chapitres, groupés par bloc du référentiel, numérotés dans l'ordre d'apprentissage.
    const parcours = coursDuDiplome("bts-mco")!;
    expect(await programme.locator("[data-bloc-du-diplome]").count()).toBe(parcours.blocs.length);
    // Une matière que le cours ne couvre pas encore en entier le dit (config/cours/matieres-en-entier.ts).
    expect(await programme.locator("[data-en-cours]").count()).toBe(parcours.blocs.filter((b) => b.enCours).length);
    expect(await programme.locator("[data-chapitre] [data-objectifs]").count()).toBe(
      parcours.blocs.reduce((n, b) => n + b.chapitres.length, 0),
    );
    // Un visiteur sans compte voit le cadenas des chapitres réservés.
    expect(await programme.locator("[data-cadenas]").count()).toBe(
      parcours.blocs.flatMap((b) => b.chapitres).filter((l) => !l.chapitre.libre).length,
    );
    // Sous le nom du diplôme, son chapitre libre et son cas (un chapitre libre par diplôme).
    const libre = essaiDuDiplome("bts-mco")!;
    expect(await programme.locator(`[data-essai-du-diplome="bts-mco"] [data-chapitre-libre="${libre.chapitre.code}"]`).getAttribute("href")).toMatch(/[?&]diplome=bts-mco(&|$)/);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    // Un diplôme qui a ses ateliers les propose.
    await aller(page, "/cours?diplome=bts-mco");
    expect(await page.locator('[data-programme="bts-mco"] a[href="/animations/mco"]').count()).toBe(1);
    await page.context().close();
  }, 60_000);
});

describe("le chapitre pilote, joué sans faute", () => {
  /**
   * Le chapitre pilote, de bout en bout, comme un élève qui ne se trompe pas : chaque écriture, chaque
   * question, chaque calcul, le curseur de la TVA et le laboratoire du premier bilan. Au téléphone, les
   * montants se tapent chiffre à chiffre, et le bouton de signe donne les négatifs.
   */
  async function jouerLePilote(page: Page, code: string, telephone = false) {
    const cas = casDeLEntreprise(code);
    const chapitre = chapitreDuCas(CHAPITRES[0]!, cas);
    await aller(page, chemin(code));
    for (const [i, etape] of chapitre.etapes.entries()) {
      await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(etape.titre);
      if (etape.tableau) expect(await tableauxDeLEtape(page)).toBe(1);
      // Sur téléphone, aucun tableau de l'étape ne défile en largeur.
      if (telephone) expect(await tableauxQuiDebordent(page), etape.id).toEqual([]);
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
      }
      const dernier = i === chapitre.etapes.length - 1;
      await page.getByRole("button", { name: dernier ? "Terminer le chapitre" : "Étape suivante" }).click();
    }
    const notees = chapitre.etapes.filter((e) => e.type !== "lecture").length;
    await expect
      .poll(() => page.locator("main").innerText().then(espacesOrdinaires), { timeout: 15_000 })
      .toContain(`${notees} étapes réussies du premier coup sur ${notees}`);
    return cas;
  }

  it("chez LA TABLE D'AUGUSTIN : chaque étape réussie du premier coup, jusqu'au bilan", async () => {
    const code = "bistrot";
    const page = await pageSousLicence();
    const cas = await jouerLePilote(page, code);

    // Et maintenant, jouez-le : la partie s'ouvre chez la même entreprise, au niveau de la mission.
    const mission = page.locator("[data-jouez-le]");
    expect(await mission.innerText().then(espacesOrdinaires)).toContain("Résultats › Finance › Bilan");
    const jouer = mission.getByRole("link", { name: `Jouer ${cas.entreprise} au niveau 1` });
    expect(await jouer.getAttribute("href")).toBe(`/jouer?secteur=${code}&niveau=1`);
    await jouer.click();
    await page.waitForURL(/\/jouer\?secteur=bistrot&niveau=1/, { timeout: 60_000 });
    await page.context().close();
  }, 240_000);

  it("chez NOVA, au téléphone : le crédit de TVA se tape avec le bouton de signe, et la page ne déborde pas", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await jouerLePilote(page, "nova", true);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await ctx.close();
  }, 240_000);
});

describe("l'erreur, le mode classe, la reprise et le téléphone", () => {
  async function jusquALApport(page: Page, url: string) {
    await aller(page, url);
    await page.getByRole("button", { name: "Étape suivante" }).click();
    await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires)).toBe("Les apports des associés");
  }

  it("une écriture à l'envers est corrigée point par point ; un indice, puis la correction après deux essais", async () => {
    const cas = casDeLEntreprise("nova");
    const page = await pageSousLicence();
    await jusquALApport(page, chemin("nova"));
    expect(await page.getByRole("button", { name: "Voir la correction" }).count()).toBe(0);
    await page.getByLabel("Compte, ligne 1", { exact: true }).fill("101");
    await page.getByLabel("Débit, ligne 1", { exact: true }).fill(String(cas.capital));
    await page.getByLabel("Compte, ligne 2", { exact: true }).fill("512");
    await page.getByLabel("Crédit, ligne 2", { exact: true }).fill(String(cas.capital));
    await page.getByRole("button", { name: "Valider l'écriture" }).click();
    await expect.poll(() => page.locator("main").innerText().then(espacesOrdinaires)).toContain("L'argent reçu en banque se passe au débit.");
    await page.getByRole("button", { name: "Un indice" }).click();
    expect(await page.locator("main").innerText().then(espacesOrdinaires)).toContain("compte de trésorerie, classe 5");
    await page.getByRole("button", { name: "Valider l'écriture" }).click();
    await page.getByRole("button", { name: "Voir la correction" }).click();
    await expect.poll(() => page.getByLabel("Compte, ligne 1", { exact: true }).inputValue()).toBe("512");
    expect(await page.getByRole("button", { name: "Étape suivante" }).count()).toBe(1);
    await page.context().close();
  }, 120_000);

  it("en classe, la correction se montre tout de suite ; le journal est ouvert", async () => {
    const page = await pageSousLicence();
    await jusquALApport(page, chemin("hotel", true));
    expect(await page.getByText("Mode classe").count()).toBe(1);
    await page.getByRole("button", { name: "Voir la correction" }).click();
    await expect.poll(() => page.getByRole("button", { name: "Étape suivante" }).count()).toBe(1);
    await page.getByRole("button", { name: "Étape suivante" }).click();
    expect(await page.locator("details[open]").innerText().then(espacesOrdinaires)).toContain("Apport en capital");
    await page.context().close();
  }, 120_000);

  it("le laboratoire ne porte pas sa solution : elle se demande au serveur après deux essais, et revient au rechargement", async () => {
    const code = "nova";
    const cas = casDeLEntreprise(code);
    const ordonne = chapitreDuCas(chapitre, cas);
    const index = ordonne.etapes.findIndex((e) => e.type === "simulation");
    const labo = ordonne.etapes[index]!;
    if (labo.type !== "simulation") throw new Error("pas de laboratoire dans le chapitre pilote");
    const { solution } = labo.defi(cas);
    const explication = labo.explication(cas, solution).map((p) => insecables(p));
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    await ctx.addInitScript(([cle, i]) => {
      if (!window.localStorage.getItem(cle as string)) window.localStorage.setItem(cle as string, JSON.stringify({ index: i, etapes: {} }));
    }, [`cours:${chapitre.code}:${code}`, index] as const);
    const page = await ctx.newPage();
    await aller(page, chemin(code));
    await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(labo.titre);
    // Ni l'explication à la solution ni la solution dans ce que la page a reçu (le HTML et ses données).
    const recu = await page.content();
    for (const p of explication) expect(recu, p).not.toContain(p.slice(0, 60));
    expect(recu).not.toContain("lectureDeLaSolution");
    const montrer = page.getByRole("button", { name: labo.montrer ?? "Montrer une solution" });
    expect(await montrer.count()).toBe(0);
    for (let n = 1; n <= 2; n++) {
      await page.getByRole("button", { name: "Valider cette position" }).click();
      await expect.poll(() => page.locator("details", { hasText: "Vos essais" }).locator("li").count()).toBe(n);
    }
    await montrer.click();
    await expect.poll(() => page.locator("[data-resultat-du-laboratoire]").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toContain(espacesOrdinaires(explication[0]!).slice(0, 40));
    for (const l of labo.leviers(cas).filter((x) => !x.choix)) expect(await page.getByLabel(l.libelle, { exact: true }).inputValue()).toBe(String(solution[l.code]));
    // Au rechargement, la position montrée se relit au serveur, explication comprise.
    await page.reload();
    await expect.poll(() => page.locator("[data-resultat-du-laboratoire]").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toContain(espacesOrdinaires(explication[0]!).slice(0, 40));
    await ctx.close();
  }, 120_000);

  it("la progression survit à un rechargement, et la page tient sur un téléphone", async () => {
    const page = await pageSousLicence(390, 844);
    await jusquALApport(page, chemin("transport"));
    await page.reload();
    await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires)).toBe("Les apports des associés");
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
    // Le parcours est requis (audit de l'offre, octobre 2026) : celui du chapitre pilote.
    await prof.getByLabel("Parcours du cours").selectOption(chapitre.parcours);
    await prof.getByLabel("Entreprise du cas").selectOption("hotel");
    await prof.getByRole("button", { name: "Créer la classe" }).click();
    await prof.waitForURL(/\/teacher\/cours\/[0-9a-f-]{36}/, { timeout: 60_000 });
    const code = (await prof.locator("[data-code-de-classe]").innerText().then(espacesOrdinaires)).trim();
    expect(code).toMatch(/^BTSCG1-/);
    const pageDeLaClasse = new URL(prof.url()).pathname;
    expect(await prof.locator("[data-calculatrice-de-la-classe]").getAttribute("data-calculatrice-de-la-classe")).toBe("permise");

    const eleve = await nouvellePage();
    // Une seule porte : le code de classe tapé dans « Rejoindre une partie » mène à la classe du cours.
    await aller(eleve, "/join");
    await eleve.locator('input[name="code"]').fill(code);
    await eleve.locator('input[name="pseudo"]').fill("Camille");
    await eleve.getByRole("button", { name: "Rejoindre la partie" }).click();
    await eleve.waitForURL(/\/cours\/rejoindre\?code=/, { timeout: 60_000 });
    await eleve.getByLabel("Prénom ou pseudonyme").fill("Camille");
    await eleve.getByRole("button", { name: "Rejoindre la classe" }).click();
    await eleve.waitForURL(/\/cours\?classe=rejointe/, { timeout: 60_000 });
    expect(await eleve.locator("[data-classe-du-cours]").innerText().then(espacesOrdinaires)).toContain("BTS CG 1 e2e");

    // L'entreprise imposée l'emporte sur celle de l'adresse.
    await aller(eleve, chemin("nova"));
    await expect.poll(() => eleve.locator("[data-en-classe]").innerText().then(espacesOrdinaires)).toContain("Camille");
    expect(await eleve.locator("main").innerText().then(espacesOrdinaires)).toContain("L'ESCALE");
    await eleve.getByRole("button", { name: "Étape suivante" }).click();
    const cas = casDeLEntreprise("hotel");
    await eleve.getByLabel("Compte, ligne 1", { exact: true }).fill("101");
    // La calculatrice : calculer, puis reporter le résultat dans la case où l'élève était.
    await eleve.getByLabel("Débit, ligne 1", { exact: true }).focus();
    await eleve.getByRole("button", { name: "Calculatrice" }).click();
    await eleve.getByLabel("Calcul", { exact: true }).fill(`${cas.capital} ÷ 2 × 2`);
    await eleve.getByLabel("Calcul", { exact: true }).press("Enter");
    await eleve.getByRole("button", { name: `Reporter ${cas.capital} dans « Débit, ligne 1 »` }).click();
    expect(await eleve.getByLabel("Débit, ligne 1", { exact: true }).inputValue()).toBe(String(cas.capital));
    await eleve.getByRole("button", { name: "Fermer la calculatrice" }).click();
    await eleve.getByLabel("Compte, ligne 2", { exact: true }).fill("512");
    await eleve.getByLabel("Crédit, ligne 2", { exact: true }).fill(String(cas.capital));
    await eleve.getByRole("button", { name: "Valider l'écriture" }).click();
    await expect.poll(() => eleve.locator("main").innerText().then(espacesOrdinaires)).toContain("se passe au débit");

    await expect
      .poll(
        async () => {
          await prof.reload();
          return prof.locator("[data-etape='apport']").innerText().then(espacesOrdinaires);
        },
        { timeout: 30_000 },
      )
      .toContain("L'argent reçu en banque se passe au débit.");
    expect(await prof.locator("[data-eleve='Camille']").count()).toBe(1);

    // Au mur : l'étape projetée, la remarque comptée, aucun nom d'élève.
    await prof.getByRole("link", { name: "Projeter l'étape « Les apports des associés »" }).click();
    await prof.waitForURL(/\/projection\?/, { timeout: 60_000 });
    await expect.poll(() => prof.locator("[data-remarques-projetees]").innerText().then(espacesOrdinaires)).toContain("L'argent reçu en banque se passe au débit.");
    expect(await prof.locator("[data-remarques-projetees]").innerText().then(espacesOrdinaires)).toContain("1 élève");
    expect(await prof.locator("main").innerText().then(espacesOrdinaires)).not.toContain("Camille");

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
    expect(await prof.locator("main").innerText().then(espacesOrdinaires)).not.toContain("Camille");

    // L'enseignant retire la calculatrice : l'élève ne la voit plus ; il la rend, elle revient.
    await aller(prof, pageDeLaClasse);
    await prof.getByRole("button", { name: "Retirer la calculatrice (calcul mental)" }).click();
    await prof.waitForURL(/fait=sans-calculatrice/, { timeout: 60_000 });
    expect(await prof.locator("[data-calculatrice-de-la-classe]").getAttribute("data-calculatrice-de-la-classe")).toBe("retiree");
    await eleve.reload();
    await expect.poll(() => eleve.locator("h1").count()).toBe(1);
    expect(await eleve.locator("[data-calculatrice]").count()).toBe(0);
    await prof.getByRole("button", { name: "Rendre la calculatrice" }).click();
    await prof.waitForURL(/fait=calculatrice/, { timeout: 60_000 });
    await eleve.reload();
    await expect.poll(() => eleve.locator("[data-calculatrice]").count()).toBe(1);
    await ctxProf.close();
    await eleve.context().close();
  }, 240_000);
});

describe("le seuil de rentabilité, chapitre libre du BTS MHR", () => {
  it("sans licence, le chapitre s'ouvre (le premier du parcours du BTS MHR) ; il se joue de bout en bout sans faute", async () => {
    const libre = await nouvellePage();
    await aller(libre, "/cours/seuil-de-rentabilite?entreprise=nova");
    expect(await libre.locator("main").innerText().then(espacesOrdinaires)).not.toContain("réservé aux établissements sous licence");
    await libre.context().close();

    const code = "nova";
    const cas = casDeLEntreprise(code);
    const chapitre = CHAPITRES.find((c) => c.code === "seuil-de-rentabilite")!;
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await aller(page, `/cours/${chapitre.code}?entreprise=${code}`);
    const etat = { soldes: {} };
    for (const [i, etape] of chapitre.etapes.entries()) {
      await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(etape.titre);
      if (etape.type === "tri") {
        for (const el of etape.elements(cas)) {
          const libelle = etape.categories.find((k) => k.code === el.categorie)!.libelle;
          await page.locator(`[data-element="${insecables(el.libelle)}"]`).getByRole("radio", { name: libelle, exact: true }).click();
        }
        await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      } else if (etape.type === "montants") {
        for (const c of etape.champs(cas, etat)) await page.getByLabel(c.libelle, { exact: true }).fill(virgule(c.attendu));
        await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      } else if (etape.type === "choix") {
        await page.getByRole("radio", { name: etape.options(cas, etat).find((o) => o.juste)!.texte, exact: true }).click();
      } else if (etape.type === "curseur") {
        await page.getByLabel(`${etape.grandeur?.(cas).libelle ?? "Ventes du mois"}, au clavier`, { exact: true }).fill(String(etape.cible(cas).attendu));
        await page.getByRole("button", { name: "Valider cette position" }).click();
      } else if (etape.type === "simulation") {
        const solution = etape.defi(cas).solution;
        for (const l of etape.leviers(cas)) await page.getByLabel(`${l.libelle}, au clavier`, { exact: true }).fill(virgule(solution[l.code]!));
        await page.getByRole("button", { name: "Valider cette position" }).click();
      }
      const dernier = i === chapitre.etapes.length - 1;
      await page.getByRole("button", { name: dernier ? "Terminer le chapitre" : "Étape suivante" }).click();
    }
    const notees = chapitre.etapes.filter((e) => e.type !== "lecture").length;
    await expect
      .poll(() => page.locator("main").innerText().then(espacesOrdinaires), { timeout: 15_000 })
      .toContain(`${notees} étapes réussies du premier coup sur ${notees}`);
    await ctx.close();
  }, 240_000);
});

describe.each([
  { code: "la-paie", entreprise: "hotel" },
  { code: "la-paie", entreprise: "conseil", telephone: true },
  { code: "l-emprunt", entreprise: "transport" },
  { code: "l-emprunt", entreprise: "nova", telephone: true },
  { code: "immobilisations", entreprise: "batiment" },
  { code: "immobilisations", entreprise: "conseil", telephone: true },
  { code: "les-stocks", entreprise: "ecommerce" },
  { code: "les-stocks", entreprise: "boutique", telephone: true },
  { code: "la-cloture", entreprise: "nova" },
  { code: "decider-apres-la-cloture", entreprise: "nova" },
  { code: "remises-et-reglements", entreprise: "conseil" },
  { code: "remises-et-reglements", entreprise: "nova", telephone: true },
  { code: "cout-complet", entreprise: "nova" },
  { code: "les-leviers-du-seuil", entreprise: "nova" },
  { code: "les-leviers-du-seuil", entreprise: "nova", telephone: true },
  // Au téléphone, des montants négatifs : l'élève tape les chiffres, puis le bouton de signe.
  { code: "cout-complet", entreprise: "nova", telephone: true },
  { code: "la-cloture", entreprise: "nova", telephone: true },
  { code: "decider-apres-la-cloture", entreprise: "nova", telephone: true },
  { code: "cout-par-produit", entreprise: "nova", telephone: true },
  { code: "budget-de-tresorerie", entreprise: "nova", telephone: true },
  { code: "le-cout-preetabli-et-les-budgets", entreprise: "nova" },
  { code: "le-budget-flexible", entreprise: "nova", telephone: true },
  { code: "les-ecarts-sur-charges-directes", entreprise: "nova", telephone: true },
  { code: "les-ecarts-sur-charges-indirectes", entreprise: "nova" },
  // Le coût complet pas à pas et la concordance des résultats : des tableaux à compléter, puis leurs cas.
  { code: "le-cout-complet-pas-a-pas", entreprise: "nova" },
  { code: "le-cout-complet-pas-a-pas", entreprise: "nova", telephone: true },
  { code: "la-concordance-des-resultats", entreprise: "nova" },
  { code: "la-concordance-des-resultats", entreprise: "nova", telephone: true },
  { code: "le-depannage-du-grossiste", entreprise: "nova" },
  { code: "si-la-gerante-se-payait", entreprise: "nova", telephone: true },
  { code: "les-ecarts-sur-ventes-et-marge", entreprise: "nova", telephone: true },
  { code: "analyse-des-ecarts", entreprise: "nova", telephone: true },
  { code: "les-ecarts-et-leurs-responsables", entreprise: "nova" },
  { code: "tableau-de-bord", entreprise: "nova", telephone: true },
  { code: "decider-prix-fabriquer-acheter", entreprise: "nova", telephone: true },
  { code: "depreciations-et-provisions", entreprise: "nova" },
  { code: "depreciations-et-provisions", entreprise: "nova", telephone: true },
  { code: "le-denouement-des-risques", entreprise: "nova" },
  { code: "le-denouement-des-risques", entreprise: "nova", telephone: true },
  { code: "regularisations-de-fin-d-exercice", entreprise: "nova" },
  { code: "regularisations-de-fin-d-exercice", entreprise: "nova", telephone: true },
  { code: "soldes-intermediaires-de-gestion", entreprise: "nova" },
  { code: "soldes-intermediaires-de-gestion", entreprise: "nova", telephone: true },
  { code: "bilan-fonctionnel-et-bfr", entreprise: "nova" },
  { code: "bilan-fonctionnel-et-bfr", entreprise: "nova", telephone: true },
  { code: "les-flux-de-l-entreprise", entreprise: "nova" },
  { code: "les-flux-de-l-entreprise", entreprise: "nova", telephone: true },
  { code: "charges-produits-encaissements", entreprise: "nova" },
  { code: "charges-produits-encaissements", entreprise: "nova", telephone: true },
  { code: "prix-cout-et-marge", entreprise: "nova" },
  { code: "prix-cout-et-marge", entreprise: "nova", telephone: true },
  { code: "taux-de-marque-et-coefficient", entreprise: "boutique" },
  { code: "taux-de-marque-et-coefficient", entreprise: "boutique", telephone: true },
  { code: "s-aligner-sur-le-concurrent", entreprise: "boutique" },
  { code: "s-aligner-sur-le-concurrent", entreprise: "boutique", telephone: true },
  { code: "indicateurs-du-point-de-vente", entreprise: "boutique", telephone: true },
  { code: "indicateurs-du-point-de-vente", entreprise: "boutique" },
  { code: "stock-du-point-de-vente", entreprise: "boutique" },
  { code: "stock-du-point-de-vente", entreprise: "boutique", telephone: true },
  { code: "prevoir-les-ventes", entreprise: "boutique", telephone: true },
  { code: "prevoir-les-ventes", entreprise: "boutique" },
  { code: "budget-du-point-de-vente", entreprise: "boutique" },
  { code: "budget-du-point-de-vente", entreprise: "boutique", telephone: true },
  { code: "seuil-du-point-de-vente", entreprise: "boutique" },
  { code: "seuil-du-point-de-vente", entreprise: "boutique", telephone: true },
  { code: "promotion-qui-paie", entreprise: "boutique" },
  { code: "promotion-qui-paie", entreprise: "boutique", telephone: true },
  { code: "assortiment", entreprise: "boutique", telephone: true },
  { code: "assortiment", entreprise: "boutique" },
  { code: "equipe-et-planning", entreprise: "boutique" },
  { code: "equipe-et-planning", entreprise: "boutique", telephone: true },
  { code: "tableau-de-bord-du-manager", entreprise: "boutique", telephone: true },
  { code: "tableau-de-bord-du-manager", entreprise: "boutique" },
  { code: "negocier-le-prix", entreprise: "conseil" },
  { code: "negocier-le-prix", entreprise: "conseil", telephone: true },
  { code: "remises-et-conditions", entreprise: "conseil" },
  { code: "remises-et-conditions", entreprise: "conseil", telephone: true },
  { code: "valeur-d-un-client", entreprise: "conseil" },
  { code: "valeur-d-un-client", entreprise: "conseil", telephone: true },
  { code: "cout-d-acquisition", entreprise: "conseil" },
  { code: "cout-d-acquisition", entreprise: "conseil", telephone: true },
  { code: "commissions-des-partenaires", entreprise: "conseil" },
  { code: "commissions-des-partenaires", entreprise: "conseil", telephone: true },
  { code: "portefeuille-abc", entreprise: "conseil" },
  { code: "portefeuille-abc", entreprise: "conseil", telephone: true },
  { code: "tableau-de-bord-commercial", entreprise: "conseil" },
  { code: "tableau-de-bord-commercial", entreprise: "conseil", telephone: true },
  { code: "marche-et-part-de-marche", entreprise: "nova" },
  { code: "marche-et-part-de-marche", entreprise: "nova", telephone: true },
  { code: "segmenter-et-cibler", entreprise: "nova" },
  { code: "segmenter-et-cibler", entreprise: "nova", telephone: true },
  { code: "prix-psychologique", entreprise: "nova" },
  { code: "prix-psychologique", entreprise: "nova", telephone: true },
  { code: "demande-et-prix", entreprise: "nova" },
  { code: "demande-et-prix", entreprise: "nova", telephone: true },
  { code: "ce-que-rapporte-la-communication", entreprise: "nova" },
  { code: "ce-que-rapporte-la-communication", entreprise: "nova", telephone: true },
  { code: "canaux-de-distribution", entreprise: "nova" },
  { code: "canaux-de-distribution", entreprise: "nova", telephone: true },
  { code: "lire-le-compte-de-resultat", entreprise: "nova" },
  { code: "lire-le-compte-de-resultat", entreprise: "nova", telephone: true },
  { code: "lire-le-bilan", entreprise: "nova" },
  { code: "lire-le-bilan", entreprise: "nova", telephone: true },
  { code: "valeur-ajoutee-et-partage", entreprise: "nova" },
  { code: "valeur-ajoutee-et-partage", entreprise: "nova", telephone: true },
  { code: "rentabilite", entreprise: "nova" },
  { code: "rentabilite", entreprise: "nova", telephone: true },
  { code: "fonds-de-roulement-et-tresorerie", entreprise: "nova" },
  { code: "fonds-de-roulement-et-tresorerie", entreprise: "nova", telephone: true },
  { code: "financer-l-entreprise", entreprise: "nova" },
  { code: "financer-l-entreprise", entreprise: "nova", telephone: true },
  { code: "effectif-et-masse-salariale", entreprise: "nova" },
  { code: "effectif-et-masse-salariale", entreprise: "nova", telephone: true },
  { code: "salaire-brut-net-cout", entreprise: "nova" },
  { code: "salaire-brut-net-cout", entreprise: "nova", telephone: true },
  { code: "recruter", entreprise: "nova" },
  { code: "recruter", entreprise: "nova", telephone: true },
  { code: "remuneration-et-motivation", entreprise: "nova" },
  { code: "remuneration-et-motivation", entreprise: "nova", telephone: true },
  { code: "former", entreprise: "nova" },
  { code: "former", entreprise: "nova", telephone: true },
  { code: "indicateurs-sociaux", entreprise: "nova" },
  { code: "indicateurs-sociaux", entreprise: "nova", telephone: true },
  { code: "choisir-son-fournisseur", entreprise: "nova" },
  { code: "choisir-son-fournisseur", entreprise: "nova", telephone: true },
  { code: "le-client-qui-paie-tard", entreprise: "nova" },
  { code: "le-client-qui-paie-tard", entreprise: "nova", telephone: true },
  { code: "s-assurer-contre-les-aleas", entreprise: "nova" },
  { code: "s-assurer-contre-les-aleas", entreprise: "nova", telephone: true },
  { code: "le-cout-de-la-non-qualite", entreprise: "nova" },
  { code: "le-cout-de-la-non-qualite", entreprise: "nova", telephone: true },
  { code: "le-depart-d-un-salarie", entreprise: "nova" },
  { code: "le-depart-d-un-salarie", entreprise: "nova", telephone: true },
  { code: "entretenir-l-outil", entreprise: "nova" },
  { code: "entretenir-l-outil", entreprise: "nova", telephone: true },
  { code: "le-diagnostic-strategique", entreprise: "nova" },
  { code: "le-diagnostic-strategique", entreprise: "nova", telephone: true },
  { code: "se-fixer-des-objectifs", entreprise: "nova" },
  { code: "se-fixer-des-objectifs", entreprise: "nova", telephone: true },
  { code: "couts-ou-differenciation", entreprise: "nova" },
  { code: "couts-ou-differenciation", entreprise: "nova", telephone: true },
  { code: "lire-la-strategie-des-concurrents", entreprise: "nova" },
  { code: "lire-la-strategie-des-concurrents", entreprise: "nova", telephone: true },
  { code: "croitre-en-investissant", entreprise: "nova" },
  { code: "croitre-en-investissant", entreprise: "nova", telephone: true },
  { code: "la-responsabilite-societale", entreprise: "nova" },
  { code: "la-responsabilite-societale", entreprise: "nova", telephone: true },
  { code: "ce-que-rapporte-l-engagement", entreprise: "nova" },
  { code: "ce-que-rapporte-l-engagement", entreprise: "nova", telephone: true },
  { code: "le-projet-d-entreprise", entreprise: "nova" },
  { code: "le-projet-d-entreprise", entreprise: "nova", telephone: true },
  { code: "organiser-l-activite", entreprise: "nova" },
  { code: "organiser-l-activite", entreprise: "nova", telephone: true },
  { code: "decider-avec-des-chiffres", entreprise: "nova" },
  { code: "decider-avec-des-chiffres", entreprise: "nova", telephone: true },
  { code: "evaluer-son-activite", entreprise: "nova" },
  { code: "evaluer-son-activite", entreprise: "nova", telephone: true },
  { code: "des-donnees-a-l-information", entreprise: "nova" },
  { code: "des-donnees-a-l-information", entreprise: "nova", telephone: true },
  { code: "construire-un-indicateur-juste", entreprise: "nova" },
  { code: "construire-un-indicateur-juste", entreprise: "nova", telephone: true },
  { code: "une-donnee-fausse", entreprise: "nova" },
  { code: "une-donnee-fausse", entreprise: "nova", telephone: true },
  { code: "ce-que-coute-un-outil-numerique", entreprise: "nova" },
  { code: "ce-que-coute-un-outil-numerique", entreprise: "nova", telephone: true },
  // Les cas pratiques s'ouvrent et se jouent comme un chapitre réservé.
  { code: "suivre-la-baisse-du-concurrent", entreprise: "nova" },
  { code: "suivre-la-baisse-du-concurrent", entreprise: "nova", telephone: true },
  { code: "la-facture-contestee", entreprise: "batiment" },
  { code: "la-facture-contestee", entreprise: "conseil", telephone: true },
  { code: "le-rendez-vous-a-la-banque", entreprise: "nova" },
  { code: "le-rendez-vous-a-la-banque", entreprise: "nova", telephone: true },
  { code: "commander-pour-la-promotion", entreprise: "boutique" },
  { code: "commander-pour-la-promotion", entreprise: "bistrot", telephone: true },
  { code: "quel-prix-pour-la-saison", entreprise: "nova" },
  { code: "quel-prix-pour-la-saison", entreprise: "nova", telephone: true },
  { code: "la-remise-du-grand-compte", entreprise: "transport" },
  { code: "la-remise-du-grand-compte", entreprise: "batiment", telephone: true },
  { code: "embaucher-pour-la-saison", entreprise: "nova" },
  { code: "embaucher-pour-la-saison", entreprise: "nova", telephone: true },
  // Le cas dédié de chaque chapitre, joué une fois, en alternant ordinateur et téléphone.
  { code: "l-acompte-du-client", entreprise: "nova" },
  { code: "rembourser-une-part-du-pret", entreprise: "nova", telephone: true },
  { code: "la-commande-du-31-janvier", entreprise: "transport" },
  // La suite du chapitre pilote (audit pédagogique : les trente étapes coupées en deux) et son cas.
  { code: "du-resultat-a-la-tresorerie", entreprise: "nova" },
  { code: "du-resultat-a-la-tresorerie", entreprise: "bistrot", telephone: true },
  { code: "le-client-paie-a-la-commande", entreprise: "hotel" },
  { code: "l-escompte-demande-par-le-client", entreprise: "bistrot", telephone: true },
  { code: "la-commande-du-31-janvier", entreprise: "hotel", telephone: true }, // son curseur au téléphone aussi
  { code: "l-escompte-demande-par-le-client", entreprise: "batiment" }, // son curseur sur ordinateur aussi
  { code: "la-prime-exceptionnelle", entreprise: "batiment" },
  { code: "la-prime-exceptionnelle", entreprise: "conseil", telephone: true },
  { code: "un-deuxieme-pret", entreprise: "hotel", telephone: true },
  { code: "un-deuxieme-pret", entreprise: "nova" },
  { code: "un-second-equipement", entreprise: "fitness" },
  { code: "un-second-equipement", entreprise: "hotel", telephone: true },
  { code: "le-stock-qui-manque", entreprise: "boutique", telephone: true },
  { code: "le-stock-qui-manque", entreprise: "ecommerce" },
  { code: "acheter-avant-la-cloture", entreprise: "nova" },
  { code: "la-creance-qui-se-degrade", entreprise: "nova", telephone: true },
  { code: "l-assurance-sur-plusieurs-annees", entreprise: "nova" },
  { code: "la-hausse-des-salaires", entreprise: "nova", telephone: true },
  { code: "l-investisseuse-au-capital", entreprise: "nova" },
  { code: "un-technicien-plutot-qu-un-prestataire", entreprise: "nova", telephone: true },
  { code: "ce-qu-exige-le-fonds", entreprise: "nova" },
  { code: "le-fournisseur-raccourcit-ses-delais", entreprise: "nova", telephone: true },
  { code: "l-annuite-du-pret", entreprise: "nova" },
  { code: "quand-le-taux-monte", entreprise: "nova", telephone: true },
  { code: "vendre-plus-financer-plus", entreprise: "nova" },
  { code: "le-fournisseur-augmente", entreprise: "nova", telephone: true },
  { code: "le-loyer-qui-augmente", entreprise: "nova" },
  { code: "un-nouveau-client-regulier", entreprise: "nova", telephone: true },
  { code: "la-cle-contestee", entreprise: "nova" },
  { code: "un-trimestre-de-croissance", entreprise: "nova", telephone: true },
  { code: "le-budget-depasse", entreprise: "nova" },
  { code: "le-fournisseur-ou-l-atelier", entreprise: "nova", telephone: true },
  { code: "le-centre-qui-a-trop-tourne", entreprise: "nova", telephone: true },
  { code: "l-objectif-du-commercial", entreprise: "nova" },
  { code: "le-resultat-qui-manque", entreprise: "nova", telephone: true },
  { code: "regler-le-voyant", entreprise: "nova", telephone: true },
  { code: "monter-son-prix", entreprise: "nova" },
  { code: "garder-sa-part-de-marche", entreprise: "nova", telephone: true },
  { code: "quel-segment-conquerir", entreprise: "nova" },
  { code: "une-promotion-trop-forte", entreprise: "nova", telephone: true },
  { code: "repercuter-la-hausse-du-fournisseur", entreprise: "nova" },
  { code: "une-rallonge-pour-la-campagne", entreprise: "nova", telephone: true },
  { code: "l-intermediaire-veut-payer-plus-tard", entreprise: "nova" },
  { code: "la-remise-autorisee", entreprise: "conseil", telephone: true },
  { code: "la-remise-par-palier", entreprise: "conseil" },
  { code: "le-programme-de-fidelite", entreprise: "conseil", telephone: true },
  { code: "couper-le-budget-de-campagne", entreprise: "conseil" },
  { code: "la-mise-en-avant-payante", entreprise: "conseil", telephone: true },
  { code: "abandonner-les-petits-comptes", entreprise: "conseil" },
  { code: "l-objectif-de-taux-de-service", entreprise: "conseil", telephone: true },
  { code: "l-etiquette-du-concurrent", entreprise: "boutique" },
  { code: "moins-de-clients-le-mois-prochain", entreprise: "boutique", telephone: true },
  { code: "alleger-le-stock", entreprise: "boutique" },
  { code: "prevoir-le-trimestre-creux", entreprise: "boutique", telephone: true },
  { code: "reviser-le-budget", entreprise: "boutique" },
  { code: "ferme-pour-travaux", entreprise: "boutique", telephone: true },
  { code: "jusqu-ou-remiser", entreprise: "boutique" },
  { code: "retirer-une-reference", entreprise: "boutique", telephone: true },
  { code: "l-accord-de-branche", entreprise: "boutique" },
  { code: "le-trimestre-face-a-l-objectif", entreprise: "boutique", telephone: true },
  { code: "l-augmentation-generale", entreprise: "nova" },
  { code: "la-prime-de-fin-d-annee", entreprise: "nova", telephone: true },
  { code: "embaucher-un-trimestre-plus-tard", entreprise: "nova" },
  { code: "l-equipe-demande-une-augmentation", entreprise: "nova", telephone: true },
  { code: "doubler-le-budget-de-formation", entreprise: "nova" },
  { code: "la-masse-salariale-qui-baisse", entreprise: "nova", telephone: true },
  { code: "le-fournisseur-allonge-son-delai", entreprise: "nova" },
  { code: "escompter-chaque-trimestre", entreprise: "nova", telephone: true },
  { code: "l-assureur-augmente-la-prime", entreprise: "nova" },
  { code: "une-seule-demarche-qualite", entreprise: "nova", telephone: true },
  { code: "recruter-des-l-annonce-du-depart", entreprise: "nova" },
  { code: "entretenir-au-seuil", entreprise: "nova", telephone: true },
  { code: "des-clients-repartis-sans-etre-servis", entreprise: "nova" },
  { code: "un-objectif-plus-ambitieux", entreprise: "nova", telephone: true },
  { code: "baisser-les-prix-sans-rien-couper", entreprise: "nova" },
  { code: "aller-dans-l-espace-libre", entreprise: "nova", telephone: true },
  { code: "voir-plus-grand", entreprise: "nova" },
  { code: "viser-le-label", entreprise: "nova", telephone: true },
  { code: "un-equipement-de-plus-au-depart", entreprise: "nova" },
  { code: "la-commande-exceptionnelle", entreprise: "nova", telephone: true },
  { code: "doubler-la-publicite", entreprise: "nova" },
  { code: "le-second-semestre-a-t-il-ete-meilleur", entreprise: "nova", telephone: true },
  { code: "le-trimestre-le-plus-fort", entreprise: "nova" },
  { code: "la-part-de-marche-annoncee", entreprise: "nova", telephone: true },
  { code: "la-case-vide", entreprise: "nova" },
  { code: "une-seconde-journee-de-formation", entreprise: "nova", telephone: true },
  { code: "le-cout-matiere", entreprise: "bistrot" },
  { code: "le-cout-matiere", entreprise: "bistrot", telephone: true },
  { code: "occupation-et-revenu-par-chambre", entreprise: "hotel" },
  { code: "occupation-et-revenu-par-chambre", entreprise: "hotel", telephone: true },
  { code: "la-productivite-du-service", entreprise: "bistrot" },
  { code: "la-productivite-du-service", entreprise: "hotel", telephone: true },
  { code: "le-prix-selon-la-saison", entreprise: "hotel" },
  { code: "le-prix-selon-la-saison", entreprise: "hotel", telephone: true },
  { code: "monter-la-carte-ou-preparer-juste", entreprise: "bistrot" },
  { code: "s-aligner-sur-le-prix-du-concurrent", entreprise: "hotel", telephone: true },
  { code: "le-cout-du-trimestre-creux", entreprise: "bistrot" },
  { code: "plus-cher-au-plus-fort-de-la-saison", entreprise: "hotel", telephone: true },
  { code: "la-declaration-de-tva", entreprise: "batiment" },
  { code: "la-declaration-de-tva", entreprise: "batiment", telephone: true },
  { code: "encaissements-ou-debits", entreprise: "batiment" },
  { code: "encaissements-ou-debits", entreprise: "batiment", telephone: true },
  { code: "la-tva-et-la-tresorerie", entreprise: "batiment" },
  { code: "la-tva-et-la-tresorerie", entreprise: "batiment", telephone: true },
  { code: "l-impot-sur-les-societes", entreprise: "nova" },
  { code: "l-impot-sur-les-societes", entreprise: "nova", telephone: true },
  { code: "le-deficit-reporte", entreprise: "ecommerce" },
  { code: "le-deficit-reporte", entreprise: "ecommerce", telephone: true },
  { code: "la-tva-du-dernier-trimestre", entreprise: "batiment", telephone: true },
  { code: "la-tva-avancee-pour-le-client", entreprise: "batiment" },
  { code: "la-depense-de-fin-d-annee", entreprise: "nova", telephone: true },
  { code: "la-depense-de-l-annee-en-perte", entreprise: "ecommerce" },
  { code: "le-stock-de-securite", entreprise: "nova" },
  { code: "le-stock-de-securite", entreprise: "nova", telephone: true },
  { code: "ce-que-coute-une-livraison", entreprise: "nova" },
  { code: "ce-que-coute-une-livraison", entreprise: "nova", telephone: true },
  { code: "le-taux-de-remplissage", entreprise: "nova" },
  { code: "le-taux-de-remplissage", entreprise: "nova", telephone: true },
  { code: "livrer-a-temps", entreprise: "nova" },
  { code: "livrer-a-temps", entreprise: "nova", telephone: true },
  { code: "le-point-de-commande-avant-le-pic", entreprise: "nova" },
  { code: "le-gazole-qui-augmente", entreprise: "nova", telephone: true },
  { code: "le-lot-de-la-bourse-de-fret", entreprise: "nova" },
  { code: "combien-charger-pendant-la-panne", entreprise: "nova", telephone: true },
  { code: "la-valeur-actuelle-nette", entreprise: "nova" },
  { code: "la-valeur-actuelle-nette", entreprise: "nova", telephone: true },
  { code: "le-tri-et-le-choix-entre-deux-projets", entreprise: "nova" },
  { code: "le-tri-et-le-choix-entre-deux-projets", entreprise: "nova", telephone: true },
  { code: "l-effet-de-levier", entreprise: "hotel" },
  { code: "l-effet-de-levier", entreprise: "hotel", telephone: true },
  { code: "la-creation-de-valeur", entreprise: "hotel" },
  { code: "la-creation-de-valeur", entreprise: "hotel", telephone: true },
  { code: "revendre-la-machine-plus-tot", entreprise: "nova" },
  { code: "acheter-les-deux-machines", entreprise: "nova", telephone: true },
  { code: "le-levier-face-a-la-hausse-du-taux", entreprise: "hotel" },
  { code: "ce-que-doit-rapporter-l-exploitation", entreprise: "hotel", telephone: true },
  // L'UE10 du DCG, comptabilité approfondie, chez NOVA : les cinq chapitres, puis leurs cas.
  { code: "les-composants-et-l-amortissement-derogatoire", entreprise: "nova" },
  { code: "les-composants-et-l-amortissement-derogatoire", entreprise: "nova", telephone: true },
  { code: "le-test-de-depreciation", entreprise: "nova" },
  { code: "le-test-de-depreciation", entreprise: "nova", telephone: true },
  { code: "les-operations-en-devises", entreprise: "nova" },
  { code: "les-operations-en-devises", entreprise: "nova", telephone: true },
  { code: "les-contrats-a-long-terme", entreprise: "nova" },
  { code: "les-contrats-a-long-terme", entreprise: "nova", telephone: true },
  { code: "l-augmentation-de-capital", entreprise: "nova" },
  { code: "l-augmentation-de-capital", entreprise: "nova", telephone: true },
  { code: "les-moteurs-qui-s-usent-plus-vite", entreprise: "nova" },
  { code: "vendre-la-ligne-ou-la-garder", entreprise: "nova", telephone: true },
  { code: "couvrir-la-creance-en-dollars", entreprise: "nova" },
  { code: "le-chantier-qui-derape", entreprise: "nova", telephone: true },
  { code: "le-prix-de-l-investisseuse", entreprise: "nova" },
  { code: "recevoir-une-livraison", entreprise: "boutique" },
  { code: "recevoir-une-livraison", entreprise: "boutique", telephone: true },
  { code: "remplir-le-rayon", entreprise: "boutique" },
  { code: "remplir-le-rayon", entreprise: "boutique", telephone: true },
  { code: "le-prix-affiche", entreprise: "boutique" },
  { code: "le-prix-affiche", entreprise: "boutique", telephone: true },
  { code: "tenir-la-caisse", entreprise: "boutique" },
  { code: "tenir-la-caisse", entreprise: "boutique", telephone: true },
  { code: "les-deux-ecarts", entreprise: "boutique" },
  { code: "tenir-jusqu-au-reassort", entreprise: "boutique", telephone: true },
  { code: "la-promotion-de-noel", entreprise: "boutique" },
  { code: "la-caisse-du-trimestre-de-noel", entreprise: "boutique", telephone: true },
  { code: "le-panier-moyen", entreprise: "boutique" },
  { code: "le-panier-moyen", entreprise: "boutique", telephone: true },
  { code: "suivre-ses-ventes", entreprise: "boutique" },
  { code: "suivre-ses-ventes", entreprise: "boutique", telephone: true },
  { code: "le-panier-de-fin-d-annee", entreprise: "boutique" },
  { code: "l-objectif-de-l-ete", entreprise: "boutique", telephone: true },
  { code: "le-client-qui-revient", entreprise: "boutique" },
  { code: "le-client-qui-revient", entreprise: "boutique", telephone: true },
  { code: "un-nouveau-client", entreprise: "boutique" },
  { code: "un-nouveau-client", entreprise: "boutique", telephone: true },
  { code: "les-travaux-de-l-ete", entreprise: "boutique" },
  { code: "une-campagne-plus-forte", entreprise: "boutique", telephone: true },
  { code: "l-offre-et-la-demande", entreprise: "nova" },
  { code: "l-offre-et-la-demande", entreprise: "nova", telephone: true },
  { code: "le-prix-d-equilibre", entreprise: "nova" },
  { code: "le-prix-d-equilibre", entreprise: "nova", telephone: true },
  { code: "mettre-plus-en-vente", entreprise: "nova" },
  { code: "le-prix-de-fin-d-annee", entreprise: "nova", telephone: true },
  { code: "la-concurrence", entreprise: "nova" },
  { code: "la-concurrence", entreprise: "nova", telephone: true },
  { code: "creer-des-richesses", entreprise: "nova" },
  { code: "creer-des-richesses", entreprise: "nova", telephone: true },
  { code: "de-combien-monter-le-prix", entreprise: "nova" },
  { code: "le-marche-a-t-il-grandi", entreprise: "nova", telephone: true },
  { code: "produire", entreprise: "nova" },
  { code: "produire", entreprise: "nova", telephone: true },
  { code: "produire-bien", entreprise: "nova" },
  { code: "produire-bien", entreprise: "nova", telephone: true },
  { code: "deux-embauches-pour-produire-plus", entreprise: "nova" },
  { code: "la-moitie-du-budget-qualite", entreprise: "nova" },
  { code: "les-acteurs-et-la-valeur", entreprise: "nova" },
  { code: "les-acteurs-et-la-valeur", entreprise: "nova", telephone: true },
  { code: "decider-ensemble", entreprise: "nova" },
  { code: "decider-ensemble", entreprise: "nova", telephone: true },
  { code: "les-clients-demandent-une-baisse", entreprise: "nova" },
  { code: "chacun-son-levier", entreprise: "nova", telephone: true },
  { code: "une-information-a-temps", entreprise: "nova" },
  { code: "une-information-a-temps", entreprise: "nova", telephone: true },
  { code: "le-compte-rendu-en-retard", entreprise: "nova" },
  // Piloter un centre : prix de cession, coût cible, PGI et reporting (tableaux à compléter, curseur, laboratoire), puis son cas.
  { code: "piloter-un-centre", entreprise: "nova" },
  { code: "piloter-un-centre", entreprise: "nova", telephone: true },
  { code: "le-sous-traitant-baisse-son-prix", entreprise: "nova", telephone: true },
  // Le BTS CG P5 : la prévision des ventes et la méthode ABC, des tableaux à compléter et des laboratoires, puis leurs cas.
  { code: "la-prevision-des-ventes", entreprise: "nova" },
  { code: "la-prevision-des-ventes", entreprise: "nova", telephone: true },
  { code: "les-jeux-du-printemps", entreprise: "nova" },
  { code: "les-couts-a-base-d-activites", entreprise: "nova" },
  { code: "les-couts-a-base-d-activites", entreprise: "nova", telephone: true },
  { code: "la-remise-de-sonora", entreprise: "nova", telephone: true },
  // Des ventes aux achats et l'équilibre de la trésorerie : des tableaux à compléter, un curseur, un laboratoire, puis leurs cas.
  { code: "des-ventes-aux-achats", entreprise: "nova" },
  { code: "des-ventes-aux-achats", entreprise: "nova", telephone: true },
  { code: "equilibrer-la-tresorerie", entreprise: "nova" },
  { code: "equilibrer-la-tresorerie", entreprise: "nova", telephone: true },
  { code: "si-le-fournisseur-fermait-en-mai", entreprise: "nova" },
  { code: "un-banc-plus-cher", entreprise: "nova", telephone: true },
  // Le seuil de profitabilité en avenir aléatoire et le pilotage de la qualité (DCG UE 11) : un curseur, un laboratoire, un tableau à compléter, puis leurs cas.
  { code: "le-seuil-en-avenir-aleatoire", entreprise: "nova" },
  { code: "le-seuil-en-avenir-aleatoire", entreprise: "nova", telephone: true },
  { code: "piloter-la-qualite", entreprise: "nova" },
  { code: "piloter-la-qualite", entreprise: "nova", telephone: true },
  { code: "une-campagne-au-succes-incertain", entreprise: "nova" },
  { code: "des-aimants-moins-chers", entreprise: "nova", telephone: true },
  // La DCG UE11 2025 : la masse salariale, le coût cible et les coûts cachés, les indicateurs de durabilité, et leurs cas.
  { code: "la-masse-salariale-previsionnelle", entreprise: "nova" },
  { code: "la-masse-salariale-previsionnelle", entreprise: "nova", telephone: true },
  { code: "cout-cible-et-couts-caches", entreprise: "nova" },
  { code: "cout-cible-et-couts-caches", entreprise: "nova", telephone: true },
  { code: "les-indicateurs-de-durabilite", entreprise: "nova" },
  { code: "les-indicateurs-de-durabilite", entreprise: "nova", telephone: true },
  { code: "la-hausse-avancee-en-juillet", entreprise: "nova" },
  { code: "le-concurrent-lance-une-nomade", entreprise: "nova", telephone: true },
  { code: "les-indicateurs-que-demande-campustech", entreprise: "nova" },
  // La DCG UE11 : le contrôle de gestion dans l'organisation et la démarche budgétaire (tris, curseurs, laboratoires), puis leurs cas.
  { code: "le-controle-de-gestion-dans-l-organisation", entreprise: "nova" },
  { code: "le-controle-de-gestion-dans-l-organisation", entreprise: "nova", telephone: true },
  { code: "la-demarche-budgetaire", entreprise: "nova" },
  { code: "la-demarche-budgetaire", entreprise: "nova", telephone: true },
  { code: "un-mauvais-mois-pour-l-atelier", entreprise: "nova" },
  { code: "la-publicite-ligne-par-ligne", entreprise: "nova", telephone: true },
  // Les techniques prévisionnelles de la DCG UE11 : des laboratoires, des tableaux à compléter, puis leurs cas.
  { code: "programmer-la-production", entreprise: "nova" },
  { code: "programmer-la-production", entreprise: "nova", telephone: true },
  { code: "approvisionner-au-moindre-cout", entreprise: "nova" },
  { code: "approvisionner-au-moindre-cout", entreprise: "nova", telephone: true },
  { code: "correlation-et-lissage", entreprise: "nova" },
  { code: "correlation-et-lissage", entreprise: "nova", telephone: true },
  { code: "le-banc-perd-une-journee", entreprise: "nova" },
  { code: "deux-commandes-par-an", entreprise: "nova", telephone: true },
  { code: "janvier-est-tombe", entreprise: "nova" },
  { code: "le-systeme-d-information-comptable", entreprise: "nova" },
  { code: "le-systeme-d-information-comptable", entreprise: "nova", telephone: true },
  { code: "controler-les-comptes", entreprise: "nova" },
  { code: "controler-les-comptes", entreprise: "nova", telephone: true },
  { code: "la-balance-qui-ne-tombe-pas-juste", entreprise: "nova" },
  { code: "le-releve-du-fournisseur", entreprise: "nova", telephone: true },
  { code: "capacite-de-remboursement", entreprise: "nova" },
  { code: "capacite-de-remboursement", entreprise: "nova", telephone: true },
  { code: "financer-autrement", entreprise: "nova" },
  { code: "financer-autrement", entreprise: "nova", telephone: true },
  // Le Bac STMG gestion et finance, 3.2 et 3.3 : optimiser la trésorerie et l'affectation du résultat, un curseur et un laboratoire chacun, puis leurs cas.
  { code: "optimiser-la-tresorerie", entreprise: "nova" },
  { code: "optimiser-la-tresorerie", entreprise: "nova", telephone: true },
  { code: "l-affectation-du-resultat", entreprise: "nova" },
  { code: "l-affectation-du-resultat", entreprise: "nova", telephone: true },
  { code: "la-banque-propose-l-escompte", entreprise: "nova" },
  { code: "l-associe-qui-veut-plus", entreprise: "nova", telephone: true },
  // Les ratios de structure et le bilan financier, puis financer et placer la trésorerie : un tri, un tableau à compléter, des curseurs, des laboratoires, puis leurs cas.
  { code: "ratios-de-structure-et-bilan-financier", entreprise: "nova" },
  { code: "ratios-de-structure-et-bilan-financier", entreprise: "nova", telephone: true },
  { code: "financer-et-placer-la-tresorerie", entreprise: "nova" },
  { code: "financer-et-placer-la-tresorerie", entreprise: "nova", telephone: true },
  { code: "un-dividende-sous-condition", entreprise: "nova" },
  { code: "une-chaine-nouvelle-a-60-jours", entreprise: "nova", telephone: true },
  // Le BTS CG P6 6.5.2 : emprunt ou crédit-bail et le plan de financement, des tableaux à compléter, un curseur et un laboratoire chacun, puis leurs cas.
  { code: "emprunt-ou-credit-bail", entreprise: "nova" },
  { code: "emprunt-ou-credit-bail", entreprise: "nova", telephone: true },
  { code: "le-plan-de-financement", entreprise: "nova" },
  { code: "le-plan-de-financement", entreprise: "nova", telephone: true },
  { code: "le-banc-en-credit-bail", entreprise: "nova" },
  { code: "la-banque-plafonne-son-pret", entreprise: "nova", telephone: true },
  // Le BTS CG P6, 6.6.1 et 6.6.2 : le tableau de financement et le tableau des flux de trésorerie, des tableaux à compléter et un laboratoire chacun, puis leurs cas.
  { code: "le-tableau-de-financement", entreprise: "nova" },
  { code: "le-tableau-de-financement", entreprise: "nova", telephone: true },
  { code: "le-tableau-des-flux-de-tresorerie", entreprise: "nova" },
  { code: "le-tableau-des-flux-de-tresorerie", entreprise: "nova", telephone: true },
  { code: "la-seconde-ligne-payee-en-decembre", entreprise: "nova" },
  { code: "le-dividende-de-l-associe", entreprise: "nova", telephone: true },
  // La DCG UE6 2.1, 3.4 et 3.3 : la valeur et le temps, le marché financier, les coûts de financement, des tableaux à compléter, un curseur et un laboratoire chacun, puis leurs cas.
  { code: "la-valeur-et-le-temps", entreprise: "nova" },
  { code: "la-valeur-et-le-temps", entreprise: "nova", telephone: true },
  { code: "le-marche-financier", entreprise: "nova" },
  { code: "le-marche-financier", entreprise: "nova", telephone: true },
  { code: "arbitrer-les-couts-de-financement", entreprise: "nova" },
  { code: "arbitrer-les-couts-de-financement", entreprise: "nova", telephone: true },
  { code: "le-compte-a-terme-progressif", entreprise: "nova" },
  { code: "l-obligation-verte-a-980", entreprise: "nova", telephone: true },
  { code: "l-associe-qui-prefere-la-dette", entreprise: "nova" },
  // La DCG UE6, 2.2, 3.1 et 3.2 : le BFR d'exploitation normatif et les acteurs et les modes de financement, un tableau à compléter, des tris, un curseur et un laboratoire chacun, puis leurs cas.
  { code: "le-bfr-d-exploitation-normatif", entreprise: "nova" },
  { code: "le-bfr-d-exploitation-normatif", entreprise: "nova", telephone: true },
  { code: "les-acteurs-et-les-modes-de-financement", entreprise: "nova" },
  { code: "les-acteurs-et-les-modes-de-financement", entreprise: "nova", telephone: true },
  { code: "campustech-double-sa-commande", entreprise: "nova" },
  { code: "la-banque-demande-une-garantie", entreprise: "nova", telephone: true },
  // Le DCG UE6 (programme 2025) : le diagnostic financier et extra-financier sur trois exercices et l'investissement durable, un laboratoire chacun, puis leurs cas.
  { code: "le-diagnostic-financier-et-extra-financier", entreprise: "nova" },
  { code: "le-diagnostic-financier-et-extra-financier", entreprise: "nova", telephone: true },
  { code: "evaluer-un-investissement-durable", entreprise: "nova" },
  { code: "evaluer-un-investissement-durable", entreprise: "nova", telephone: true },
  { code: "le-pret-indexe-sur-la-durabilite", entreprise: "nova" },
  { code: "deux-devis-pour-chauffer-l-atelier", entreprise: "nova", telephone: true },
  // Le BTS MCO, bloc 1 : la zone de chalandise, interroger les clients, la vente conseil, fidéliser la clientèle (tris, curseurs, laboratoires), puis leurs cas.
  { code: "zone-de-chalandise", entreprise: "boutique" },
  { code: "zone-de-chalandise", entreprise: "boutique", telephone: true },
  { code: "interroger-les-clients", entreprise: "boutique" },
  { code: "interroger-les-clients", entreprise: "boutique", telephone: true },
  { code: "la-vente-conseil", entreprise: "boutique" },
  { code: "la-vente-conseil", entreprise: "boutique", telephone: true },
  { code: "fideliser-la-clientele", entreprise: "boutique" },
  { code: "fideliser-la-clientele", entreprise: "boutique", telephone: true },
  { code: "un-tract-pour-quelle-zone", entreprise: "boutique" },
  { code: "faut-il-livrer-a-domicile", entreprise: "boutique", telephone: true },
  { code: "le-samedi-apres-la-formation", entreprise: "boutique" },
  { code: "la-carte-du-prestataire", entreprise: "boutique", telephone: true },
  // Le BTS MCO, bloc 2 : le marché et le réseau, le fournisseur, la communication locale, la réimplantation (un tableau à compléter, un curseur et un laboratoire chacun), puis leurs cas ; et les compléments de l'assortiment, de la promotion et de « S'aligner sur le concurrent ».
  { code: "le-marche-et-le-reseau", entreprise: "boutique" },
  { code: "le-marche-et-le-reseau", entreprise: "boutique", telephone: true },
  { code: "choisir-et-negocier-le-fournisseur", entreprise: "boutique" },
  { code: "choisir-et-negocier-le-fournisseur", entreprise: "boutique", telephone: true },
  { code: "communiquer-et-animer-en-local", entreprise: "boutique" },
  { code: "communiquer-et-animer-en-local", entreprise: "boutique", telephone: true },
  { code: "reimplanter-avant-les-soldes", entreprise: "boutique" },
  { code: "reimplanter-avant-les-soldes", entreprise: "boutique", telephone: true },
  { code: "une-seconde-enseigne", entreprise: "boutique" },
  { code: "un-quatrieme-faconnier", entreprise: "boutique", telephone: true },
  { code: "mille-euros-pour-communiquer", entreprise: "boutique" },
  { code: "le-rayonnage-qui-resiste", entreprise: "boutique", telephone: true },
  // Le BTS MCO, bloc 3, gestion et finance de la boutique : facturer, le compte de résultat, le bilan et le BFR, la rénovation, puis leurs cas.
  { code: "facturer-et-se-faire-payer", entreprise: "boutique" },
  { code: "facturer-et-se-faire-payer", entreprise: "boutique", telephone: true },
  { code: "le-compte-de-resultat-de-la-boutique", entreprise: "boutique" },
  { code: "le-compte-de-resultat-de-la-boutique", entreprise: "boutique", telephone: true },
  { code: "le-bilan-et-le-bfr-de-la-boutique", entreprise: "boutique" },
  { code: "le-bilan-et-le-bfr-de-la-boutique", entreprise: "boutique", telephone: true },
  { code: "renover-la-boutique", entreprise: "boutique" },
  { code: "renover-la-boutique", entreprise: "boutique", telephone: true },
  { code: "le-comite-qui-paie-en-retard", entreprise: "boutique" },
  { code: "le-bail-revise", entreprise: "boutique", telephone: true },
  { code: "le-decouvert-demande-au-banquier", entreprise: "boutique" },
  { code: "un-pret-sur-sept-ans", entreprise: "boutique", telephone: true },
  // Le BTS MCO, blocs 3 et 4 : l'inventaire et la démarque, recruter, rémunérer, le climat de l'équipe, un tableau à compléter, des tris, un curseur et un laboratoire, puis leurs cas.
  { code: "l-inventaire-et-la-demarque", entreprise: "boutique" },
  { code: "l-inventaire-et-la-demarque", entreprise: "boutique", telephone: true },
  { code: "recruter-integrer-former", entreprise: "boutique" },
  { code: "recruter-integrer-former", entreprise: "boutique", telephone: true },
  { code: "remunerer-et-stimuler-les-vendeurs", entreprise: "boutique" },
  { code: "remunerer-et-stimuler-les-vendeurs", entreprise: "boutique", telephone: true },
  { code: "le-climat-de-l-equipe", entreprise: "boutique" },
  { code: "le-climat-de-l-equipe", entreprise: "boutique", telephone: true },
  { code: "le-degat-des-eaux-dans-la-reserve", entreprise: "boutique" },
  { code: "un-apprenti-ou-un-temps-partiel", entreprise: "boutique", telephone: true },
  { code: "le-challenge-du-merinos", entreprise: "boutique" },
  { code: "retenir-la-vendeuse", entreprise: "boutique", telephone: true },
  // Le BTS NDRC, bloc 1 terrain : le fichier et la cible, le secteur, l'événement commercial (tris, curseurs, laboratoires), puis leurs cas.
  { code: "le-fichier-et-la-cible", entreprise: "conseil" },
  { code: "le-fichier-et-la-cible", entreprise: "conseil", telephone: true },
  { code: "organiser-le-secteur", entreprise: "conseil" },
  { code: "organiser-le-secteur", entreprise: "conseil", telephone: true },
  { code: "l-evenement-commercial", entreprise: "conseil" },
  { code: "l-evenement-commercial", entreprise: "conseil", telephone: true },
  { code: "un-fichier-a-acheter", entreprise: "conseil" },
  { code: "les-comptes-de-hugo", entreprise: "conseil", telephone: true },
  { code: "un-invite-pour-la-matinale", entreprise: "conseil" },
  // Le BTS NDRC, bloc 2 : le site qui vend, contenus, communauté et e-réputation (tris, curseurs, laboratoires), puis leurs cas.
  { code: "le-site-qui-vend", entreprise: "conseil" },
  { code: "le-site-qui-vend", entreprise: "conseil", telephone: true },
  { code: "contenus-communaute-et-e-reputation", entreprise: "conseil" },
  { code: "contenus-communaute-et-e-reputation", entreprise: "conseil", telephone: true },
  { code: "doubler-les-liens-sponsorises", entreprise: "conseil" },
  { code: "l-avis-a-une-etoile", entreprise: "conseil", telephone: true },
  // Le BTS NDRC, bloc 3 : se faire référencer chez un distributeur (NOVA), le réseau de vente directe (MAILLE & CO), un curseur et un laboratoire chacun, puis leurs cas.
  { code: "se-faire-referencer", entreprise: "nova" },
  { code: "se-faire-referencer", entreprise: "nova", telephone: true },
  { code: "le-reseau-de-vente-directe", entreprise: "boutique" },
  { code: "le-reseau-de-vente-directe", entreprise: "boutique", telephone: true },
  { code: "la-centrale-demande-une-ristourne", entreprise: "nova" },
  { code: "un-pourcentage-pour-la-marraine", entreprise: "boutique", telephone: true },
  // Le BTS NDRC, bloc 2 : le plateau de téléacteurs (deux laboratoires et un curseur), puis son cas.
  { code: "le-plateau-de-teleacteurs", entreprise: "conseil" },
  { code: "le-plateau-de-teleacteurs", entreprise: "conseil", telephone: true },
  { code: "la-ligne-de-la-rentree", entreprise: "conseil", telephone: true },
  // Le BTS CG P1 : le cadre de la comptabilité (des tris, un laboratoire à choix), les ventes et achats au complet (des écritures, un curseur, un laboratoire), puis leurs cas.
  { code: "le-cadre-de-la-comptabilite", entreprise: "nova" },
  { code: "le-cadre-de-la-comptabilite", entreprise: "nova", telephone: true },
  { code: "ventes-et-achats-au-complet", entreprise: "nova" },
  { code: "ventes-et-achats-au-complet", entreprise: "nova", telephone: true },
  { code: "creer-l-atelier-de-reparation", entreprise: "nova" },
  { code: "la-commande-de-noel-de-campustech", entreprise: "nova", telephone: true },
  // Le BTS CG P1 : le compte client (NOVA) et fournisseurs et banque (MAILLE & CO) : des écritures, des tableaux à compléter, un curseur, des laboratoires, puis leurs cas.
  { code: "le-compte-client", entreprise: "nova" },
  { code: "le-compte-client", entreprise: "nova", telephone: true },
  { code: "fournisseurs-et-banque", entreprise: "boutique" },
  { code: "fournisseurs-et-banque", entreprise: "boutique", telephone: true },
  { code: "vibra-repasse-commande", entreprise: "nova" },
  { code: "le-cheque-qui-n-est-pas-passe", entreprise: "boutique", telephone: true },
  // Le BTS CG P1 et P2, agent C : sécuriser les processus (un laboratoire à choix, deux tableaux à trier, un cadrage à compléter), le dossier de révision (sept écritures, un laboratoire, le dossier à compléter), puis leurs cas.
  { code: "securiser-les-processus", entreprise: "nova" },
  { code: "securiser-les-processus", entreprise: "nova", telephone: true },
  { code: "le-dossier-de-revision", entreprise: "nova" },
  { code: "le-dossier-de-revision", entreprise: "nova", telephone: true },
  { code: "la-facture-recue-deux-fois", entreprise: "nova" },
  { code: "la-garantie-de-deux-ans", entreprise: "nova", telephone: true },
  // Le BTS CG P2 : les capitaux propres (écritures, un curseur, un laboratoire) et les comptes annuels (tableaux à compléter, un laboratoire), puis leurs cas.
  { code: "les-capitaux-propres", entreprise: "nova" },
  { code: "les-capitaux-propres", entreprise: "nova", telephone: true },
  { code: "les-comptes-annuels", entreprise: "nova" },
  { code: "les-comptes-annuels", entreprise: "nova", telephone: true },
  { code: "un-dividende-plus-gros", entreprise: "nova" },
  { code: "la-situation-de-septembre", entreprise: "nova", telephone: true },
  // Le BTS CG P1 et P2 : acquérir et financer une immobilisation, l'initiation à la consolidation (un laboratoire chacun, un tableau à compléter pour la seconde), puis leurs cas.
  { code: "acquerir-et-financer-une-immobilisation", entreprise: "nova" },
  { code: "acquerir-et-financer-une-immobilisation", entreprise: "nova", telephone: true },
  { code: "initiation-a-la-consolidation", entreprise: "nova" },
  { code: "initiation-a-la-consolidation", entreprise: "nova", telephone: true },
  { code: "la-cabine-subventionnee", entreprise: "nova" },
  { code: "le-directeur-veut-plus-d-actions", entreprise: "nova", telephone: true },
  // lot A STMG : les chapitres de sciences de gestion et numérique de première et leurs cas, au bureau et sur téléphone (début)
  { code: "de-l-individu-a-l-acteur", entreprise: "hotel" },
  { code: "de-l-individu-a-l-acteur", entreprise: "hotel", telephone: true },
  { code: "un-tuteur-pour-l-ete", entreprise: "hotel", telephone: true },
  { code: "la-diversite-des-organisations", entreprise: "nova" },
  { code: "la-diversite-des-organisations", entreprise: "nova", telephone: true },
  { code: "le-gymnase-devient-payant", entreprise: "nova", telephone: true },
  { code: "qualification-competences-et-liens-de-travail", entreprise: "conseil" },
  { code: "qualification-competences-et-liens-de-travail", entreprise: "conseil", telephone: true },
  { code: "un-contrat-de-150-journees", entreprise: "conseil", telephone: true },
  { code: "donnees-personnelles-et-donnees-ouvertes", entreprise: "boutique" },
  { code: "donnees-personnelles-et-donnees-ouvertes", entreprise: "boutique", telephone: true },
  { code: "ecrire-a-toutes-les-clientes", entreprise: "boutique", telephone: true },
  { code: "le-processus-et-le-pgi", entreprise: "nova" },
  { code: "le-processus-et-le-pgi", entreprise: "nova", telephone: true },
  { code: "deux-postes-de-plus", entreprise: "nova", telephone: true },
  { code: "les-formes-de-la-valeur", entreprise: "hotel" },
  { code: "les-formes-de-la-valeur", entreprise: "hotel", telephone: true },
  { code: "le-comptoir-baisse-son-prix", entreprise: "hotel", telephone: true },
  { code: "la-performance-globale", entreprise: "nova" },
  { code: "la-performance-globale", entreprise: "nova", telephone: true },
  { code: "les-associes-demandent-plus", entreprise: "nova", telephone: true },
  { code: "assez-vendre-pour-ne-rien-perdre", entreprise: "nova" },
  { code: "assez-vendre-pour-ne-rien-perdre", entreprise: "nova", telephone: true },
  { code: "le-loyer-augmente", entreprise: "nova", telephone: true },
  { code: "prevoir-sa-tresorerie", entreprise: "boutique" },
  { code: "prevoir-sa-tresorerie", entreprise: "boutique", telephone: true },
  { code: "etaler-ou-decouvert", entreprise: "boutique", telephone: true },
  { code: "le-temps-de-l-organisation", entreprise: "hotel" },
  { code: "le-temps-de-l-organisation", entreprise: "hotel", telephone: true },
  { code: "bloquer-l-argent-de-l-ete", entreprise: "hotel", telephone: true },
  { code: "les-risques-de-la-performance", entreprise: "nova" },
  { code: "les-risques-de-la-performance", entreprise: "nova", telephone: true },
  { code: "deux-mois-sans-composants", entreprise: "nova", telephone: true },
  // lot A STMG (fin)
  // lot B STMG : le management de première, sept chapitres (tris, curseurs, laboratoires), leurs cas, et les deux compléments.
  { code: "organiser-l-action-collective", entreprise: "nova" },
  { code: "organiser-l-action-collective", entreprise: "nova", telephone: true },
  { code: "manager-fonctions-et-decisions", entreprise: "nova" },
  { code: "manager-fonctions-et-decisions", entreprise: "nova", telephone: true },
  { code: "le-management-face-au-changement", entreprise: "nova" },
  { code: "le-management-face-au-changement", entreprise: "nova", telephone: true },
  { code: "domaines-d-activite", entreprise: "nova" },
  { code: "domaines-d-activite", entreprise: "nova", telephone: true },
  { code: "integrer-externaliser-croitre", entreprise: "nova" },
  { code: "integrer-externaliser-croitre", entreprise: "nova", telephone: true },
  { code: "la-strategie-d-une-organisation-publique", entreprise: "nova" },
  { code: "la-strategie-d-une-organisation-publique", entreprise: "nova", telephone: true },
  { code: "la-strategie-d-une-association", entreprise: "nova" },
  { code: "la-strategie-d-une-association", entreprise: "nova", telephone: true },
  { code: "deux-ateliers-ou-un-seul", entreprise: "nova" },
  { code: "qui-decide-de-quoi", entreprise: "nova", telephone: true },
  { code: "proteger-le-site-de-vente", entreprise: "nova" },
  { code: "abandonner-l-enceinte-nomade", entreprise: "nova", telephone: true },
  { code: "le-distributeur-belge", entreprise: "nova" },
  { code: "la-mediatheque-le-dimanche", entreprise: "nova", telephone: true },
  { code: "le-parrain-qui-veut-choisir-l-entraineur", entreprise: "nova" },
  // fin du lot B STMG.
  // lot C STMG : la partie commune de terminale (12 chapitres, et « Coût complet ou coût spécifique » qui la sert aussi) et la gestion et finance, sur ordinateur et sur téléphone, et leurs cas.
  { code: "une-offre-pour-un-besoin", entreprise: "nova" },
  { code: "une-offre-pour-un-besoin", entreprise: "nova", telephone: true },
  { code: "les-ressources-pour-produire", entreprise: "nova" },
  { code: "les-ressources-pour-produire", entreprise: "nova", telephone: true },
  { code: "organiser-la-production", entreprise: "nova" },
  { code: "organiser-la-production", entreprise: "nova", telephone: true },
  { code: "cout-complet-ou-cout-specifique", entreprise: "nova" },
  { code: "cout-complet-ou-cout-specifique", entreprise: "nova", telephone: true },
  { code: "le-numerique-dans-la-production", entreprise: "nova" },
  { code: "le-numerique-dans-la-production", entreprise: "nova", telephone: true },
  { code: "organiser-le-travail-et-coordonner", entreprise: "nova" },
  { code: "organiser-le-travail-et-coordonner", entreprise: "nova", telephone: true },
  { code: "federer-les-acteurs", entreprise: "nova" },
  { code: "federer-les-acteurs", entreprise: "nova", telephone: true },
  { code: "le-client-a-l-ere-numerique", entreprise: "boutique" },
  { code: "le-client-a-l-ere-numerique", entreprise: "boutique", telephone: true },
  { code: "communiquer-avec-chaque-acteur", entreprise: "nova" },
  { code: "communiquer-avec-chaque-acteur", entreprise: "nova", telephone: true },
  { code: "ethique-transparence-et-egalite", entreprise: "nova" },
  { code: "ethique-transparence-et-egalite", entreprise: "nova", telephone: true },
  { code: "les-modes-de-vie-changent", entreprise: "nova" },
  { code: "les-modes-de-vie-changent", entreprise: "nova", telephone: true },
  { code: "donnees-et-algorithmes", entreprise: "boutique" },
  { code: "donnees-et-algorithmes", entreprise: "boutique", telephone: true },
  { code: "s-implanter-sur-un-territoire", entreprise: "nova" },
  { code: "s-implanter-sur-un-territoire", entreprise: "nova", telephone: true },
  { code: "investir-amortir-cloturer", entreprise: "nova" },
  { code: "investir-amortir-cloturer", entreprise: "nova", telephone: true },
  { code: "le-pack-a-390-euros", entreprise: "nova" },
  { code: "un-remplacement-de-4-mois", entreprise: "nova", telephone: true },
  { code: "reprendre-les-enceintes-usagees", entreprise: "nova" },
  { code: "la-go-a-31-euros", entreprise: "nova", telephone: true },
  { code: "des-factures-sans-papier", entreprise: "nova" },
  { code: "deleguer-les-commandes-urgentes", entreprise: "nova", telephone: true },
  { code: "la-salle-de-repos", entreprise: "nova" },
  { code: "un-conseiller-en-ligne", entreprise: "boutique", telephone: true },
  { code: "une-annonce-ou-la-cooptation", entreprise: "nova" },
  { code: "le-stand-gratuit-du-salon", entreprise: "nova", telephone: true },
  { code: "un-parc-de-studio-en-location", entreprise: "nova" },
  { code: "chiffrer-les-ordinateurs", entreprise: "boutique", telephone: true },
  { code: "rejoindre-le-cluster-de-l-audio", entreprise: "nova" },
  { code: "amortir-sur-8-ans", entreprise: "nova", telephone: true },
  // lot C STMG (fin)
  // lot D STMG : les chapitres de mercatique de terminale et leurs cas, au bureau et sur téléphone (début) ; le complément des canaux de distribution se joue plus haut
  { code: "positionner-l-offre", entreprise: "nova" },
  { code: "positionner-l-offre", entreprise: "nova", telephone: true },
  { code: "campustech-veut-son-logo", entreprise: "nova", telephone: true },
  { code: "l-experience-client", entreprise: "bistrot" },
  { code: "l-experience-client", entreprise: "bistrot", telephone: true },
  { code: "une-soiree-le-mardi", entreprise: "bistrot", telephone: true },
  { code: "les-politiques-tarifaires", entreprise: "hotel" },
  { code: "les-politiques-tarifaires", entreprise: "hotel", telephone: true },
  { code: "le-congres-de-juillet", entreprise: "hotel", telephone: true },
  { code: "le-parcours-client", entreprise: "boutique" },
  { code: "le-parcours-client", entreprise: "boutique", telephone: true },
  { code: "le-module-augmente", entreprise: "boutique", telephone: true },
  { code: "vendre-en-ligne", entreprise: "nova" },
  { code: "vendre-en-ligne", entreprise: "nova", telephone: true },
  { code: "la-place-de-marche-negocie", entreprise: "nova", telephone: true },
  { code: "le-plan-de-communication", entreprise: "fitness" },
  { code: "le-plan-de-communication", entreprise: "fitness", telephone: true },
  { code: "toute-la-campagne-a-la-radio", entreprise: "fitness", telephone: true },
  { code: "fideliser-grace-au-numerique", entreprise: "boutique" },
  { code: "fideliser-grace-au-numerique", entreprise: "boutique", telephone: true },
  { code: "relancer-les-dormantes", entreprise: "boutique", telephone: true },
  { code: "influence-communaute-et-e-reputation", entreprise: "fitness" },
  { code: "influence-communaute-et-e-reputation", entreprise: "fitness", telephone: true },
  { code: "l-influenceuse-du-haut-verdasse", entreprise: "fitness", telephone: true },
  // lot D STMG (fin)
  // lot E STMG : les ressources humaines et la communication de terminale (9 chapitres), sur ordinateur et sur téléphone, et leurs cas.
  { code: "recruter-et-integrer", entreprise: "hotel" },
  { code: "recruter-et-integrer", entreprise: "hotel", telephone: true },
  { code: "evaluer-le-travail", entreprise: "bistrot" },
  { code: "evaluer-le-travail", entreprise: "bistrot", telephone: true },
  { code: "developper-les-competences", entreprise: "nova" },
  { code: "developper-les-competences", entreprise: "nova", telephone: true },
  { code: "qualite-de-vie-et-conditions-de-travail", entreprise: "bistrot" },
  { code: "qualite-de-vie-et-conditions-de-travail", entreprise: "bistrot", telephone: true },
  { code: "sante-et-securite-au-travail", entreprise: "nova" },
  { code: "sante-et-securite-au-travail", entreprise: "nova", telephone: true },
  { code: "au-dela-du-salaire", entreprise: "nova" },
  { code: "au-dela-du-salaire", entreprise: "nova", telephone: true },
  { code: "le-climat-social-et-le-conflit", entreprise: "nova" },
  { code: "le-climat-social-et-le-conflit", entreprise: "nova", telephone: true },
  { code: "le-dialogue-social", entreprise: "hotel" },
  { code: "le-dialogue-social", entreprise: "hotel", telephone: true },
  { code: "communication-interne-et-marque-employeur", entreprise: "conseil" },
  { code: "communication-interne-et-marque-employeur", entreprise: "conseil", telephone: true },
  { code: "un-saisonnier-ou-un-interimaire", entreprise: "hotel" },
  { code: "une-prime-sur-les-desserts", entreprise: "bistrot", telephone: true },
  { code: "abonder-le-compte-de-mehdi", entreprise: "nova" },
  { code: "supprimer-le-service-coupe", entreprise: "bistrot", telephone: true },
  { code: "equiper-les-postes-de-vissage", entreprise: "nova" },
  { code: "placer-son-interessement", entreprise: "nova", telephone: true },
  { code: "sortir-de-la-greve", entreprise: "nova" },
  { code: "un-accord-sans-delegue-syndical", entreprise: "hotel", telephone: true },
  { code: "une-reunion-par-mois-ou-un-outil", entreprise: "conseil" },
  // lot E STMG (fin)
  // lot F STMG : les systèmes d'information de gestion de terminale (9 chapitres), sur ordinateur et sur téléphone, et leurs cas (début)
  { code: "le-systeme-d-information-de-nova", entreprise: "nova" },
  { code: "le-systeme-d-information-de-nova", entreprise: "nova", telephone: true },
  { code: "securiser-le-systeme-d-information", entreprise: "nova" },
  { code: "securiser-le-systeme-d-information", entreprise: "nova", telephone: true },
  { code: "la-fonction-systeme-d-information", entreprise: "nova" },
  { code: "la-fonction-systeme-d-information", entreprise: "nova", telephone: true },
  { code: "conduire-un-projet-de-si", entreprise: "nova" },
  { code: "conduire-un-projet-de-si", entreprise: "nova", telephone: true },
  { code: "la-base-de-donnees-relationnelle", entreprise: "nova" },
  { code: "la-base-de-donnees-relationnelle", entreprise: "nova", telephone: true },
  { code: "interroger-la-base-en-sql", entreprise: "nova" },
  { code: "interroger-la-base-en-sql", entreprise: "nova", telephone: true },
  { code: "automatiser-un-traitement", entreprise: "boutique" },
  { code: "automatiser-un-traitement", entreprise: "boutique", telephone: true },
  { code: "documents-structures-et-metadonnees", entreprise: "boutique" },
  { code: "documents-structures-et-metadonnees", entreprise: "boutique", telephone: true },
  { code: "reseaux-et-informatique-en-nuage", entreprise: "conseil" },
  { code: "reseaux-et-informatique-en-nuage", entreprise: "conseil", telephone: true },
  { code: "controler-les-adresses-a-la-saisie", entreprise: "nova" },
  { code: "payer-la-rancon", entreprise: "nova", telephone: true },
  { code: "renouveler-l-infogerance", entreprise: "nova" },
  { code: "demarrer-le-pgi-a-la-date-prevue", entreprise: "nova", telephone: true },
  { code: "ranger-les-avis-des-clients", entreprise: "nova" },
  { code: "ou-ouvrir-un-point-de-retrait", entreprise: "nova", telephone: true },
  { code: "un-bon-des-80-points", entreprise: "boutique" },
  { code: "numeriser-les-archives", entreprise: "boutique", telephone: true },
  { code: "passer-a-la-fibre", entreprise: "conseil" },
  // lot F STMG (fin)
] as { code: string; entreprise: string; telephone?: boolean }[])("le chapitre réservé $code chez $entreprise", ({ code: chapitreCode, entreprise, telephone }) => {
  it("sans licence, il dit qu'il est réservé (le cas du chapitre libre s'ouvre) ; sous licence, il se joue sans faute", async () => {
    // Le cas pratique du chapitre libre est libre lui aussi (décision d'octobre 2026) : il se
    // joue alors SANS licence, ce qui le prouve ouvert.
    const libreDAcces = chapitreParCode(chapitreCode)!.libre;
    const libre = await nouvellePage();
    await aller(libre, `/cours/${chapitreCode}?entreprise=${entreprise}`);
    // Lu, puis la page fermée AVANT de vérifier : une assertion qui échoue ne laisse pas
    // un onglet ouvert. Sur 250 cas, les onglets laissés ouverts finissaient par saturer le
    // serveur, et la suite restait bloquée sans rien écrire (octobre 2026).
    const texte = await libre.locator("main").innerText().then(espacesOrdinaires);
    const sorties = await libre.locator("main a").evaluateAll((xs) => xs.map((x) => x.getAttribute("href") ?? ""));
    await libre.context().close();
    if (libreDAcces) {
      expect(texte).not.toContain("aux établissements sous licence");
    } else {
      expect(texte).toContain(`${motsDuContenu(chapitreCode).reserve} aux établissements sous licence`);
      // Une sortie : le chapitre libre de son diplôme (config/cours/chapitres-libres.ts, `essaiPour`), les
      // offres, le devis, celui de l'offre Classe (pas de cours seul) ; l'entreprise et le niveau se
      // choisissent au devis.
      expect(sorties).toEqual(expect.arrayContaining(["/tarifs", essaiPour(chapitreParCode(chapitreCode)!).href]));
      expect(sorties).toContain("/devis?offre=classe");
    }

    const code = entreprise;
    const cas = casDeLEntreprise(code);
    const chapitre = chapitreDuCas(chapitreParCode(chapitreCode)!, cas);
    const ctx = await navigateur.newContext({
      viewport: telephone ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      hasTouch: telephone ?? false,
      locale: "fr-FR",
    });
    if (!libreDAcces) await enseignantSousLicence(ctx);
    const page = await ctx.newPage();
    await aller(page, `/cours/${chapitre.code}?entreprise=${code}`);
    for (const [i, etape] of chapitre.etapes.entries()) {
      await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(etape.titre);
      if (etape.tableau) expect(await tableauxDeLEtape(page)).toBe(1);
      // Sur téléphone, aucun tableau de l'étape ne défile en largeur.
      if (telephone) expect(await tableauxQuiDebordent(page), etape.id).toEqual([]);
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
          await page.locator(`[data-element="${insecables(el.libelle)}"]`).getByRole("radio", { name: libelle, exact: true }).click();
        }
        await page.getByRole("button", { name: "Vérifier", exact: true }).click();
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
      } else if (etape.type === "choix") {
        await page.getByRole("radio", { name: etape.options(cas, avant).find((o) => o.juste)!.texte, exact: true }).click();
      } else if (etape.type === "comparaison") {
        // La comparaison de deux moments du journal (la suite du chapitre pilote, découpé par
        // l'audit pédagogique) : l'état à l'étape repère, puis l'état courant.
        const repere = etatAvant(chapitre, cas, indexDeLEtape(chapitre, etape.avantLEtape));
        await page.getByRole("radio", { name: etape.options(cas, repere, avant).find((o) => o.juste)!.texte, exact: true }).click();
      } else if (etape.type === "curseur") {
        const libelle = etape.grandeur?.(cas).libelle ?? "Ventes du mois";
        await page.getByLabel(`${libelle}, au clavier`, { exact: true }).fill(String(etape.cible(cas).attendu));
        await page.getByRole("button", { name: "Valider cette position" }).click();
      } else if (etape.type === "a-completer") {
        // Le tableau à compléter : chaque case se nomme « ligne, colonne » ; au téléphone, les chiffres
        // se tapent, puis le bouton de signe de la case touchée donne les négatifs.
        const g = etape.grille(cas);
        for (const { ligne, colonne, cellule } of cellulesASaisir(g)) {
          const nom = libelleDeCellule(g, ligne, colonne);
          const v = cellule.valeur!;
          if (!telephone) {
            await page.getByLabel(nom, { exact: true }).fill(valeurASaisir(v));
            continue;
          }
          await page.getByLabel(nom, { exact: true }).pressSequentially(valeurASaisir(Math.abs(v)));
          if (v < 0) await page.getByRole("button", { name: `Changer le signe : ${nom}`, exact: true }).tap();
        }
        await page.getByRole("button", { name: "Vérifier", exact: true }).click();
      } else if (etape.type === "simulation") {
        const solution = etape.defi(cas).solution;
        for (const l of etape.leviers(cas)) {
          const choix = l.choix?.find((x) => x.valeur === solution[l.code]);
          // Le bouton radio est masqué : l'élève clique sur l'étiquette visible du choix.
          if (choix) await page.locator(`[data-levier-a-choix="${l.code}"] label`).getByText(choix.libelle, { exact: true }).click();
          else await page.getByLabel(`${l.libelle}, au clavier`, { exact: true }).fill(virgule(solution[l.code]!));
        }
        await page.getByRole("button", { name: "Valider cette position" }).click();
      }
      const dernier = i === chapitre.etapes.length - 1;
      await page.getByRole("button", { name: dernier ? motsDuContenu(chapitre.code).terminer : "Étape suivante" }).click();
    }
    const notees = chapitre.etapes.filter((e) => e.type !== "lecture").length;
    await expect
      .poll(() => page.locator("main").innerText().then(espacesOrdinaires), { timeout: 15_000 })
      .toContain(`${notees} étapes réussies du premier coup sur ${notees}`);
    // Et ensuite : les cas pratiques qui reprennent le chapitre, ou les chapitres que le cas reprend.
    const suites = suitesDuChapitre(chapitre.code);
    const lus = (attribut: string) =>
      page.locator(`[data-et-ensuite] [${attribut}]`).evaluateAll((xs, a) => xs.map((x) => x.getAttribute(a)), attribut);
    expect(await lus("data-suite-situation")).toEqual(suites.situations.map((l) => l.code));
    expect(await lus("data-chapitre-repris")).toEqual(suites.reprend.map((l) => l.code));
    expect(await lus("data-chapitre-suivant")).toEqual(suites.ensuite.map((l) => l.code));
    expect(await lus("data-suite-episode")).toEqual(suites.episodes.map((l) => l.code));
    if (telephone) expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await ctx.close();
  }, 240_000);
});

/**
 * LES COMPÉTENCES DU DIPLÔME D'OÙ L'ON VIENT (demande du propriétaire, novembre 2026 ;
 * config/cours/competences-affichees.ts). « Les opérations en devises » cite le DCG, le BUT GEA et deux
 * processus du BTS CG : ouverte depuis le DCG, sa page ne montre que l'UE10 ; depuis le BTS CG, que P1 et P2.
 */
describe("la page d'un chapitre n'annonce que les compétences du diplôme d'où l'on vient", () => {
  const competences = (p: Page) => p.locator("[data-objectifs-du-chapitre] > div.carte").innerText().then(espacesOrdinaires);

  it("depuis /cours?diplome=dcg, le lien du chapitre porte le DCG et la page ne montre que lui ; depuis le BTS CG, que P1 et P2", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const page = await ctx.newPage();

    await aller(page, "/cours?diplome=dcg");
    const lien = page.locator('[data-programme="dcg"] [data-chapitre="les-operations-en-devises"] a[href^="/cours/les-operations-en-devises?"]').first();
    expect(await lien.getAttribute("href")).toMatch(/[?&]diplome=dcg(&|$)/);
    await lien.click();
    await page.waitForURL(/\/cours\/les-operations-en-devises\?.*diplome=dcg/, { timeout: 60_000 });
    await expect.poll(() => page.locator("[data-objectifs-du-chapitre]").count(), { timeout: 15_000 }).toBe(1);
    const dcg = await competences(page);
    expect(dcg).toContain("Compétences du référentiel · DCG");
    expect(dcg).toContain("UE10 · Comptabilité approfondie");
    for (const autre of ["BTS CG", "BUT GEA", "Contrôle et traitement comptable", "Produire l'information comptable"]) expect(dcg, autre).not.toContain(autre);

    await aller(page, "/cours?diplome=bts-cg");
    const duBts = page.locator('[data-programme="bts-cg"] [data-chapitre="les-operations-en-devises"] a[href^="/cours/les-operations-en-devises?"]').first();
    await duBts.click();
    await page.waitForURL(/\/cours\/les-operations-en-devises\?.*diplome=bts-cg/, { timeout: 60_000 });
    await expect.poll(() => page.locator("[data-objectifs-du-chapitre]").count(), { timeout: 15_000 }).toBe(1);
    const bts = await competences(page);
    expect(bts).toContain("Compétences du référentiel · BTS CG");
    expect(bts).toContain("P1 · Contrôle et traitement comptable des opérations commerciales");
    expect(bts).toContain("P2 · Contrôle et production de l'information financière");
    expect(bts).not.toContain("UE10");

    // Sans contexte (un lien direct), le diplôme du chapitre : celui de son parcours, le DCG.
    await aller(page, "/cours/les-operations-en-devises?entreprise=nova");
    await expect.poll(() => page.locator("[data-objectifs-du-chapitre]").count(), { timeout: 15_000 }).toBe(1);
    expect(await competences(page)).toContain("Compétences du référentiel · DCG");
    await ctx.close();
  }, 120_000);
});

/**
 * UN CHAPITRE LIBRE PAR DIPLÔME (décision du propriétaire, novembre 2026 ; config/cours/chapitres-libres.ts).
 * En tête de la page de chaque diplôme, sans défiler sur un téléphone de 390 px : son chapitre libre, le
 * premier de son parcours, et son cas pratique. L'un et l'autre s'ouvrent sans compte, et la page du
 * chapitre montre les compétences de ce diplôme. Un chapitre réservé de son parcours y ramène.
 */
describe("un chapitre libre par diplôme", () => {
  const TELEPHONE = { width: 390, height: 844 };
  const competences = (p: Page) => p.locator("[data-objectifs-du-chapitre] > div.carte").innerText().then(espacesOrdinaires);
  /**
   * Le haut et le bas de l'encart, dans la fenêtre, et la limite du premier écran : le bas de la fenêtre,
   * ou le haut de la barre d'action du téléphone quand elle est à l'écran (components/barre-d-action-mobile.tsx).
   */
  const dansLaFenetre = (p: Page, d: string) =>
    p.locator(`[data-essai-du-diplome="${d}"]`).evaluate((el) => {
      const b = el.getBoundingClientRect();
      const barre = document.querySelector("[data-barre-action]")?.getBoundingClientRect();
      const limite = barre && barre.height > 0 && barre.top < window.innerHeight ? barre.top : window.innerHeight;
      return { haut: Math.round(b.top), bas: Math.round(b.bottom), limite: Math.round(limite) };
    });

  it("en tête de chaque page de diplôme, visible sans défiler à 390 px : le chapitre libre et son cas, le diplôme dans l'adresse", async () => {
    const ctx = await navigateur.newContext({ viewport: TELEPHONE, hasTouch: true, locale: "fr-FR" });
    // L'invitation à installer, comme dans tests/e2e/mobile-public.e2e.ts : un visiteur qui l'a déjà fermée.
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem("install-prompt-ferme-le", String(Date.now()));
      } catch {
        /* rien */
      }
    });
    const page = await ctx.newPage();
    try {
      for (const f of formationsAvecUnePage()) {
        const e = essaiDuDiplome(f.code)!;
        const d = e.diplome.code;
        for (const chemin of [`/parcours/${f.code}`, `/cours?diplome=${f.code}#programme`]) {
          await aller(page, chemin);
          const encart = page.locator(`[data-essai-du-diplome="${d}"]`);
          expect(await encart.count(), chemin).toBe(1);
          // La barre d'action se montre après un temps : on la laisse paraître avant de mesurer.
          await page.waitForTimeout(400);
          const { haut, bas, limite } = await dansLaFenetre(page, d);
          expect(haut, `${chemin} : l'encart commence hors de l'écran`).toBeGreaterThanOrEqual(0);
          expect(bas, `${chemin} : l'encart sort du premier écran (limite ${limite} px)`).toBeLessThanOrEqual(limite);
          expect(await encart.locator(`[data-chapitre-libre="${e.chapitre.code}"]`).getAttribute("href"), chemin).toMatch(
            new RegExp(`^/cours/${e.chapitre.code}\\?(.*&)?diplome=${d}(&|$)`),
          );
          expect(await encart.locator(`[data-cas-libre="${e.cas!.code}"]`).getAttribute("href"), chemin).toMatch(
            new RegExp(`^/cours/${e.cas!.code}\\?(.*&)?diplome=${d}(&|$)`),
          );
          expect(await debordement(page), chemin).toBeLessThanOrEqual(0);
          if (process.env.E2E_CAPTURES && ["stmg", "bts-mhr-bc"].includes(f.code)) {
            await page.screenshot({ path: `${process.env.E2E_CAPTURES}/${chemin.startsWith("/parcours") ? "parcours" : "cours"}-${f.code}-390.png` });
          }
        }
      }
    } finally {
      await ctx.close();
    }
  }, 300_000);

  it("chaque chapitre libre et son cas s'ouvrent sans compte, avec les compétences du diplôme de l'adresse", async () => {
    const page = await nouvellePage();
    try {
      for (const l of chapitresLibresParDiplome()) {
        for (const f of l.diplomes) {
          await aller(page, `/cours/${l.chapitre.code}?diplome=${f.code}`);
          const main = await page.locator("main").innerText().then(espacesOrdinaires);
          expect(main, l.chapitre.code).not.toContain("aux établissements sous licence");
          await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(l.chapitre.etapes[0]!.titre);
          await expect.poll(() => page.locator("[data-objectifs-du-chapitre]").count(), { timeout: 15_000 }).toBe(1);
          expect(await competences(page), `${l.chapitre.code} depuis ${f.code}`).toContain(`Compétences du référentiel · ${f.sigle}`);
        }
        await aller(page, `/cours/${l.cas!.code}?diplome=${l.diplomes[0]!.code}`);
        expect(await page.locator("main").innerText().then(espacesOrdinaires), l.cas!.code).not.toContain("aux établissements sous licence");
        await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(l.cas!.etapes[0]!.titre);
      }
    } finally {
      await page.context().close();
    }
  }, 300_000);

  it("sans compte, un chapitre réservé du parcours mène au chapitre libre de ce diplôme ; l'ancien chapitre libre est réservé", async () => {
    const page = await nouvellePage(390, 844);
    try {
      for (const code of ["stmg", "bts-cg", "dscg"]) {
        const e = essaiDuDiplome(code)!;
        const reserve = coursDuDiplome(code)!.blocs.flatMap((b) => b.chapitres).find((x) => !x.chapitre.libre)!.chapitre;
        await aller(page, `/cours/${reserve.code}?diplome=${code}`);
        expect(await page.locator("main").innerText().then(espacesOrdinaires), reserve.code).toContain("aux établissements sous licence");
        expect(await page.getByRole("link", { name: "Essayer le chapitre libre" }).getAttribute("href"), reserve.code).toBe(`/cours/${e.chapitre.code}?diplome=${code}`);
      }
      // « De la création au premier bilan » et son cas ne s'ouvrent plus sans licence.
      for (const code of [CHAPITRES[0]!.code, casDuChapitre(CHAPITRES[0]!.code)!.code]) {
        await aller(page, `/cours/${code}?entreprise=nova`);
        expect(await page.locator("main").innerText().then(espacesOrdinaires), code).toContain("aux établissements sous licence");
      }
    } finally {
      await page.context().close();
    }
  }, 120_000);
});

describe("l'accueil présente les quatre formats", () => {
  it("quatre formats, chacun avec sa page, et la porte gratuite de ceux qui en ont une, sans déborder sur téléphone", async () => {
    const page = await nouvellePage(390, 844);
    await aller(page, "/");
    const formats = page.locator("[data-formats-de-l-accueil] [data-format]");
    expect(await formats.evaluateAll((xs) => xs.map((x) => x.getAttribute("data-format")))).toEqual(["cours", "situations", "arene", "episodes"]);
    // Le cours, absent de l'accueil avant l'audit, y a sa porte libre.
    expect(await page.locator(`[data-format="cours"] a[href="/cours/${essai.code}"]`).count()).toBe(1);
    expect(await page.locator('[data-format="arene"] a[href="/jouer"]').count()).toBe(1);
    expect(await page.locator('[data-format="episodes"] a[href="/entreprises/episode"]').count()).toBe(1);
    // Le héros mène à la bande.
    expect(await page.locator('a[href="#formats"]').count()).toBe(1);
    expect(await page.locator("#formats").count()).toBe(1);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await page.context().close();
  }, 60_000);
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
    expect(await lien.innerText().then(espacesOrdinaires)).toBe(premier.titre);
    await lien.click();
    await page.waitForURL(new RegExp(`/cours/${premier.code}`));
    expect(await page.locator("main").innerText().then(espacesOrdinaires)).toContain(premier.titre);
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
    expect(await note.innerText().then(espacesOrdinaires)).toContain("ne joue pas ce chapitre");
    const cas = casDeLEntreprise(chapitre.entreprises!.codes[0]!);
    expect(await note.innerText().then(espacesOrdinaires)).toContain(cas.entreprise);
    await expect.poll(() => page.locator("h1").innerText().then(espacesOrdinaires), { timeout: 15_000 }).toBe(chapitre.etapes[0]!.titre);
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await ctx.close();
  }, 120_000);
});
