import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Toute ligne du tableau de flux porte un libellé français.
 *
 * Les lignes naissent dans le moteur, sous une étiquette technique
 * (« dividendes_verses »), et sont traduites à l'affichage par une table du
 * composant. Ajouter un flux sans sa traduction n'échoue nulle part : l'élève
 * lit simplement le nom de la variable au milieu de ses comptes. C'est la même
 * faute que les événements d'assurance restés en anglais, trouvée en recette
 * et non par les tests.
 */

const source = (chemin: string) => readFileSync(chemin, "utf8");

describe("libellés du tableau de flux", () => {
  it("chaque étiquette émise par le moteur est traduite à l'affichage", () => {
    const moteur = source("src/engine/finance/statements.ts");
    const composant = source("src/components/financial-statements.tsx");

    // Les étiquettes du moteur : { label: "xxx", amount: ... }
    const etiquettes = [...moteur.matchAll(/\{\s*label:\s*"([a-z_]+)"/g)].map((m) => m[1]!);
    expect(etiquettes.length, "aucune étiquette trouvée dans le moteur").toBeGreaterThan(10);

    const traduites = new Set(
      [...composant.matchAll(/^\s{2}([a-z_]+):\s*"/gm)].map((m) => m[1]!),
    );
    const manquantes = [...new Set(etiquettes)].filter((e) => !traduites.has(e));
    expect(
      manquantes,
      `sans libellé français, l'élève lira ces noms de variables dans ses comptes : ${manquantes.join(", ")}`,
    ).toEqual([]);
  });
});
