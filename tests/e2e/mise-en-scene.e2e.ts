import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devices, type Browser, type Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { PHOTOS_DES_ENTREPRISES, fichierDeLaPhoto } from "../../src/components/illustrations/scene-d-entreprise";

/**
 * LA MISE EN SCÈNE, DANS LE NAVIGATEUR (lot P2).
 *
 * Ce que la garde d'architecture ne peut pas voir : la mise en page réelle
 * (le premier écran, le résumé collé au bas de l'écran, la bande qui défile
 * seule) et surtout le CONTRASTE DU TEXTE POSÉ SUR UNE PHOTO. Une mesure de
 * contraste ordinaire lit les fonds empilés sous un texte ; ici le fond est
 * une image. On mesure donc le rendu : le texte masqué, on cherche, sous
 * chaque ligne, le pixel le PLUS CLAIR de la photo voilée, et on compare la
 * couleur du texte à ce pixel-là. Les neuf photos passent dans le même cadre
 * (sa source et son cadrage sont remplacés), sans lancer neuf parties.
 */

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

/** Le rapport de contraste WCAG de deux couleurs « rgb(r, g, b) » ou [r, g, b]. */
function rapport(a: number[], b: number[]): number {
  const lum = ([r, g, bl]: number[]) =>
    [r!, g!, bl!]
      .map((v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      })
      .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i]!, 0);
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const rvb = (c: string) => (c.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);

/**
 * Le pire contraste de chaque ligne de texte d'un bloc posé sur une photo :
 * texte masqué, capture du bloc, pixel le plus clair sous la boîte de chaque
 * ligne (les feuilles du DOM qui portent du texte).
 */
async function contrastesSurPhoto(page: Page, bloc: string) {
  const cadre = page.locator(bloc).first();
  await cadre.scrollIntoViewIfNeeded();
  const lignes = await cadre.evaluate((racine) => {
    const o = racine.getBoundingClientRect();
    return [...racine.querySelectorAll("[data-texte-sur-photo] *")]
      .filter(
        (e) =>
          [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim()) &&
          !e.closest(".sr-only, [class*='pastille'], [class*='marche'], svg, a, [role], [aria-hidden='true']") &&
          e.getBoundingClientRect().width > 0,
      )
      .map((e) => {
        // La boîte du TEXTE, pas celle de l'élément : un paragraphe s'étire
        // sur toute la largeur du bandeau, jusque sur la partie claire de la
        // photo où rien n'est écrit.
        const plage = document.createRange();
        plage.selectNodeContents(e);
        const r = plage.getBoundingClientRect();
        return {
          texte: (e.textContent ?? "").trim().slice(0, 40),
          couleur: getComputedStyle(e).color,
          x: r.left - o.left,
          y: r.top - o.top,
          l: r.width,
          h: r.height,
        };
      });
  });
  const masque = await page.addStyleTag({
    content:
      "[data-texte-sur-photo] * { color: transparent !important; text-shadow: none !important; } [data-texte-sur-photo] svg, [data-texte-sur-photo] [class*='pastille'], [data-texte-sur-photo] [class*='marche'], [data-texte-sur-photo] a, [data-texte-sur-photo] [role], [data-texte-sur-photo] [aria-hidden='true'] { visibility: hidden !important; } body > header, [data-en-tete-du-site], [data-barre-collante], [data-ardoise-repliee] { opacity: 0 !important; }",
  });
  const png = (await cadre.screenshot({ animations: "disabled" })).toString("base64");
  await masque.evaluate((e) => (e as HTMLElement).remove());
  const clairs: number[][] = await page.evaluate(
    async ({ png, lignes }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const toile = document.createElement("canvas");
      toile.width = image.width;
      toile.height = image.height;
      const ctx = toile.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const lin = (v: number) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return lignes.map((l) => {
        const x0 = Math.max(0, Math.floor(l.x));
        const y0 = Math.max(0, Math.floor(l.y));
        const w = Math.max(1, Math.min(image.width - x0, Math.ceil(l.l)));
        const h = Math.max(1, Math.min(image.height - y0, Math.ceil(l.h)));
        const { data } = ctx.getImageData(x0, y0, w, h);
        let meilleur = [0, 0, 0];
        let lmax = -1;
        for (let i = 0; i < data.length; i += 4) {
          const L = 0.2126 * lin(data[i]!) + 0.7152 * lin(data[i + 1]!) + 0.0722 * lin(data[i + 2]!);
          if (L > lmax) {
            lmax = L;
            meilleur = [data[i]!, data[i + 1]!, data[i + 2]!];
          }
        }
        return meilleur;
      });
    },
    { png, lignes },
  );
  return lignes.map((l, i) => ({
    texte: l.texte,
    rapport: Math.round(rapport(rvb(l.couleur), clairs[i]!) * 100) / 100,
  }));
}

