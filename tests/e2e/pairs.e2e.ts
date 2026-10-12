import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur, texte } from "./helpers/browser";
import { enseignantSousLicence } from "./helpers/licence";
import { mesurerContraste } from "./helpers/contraste";

/**
 * L'ÉVALUATION ENTRE COÉQUIPIERS, DANS UN VRAI NAVIGATEUR, SUR LE BUILD DE PRODUCTION.
 *
 * L'enseignant crée une partie de classe en cochant l'évaluation, la règle (auto-évaluation)
 * depuis la page de la partie ; trois élèves rejoignent la même équipe, deux à 1280 px, une
 * à 390 px. Pendant la partie, aucune carte. À la fin, chacun voit « Évaluez vos
 * coéquipiers » et remplit le formulaire. L'enseignant voit le taux de réponse, les
 * facteurs (le cas d'école : 1,17, 1,13, 0,8), les signaux et le commentaire avec son
 * auteur ; il saisit la note d'équipe, exporte, publie. L'étudiante voit alors sa moyenne,
 * sans aucun nom ni commentaire. Un seul bouton plein par écran, aucun texte sous le
 * seuil de contraste, aucun défilement de côté à 390.
 *
 * Captures : `CAPTURES=<dossier>`.
 */

const CAPTURES = process.env.CAPTURES;
let navigateur: Browser;
let prof: Page;
let urlPartie = "";
let code = "";
const eleves: Record<string, Page> = {};

/** Qui donne quoi : le cas d'école de l'unitaire (tests/unit/pairs.test.ts). */
const PLAN: Record<string, Record<string, number>> = {
  Alice: { Bruno: 5, Chloé: 3, moi: 4 },
  Bruno: { Alice: 4, Chloé: 2, moi: 4 },
  Chloé: { Alice: 4, Bruno: 4, moi: 5 },
};

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
  for (const theme of ["clair", "sombre"]) {
    const fautes = (await mesurerContraste(p, theme)).filter((m) => m.ratio < m.seuil);
    expect(fautes, `${theme} : ${JSON.stringify(fautes.slice(0, 5))}`).toEqual([]);
  }
  await p.evaluate(() => {
    delete document.documentElement.dataset.theme;
  });
}

