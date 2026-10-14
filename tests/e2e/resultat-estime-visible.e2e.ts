import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * LE RÉSULTAT ESTIMÉ SOUS LES YEUX, À CHAQUE ÉTAPE (lot P7).
 *
 * « Je ne vois pas le résultat estimé », ni sur téléphone, ni sur ordinateur.
 * Il était là, dans le DOM : un panneau plat au-dessus des étapes, parti dès
 * qu'on défilait ; sur téléphone, une ligne sur la seule carte des ventes.
 * Être PRÉSENT ne suffit pas : cette garde mesure qu'il se VOIT, dans la
 * fenêtre et non couvert, à chaque étape de la feuille (ordinateur, 1280) et
 * sur chaque carte de décision (téléphone, 390), du tour 1 d'une partie NOVA
 * niveau 3 ; et qu'il BOUGE quand on change le prix. Et le cadran collant ne
 * masque pas le premier champ sur un portable (1366 × 768).
 */

let navigateur: Browser;
let ordi: BrowserContext;
let page: Page;
let urlArene: string;

const etapes = (p: Page) => p.locator('[aria-label="Étapes de décision"] li button');

/** Le résultat net estimé : où il est, s'il se voit, ce qu'il dit. */
async function resultatNet(p: Page) {
  return p.evaluate(() => {
    const el = [...document.querySelectorAll<HTMLElement>("[data-resultat-net-estime]")].find(
      (e) => e.getBoundingClientRect().height > 0,
    );
    if (!el) return { present: false, visible: false, texte: "", haut: null as number | null };
    const r = el.getBoundingClientRect();
    const dansLaFenetre =
      r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
    // Non couvert : le point du milieu de sa première moitié est bien à lui.
    const dessus = dansLaFenetre
      ? document.elementFromPoint(r.left + Math.min(12, r.width / 2), r.top + r.height / 2)
      : null;
    // Le résumé de la ligne du téléphone étend sa cible tactile par-dessus son
    // texte (`.cible-etendue`) : toucher là, c'est toucher la ligne, pas autre chose.
    const aLui =
      !!dessus &&
      (el === dessus ||
        el.contains(dessus) ||
        (dessus.contains(el) && dessus.matches("summary.cible-etendue")));
    const s = getComputedStyle(el);
    return {
      present: true,
      visible: dansLaFenetre && aLui && s.visibility !== "hidden" && Number(s.opacity) > 0,
      texte: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
      haut: Math.round(r.top),
    };
  });
}