/** Pose une autre photo dans le cadre de l'ouverture, avec son cadrage. */
async function poserLaPhoto(page: Page, bloc: string, code: string, petit: boolean) {
  await page.locator(`${bloc} img[data-lieu-photo]`).evaluate(
    async (img, { src, cadrage }) => {
      const i = img as HTMLImageElement;
      i.removeAttribute("srcset");
      i.style.objectPosition = `50% ${cadrage}%`;
      i.src = src;
      await i.decode();
    },
    { src: fichierDeLaPhoto(code, petit), cadrage: PHOTOS_DES_ENTREPRISES[code]!.cadrage },
  );
  await page.waitForTimeout(150);
}

async function lancer(page: Page, entreprise: RegExp) {
  await aller(page, "/jouer");
  await page.getByRole("button", { name: entreprise }).first().click();
  await page.getByRole("button", { name: /^Niveau 3 ·/ }).first().click();
  await page.getByRole("button", { name: "Lancer la partie" }).click();
  await page.waitForURL(/\/arena\/|trop=1/, { timeout: 60_000 });
  if (page.url().includes("trop=1")) {
    throw new Error("Plafond de parties par heure atteint sur cette base : base neuve.");
  }
  await page.waitForLoadState("networkidle");
  await page.locator("[data-ecran-de-jeu]").waitFor({ state: "visible" });
}

describe("la vitrine", () => {
  it("sur ordinateur, les lieux sont à droite du titre, légendés, et le reste attend l'écran", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await aller(page, "/");
    const m = await page.evaluate(() => {
      const compo = document.querySelector("[data-composition-des-lieux]")!;
      const r = compo.getBoundingClientRect();
      const imgs = [...compo.querySelectorAll("img")];
      return {
        bas: r.bottom,
        photos: imgs.length,
        legendes: [...compo.querySelectorAll("figcaption")].map((f) => (f as HTMLElement).innerText.trim()),
        cachees: imgs.every((i) => i.getAttribute("aria-hidden") === "true" && i.alt === ""),
        chargees: imgs.every((i) => i.complete && i.naturalWidth > 0),
        differees: [...document.querySelectorAll("[data-lieu-de-la-vitrine] img")].map((i) =>
          i.getAttribute("loading"),
        ),
        hero: document.querySelector("main section")!.getBoundingClientRect().height,
      };
    });
    expect(m.photos).toBeGreaterThanOrEqual(3);
    expect(m.photos).toBeLessThanOrEqual(4);
    expect(m.cachees, "une photo de la composition n'est pas décorative").toBe(true);
    expect(m.chargees, "une photo du héros n'est pas chargée").toBe(true);
    for (const l of m.legendes) expect(l, "légende sans nom ni métier").toMatch(/\S+\n?\S+/);
    expect(m.bas, "la composition déborde du premier écran").toBeLessThanOrEqual(800);
    // Le héros garde une hauteur raisonnable : pas de plein écran.
    expect(m.hero).toBeLessThan(800);
    expect(m.differees).toHaveLength(9);
    expect(new Set(m.differees)).toEqual(new Set(["lazy"]));
    await ctx.close();
  }, 60_000);

  it("sur téléphone, « Commencer une partie » reste dans le premier écran, et la bande défile seule", async () => {
    const ctx = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    const page = await ctx.newPage();
    await aller(page, "/");
    const bouton = (await page.getByRole("link", { name: "Commencer une partie" }).first().boundingBox())!;
    expect(bouton.y + bouton.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    const bande = page.locator("[data-bande-des-lieux]");
    await bande.scrollIntoViewIfNeeded();
    const m = await bande.evaluate((b) => ({
      defile: b.scrollWidth > b.clientWidth,
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      accroche: getComputedStyle(b).scrollSnapType,
      barre: getComputedStyle(b).scrollbarWidth,
    }));
    expect(m.defile, "la bande ne défile pas").toBe(true);
    expect(m.page, "la page défile de côté").toBeLessThanOrEqual(0);
    expect(m.accroche).toContain("x");
    expect(m.barre).toBe("none");
    await ctx.close();
  }, 60_000);
});

