import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte, unique } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { DIPLOMES_DES_LYCEES, ESSAIS_DES_LYCEES } from "../../src/config/lycees";
import { DELAIS_APRES_LE_DEVIS } from "../../src/config/conditions-legales";
import { PARCOURS_EN_COHORTE, SEMAINES_DU_PARCOURS } from "../../src/config/episodes/parcours-en-cohorte";
import { VENDEUR } from "../../src/config/editeur";
import { LES_OFFRES_DE_L_ARENE } from "../../src/config/tarifs";
import { PUBLIC_DES_EPISODES } from "../../src/config/episodes/public-des-episodes";
import { EPISODES_DE_DEMO } from "../../src/config/episodes/demos";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import { SUR_MESURE } from "../../src/config/sur-mesure";
import { espacesOrdinaires } from "../../src/lib/typographie";

/**
 * LES PAGES DE L'OFFRE, DANS UN VRAI NAVIGATEUR (chantier 3 des corrections de l'audit du 11 novembre
 * 2026 ; décisions du propriétaire). Sur la copie construite, base de données comprise :
 *  · /lycees, à 1 280 et à 390 px : au menu après « Enseignants », le bac STMG et les BTS, le chapitre
 *    libre de chacun qui s'ouvre sans compte, les offres, la commande publique, aucun devis des épisodes ;
 *  · /entreprises/offre : le déroulé de 8 semaines, les animateurs dans l'espace enseignant, ce qui
 *    distingue les formules, rien sur le financement ;
 *  · le devis : l'écran de confirmation dit les délais ; la page et les CGV portent la fiche fournisseur ;
 *  · /tarifs : « oui pour le cours » à l'essai avec un groupe, le supérieur en tête des épisodes ;
 *  · /join : « Votre code », « Valider », l'équipe promise pour une partie seulement ;
 *  · les portes : /ecoles, /integration (une demande écrite), /entreprises, l'épisode payant fermé,
 *    /etablissement, le devis du sur-mesure ; l'inscription enseignant dit toutes ses erreurs d'un coup.
 * Avec E2E_CAPTURES (un dossier), les écrans sont photographiés à 1 280 et à 390 px.
 */

const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

const LARGEURS = [1280, 390] as const;

/** Un contexte à cette largeur ; une adresse d'origine à part (les demandes écrites ont leurs plafonds). */
async function contexte(largeur: number, ip?: string): Promise<BrowserContext> {
  const c = await navigateur.newContext(
    largeur < 600
      ? { ...devices["iPhone 13"], viewport: { width: largeur, height: 844 }, locale: "fr-FR", ...(ip ? { extraHTTPHeaders: { "x-real-ip": ip } } : {}) }
      : { viewport: { width: largeur, height: 900 }, locale: "fr-FR", ...(ip ? { extraHTTPHeaders: { "x-real-ip": ip } } : {}) },
  );
  await c.addInitScript(() => {
    try {
      localStorage.setItem("install-prompt-ferme-le", String(Date.now()));
    } catch {
      /* rien */
    }
  });
  return c;
}

/**
 * Avec E2E_CAPTURES, l'écran est photographié : l'écran visible, un élément au milieu de l'écran, un seul
 * élément, ou la page entière. Pour un élément seul et pour la page entière, la barre collante du site
 * reste en tête de page le temps de la photo : sinon, elle en couvre une partie.
 */
async function capturer(page: Page, nom: string, options: { pleine?: boolean; cible?: string; milieu?: boolean } = {}) {
  const dossier = process.env.E2E_CAPTURES;
  if (!dossier) return;
  mkdirSync(dossier, { recursive: true });
  const chemin = join(dossier, `${nom}.png`);
  if (options.cible && options.milieu) {
    // L'écran, l'élément au milieu : on le lit avec ce qui l'entoure.
    await page.locator(options.cible).first().evaluate((e) => e.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: chemin });
    return;
  }
  if (!options.cible && !options.pleine) {
    await page.screenshot({ path: chemin });
    return;
  }
  const style = await page.addStyleTag({ content: "[data-en-tete-du-site]{position:static !important}" });
  if (options.cible) {
    await page.locator(options.cible).first().scrollIntoViewIfNeeded();
    await page.locator(options.cible).first().screenshot({ path: chemin });
  } else {
    await page.screenshot({ path: chemin, fullPage: true });
  }
  await style.evaluate((s) => (s as Element).remove());
}

