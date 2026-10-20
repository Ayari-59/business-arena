import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";

/**
 * TROIS OFFRES SCOLAIRES (CLASSE, PROGRAMME, CAMPUS), DANS UN VRAI NAVIGATEUR.
 *
 * Ce que l'intégration (`tests/integration/trois-offres.test.ts`) ne voit pas :
 *  · /tarifs à 1280 et 390 : quatre cartes, un seul bouton plein (Programme) ;
 *  · /devis?offre=programme pré-rempli, avec l'entreprise souhaitée ;
 *  · sous Classe, le formulaire de /teacher part de l'entreprise et du niveau de la
 *    licence, marque les autres de l'offre qui les ouvre, et le serveur refuse une autre
 *    entreprise avec la phrase et le lien de devis ; la ligne d'état dit le paramétrage ;
 *    une fois la partie créée, la règle « un groupe à la fois » se dit avant l'envoi ;
 *  · sous Programme, plusieurs parties, niveaux 1 à 6 ; sous Campus, tout ;
 *  · un atelier hors de la licence reste visible, non lançable, avec son message ;
 *  · le formulaire de licence de /admin montre les champs de chaque offre, et pose une
 *    Classe avec son paramétrage.
 *
 * Avec CAPTURES_TROIS (un dossier), le test laisse les captures du rapport.
 */

const CAPTURES = process.env.CAPTURES_TROIS;
let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const contexte = (largeur = 1280): Promise<BrowserContext> =>
  largeur === 390
    ? navigateur.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" })
    : navigateur.newContext({ viewport: { width: largeur, height: 900 }, locale: "fr-FR" });

async function capture(page: Page, nom: string, options: { fullPage?: boolean } = {}) {
  if (!CAPTURES) return;
  await page.screenshot({ path: `${CAPTURES}/${nom}.png`, ...options });
}

async function enBase<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

/** Le texte vu, espaces insécables ramenées à l'espace. */
const lire = async (l: { innerText(): Promise<string> }) =>
  (await l.innerText()).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

async function ouvrirLeFormulaire(page: Page) {
  if ((await page.locator("#nouvelle-partie[open]").count()) === 0) {
    await page.locator("#nouvelle-partie > summary").click();
  }
}

/** Les options d'une liste : valeur, texte, désactivée. */
const options = (page: Page, nom: string) =>
  page.locator(`select[name="${nom}"] option`).evaluateAll((xs) =>
    xs.map((o) => ({
      v: (o as HTMLOptionElement).value,
      t: (o.textContent ?? "").trim(),
      off: (o as HTMLOptionElement).disabled,
    })),
  );

describe("/tarifs : quatre cartes, un bouton plein sur Programme", () => {
  for (const largeur of [1280, 390] as const) {
    it(`à ${largeur} px`, async () => {
      const c = await contexte(largeur);
      const page = await c.newPage();
      await aller(page, "/tarifs");
      const cartes = page.locator("[data-offre]");
      expect(await cartes.evaluateAll((xs) => xs.map((x) => x.getAttribute("data-offre")))).toEqual([
        "decouverte",
        "classe",
        "programme",
        "campus",
      ]);
      const prix = (await page.locator("[data-offre] [data-prix]").allInnerTexts()).map((t) =>
        t.replace(/[  ]/g, " ").replace(/\s+/g, " "),
      );
      // Décision d'octobre 2026 : aucun prix affiché, chaque offre de l'arène est « sur devis ».
      expect(prix.slice(1)).toEqual(["Sur devis Sur mesure, établie au devis", "Sur devis Sur mesure, établie au devis", "Sur devis Sur mesure, établie au devis"]);
      expect(await page.locator(".bouton-plein").count()).toBe(1);
      expect(await page.locator('[data-offre="programme"] .bouton-plein').getAttribute("href")).toBe(
        "/devis?offre=programme",
      );
      // Plus de mention comparative calculée sur les prix tant qu'ils sont cachés.
      expect(await lire(page.locator("main"))).not.toMatch(/moins cher que|€/);
      expect(await lire(page.locator("#enseignement"))).toBe(
        "L'arène, pour l'enseignement : lycées, BTS, écoles de commerce, universités",
      );
      const args = page.locator("[data-arguments-ecoles]");
      expect(await lire(args)).toContain(
        "Intégration à Moodle, Canvas, Blackboard, Brightspace (LTI 1.3) : incluse",
      );
      expect(await lire(args)).toContain("ENT du secondaire (GAR) : à l'étude");
      expect(await args.getByRole("link", { name: "Voir l'intégration" }).getAttribute("href")).toBe("/integration");
      const debord = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debord).toBeLessThanOrEqual(0);
      const boites = await cartes.evaluateAll((xs) =>
        xs.map((x) => {
          const r = x.getBoundingClientRect();
          return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
        }),
      );
      if (largeur === 1280) {
        expect(new Set(boites.map((b) => b.y)).size, "une rangée").toBe(1);
        expect(Math.max(...boites.map((b) => b.h)) - Math.min(...boites.map((b) => b.h))).toBeLessThanOrEqual(1);
        await capture(page, "tarifs-1280-haut");
        await page.locator("details", { hasText: "Conditions de vente" }).locator("summary").click();
        await page.evaluate(() => window.scrollTo(0, 0));
        await capture(page, "tarifs-1280-entiere", { fullPage: true });
      } else {
        expect(new Set(boites.map((b) => b.x)).size, "une colonne").toBe(1);
        for (const b of boites) expect(b.w).toBeGreaterThanOrEqual(300);
        await capture(page, "tarifs-390-entiere", { fullPage: true });
      }
      await c.close();
    });
  }
});

