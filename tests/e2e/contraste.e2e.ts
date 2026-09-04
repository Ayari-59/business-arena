import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { mesurerContraste } from "./helpers/contraste";
import { THEMES, THEME_PAR_DEFAUT } from "../../src/config/themes";

/**
 * La lisibilité des thèmes, mesurée dans un vrai navigateur.
 *
 * Un thème ne se relit pas : il se mesure. Le premier jet du thème clair
 * paraissait très correct à l'œil et laissait pourtant le bouton principal du
 * site à 1,9 pour 1, blanc cassé sur ambre, c'est-à-dire le bouton le plus
 * important devenu le moins lisible. Rien dans la page ne le signalait.
 *
 * Le thème d'origine sert d'étalon plutôt qu'une note absolue : le site a des
 * textes tertiaires en dessous de 4,5 pour 1 depuis toujours, et ce test n'a
 * pas pour objet de les corriger. Il garde une chose : qu'un thème ne dégrade
 * pas ce qui était lisible.
 */
const PAGES = ["/", "/jouer", "/entreprises", "/concepts", "/ateliers"];

let navigateur: Browser;
let page: Page;
const parTheme = new Map<string, Map<string, number>>();

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage();
  for (const theme of THEMES) {
    const releve = new Map<string, number>();
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
      relever(chemin, await mesurerContraste(page, theme.code));
    }
    // Le plan du site est replié tant qu'on ne l'ouvre pas : mesuré comme les
    // autres pages, il ne serait jamais mesuré du tout, alors qu'il porte
    // maintenant toute la navigation et ses phrases d'aide en petits corps.
    await aller(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    // Le plan est un accordéon : on déplie ses groupes pour que les phrases
    // d'aide en petits corps soient réellement rendues, donc mesurées.
    const groupes = page.locator('#plan-du-site button[aria-controls^="groupe-"]');
    for (let i = 0; i < (await groupes.count()); i += 1) await groupes.nth(i).click();
    await page.locator("#plan-du-site a").first().waitFor({ state: "visible" });
    relever("menu", await mesurerContraste(page, theme.code));
    parTheme.set(theme.code, releve);
  }
}, 180_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("lisibilité des thèmes", () => {
  it("chaque thème a bien été mesuré", () => {
    for (const theme of THEMES) {
      const releve = parTheme.get(theme.code);
      expect(releve, `${theme.code} non mesuré`).toBeDefined();
      expect(releve!.size, `${theme.code} : relevé vide, la mesure n'a rien vu`).toBeGreaterThan(200);
    }
  });

  it("aucun thème ne rend illisible un texte qui l'était sur le thème d'origine", () => {
    const etalon = parTheme.get(THEME_PAR_DEFAUT)!;
    for (const theme of THEMES.filter((t) => t.code !== THEME_PAR_DEFAUT)) {
      const releve = parTheme.get(theme.code)!;
      const aggraves: string[] = [];
      for (const [cle, ratio] of releve) {
        const reference = etalon.get(cle);
        if (reference === undefined) continue;
        // Le seuil de la règle WCAG est 4,5 ; on ne se fâche qu'en dessous de
        // 4, parce qu'un texte qui passe de 8 à 4,49 a perdu de la marge, pas
        // sa lisibilité, et qu'un test qui se fâche pour un centième finit
        // désactivé. Le bouton principal était tombé à 1,9 : c'est cet
        // ordre de grandeur que la règle doit attraper.
        if (ratio < 4 && reference >= 4.5) {
          aggraves.push(`${cle} : ${ratio} contre ${reference}`);
        }
      }
      expect(aggraves, `${theme.code} dégrade ${aggraves.length} textes`).toEqual([]);
    }
  });

  it("aucun thème n'introduit de texte franchement illisible", () => {
    const etalon = parTheme.get(THEME_PAR_DEFAUT)!;
    for (const theme of THEMES.filter((t) => t.code !== THEME_PAR_DEFAUT)) {
      const nouveaux = [...parTheme.get(theme.code)!]
        .filter(([cle, ratio]) => ratio < 3 && (etalon.get(cle) ?? 0) >= 3)
        .map(([cle, ratio]) => `${cle} : ${ratio}`);
      expect(nouveaux, `${theme.code} : textes sous 3 pour 1`).toEqual([]);
    }
  });

  it("le bouton qui lance une partie reste lisible sur chaque thème", () => {
    // Celui-là est passé à 1,9 pour 1 sans que rien ne le signale.
    for (const theme of THEMES) {
      const ratio = [...parTheme.get(theme.code)!].find(([cle]) =>
        cle.includes("Tester le simulateur"),
      );
      expect(ratio, `${theme.code} : bouton de lancement introuvable`).toBeDefined();
      expect(ratio![1], `${theme.code} : bouton de lancement à ${ratio![1]}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it("le thème clair n'est pas moins lisible que le thème d'origine", () => {
    // Un fond blanc est plus lumineux que le fond sombre n'est sombre : le
    // renversement exact de l'échelle affaiblit les textes secondaires, et ce
    // décompte est ce qui a fait décaler les paliers de texte d'un cran.
    const compte = (code: string) =>
      [...parTheme.get(code)!].filter(([, r]) => r < 4.5).length;
    expect(compte("clair")).toBeLessThanOrEqual(compte(THEME_PAR_DEFAUT));
  });
});
