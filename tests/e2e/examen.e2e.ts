import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { mesurerContraste } from "./helpers/contraste";
import { GRILLE_BUSINESS_ARENA_2026 } from "@/config/examen/grille";
import { niveauxDits, niveauxRelatifsDits, pourcentDuSeuil, seuilDAtteinteDit, seuilDAtteinteRelatifDit } from "@/config/examen/competences";

/** Les espaces insécables comme `texte` les rend : des espaces simples. */
const espaces = (s: string) => s.replace(/[  ]/g, " ");

/**
 * L'EXAMEN INDIVIDUEL, DANS UN VRAI NAVIGATEUR, SUR LE BUILD DE PRODUCTION ET SA BASE.
 *
 * Un enseignant SANS le module voit l'écran, le message et « Voir les offres », et la
 * création est refusée. Un enseignant sous licence Campus (l'examen inclus) crée
 * l'examen ; deux candidats le passent, l'un à 1280 px, l'autre à 390 px, sans compte,
 * avec leur nom et leur numéro d'étudiant ; pendant la partie, ni classement ni « Résultat
 * estimé » (éteint par l'enseignant) ; à la fin, un reçu, pas de note. L'enseignant suit
 * en direct, voit les résultats (notes, distribution, compétences), exporte, publie ; chaque
 * candidat voit alors sa note et son relevé ; une seconde tentative est refusée. Le rapport
 * d'accréditation s'imprime sur une page. Un seul bouton plein par écran, aucun texte sous
 * le seuil de contraste, aucun défilement de côté à 390.
 *
 * Captures : `CAPTURES=<dossier>`.
 */

const CAPTURES = process.env.CAPTURES;
let navigateur: Browser;
let prof: Page;
let ctxProf: BrowserContext;
let examenId = "";
let code = "";

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

async function contexte(mobile = false): Promise<BrowserContext> {
  const c = await navigateur.newContext(
    mobile
      ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" }
      : { viewport: { width: 1280, height: 900 }, locale: "fr-FR" },
  );
  await c.addInitScript(() => localStorage.setItem("install-prompt-ferme-le", String(Date.now())));
  return c;
}

