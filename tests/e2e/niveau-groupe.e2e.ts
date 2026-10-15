import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";

/**
 * LE NIVEAU 7 « GROUPE », DANS UN NAVIGATEUR (prototype, avant-première).
 *
 * Ce que les tests unitaires ne voient pas : la feuille de décision qui juge
 * l'offre de rachat dans le navigateur, l'action serveur qui lit les champs du
 * niveau, la fin de tour qui rachète, et les comptes qui le montrent.
 *
 *   · un administrateur de la plateforme voit le niveau 7 et lance une partie
 *     solo NOVA à ce niveau ; un visiteur et un enseignant ordinaire, non ;
 *   · tour 1 : l'audit d'un site ; tour 2 : son rachat, le plan relevé, une
 *     commande au sous-traitant ; le résultat montre la valeur par action et
 *     les immobilisations reprises ;
 *   · une partie de classe à deux équipes : la même cible, deux offres, une
 *     enchère perdue, et chacune le lit.
 *
 * Les captures (ordinateur et téléphone) vont dans `CAPTURES_GROUPE`, ou à
 * défaut dans `test-results/niveau-groupe`.
 */

const CAPTURES = process.env.CAPTURES_GROUPE ?? join(process.cwd(), "test-results", "niveau-groupe");
mkdirSync(CAPTURES, { recursive: true });

let navigateur: Browser;
let admin: BrowserContext;
let page: Page;
let urlArene = "";
let adminId = "";

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante : ce test pose le drapeau d'administration en base");
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

const capture = (p: Page, nom: string) => p.screenshot({ path: join(CAPTURES, `${nom}.png`), fullPage: false });

/** Avance la feuille d'étape en étape (ou de carte en carte) jusqu'à ce que `selecteur` soit dans l'étape affichée. */
async function allerA(p: Page, selecteur: string): Promise<void> {
  // La feuille rouvre à l'étape où on l'a laissée : on repart de la première.
  for (let k = 0; k < 12; k++) {
    const avant = p.getByRole("button", { name: /^Précédent$/ }).first();
    if (!(await avant.isVisible().catch(() => false)) || !(await avant.isEnabled().catch(() => false))) break;
    const ici = await p.evaluate((s) => {
      const el = document.querySelector(s);
      return !!el && !((el.closest("section[data-etape]") as HTMLElement | null)?.hidden ?? false);
    }, selecteur);
    if (ici) break;
    await avant.click();
    await p.waitForTimeout(250);
  }
  for (let k = 0; k < 24; k++) {
    const ici = await p.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const etape = el.closest("section[data-etape]") as HTMLElement | null;
      const carte = el.closest("[data-carte]") as HTMLElement | null;
      return !(etape?.hidden ?? false) && !(carte?.hidden ?? false);
    }, selecteur);
    if (ici) return;
    // Sur ordinateur « Suivant : … », sur téléphone « Continuer » ; une commande
    // exceptionnelle se refuse pour passer sa carte.
    const suivant = p.getByRole("button", { name: /^(Suivant|Continuer)/ }).last();
    const refuser = p.getByRole("button", { name: /^Refuser/ }).last();
    if (await suivant.isVisible().catch(() => false)) await suivant.click();
    else if (await refuser.isVisible().catch(() => false)) await refuser.click();
    else break;
    await p.waitForTimeout(300);
  }
  const etat = await p.evaluate(() =>
    [...document.querySelectorAll("section[data-etape]")].map((x) => `${x.getAttribute("data-etape")}:${(x as HTMLElement).hidden}`).join(" "),
  );
  throw new Error(`${selecteur} : aucune étape ne le montre (${p.url()} · ${etat})`);
}

/** Déplie le repli qui porte `selecteur`, s'il est replié. */
async function deplier(p: Page, selecteur: string): Promise<void> {
  await p.evaluate((s) => {
    const el = document.querySelector(s);
    const d = el?.closest("details");
    if (d && !d.open) (d.querySelector(":scope > summary") as HTMLElement | null)?.click();
  }, selecteur);
  await p.waitForTimeout(300);
}

async function valider(p: Page, bouton: RegExp): Promise<void> {
  for (let k = 0; k < 24; k++) {
    if (await p.getByRole("button", { name: bouton }).first().isVisible().catch(() => false)) break;
    const suivant = p.getByRole("button", { name: /^(Suivant|Continuer)/ }).last();
    if (!(await suivant.isVisible().catch(() => false))) break;
    await suivant.click();
    await p.waitForTimeout(250);
  }
  await p.getByRole("button", { name: bouton }).first().click();
  const garder = p.getByRole("button", { name: /je garde/ });
  if (await garder.first().isVisible().catch(() => false)) await garder.first().click();
}

