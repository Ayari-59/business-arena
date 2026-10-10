import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type BrowserContext, type Page } from "playwright-core";
import { BASE, ouvrirNavigateur, texte } from "./helpers/browser";

/**
 * LOT P4 « FINITIONS », DANS UN NAVIGATEUR.
 *
 *   1. LA PROPOSITION DU PREMIER TOUR N'EST PAS UNE ESTIMATION : validée sans
 *      y toucher, elle n'est pas opposée au marché (« Vous aviez estimé… »
 *      n'apparaît pas au verdict).
 *   2. UNE PARTIE JOUÉE SE RETIENT SUR L'APPAREIL : le témoin que
 *      l'invitation à installer attend est posé dès le verdict d'un tour.
 *   3. LE SOMMAIRE D'UN TOUR CLOS : la face lue est marquée, et l'ancre
 *      s'arrête sous la barre collante, titre visible.
 *   4. UNE SEULE LIGNE D'EN-TÊTE SUR TÉLÉPHONE : au deuxième tour, « Tour 2/6 »
 *      n'est écrit qu'une fois à l'écran (la barre de la partie).
 *
 * LOT P5 « LES CINQ RESTES » :
 *   5. LE RANG ÉCRIT UNE FOIS : au verdict, sur le verdict d'un tour clos et
 *      sur l'ardoise, aucune médaille ne double « 2e sur 3 ».
 *   6. LES FLÈCHES DE REPLI : dans chaque étape de la feuille de décision et
 *      dans les tours clos, le même chevron, en tête du résumé, 16 px, qui
 *      pivote d'un quart de tour quand le repli est ouvert.
 *   7. LE BILAN : la partie jouée jusqu'au bout, le titre ne dit « Victoire »
 *      que sur un résultat cumulé positif, et la courbe remplit sa clôture, son
 *      étiquette dans le dessin, à 1280, 1024 et 390 px.
 */

let navigateur: Browser;
let ordi: BrowserContext;
let page: Page;
let urlArene: string;

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
  await page.waitForLoadState("networkidle");
  urlArene = page.url().split("?")[0]!.split("#")[0]!;
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

/** Dans `racine` : les médailles peintes, et combien de fois un rang « 2e sur 3 » est écrit. */
async function rangEcritUneFois(p: Page, racine: string) {
  return p.evaluate((racine) => {
    const r = document.querySelector<HTMLElement>(racine);
    if (!r) return null;
    const medailles = [...r.querySelectorAll(".pastille-rang")].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    }).length;
    const ecrits = (r.innerText.replace(/\u00a0/g, " ").match(/\b\d+\s?(re|e)\s+sur\s+\d+/g) ?? []).length;
    return { medailles, ecrits };
  }, racine);
}

/** Les chevrons des résumés visibles de l'arène : côté, taille, glyphes, rotation. */
async function chevrons(p: Page) {
  return p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-ecran-de-jeu] summary")]
      .filter((s) => {
        const r = s.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(s).visibility !== "hidden";
      })
      .map((s) => {
        const titre = s.innerText.replace(/\s+/g, " ").trim().slice(0, 40);
        const c = s.querySelector<SVGElement>("[data-chevron]");
        if (!c) return { titre, chevron: false };
        const rs = s.getBoundingClientRect();
        const rc = c.getBoundingClientRect();
        const debut = rs.left + parseFloat(getComputedStyle(s).paddingLeft);
        // Rien de peint à gauche du chevron dans le résumé.
        const avant = [...s.querySelectorAll("*")].filter((e) => {
          if (e === c || c.contains(e) || e.contains(c)) return false;
          const r = e.getBoundingClientRect();
          const lu = e instanceof HTMLElement ? e.innerText.trim() : "";
          return r.width > 0 && r.height > 0 && r.right <= rc.left + 0.5 && lu.length > 0;
        }).length;
        // Tailwind 4 fait pivoter par la propriété `rotate` (et non
        // `transform`) : on lit les deux.
        const style = getComputedStyle(c);
        const [a, b] = (style.transform.match(/-?[\d.e-]+/g) ?? ["1", "0"]).map(Number);
        const quart = style.rotate === "90deg" || (Math.abs(a!) < 0.01 && Math.abs(b! - 1) < 0.01);
        return {
          titre,
          chevron: true,
          ecart: Math.round(rc.left - debut),
          taille: `${Math.round(rc.width)}x${Math.round(rc.height)}`,
          avant,
          glyphes: /[▸›▾▼]/.test(s.innerText),
          ouvert: (s.parentElement as HTMLDetailsElement).open,
          quart,
        };
      }),
  );
}