async function capture(p: Page, nom: string, pleinePage = true): Promise<void> {
  if (!CAPTURES) return;
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${CAPTURES}/${nom}.png`, fullPage: pleinePage });
}

const debordement = (p: Page) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Les aplats orange visibles : un seul bouton plein par écran, au plus. */
const pleinsVisibles = (p: Page) =>
  p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("main .bouton-plein")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && e.checkVisibility({ visibilityProperty: true });
      })
      .map((e) => e.textContent?.trim() ?? ""),
  );

async function sansTexteIllisible(p: Page): Promise<void> {
  const fautes = (await mesurerContraste(p, "clair")).filter((m) => m.ratio < m.seuil);
  expect(fautes, JSON.stringify(fautes.slice(0, 5))).toEqual([]);
}

/** Un tour de l'arène, comme le joueur : la feuille, carte après carte, puis « Valider et simuler ». */
async function jouerUnTour(p: Page, urlArene: string): Promise<void> {
  await p.goto(urlArene, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  const passer = p.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click();
    await p.waitForTimeout(400);
  }
  await p.evaluate(() => {
    location.hash = "decisions";
  });
  await p.waitForTimeout(800);
  const ouvrir = p.getByRole("button", { name: /Ouvrir le courrier/ }).first();
  if (await ouvrir.isVisible().catch(() => false)) {
    await ouvrir.click();
    await p.waitForTimeout(1_000);
    const note = p.getByRole("button", { name: /pris note/ }).first();
    if (await note.isVisible().catch(() => false)) await note.click();
  }
  // Sur ordinateur, « Suivant » ; sur téléphone, le parcours en cartes (« Continuer »,
  // « Analyser », « Décider », puis « Accepter » la proposition du tour).
  const avancer = p.getByRole("button", { name: /^(Suivant|Continuer|Analyser|Décider|Accepter$)/ });
  for (let k = 0; k < 40; k++) {
    if (await p.getByRole("button", { name: /Valider et simuler/ }).count()) break;
    const visibles = [];
    for (const b of await avancer.all()) if (await b.isVisible().catch(() => false)) visibles.push(b);
    if (visibles.length === 0) throw new Error("aucun bouton pour avancer dans le tour");
    await visibles[visibles.length - 1]!.click();
    await p.waitForTimeout(300);
  }
  await p.getByRole("button", { name: /Valider et simuler/ }).first().click();
  const garder = p.getByRole("button", { name: /Oui, je garde/ });
  if (await garder.count()) await garder.first().click();
  await p.waitForURL(/simule/, { timeout: 180_000 });
}

/** Un candidat passe l'examen jusqu'au reçu ; rend l'adresse de son arène. */
async function passerLExamen(
  p: Page,
  nom: string,
  numero: string,
  suffixe: string,
  tours: number,
  pendant?: () => Promise<void>,
): Promise<string> {
  await aller(p, "/examen");
  await p.getByLabel("Code de l'examen").fill(code.toLowerCase());
  await p.getByRole("button", { name: "Continuer" }).click();
  await p.waitForURL(new RegExp(`/examen/${code}$`));
  expect(await p.locator("[data-identification]").getAttribute("data-identification")).toBe("saisie");
  expect(await pleinsVisibles(p)).toEqual(["Commencer l'examen"]);
  expect(await debordement(p)).toBeLessThanOrEqual(0);
  await capture(p, `examen-candidat-debut-${suffixe}`);
  await p.getByLabel("Nom et prénom").fill(nom);
  await p.getByLabel(/Numéro d'étudiant/).fill(numero);
  await p.getByRole("button", { name: "Commencer l'examen" }).click();
  await p.waitForURL(/\/arena\/[0-9a-f-]{36}/, { timeout: 120_000 });
  const urlArene = p.url().split("?")[0]!.split("#")[0]!;
  await p.waitForLoadState("networkidle");
  // Pendant la partie : ni classement, ni « Résultat estimé » (éteint), ni mérite.
  expect(await p.locator("[data-resultat-estime]").count()).toBe(0);
  expect(await texte(p)).not.toMatch(/Classement · Indice|marchés possibles/);
  await capture(p, `examen-candidat-en-cours-${suffixe}`, false);
  for (let t = 1; t <= tours; t += 1) {
    await jouerUnTour(p, urlArene);
    if (t === 1 && pendant) await pendant();
  }
  await p.goto(urlArene, { waitUntil: "networkidle" });
  await p.locator("[data-recu-d-examen]").waitFor({ timeout: 60_000 });
  expect(await p.getByRole("heading", { level: 1 }).textContent()).toMatch(/^Examen remis le \d+ \w+ \d{4} à \d{2} h \d{2}$/);
  expect(await texte(p)).not.toMatch(/sur 100|Mérité|Malchance|Leçon|Chance\./);
  expect(await debordement(p)).toBeLessThanOrEqual(0);
  await capture(p, `examen-candidat-recu-${suffixe}`);
  return urlArene;
}

describe("sans le module de l'examen", () => {
  it("l'écran se montre, avec le message et « Voir les offres » ; la création est refusée", async () => {
    const ctx = await contexte();
    await enseignantSousLicence(ctx, { arene: "classe", entreprises: ["nova"], niveaux: [1] });
    const p = await ctx.newPage();
    await aller(p, "/teacher/examens");
    const message = p.locator("[data-examens-sans-module]");
    expect(await message.textContent()).toMatch(/L'examen individuel est inclus dans les offres Programme et Campus/);
    expect(await message.getByRole("link", { name: "Voir les offres" }).getAttribute("href")).toBe("/tarifs");
    await p.getByLabel("Nom de l'examen").fill("Sans module");
    await p.getByRole("button", { name: "Créer l'examen" }).click();
    await p.waitForURL(/refus=licence/);
    expect(await p.locator('[data-refus-d-examen="licence"]').count()).toBe(1);
    await ctx.close();
  }, 120_000);
});

describe("un examen, de la création à la publication", () => {
  it("l'enseignant crée l'examen : un code, un lien, la grille figée", async () => {
    ctxProf = await contexte();
    await enseignantSousLicence(ctxProf);
    prof = await ctxProf.newPage();
    await aller(prof, "/teacher/examens");
    expect(await prof.getByRole("link", { name: "Mes examens" }).first().getAttribute("aria-current")).toBe("page");
    expect(await prof.locator("[data-examens-sans-module]").count()).toBe(0);
    expect(await pleinsVisibles(prof)).toEqual(["Créer l'examen"]);
    await prof.getByLabel("Nom de l'examen").fill("Gestion L2 · examen de fin de semestre");
    await prof.getByLabel("Niveau").selectOption("1");
    await prof.getByLabel("Nombre de tours").fill("2");
    await prof.getByLabel("Durée maximale d'un tour (minutes)").fill("30");
    await prof.getByLabel(/Montrer le « Résultat estimé »/).uncheck();
    await prof.getByLabel(/Un lot de \d+ marchés d'égale difficulté/).check();
    await capture(prof, "examen-creation-1280");
    await prof.getByRole("button", { name: "Créer l'examen" }).click();
    await prof.waitForURL(/\/teacher\/examens\/[0-9a-f-]{36}\?cree=1$/, { timeout: 120_000 });
    examenId = prof.url().match(/examens\/([0-9a-f-]{36})/)![1]!;
    code = (await prof.locator("#code-de-l-examen").textContent())!.trim();
    expect(code).toMatch(/^EX-[A-Z2-9]{6}$/);
    expect((await prof.locator("[data-lien-de-l-examen]").textContent())!.trim()).toBe(`${BASE}/examen/${code}`);
    // La version se lit de la grille : écrite à la main, elle était restée à 1
    // quand la grille est passée en version 2 (étalon gelé).
    expect(await texte(prof)).toContain(
      `${GRILLE_BUSINESS_ARENA_2026.nom}, version ${GRILLE_BUSINESS_ARENA_2026.version}`,
    );
    expect((await pleinsVisibles(prof)).length).toBeLessThanOrEqual(1);
    await sansTexteIllisible(prof);
    // À 390 : la même page, sans défilement de côté.
    const mobile = await contexte(true);
    await mobile.addCookies(await ctxProf.cookies());
    const m = await mobile.newPage();
    await aller(m, "/teacher/examens");
    expect(await debordement(m)).toBeLessThanOrEqual(0);
    await capture(m, "examen-creation-390");
    await mobile.close();
  }, 180_000);

  let arenaA = "";
  let ctxA: BrowserContext;
  let ctxB: BrowserContext;

  it("un premier candidat (1280) le passe ; l'enseignant le suit en direct", async () => {
    ctxA = await contexte();
    const a = await ctxA.newPage();
    // Le suivi en direct, au milieu de la copie : le tour en cours se lit.
    arenaA = await passerLExamen(a, "Alice Martin", "21 0001", "1280", 2, async () => {
      await aller(prof, `/teacher/examens/${examenId}`);
      const ligne = prof.locator('[data-candidat="210001"]');
      expect(await ligne.getAttribute("data-etat")).toBe("en-cours");
      expect(await ligne.textContent()).toMatch(/Tour 2 sur 2/);
      expect(await prof.locator("[data-actualise]").textContent()).toMatch(/relu de lui-même/);
      await capture(prof, "examen-suivi-en-direct-1280");
    });
    await aller(prof, `/teacher/examens/${examenId}`);
    expect(await prof.locator('[data-candidat="210001"]').getAttribute("data-etat")).not.toBe("en-cours");
  }, 600_000);

  it("un second candidat (390) le passe, sans défilement de côté", async () => {
    ctxB = await contexte(true);
    const b = await ctxB.newPage();
    // Pendant ce temps, l'enseignant voit la copie en cours.
    await aller(b, `/examen/${code}`);
    await b.getByLabel("Nom et prénom").fill("Bruno Petit");
    await b.getByLabel(/Numéro d'étudiant/).fill("210002");
    await b.getByRole("button", { name: "Commencer l'examen" }).click();
    await b.waitForURL(/\/arena\//, { timeout: 120_000 });
    await aller(prof, `/teacher/examens/${examenId}`);
    expect(await prof.locator('[data-candidat="210002"]').getAttribute("data-etat")).toBe("en-cours");
    expect(await prof.locator('[data-candidat="210002"]').textContent()).toMatch(/Commencé|Tour 1 sur 2/);
    const mobile = await contexte(true);
    await mobile.addCookies(await ctxProf.cookies());
    const m = await mobile.newPage();
    await aller(m, `/teacher/examens/${examenId}`);
    expect(await debordement(m)).toBeLessThanOrEqual(0);
    await capture(m, "examen-suivi-en-direct-390");
    await mobile.close();
    const urlB = b.url().split("?")[0]!.split("#")[0]!;
    await b.waitForLoadState("networkidle");
    await capture(b, "examen-candidat-en-cours-390", false);
    for (let t = 1; t <= 2; t += 1) await jouerUnTour(b, urlB);
    await b.goto(urlB, { waitUntil: "networkidle" });
    await b.locator("[data-recu-d-examen]").waitFor({ timeout: 60_000 });
    expect(await debordement(b)).toBeLessThanOrEqual(0);
    await capture(b, "examen-candidat-recu-390");
    // L'écran d'entrée à 390, lui aussi : la copie remise y est dite, pas de nouvelle tentative.
    await aller(b, `/examen/${code}`);
    expect(await b.locator("[data-copie-remise]").count()).toBe(1);
    expect(await b.getByRole("button", { name: "Commencer l'examen" }).count()).toBe(0);
    await capture(b, "examen-candidat-debut-390");
  }, 600_000);

  it("l'enseignant voit les résultats, exporte, publie", async () => {
    // La note se calcule à la remise ; la page la complète au besoin.
    for (let i = 0; i < 20; i += 1) {
      await aller(prof, `/teacher/examens/${examenId}`);
      if ((await prof.locator('[data-etat="notee"]').count()) === 2) break;
      await prof.waitForTimeout(1_500);
    }
    expect(await prof.locator('[data-etat="notee"]').count()).toBe(2);
    expect(await prof.locator("[data-histogramme]").count()).toBe(1);
    expect(await prof.locator("[data-competences-de-la-promotion] li").count()).toBe(6);
    expect(await prof.locator("[data-comparaison-nationale]").textContent()).toBe(
      "Comparaison nationale : disponible à partir de 5 établissements.",
    );
    expect(await pleinsVisibles(prof)).toEqual(["Publier les résultats"]);
    await sansTexteIllisible(prof);
    await capture(prof, "examen-resultats-1280");
    const mobile = await contexte(true);
    await mobile.addCookies(await ctxProf.cookies());
    const m = await mobile.newPage();
    await aller(m, `/teacher/examens/${examenId}`);
    expect(await debordement(m)).toBeLessThanOrEqual(0);
    await capture(m, "examen-resultats-390");
    // Les décisions d'un candidat se consultent.
    await aller(m, `/teacher/examens/${examenId}`);
    await m.getByRole("link", { name: "Décisions" }).first().click();
    await m.waitForURL(/candidats\//);
    expect(await m.locator("[data-decisions-du-candidat] tbody tr").count()).toBe(2);
    expect(await debordement(m)).toBeLessThanOrEqual(0);
    await mobile.close();

    // L'export : point-virgule, BOM, daté, les deux candidats.
    // Lu par le navigateur de l'enseignant, avec sa session.
    const r = await prof.evaluate(async (u) => {
      const rep = await fetch(u);
      const octets = new Uint8Array(await rep.clone().arrayBuffer());
      return {
        statut: rep.status,
        type: rep.headers.get("content-type") ?? "",
        disposition: rep.headers.get("content-disposition") ?? "",
        bom: [...octets.slice(0, 3)],
        texte: new TextDecoder().decode(octets),
      };
    }, `/teacher/examens/${examenId}/export`);
    expect(r.statut).toBe(200);
    expect(r.type).toMatch(/text\/csv/);
    expect(r.disposition).toMatch(/filename="examen-gestion-l2-examen-de-fin-de-semestre-ex-[a-z2-9]{6}-\d{4}-\d{2}-\d{2}\.csv"/);
    expect(r.bom).toEqual([0xef, 0xbb, 0xbf]);
    const csv = r.texte;
    expect(csv).toContain("Alice Martin;210001;");
    expect(csv).toContain("Bruno Petit;210002;");

    await prof.getByRole("button", { name: "Publier les résultats" }).click();
    await prof.waitForURL(/fait=publie/);
    expect(await prof.getByRole("button", { name: "Retirer la publication" }).count()).toBe(1);
  }, 300_000);

  it("publiés : chaque candidat voit sa note et son relevé", async () => {
    const a = await ctxA.newPage();
    await aller(a, `/examen/${code}/resultat`);
    expect(await a.getByRole("heading", { level: 1 }).textContent()).toMatch(/^Votre note : [\d,]+ sur 100$/);
    expect(await a.locator("[data-releve-des-competences] li").count()).toBe(6);
    // Une ligne par ligne active de la grille (questions éteintes : sans les diagnostics).
    expect(await a.locator("[data-detail-de-la-note] li").count()).toBe(GRILLE_BUSINESS_ARENA_2026.lignes.filter((x) => !x.siQuestions).length);
    // Noté contre la gestion neutre du secteur, nommée et définie ; plus de « gestion de référence ».
    // Le code de l'étalon se lit de la grille, comme sa version : depuis la version 2, il est gelé.
    const etalon = GRILLE_BUSINESS_ARENA_2026.reference.code;
    expect(await a.locator(`[data-etalon-de-la-note="${etalon}"]`).count()).toBe(1);
    const releve = await texte(a);
    expect(releve).toMatch(/à côté de la gestion neutre du secteur\./);
    // La définition de l'étalon et les seuils se lisent de la grille, comme sa version :
    // écrits à la main, ils deviendraient faux à la version suivante.
    expect(releve).toContain(espaces(GRILLE_BUSINESS_ARENA_2026.reference.definition));
    expect(releve).toContain(
      espaces(`atteint à partir de ${pourcentDuSeuil(GRILLE_BUSINESS_ARENA_2026.seuils.fixes.acquis)} des points rattachés à la compétence.`),
    );
    const relatif = seuilDAtteinteRelatifDit(GRILLE_BUSINESS_ARENA_2026.seuils, GRILLE_BUSINESS_ARENA_2026.reference.nom);
    if (relatif) expect(releve).toContain(espaces(relatif));
    expect(releve).toContain("Décisions qui battent la gestion neutre du secteur");
    expect(releve).not.toMatch(/gestion de référence/);
    await sansTexteIllisible(a);
    await capture(a, "examen-releve-candidat-1280");
    // L'arène dit la publication, et rouvre le bilan.
    await a.goto(arenaA, { waitUntil: "networkidle" });
    expect(await a.getByRole("link", { name: "Voir ma note et mon relevé" }).count()).toBe(1);
    const b = await ctxB.newPage();
    await aller(b, `/examen/${code}/resultat`);
    expect(await b.locator("[data-releve-des-competences] li").count()).toBe(6);
    expect(await debordement(b)).toBeLessThanOrEqual(0);
    await capture(b, "examen-releve-candidat-390");
  }, 120_000);

  it("le rapport d'accréditation s'imprime, sur une page, sans nom d'étudiant", async () => {
    await aller(prof, `/teacher/examens/${examenId}/accreditation`);
    expect(await prof.locator("[data-resultats-par-competence] tbody tr").count()).toBe(6);
    const t = await texte(prof);
    expect(t).toContain("conçu pour nourrir un dossier d'accréditation");
    const etalon = GRILLE_BUSINESS_ARENA_2026.reference;
    expect(t).toContain(espaces(`à côté de ${etalon.nom} : la note juge les décisions, pas le tirage. ${etalon.definition}`));
    // La méthode dit les seuils de la grille de l'examen, lus de la donnée.
    expect(t).toContain(espaces(`rattachés : ${niveauxDits(GRILLE_BUSINESS_ARENA_2026.seuils.fixes)}.`));
    const niveauxRelatifs = niveauxRelatifsDits(GRILLE_BUSINESS_ARENA_2026.seuils, etalon.nom);
    if (niveauxRelatifs) expect(t).toContain(espaces(niveauxRelatifs));
    expect(t).toContain(espaces(`(${seuilDAtteinteDit(GRILLE_BUSINESS_ARENA_2026.seuils)}).`));
    // La grille imprimée est celle de l'examen, ligne par ligne, lignes graduées comprises.
    for (const l of GRILLE_BUSINESS_ARENA_2026.lignes.filter((x) => !x.siQuestions)) expect(t).toContain(espaces(l.libelle));
    expect(t).not.toMatch(/gestion de référence/);
    expect(t).not.toMatch(/Alice|Bruno|210001/);
    expect(t).not.toMatch(/reconnu par l'AACSB|accrédité par/i);
    await prof.emulateMedia({ media: "print" });
    expect(await prof.locator(".no-print").first().isVisible()).toBe(false);
    await capture(prof, "examen-accreditation-impression-1280");
    const pdf = await prof.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    if (CAPTURES) {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(`${CAPTURES}/examen-accreditation.pdf`, pdf);
    }
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pages).toBe(1);
    await prof.emulateMedia({ media: "screen" });
    const mobile = await contexte(true);
    await mobile.addCookies(await ctxProf.cookies());
    const m = await mobile.newPage();
    await aller(m, `/teacher/examens/${examenId}/accreditation`);
    await capture(m, "examen-accreditation-390");
    await mobile.close();
  }, 120_000);

  it("une seule tentative : la copie remise ne se recommence pas", async () => {
    const a = await ctxA.newPage();
    await aller(a, `/examen/${code}`);
    expect(await a.locator("[data-copie-remise]").count()).toBe(1);
    expect(await a.getByRole("button", { name: "Commencer l'examen" }).count()).toBe(0);
  }, 60_000);
});
