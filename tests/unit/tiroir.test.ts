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

  it("sans `quoi`, aucune pastille vide", () => {
    const html = rendu({ titre: "Contexte", children: "…" });
    expect(html).not.toContain("bg-white/5");
  });

  it("`ouvert` déplie à l'affichage", () => {
    expect(rendu({ titre: "Bilan", ouvert: true, children: "…" })).toContain("<details open");
    expect(rendu({ titre: "Bilan", children: "…" })).not.toContain("<details open");
  });
});

describe("tous les replis de l'arène se reconnaissent au même signe", () => {
  /**
   * Les trois seuls `<details>` écrits à la main dans l'arène. Ils ont un
   * RÉSUMÉ PROPRE que `Tiroir` ne saurait porter — le titre d'une situation,
   * les KPI d'un tour clos, la famille de leviers — mais ils doivent afficher
   * le même trait pointillé quand ils sont fermés.
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
  ];

  const lire = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it.each(AVEC_RESUME_PROPRE)("%s : chaque repli est pointillé quand il est fermé", (fichier) => {
    const source = lire(fichier);
    const replis = source.match(/<details/g) ?? [];
    const pointilles = source.match(/\[&:not\(\[open\]\)\]:border-dashed/g) ?? [];
    expect(replis.length).toBeGreaterThan(0);
    expect(pointilles.length).toBe(replis.length);
  });

  it.each(DOIVENT_PASSER_PAR_TIROIR)("%s : aucun repli écrit à la main", (fichier) => {
    const source = lire(fichier);
    expect(source).not.toContain("<details");
    expect(source).toContain("<Tiroir");
  });
});
