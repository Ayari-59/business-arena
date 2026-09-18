import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UNE SURFACE INVISIBLE NE PREND PAS LES CLICS.
 *
 * Signalé à l'usage : « le bouton J'ai pris note n'a pas l'air de fonctionner
 * sur un mobile ». L'enveloppe du courrier finit son ouverture à `opacity: 0`,
 * mais une opacité nulle ne retire rien à la surface cliquable : translatée
 * d'un tiers de sa hauteur vers le bas, elle débordait sous la lettre et
 * recouvrait le bouton. Sur téléphone, où la lettre prend toute la largeur, il
 * devenait inatteignable ; sur grand écran, seul le cas d'une lettre centrée
 * était touché, ce qui rendait le défaut intermittent et donc invisible.
 *
 * La règle vaut pour toute la feuille : si une animation laisse un élément
 * invisible en place, cet élément doit renoncer aux clics.
 */
// Les commentaires portent des accolades dans leur prose : on les retire avant
// de découper les règles, sinon le sélecteur capturé les emporte avec lui.
const CSS = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Les animations dont la dernière image est transparente. */
function animationsQuiSeffacent(css: string): string[] {
  const noms: string[] = [];
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g)) {
    const [, nom, corps] = m;
    const derniere = corps!.lastIndexOf("100%");
    if (derniere === -1) continue;
    if (/opacity:\s*0\s*;/.test(corps!.slice(derniere))) noms.push(nom!);
  }
  return noms;
}

/** Les règles qui jouent une animation donnée, avec leur bloc de déclarations. */
function reglesQuiJouent(css: string, animation: string): { selecteur: string; corps: string }[] {
  const out: { selecteur: string; corps: string }[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selecteur, corps] = m;
    if (selecteur!.trim().startsWith("@")) continue;
    if (new RegExp(`animation:[^;]*\\b${animation}\\b`).test(corps!)) {
      out.push({ selecteur: selecteur!.trim(), corps: corps! });
    }
  }
  return out;
}

describe("aucune surface invisible ne mange les clics", () => {
  it("une animation qui finit transparente laisse un élément qui renonce aux clics", () => {
    const effacements = animationsQuiSeffacent(CSS);
    expect(effacements.length, "aucune animation d'effacement trouvée").toBeGreaterThan(0);
    for (const animation of effacements) {
      const regles = reglesQuiJouent(CSS, animation);
      expect(regles.length, `personne ne joue ${animation}`).toBeGreaterThan(0);
      for (const { selecteur, corps } of regles) {
        expect(
          corps,
          `${selecteur} finit invisible (${animation}) : il lui faut pointer-events: none`,
        ).toMatch(/pointer-events:\s*none/);
      }
    }
  });

  it("les deux objets fermés du courrier en sont", () => {
    // La garde générale ne sert à rien si elle ne couvre pas le cas qui l'a
    // fait écrire : on le nomme. Ils sont deux depuis que le courriel est un
    // canal — l'enveloppe et la ligne de boîte de réception s'effacent de la
    // même façon, donc ne doivent pas plus l'une que l'autre rester cliquables.
    expect(animationsQuiSeffacent(CSS)).toContain("pli-sortie");
    const selecteurs = reglesQuiJouent(CSS, "pli-sortie")
      .map((r) => r.selecteur)
      .join(" ");
    for (const objet of [".pli-ouverture > .enveloppe", ".pli-ouverture > .courriel"]) {
      expect(selecteurs, `${objet} ne joue pas pli-sortie`).toContain(objet);
    }
  });
});
