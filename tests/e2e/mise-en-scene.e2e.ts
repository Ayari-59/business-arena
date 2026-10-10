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
 *
 * LOT P6 « NEUF LIEUX QUI PARLENT » : le nom et le métier sont posés SUR les
 * photos de /jouer et de la vitrine ; la même mesure passe sur chacune des
 * neuf tuiles réelles (chaque tuile a sa photo), à 390 et à 1280. /jouer
 * revient au 3 × 3 sur téléphone (mesuré : les neuf dans le premier écran
 * après le titre de la carte), la vitrine pose ses lieux en 3 × 3 sous deux
 * boutons alignés, et les trois écrans d'un tour reviennent en carrousel.
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
      "[data-texte-sur-photo] * { color: transparent !important; text-shadow: none !important; } [data-texte-sur-photo] svg, [data-texte-sur-photo] [class*='pastille'], [data-texte-sur-photo] [class*='marche'], [data-texte-sur-photo] a, [data-texte-sur-photo] [role], [data-texte-sur-photo] [aria-hidden='true'] { visibility: hidden !important; } body > header, [data-en-tete-du-site], [data-barre-collante], [data-ardoise-repliee], [data-resume-de-lancement], [data-barre-action] { opacity: 0 !important; }",
  });
  const png = (await cadre.screenshot({ animations: "disabled" })).toString("base64");
  await masque.evaluate((e) => (e as HTMLElement).remove());
  const largeurDuBloc = await cadre.evaluate((r) => r.getBoundingClientRect().width);
  const clairs: number[][] = await page.evaluate(
    async ({ png, lignes, largeurDuBloc }) => {
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
      // LOT P6 : la capture est en pixels de l'APPAREIL (3 par pixel CSS sur
      // un iPhone 13), les boîtes en pixels CSS : on les met à la même
      // échelle, sans quoi la mesure lisait le tiers haut-gauche du bloc.
      const k = image.width / largeurDuBloc;
      return lignes.map((l) => {
        const x0 = Math.max(0, Math.floor(l.x * k));
        const y0 = Math.max(0, Math.floor(l.y * k));
        const w = Math.max(1, Math.min(image.width - x0, Math.ceil(l.l * k)));
        const h = Math.max(1, Math.min(image.height - y0, Math.ceil(l.h * k)));
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
    { png, lignes, largeurDuBloc },
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
        // Lot P6 : le nom et le métier sont posés sur la photo.
        legendes: [...compo.querySelectorAll("[data-texte-sur-photo]")].map((f) => (f as HTMLElement).innerText.trim()),
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

  for (const [largeur, hauteur] of [
    [390, 844],
    [360, 740],
  ] as const) {
    it(`à ${largeur} × ${hauteur}, « Tester le simulateur » reste dans le premier écran, aligné sur l'autre bouton ; les lieux en 3 × 3`, async () => {
      const ctx = await navigateur.newContext({
        ...devices["iPhone 13"],
        viewport: { width: largeur, height: hauteur },
        locale: "fr-FR",
      });
      const page = await ctx.newPage();
      await aller(page, "/");
      const essai = page.getByRole("link", { name: "Tester le simulateur" }).first();
      expect(await essai.getAttribute("href")).toBe("/jouer");
      const a = (await essai.boundingBox())!;
      expect(a.y + a.height, "le bouton du héros sort du premier écran").toBeLessThanOrEqual(hauteur);
      // LOT P6 : les deux boutons du héros, mêmes bords et même hauteur.
      const b = (await page.getByRole("link", { name: "Je suis enseignant" }).first().boundingBox())!;
      expect(Math.abs(a.x - b.x), "bords gauches").toBeLessThanOrEqual(1);
      expect(Math.abs(a.x + a.width - (b.x + b.width)), "bords droits").toBeLessThanOrEqual(1);
      expect(Math.abs(a.height - b.height), "hauteurs").toBeLessThanOrEqual(1);
      // La ligne sous les boutons ne promet plus la gratuité, et mène à l'offre.
      const licence = page.getByRole("link", { name: "licence établissement" });
      expect(await licence.getAttribute("href")).toBe("/rendez-vous");
      expect(await page.locator("main").innerText()).not.toContain("Sans compte, sans installation");
      // Les neuf lieux, en 3 × 3 sous les boutons, sans défilement de côté.
      const grille = page.locator("[data-grille-des-lieux]");
      await grille.scrollIntoViewIfNeeded();
      const m = await grille.evaluate((g) => {
        const tuiles = [...g.querySelectorAll("li")].map((li) => li.getBoundingClientRect());
        const colonnes = new Set(tuiles.map((r) => Math.round(r.left))).size;
        const rangees = new Set(tuiles.map((r) => Math.round(r.top))).size;
        return {
          tuiles: tuiles.length,
          colonnes,
          rangees,
          apresLeBouton: g.compareDocumentPosition(document.querySelector("[data-cta-principal]")!) & 2,
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      expect(m.tuiles).toBe(9);
      expect(m.colonnes).toBe(3);
      expect(m.rangees).toBe(3);
      expect(m.apresLeBouton, "la grille ne vient pas après les boutons").toBeTruthy();
      expect(m.page, "la page défile de côté").toBeLessThanOrEqual(0);
      await ctx.close();
    }, 60_000);
  }

  it("sur téléphone, les trois écrans d'un tour en carrousel : un à la fois, en entier, et le geste se voit", async () => {
    const ctx = await navigateur.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" });
    const page = await ctx.newPage();
    await aller(page, "/");
    const cadre = page.locator("[data-carrousel-des-ecrans]");
    await cadre.scrollIntoViewIfNeeded();
    const mesure = () =>
      cadre.evaluate((c) => {
        const r = c.getBoundingClientRect();
        const ecrans = [...c.children].map((e) => e.getBoundingClientRect());
        // Ce qu'on voit de chaque écran, dans le cadre.
        const vus = ecrans.map((e) => Math.max(0, Math.min(e.right, r.right) - Math.max(e.left, r.left)));
        const capture = c.querySelector(".capture-decran") as HTMLElement;
        const s = getComputedStyle(capture);
        return {
          ecrans: ecrans.length,
          largeurs: ecrans.map((e) => Math.round(e.width)),
          cadre: Math.round(r.width),
          vus: vus.map(Math.round),
          accroche: getComputedStyle(c).scrollSnapType,
          barre: getComputedStyle(c).scrollbarWidth,
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          position: (document.querySelector("[data-position-du-carrousel]") as HTMLElement).innerText.trim(),
          points: document.querySelectorAll("[data-point-du-carrousel]").length,
          zoom: s.backgroundSize,
          forme: capture.getBoundingClientRect().height / capture.getBoundingClientRect().width,
          largeurCapture: capture.getBoundingClientRect().width,
          titres: [...c.children].map((e) => (e.querySelector("p") as HTMLElement).innerText.trim()),
        };
      });
    const m = await mesure();
    expect(m.ecrans).toBe(3);
    expect(m.titres).toEqual(["L'arène", "La décision", "Le verdict"]);
    expect(m.accroche).toContain("x");
    expect(m.accroche).toContain("mandatory");
    expect(m.barre).toBe("none");
    expect(m.page, "la page défile de côté").toBeLessThanOrEqual(0);
    // Un écran à la fois, en entier : le premier occupe tout le cadre, et
    // AUCUN pixel du suivant n'y paraît.
    for (const l of m.largeurs) expect(l).toBe(m.cadre);
    expect(m.vus).toEqual([m.cadre, 0, 0]);
    // Le geste se voit : « 1 / 3 », trois points, deux flèches de 44 px.
    expect(m.position).toBe("1 / 3");
    expect(m.points).toBe(3);
    const precedent = page.getByRole("button", { name: "Écran précédent" });
    const suivant = page.getByRole("button", { name: "Écran suivant" });
    expect(await precedent.isDisabled()).toBe(true);
    expect(await suivant.isEnabled()).toBe(true);
    for (const f of [precedent, suivant]) {
      const r = (await f.boundingBox())!;
      expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(44);
    }
    // Le texte des captures se lit : recadrée, agrandie de 10 %, en 4:5. Son
    // plus petit texte (24 px dans le fichier de 800) paraît à ≥ 9 px.
    expect(m.zoom).toMatch(/^110%( auto)?$/);
    expect(m.forme).toBeCloseTo(1.25, 2);
    expect((24 * m.largeurCapture * 1.1) / 800, "texte des captures sous 9 px").toBeGreaterThanOrEqual(9);
    // Écran suivant : le deuxième, seul et entier ; puis le dernier éteint la flèche.
    await suivant.click();
    await page.waitForFunction(
      () => (document.querySelector("[data-position-du-carrousel]") as HTMLElement).innerText.trim() === "2 / 3",
    );
    await page.waitForTimeout(700);
    const m2 = await mesure();
    expect(m2.vus).toEqual([0, m2.cadre, 0]);
    expect(await precedent.isEnabled()).toBe(true);
    await suivant.click();
    await page.waitForTimeout(700);
    expect((await mesure()).vus).toEqual([0, 0, m.cadre]);
    expect(await suivant.isDisabled()).toBe(true);
    // Au clavier : le cadre prend le focus et défile aux flèches.
    await cadre.focus();
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(700);
    expect((await mesure()).position).toBe("2 / 3");
    await ctx.close();
  }, 60_000);

  for (const [nom, largeur, bloc] of [
    ["les neuf lieux du téléphone", 390, "[data-grille-des-lieux]"],
    ["la composition des lieux", 1280, "[data-composition-des-lieux]"],
    ["les neuf métiers, plus bas", 1280, "[data-lieu-de-la-vitrine]"],
  ] as const) {
    it(`${nom} (${largeur}) : le nom posé sur chaque photo tient 4,5:1 sur sa zone la plus claire`, async () => {
      const ctx = await navigateur.newContext(
        largeur === 390
          ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" }
          : { viewport: { width: 1280, height: 800 }, locale: "fr-FR" },
      );
      const page = await ctx.newPage();
      await aller(page, "/");
      const fautes: string[] = [];
      const codes = await page.locator(`${bloc} [data-tuile-du-lieu]`).evaluateAll((t) =>
        t.map((e) => e.getAttribute("data-tuile-du-lieu")!),
      );
      expect(codes.length).toBeGreaterThanOrEqual(nom.startsWith("la composition") ? 3 : 9);
      for (const code of codes) {
        const tuile = `${bloc} [data-tuile-du-lieu="${code}"]`;
        await page.locator(`${tuile} img`).scrollIntoViewIfNeeded();
        await page.waitForFunction((sel) => {
          const i = document.querySelector(sel) as HTMLImageElement | null;
          return !!i && i.complete && i.naturalWidth > 0;
        }, `${tuile} img`);
        for (const l of await contrastesSurPhoto(page, tuile)) {
          if (l.rapport < 4.5) fautes.push(`${code} « ${l.texte} » : ${l.rapport}`);
        }
      }
      expect(fautes, fautes.join("\n")).toEqual([]);
      await ctx.close();
    }, 120_000);
  }
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

  for (const [largeur, hauteur] of [
    [390, 844],
    [360, 740],
  ] as const) {
    it(`à ${largeur} px, le 3 × 3 revient : les neuf tuiles dans le premier écran après le titre de la carte, noms entiers`, async () => {
      const ctx = await navigateur.newContext({
        ...devices["iPhone 13"],
        viewport: { width: largeur, height: hauteur },
        locale: "fr-FR",
      });
      const page = await ctx.newPage();
      await aller(page, "/jouer");
      await page.getByRole("button", { name: /VOLT/ }).first().click();
      // Le titre de la carte en haut de l'écran.
      await page.locator("form h2").first().evaluate((h) => window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 4));
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const titre = document.querySelector("form h2")!.getBoundingClientRect();
        const cartes = [...document.querySelectorAll("[data-carte-entreprise]")].map((c) => c.getBoundingClientRect());
        const resume = document.querySelector("[data-resume-de-lancement]")!.getBoundingClientRect();
        const noms = [...document.querySelectorAll("[data-carte-entreprise] [data-texte-sur-photo]")].map((t) => {
          const nom = t.children[1] as HTMLElement;
          const tuile = t.closest("[data-tuile-du-lieu]")!.getBoundingClientRect();
          const r = t.getBoundingClientRect();
          const ligne = parseFloat(getComputedStyle(nom).lineHeight);
          return {
            texte: nom.innerText,
            deborde: nom.scrollWidth > nom.clientWidth + 0.5,
            lignes: Math.round(nom.getBoundingClientRect().height / ligne),
            dedans: r.top >= tuile.top - 0.5 && r.bottom <= tuile.bottom + 0.5,
            taille: parseFloat(getComputedStyle(nom).fontSize),
          };
        });
        return {
          titre: titre.top,
          colonnes: new Set(cartes.map((c) => Math.round(c.left))).size,
          bas: Math.max(...cartes.map((c) => c.bottom)),
          plusPetite: Math.min(...cartes.map((c) => Math.min(c.width, c.height))),
          resume: resume.top,
          noms,
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      expect(m.colonnes, "pas trois colonnes").toBe(3);
      expect(m.titre).toBeLessThan(20);
      expect(m.bas, `les neuf tuiles ne tiennent pas dans le premier écran (${m.bas} > ${m.resume})`).toBeLessThanOrEqual(m.resume);
      expect(m.plusPetite, "cible sous 44 px").toBeGreaterThanOrEqual(44);
      expect(m.page).toBeLessThanOrEqual(0);
      for (const n of m.noms) {
        expect(n.deborde, `${n.texte} déborde`).toBe(false);
        expect(n.lignes, `${n.texte} sur ${n.lignes} lignes`).toBeLessThanOrEqual(2);
        expect(n.dedans, `${n.texte} sort de sa tuile`).toBe(true);
        expect(n.taille).toBeGreaterThanOrEqual(12);
      }
      // La tuile choisie : filet orange plein et coche, sur la photo.
      const volt = page.locator('[data-carte-entreprise="fitness"]');
      expect(await volt.getAttribute("aria-pressed")).toBe("true");
      expect(await volt.locator("[data-coche]").isVisible()).toBe(true);
      await ctx.close();
    }, 60_000);
  }

  for (const largeur of [390, 1280] as const) {
    it(`à ${largeur} px, le nom posé sur chacune des neuf photos tient 4,5:1 sur sa zone la plus claire`, async () => {
      const ctx = await navigateur.newContext(
        largeur === 390
          ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, locale: "fr-FR" }
          : { viewport: { width: 1280, height: 800 }, locale: "fr-FR" },
      );
      const page = await ctx.newPage();
      await aller(page, "/jouer");
      const fautes: string[] = [];
      for (const code of Object.keys(PHOTOS_DES_ENTREPRISES)) {
        const tuile = `[data-carte-entreprise] [data-tuile-du-lieu="${code}"]`;
        await page.locator(`${tuile} img`).scrollIntoViewIfNeeded();
        await page.waitForFunction((sel) => {
          const i = document.querySelector(sel) as HTMLImageElement | null;
          return !!i && i.complete && i.naturalWidth > 0;
        }, `${tuile} img`);
        for (const l of await contrastesSurPhoto(page, tuile)) {
          if (l.rapport < 4.5) fautes.push(`${code} « ${l.texte} » : ${l.rapport}`);
        }
      }
      expect(fautes, fautes.join("\n")).toEqual([]);
      await ctx.close();
    }, 120_000);
  }
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
        // Lot P3 : la carte « Votre entreprise » est un panneau d'information.
        cadre: carte?.closest(".panneau-info")?.clientWidth ?? 0,
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

