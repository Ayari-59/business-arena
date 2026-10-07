import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { mesurerContraste } from "./helpers/contraste";

/**
 * La lisibilité du papier et du tableau, mesurée dans un vrai navigateur.
 *
 * Un habillage ne se relit pas : il se mesure. Le premier jet du thème clair
 * paraissait très correct à l'œil et laissait pourtant le bouton principal du
 * site à 1,9 pour 1, blanc cassé sur ambre, c'est-à-dire le bouton le plus
 * important devenu le moins lisible. Rien dans la page ne le signalait.
 *
 * CE FICHIER S'ÉTALONNAIT SUR LE THÈME SOMBRE, et comparait le clair à lui.
 * Le site n'a plus qu'un habillage : il n'y a plus d'étalon à qui comparer,
 * donc la mesure devient absolue — aucun texte invisible, le bouton de
 * lancement au-dessus du seuil WCAG, et aucun texte sous 4,5.
 *
 * `/enseignants`, `/parcours` et `/guide` sont là pour leur fin de page : la
 * bande posée à CONTRE-JOUR, c'est-à-dire le tableau, dont l'échelle de
 * couleurs est retournée pour lui seul. Un bloc qui prend l'échelle à rebours
 * est exactement ce qui peut devenir illisible sans que rien ne le signale.
 */
const PAGES = [
  "/",
  "/jouer",
  "/entreprises",
  "/concepts",
  "/animations",
  "/enseignants",
  "/ecoles",
  "/parcours",
  "/guide",
];

/**
 * Les textes sous 4,5 pour 1, comptés sur toutes les pages. Le site en avait
 * sous ses deux thèmes, des textes tertiaires. Mesuré au passage au papier :
 * aucun, ni sur le papier ni sur le tableau. Le plafond est donc zéro, et un
 * texte qui passerait sous le seuil WCAG fait échouer la mesure.
 */
const PLAFOND_SOUS_LE_SEUIL = 0;

let navigateur: Browser;
let page: Page;
const releve = new Map<string, number>();

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage();
  const relever = (prefixe: string, mesures: { texte: string; ratio: number }[]) => {
    for (const m of mesures) {
      // Un même libellé peut apparaître deux fois sur une page ; on garde le
      // pire des deux, c'est celui qui décide.
      const cle = `${prefixe} · ${m.texte}`;
      const connu = releve.get(cle);
      releve.set(cle, connu === undefined ? m.ratio : Math.min(connu, m.ratio));
    }
  };
  for (const chemin of PAGES) {
    await aller(page, chemin);
    relever(chemin, await mesurerContraste(page, "clair"));
  }
  // Le plan du site est replié tant qu'on ne l'ouvre pas : mesuré comme les
  // autres pages, il ne serait jamais mesuré du tout, alors qu'il porte toute
  // la navigation et ses phrases d'aide en petits corps.
  await aller(page, "/");
  await page.getByRole("button", { name: "Menu" }).click();
  // Le plan est un accordéon : on déplie ses groupes pour que les phrases
  // d'aide en petits corps soient réellement rendues, donc mesurées.
  const groupes = page.locator('#plan-du-site button[aria-controls^="groupe-"]');
  for (let i = 0; i < (await groupes.count()); i += 1) await groupes.nth(i).click();
  await page.locator("#plan-du-site a").first().waitFor({ state: "visible" });
  relever("menu", await mesurerContraste(page, "clair"));
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("lisibilité du papier et du tableau", () => {
  it("le site a bien été mesuré", () => {
    expect(releve.size, "relevé vide, la mesure n'a rien vu").toBeGreaterThan(200);
  });

  it("le bouton qui lance une partie reste lisible", () => {
    // Celui-là est passé à 1,9 pour 1 sans que rien ne le signale. Deux
    // libellés : l'accueil ouvre la partie entière (« Commencer une partie »),
    // les autres pages renvoient encore vers le simulateur.
    const ratio = [...releve].find(
      ([cle]) => cle.includes("Commencer une partie") || cle.includes("Tester le simulateur"),
    );
    expect(ratio, "bouton de lancement introuvable").toBeDefined();
    expect(ratio![1], `bouton de lancement à ${ratio![1]}`).toBeGreaterThanOrEqual(4.5);
  });

  it("aucun texte n'est invisible, ni sur le papier ni sur le tableau", () => {
    // Trois pour un, c'est la limite en dessous de laquelle un texte n'est
    // plus difficile à lire, il est absent. C'est arrivé : l'exigence d'un
    // atelier s'écrivait en quatre étoiles dont les dernières étaient
    // simplement plus pâles, à 1,36 pour 1.
    const invisibles = [...releve]
      .filter(([, ratio]) => ratio < 3)
      .map(([cle, ratio]) => `${cle} : ${ratio}`);
    expect(invisibles, `${invisibles.length} textes sous 3 pour 1`).toEqual([]);
  });

  it("aucun texte ne descend sous le seuil WCAG de 4,5 pour 1", () => {
    const sous = [...releve].filter(([, r]) => r < 4.5);
    expect(
      sous.length,
      `${sous.length} textes sous 4,5 pour 1 (plafond ${PLAFOND_SOUS_LE_SEUIL}) :\n${sous
        .slice(0, 10)
        .map(([c, r]) => `${c} : ${r}`)
        .join("\n")}`,
    ).toBeLessThanOrEqual(PLAFOND_SOUS_LE_SEUIL);
  });
});