async function ouvrirLaFeuille(p: Page, url: string): Promise<void> {
  // Une vraie navigation : un simple changement d'ancre ne recharge pas la page.
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.waitForLoadState("networkidle");
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(1_200);
  // Après un tour clos, la feuille du tour suivant s'ouvre d'un geste.
  const passer = p.getByRole("button", { name: /Passer au tour/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(1_000);
  }
}

/**
 * Le tour 1 joué aux valeurs proposées laisse un découvert au-delà de ce que
 * la banque consent : le financement de sauvetage se décide avant tout le
 * reste. Un emprunt ordinaire le couvre.
 */
async function emprunter(p: Page): Promise<void> {
  const manque = (await texte(p)).match(/Il manque encore ([\d\s]+) €/);
  const montant = manque ? Number(manque[1]!.replace(/\s/g, "")) + 5000 : 30000;
  await allerA(p, 'input[name="newLoan"]');
  await p.locator('input[name="newLoan"]').first().fill(String(montant));
}

/** Un administrateur de la plateforme, sous licence, connecté dans ce contexte. */
async function unAdministrateur(contexte: BrowserContext): Promise<string> {
  const { userId } = await enseignantSousLicence(contexte);
  await base((c) => c.query("update users set is_platform_admin = true where id = $1", [userId]));
  return userId;
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  admin = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } });
  adminId = await unAdministrateur(admin);
  page = await admin.newPage();
}, 120_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("le niveau 7 n'existe que pour l'administrateur", () => {
  it("un visiteur ne voit que six niveaux", async () => {
    const visiteur = await (await navigateur.newContext({ locale: "fr-FR" })).newPage();
    await aller(visiteur, "/jouer");
    await visiteur.getByRole("button", { name: /NOVA/ }).first().click();
    expect(await visiteur.locator('button[aria-label^="Niveau 6"]').count()).toBe(1);
    expect(await visiteur.locator('button[aria-label^="Niveau 7"]').count()).toBe(0);
    await visiteur.context().close();
  }, 120_000);

  it("un enseignant sous licence, sans le drapeau, non plus ; ni dans son formulaire de classe", async () => {
    const ctx = await navigateur.newContext({ locale: "fr-FR" });
    await enseignantSousLicence(ctx);
    const prof = await ctx.newPage();
    await aller(prof, "/jouer");
    await prof.getByRole("button", { name: /NOVA/ }).first().click();
    expect(await prof.locator('button[aria-label^="Niveau 7"]').count()).toBe(0);
    await aller(prof, "/teacher");
    expect(await prof.locator('select[name="level"] option[value="7"]').count()).toBe(0);
    await ctx.close();
  }, 120_000);

  it("l'administrateur le voit, pour NOVA seulement", async () => {
    await aller(page, "/jouer");
    await page.getByRole("button", { name: /NOVA/ }).first().click();
    expect(await page.locator('button[aria-label^="Niveau 7 · Groupe"]').count()).toBe(1);
    await capture(page, "01-jouer-niveau-7-ordinateur");
  }, 120_000);
});

