import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { EPISODES_DE_DEMO } from "../../src/config/episodes/demos";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * LE CATALOGUE COMMERCIAL DANS UN VRAI NAVIGATEUR (/admin/offres, migration 0041).
 *
 * Ce que l'intégration (`tests/integration/catalogue-offres.test.ts`) ne voit pas : les
 * gestes de l'administrateur à l'écran, et ce que les autres pages en montrent aussitôt.
 *  · l'admin change le prix de référence d'une offre (interne) : /tarifs ne montre aucun
 *    montant tant que « Afficher les prix sur le site » est éteint (décision d'octobre 2026 :
 *    offres sur mesure, sur devis) ; allumé, /tarifs montre le nouveau prix ;
 *  · l'admin crée un code promo affiché ; /tarifs pose le bandeau (un pourcentage, aucun
 *    montant), un visiteur l'utilise dans /devis et lit « pris en compte » ; /admin montre
 *    le code et le prix remisé ;
 *  · l'admin attribue une licence offerte ; l'enseignant lit « offerte jusqu'au … » ;
 *  · l'admin change les démonstrations ; le catalogue des épisodes suit.
 * Chaque test remet ce qu'il a changé. Avec CAPTURES_CATALOGUE (un dossier), il laisse
 * les captures du rapport.
 */

const CAPTURES = process.env.CAPTURES_CATALOGUE;
const espaces = (t: string) => t.replace(/[  ]/g, " ");
const JOUR = 24 * 60 * 60 * 1000;
const jourISO = (d: Date) => d.toISOString().slice(0, 10);

let navigateur: Browser;
let admin: BrowserContext;

async function enBase<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

async function capture(page: Page, nom: string, options: { fullPage?: boolean } = {}) {
  if (!CAPTURES) return;
  await page.screenshot({ path: `${CAPTURES}/${nom}.png`, ...options });
}

/** Une section de /admin/offres, en capture (sa boîte). */
async function captureSection(page: Page, id: string, nom: string) {
  if (!CAPTURES) return;
  const section = page.locator(`section:has(#${id})`).first();
  await section.scrollIntoViewIfNeeded();
  await section.screenshot({ path: `${CAPTURES}/${nom}.png` });
}

const contexte = (largeur = 1280): Promise<BrowserContext> =>
  navigateur.newContext({ viewport: { width: largeur, height: 900 }, locale: "fr-FR" });

/** Change le prix de Programme dans l'éditeur, et attend le retour à la liste. */
async function prixDeProgramme(page: Page, euros: number, capturer = false) {
  // (l'aperçu ne dit le prix que si l'affichage des prix est allumé)
  await aller(page, "/admin/offres?offre=programme#edition");
  const editeur = page.locator('[data-editeur-offre="programme"]');
  await editeur.locator('[data-champ-offre="prix"]').fill(String(euros));
  // Prix éteints sur le site : le prix saisi est une référence INTERNE, et l'aperçu de la
  // carte le montre tel que /tarifs le montrera, sans montant.
  expect(await editeur.innerText()).toContain("Non affiché sur le site");
  expect(espaces(await editeur.locator('[data-apercu-offre="programme"] [data-prix]').innerText())).toContain("Sur devis");
  if (capturer) await capture(page, "admin-offres-edition-1280", { fullPage: false });
  await editeur.getByRole("button", { name: "Enregistrer l'offre" }).click();
  await page.waitForURL(/fait=offre/);
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  admin = await contexte();
  const { userId } = await enseignantSousLicence(admin, { licence: false });
  await enBase((b) => b.query("update users set is_platform_admin = true, display_name = 'Admin E2E' where id = $1", [userId]));
}, 60_000);

afterAll(async () => {
  await admin?.close();
  await navigateur?.close();
});