/** Le bouton qui fait avancer ou valider, dans la fenêtre. */
async function amenerLeBoutonDuBas(p: Page) {
  await p.evaluate(() => {
    const b = [...document.querySelectorAll<HTMLButtonElement>("form button")].find((x) =>
      /^(Suivant|Valider et simuler)/.test((x.textContent ?? "").trim()),
    );
    b?.scrollIntoView({ block: "end" });
    window.scrollBy(0, 24);
  });
  await p.waitForTimeout(250);
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  ordi = await navigateur.newContext({ locale: "fr-FR", viewport: { width: 1280, height: 800 } });
  page = await ordi.newPage();
  await page.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /NOVA/ }).first().click();
  await page.getByRole("button", { name: /^Niveau 3/ }).click();
  await page.getByRole("button", { name: "Lancer la partie" }).click();
  await page.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (page.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  }
  urlArene = page.url().split("?")[0]!.split("#")[0]!;
  await page.waitForLoadState("networkidle");
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("sur ordinateur (1280), le résultat estimé reste sous les yeux", () => {
  it("à chaque étape de la feuille, en haut comme au pied, jusqu'à « Valider et simuler »", async () => {
    await page.evaluate(() => (window.location.hash = "decisions"));
    await page.waitForTimeout(1_200);
    const ouvrir = page.getByRole("button", { name: /Ouvrir le courrier/ }).first();
    if (await ouvrir.isVisible().catch(() => false)) {
      await ouvrir.click();
      await page.waitForTimeout(2_000);
      const note = page.getByRole("button", { name: /pris note/ });
      if (await note.count()) await note.first().click();
      await page.waitForTimeout(500);
    }
    await etapes(page).first().waitFor({ state: "visible", timeout: 30_000 });
    const n = await etapes(page).count();
    expect(n).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < n; i++) {
      await etapes(page).nth(i).click();
      await page.waitForTimeout(300);
      // L'étape elle-même, son premier panneau sous la barre.
      await page.evaluate(() => {
        const s = document.querySelector("form section[data-etape]:not([hidden])");
        if (s) window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 120);
      });
      await page.waitForTimeout(250);
      const haut = await resultatNet(page);
      expect(haut.visible, `étape ${i + 1}, en haut : ${JSON.stringify(haut)}`).toBe(true);
      // Le pied de l'étape : « Suivant », ou « Valider et simuler » à la dernière.
      await amenerLeBoutonDuBas(page);
      const bas = await resultatNet(page);
      expect(bas.visible, `étape ${i + 1}, au pied : ${JSON.stringify(bas)}`).toBe(true);
      if (i === n - 1) {
        const valider = await page
          .getByRole("button", { name: /Valider et simuler/ })
          .boundingBox();
        expect(valider, "« Valider et simuler » hors de la fenêtre").not.toBeNull();
        expect(valider!.y + valider!.height).toBeLessThanOrEqual(800);
        expect(valider!.y).toBeGreaterThan(bas.haut!);
      }
    }
  }, 240_000);

  it("le chiffre change quand on change le prix", async () => {
    await etapes(page).first().click();
    await page.waitForTimeout(300);
    const prix = page.locator('input[name="price"]').first();
    const v0 = Number(await prix.inputValue());
    const avant = await resultatNet(page);
    await prix.fill(String(Math.round(v0 * 1.15)));
    await page.waitForTimeout(1_200);
    const apres = await resultatNet(page);
    expect(apres.visible).toBe(true);
    expect(apres.texte, "le résultat estimé n'a pas suivi le prix").not.toBe(avant.texte);
    await prix.fill(String(v0));
    await page.waitForTimeout(900);
    expect((await resultatNet(page)).texte).toBe(avant.texte);
  }, 60_000);

  it("zéro vente estimée : pas de zéros, une invitation et le chemin du champ", async () => {
    const champ = page.locator('input[name^="ventesEstimees."]').first();
    const v0 = await champ.inputValue();
    await champ.fill("0");
    await page.waitForTimeout(1_000);
    // On part d'une autre étape : le lien doit ramener au champ.
    await etapes(page).nth(2).click();
    await page.waitForTimeout(300);
    const cadran = page.locator("[data-resultat-estime]");
    expect(await cadran.innerText()).toContain("Estimez vos ventes pour voir le résultat");
    expect(await cadran.locator("dl").count(), "des chiffres sans ventes estimées").toBe(0);
    await cadran.getByRole("link", { name: /ventes estimées/ }).click();
    await page.waitForTimeout(600);
    const focus = await page.evaluate(
      () => (document.activeElement as HTMLInputElement | null)?.name ?? "",
    );
    expect(focus).toMatch(/^ventesEstimees\./);
    await champ.fill(v0);
    await page.waitForTimeout(900);
    expect((await resultatNet(page)).visible).toBe(true);
  }, 60_000);
});

