import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";

/**
 * CE QUE FAIT UN ENSEIGNANT, DANS L'ORDRE OÙ IL LE FAIT.
 *
 * La page alignait quatre capacités sans ordre : la partie en trente
 * secondes, la vue pédagogique, les six niveaux, le concours. Chacune vraie,
 * et la liste ne disait pas à quel MOMENT chaque chose sert — or un
 * enseignant qui découvre le produit se demande d'abord ce qu'il aura à faire
 * avant la séance, pendant, et après.
 *
 * CE QUE CETTE GARDE TIENT. Les trois temps, dans leur ordre : une grille dont
 * l'évaluation passerait avant la préparation ne serait plus une grille. La
 * phrase qui la justifie, parce qu'elle est le fond de la page et qu'une
 * relecture pressée la ferait sauter. Et les deux comptes qui s'y trouvent,
 * lus dans les registres : écrits à la main, ils survivraient à un niveau
 * ajouté ou à un atelier publié, comme un titre de test a survécu à deux
 * métiers ajoutés.
 */

const PAGE = readFileSync(join(process.cwd(), "src/app/enseignants/page.tsx"), "utf8");

describe("les trois temps de l'enseignant", () => {
  it("vont de la préparation à l'évaluation, dans cet ordre", () => {
    const rangs = ["Préparer", "Faire jouer", "Évaluer"].map((t) => PAGE.indexOf(`temps: "${t}"`));
    for (const [i, r] of rangs.entries()) {
      expect(r, `le temps « ${["Préparer", "Faire jouer", "Évaluer"][i]} » a disparu`).toBeGreaterThan(0);
    }
    expect(rangs[0]).toBeLessThan(rangs[1]!);
    expect(rangs[1]).toBeLessThan(rangs[2]!);
  });

  it("disent ce que la grille sert à dire", () => {
    // Le produit ouvre des leviers, il ne décide pas à la place de qui
    // enseigne. C'est le fond de la page, et c'est la ligne qu'une relecture
    // pressée retire en premier parce qu'elle ne décrit aucune fonction.
    expect(PAGE).toContain("L&apos;enseignant reste maître de la progression pédagogique.");
  });

  it("comptent les niveaux et les ateliers dans les registres", () => {
    expect(PAGE).toContain("DIFFICULTY_PRESETS.length");
    expect(PAGE).toContain("ATELIERS.length");
    // Les deux bouts de l'échelle aussi : « de Découverte à Executive » est
    // exact aujourd'hui et le resterait faussement demain.
    expect(PAGE).toContain("DIFFICULTY_PRESETS[0]");
    expect(PAGE).toContain("DIFFICULTY_PRESETS.at(-1)");
    expect(DIFFICULTY_PRESETS.length).toBeGreaterThan(1);
    expect(ATELIERS.length).toBeGreaterThan(1);
  });

  it("renvoient au guide pour le déroulé d'une séance", () => {
    // Le déroulé a vécu sur cette page en quatre cartes numérotées ; il en a
    // été retiré parce qu'il redisait le guide en moins bien. La grille dit ce
    // que l'enseignant TIENT, pas comment il anime — et le renvoi reste.
    expect(PAGE).toContain("guide de prise en main");
  });
});
