import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * L'ÉNERGIE DE L'ARÈNE, MESURÉE DANS LE NAVIGATEUR (lot 6E).
 *
 * Quatre règles du lot ne se voient qu'à l'écran, sur le build servi, partie
 * comprise :
 *
 *   1. UN SEUL APLAT ORANGE PAR FENÊTRE aux étapes de décision. Le courrier pas
 *      encore ouvert a son bouton orange ; « Valider et simuler » est le grand
 *      bouton orange de la dernière étape ; « Suivant » est plein mais neutre.
 *      On balaie chaque étape de haut en bas, à la hauteur d'un portable
 *      (1366 × 768), courrier fermé puis ouvert, comme `contre-jour.e2e.ts`
 *      balaie les bandes : jamais deux aplats dans la même fenêtre.
 *   2. LA NAVIGATION N'EST PAS ORANGE : le segment de l'étape en cours a la
 *      couleur calculée de `--metier`, jamais celle de l'accent d'action.
 *   3. UN CHAMP MODIFIABLE SE DISTINGUE D'UNE INFORMATION CONSULTABLE : le fond
 *      du champ et son liseré, mesurés contre le panneau qui le porte ;
 *      l'information (« Prix usuels du marché ») n'a ni cadre ni fond.
 *   4. SUR TÉLÉPHONE : une seule barre fixe, au plus un aplat orange par
 *      carte, une zone utile d'au moins 520 px, et aucun défilement latéral.
 * Et le rituel porte « ce qui a fait le résultat » (où sont passées les
 * ventes), dont la phrase dit le résultat net annoncé en grand, ses boutons
 * dans la fenêtre.
 */

let navigateur: Browser;
let portable: BrowserContext;
let page: Page;
let urlArene: string;

const ORANGE = "rgb(255, 138, 31)";

async function aplatsVisibles(p: Page): Promise<string[]> {
  return p.evaluate(() =>
    [...document.querySelectorAll<HTMLButtonElement>(".bouton-plein")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.width > 0 &&
          r.height > 0 &&
          r.bottom > 0 &&
          r.top < innerHeight &&
          getComputedStyle(e).visibility !== "hidden" &&
          !e.disabled
        );
      })
      .map((e) => (e.textContent ?? "").trim()),
  );
}

/** Le pire nombre d'aplats orange visibles ensemble, en balayant la page de haut en bas. */
async function balayer(p: Page): Promise<string[]> {
  const hauteur = await p.evaluate(() => document.body.scrollHeight);
  const pas = Math.round((await p.evaluate(() => innerHeight)) / 3);
  let pire: string[] = [];
  for (let y = 0; y <= hauteur; y += pas) {
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(60);
    const a = await aplatsVisibles(p);
    if (a.length > pire.length) pire = a;
  }
  return pire;
}

const etapes = (p: Page) => p.locator('[aria-label="Étapes de décision"] li button');

async function allerDecider(p: Page) {
  await p.goto(urlArene, { waitUntil: "networkidle" });
  await p.evaluate(() => (window.location.hash = "decisions"));
  await p.waitForTimeout(1_200);
  await etapes(p).first().waitFor({ state: "visible", timeout: 30_000 });
}

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  portable = await navigateur.newContext({
    locale: "fr-FR",
    viewport: { width: 1366, height: 768 },
  });
  page = await portable.newPage();
  await page.goto(`${BASE}/jouer`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /NOVA/ }).first().click();
  await page.getByRole("button", { name: "Lancer la partie" }).click();
  await page.waitForURL(/\/arena\/|trop=1/, { timeout: 90_000 });
  if (page.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint : relancer sur une base neuve.");
  }
  urlArene = page.url().split("?")[0]!.split("#")[0]!;
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("un seul aplat orange par fenêtre, aux étapes de décision", () => {
  it("courrier fermé : son bouton est le seul orange, à chacune des étapes", async () => {
    await allerDecider(page);
    const ouvrir = page.getByRole("button", { name: /Ouvrir le courrier/ });
    expect(await ouvrir.count(), "le courrier devrait attendre d'être ouvert").toBeGreaterThan(0);
    const n = await etapes(page).count();
    expect(n).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < n; i++) {
      await etapes(page).nth(i).click();
      await page.waitForTimeout(250);
      const pire = await balayer(page);
      expect(pire.length, `étape ${i + 1} : ${pire.join(" + ")}`).toBeLessThanOrEqual(1);
    }
  }, 180_000);

  it("courrier ouvert : « Suivant » est neutre et dit où il mène, « Valider et simuler » est l'orange de la fin", async () => {
    await page
      .getByRole("button", { name: /Ouvrir le courrier/ })
      .first()
      .click();
    await page.waitForTimeout(2_000);
    const note = page.getByRole("button", { name: /pris note/ });
    if (await note.count()) await note.first().click();
    await page.waitForTimeout(600);
    const n = await etapes(page).count();
    for (let i = 0; i < n; i++) {
      await etapes(page).nth(i).click();
      await page.waitForTimeout(250);
      const pire = await balayer(page);
      if (i < n - 1) {
        expect(pire, `étape ${i + 1}`).toEqual([]);
        const suivant = page.getByRole("button", { name: /^Suivant : / });
        expect(await suivant.count(), `étape ${i + 1} : « Suivant : … »`).toBe(1);
        expect(await suivant.getAttribute("class")).toContain("bouton-suite");
      } else {
        expect(pire.map((t) => t.toLowerCase())).toEqual(["valider et simuler"]);
      }
    }
  }, 180_000);
});

