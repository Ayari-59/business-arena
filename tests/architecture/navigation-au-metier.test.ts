import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LA NAVIGATION NE LIT PLUS L'ORANGE (lot 6E, changement de charte).
 *
 * L'orange disait deux choses : l'ACTION (un bouton) et la POSITION (l'étape
 * en cours, l'onglet actif). Le propriétaire a tranché : il ne dit plus que
 * l'action. La navigation — le fil Situation / Analyser / Décider, la piste
 * des étapes de la feuille, les onglets d'un tour clos, le temps « Décision »
 * du parcours sur téléphone, la référence affichée d'une gamme — prend la
 * teinte du métier (`--metier`), et hors d'une partie un gris clair, jamais
 * l'orange en repli.
 *
 * Ce qui garde l'orange, et que cette garde laisse donc passer : les boutons
 * (la fonction `bouton()`), et une OPTION COCHÉE, qui est une décision (voir
 * `voile-d-etat.test.ts` et le bloc « LOT 6E » de globals.css).
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
/** Le code sans ses commentaires : un commentaire qui raconte l'ancien orange n'est pas du style. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const ORANGE = /\b(?:bg|text|border|ring|shadow|from|to|accent)-(?:amber|orange)-\d|accent-plein/;

describe("la navigation est à la teinte du métier", () => {
  it.each([
    "components/segmented-tabs.tsx",
    "components/dashboard-tabs.tsx",
    "components/arena-layout.tsx",
  ])("%s : aucun onglet, aucune étape ne lit l'orange", (chemin) => {
    const source = code(lire(chemin));
    expect(source, "la teinte du métier a disparu").toContain("var(--metier");
    const fautes = source.split("\n").filter((l) => ORANGE.test(l));
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("le temps « Décision » du parcours sur téléphone est au métier", () => {
    const phases = code(lire("config/phases-du-tour.ts"));
    const decision = phases.slice(phases.indexOf("decision: {"));
    expect(decision.slice(0, decision.indexOf("},"))).toContain("var(--metier");
    expect(phases).not.toMatch(ORANGE);
  });

  it("la piste des étapes de la feuille et la référence affichée ne lisent pas l'orange", () => {
    const formulaire = code(lire("components/decision-form.tsx"));
    const piste = formulaire.slice(
      formulaire.indexOf('aria-label="Étapes de décision"'),
      formulaire.indexOf('data-etape={idx("vendre")}'),
    );
    expect(piste.length).toBeGreaterThan(200);
    expect(piste).toContain("var(--metier");
    expect(piste).not.toMatch(ORANGE);
    // La référence choisie d'une gamme, sur petit écran : une position.
    const reference = formulaire.slice(
      formulaire.indexOf("onClick={() => setActiveProduct(p.code)}"),
      formulaire.indexOf("<NomReference reference={p} />"),
    );
    expect(reference).toContain("var(--metier");
    expect(reference).not.toMatch(ORANGE);
  });

  it("dans la feuille de style, la piste s'allume au métier", () => {
    const css = lire("app/globals.css");
    const bloc = css.slice(
      css.indexOf(".piste-segment {"),
      css.indexOf("LES GRANDS CHIFFRES DU RÉSULTAT"),
    );
    expect(bloc).toContain("var(--metier");
    expect(bloc).not.toMatch(/amber|accent-plein|#ff8a1f/);
  });

  it("le titre de l'arbitrage, qui n'est pas un bouton, n'est plus orange", () => {
    const contexte = code(lire("components/decision-context.tsx"));
    const titre = contexte.slice(contexte.indexOf("<h3"), contexte.indexOf("{title}"));
    expect(titre).toContain("var(--metier");
    expect(titre).not.toMatch(ORANGE);
  });
});