describe("choisir son entreprise", () => {
  it("neuf cartes photo ; la carte choisie se coche ; un seul lancement, collé au bas de l'écran", async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await aller(page, "/jouer");
    const cartes = page.locator("[data-carte-entreprise]");
    expect(await cartes.count()).toBe(9);
    expect(await page.locator("[data-carte-entreprise] img[data-lieu-photo]").count()).toBe(9);
    await page.getByRole("button", { name: /ESCALE/ }).first().click();
    const escale = page.locator('[data-carte-entreprise="hotel"]');
    expect(await escale.getAttribute("aria-pressed")).toBe("true");
    expect(await escale.locator("[data-coche]").count()).toBe(1);
    expect(await page.locator('[data-carte-entreprise="nova"]').getAttribute("aria-pressed")).toBe("false");
    // Au clavier : la carte suivante se choisit par Entrée.
    await page.locator('[data-carte-entreprise="bistrot"]').focus();
    await page.keyboard.press("Enter");
    expect(await page.locator('[data-carte-entreprise="bistrot"]').getAttribute("aria-pressed")).toBe("true");
    // Le résumé dit ce qu'on lance, et porte LE bouton, en bas de l'écran.
    const resume = page.locator("[data-resume-de-lancement]");
    expect(await resume.innerText()).toContain("LA TABLE D'AUGUSTIN · Niveau 3");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const boite = (await resume.boundingBox())!;
    expect(Math.round(boite.y + boite.height), "le résumé n'est pas collé au bas de l'écran").toBeLessThanOrEqual(800);
    expect(boite.y + boite.height).toBeGreaterThan(780);
    const lancements = await page.getByRole("button", { name: "Lancer la partie" }).count();
    expect(lancements, "plus d'un bouton de lancement").toBe(1);
    await ctx.close();
  }, 60_000);
});

describe("l'ouverture de la partie, au tour 1", () => {
  let page: Page;

  beforeAll(async () => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });
    page = await ctx.newPage();
    await lancer(page, /NOVA/);
  }, 120_000);

  it("le lieu ouvre l'écran, au-dessus de la bande de marché ; plus d'ardoise vide ; une seule photo", async () => {
    const m = await page.evaluate(() => {
      const ouverture = document.querySelector("[data-ouverture-de-la-partie]");
      const marche = document.querySelector('section[aria-label="Le marché ce tour"]');
      const photos = [...document.querySelectorAll("main [data-lieu-photo]")].filter((p) => {
        const r = p.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return {
        ouverture: ouverture ? (ouverture as HTMLElement).innerText : null,
        haut: ouverture?.getBoundingClientRect().top ?? null,
        avantLeMarche: ouverture && marche ? ouverture.compareDocumentPosition(marche) & 4 : null,
        ardoise: document.getElementById("ardoise-du-dirigeant") !== null,
        vide: document.body.innerText.includes("s'afficheront ici"),
        photos: photos.length,
      };
    });
    expect(m.ouverture, "pas d'ouverture au tour 1").not.toBeNull();
    expect(m.ouverture).toContain("NOVA");
    expect(m.ouverture).toContain("Industrie");
    expect(m.ouverture).toMatch(/Tour 1 \/ 6/);
    expect(m.haut!, "l'ouverture n'est pas en tête").toBeLessThan(120);
    if (m.avantLeMarche !== null) expect(m.avantLeMarche).toBeTruthy();
    expect(m.ardoise, "l'ardoise vide est revenue au tour 1").toBe(false);
    expect(m.vide).toBe(false);
    expect(m.photos, "plus d'une photo à l'écran au tour 1").toBe(1);
  });

  it("le texte posé sur la photo tient 4,5:1 sur sa zone la plus claire, pour les neuf lieux", async () => {
    const fautes: string[] = [];
    for (const code of Object.keys(PHOTOS_DES_ENTREPRISES)) {
      await poserLaPhoto(page, "[data-ouverture-de-la-partie]", code, false);
      for (const l of await contrastesSurPhoto(page, "[data-ouverture-de-la-partie]")) {
        if (l.rapport < 4.5) fautes.push(`${code} « ${l.texte} » : ${l.rapport}`);
      }
    }
    expect(fautes, fautes.join("\n")).toEqual([]);
  }, 120_000);
});