describe("la navigation est à la teinte du métier", () => {
  it("le segment de l'étape en cours a la couleur du métier, jamais l'orange", async () => {
    await etapes(page).nth(1).click();
    await page.waitForTimeout(300);
    const { segment, metier, parcourue } = await page.evaluate(() => {
      const nav = document.querySelector('[aria-label="Étapes de décision"]')!;
      const sonde = document.createElement("span");
      sonde.style.color = "var(--metier)";
      nav.appendChild(sonde);
      const metier = getComputedStyle(sonde).color;
      sonde.remove();
      return {
        segment: getComputedStyle(nav.querySelector('[data-etat="courante"]')!).backgroundColor,
        parcourue: getComputedStyle(nav.querySelector('[data-etat="parcourue"]')!).backgroundColor,
        metier,
      };
    });
    expect(segment).toBe(metier);
    expect(parcourue).toBe(metier);
    expect(segment).not.toBe(ORANGE);
    // Le compteur est honnête : les étapes PARCOURUES. Elles l'ont toutes été plus haut.
    const n = await etapes(page).count();
    const compteur = await page.locator("[data-compteur-de-la-piste]").innerText();
    expect(compteur.replace(/\s+/g, " ")).toBe(`${n} / ${n} parcourues`);
  }, 60_000);
});

describe("un champ modifiable saute aux yeux, une information reste plate", () => {
  it("le champ du prix contre son panneau, et les prix usuels du marché sans cadre", async () => {
    await etapes(page).first().click();
    await page.waitForTimeout(300);
    const mesure = await page.evaluate(() => {
      const rvb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = (c: string) => {
        const [r, g, b] = rvb(c).map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const ratio = (a: string, b: string) => {
        const [x, y] = [lum(a), lum(b)];
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const champ = document.querySelector('input[name="price"]')!.closest(".champ")!;
      // Lot P3 : le champ est posé dans le PANNEAU DE DÉCISION (le sol relevé).
      const panneau = champ.closest(".panneau-decision")!;
      const sc = getComputedStyle(champ);
      const sp = getComputedStyle(panneau);
      const info = [...document.querySelectorAll("p")].find((p) =>
        p.textContent?.includes("Prix usuels du marché"),
      )!;
      const si = getComputedStyle(info);
      const texte = getComputedStyle(document.querySelector('input[name="price"]')!).color;
      return {
        fond: ratio(sc.backgroundColor, sp.backgroundColor),
        liseré: ratio(sc.borderTopColor, sp.backgroundColor),
        texte: ratio(texte, sc.backgroundColor),
        infoBord: parseFloat(si.borderTopWidth) + parseFloat(si.borderLeftWidth),
        infoFond: si.backgroundColor,
      };
    });
    expect(mesure.fond, "fond du champ / panneau").toBeGreaterThanOrEqual(1.35);
    expect(mesure.liseré, "liseré du champ / panneau").toBeGreaterThanOrEqual(3);
    expect(mesure.texte, "chiffre / fond du champ").toBeGreaterThanOrEqual(4.5);
    expect(mesure.infoBord, "une information n'a pas de cadre").toBe(0);
    expect(mesure.infoFond).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  }, 60_000);

  it("aucun défilement latéral sur un portable", async () => {
    const d = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(d).toBe(0);
  });
});

describe("le rituel dit ce qui a fait le résultat", () => {
  it("la cascade est là, et sa dernière marche est le résultat annoncé en grand", async () => {
    const n = await etapes(page).count();
    await etapes(page)
      .nth(n - 1)
      .click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Valider et simuler/ }).click();
    await page.waitForTimeout(800);
    const oui = page.getByRole("button", { name: /Oui, je garde/ });
    if (await oui.count()) await oui.first().click();
    await page.waitForURL(/simule/, { timeout: 120_000 });
    await page.locator("[data-ce-qui-a-fait-le-resultat]").waitFor({ state: "visible" });
    await page.waitForTimeout(1_800);
    await page.evaluate(() => window.scrollTo(0, 0));
    const chiffres = await page.evaluate(() => ({
      grand: document.querySelector('[data-temps="2"] .chiffre-qui-arrive')?.textContent ?? "",
      // Lot P8, piste A : les ventes, puis les trois postes de coût dans leur
      // teinte, et la phrase du résultat, avec son montant.
      cascade: document.querySelector("[data-lecture-du-resultat] [data-montant]")?.textContent ?? "",
      lecture: document.querySelector("[data-lecture-du-resultat] .partage-phrase")?.textContent ?? "",
      postes: document.querySelectorAll("[data-legende] [data-poste]").length,
      ventes: Boolean(document.querySelector("[data-barre-ventes]")),
      // LES BOUTONS DU RITUEL RESTENT DANS LE PREMIER ÉCRAN d'un portable (1366 × 768).
      boutons: [...document.querySelectorAll<HTMLElement>('[data-temps="4"] a')].map((a) =>
        Math.round(a.getBoundingClientRect().bottom),
      ),
      H: innerHeight,
    }));
    const euros = (t: string) => Number(t.replace(/[^\d]/g, ""));
    expect(chiffres.ventes).toBe(true);
    expect(chiffres.postes).toBe(3);
    expect(euros(chiffres.cascade)).toBe(euros(chiffres.grand));
    expect(chiffres.lecture).toMatch(/c'est (votre bénéfice|votre perte|l'équilibre)\.$/);
    expect(chiffres.boutons.length).toBeGreaterThanOrEqual(2);
    for (const b of chiffres.boutons) expect(b, "un bouton du rituel sous la fenêtre").toBeLessThanOrEqual(chiffres.H);
  }, 180_000);
});

