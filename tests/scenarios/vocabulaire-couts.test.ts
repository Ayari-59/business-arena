import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";

/**
 * Le nom de ce que l'entreprise achète.
 *
 * Le moteur ne connaît qu'un coût d'achat par unité vendue. Ce que recouvre ce
 * coût change à chaque métier : des denrées au bistrot, des matériaux sur un
 * chantier, du gazole dans un camion, des badges et des serviettes dans une
 * salle de sport. L'interface l'appelait « matières premières » partout, y
 * compris dans une salle de sport, où la ligne ne voulait plus rien dire et où
 * le panneau du fournisseur, titré « fournisseur de matières premières »,
 * proposait en réalité de choisir un parc de machines.
 *
 * Le défaut ne casse rien : les chiffres étaient justes, seul leur nom était
 * faux. C'est exactement le genre d'erreur qu'aucun test de calcul ne voit.
 */
const COMPOSANTS = [
  "src/components/financial-statements.tsx",
  "src/components/decision-form.tsx",
];

describe("le nom de ce que chaque métier achète", () => {
  it("chaque scénario nomme son coût d'achat, son autre coût variable et son fournisseur", () => {
    for (const d of SCENARIOS) {
      for (const champ of ["materialLabel", "otherVariableLabel", "supplierPanelLabel"] as const) {
        const mot = d.vocabulary[champ];
        expect(mot, `${d.code} : ${champ} vide`).toBeTruthy();
        expect(mot.length, `${d.code} : ${champ} trop court`).toBeGreaterThan(4);
        expect(mot[0], `${d.code} : ${champ} ne commence pas par une majuscule`).toBe(
          mot[0]!.toUpperCase(),
        );
      }
    }
  });

  it("aucun métier sans matières ne parle de matières premières", () => {
    // L'industrie et le bâtiment en achètent vraiment ; les sept autres non.
    const AVEC_MATIERES = new Set(["industrie", "batiment"]);
    for (const d of SCENARIOS.filter((s) => !AVEC_MATIERES.has(s.sector))) {
      const mots = [
        d.vocabulary.materialLabel,
        d.vocabulary.otherVariableLabel,
        d.vocabulary.supplierPanelLabel,
      ].join(" ");
      expect(mots.toLowerCase(), `${d.code} parle encore de matières`).not.toContain("matière");
    }
  });

  it("le nom du coût d'achat colle au métier, pas à l'industrie", () => {
    // Une vérification par l'exemple : si ces mots-là redevenaient génériques,
    // c'est que le vocabulaire a été recopié d'un scénario à l'autre.
    const attendu: Record<string, string> = {
      bistrot: "denrées",
      fitness: "consommables",
      transport: "gazole",
      batiment: "matériaux",
      boutique: "marchandises",
    };
    for (const [code, mot] of Object.entries(attendu)) {
      const d = SCENARIOS.find((s) => s.code === code);
      expect(d, `scénario ${code} introuvable`).toBeDefined();
      expect(d!.vocabulary.materialLabel.toLowerCase(), `${code}`).toContain(mot);
    }
  });

  it("l'interface prend ces noms du scénario et n'en écrit aucun en dur", () => {
    // Sans cette garde, un composant peut retomber sur une étiquette figée sans
    // qu'aucun calcul ne change : le défaut d'origine, à l'identique.
    for (const chemin of COMPOSANTS) {
      // Les commentaires ont le droit de nommer le défaut d'origine : c'est le
      // texte AFFICHÉ qui ne doit plus le contenir.
      const source = readFileSync(chemin, "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(source.toLowerCase(), `${chemin} écrit « matières » en dur`).not.toContain(
        "matières",
      );
    }
    const comptes = readFileSync(COMPOSANTS[0]!, "utf-8");
    expect(comptes, "l'analyse des coûts n'ouvre pas le vocabulaire").toContain(
      "vocabulary.materialLabel",
    );
    expect(comptes).toContain("vocabulary.otherVariableLabel");
  });
});