const debordement = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const lu = async (l: { innerText(): Promise<string> }) => espacesOrdinaires(await l.innerText()).replace(/\s+/g, " ").trim();

/** Les violations WCAG 2.1 A et AA du contenu de la page (axe-core). */
async function violations(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe;
    const r = await axe.run({ include: ["main"] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(", ")}`);
  });
}

describe("/lycees, pour le proviseur", () => {
  for (const largeur of LARGEURS) {
    it(`à ${largeur} px : le STMG et les BTS, leur chapitre libre, les offres, la commande publique`, async () => {
      const c = await contexte(largeur);
      const page = await c.newPage();
      await aller(page, "/lycees");
      expect(await page.getByRole("heading", { level: 1 }).innerText()).toMatch(/bac STMG et les BTS/);
      const t = espacesOrdinaires(await texte(page));
      for (const f of DIPLOMES_DES_LYCEES) expect(t, f.sigle).toContain(espacesOrdinaires(f.sigle));
      expect(await page.locator("[data-diplome-du-lycee]").count()).toBe(DIPLOMES_DES_LYCEES.length);
      expect(await page.locator("[data-offre-du-lycee]").count()).toBe(3);
      for (const mot of ["bon de commande", "mandat administratif", "Chorus Pro", "Aucun compte élève", VENDEUR.siret]) {
        expect(t, mot).toContain(mot);
      }
      expect(t).toContain(DELAIS_APRES_LE_DEVIS);
      // Le devis du cours ou de l'arène, jamais celui des épisodes.
      const devis = await page.locator('main a[href^="/devis?"]').evaluateAll((xs) => xs.map((x) => x.getAttribute("href")));
      expect(devis.length).toBeGreaterThan(0);
      for (const h of devis) expect(h, h ?? "").toMatch(/^\/devis\?offre=(classe|programme|campus)(&|$)/);
      expect(await lu(page.locator("main"))).not.toMatch(/pisode/);
      expect(await debordement(page)).toBeLessThanOrEqual(0);
      expect(await violations(page)).toEqual([]);
      await capturer(page, `lycees-${largeur}`, { pleine: true });
      await c.close();
    }, 120_000);
  }

  it("au menu, juste après « Enseignants » ; chaque chapitre libre et son cas s'ouvrent sans compte", async () => {
    const c = await contexte(1280);
    const page = await c.newPage();
    await aller(page, "/tarifs");
    // Sur grand écran, le mot « Offres » ouvre son panneau (novembre 2026, la maquette A) : chaque entrée
    // y est une carte, nommée par son mot.
    await page.locator('[data-mot-de-la-barre="offres"]').click();
    const offres = page.locator('[data-panneau-du-groupe="offres"] [data-entree-du-panneau]');
    await offres.first().waitFor({ state: "visible" });
    const entrees = await offres.evaluateAll((xs) =>
      xs.map((x) => [document.getElementById(x.getAttribute("aria-labelledby") ?? "")?.textContent?.trim(), x.getAttribute("href")]),
    );
    const i = entrees.findIndex(([, h]) => h === "/enseignants");
    expect(entrees[i + 1]).toEqual(["Lycées", "/lycees"]);
    await page.locator('[data-panneau-du-groupe="offres"] a[href="/lycees"]').click();
    await page.waitForURL(/\/lycees$/);
    // Sans compte : chaque chapitre libre, et son cas, s'ouvrent (aucun contenu réservé).
    for (const e of ESSAIS_DES_LYCEES) {
      for (const contenu of [e.chapitre, ...(e.cas ? [e.cas] : [])]) {
        const r = await c.request.get(`${BASE}/cours/${contenu.code}?diplome=${e.diplome.code}`);
        expect(r.status(), contenu.code).toBe(200);
        expect(await r.text(), contenu.code).not.toMatch(/data-acces-du-cours|data-chapitre-ferme-a-l-eleve/);
      }
    }
    expect((await c.request.get(`${BASE}/sitemap.xml`)).status()).toBe(200);
    expect(await (await c.request.get(`${BASE}/sitemap.xml`)).text()).toContain("/lycees</loc>");
    await c.close();
  }, 120_000);
});

describe("/entreprises/offre", () => {
  for (const largeur of LARGEURS) {
    it(`à ${largeur} px : le déroulé, les animateurs, ce qui distingue les formules, rien sur le financement`, async () => {
      const c = await contexte(largeur);
      const page = await c.newPage();
      await aller(page, "/entreprises/offre");
      const deroule = page.locator("[data-deroule]");
      expect(await lu(deroule.locator("h2"))).toBe(`Le déroulé : ${SEMAINES_DU_PARCOURS} semaines, en cohorte`);
      for (const e of PARCOURS_EN_COHORTE) expect(await lu(deroule)).toContain(espacesOrdinaires(e.texte));
      const animateurs = await lu(page.locator("[data-animateurs]"));
      expect(animateurs).toContain("espace enseignant, rubrique « Cohortes »");
      expect(await page.locator('[data-animateurs] a[href="/teacher/login"]').count()).toBe(1);
      const distingue = await lu(page.locator("[data-ce-qui-distingue-les-formules]"));
      expect(distingue).toContain(`Les 3 formules ouvrent la même chose dans l'application : les ${EPISODES.length} épisodes`);
      expect(distingue).toContain("leur différence est seulement commerciale");
      expect(await lu(page.locator("main"))).not.toMatch(/financ|OPCO|CPF|Qualiopi/i);
      // Le devis pour une entreprise (celui de la colonne des formules, puis celui de la section « Le devis »),
      // jamais celui des épisodes en école.
      const devis = await page.locator('main a[href^="/devis"]').evaluateAll((xs) => xs.map((x) => x.getAttribute("href")));
      expect(devis.length).toBeGreaterThan(0);
      for (const h of devis) expect(h).toBe("/devis?offre=entreprise");
      expect(await debordement(page)).toBeLessThanOrEqual(0);
      await capturer(page, `entreprises-offre-${largeur}`, { pleine: true });
      await c.close();
    }, 120_000);
  }
});