function verifierLesChevrons(liste: Awaited<ReturnType<typeof chevrons>>, ou: string) {
  for (const c of liste) {
    expect(c.chevron, `${ou} « ${c.titre} » : pas de chevron commun`).toBe(true);
    if (!("ecart" in c)) continue;
    expect(Math.abs(c.ecart!), `${ou} « ${c.titre} » : chevron hors de la tête du résumé`).toBeLessThanOrEqual(1);
    expect(c.avant, `${ou} « ${c.titre} » : quelque chose avant le chevron`).toBe(0);
    expect(c.taille, `${ou} « ${c.titre} »`).toBe("16x16");
    expect(c.glyphes, `${ou} « ${c.titre} » : un ancien glyphe`).toBe(false);
    expect(c.quart, `${ou} « ${c.titre} » : ouvert ${c.ouvert}, pivot`).toBe(c.ouvert);
  }
}

describe("la proposition du premier tour", () => {
  it("avant toute partie jouée, l'appareil n'a pas de témoin", async () => {
    expect(await page.evaluate(() => localStorage.getItem("partie-jouee-le"))).toBeNull();
  });

  it("validée sans y toucher, elle n'est pas opposée au marché", async () => {
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_200);
    await page.locator("[data-proposition-de-ventes]:visible").first().waitFor({ timeout: 30_000 });
    const ouvrir = page.getByRole("button", { name: /Ouvrir le courrier/ }).first();
    if (await ouvrir.isVisible().catch(() => false)) {
      await ouvrir.click();
      await page.waitForTimeout(1_800);
      const note = page.getByRole("button", { name: /pris note/ }).first();
      if (await note.isVisible().catch(() => false)) await note.click();
    }
    for (let k = 0; k < 20; k++) {
      if (await page.getByRole("button", { name: /Valider et simuler/ }).count()) break;
      await page.getByRole("button", { name: /^Suivant/ }).last().click();
      await page.waitForTimeout(250);
    }
    // Le témoin part avec le formulaire : la proposition n'a pas été touchée.
    expect(await page.locator('input[name="propositionDeVentes"]').count()).toBe(1);
    await page.getByRole("button", { name: /Valider et simuler/ }).first().click();
    const garder = page.getByRole("button", { name: /Oui, je garde/ });
    if (await garder.count()) await garder.first().click();
    await page.waitForURL(/simule/, { timeout: 180_000 });
    await page.waitForLoadState("networkidle");
    const t = (await texte(page)).toLowerCase();
    expect(t).toContain("le marché a répondu");
    expect(t, "une proposition non touchée est opposée au marché").not.toContain("vous aviez estimé");
    expect(await page.locator("[data-ecart-d-estimation]").count()).toBe(0);
    // Lot P5 : le rang du verdict est écrit une fois, sans médaille à côté.
    await page.waitForTimeout(1_500);
    expect(await rangEcritUneFois(page, "[data-verdict-du-marche]")).toEqual({ medailles: 0, ecrits: 1 });
  }, 240_000);

  it("le verdict d'un tour pose le témoin d'une partie jouée", async () => {
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => localStorage.getItem("partie-jouee-le"))).not.toBeNull();
  });
});

