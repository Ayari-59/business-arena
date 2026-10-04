import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { RevelationDuTour } from "@/components/revelation-du-tour";
import type { IncomeStatement } from "@/engine/types";
import { formatEuro } from "@/lib/format";

/**
 * LA RÉVÉLATION DU RÉSULTAT.
 *
 * Le tour se clôt, l'écran se rafraîchit seul, et le moment le plus attendu de
 * la séance arrivait sans qu'aucun pixel ne le dise. Ce qui doit tenir :
 *
 * · LE CHIFFRE ET SA CAUSE sont dans la page, tous les deux, sans mouvement à
 *   attendre : l'animation ne fait apparaître que ce qui est déjà rendu.
 * · LA MISE EN SCÈNE EST RÉSERVÉE AU TOUR NEUF. Rejouée au dépliement d'un
 *   vieux tour, elle devient un tic.
 * · QUI A DEMANDÉ MOINS D'ANIMATION VOIT LE BLOC ENTIER, d'un coup.
 */

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function compte(marge: number, structure: number, bas: number): IncomeStatement {
  const ebitda = marge - structure;
  return {
    revenue: marge * 2,
    productionStocked: 0,
    cogs: marge,
    variableProductionCost: marge,
    grossMargin: marge,
    marketingCost: structure,
    qualityCost: 0,
    maintenanceCost: 0,
    fixedCosts: 0,
    ebitda,
    depreciation: bas,
    operatingIncome: ebitda - bas,
    interest: 0,
    pretaxIncome: ebitda - bas,
    tax: 0,
    netIncome: ebitda - bas,
  };
}

const rendu = (props: Partial<Parameters<typeof RevelationDuTour>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(RevelationDuTour, {
      periode: "Trimestre 3",
      tour: compte(130_000, 60_000, 10_000),
      precedent: compte(100_000, 60_000, 10_000),
      nouveau: true,
      ...props,
    }),
  );

describe("la révélation du tour", () => {
  it("donne le tour, le chiffre et la cause, sans attendre le mouvement", () => {
    const html = rendu();
    expect(html).toContain("Trimestre 3");
    expect(html).toContain(formatEuro(60_000)); // le résultat atteint
    expect(html).toContain("la marge sur les ventes"); // où le tour s'est joué
    expect(html).toContain("bénéfice");
  });

  it("dit la perte comme une perte, et la teinte avec", () => {
    const html = rendu({ tour: compte(40_000, 60_000, 10_000), precedent: null });
    expect(html).toContain("perte");
    expect(html).toContain("text-rose-300");
    expect(html).toContain("ne couvre pas");
    // Le premier tour clos n'a pas d'écart : on ne le compare à rien.
    expect(html).not.toContain("par rapport au tour précédent");
  });

  it("ne met en scène que le tour qu'on vient d'ouvrir", () => {
    expect(rendu({ nouveau: true })).toContain('class="carte');
    expect(rendu({ nouveau: true })).toMatch(/class="[^"]*\brevelation\b/);
    expect(rendu({ nouveau: false })).not.toMatch(/class="[^"]*\brevelation\b/);
  });

  it("porte la place au classement quand il est révélé, et rien sinon", () => {
    expect(rendu({ rang: { place: 1, sur: 7 } })).toContain("sur 7 équipes");
    expect(rendu({ rang: { place: 1, sur: 7 } })).toContain("re</sup>");
    expect(rendu({ rang: { place: 4, sur: 7 } })).toContain("e</sup>");
    expect(rendu()).not.toContain("au classement");
  });

  it("relaie ses temps en CSS, et s'arrête pour qui l'a demandé", () => {
    expect(css).toContain("@keyframes revelation-entree");
    // L'animation FINIT visible : rien ne reste transparent par-dessus le reste,
    // donc aucune surface ne mange les clics.
    const bloc = css.slice(css.indexOf("@keyframes revelation-entree"));
    expect(bloc.slice(0, bloc.indexOf("}\n\n"))).toContain("opacity: 1");
    expect(css).toMatch(/\.revelation > \*:nth-child\(2\)\s*\{\s*animation-delay/);
    // Le bloc « mouvement réduit » qui suit les délais : la feuille en compte
    // plusieurs, on prend celui de la révélation et pas un autre.
    const apresLesDelais = css.slice(css.indexOf(".revelation > *:nth-child(n + 4)"));
    const reduit = apresLesDelais.slice(apresLesDelais.indexOf("prefers-reduced-motion"));
    expect(reduit.indexOf(".revelation > *")).toBeGreaterThan(-1);
    expect(reduit.slice(0, reduit.indexOf("\n}"))).toMatch(/animation:\s*none/);
  });

  it("est posée en tête de la synthèse d'un tour clos", () => {
    const dashboard = readFileSync(
      join(process.cwd(), "src/components/period-dashboard.tsx"),
      "utf8",
    );
    expect(dashboard).toContain("<RevelationDuTour");
    // Avant les réussites, donc avant les cartes d'indicateurs.
    expect(dashboard.indexOf("<RevelationDuTour")).toBeLessThan(
      dashboard.indexOf("<ReussitesDuTour"),
    );
  });
});

describe("le classement et l'IPG se lisent sur une seule ligne de la carte", () => {
  const plat = (html: string) => html.replace(/<[^>]+>/g, "").replace(/[  ]/g, " ");

  it("la place et l'IPG vont ensemble, sans ligne d'introduction au-dessus des onglets", () => {
    const html = plat(rendu({ rang: { place: 1, sur: 3 }, ipg: 65.4 }));
    expect(html).toContain("Au classement révélé : 1re sur 3 équipes · IPG 65.");
  });

  it("l'IPG seul, quand le classement n'est pas révélé", () => {
    const html = plat(rendu({ ipg: 54 }));
    expect(html).toContain("IPG 54.");
    expect(html).not.toContain("classement");
  });

  it("ni l'un ni l'autre : aucune ligne, rien ne fuit", () => {
    const html = plat(rendu({ ipg: null }));
    expect(html).not.toContain("IPG");
    expect(html).not.toContain("classement");
  });
});