describe("après le devis : les délais et la fiche fournisseur", () => {
  for (const largeur of LARGEURS) {
    it(`à ${largeur} px : la confirmation dit les délais ; la page porte la fiche fournisseur`, async () => {
      const c = await contexte(largeur, `198.51.100.${largeur === 1280 ? 61 : 62}`);
      const page = await c.newPage();
      await aller(page, "/devis?offre=campus");
      const fiche = page.locator("[data-fiche-fournisseur]");
      const lueFiche = await lu(fiche);
      for (const mot of [VENDEUR.siret, `${VENDEUR.adresse.rue}, ${VENDEUR.adresse.codePostal} ${VENDEUR.adresse.ville}`, "Chorus Pro", "RIB", "sur demande"]) {
        expect(lueFiche, mot).toContain(mot);
      }
      await capturer(page, `devis-fiche-fournisseur-${largeur}`, { cible: "[data-fiche-fournisseur]" });
      await page.fill('input[name="nom"]', "Claire Martin");
      await page.fill('input[name="fonction"]', "Proviseure adjointe");
      await page.fill('input[name="organisation"]', "Lycée Pasteur");
      await page.fill('input[name="identifiant"]', "0590001A");
      await page.fill('input[name="email"]', unique(`delais-${largeur}`));
      await page.getByRole("button", { name: "Envoyer la demande de devis" }).click();
      const confirme = page.locator("[data-devis-confirme]");
      await confirme.waitFor({ state: "visible", timeout: 30_000 });
      expect(await lu(confirme.locator("[data-delais-du-devis]"))).toBe(DELAIS_APRES_LE_DEVIS);
      expect(await debordement(page)).toBeLessThanOrEqual(0);
      await capturer(page, `devis-confirmation-${largeur}`, { cible: "[data-devis-confirme]" });
      await c.close();
    }, 120_000);
  }

  for (const largeur of LARGEURS) {
    it(`à ${largeur} px : les CGV disent les délais et portent la fiche fournisseur ; leur surtitre dit « Offres »`, async () => {
      const c = await contexte(largeur);
      const page = await c.newPage();
      await aller(page, "/cgv");
      expect(await lu(page.locator("[data-delais-du-devis]"))).toBe(DELAIS_APRES_LE_DEVIS);
      expect(await lu(page.locator("[data-fiche-fournisseur]"))).toContain(VENDEUR.siret);
      // textContent : le surtitre est en capitales par le style, pas dans le texte.
      expect((await page.locator("[data-en-tete-de-page] .surtitre").textContent())?.trim()).toBe("Offres");
      expect(await debordement(page)).toBeLessThanOrEqual(0);
      await capturer(page, `cgv-delais-${largeur}`, { cible: "[data-delais-du-devis]", milieu: true });
      await capturer(page, `cgv-fiche-fournisseur-${largeur}`, { cible: "[data-fiche-fournisseur]" });
      await c.close();
    });
  }
});