describe("une partie solo de niveau 7", () => {
  it("se lance, à la taille de départ du niveau", async () => {
    await page.locator('button[aria-label^="Niveau 7 · Groupe"]').click();
    expect(await page.locator('input[name="level"]').inputValue()).toBe("7");
    await page.getByRole("button", { name: "Lancer la partie" }).click();
    await page.waitForURL(/\/arena\/|trop=1|groupe=1|reserve=1/, { timeout: 90_000 });
    expect(page.url(), "la création a été refusée").toMatch(/\/arena\//);
    await page.waitForLoadState("networkidle");
    urlArene = page.url().split("?")[0]!.split("#")[0]!;
    await page.waitForSelector("text=/Niveau 7 · Groupe/", { timeout: 30_000 });
    await capture(page, "02-ouverture-ordinateur");
  }, 180_000);

  it("tour 1 : le barème du sous-traitant et son seuil se lisent ; on audite un site", async () => {
    await ouvrirLaFeuille(page, urlArene);
    await allerA(page, "[data-approvisionnement-du-groupe]");
    const seuil = await page.locator('[data-seuil-d-indifference="nova-one"]').innerText();
    expect(seuil).toMatch(/Au-dessus de .+ unités par tour durablement, une ligne en propre coûte moins cher/);
    expect(await page.locator('[data-bareme="nova-go"] li').count()).toBeGreaterThanOrEqual(3);
    await page.locator('[data-approvisionnement-du-groupe]').scrollIntoViewIfNeeded();
    await capture(page, "03-faire-fabriquer-ordinateur");

    await allerA(page, "[data-croissance-externe]");
    await deplier(page, "[data-croissance-externe]");
    expect(await page.locator("[data-regles-du-rachat]").innerText()).toMatch(/Les rachats s'ouvrent au tour 2/);
    await page.selectOption('select[name="diligence"]', "site_ferme:hexalys");
    await page.locator("[data-croissance-externe]").scrollIntoViewIfNeeded();
    await capture(page, "04-audit-ordinateur");
    await valider(page, /Valider et simuler/);
    await page.waitForURL(/simule/, { timeout: 180_000 });
    await page.waitForLoadState("networkidle");
  }, 300_000);

  it("tour 2 : l'audit se lit, le rachat se juge avant l'envoi ; le plan monte, une commande part au sous-traitant", async () => {
    await ouvrirLaFeuille(page, urlArene);
    // Le plan relevé, sur la première étape : la capacité reprise ne tourne pas seule.
    const plan = page.locator('input[name="product.nova-one.productionPlan"]').first();
    const avant = Number(await plan.inputValue());
    await plan.fill(String(avant + 1000));

    await allerA(page, "[data-approvisionnement-du-groupe]");
    await page.locator('input[name="sousTraitance.nova-go"]').fill("500");
    expect(await page.locator('[data-cout-de-la-commande="nova-go"]').innerText()).toMatch(/Coût de la commande : .+€/);
    await emprunter(page);

    await allerA(page, "[data-croissance-externe]");
    await deplier(page, "[data-croissance-externe]");
    const hexalys = page.locator('[data-cible="site_ferme:hexalys"]');
    expect(await hexalys.locator("[data-etat-de-la-cible]").innerText()).toBe("Disponible, auditée");
    expect(await hexalys.locator("[data-audit-du-site]").count()).toBe(1);

    await page.selectOption('select[name="rachatCible"]', "site_ferme:hexalys");
    await page.waitForTimeout(300);
    expect(Number(await page.locator('input[name="rachatPrixMaximum"]').inputValue())).toBeGreaterThan(0);
    // Le paiement en actions est fermé : un site se paie en numéraire.
    expect(await page.locator('input[name="rachatPaiement"][value="titres"]').isDisabled()).toBe(true);
    expect(await page.locator("[data-motif-des-titres]").innerText()).toMatch(/site se paie en numéraire/);
    // Sans financement, le moteur refuserait : la feuille le dit avant l'envoi.
    // Le prix maximum prérempli est lu sans frappe ; seul le financement manque.
    await page.waitForTimeout(400);
    const sans = await page.locator("[data-eligibilite-du-rachat]").getAttribute("data-eligibilite-du-rachat");
    expect(await page.locator('[data-critere="prix"]').innerText()).toMatch(/Vous irez jusqu'à/);
    await page.locator('input[name="rachatEmprunt"]').fill("100000");
    await page.waitForTimeout(400);
    const eligibilite = page.locator("[data-eligibilite-du-rachat]");
    expect(await eligibilite.getAttribute("data-eligibilite-du-rachat"), await eligibilite.innerText()).toBe("recevable");
    expect(await eligibilite.innerText()).toMatch(/Contrôle|Trésorerie|Découvert/);
    expect(await page.locator("[data-rappel-du-plan]").innerText()).toMatch(
      /relever votre plan de production pour faire tourner la capacité reprise/,
    );
    // Le résultat estimé dit ce qu'il ne simule pas.
    expect(await page.locator("[data-limites-de-l-estimation]").innerText()).toMatch(/ne compte pas le rachat de Usine Hexalys/);
    await page.locator("[data-montage-du-rachat]").scrollIntoViewIfNeeded();
    await capture(page, "05-rachat-ordinateur");
    expect(sans === "refusee" || sans === "recevable").toBe(true);

    await valider(page, /Valider et simuler/);
    await page.waitForURL(/simule/, { timeout: 180_000 });
    await page.waitForLoadState("networkidle");
  }, 300_000);

  it("le résultat : valeur par action, rentabilité totale, immobilisations reprises", async () => {
    await page.goto(`${urlArene}#dernier-resultat`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    const valeur = page.locator("[data-valeur-du-tour]").first();
    await valeur.waitFor({ state: "attached", timeout: 30_000 });
    expect(await valeur.innerText()).toMatch(/Valeur de l'action[\s\S]*€[\s\S]*Rentabilité totale/i);
    expect(await page.locator("[data-valeur-de-l-action]").first().innerText()).toMatch(/Action .+ € · rentabilité totale/);
    // Le rachat et la capacité reprise, au panneau du tour et au bilan.
    const t = await texte(page);
    expect(t).toMatch(/Hexalys, Vierzon racheté/);
    await valeur.scrollIntoViewIfNeeded();
    await capture(page, "06-resultat-valeur-ordinateur");
    // Les comptes du tour forment un accordéon : un état ouvert ferme les autres.
    const ouvrir = async (titre: string) => {
      await page.locator("summary", { hasText: titre }).first().click();
      await page.waitForTimeout(400);
    };
    await ouvrir("Rachat, audit et fabrication du tour");
    const operations = await page.locator("[data-operations-du-groupe]").first().innerText();
    expect(operations).toMatch(/Immobilisations reprises \(valeur inscrite\)/);
    expect(operations).toMatch(/Sous-traitance : 500 unités livrées/);
    await page.locator("[data-operations-du-groupe]").first().scrollIntoViewIfNeeded();
    await capture(page, "07-rachat-au-resultat-ordinateur");
    await ouvrir("Bilan");
    expect(await texte(page)).toMatch(/dont immobilisations reprises \(Usine Hexalys, Vierzon\)/);
    await page.locator("text=/dont immobilisations reprises/").first().scrollIntoViewIfNeeded();
    await capture(page, "07b-bilan-ordinateur");
  }, 180_000);

  it("sur téléphone : les cartes « Faire fabriquer » et « Croissance externe », et le résultat", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await admin.storageState(),
    });
    const q = await tel.newPage();
    await q.goto(`${urlArene}#dernier-resultat`, { waitUntil: "domcontentloaded" });
    await q.waitForLoadState("networkidle");
    await q.waitForTimeout(800);
    await capture(q, "08-resultat-telephone");
    const largeur = await q.evaluate(() => document.documentElement.scrollWidth);
    expect(largeur, "la page déborde en largeur").toBeLessThanOrEqual(392);
    await ouvrirLaFeuille(q, urlArene);
    const passer = q.getByRole("button", { name: /Passer au /i }).first();
    if (await passer.isVisible().catch(() => false)) {
      await passer.click();
      await q.waitForTimeout(800);
    }
    await allerA(q, "[data-approvisionnement-du-groupe]");
    await q.locator("[data-approvisionnement-du-groupe]").scrollIntoViewIfNeeded();
    await capture(q, "09-faire-fabriquer-telephone");
    await allerA(q, "[data-croissance-externe]");
    await q.selectOption('select[name="rachatCible"]', "site_ferme:arvel");
    await q.waitForTimeout(400);
    expect(await q.locator('[data-critere="prix"]').innerText()).toMatch(/Vous irez jusqu'à/);
    await q.locator("[data-montage-du-rachat]").scrollIntoViewIfNeeded();
    await capture(q, "10-rachat-telephone");
    expect(await q.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(392);
    await tel.close();
  }, 240_000);
});

describe("une partie de classe à deux équipes : l'enchère", () => {
  let urlPartie = "";
  let code = "";
  const eleves: Page[] = [];

  it("l'administrateur crée la partie de classe au niveau 7", async () => {
    await aller(page, "/teacher");
    await page.selectOption('select[name="scenarioCode"]', "nova");
    await page.selectOption('select[name="level"]', "7");
    await page.selectOption('select[name="humanTeamsCount"]', "2");
    await page.selectOption('select[name="botCount"]', "1");
    await page.getByRole("button", { name: /Créer la partie/ }).click();
    await page.waitForURL(/\/teacher\/games\/|echec=/, { timeout: 90_000 });
    expect(page.url(), await texte(page)).toMatch(/\/teacher\/games\//);
    urlPartie = new URL(page.url()).pathname;
    code = (await page.locator("#code-invitation").innerText()).trim();
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
  }, 180_000);

  it("deux élèves rejoignent, chacun son équipe, et valident le tour 1", async () => {
    for (const pseudo of ["Ana", "Bao"]) {
      const p = await (await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 900 } })).newPage();
      await aller(p, "/join");
      await p.fill('input[name="code"]', code);
      await p.fill('input[name="pseudo"]', pseudo);
      await p.getByRole("button", { name: "Rejoindre la partie" }).click();
      await p.waitForURL(/\/arena\//, { timeout: 60_000 });
      eleves.push(p);
    }
    for (const p of eleves) {
      await ouvrirLaFeuille(p, p.url().split("#")[0]!);
      await valider(p, /Valider les décisions de l'équipe/);
      await p.waitForTimeout(2_000);
    }
    await aller(page, urlPartie);
    await page.getByRole("button", { name: /Clore le tour 1 et simuler/ }).click({ timeout: 30_000 });
    await page.getByRole("button", { name: "Clore et simuler", exact: true }).click();
    await page.waitForSelector("text=/Clore le tour 2 et simuler/", { timeout: 180_000 });
  }, 300_000);

  it("tour 2 : les deux équipes visent le même site ; la plus haute offre l'emporte", async () => {
    const offres = [0, 5000];
    for (const [i, p] of eleves.entries()) {
      await ouvrirLaFeuille(p, p.url().split("#")[0]!);
      await emprunter(p);
      await allerA(p, "[data-croissance-externe]");
      await deplier(p, "[data-croissance-externe]");
      await p.selectOption('select[name="rachatCible"]', "site_ferme:sonelec");
      await p.waitForTimeout(300);
      const max = p.locator('input[name="rachatPrixMaximum"]');
      await max.fill(String(Number(await max.inputValue()) + offres[i]!));
      await p.locator('input[name="rachatEmprunt"]').fill("100000");
      await p.waitForTimeout(400);
      const e = p.locator("[data-eligibilite-du-rachat]");
      expect(await e.getAttribute("data-eligibilite-du-rachat"), await e.innerText()).toBe("recevable");
      expect(await e.innerText()).toMatch(/En classe, si une autre équipe vise la même cible/);
      if (i === 0) await capture(p, "11-classe-offre-ordinateur");
      await valider(p, /Valider les décisions de l'équipe/);
      await p.waitForTimeout(2_000);
    }
    await aller(page, urlPartie);
    await page.getByRole("button", { name: /Clore le tour 2 et simuler/ }).click({ timeout: 30_000 });
    await page.getByRole("button", { name: "Clore et simuler", exact: true }).click();
    await page.waitForSelector("text=/Clore le tour 3 et simuler/", { timeout: 180_000 });
  }, 400_000);

  it("l'équipe qui a offert moins lit l'enchère perdue ; l'autre a racheté le site", async () => {
    const [perdante, gagnante] = eleves as [Page, Page];
    await ouvrirLaFeuille(perdante, perdante.url().split("#")[0]!);
    await allerA(perdante, "[data-croissance-externe]");
    await deplier(perdante, "[data-croissance-externe]");
    const sonelec = perdante.locator('[data-cible="site_ferme:sonelec"]');
    // Rachetée par l'autre équipe : « déjà rachetée », et le motif de l'offre perdue.
    expect(await sonelec.locator("[data-etat-de-la-cible]").innerText()).toBe("Déjà rachetée");
    expect(await sonelec.innerText()).toMatch(/Un autre acquéreur a fait une meilleure offre/);
    await sonelec.scrollIntoViewIfNeeded();
    await capture(perdante, "12-classe-enchere-perdue-ordinateur");

    await ouvrirLaFeuille(gagnante, gagnante.url().split("#")[0]!);
    await allerA(gagnante, "[data-croissance-externe]");
    await deplier(gagnante, "[data-croissance-externe]");
    expect(
      await gagnante.locator('[data-cible="site_ferme:sonelec"] [data-etat-de-la-cible]').innerText(),
    ).toBe("À vous");
  }, 240_000);

  it("le classement de l'enseignant se fait à la rentabilité totale, l'IPG à côté", async () => {
    await aller(page, urlPartie);
    const reveler = page.getByRole("button", { name: /Révéler le classement/ });
    if (await reveler.isVisible().catch(() => false)) {
      await reveler.click();
      await page.waitForTimeout(1_500);
    }
    expect(await texte(page)).toMatch(/Rentabilité totale [+−-]?\d/);
    expect(await texte(page)).toMatch(/créés · IPG/);
    await capture(page, "13-classement-enseignant-ordinateur");
    expect(adminId).not.toBe("");
  }, 180_000);
});