describe("sur téléphone : une barre fixe, un aplat par carte, de la place", () => {
  it("chaque carte de décision tient la règle", async () => {
    const etat = await portable.storageState();
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: etat,
    });
    const t = await tel.newPage();
    await t.goto(urlArene, { waitUntil: "networkidle" });
    await t.evaluate(() => (window.location.hash = "decisions"));
    await t.waitForTimeout(1_500);
    for (let k = 0; k < 25; k++) {
      const mesure = await t.evaluate(() => {
        const H = innerHeight;
        const fixes = [...document.querySelectorAll("body *")].filter((el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return (
            s.position === "fixed" && r.height > 4 && r.width > 200 && r.top > H / 2 && r.top < H
          );
        });
        const bas = Math.min(H, ...fixes.map((f) => f.getBoundingClientRect().top));
        const haut = Math.max(
          0,
          ...[...document.querySelectorAll("body *")]
            .filter((el) => {
              const s = getComputedStyle(el);
              const r = el.getBoundingClientRect();
              return (
                (s.position === "fixed" || s.position === "sticky") &&
                r.top <= 2 + 0 &&
                r.bottom < H / 2 &&
                r.width > 200
              );
            })
            .map((el) => el.getBoundingClientRect().bottom),
        );
        // Les barres collées en haut s'empilent : la dernière borne compte.
        const empile = [...document.querySelectorAll("body *")]
          .filter((el) => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return (
              (s.position === "fixed" || s.position === "sticky") &&
              r.top < H / 2 &&
              r.bottom > 0 &&
              r.bottom < H / 2 &&
              r.width > 200 &&
              r.height > 4
            );
          })
          .map((el) => el.getBoundingClientRect().bottom);
        return {
          fixesEnBas: fixes.filter((f, i) => !fixes.some((g, j) => j !== i && g.contains(f)))
            .length,
          utile: bas - Math.max(haut, ...empile, 0),
          lateral: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      const aplats = await aplatsVisibles(t);
      expect(mesure.fixesEnBas, `carte ${k + 1} : barres fixes`).toBeLessThanOrEqual(1);
      expect(aplats.length, `carte ${k + 1} : ${aplats.join(" + ")}`).toBeLessThanOrEqual(1);
      expect(mesure.utile, `carte ${k + 1} : zone utile`).toBeGreaterThanOrEqual(520);
      expect(mesure.lateral, `carte ${k + 1} : défilement latéral`).toBe(0);
      if (await t.getByRole("button", { name: /Valider et simuler/ }).count()) {
        expect(aplats).toEqual(["Valider et simuler"]);
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
    await tel.close();
  }, 240_000);
});