describe("/tarifs", () => {
  for (const largeur of LARGEURS) {
    it(`à ${largeur} px : « oui pour le cours » à l'essai avec un groupe, le supérieur en tête des épisodes`, async () => {
      const c = await contexte(largeur);
      const page = await c.newPage();
      await aller(page, "/tarifs");
      const question = page.locator("dt", { hasText: /Peut-on essayer avec un groupe/ }).locator("xpath=..");
      const reponse = await lu(question.locator("dd"));
      expect(reponse).toBe(
        `Oui, pour le cours : créez votre compte enseignant, puis une classe ; vos élèves y suivent le chapitre libre de leur diplôme et son cas pratique, sans offre. Les parties de classe de l'arène commencent avec ${LES_OFFRES_DE_L_ARENE}.`,
      );
      expect(await lu(page.locator("[data-public-des-episodes]"))).toBe(espacesOrdinaires(PUBLIC_DES_EPISODES));
      await capturer(page, `tarifs-essai-${largeur}`, { cible: "section[aria-labelledby='questions']" });
      await capturer(page, `tarifs-episodes-${largeur}`, { cible: "[data-bande-episodes]" });
      await c.close();
    }, 120_000);
  }
});

describe("/join parle de tous les codes", () => {
  for (const largeur of LARGEURS) {
    it(`à ${largeur} px : « Votre code », « Valider », l'équipe promise pour une partie`, async () => {
      const c = await contexte(largeur);
      const page = await c.newPage();
      await aller(page, "/join");
      expect(await page.getByLabel("Votre code").count()).toBe(1);
      expect(await page.getByRole("button", { name: "Valider", exact: true }).count()).toBe(1);
      const t = espacesOrdinaires(await texte(page));
      expect(t).not.toContain("Code de la partie");
      expect(t).not.toContain("Rejoindre la partie");
      expect(t).toContain("Pour une partie, vous serez affecté automatiquement à une équipe.");
      expect(t).toContain("En validant, vous acceptez les conditions générales d'utilisation.");
      // Un code faux : le message dit tous les codes, et la saisie reste.
      await page.getByLabel("Votre code").fill("ZZZZZZ");
      await page.fill('input[name="pseudo"]', "Léa");
      await page.getByRole("button", { name: "Valider", exact: true }).click();
      const alerte = page.locator("form [role=alert]");
      await alerte.waitFor({ state: "visible" });
      expect(await lu(alerte)).toMatch(/aucune partie, classe, cohorte, concours ni examen/);
      expect(await page.getByLabel("Votre code").inputValue()).toBe("ZZZZZZ");
      expect(await debordement(page)).toBeLessThanOrEqual(0);
      await capturer(page, `join-${largeur}`);
      await c.close();
    }, 120_000);
  }
});