describe("le sommaire d'un tour clos", () => {
  it("la face lue est marquée, et l'ancre ne cache pas son titre sous la barre collante", async () => {
    await page.getByRole("link", { name: /Voir les résultats/ }).first().click();
    await page.waitForURL(/\/arena\//, { timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    const tour = page.locator("#dernier-resultat");
    await tour.waitFor({ state: "visible", timeout: 30_000 });
    const sommaire = tour.getByRole("navigation", { name: /^Résultats du / });
    for (const face of ["Marché", "Finance", "Synthèse"]) {
      await sommaire.getByRole("link", { name: face, exact: true }).click();
      await page.waitForTimeout(1_000);
      const m = await page.evaluate((face) => {
        let barre = 0;
        for (const el of document.querySelectorAll<HTMLElement>("body *")) {
          const s = getComputedStyle(el);
          if (s.position !== "sticky" && s.position !== "fixed") continue;
          const r = el.getBoundingClientRect();
          if (r.top <= 1 && r.height > 0 && r.width > innerWidth / 2 && r.bottom < innerHeight / 3) {
            barre = Math.max(barre, r.bottom);
          }
        }
        const titre = [...document.querySelectorAll<HTMLElement>("[data-face-du-tour] > h3")].find(
          (h) => h.textContent?.trim() === face,
        )!;
        const actif = document.querySelector<HTMLElement>('[data-sommaire-du-tour] a[aria-current="location"]');
        return { barre, titre: titre.getBoundingClientRect().top, actif: actif?.textContent?.trim() };
      }, face);
      expect(m.actif, `après un clic sur « ${face} », la face marquée`).toBe(face);
      expect(m.titre, `le titre « ${face} » passe sous la barre collante`).toBeGreaterThanOrEqual(m.barre);
      expect(m.titre).toBeLessThan(400);
    }
    // Lot P5 : le verdict du tour clos dit « Au classement révélé : 1re sur
    // 3 équipes », sans la médaille posée devant.
    const ligne = await page.evaluate(() => {
      const p = [...document.querySelectorAll<HTMLElement>("#dernier-resultat p")].find((e) =>
        /^Au classement révélé/.test(e.innerText.trim()),
      );
      return p ? { texte: p.innerText.trim(), medailles: p.querySelectorAll(".pastille-rang").length } : null;
    });
    expect(ligne, "la ligne du classement révélé est introuvable").not.toBeNull();
    expect(ligne!.medailles).toBe(0);
    expect(ligne!.texte).toMatch(/^Au classement révélé : \d+\s?(re|e) sur \d+ équipes/);
  }, 120_000);
});

describe("sur téléphone, une seule ligne d'en-tête", () => {
  it("au deuxième tour, « Tour 2/6 » n'est écrit qu'une fois à l'écran", async () => {
    const tel = await navigateur.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      locale: "fr-FR",
      storageState: await ordi.storageState(),
    });
    const q = await tel.newPage();
    await q.goto(urlArene, { waitUntil: "domcontentloaded" });
    await q.waitForLoadState("networkidle");
    await q.waitForTimeout(1_200);
    // Le plus petit élément qui écrit « Tour 2/6 » (le JSX le coupe en
    // plusieurs nœuds de texte : « Tour », « 2 », « / », « 6 »), visible dans
    // la fenêtre.
    const visibles = await q.evaluate(() => {
      const dit = (e: Element) => /Tour\s*2\s*\/\s*6/.test((e.textContent ?? "").replace(/\u00a0/g, " "));
      return [...document.querySelectorAll<HTMLElement>("body *")].filter((e) => {
        if (!dit(e) || [...e.children].some(dit)) return false;
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && s.visibility !== "hidden";
      }).length;
    });
    expect(visibles, "« Tour 2/6 » redit sous la barre").toBe(1);
    await tel.close();
  }, 120_000);
});

