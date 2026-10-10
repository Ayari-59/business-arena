import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";

/**
 * LE HALO ÉCLAIRE LE TITRE, IL NE LE VOILE PAS.
 *
 * Le disque de laiton posé derrière les en-têtes se peignait en réalité
 * par-dessus le texte : sur « Pour les enseignants », le titre passait de
 * 19,3:1 à 8,1:1 de contraste, et ses mots n'avaient pas la même couleur.
 * La mesure de contraste du dépôt ne pouvait pas le voir : elle lit les fonds
 * empilés SOUS un texte, pas ce qui est peint dessus.
 *
 * On mesure donc le rendu lui-même : l'encre la plus sombre du titre, sur une
 * capture, avec le halo puis sans lui. Si le halo est bien derrière, l'encre
 * ne bouge pas.
 */

/*
 * GARDE DÉPLACÉE (lot P5). Elle mesurait l'encre du titre avec et sans
 * l'anneau sur cinq en-têtes, dont /jouer, /enseignants et /entreprises. Le
 * propriétaire a retiré l'anneau de /jouer, comme de la vitrine au lot P2, et
 * il est parti avec lui des ouvertures marines (enseignants, écoles,
 * entreprises) : c'est le même composant. La garde vérifie donc d'abord
 * qu'AUCUN en-tête de page publique ne le porte (ni lui, ni un anneau redessiné
 * à la main), et garde sa mesure d'encre sur les pages qui posent encore le
 * composant (le papier le masque) : rien ne doit se peindre sur un titre.
 */
const PAGES = ["/animations", "/entreprises/episode"];

/** Les pages publiques à en-tête : aucune ne porte l'anneau décoratif. */
const EN_TETES_PUBLICS = [
  "/",
  "/jouer",
  "/enseignants",
  "/ecoles",
  "/entreprises",
  "/animations",
  "/fonctionnalites",
  "/entreprises/episode",
  "/enseignants/episodes",
];

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

/** La clarté relative (0 noir, 1 blanc) de l'encre d'un titre, lue sur sa capture. */
async function encreDuTitre(page: Page, theme: string): Promise<number> {
  const titre = page.locator("main h1").first();
  const png = (await titre.screenshot()).toString("base64");
  return page.evaluate(
    async ({ png, sombre }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const toile = document.createElement("canvas");
      toile.width = image.width;
      toile.height = image.height;
      const ctx = toile.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const { data } = ctx.getImageData(0, 0, image.width, image.height);
      const lin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      const clartes: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        clartes.push(
          0.2126 * lin(data[i]!) + 0.7152 * lin(data[i + 1]!) + 0.0722 * lin(data[i + 2]!),
        );
      }
      clartes.sort((a, b) => a - b);
      // L'encre : les pixels les plus foncés en thème clair, les plus clairs en thème sombre.
      return sombre
        ? clartes[Math.floor(clartes.length * 0.98)]!
        : clartes[Math.floor(clartes.length * 0.02)]!;
    },
    { png, sombre: theme === "sombre" },
  );
}