describe("sur un portable (1366 × 768), le cadran ne masque pas le premier champ", () => {
  it("au début de la feuille, le premier champ est dans la fenêtre et rien ne le couvre", async () => {
    const portable = await navigateur.newContext({
      locale: "fr-FR",
      viewport: { width: 1366, height: 768 },
      storageState: await ordi.storageState(),
    });
    const p = await portable.newPage();
    await p.goto(urlArene, { waitUntil: "networkidle" });
    await p.evaluate(() => (window.location.hash = "decisions"));
    await p.waitForTimeout(1_200);
    await etapes(p).first().click();
    await p.waitForTimeout(300);
    await p.evaluate(() =>
      document.querySelector("form[data-debut-d-etape]")?.scrollIntoView({ block: "start" }),
    );
    await p.waitForTimeout(400);
    const m = await p.evaluate(() => {
      const champ = document.querySelector<HTMLInputElement>('input[name^="ventesEstimees."]')!;
      const r = champ.getBoundingClientRect();
      const dessus = document.elementFromPoint(r.left + 24, r.top + r.height / 2);
      return {
        dansLaFenetre: r.top >= 0 && r.bottom <= innerHeight,
        aLui: !!dessus && (dessus === champ || !!dessus.closest("label")?.contains(champ)),
      };
    });
    expect(m.dansLaFenetre, "le premier champ est sous le pli").toBe(true);
    expect(m.aLui, "le premier champ est couvert").toBe(true);
    expect((await resultatNet(p)).visible).toBe(true);
    await portable.close();
  }, 120_000);
});

describe("sur téléphone (390), une ligne estimée sur chaque carte de décision", () => {
  it("chaque carte la montre, la carte du prix la fait bouger, et elle se déplie sans faire défiler", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await ordi.storageState(),
    });
    const t = await tel.newPage();
    await t.goto(urlArene, { waitUntil: "networkidle" });
    await t.evaluate(() => (window.location.hash = "decisions"));
    await t.waitForTimeout(1_500);
    let cartes = 0;
    let prixVu = false;
    for (let k = 0; k < 25; k++) {
      const titre = ((await t.locator("[data-titre-etape]").first().textContent()) ?? "").trim();
      const r = await resultatNet(t);
      expect(r.visible, `carte ${k + 1} « ${titre} » : ${JSON.stringify(r)}`).toBe(true);
      cartes += 1;
      if (/quel prix/i.test(titre)) {
        prixVu = true;
        const prix = t.locator('input[name="price"]:visible').first();
        const v0 = Number(await prix.inputValue());
        await prix.fill(String(Math.round(v0 * 1.15)));
        await t.waitForTimeout(1_200);
        const apres = await resultatNet(t);
        expect(apres.texte, "la ligne n'a pas suivi le prix").not.toBe(r.texte);
        await prix.fill(String(v0));
        await t.waitForTimeout(900);
      }
      if (await t.getByRole("button", { name: /Valider et simuler/ }).count()) {
        // La dernière carte : la ligne se déplie dans un tiroir, la carte ne bouge pas.
        const y0 = await t.evaluate(() => scrollY);
        await t.locator("[data-ligne-estimee] summary").click();
        await t.waitForTimeout(400);
        const tiroir = t.locator("[data-ligne-estimee] .tiroir-estime");
        expect(await tiroir.isVisible()).toBe(true);
        const texte = await tiroir.innerText();
        for (const mot of ["Chiffre d'affaires", "Stock final", "Trésorerie fin de tour"]) {
          expect(texte.toLowerCase()).toContain(mot.toLowerCase());
        }
        expect(await t.evaluate(() => scrollY)).toBe(y0);
        await t.keyboard.press("Escape");
        await t.waitForTimeout(200);
        expect(await tiroir.isVisible()).toBe(false);
        break;
      }
      const accepter = t.getByRole("button", { name: "Accepter", exact: true });
      if ((await accepter.count()) && (await accepter.first().isVisible()))
        await accepter.first().click();
      else
        await t
          .getByRole("button", { name: /^Continuer/ })
          .last()
          .click();
      await t.waitForTimeout(600);
    }
    expect(prixVu, "la carte du prix n'a pas été vue").toBe(true);
    expect(cartes).toBeGreaterThanOrEqual(8);
    await tel.close();
  }, 240_000);
});