describe("/devis, l'offre pré-remplie", () => {
  it("?offre=programme : Programme, l'entreprise souhaitée, l'effectif ; pas de niveau", async () => {
    const c = await contexte();
    const page = await c.newPage();
    await aller(page, "/devis?offre=programme");
    expect(await page.locator('select[name="offre"]').inputValue()).toBe("programme");
    expect(await page.locator('select[name="entreprise"]').count()).toBe(1);
    expect(await page.locator('select[name="niveau"]').count()).toBe(0);
    expect(await page.locator("[data-formulaire-devis]").textContent()).toContain(
      "Nombre d'enseignants et d'intervenants",
    );
    await page.selectOption('select[name="entreprise"]', "hotel");
    await capture(page, "devis-programme-1280", { fullPage: true });
    // Passer à Classe fait paraître le niveau, et retire l'effectif.
    await page.selectOption('select[name="offre"]', "classe");
    expect(await page.locator('select[name="niveau"]').count()).toBe(1);
    expect(await page.locator('input[name="effectif"]').count()).toBe(0);
    await c.close();
  });
});

describe("l'enseignant sous licence Classe : un jeu paramétré", () => {
  it("formulaire pré-réglé, autres choix marqués, refus d'une autre entreprise, puis un groupe à la fois", async () => {
    const c = await contexte();
    const { orgId } = await enseignantSousLicence(c, { arene: "classe", entreprises: ["hotel"], niveaux: [3] });
    const page = await c.newPage();
    await aller(page, "/teacher");
    const etat = await lire(page.locator("[data-etat-offre]"));
    expect(etat).toMatch(/^Offre Classe · L'ESCALE · niveau 3 Pilotage · jusqu.au /);
    await ouvrirLeFormulaire(page);
    expect(await page.locator('select[name="scenarioCode"]').inputValue()).toBe("hotel");
    expect(await page.locator('select[name="level"]').inputValue()).toBe("3");
    const entreprises = await options(page, "scenarioCode");
    expect(entreprises.filter((o) => !o.off).map((o) => o.v)).toEqual(["hotel"]);
    for (const o of entreprises.filter((x) => x.off)) expect(o.t, o.v).toMatch(/· Offre Campus$/);
    expect(entreprises.filter((o) => o.off)).toHaveLength(8);
    const niveaux = await options(page, "level");
    expect(niveaux.filter((o) => !o.off).map((o) => o.v)).toEqual(["3"]);
    for (const o of niveaux.filter((x) => x.off)) expect(o.t, o.v).toMatch(/· Offre Programme$/);
    const regle = page.locator("[data-parametrage-de-la-licence]");
    expect(await lire(regle)).toContain("Offre Classe · L'ESCALE · niveau 3 Pilotage.");
    expect(await regle.getByRole("link", { name: /Demander un devis/ }).getAttribute("href")).toBe(
      "/devis?offre=programme",
    );
    expect(await regle.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe("/tarifs");
    await regle.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -260));
    await capture(page, "teacher-classe-formulaire");
    // Les listes dépliées, pour la capture : les autres choix visibles, marqués.
    if (CAPTURES) {
      await page.evaluate(() => {
        for (const n of ["scenarioCode", "level"]) {
          const s = document.querySelector(`select[name="${n}"]`) as HTMLSelectElement;
          s.size = s.options.length;
        }
      });
      await page.locator('select[name="scenarioCode"]').scrollIntoViewIfNeeded();
      await capture(page, "teacher-classe-entreprises-marquees");
      await page.locator('select[name="level"]').scrollIntoViewIfNeeded();
      await capture(page, "teacher-classe-niveaux-marques");
      await page.evaluate(() => {
        for (const n of ["scenarioCode", "level"]) {
          (document.querySelector(`select[name="${n}"]`) as HTMLSelectElement).size = 0;
        }
      });
    }

    // Une autre entreprise, forcée hors de l'écran : le serveur la refuse et dit pourquoi.
    await page.evaluate(() => {
      const s = document.querySelector('select[name="scenarioCode"]') as HTMLSelectElement;
      for (const o of s.options) o.disabled = false;
    });
    await page.selectOption('select[name="scenarioCode"]', "nova");
    await page.selectOption('select[name="humanTeamsCount"]', "1");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    const alerte = page.locator("[role=alert]", { hasText: "La partie n'a pas été créée" });
    await alerte.waitFor({ state: "visible", timeout: 30_000 });
    const refus = await lire(alerte);
    expect(refus).toContain("Votre offre Classe couvre L'ESCALE. NOVA n'en fait pas partie");
    expect(refus).toContain("l'offre Campus ouvre les 9 entreprises");
    expect(await alerte.locator("[data-devis-du-refus]").getAttribute("href")).toBe("/devis?offre=campus");
    expect(await alerte.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe("/tarifs");
    // Rien n'a été créé.
    expect(
      await enBase(
        async (b) => (await b.query("select count(*)::int as n from games where organization_id = $1", [orgId])).rows[0].n,
      ),
    ).toBe(0);
    await alerte.scrollIntoViewIfNeeded();
    await capture(page, "teacher-classe-refus-autre-entreprise");

    // Les réglages de la licence : la partie se crée.
    await ouvrirLeFormulaire(page);
    expect(await page.locator('select[name="scenarioCode"]').inputValue()).toBe("hotel");
    await page.selectOption('select[name="humanTeamsCount"]', "1");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    await page.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });

    // De retour : un groupe à la fois, dit avant l'envoi, avec le lien Programme.
    await aller(page, "/teacher");
    await ouvrirLeFormulaire(page);
    const blocage = page.locator('[data-blocage-de-la-licence="parties"]');
    expect(await lire(blocage)).toContain("Votre offre Classe couvre un groupe à la fois");
    expect(await blocage.getByRole("link").getAttribute("href")).toBe("/devis?offre=programme");
    await c.close();
  });

  it("un atelier hors de la licence reste visible, sans bouton, avec son message ; celui de la licence se lance", async () => {
    const c = await contexte();
    await enseignantSousLicence(c, { arene: "classe", entreprises: ["hotel"], niveaux: [3] });
    const page = await c.newPage();
    await aller(page, "/animations/stmg");
    const hors = page.locator("[data-atelier-hors-licence]");
    expect(await hors.getAttribute("data-atelier-hors-licence")).toBe("entreprise");
    expect(await lire(hors)).toContain("NOVA n'en fait pas partie");
    expect(await page.getByRole("link", { name: "Créer la partie dans mon espace enseignant" }).count()).toBe(0);
    await aller(page, "/animations/mhr");
    expect(await page.locator("[data-atelier-hors-licence]").count()).toBe(0);
    expect(await page.getByRole("link", { name: "Créer la partie dans mon espace enseignant" }).count()).toBe(1);
    await c.close();
  });
});

