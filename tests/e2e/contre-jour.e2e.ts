import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, BASE, ouvrirNavigateur } from "./helpers/browser";

/**
 * DEUX BLOCS À CONTRE-JOUR NE SE RENCONTRENT JAMAIS DANS UNE MÊME FENÊTRE.
 *
 * Le contraste attire l'œil parce qu'il est unique sur l'ÉCRAN. Deux bandes
 * visibles ensemble n'en font pas deux qui se voient : elles en font deux qui
 * s'annulent, et la page a changé de rayures. C'est la règle qui se perdra la
 * première, parce qu'elle ne casse rien — elle fait juste que plus rien ne
 * ressort, et aucune erreur ne le dit.
 *
 * ELLE NE SE LIT PAS DANS LE CODE. Un fichier de page ne sait pas à quelle
 * hauteur ses sections tombent : cela dépend du texte, de la largeur, des
 * images chargées. La garde d'architecture compte donc les blocs et pose un
 * plafond ; la distance, elle, se mesure ici, dans un navigateur, sur la page
 * réellement rendue.
 *
 * La fenêtre d'essai est haute (1 000 px) exprès : c'est la plus défavorable
 * des fenêtres courantes, et une règle vérifiée sur un écran de portable ne
 * dit rien de l'écran de bureau où les deux bandes se retrouveraient.
 */
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

  it("ne se rencontrent jamais dans une même fenêtre", () => {
    const fautes: string[] = [];
    for (const [chemin, blocs] of releves) {
      const ordonnes = [...blocs].sort((a, b) => a.haut - b.haut);
      for (let i = 1; i < ordonnes.length; i += 1) {
        const ecart = ordonnes[i]!.haut - ordonnes[i - 1]!.bas;
        // Il faut une fenêtre PLEINE entre le bas de l'un et le haut de
        // l'autre : à moins que cela, il existe une position de défilement où
        // les deux se voient.
        if (ecart < HAUTEUR) {
          fautes.push(`${chemin} : ${ecart} px entre deux coupures, il en faut ${HAUTEUR}`);
        }
      }
    }
    expect(fautes, fautes.join(" · ")).toEqual([]);
  });

  it("la première coupure arrive après l'en-tête, pas dedans", () => {
    // Une coupure posée dans le premier écran se bat avec le titre et le
    // bouton d'action, qui sont ce que la page a de plus important à montrer.
    for (const [chemin, blocs] of releves) {
      const premiere = [...blocs].sort((a, b) => a.haut - b.haut)[0]!;
      expect(premiere.haut, `${chemin} : coupure à ${premiere.haut} px`).toBeGreaterThan(400);
    }
  });

  it("le site sert bien la page attendue", () => {
    // Un relevé vide passerait toutes les règles ci-dessus sans rien prouver.
    expect(BASE).toMatch(/^https?:\/\//);
    expect([...releves.keys()].sort()).toEqual([...PAGES].sort());
  });
});
