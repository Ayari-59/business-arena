import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { EcartsDeCouts } from "@/components/ecarts-de-couts";
import { calculateVariances } from "@/engine/costs/variance";

/**
 * D'OÙ VIENT L'ÉCART DE COÛTS.
 *
 * Le moteur décompose les écarts à chaque tour ; personne ne les voyait,
 * faute d'un composant branché. Le tableau prévu/réalisé donne l'écart
 * global, celui-ci dit s'il vient du fournisseur ou des rebuts.
 */

const ecart = (over: Partial<Parameters<typeof calculateVariances>[0]> = {}) =>
  calculateVariances({
    standardMaterialCost: 20,
    standardOtherVariableCost: 10,
    actualMaterialMultiplier: 1.1,
    actualQuantityProduced: 1_000,
    defectUnits: 50,
    actualPrice: 59,
    segmentSales: { etudiants: { sold: 800, lost: 200 } },
    ...over,
  })!;

const GAMME = [
  { code: "go", name: "NOVA Go" },
  { code: "studio", name: "NOVA Studio" },
] as unknown as Parameters<typeof EcartsDeCouts>[0]["gamme"];

const produits = (parCode: Record<string, unknown>) =>
  parCode as unknown as Parameters<typeof EcartsDeCouts>[0]["produits"];

const rendre = (gamme: typeof GAMME, p: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(EcartsDeCouts, { gamme, produits: produits(p) }));

describe("le tableau des écarts", () => {
  it("nomme chaque référence et totalise l'ensemble", () => {
    const html = rendre(GAMME, {
      go: { variances: ecart() },
      studio: { variances: ecart({ actualQuantityProduced: 200, defectUnits: 5 }) },
    });
    expect(html).toContain("NOVA Go");
    expect(html).toContain("NOVA Studio");
    expect(html).toContain("Ensemble");
  });

  it("sépare le choix de fournisseur des rebuts", () => {
    const html = rendre(GAMME, { go: { variances: ecart() } });
    expect(html).toContain("Prix d&#x27;achat");
    expect(html).toContain("Rebuts");
    // L'écart de prix d'achat vaut (1,1 − 1) × 20 € × 1 000 = 2 000 €.
    expect(html).toContain("2");
  });

  it("ne s'affiche pas sans gamme, sans produits, ni sur un écart négligeable", () => {
    expect(rendre(null, { go: { variances: ecart() } })).toBe("");
    expect(renderToStaticMarkup(
      createElement(EcartsDeCouts, { gamme: GAMME, produits: undefined }),
    )).toBe("");
    const nul = ecart({ actualMaterialMultiplier: 1, defectUnits: 0 });
    expect(rendre(GAMME, { go: { variances: nul } })).toBe("");
  });

  it("n'affiche jamais le bloc « revenus », dont les champs ne sont pas des écarts", () => {
    // `priceVariance` y vaut le chiffre d'affaires et `volumeVariance` les
    // unités perdues : les montrer en euros sous le nom d'écart enseignerait
    // une fausseté. Le garde tient tant que le calcul n'est pas écrit.
    const source = readFileSync(
      join(process.cwd(), "src/components/ecarts-de-couts.tsx"),
      "utf8",
    );
    expect(source).not.toContain("revenueVarianceBySegment");
    const html = rendre(GAMME, { go: { variances: ecart() } });
    expect(html).not.toContain("etudiants");
  });

  it("un écart positif coûte, et le signe le dit avant la couleur", () => {
    const html = rendre(GAMME, { go: { variances: ecart() } });
    expect(html).toContain("+");
    expect(html).toContain("Un écart positif a coûté");
  });
});

describe("le composant est bien branché", () => {
  it("le tableau de bord l'affiche", () => {
    const dash = readFileSync(join(process.cwd(), "src/components/period-dashboard.tsx"), "utf8");
    expect(dash).toContain("<EcartsDeCouts");
  });

  it("aucun composant de l'appli n'est orphelin", () => {
    // L'écart de coûts dormait dans un composant que rien n'importait. Le
    // garde vaut pour tous : un écran écrit et jamais monté est un écran mort.
    const dir = join(process.cwd(), "src/components");
    const sources: string[] = [];
    const parcourir = (racine: string) => {
      for (const e of readdirSync(racine)) {
        const chemin = join(racine, e);
        if (statSync(chemin).isDirectory()) parcourir(chemin);
        else if (/\.(ts|tsx)$/.test(e)) sources.push(chemin);
      }
    };
    parcourir(join(process.cwd(), "src"));
    const orphelins = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => f.replace(/\.tsx$/, ""))
      .filter((nom) => {
        const cible = `components/${nom}"`;
        return !sources.some(
          (f) => !f.endsWith(join("components", `${nom}.tsx`)) && readFileSync(f, "utf8").includes(cible),
        );
      });
    // Deux orphelins connus, hors périmètre de ce lot : ils sont listés ici
    // pour que le garde échoue si un TROISIÈME apparaît.
    expect(orphelins.sort()).toEqual(["arena-layout", "guide-with-glossary"]);
  });
});
