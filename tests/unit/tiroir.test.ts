import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Tiroir } from "@/components/tiroir";

/**
 * UN REPLI QU'ON NE VOIT PAS EST UN CONTENU PERDU.
 *
 * L'arène range beaucoup de choses derrière un repli : le contexte, le détail
 * par clientèle, les leviers d'action, les états financiers, l'historique des
 * ventes. Chacun était écrit à sa manière — l'un avec le triangle du
 * navigateur, l'autre avec le mot « déplier », un troisième avec rien. Un élève
 * ne cherche pas ce qu'il ne soupçonne pas.
 *
 * Ce test garde les trois signaux du tiroir, et surtout le fait que TOUS les
 * replis de l'arène passent par le même composant.
 */

function rendu(props: Parameters<typeof Tiroir>[0]): string {
  return renderToStaticMarkup(createElement(Tiroir, props));
}

describe("Tiroir", () => {
  it("porte ses trois signaux : chevron qui pivote, trait pointillé, et ce qu'il cache", () => {
    const html = rendu({ titre: "Détail par clientèle", quoi: "4 clientèles", children: "…" });
    // 1. le chevron, et sa rotation à l'ouverture
    expect(html).toContain("▸");
    expect(html).toContain("group-open:rotate-90");
    // 2. pointillé fermé, plein ouvert
    expect(html).toContain("border-dashed");
    expect(html).toContain("open:border-solid");
    // 3. ce qui attend derrière
    expect(html).toContain("4 clientèles");
    expect(html).toContain("déplier");
  });

  it("masque le triangle natif, sinon il double le nôtre", () => {
    const html = rendu({ titre: "Contexte", children: "…" });
    expect(html).toContain("list-none");
    // `&` ressort échappé du rendu HTML : c'est la classe telle qu'elle arrive
    // au navigateur qu'on vérifie.
    expect(html).toContain("[&amp;::-webkit-details-marker]:hidden");
  });

  it("le compte est du texte, jamais une pastille qui ressemble à un bouton", () => {
    // Il en a porté une — bordure, fond, coins ronds — au milieu d'un en-tête
    // qui est DÉJÀ la zone cliquable du tiroir. Elle promettait une commande
    // qui n'existait pas, et son texte se coupait en deux sur un téléphone.
    const html = rendu({ titre: "Détail par clientèle", quoi: "3 clientèles", children: "…" });
    expect(html).toContain("3 clientèles");
    expect(html).not.toContain("rounded-full");
    expect(html).not.toContain("bg-white/5");
    // Et il reste entier quelle que soit la largeur.
    expect(html).toContain("whitespace-nowrap");
  });

  it("`valeur` reste dans le résumé, avec sa couleur : un tiroir ne range pas ce qui décide", () => {
    // La saison du tour multiplie la demande : repliée entière, elle
    // redeviendrait la note de bas de page qu'elle était avant sa correction.
    const html = rendu({
      titre: "Saison du tour",
      valeur: createElement("span", { className: "text-amber-300" }, "−6 % de demande"),
      children: "…",
    });
    // Dans le RÉSUMÉ, donc avant le trait qui ouvre le contenu.
    const resume = html.slice(0, html.indexOf("</summary>"));
    expect(resume).toContain("−6 % de demande");
    expect(resume).toContain("text-amber-300");
  });

  it("`ouvert` déplie à l'affichage", () => {
    // Le `<details>` porte son marqueur (`data-tiroir`, lu par globals.css pour
    // le fond de la colonne gelée d'un tableau) avant son `open`.
    expect(rendu({ titre: "Bilan", ouvert: true, children: "…" })).toMatch(
      /<details[^>]*\sopen(?:=""|\s|>)/,
    );
    expect(rendu({ titre: "Bilan", children: "…" })).not.toMatch(
      /<details[^>]*\sopen(?:=""|\s|>)/,
    );
  });
});

describe("tous les replis de l'arène se reconnaissent au même signe", () => {
  /**
   * Les trois seuls `<details>` écrits à la main dans l'arène. Ils ont un
   * RÉSUMÉ PROPRE que `Tiroir` ne saurait porter — le titre d'une situation,
   * les KPI d'un tour clos, la famille de leviers — mais ils doivent afficher
   * le même signe quand ils sont fermés.
   *
   * LOT 6E : LE SIGNE A CHANGÉ, LA GARDE AUSSI. Le pointillé d'un repli fermé
   * était un cadre de plus, tireté, dans un écran qui en comptait déjà trop ;
   * la règle des bordures du lot 6E (globals.css, « LOT 6E ») retire les cadres
   * des panneaux. Un repli de l'arène est désormais un PANNEAU (`panneau`), et
   * son état replié se dit au chevron qui pivote — le signe que les tours
   * passés portaient déjà. La garde vérifie la même chose qu'avant : CHAQUE
   * repli porte le signe commun, et aucun ne le porte à moitié.
   */
  const AVEC_RESUME_PROPRE = [
    join("src", "app", "arena", "[gameId]", "page.tsx"),
    join("src", "components", "decision-form.tsx"),
  ];

  /** Les composants de l'arène qui, eux, doivent passer par `Tiroir`. */
  const DOIVENT_PASSER_PAR_TIROIR = [
    join("src", "components", "decision-context.tsx"),
    join("src", "components", "situation-panel.tsx"),
    join("src", "components", "sales-history.tsx"),
    join("src", "components", "financial-statements.tsx"),
    join("src", "components", "saison-du-tour.tsx"),
  ];

  const lire = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it.each(AVEC_RESUME_PROPRE)(
    "%s : chaque repli est un panneau, et son chevron pivote quand il s'ouvre",
    (fichier) => {
      const source = lire(fichier);
      const replis = [...source.matchAll(/<details[\s\S]*?<\/summary>/g)].map((m) => m[0]);
      expect(replis.length).toBeGreaterThan(0);
      for (const repli of replis) {
        // Le signe commun : un chevron qui pivote à l'ouverture.
        expect(repli, repli.slice(0, 120)).toContain("group-open:rotate-90");
        // Plus de pointillé : un repli fermé est rangé, pas vide.
        expect(repli, repli.slice(0, 120)).not.toContain("border-dashed");
        // Et c'est un panneau (le sol et l'arête), pas un cadre.
        expect(repli, repli.slice(0, 120)).toMatch(/panneau|\$\{tone\}/);
      }
      // Le panneau par défaut de la famille de décision est bien `panneau`.
      if (fichier.endsWith("decision-form.tsx")) expect(source).toContain('tone = "panneau"');
    },
  );

  it("les tours passés gardent un signe de repli : le chevron qui pivote", () => {
    const source = lire(join("src", "app", "arena", "[gameId]", "page.tsx"));
    const debut = source.indexOf("data-tour-passe");
    expect(debut).toBeGreaterThan(-1);
    const tour = source.slice(debut, source.indexOf("</summary>", debut));
    expect(tour).toContain("group-open:rotate-90");
    expect(tour).not.toContain("border-dashed");
  });

  it.each(DOIVENT_PASSER_PAR_TIROIR)("%s : aucun repli écrit à la main", (fichier) => {
    const source = lire(fichier);
    expect(source).not.toContain("<details");
    expect(source).toContain("<Tiroir");
  });
});