describe("l'évaluation entre coéquipiers", () => {
  it("l'enseignant crée une partie de classe en cochant l'évaluation, puis la règle", async () => {
    const ctx = await contexte();
    await enseignantSousLicence(ctx);
    prof = await ctx.newPage();
    await aller(prof, "/teacher");
    if ((await prof.locator("#nouvelle-partie[open]").count()) === 0) {
      await prof.locator("#nouvelle-partie > summary").click();
    }
    await prof.selectOption('select[name="humanTeamsCount"]', "1");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.selectOption('select[name="roundsCount"]', "3");
    await prof.locator('input[name="evaluationDesPairs"]').check();
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    urlPartie = new URL(prof.url()).pathname;
    code = (await prof.locator("#code-invitation").innerText()).trim();
    const lien = prof.locator("[data-lien-coequipiers]");
    expect(await lien.innerText()).toContain("activée");
    await lien.click();
    await prof.waitForURL(/\/coequipiers$/);
    // Une navigation côté client : l'adresse change avant que la page n'arrive.
    await prof.locator('[data-moment="fin"]').waitFor({ timeout: 30_000 });
    const vu = await texte(prof);
    expect(vu).toContain("Évaluation entre coéquipiers");
    expect(vu).toContain("S'ouvrira à la fin de la partie");
    // Pas encore de réponse : la case de l'auto-évaluation se règle.
    expect(await pleinsVisibles(prof)).toEqual([]);
    await prof.locator('input[name="autoEvaluation"]').check();
    await prof.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await prof.waitForURL(/fait=regle/);
    expect(await prof.locator('input[name="autoEvaluation"]').isChecked()).toBe(true);
    expect(await debordement(prof)).toBeLessThanOrEqual(0);
    await sansTexteIllisible(prof);
    await capture(prof, "pairs-enseignant-reglages-1280");
  });

  it("trois élèves rejoignent la même équipe ; pendant la partie, aucune carte", async () => {
    for (const [nom, mobile] of [
      ["Alice", false],
      ["Bruno", false],
      ["Chloé", true],
    ] as const) {
      const p = await (await contexte(mobile)).newPage();
      await aller(p, "/join");
      await p.fill('input[name="code"]', code);
      await p.fill('input[name="pseudo"]', nom);
      await p.getByRole("button", { name: "Rejoindre la partie" }).click();
      await p.waitForURL(/\/arena\/[0-9a-f-]{36}/, { timeout: 60_000 });
      await p.waitForLoadState("networkidle");
      expect(await p.locator("[data-carte-coequipiers]").count()).toBe(0);
      eleves[nom] = p;
    }
  });

  it("l'enseignant clôt les trois tours : la partie se termine", async () => {
    await aller(prof, urlPartie);
    for (let tour = 1; tour <= 3; tour++) {
      await prof.getByRole("button", { name: new RegExp(`Clore le tour ${tour} et simuler`) }).click();
      await prof.getByRole("button", { name: "Clore et simuler", exact: true }).click();
      await prof.waitForSelector(tour < 3 ? `text=/Clore le tour ${tour + 1} et simuler/` : "text=Fin de partie", {
        timeout: 120_000,
      });
    }
  }, 400_000);

  for (const nom of ["Alice", "Bruno", "Chloé"]) {
    it(`${nom} évalue ses coéquipiers depuis la carte du bilan`, async () => {
      const p = eleves[nom]!;
      const mobile = nom === "Chloé";
      await p.reload({ waitUntil: "networkidle" });
      const carte = p.locator('[data-carte-coequipiers="a-faire"]');
      await carte.waitFor({ timeout: 30_000 });
      expect(await carte.innerText()).toContain("Évaluez vos coéquipiers");
      // Le bilan garde son geste principal : la carte ne pose qu'un filet.
      expect((await pleinsVisibles(p)).length).toBeLessThanOrEqual(1);
      await capture(p, `pairs-carte-arene-${mobile ? 390 : 1280}`, false);
      await carte.locator("[data-lien-coequipiers]").click();
      await p.waitForURL(/\/coequipiers\?moment=fin/);
      await p.locator("[data-coequipier]").first().waitFor({ timeout: 30_000 });
      expect(await p.locator("[data-resultats-publies]").count()).toBe(0);
      expect(await pleinsVisibles(p)).toEqual(["Envoyer mon évaluation"]);
      expect(await debordement(p)).toBeLessThanOrEqual(0);
      if (nom !== "Bruno") await sansTexteIllisible(p);
      // Un bloc par coéquipier, et « Et vous ? » pour l'auto-évaluation.
      const blocs = p.locator("[data-coequipier]");
      expect(await blocs.count()).toBe(3);
      for (const [cible, note] of Object.entries(PLAN[nom]!)) {
        const bloc = p.locator(`[data-coequipier="${cible === "moi" ? "Et vous ?" : cible}"]`);
        const criteres = bloc.locator("fieldset[data-critere]");
        for (let i = 0; i < (await criteres.count()); i++) {
          await criteres.nth(i).locator(`input[type="radio"][value="${note}"]`).check();
        }
      }
      if (nom === "Alice") {
        await p.locator('[data-coequipier="Chloé"] textarea').fill("Peu présente en séance.");
      }
      if (nom === "Alice" || nom === "Chloé") await capture(p, `pairs-formulaire-${mobile ? 390 : 1280}`);
      await p.getByRole("button", { name: "Envoyer mon évaluation" }).click();
      await p.waitForURL(/fait=envoyee/, { timeout: 30_000 });
      expect(await texte(p)).toContain("Votre évaluation est enregistrée");
      expect(await p.getByRole("button", { name: "Mettre à jour mon évaluation" }).count()).toBe(1);
    }, 120_000);
  }

  it("l'enseignant voit les réponses, les facteurs, les signaux et le commentaire avec son auteur", async () => {
    await aller(prof, `${urlPartie}/coequipiers`);
    const vu = await texte(prof);
    expect(vu).toContain("3 sur 3 ont répondu");
    const facteur = async (nom: string) =>
      prof.locator(`[data-moment="fin"] tr[data-etudiant="${nom}"]`).getAttribute("data-facteur");
    expect(await facteur("Alice")).toBe("1.17");
    expect(await facteur("Bruno")).toBe("1.13");
    expect(await facteur("Chloé")).toBe("0.8");
    expect(vu).toContain("Facteur ramené dans les bornes");
    expect(vu).toMatch(/Se note 2,5 points au-dessus de ce que disent ses pairs/);
    expect(vu).toContain("Alice sur Chloé");
    expect(vu).toContain("« Peu présente en séance. »");
    expect(await pleinsVisibles(prof)).toEqual(["Publier"]);
    // La note d'équipe, d'où la note individuelle.
    await prof.locator('[data-moment="fin"] input[name^="note:"]').fill("14");
    await prof.getByRole("button", { name: "Enregistrer les notes d'équipe" }).click();
    await prof.waitForURL(/fait=notes/);
    const alice = await prof.locator('[data-moment="fin"] tr[data-etudiant="Alice"]').innerText();
    expect(alice).toContain("16,4");
    // L'export : point-virgule, BOM, daté, la note individuelle, ni adresse ni commentaire.
    // Lu par le navigateur de l'enseignant, avec sa session.
    const r = await prof.evaluate(async (u) => {
      const rep = await fetch(u);
      const octets = new Uint8Array(await rep.arrayBuffer());
      return {
        statut: rep.status,
        disposition: rep.headers.get("content-disposition") ?? "",
        bom: [...octets.slice(0, 3)],
        texte: new TextDecoder().decode(octets),
      };
    }, `${urlPartie}/coequipiers/export`);
    expect(r.statut).toBe(200);
    expect(r.disposition).toMatch(/coequipiers-.+-\d{4}-\d{2}-\d{2}\.csv/);
    expect(r.bom).toEqual([0xef, 0xbb, 0xbf]);
    const csv = r.texte;
    expect(csv).toContain(";1,17;");
    expect(csv).toContain(";16,4;");
    expect(csv).not.toMatch(/@|Peu présente/);
    expect(await debordement(prof)).toBeLessThanOrEqual(0);
    await sansTexteIllisible(prof);
    await capture(prof, "pairs-enseignant-facteurs-1280");
    const etroit = await (await contexte(true)).newPage();
    // Le même écran à 390 px, sous la même session (cookie recopié).
    await etroit.context().addCookies(await prof.context().cookies());
    await aller(etroit, `${urlPartie}/coequipiers`);
    expect(await debordement(etroit)).toBeLessThanOrEqual(0);
    await capture(etroit, "pairs-enseignant-facteurs-390");
    await etroit.close();
  }, 120_000);

  it("un élève ne lit pas la page de l'enseignant ni l'export", async () => {
    const p = eleves.Bruno!;
    const page = await p.goto(`${BASE}${urlPartie}/coequipiers`);
    expect(new URL(p.url()).pathname === "/teacher/login" || (page?.status() ?? 0) >= 400).toBe(true);
    const statut = await p.evaluate(async (u) => (await fetch(u)).status, `${urlPartie}/coequipiers/export`);
    expect(statut).toBe(401);
  });

  it("l'enseignant publie ; l'élève voit sa moyenne, sans aucun auteur", async () => {
    await prof.getByRole("button", { name: "Publier" }).click();
    await prof.waitForURL(/fait=publie/);
    expect(await texte(prof)).toContain("C'est publié");
    const p = eleves["Chloé"]!;
    await aller(p, new URL(p.url()).pathname.replace(/\/coequipiers$/, ""));
    const carte = p.locator('[data-carte-coequipiers="publiee"]');
    await carte.waitFor({ timeout: 30_000 });
    await carte.locator("[data-lien-coequipiers]").click();
    await p.waitForURL(/\/coequipiers\?moment=fin/);
    const resultats = p.locator("[data-resultats-publies]");
    await resultats.waitFor({ timeout: 30_000 });
    expect(await resultats.innerText()).toContain("En moyenne, 2,5 sur 5");
    const vu = await texte(p);
    for (const interdit of ["Alice", "Bruno", "Peu présente", "Facteur"]) expect(vu).not.toContain(interdit);
    // Son auto-évaluation, montrée à part.
    expect(vu).toContain("Votre propre note : 5");
    expect(await p.locator('input[type="radio"]').count()).toBe(0);
    expect(await debordement(p)).toBeLessThanOrEqual(0);
    await sansTexteIllisible(p);
    await capture(p, "pairs-resultats-390");
    const large = eleves.Alice!;
    await aller(large, new URL(large.url()).pathname + "?moment=fin");
    expect(await large.locator("[data-resultats-publies]").innerText()).toContain("En moyenne, 4,0 sur 5");
    expect(await texte(large)).not.toMatch(/Bruno|Chloé/);
    await capture(large, "pairs-resultats-1280");
  }, 120_000);
});
