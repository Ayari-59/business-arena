import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LA LUEUR D'UN CHIFFRE NE SE COLORE PAS (LOT 6A).
 *
 * Le lot 6A pose une lueur douce sur les chiffres clés (`--lueur-chiffre`,
 * `.chiffre-cle`). La charte tient : l'orange, le vert et le rouge NE SE
 * DILUENT PAS — un résultat vert ou rouge garde sa couleur pleine SANS halo
 * coloré. Une lueur blanc cassé NEUTRE à 15 % est permise ; un halo vert,
 * rouge, orange ou or ne l'est pas.
 *
 * Cette garde lit `globals.css` et vérifie :
 *   · `--lueur-chiffre` est bâtie sur une encre AUTORISÉE à luire — le blanc
 *     cassé (`#f1ede4` et sa famille) ou le bleu donnée (`--donnee`) — et sur
 *     rien d'autre ;
 *   · aucune des couleurs fonctionnelles réservées (vert de résultat, rouge,
 *     orange d'action, or) n'apparaît dans un `text-shadow` de lueur.
 */
const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Les encres interdites de lueur : les quatre accents réservés de la charte. */
const COULEURS_INTERDITES = [
  "emerald",
  "red",
  "rose",
  "green",
  "teal",
  "amber",
  "#3ccf7e", // vert de résultat
  "#ff7070", // rouge
  "#ff8a1f", // orange d'action
  "#f4b400", // or
];

function valeurDe(nom: string): string {
  const m = CSS.match(new RegExp(`${nom}\\s*:\\s*([^;]+);`));
  return m?.[1] ?? "";
}

describe("la lueur des chiffres", () => {
  it("--lueur-chiffre est définie", () => {
    expect(valeurDe("--lueur-chiffre")).toBeTruthy();
  });

  it("--lueur-chiffre est neutre (blanc cassé ou bleu donnée)", () => {
    const v = valeurDe("--lueur-chiffre");
    const neutre = v.includes("#f1ede4") || v.includes("--donnee") || v.includes("#8fb0dc");
    expect(neutre, `la lueur doit être blanc cassé ou bleu donnée, pas « ${v} »`).toBe(true);
  });

  it("aucune couleur fonctionnelle réservée dans une lueur de chiffre", () => {
    const v = valeurDe("--lueur-chiffre").toLowerCase();
    for (const interdite of COULEURS_INTERDITES) {
      expect(v.includes(interdite), `la lueur ne doit pas prendre « ${interdite} »`).toBe(false);
    }
  });

  it("la classe .chiffre-cle ne pose qu'une lueur par jeton, jamais une valeur en dur", () => {
    const m = CSS.match(/\.chiffre-cle\s*\{([^}]*)\}/);
    expect(m, ".chiffre-cle doit exister").toBeTruthy();
    const corps = m![1] ?? "";
    expect(corps).toContain("var(--lueur-chiffre)");
    // Pas de couleur fonctionnelle écrite en dur dans la classe elle-même.
    for (const interdite of COULEURS_INTERDITES) {
      expect(corps.toLowerCase().includes(interdite)).toBe(false);
    }
  });
});