describe("lot P5 : le rang une fois, les replis alignés, le bilan honnête", () => {
  it("au tour 2, l'ardoise dit le rang sans médaille, et chaque repli de la feuille a le même chevron", async () => {
    await page.goto(urlArene, { waitUntil: "networkidle" });
    await page.waitForTimeout(1_000);
    expect(await rangEcritUneFois(page, "#ardoise-du-dirigeant")).toEqual({ medailles: 0, ecrits: 1 });
    // Les tours clos, en accordéon sous le tour à jouer.
    await page.waitForTimeout(400);
    const passer = page.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
    if (await passer.isVisible().catch(() => false)) {
      await passer.click();
      await page.waitForTimeout(600);
    }
    await page.evaluate(() => {
      location.hash = "decisions";
    });
    await page.waitForTimeout(1_200);
    const ouvrir = page.getByRole("button", { name: /Ouvrir le courrier/ }).first();
    if (await ouvrir.isVisible().catch(() => false)) {
      await ouvrir.click();
      await page.waitForTimeout(1_800);
      const note = page.getByRole("button", { name: /pris note/ }).first();
      if (await note.isVisible().catch(() => false)) await note.click();
    }
    let etapes = 0;
    let replis = 0;
    for (let k = 0; k < 20; k++) {
      await page.waitForTimeout(450);
      const liste = await chevrons(page);
      replis += liste.length;
      verifierLesChevrons(liste, `étape ${k + 1}`);
      etapes += 1;
      if (await page.getByRole("button", { name: /Valider et simuler/ }).count()) break;
      await page.getByRole("button", { name: /^Suivant/ }).last().click();
    }
    expect(etapes).toBeGreaterThanOrEqual(4);
    // Des replis ouverts et fermés ont été vus (tiroirs, volets, options).
    expect(replis).toBeGreaterThanOrEqual(8);
  }, 180_000);

  it("la partie jouée jusqu'au bout : un titre honnête, et une courbe qui remplit sa clôture", async () => {
    for (let t = 2; t <= 6; t++) {
      await page.goto(urlArene, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      if (await page.locator("[data-cloture-de-l-exercice]").count()) break;
      const passer = page.getByRole("button", { name: /Passer au |Prendre mes décisions/i }).first();
      if (await passer.isVisible().catch(() => false)) {
        await passer.click();
        await page.waitForTimeout(500);
      }
      await page.evaluate(() => {
        location.hash = "decisions";
      });
      await page.waitForTimeout(1_000);
      const ouvrir = page.getByRole("button", { name: /Ouvrir le courrier/ }).first();
      if (await ouvrir.isVisible().catch(() => false)) {
        await ouvrir.click();
        await page.waitForTimeout(1_500);
        const note = page.getByRole("button", { name: /pris note/ }).first();
        if (await note.isVisible().catch(() => false)) await note.click();
      }
      for (let k = 0; k < 20; k++) {
        if (await page.getByRole("button", { name: /Valider et simuler/ }).count()) break;
        await page.getByRole("button", { name: /^Suivant/ }).last().click();
        await page.waitForTimeout(250);
      }
      await page.getByRole("button", { name: /Valider et simuler/ }).first().click();
      const garder = page.getByRole("button", { name: /Oui, je garde/ });
      if (await garder.count()) await garder.first().click();
      await page.waitForURL(/simule/, { timeout: 180_000 });
    }
    await page.goto(urlArene, { waitUntil: "networkidle" });
    await page.locator("[data-cloture-de-l-exercice]").waitFor({ timeout: 60_000 });

    // LE TITRE : « Victoire » seulement si la partie finit dans le vert.
    const tete = await page.evaluate(() => {
      const titre = document.querySelector("#cloture-titre")?.textContent?.trim() ?? "";
      const cumul = [...document.querySelectorAll<HTMLElement>("[data-cloture-de-l-exercice] dt, [data-cloture-de-l-exercice] dd")]
        .map((e) => e.innerText);
      const coupe = document.querySelector("#cloture-titre svg") !== null;
      return { titre, cumul: cumul.join(" | "), coupe };
    });
    const enPerte = /la partie se termine en perte/.test(tete.cumul);
    if (enPerte) {
      expect(tete.titre, "le titre célèbre une partie en perte").not.toMatch(/Victoire|domine/);
      expect(tete.coupe, "la coupe d'or au-dessus d'une perte").toBe(false);
    }
    if (/Victoire/.test(tete.titre)) expect(tete.cumul).toContain("vous finissez dans le vert");

    // LA COURBE : elle occupe la largeur de sa clôture, l'étiquette du dernier
    // point dans le dessin.
    for (const [largeur, hauteur] of [
      [1280, 800],
      [1024, 768],
      [390, 844],
    ] as const) {
      await page.setViewportSize({ width: largeur, height: hauteur });
      await page.waitForTimeout(900);
      const m = await page.evaluate(() => {
        const f = document.querySelector<HTMLElement>("[data-courbe-des-tours]")!;
        const svg = [...f.querySelectorAll<SVGSVGElement>("svg")].find((s) => s.getBoundingClientRect().width > 0)!;
        const e = svg.querySelector("[data-etiquette-du-dernier-point]")!.getBoundingClientRect();
        const rf = f.getBoundingClientRect();
        const rs = svg.getBoundingClientRect();
        const graduation = parseFloat(getComputedStyle(svg.querySelector("text")!).fontSize);
        const echelle = rs.width / svg.viewBox.baseVal.width;
        return {
          dessins: [...f.querySelectorAll("svg")].filter((s) => s.getBoundingClientRect().width > 0).length,
          remplissage: rs.width / rf.width,
          etiquette: { gauche: e.left - rs.left, droite: rs.right - e.right, haut: e.top - rs.top, bas: rs.bottom - e.bottom },
          texte: graduation * echelle,
        };
      });
      expect(m.dessins, `${largeur} px`).toBe(1);
      expect(m.remplissage, `${largeur} px : la courbe laisse un vide`).toBeGreaterThanOrEqual(0.99);
      expect(m.etiquette.droite, `${largeur} px : l'étiquette sort à droite`).toBeGreaterThanOrEqual(0);
      expect(m.etiquette.gauche, `${largeur} px`).toBeGreaterThanOrEqual(0);
      expect(m.etiquette.haut, `${largeur} px`).toBeGreaterThanOrEqual(0);
      expect(m.etiquette.bas, `${largeur} px`).toBeGreaterThanOrEqual(0);
      // Une unité pour un pixel : le texte du dessin garde sa taille (14 px).
      expect(Math.abs(m.texte - 14), `${largeur} px : texte à ${m.texte} px`).toBeLessThan(0.6);
    }
  }, 900_000);
});
