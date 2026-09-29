import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE CONTRE-JOUR : un bloc dont le fond va à l'inverse de la page.
 *
 * Le procédé vient des trois captures de l'accueil. Tant que le site s'ouvrait
 * en sombre, elles étaient sombres elles aussi et se fondaient dans la page ;
 * servies sur fond clair, elles sont devenues des ÉCRANS, des objets qui
 * s'allument au milieu du papier. La classe `contre-jour` rend ce contraste
 * disponible pour un bloc quelconque : elle retourne l'échelle des couleurs
 * pour lui seul, sombre sur une page claire, claire sur une page sombre.
 *
 * DEUX CHOSES PEUVENT LE DÉFAIRE EN SILENCE, et ce sont elles qu'on garde.
 *
 * La première est l'excès. Le contraste attire l'œil parce qu'il est UNIQUE
 * sur la page : deux bandes à contre-jour n'en font pas deux qui se voient,
 * elles en font deux qui s'annulent, et la page a simplement changé de rayures.
 * C'est la règle qui se perdra la première, parce qu'elle ne casse rien — elle
 * fait juste que plus rien ne ressort.
 *
 * La seconde est la couleur écrite à la main. Le bloc ne marche que parce
 * qu'il n'énonce AUCUNE couleur : `bg-slate-950` et `text-slate-50` désignent
 * les deux bouts d'une échelle que la classe retourne. Un `#0b1220` posé là
 * resterait sombre sur une page sombre, et le bloc disparaîtrait dans son
 * fond — sans erreur nulle part.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (entree.endsWith(".tsx")) trouves.push(chemin);
  }
  return trouves;
}

/** Le code seul : la prose qui explique la règle cite forcément la classe. */
const codeSeul = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const GENERE = readFileSync(join(SRC, "app", "theme-clair.css"), "utf8");
const GLOBALS = readFileSync(join(SRC, "app", "globals.css"), "utf8");

const SOURCES = fichiers(SRC).map((chemin) => ({
  chemin,
  code: codeSeul(readFileSync(chemin, "utf8")),
}));

/**
 * Les composants qui POSENT la classe, par leur nom d'export.
 *
 * Sans cette indirection, la garde s'endormirait le jour où la bande à
 * contre-jour devient un composant partagé — ce qui est arrivé dès la
 * deuxième page : la classe n'apparaît alors plus qu'une fois dans le dépôt,
 * et une page pourrait en poser deux sans que rien ne compte.
 */
const COMPOSANTS = SOURCES.filter(({ code }) => code.includes("contre-jour")).flatMap(
  ({ code }) => [...code.matchAll(/export function ([A-Z][A-Za-z]*)/g)].map((m) => m[1]!),
);

/** Un bloc à contre-jour : la classe elle-même, ou un composant qui la pose. */
function blocs(code: string): number {
  const directs = code.match(/\bcontre-jour\b/g)?.length ?? 0;
  const parComposant = COMPOSANTS.reduce(
    (n, nom) => n + (code.match(new RegExp(`<${nom}\\b`, "g"))?.length ?? 0),
    0,
  );
  return directs + parComposant;
}

const PORTEURS = SOURCES.filter(({ code }) => blocs(code) > 0);

describe("le contre-jour", () => {
  it("existe dans les deux sens, et il est engendré", () => {
    // Un renversement recopié à la main s'oublie quelque part, et l'oubli ne
    // se voit pas : il donne un bloc bleu pâle sur fond bleu pâle. Les deux
    // sens viennent donc du script, qui les tire de la même table que le
    // thème clair (tests/theme/themes.test.ts vérifie qu'il est à jour).
    expect(GENERE, "le contre-jour d'une page sombre").toContain(
      '[data-theme="sombre"] .contre-jour {',
    );
    expect(GENERE, "le contre-jour d'une page claire").toContain(
      '[data-theme="clair"] .contre-jour {',
    );
  });

  it("rend l'échelle d'origine sur une page claire, la renversée sur une page sombre", () => {
    const bloc = (selecteur: string) => {
      const debut = GENERE.indexOf(selecteur);
      return GENERE.slice(debut, GENERE.indexOf("}", debut));
    };
    // Le fond le plus sombre du site est presque noir. Sur une page claire, le
    // bloc à contre-jour doit le retrouver ; sur une page sombre, il doit
    // porter la valeur renversée, c'est-à-dire un presque-blanc.
    const surPageClaire = bloc('[data-theme="clair"] .contre-jour {');
    const surPageSombre = bloc('[data-theme="sombre"] .contre-jour {');
    const page = bloc('[data-theme="clair"] {');
    const slate950 = (css: string) => css.match(/--color-slate-950: ([^;]+);/)?.[1];
    expect(slate950(surPageSombre), "sur page sombre").toBe(slate950(page));
    expect(slate950(surPageClaire), "sur page claire").not.toBe(slate950(page));
  });

  it("emporte l'ombre et le laiton avec lui", () => {
    // Une surface claire est une surface claire : son ombre est encrée et
    // discrète, son ambre est un laiton sombre. Si le bloc à contre-jour d'une
    // page sombre gardait l'ombre du thème sombre, il serait une carte claire
    // posée sur une tache noire.
    expect(GLOBALS).toMatch(
      /\[data-theme="clair"\],\s*\[data-theme="sombre"\] \.contre-jour\s*\{[^}]*--color-amber-400:/,
    );
    expect(GLOBALS).toMatch(
      /:root,\s*\[data-theme="clair"\] \.contre-jour\s*\{[^}]*--ombre-carte:/,
    );
  });

  it("ne sert qu'une fois par écran", () => {
    // La règle qui se perdra la première, parce qu'elle ne casse rien : elle
    // fait juste que plus rien ne ressort.
    for (const { chemin, code } of PORTEURS) {
      const compte = blocs(code);
      expect(compte, `${chemin.slice(SRC.length + 1)} : ${compte} blocs à contre-jour`).toBe(1);
    }
  });

  it("n'écrit aucune couleur à la main dans le bloc qu'il retourne", () => {
    // Le bloc ne marche que parce qu'il n'énonce aucune couleur : il nomme des
    // paliers, et la classe retourne l'échelle sous eux. Une valeur littérale
    // ne se retournerait pas, et le bloc disparaîtrait dans son fond sur l'un
    // des deux thèmes — sans erreur nulle part.
    for (const { chemin, code } of PORTEURS) {
      const debut = code.indexOf("contre-jour");
      // Une page qui se contente d'APPELER le composant n'écrit pas de bloc :
      // les couleurs qu'on cherche vivent là où la classe est posée.
      if (debut < 0) continue;
      // La section qui porte la classe, jusqu'à sa fermeture : c'est là que
      // vivent les couleurs du bloc.
      const section = code.slice(debut, debut + 1500);
      const litterales = [
        ...section.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\boklch\(/g),
      ].map((m) => m[0]);
      expect(litterales, `${chemin.slice(SRC.length + 1)} : couleur écrite en dur`).toEqual([]);
    }
  });

  it("est réellement employé quelque part, sinon la règle ne garde rien", () => {
    expect(PORTEURS.length, "aucun bloc à contre-jour dans le site").toBeGreaterThan(0);
    expect(COMPOSANTS.length, "la classe n'est posée par aucun composant").toBeGreaterThan(0);
  });
});