describe("l'ouverture sur téléphone : le lieu ouvre le briefing", () => {
  let page: Page;

  beforeAll(async () => {
    const ctx = await navigateur.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    page = await ctx.newPage();
    await lancer(page, /ESCALE/);
  }, 120_000);

  it("la première carte est le lieu, en plein cadre, nom posé dessus ; l'entreprise et le tour une seule fois", async () => {
    const m = await page.evaluate(() => {
      const carte = document.querySelector('[data-ouverture-de-la-partie="carte"]');
      const r = carte?.getBoundingClientRect();
      const visibles = [...document.querySelectorAll("body *")].filter((e) => {
        const b = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return (
          b.width > 0 &&
          b.height > 0 &&
          b.top < innerHeight &&
          b.bottom > 0 &&
          s.visibility !== "hidden" &&
          Number(s.opacity) > 0 &&
          !e.closest("[aria-hidden='true'], .sr-only")
        );
      });
      const lignesDuTour = visibles.filter((e) =>
        [...e.childNodes].some((n) => n.nodeType === 3 && /Tour\s*1\s*\/\s*6/.test(n.textContent ?? "")),
      );
      return {
        largeur: r ? Math.round(r.width) : 0,
        // Plein cadre : la photo va d'un bord à l'autre de sa carte (filet compris exclu).
        cadre: carte?.closest(".carte")?.clientWidth ?? 0,
        haut: r ? Math.round(r.top) : null,
        hauteur: r ? Math.round(r.height) : 0,
        nom: carte ? (carte.querySelector("h2") as HTMLElement)?.innerText : null,
        lignesDuTour: lignesDuTour.length,
      };
    });
    expect(m.nom).toBe("L'ESCALE");
    expect(m.cadre, "la carte du lieu est introuvable").toBeGreaterThan(300);
    expect(m.largeur, "le lieu ne va pas d'un bord à l'autre de sa carte").toBeGreaterThanOrEqual(m.cadre);
    expect(m.hauteur).toBeGreaterThan(380);
    expect(m.haut!, "le lieu n'ouvre pas le briefing").toBeLessThan(140);
    expect(m.lignesDuTour, "« Tour 1/6 » redit sous la barre").toBeLessThanOrEqual(1);
  });

  it("sur la carte du téléphone aussi, le texte tient 4,5:1 sur les neuf lieux", async () => {
    const fautes: string[] = [];
    for (const code of Object.keys(PHOTOS_DES_ENTREPRISES)) {
      await poserLaPhoto(page, '[data-ouverture-de-la-partie="carte"]', code, true);
      for (const l of await contrastesSurPhoto(page, '[data-ouverture-de-la-partie="carte"]')) {
        if (l.rapport < 4.5) fautes.push(`${code} « ${l.texte} » : ${l.rapport}`);
      }
    }
    expect(fautes, fautes.join("\n")).toEqual([]);
  }, 120_000);
});