describe("les portes", () => {
  it("/ecoles : deux devis côte à côte dans l'ouverture ; l'examen dit ce qu'il garde ; plus de Qualiopi", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/ecoles");
    const ouverture = page.locator("[data-cta-principal]").first();
    const liens = await ouverture.locator("a").evaluateAll((xs) => xs.map((x) => x.getAttribute("href")));
    expect(liens).toContain("/devis?offre=episodes");
    expect(liens).toContain("/devis?offre=campus");
    const t = espacesOrdinaires(await texte(page));
    expect(t).toContain("L'examen individuel garde le nom et le numéro d'étudiant du candidat.");
    expect(t).not.toMatch(/Qualiopi/);
    expect(t).toContain("Toutes les offres →");
    await capturer(page, "ecoles-ouverture-390");
    await c.close();
  });

  it("/integration : l'adresse d'inscription se demande par écrit, et la demande s'enregistre", async () => {
    const c = await contexte(390, "198.51.100.63");
    const page = await c.newPage();
    await aller(page, "/integration");
    const lien = page.getByRole("link", { name: "Demander votre adresse d'inscription" });
    expect(await lien.getAttribute("href")).toBe("#adresse-d-inscription");
    await lien.click();
    // Envoyée vide : toutes les erreurs d'un coup, chacune sous son champ.
    await page.getByRole("button", { name: "Demander l'adresse d'inscription" }).click();
    await expect.poll(() => page.locator("[data-demande-d-adresse] [data-erreur-du-champ]").count()).toBe(5);
    await capturer(page, "integration-erreurs-390", { cible: "#adresse-d-inscription" });
    await page.fill('[data-demande-d-adresse] input[name="nom"]', "Claire Martin");
    await page.fill('[data-demande-d-adresse] input[name="fonction"]', "Administratrice Moodle");
    await page.fill('[data-demande-d-adresse] input[name="organisation"]', "Lycée Pasteur");
    await page.selectOption('[data-demande-d-adresse] select[name="plateforme"]', "Moodle");
    await page.fill('[data-demande-d-adresse] input[name="email"]', unique("adresse-lti"));
    await page.getByRole("button", { name: "Demander l'adresse d'inscription" }).click();
    const ok = page.locator("[data-adresse-demandee]");
    await ok.waitFor({ state: "visible", timeout: 30_000 });
    expect(await lu(ok)).toContain("Votre demande d'adresse d'inscription est enregistrée");
    expect(await ok.locator("[data-accuse]").getAttribute("data-accuse")).toBe("non-envoye");
    expect(await debordement(page)).toBeLessThanOrEqual(0);
    await capturer(page, "integration-demande-390", { cible: "#adresse-d-inscription" });
    await c.close();
  }, 120_000);

  it("/entreprises : l'encart « Pour les entreprises » en tête, vers l'offre", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/entreprises");
    const encart = page.locator("[data-encart-entreprises]");
    // textContent : le titre de l'encart est en capitales par le style.
    expect(espacesOrdinaires((await encart.textContent()) ?? "").trim()).toMatch(/^Pour les entreprises/);
    expect(await encart.locator('a[href="/entreprises/offre"]').count()).toBe(1);
    const haut = (await encart.boundingBox())!.y;
    expect(haut, "l'encart passe avant le titre").toBeLessThan((await page.locator("h1").boundingBox())!.y);
    expect(haut, "l'encart est dans le premier écran").toBeLessThan(844);
    await capturer(page, "entreprises-encart-390");
    await c.close();
  });

  it("un épisode payant fermé : le devis pour une entreprise, celui de l'école pour un enseignant connecté", async () => {
    const ferme = EPISODES.find((e) => !(EPISODES_DE_DEMO as readonly string[]).includes(e.code))!;
    const visiteur = await contexte(390);
    const page = await visiteur.newPage();
    await aller(page, `/entreprises/episode/${ferme.code}`);
    const bloc = page.locator(`[data-episode-ferme="${ferme.code}"]`);
    expect(await bloc.getByRole("link", { name: "Demander un devis" }).getAttribute("href")).toBe("/devis?offre=entreprise");
    await capturer(page, "episode-ferme-390");
    await visiteur.close();
    const prof = await contexte(1280);
    await enseignantSousLicence(prof, { licence: false });
    const p2 = await prof.newPage();
    await aller(p2, `/entreprises/episode/${ferme.code}`);
    expect(
      await p2.locator(`[data-episode-ferme="${ferme.code}"]`).getByRole("link", { name: "Demander un devis" }).getAttribute("href"),
    ).toBe("/devis?offre=episodes");
    await prof.close();
  });

  it("/etablissement mène à l'entrée de l'espace établissement", async () => {
    const c = await contexte(1280);
    const r = await c.request.get(`${BASE}/etablissement`, { maxRedirects: 0 });
    expect(r.status()).toBe(307);
    expect(r.headers()["location"]).toBe("/etablissement/parties");
    const page = await c.newPage();
    await aller(page, "/etablissement");
    expect(new URL(page.url()).pathname).toBe("/etablissement/parties");
    await c.close();
  });

  it("le devis du sur-mesure n'exige ni l'entreprise ni le niveau", async () => {
    const c = await contexte(1280);
    const page = await c.newPage();
    await aller(page, "/enseignants");
    const lien = page.locator(`[data-sur-mesure-paragraphe] a[href="${SUR_MESURE.appel.devis.href}"]`);
    await lien.click();
    await page.waitForURL(/\/devis\?offre=campus$/);
    await page.waitForLoadState("networkidle");
    expect(await page.locator('select[name="entreprise"][required], select[name="niveau"][required]').count()).toBe(0);
    await c.close();
  });
});

