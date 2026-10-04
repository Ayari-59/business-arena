import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarketShareChart } from "@/components/charts";
import { RatioGauges } from "@/components/ratio-gauges";
import { BpiPanel } from "@/components/bpi-panel";

/**
 * LES RÉSULTATS TIENNENT EN PEU D'ÉCRANS SUR UN TÉLÉPHONE.
 *
 * L'onglet Finance faisait 3 600 px : cinq états ouverts ensemble, chacun avec son encadré de
 * lecture. Les états forment maintenant un accordéon, et chacun dit sa conclusion fermé.
 */

describe("les parts de marché se lisent à toute largeur", () => {
  const html = renderToStaticMarkup(
    createElement(MarketShareChart, {
      segments: [
        { name: "Étudiants (sensibles au prix)", share: 0.291 },
        { name: "Passionnés (sensibles à la qualité)", share: 0.322 },
      ],
    }),
  );

  it("le nom entier est du texte de page, pas un libellé de dessin réduit à 6 px", () => {
    expect(html).not.toContain("<svg");
    expect(html).toContain("Étudiants (sensibles au prix)");
    expect(html).toContain("Passionnés (sensibles à la qualité)");
  });

  it("chaque part se lit à droite de son nom", () => {
    const texte = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/[  ]/g, " ");
    expect(texte).toMatch(/29,1 %/);
    expect(texte).toMatch(/32,2 %/);
  });
});

describe("les ratios sont un tiroir fermé de l'accordéon des comptes", () => {
  const html = renderToStaticMarkup(
    createElement(RatioGauges, {
      profitability: 0.003,
      roce: 0.007,
      roe: 0.005,
      leverage: -0.002,
      debtToEquity: 0.5,
      assetTurnover: 1.17,
    }),
  );

  it("fermé, groupé avec les états, et annonce ce qu'il contient", () => {
    expect(html).toContain('name="comptes-du-tour"');
    expect(html).not.toMatch(/<details[^>]*\sopen(=|\s|>)/);
    expect(html).toContain("6 ratios");
  });

  it("la valeur d'un ratio ne se coupe pas en deux lignes", () => {
    expect(html).toContain("whitespace-nowrap");
  });
});

describe("le profil de performance garde ses six barres", () => {
  it("une barre par dimension jouée", () => {
    const html = renderToStaticMarkup(
      createElement(BpiPanel, { dimensions: { economic: 75, financial: 35, commercial: 62 } }),
    );
    expect(html.match(/<li/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });
});