/** Le rapport de contraste WCAG de deux couleurs `rgb(r, g, b)` opaques. */
function rapport(a: string, b: string): number {
  const lum = (rgb: string) => {
    const [r, g, bl] = (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((v) => {
      const c = Number(v) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe("le héros de la vitrine : les lieux à la place de l'anneau (lot P2)", () => {
  /*
   * GARDE DÉPLACÉE. Elle vérifiait que l'anneau du coin haut droit se voyait
   * sur le marine du héros, et que le titre gardait son contraste là où
   * l'anneau passait dessous. Lot P2 : l'audit tenait cet anneau coupé pour
   * « un ornement sans rôle » ; il est retiré de la vitrine, et la
   * composition des lieux prend sa place. La garde vérifie donc qu'il n'y
   * revient pas, que les lieux sont là, à droite du titre et sans le
   * recouvrir, et que chaque ligne du titre tient son contraste sur le sol
   * réel du héros (seuil des grands titres, 3:1 ; l'orange de la seconde
   * ligne, exception nommée, y tient 6,5:1).
   */
  it("plus d'anneau ; la composition à droite du titre ; le titre lisible sur le marine", async () => {
    const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await contexte.newPage();
    await aller(page, "/");
    const mesure = await page.evaluate(() => {
      const titre = document.querySelector("main h1");
      const lieux = document.querySelector("[data-composition-des-lieux]");
      if (!titre || !lieux) return null;
      // Le sol du héros : le premier fond opaque sous le titre.
      let sol = "rgb(0, 0, 0)";
      for (let e: Element | null = titre; e; e = e.parentElement) {
        const c = getComputedStyle(e).backgroundColor;
        if (c && !/rgba\(.*,\s*0\)$/.test(c) && c !== "transparent") {
          sol = c;
          break;
        }
      }
      const r = titre.getBoundingClientRect();
      const l = lieux.getBoundingClientRect();
      return {
        anneaux: document.querySelectorAll("main section:first-of-type .halo-de-page").length,
        lieuxVisibles: getComputedStyle(lieux).display !== "none" && l.width > 200,
        aDroite: l.left >= r.left + 200,
        dansLaPremiereFenetre: l.top < innerHeight,
        sol,
        lignes: [titre, ...titre.querySelectorAll("span")].map((e) => getComputedStyle(e).color),
      };
    });
    expect(mesure, "l'accueil n'a plus de titre ou de composition des lieux").not.toBeNull();
    expect(mesure!.anneaux, "l'anneau décoratif est revenu dans le héros").toBe(0);
    expect(mesure!.lieuxVisibles, "la composition des lieux ne se voit pas à 1280").toBe(true);
    expect(mesure!.aDroite, "la composition n'est pas à droite du titre").toBe(true);
    expect(mesure!.dansLaPremiereFenetre).toBe(true);
    // Le titre et la composition ne se chevauchent pas : le titre reste lu
    // d'abord, en entier.
    const boite = await page.locator("main h1").boundingBox();
    const lieux = await page.locator("[data-composition-des-lieux]").boundingBox();
    expect(boite!.x + boite!.width, "le titre passe sous les photos").toBeLessThanOrEqual(lieux!.x);
    for (const couleur of mesure!.lignes) {
      expect(rapport(couleur, mesure!.sol), `${couleur} sur ${mesure!.sol}`).toBeGreaterThanOrEqual(3);
    }
    await contexte.close();
  }, 60_000);
});

describe("aucun en-tête de page publique ne porte l'anneau décoratif (lot P5)", () => {
  for (const chemin of EN_TETES_PUBLICS) {
    for (const largeur of [1280, 390]) {
      it(`${chemin}, à ${largeur} px : ni l'anneau, ni un anneau redessiné`, async () => {
        const contexte = await navigateur.newContext({ viewport: { width: largeur, height: 800 } });
        const page = await contexte.newPage();
        await aller(page, chemin);
        const m = await page.evaluate(() => {
          const peint = (e: Element) => {
            const s = getComputedStyle(e);
            const r = e.getBoundingClientRect();
            return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
          };
          // L'anneau du composant, s'il se peint encore quelque part.
          const anneaux = [...document.querySelectorAll(".halo-de-page")].filter(peint).length;
          // Un anneau redessiné à la main : un grand cercle décoratif (rayon
          // plein, bordure ou fond peint, hors du flux) dans le premier écran.
          const cercles = [...document.querySelectorAll<HTMLElement>("main *")]
            .filter((e) => {
              if (!peint(e)) return false;
              const s = getComputedStyle(e);
              const r = e.getBoundingClientRect();
              if (s.position !== "absolute" && s.position !== "fixed") return false;
              if (r.width < 160 || Math.abs(r.width - r.height) > 2 || r.top > innerHeight) return false;
              if (!/(50%|9999px)/.test(s.borderTopLeftRadius) && parseFloat(s.borderTopLeftRadius) < r.width / 2 - 1)
                return false;
              const bord = parseFloat(s.borderTopWidth) > 0 && !/rgba\(.*,\s*0\)$/.test(s.borderTopColor);
              return bord && e.closest("[aria-hidden='true']") !== null;
            })
            .map((e) => e.className.toString().slice(0, 60));
          return { anneaux, cercles };
        });
        expect(m.anneaux, `${chemin} porte encore l'anneau décoratif`).toBe(0);
        expect(m.cercles, `${chemin} : anneau redessiné`).toEqual([]);
        await contexte.close();
      }, 60_000);
    }
  }
});

describe("le halo des en-têtes", () => {
  // Le site n'a plus qu'un habillage, le papier : le thème sombre, où l'encre
  // était la plus claire de l'image, n'existe plus.
  for (const theme of ["clair"]) {
    for (const chemin of PAGES) {
      it(`laisse son encre au titre de ${chemin}, thème ${theme}`, async () => {
        const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 800 } });
        await contexte.addInitScript((t) => {
          try {
            localStorage.setItem("arena-theme", t);
          } catch {
            /* rien */
          }
        }, theme);
        const page = await contexte.newPage();
        await aller(page, chemin);
        expect(await page.locator(".halo-de-page").count(), "la page a un halo").toBe(1);
        const avec = await encreDuTitre(page, theme);
        await page.addStyleTag({ content: ".halo-de-page { display: none !important; }" });
        const sans = await encreDuTitre(page, theme);
        expect(Math.abs(avec - sans), `encre ${avec} avec le halo, ${sans} sans`).toBeLessThan(
          0.005,
        );
        await contexte.close();
      }, 60_000);
    }
  }
});