describe("les autres écrans changés, à 390 px", () => {
  it("le menu : « Lycées » juste après « Enseignants »", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/");
    // Sur téléphone, « Menu » ouvre la liste des groupes, puis le groupe « Offres » (novembre 2026, la maquette A).
    await page.getByRole("button", { name: "Menu" }).click();
    await page.locator('#plan-du-site [data-groupe-du-menu="offres"]').click();
    const groupe = page.locator('#plan-du-site [data-groupe-du-plan="offres"]');
    const lycees = groupe.locator('a[href="/lycees"]');
    await lycees.waitFor({ state: "visible" });
    expect(await groupe.getByRole("link", { name: "Lycées", exact: true }).getAttribute("href")).toBe("/lycees");
    const entrees = await groupe.locator("[data-entree-du-menu]").evaluateAll((xs) => xs.map((x) => x.getAttribute("href")));
    expect(entrees[entrees.indexOf("/enseignants") + 1]).toBe("/lycees");
    // L'écran, le groupe « Offres » ouvert, « Lycées » au milieu (le menu défile dans son cadre).
    await capturer(page, "menu-lycees-390", { cible: '#plan-du-site [data-groupe-du-plan="offres"] a[href="/lycees"]', milieu: true });
    await c.close();
  });

  it("/jouer, après un niveau refusé : « voyez les offres »", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/jouer?reserve=1");
    const statut = page.locator("main [role=status]", { hasText: "Choisissez un niveau plus bas" });
    expect(await statut.getByRole("link", { name: "voyez les offres" }).getAttribute("href")).toBe("/tarifs");
    await capturer(page, "jouer-niveau-reserve-390", { cible: "main [role=status]", milieu: true });
    await c.close();
  });

  it("/ecoles : l'accréditation, les données, la bande finale et ses 2 devis", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/ecoles");
    const accreditation = page.locator("section[aria-labelledby='accreditation']");
    expect(espacesOrdinaires((await accreditation.textContent()) ?? "")).toContain("Pour l'accréditation de votre école");
    await capturer(page, "ecoles-accreditation-390", { cible: "#accreditation", milieu: true });
    await capturer(page, "ecoles-donnees-390", { cible: "dt:has-text('Quelles données sont collectées')", milieu: true });
    const finale = page.locator("[data-cta-principal]").last();
    const liens = await finale.locator("a").evaluateAll((xs) => xs.map((x) => x.getAttribute("href")));
    expect(liens).toContain("/devis?offre=episodes");
    expect(liens).toContain("/devis?offre=campus");
    await capturer(page, "ecoles-bande-finale-390", { cible: "[data-cta-principal] >> nth=-1", milieu: true });
    await capturer(page, "ecoles-parcours-390", { cible: "#parcours", milieu: true });
    await c.close();
  });

  it("/devis : le surtitre « Offres » et le lien vers la page Offres", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/devis?offre=campus");
    expect((await page.locator("[data-en-tete-de-page] .surtitre").textContent())?.trim()).toBe("Offres");
    await capturer(page, "devis-haut-390");
    await c.close();
  });

  it("/integration : le lien de tête mène au formulaire de la page", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/integration");
    expect(espacesOrdinaires(await texte(page))).toContain("les offres et la demande de devis");
    await capturer(page, "integration-lien-390", { cible: 'a[href="#adresse-d-inscription"]', milieu: true });
    await c.close();
  });

  it("/etablissement : l'entrée de l'espace établissement, plus de page introuvable", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/etablissement");
    expect(new URL(page.url()).pathname).toBe("/etablissement/parties");
    await capturer(page, "etablissement-390");
    await c.close();
  });
});

describe("l'inscription enseignant dit toutes ses erreurs d'un coup", () => {
  it("envoyée vide : le nom, l'adresse et le mot de passe, chacun sous son champ", async () => {
    const c = await contexte(390);
    const page = await c.newPage();
    await aller(page, "/teacher/login");
    await page.getByRole("button", { name: "Créer un compte" }).click();
    await page.getByRole("button", { name: "Créer mon compte enseignant" }).click();
    for (const champ of ["displayName", "email", "password"]) {
      await page.locator(`[data-erreur-du-champ="${champ}"]`).waitFor({ state: "visible" });
    }
    expect(await page.locator("[data-erreur-du-champ]").count()).toBe(3);
    await capturer(page, "inscription-erreurs-390", { pleine: true });
    await c.close();
  });
});