describe("l'enseignant sous licence Programme, puis Campus", () => {
  it("Programme : la ligne d'état, les niveaux 1 à 6, plusieurs parties en même temps", async () => {
    const c = await contexte();
    await enseignantSousLicence(c, { arene: "programme", entreprises: ["hotel"], maxTeachers: 5 });
    const page = await c.newPage();
    await aller(page, "/teacher");
    expect(await lire(page.locator("[data-etat-offre]"))).toMatch(
      /^Offre Programme · L'ESCALE · tous niveaux · 1 enseignant sur 5 · jusqu.au /,
    );
    await ouvrirLeFormulaire(page);
    const niveaux = await options(page, "level");
    expect(niveaux.filter((o) => !o.off).map((o) => o.v)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect((await options(page, "scenarioCode")).filter((o) => !o.off).map((o) => o.v)).toEqual(["hotel"]);
    await page.locator("[data-parametrage-de-la-licence]").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await capture(page, "teacher-programme");
    for (const niveau of ["1", "6"]) {
      await aller(page, "/teacher");
      await ouvrirLeFormulaire(page);
      await page.selectOption('select[name="level"]', niveau);
      await page.selectOption('select[name="humanTeamsCount"]', "1");
      await page.getByRole("button", { name: /Créer la partie/ }).click();
      await page.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    }
    await aller(page, "/teacher");
    expect(await page.locator("[data-blocage-de-la-licence]").count()).toBe(0);
    await c.close();
  });

  it("Campus : aucune option marquée, toute entreprise au niveau 6", async () => {
    const c = await contexte();
    await enseignantSousLicence(c, { arene: "campus" });
    const page = await c.newPage();
    await aller(page, "/teacher");
    expect(await lire(page.locator("[data-etat-offre]"))).toMatch(/^Offre Campus · Lycée sous licence · jusqu.au /);
    await ouvrirLeFormulaire(page);
    expect(await page.locator("[data-parametrage-de-la-licence]").count()).toBe(0);
    expect((await options(page, "scenarioCode")).filter((o) => o.off)).toHaveLength(0);
    expect((await options(page, "level")).filter((o) => o.off)).toHaveLength(0);
    await page.selectOption('select[name="scenarioCode"]', "transport");
    await page.selectOption('select[name="level"]', "6");
    await page.selectOption('select[name="humanTeamsCount"]', "1");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    await page.waitForURL(/\/teacher\/games\//, { timeout: 60_000 });
    await c.close();
  });
});

describe("le formulaire de licence de /admin, offre par offre", () => {
  it("montre les champs de chaque offre, et pose une Classe avec son paramétrage", async () => {
    const c = await contexte();
    const { userId, orgId } = await enseignantSousLicence(c, { licence: false });
    const nom = `École du formulaire ${Date.now()}`;
    await enBase(async (b) => {
      await b.query("update users set is_platform_admin = true where id = $1", [userId]);
      await b.query("update organizations set name = $2 where id = $1", [orgId, nom]);
    });
    const page = await c.newPage();
    await aller(page, "/admin");
    const bloc = page.locator("div.rounded-xl.bg-slate-950", { hasText: nom }).first();
    // Sans licence, le bloc est déplié d'office : le formulaire se voit sans chercher.
    const blocLicence = bloc.locator("details", { hasText: "Licence" });
    expect(await blocLicence.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    const formulaire = bloc.locator("[data-formulaire-licence]");
    // Les offres du catalogue (/admin/offres) qui ouvrent l'arène ou les épisodes.
    const lesOptions = (await formulaire.locator('select[name="offre"] option').allInnerTexts()).map((t) =>
      t.replace(/[  ]/g, " "),
    );
    expect(lesOptions).toEqual([
      "Offre Classe · 290 € par an",
      "Offre Programme · 990 € par an",
      "Offre Campus · 1 990 € par an",
      "Réseaux d'établissements · sur devis",
      "Épisodes manager, en cours ou en école · sur devis",
      "Épisodes manager, pour une entreprise ou un organisme de formation · sur devis",
    ]);
    const champs = async () =>
      formulaire.locator("[data-champ-licence]").evaluateAll((xs) => xs.map((x) => x.getAttribute("data-champ-licence")));
    for (const [offre, attendus] of [
      ["classe", ["entreprise", "niveau"]],
      ["programme", ["entreprise", "plafond"]],
      ["campus", []],
    ] as const) {
      await formulaire.locator('select[name="offre"]').selectOption(offre);
      expect(await champs(), offre).toEqual(attendus);
      expect(await formulaire.locator('input[name="prixCatalogue"]').inputValue(), offre).toBe(
        { classe: "290", programme: "990", campus: "1990" }[offre],
      );
      await formulaire.scrollIntoViewIfNeeded();
      await capture(page, `admin-licence-${offre}`);
    }
    // Une Classe L'ESCALE, niveau 4, posée par le formulaire.
    await formulaire.locator('select[name="offre"]').selectOption("classe");
    await formulaire.locator('select[name="entreprise"]').selectOption("hotel");
    await formulaire.locator('select[name="niveau"]').selectOption("4");
    await formulaire.locator('input[name="label"]').fill("Année 2026-2027");
    await formulaire.locator('input[name="startsAt"]').fill("2026-09-01");
    await formulaire.locator('input[name="endsAt"]').fill("2027-08-31");
    await formulaire.getByRole("button", { name: "Enregistrer la licence" }).click();
    await expect
      .poll(() =>
        enBase(
          async (b) =>
            (
              await b.query(
                "select arene, entreprises, niveaux, max_teachers, max_parties_en_cours from org_licences where organization_id = $1",
                [orgId],
              )
            ).rows,
        ),
      )
      .toEqual([{ arene: "classe", entreprises: ["hotel"], niveaux: [4], max_teachers: 1, max_parties_en_cours: 1 }]);
    // La liste dit le paramétrage, lisible.
    await aller(page, "/admin");
    const bloc2 = page.locator("div.rounded-xl.bg-slate-950", { hasText: nom }).first();
    // Licence en cours et sans souci : le bloc est replié, on le déplie pour lire.
    const blocLicence2 = bloc2.locator("details", { hasText: "Licence" });
    expect(await blocLicence2.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
    await blocLicence2.locator("summary").click();
    expect(await lire(bloc2.locator("[data-perimetre-licence]").first())).toBe(
      "Offre Classe · L'ESCALE · niveau 4 Arbitrage",
    );
    await c.close();
  });
});
