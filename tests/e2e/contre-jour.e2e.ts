import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * ENTRE DEUX TABLEAUX, IL Y A TOUJOURS DU PAPIER.
 *
 * Cette garde exigeait une fenêtre entière de papier entre deux blocs à
 * contre-jour : tant que le contre-jour était un éclat de nuit au milieu de la
 * page, deux éclats visibles ensemble s'annulaient. Devenu le tableau, une
 * matière à part entière, encastrée et encadrée de bois, il peut rythmer la
 * page — le plafond de deux par page est tombé avec lui.
 *
 * Ce qui reste vrai se mesure ici, sur la page réellement rendue : deux
 * tableaux ne se touchent jamais. Côte à côte, ils fusionneraient en une seule
 * ardoise et la coupure disparaîtrait. Le registre le refuse déjà sur l'ordre
 * des bandes ; le navigateur vérifie qu'une vraie section de papier les sépare,
 * pas un filet.
 */
const ENTRE_DEUX = 160;
const PAGES = ["/", "/entreprises", "/fonctionnalites", "/parcours", "/guide", "/enseignants"];
const HAUTEUR = 1000;

let navigateur: Browser;
let page: Page;
const releves = new Map<string, { haut: number; bas: number }[]>();

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage({ viewport: { width: 1280, height: HAUTEUR } });
  for (const chemin of PAGES) {
    await aller(page, chemin);
    // Les images sous la ligne de flottaison se chargent au défilement, et
    // une image absente est une section trop courte : on descend la page
    // avant de mesurer, sinon les hauteurs relevées sont fausses.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    releves.set(
      chemin,
      await page.evaluate(() =>
        [...document.querySelectorAll(".contre-jour")].map((e) => {
          const r = e.getBoundingClientRect();
          return { haut: Math.round(r.top + window.scrollY), bas: Math.round(r.bottom + window.scrollY) };
        }),
      ),
    );
  }
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("les blocs à contre-jour", () => {
  it("chaque page publique en porte au moins un", () => {
    // Une page publique sans coupure est une page qui déroule d'un seul tenant
    // du haut jusqu'au pied. Toutes en ont au moins une : la bande finale.
    for (const chemin of PAGES) {
      expect(releves.get(chemin)!.length, `${chemin} n'a aucune coupure`).toBeGreaterThan(0);
    }
  });

  it("ne se touchent jamais : une section de papier les sépare", () => {
    const fautes: string[] = [];
    for (const [chemin, blocs] of releves) {
      const ordonnes = [...blocs].sort((a, b) => a.haut - b.haut);
      for (let i = 1; i < ordonnes.length; i += 1) {
        const ecart = ordonnes[i]!.haut - ordonnes[i - 1]!.bas;
        if (ecart < ENTRE_DEUX) {
          fautes.push(`${chemin} : ${ecart} px de papier entre deux tableaux, il en faut ${ENTRE_DEUX}`);
        }
      }
    }
    expect(fautes, fautes.join(" · ")).toEqual([]);
  });

  it("aucune coupure ne traverse le premier écran", async () => {
    // LA RÈGLE DISAIT « après 400 px », et sa raison était : une coupure posée
    // dans le premier écran se bat avec le titre et le bouton d'action, qui
    // sont ce que la page a de plus important à montrer.
    //
    // Elle ne vaut que pour une bande qui ARRIVE dans le premier écran. Le
    // jour où le premier écran lui-même passe à contre-jour, il n'y a plus de
    // bataille : la coupure ne se bat pas avec le titre, elle le PORTE. Ce
    // qu'il faut interdire, c'est la bande qui coupe le haut de page en deux,
    // pas le haut de page qui est une bande.
    //
    // D'où les deux cas admis, et un seul refusé : commencer tout en haut en
    // portant le titre, ou commencer après le premier écran. Entre les deux,
    // rien.
    for (const [chemin, blocs] of releves) {
      const premiere = [...blocs].sort((a, b) => a.haut - b.haut)[0]!;
      if (premiere.haut <= 400) {
        await aller(page, chemin);
        const porteLeTitre = await page.evaluate(
          () => document.querySelector(".contre-jour")?.querySelector("h1") != null,
        );
        expect(
          porteLeTitre,
          `${chemin} : une coupure à ${premiere.haut} px qui ne porte pas le titre`,
        ).toBe(true);
        // Et un haut de page à contre-jour couvre bien le premier écran, au
        // lieu de s'arrêter au milieu : c'est la même exigence, dans l'autre
        // sens.
        expect(premiere.bas, `${chemin} : le haut de page s'arrête à ${premiere.bas} px`).toBeGreaterThan(400);
      }
    }
  });

  it("le site sert bien la page attendue", () => {
    // Un relevé vide passerait toutes les règles ci-dessus sans rien prouver.
    expect(BASE).toMatch(/^https?:\/\//);
    expect([...releves.keys()].sort()).toEqual([...PAGES].sort());
  });
});