describe("/admin/offres", () => {
  it("réservé à l'administrateur de la plateforme : un enseignant est renvoyé", async () => {
    const c = await contexte();
    await enseignantSousLicence(c, { licence: false });
    const page = await c.newPage();
    await page.goto(`${process.env.E2E_BASE_URL}/admin/offres`);
    await page.waitForURL(/\/teacher/);
    expect(await page.locator("[data-admin-offres]").count()).toBe(0);
    await c.close();
  });

  it("l'admin change le prix de référence : caché sur /tarifs par défaut, montré quand il allume l'affichage", async () => {
    const page = await admin.newPage();
    await aller(page, "/admin/offres");
    expect(await page.locator("main h1").innerText()).toBe("Offres et tarifs");
    expect(await page.locator("[data-ligne-offre]").count()).toBeGreaterThanOrEqual(7);
    expect(await page.locator('[data-ligne-offre="programme"] [data-mise-en-avant]').count()).toBe(1);
    // Un seul bouton plein à l'écran de la liste : « Nouvelle offre ».
    expect(await page.locator("main .bouton-plein").count()).toBe(1);
    await capture(page, "admin-offres-liste-1280", { fullPage: true });

    await prixDeProgramme(page, 1090, true);
    // Dans /admin, le prix de référence se lit, marqué interne tant qu'il est caché du site.
    expect(espaces(await page.locator('[data-ligne-offre="programme"] [data-tarif-offre]').innerText())).toBe(
      "1 090 € par an (référence interne)",
    );

    const visiteur = await contexte();
    const tarifs = await visiteur.newPage();
    await aller(tarifs, "/tarifs");
    // Prix éteints (par défaut) : aucun montant, ni l'ancien ni le nouveau.
    expect(espaces(await tarifs.locator("main").innerText())).not.toMatch(/€|par an\b|1 090|990/);
    expect(espaces(await tarifs.locator('[data-offre="programme"] [data-prix]').innerText())).toContain("Sur devis");

    // L'admin allume « Afficher les prix sur le site » : la grille chiffrée revient.
    await aller(page, "/admin/offres#offres");
    expect(await page.locator("[data-etat-affichage]").getAttribute("data-etat-affichage")).toBe("non");
    const reglage = page.locator("form:has([data-reglage-affichage])");
    await reglage.scrollIntoViewIfNeeded();
    await capture(page, "admin-offres-affichage-des-prix-1280");
    await reglage.locator('input[name="prixPublics"]').check();
    await reglage.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForURL(/fait=affichage/);
    await aller(tarifs, "/tarifs");
    expect(espaces(await tarifs.locator('[data-offre="programme"] [data-prix]').innerText())).toContain("1 090 €");
    expect(espaces(await tarifs.locator('[data-offre="campus"]').innerText())).toContain(
      "Dès 2 entreprises, moins cher que 2 offres Programme",
    );
    // Et on l'éteint de nouveau : plus aucun montant.
    await aller(page, "/admin/offres#offres");
    await page.locator("form:has([data-reglage-affichage])").locator('input[name="prixPublics"]').uncheck();
    await page.locator("form:has([data-reglage-affichage])").getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForURL(/fait=affichage/);
    await aller(tarifs, "/tarifs");
    expect(espaces(await tarifs.locator("main").innerText())).not.toMatch(/€|par an\b/);
    // Les pages statiques qui portent la ligne des offres se régénèrent à la visite suivante
    // (le cache sert la version d'avant pendant qu'il recalcule) : au bout de quelques
    // visites, plus aucun montant.
    for (const chemin of ["/enseignants", "/ecoles", "/fonctionnalites"]) {
      await expect
        .poll(
          async () => {
            await aller(tarifs, chemin);
            return espaces(await tarifs.locator("[data-ligne-de-prix]").innerText());
          },
          { timeout: 30_000, interval: 1000 },
        )
        .not.toMatch(/€|par an\b/);
    }
    await visiteur.close();

    // L'historique dit qui, quand, et le prix avant et après.
    await aller(page, "/admin/offres#historique");
    expect(espaces(await page.locator('[data-entree-journal="offre"]').first().innerText())).toMatch(
      /Admin E2E .* offre programme · modification · prix 990 € → 1 090 €/,
    );
    await captureSection(page, "historique", "admin-offres-historique-1280");

    await prixDeProgramme(page, 990);
    expect(espaces(await page.locator('[data-ligne-offre="programme"] [data-tarif-offre]').innerText())).toMatch(
      /^990 € par an/,
    );
    await page.close();
  });

  it("l'admin crée un code promo affiché : bandeau sur /tarifs, « pris en compte » dans /devis, code et prix remisé dans /admin", async () => {
    const code = `E2E${Date.now() % 1_000_000}`;
    const page = await admin.newPage();
    await aller(page, "/admin/offres#codes");
    const form = page.locator("section:has(#codes) form").last();
    await form.locator('input[name="code"]').fill(code.toLowerCase());
    await form.locator('input[name="valeur"]').fill("20");
    await form.locator('input[name="fin"]').fill(jourISO(new Date(Date.now() + 30 * JOUR)));
    await form.locator('input[name="affiche"]').check();
    await form.locator('input[name="toutesLesOffres"]').uncheck();
    await form.locator('input[name="offres"][value="programme"]').check();
    await form.getByRole("button", { name: "Créer le code" }).click();
    await page.waitForURL(/fait=code/);
    expect(espaces(await page.locator(`[data-code-promo="${code}"]`).innerText())).toContain("−20 % · Programme");
    expect(await page.locator("[data-promotion-affichee]").innerText()).toContain(`avec le code ${code}`);
    await captureSection(page, "codes", "admin-offres-codes-promo-1280");

    const visiteur = await contexte();
    const tarifs = await visiteur.newPage();
    await aller(tarifs, "/tarifs");
    const bandeau = espaces(await tarifs.locator("[data-bandeau-promotion]").innerText());
    expect(bandeau).toMatch(new RegExp(`^−20 % sur Programme jusqu'au \\d+ \\S+ avec le code ${code}$`));
    // Le bandeau est sobre : aucun orange, aucun bouton.
    expect(await tarifs.locator("[data-bandeau-promotion] a, [data-bandeau-promotion] button").count()).toBe(0);
    expect(await tarifs.locator("main .bouton-plein").count()).toBe(1);

    const devis = await visiteur.newPage();
    await aller(devis, "/devis?offre=programme");
    const f = devis.locator("[data-formulaire-devis]");
    // Un code inconnu : refusé, la demande n'est pas envoyée.
    await f.locator('input[name="nom"]').fill("Claire Martin");
    await f.locator('input[name="fonction"]').fill("Directrice des études");
    await f.locator('input[name="organisation"]').fill(`École du code ${code}`);
    await f.locator('select[name="entreprise"]').selectOption("nova");
    await f.locator('input[name="email"]').fill(`claire-${code.toLowerCase()}@e2e.test`);
    await f.locator('input[name="codePromo"]').fill("NEXISTEPAS");
    await f.getByRole("button", { name: "Envoyer la demande de devis" }).click();
    await expect.poll(async () => (await devis.locator('[role="alert"]').allInnerTexts()).join(" ")).toContain(
      "Ce code promo n'existe pas",
    );
    await f.locator('input[name="codePromo"]').fill(code.toLowerCase());
    await f.getByRole("button", { name: "Envoyer la demande de devis" }).click();
    const confirme = devis.locator("[data-devis-confirme]");
    await confirme.waitFor();
    expect(espaces(await confirme.locator("[data-devis-promo]").innerText())).toBe(
      `Code ${code} pris en compte : la remise sera appliquée à votre devis.`,
    );
    expect(espaces(await confirme.innerText())).not.toMatch(/\d\s?€|par an\b|\bHT\b|\bTTC\b/);
    await capture(devis, "devis-code-promo-1280", { fullPage: true });
    await visiteur.close();

    const v390 = await contexte(390);
    const d390 = await v390.newPage();
    await aller(d390, "/devis?offre=programme");
    const debord = await d390.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(debord, "défilement de côté à 390").toBeLessThanOrEqual(0);
    await v390.close();

    await aller(page, "/admin");
    const ligne = page.locator(`[data-devis-code-promo="${code}"]`);
    expect(espaces(await ligne.innerText())).toContain("remisé 792 €");
    await ligne.scrollIntoViewIfNeeded();
    await capture(page, "admin-devis-code-promo-1280");

    // Le bandeau se retire : on décoche « Bandeau sur /tarifs ».
    await aller(page, "/admin/offres#codes");
    await page.locator(`[data-code-promo="${code}"]`).getByRole("link", { name: "Modifier" }).click();
    await page.waitForURL(/code=/);
    const edition = page.locator("section:has(#codes) form").last();
    await edition.locator('input[name="affiche"]').uncheck();
    await edition.getByRole("button", { name: "Enregistrer le code" }).click();
    await page.waitForURL(/fait=code/);
    const v3 = await contexte();
    const t3 = await v3.newPage();
    await aller(t3, "/tarifs");
    expect(await t3.locator("[data-bandeau-promotion]").count()).toBe(0);
    await v3.close();
    await page.close();
  });

  it("l'admin attribue une licence offerte : l'enseignant lit « offerte jusqu'au … »", async () => {
    const prof = await contexte();
    const { orgId } = await enseignantSousLicence(prof, { licence: false });
    const nom = `École pilote ${Date.now()}`;
    await enBase((b) => b.query("update organizations set name = $2 where id = $1", [orgId, nom]));

    const page = await admin.newPage();
    await aller(page, "/admin");
    const bloc = page.locator("div.rounded-xl.bg-slate-950", { hasText: nom }).first();
    await bloc.locator("details", { hasText: "Licence" }).locator("summary").click();
    const formulaire = bloc.locator("[data-formulaire-licence]");
    await formulaire.locator('select[name="offre"]').selectOption("campus");
    await formulaire.locator('input[name="nature"][value="offerte"]').check();
    expect(espaces(await formulaire.locator("[data-montant-facture]").innerText())).toContain("Montant facturé : 0 €");
    await formulaire.locator('select[name="motifGratuite"]').selectOption("pilote");
    await formulaire.locator('input[name="label"]').fill("Pilote 2026-2027");
    await formulaire.locator('input[name="startsAt"]').fill(jourISO(new Date(Date.now() - JOUR)));
    await formulaire.locator('input[name="endsAt"]').fill("2027-08-31");
    await formulaire.scrollIntoViewIfNeeded();
    await capture(page, "admin-licence-offerte-1280");
    await formulaire.getByRole("button", { name: "Enregistrer la licence" }).click();
    await expect
      .poll(() =>
        enBase(async (b) => (await b.query("select nature, motif_gratuite, amount_cents, arene, offre_code from org_licences where organization_id = $1", [orgId])).rows),
      )
      .toEqual([{ nature: "offerte", motif_gratuite: "pilote", amount_cents: 0, arene: "campus", offre_code: "campus" }]);

    const p = await prof.newPage();
    await aller(p, "/teacher");
    const etat = p.locator("[data-etat-offre]");
    expect(espaces(await etat.innerText())).toContain("Offre Campus offerte jusqu'au 31 août 2027");
    await etat.scrollIntoViewIfNeeded();
    if (CAPTURES) await etat.screenshot({ path: `${CAPTURES}/teacher-ligne-offerte.png` });

    await aller(page, "/admin/offres#gratuites");
    expect(await page.locator("[data-licences-gratuites]").innerText()).toContain(nom);
    await prof.close();
    await page.close();
  });

  it("l'admin change les démonstrations : le catalogue des épisodes suit", async () => {
    const retiree = EPISODES_DE_DEMO[0];
    const ajoutee = EPISODES.find((e) => !(EPISODES_DE_DEMO as readonly string[]).includes(e.code))!;
    const titre = (code: string) => EPISODES.find((e) => e.code === code)!.titre;
    const page = await admin.newPage();
    const demos = async (cocher: string, decocher: string) => {
      await aller(page, "/admin/offres#gratuites");
      const choix = page.locator("[data-choix-des-demos]");
      for (const d of await choix.locator("details").all()) {
        if (!(await d.evaluate((e) => (e as HTMLDetailsElement).open))) await d.locator("summary").click();
      }
      await choix.locator(`input[name="demos"][value="${cocher}"]`).check();
      await choix.locator(`input[name="demos"][value="${decocher}"]`).uncheck();
      await page.getByRole("button", { name: "Enregistrer la Découverte" }).click();
      await page.waitForURL(/fait=decouverte/);
    };
    await demos(ajoutee.code, retiree);
    await captureSection(page, "gratuites", "admin-offres-gratuites-1280");

    const visiteur = await contexte();
    const v = await visiteur.newPage();
    await aller(v, "/entreprises/episode");
    const vitrine = await v.locator("[data-demos-gratuites]").innerText();
    expect(vitrine).toContain(ajoutee.titre);
    expect(vitrine).not.toContain(titre(retiree));
    await aller(v, `/entreprises/episode/${ajoutee.code}`);
    expect(await v.locator("[data-episode-ferme]").count()).toBe(0);
    await aller(v, `/entreprises/episode/${retiree}`);
    expect(await v.locator("[data-episode-ferme]").count()).toBe(1);

    // On remet les démonstrations de la grille.
    await demos(retiree, ajoutee.code);
    await aller(v, "/entreprises/episode");
    expect(await v.locator("[data-demos-gratuites]").innerText()).toContain(titre(retiree));
    await visiteur.close();
    await page.close();
  });

  it("modules et téléphone : les modules disent effet ou descriptif ; à 390, rien ne déborde", async () => {
    const page = await admin.newPage();
    await aller(page, "/admin/offres#modules");
    expect(await page.locator('[data-effet-module="arene"]').count()).toBe(1);
    expect(await page.locator('[data-effet-module="episodes"]').count()).toBe(1);
    expect(await page.locator('[data-effet-module="descriptif"]').count()).toBeGreaterThanOrEqual(4);
    await captureSection(page, "modules", "admin-offres-modules-1280");
    await page.close();

    const tel = await navigateur.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
    const cookies = await admin.cookies();
    await tel.addCookies(cookies);
    const p = await tel.newPage();
    for (const chemin of ["/admin/offres", "/admin/offres?offre=classe#edition"]) {
      await aller(p, chemin);
      const debord = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(debord, `${chemin} : défilement de côté à 390`).toBeLessThanOrEqual(0);
    }
    expect(espaces(await texte(p))).toContain("Aperçu sur /tarifs");
    await capture(p, "admin-offres-edition-390", { fullPage: true });
    await tel.close();
  });
});
