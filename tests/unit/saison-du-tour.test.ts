import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SaisonDuTour, ecartSaison } from "@/components/saison-du-tour";

/**
 * UN COEFFICIENT QUI DÉCIDE DU VOLUME NE PEUT PAS ÊTRE UNE NOTE DE BAS DE PAGE.
 *
 * La saison multiplie la demande du tour : c'est elle qui dit combien produire.
 * Elle tenait dans une ligne bleu pâle en bas d'écran, et le chiffre y était
 * donné brut — « ×0,94 ». Un élève de première année ne convertit pas ça en
 * pourcentage de tête, et personne ne lit ce qui a l'air d'une mention légale.
 *
 * Ce test garde les deux moitiés de la correction : le coefficient est traduit,
 * et le sens de la saison se voit à la couleur.
 */

const rendu = (notes: { name: string; coef: number }[]) =>
  renderToStaticMarkup(createElement(SaisonDuTour, { notes }));

describe("ecartSaison", () => {
  it("traduit le coefficient en pourcentage, signe compris", () => {
    expect(ecartSaison(0.94)).toBe("−6 %");
    expect(ecartSaison(1.15)).toBe("+15 %");
    expect(ecartSaison(0.6)).toBe("−40 %");
    // Le moins est un vrai signe moins (U+2212), pas un trait d'union : c'est
    // ce que le reste de l'arène affiche.
    expect(ecartSaison(0.94).startsWith("−")).toBe(true);
  });
});

describe("SaisonDuTour", () => {
  it("sans saison marquée, aucun encart — on n'annonce pas le temps qu'il fait", () => {
    expect(rendu([])).toBe("");
  });

  it("traduit le coefficient plutôt que de le laisser brut", () => {
    const html = rendu([{ name: "Marché", coef: 0.94 }]);
    expect(html).toContain("×0,94");
    // LE POINT : le chiffre est dit en français, pas seulement en coefficient.
    expect(html).toContain("6 % de demande en moins ce tour");
  });

  it("la couleur suit le vent : vert quand la demande gonfle, ambre quand elle se réduit", () => {
    expect(rendu([{ name: "Marché", coef: 1.2 }])).toContain("border-l-emerald-400/70");
    expect(rendu([{ name: "Marché", coef: 0.8 }])).toContain("border-l-amber-400/70");
  });

  it("le coefficient d'ensemble commande, les clientèles nuancent", () => {
    const html = rendu([
      { name: "Marché", coef: 0.94 },
      { name: "Comités d'entreprise", coef: 0.6 },
      { name: "Particuliers", coef: 1.1 },
    ]);
    // La tête donne le ton de l'encart…
    expect(html).toContain("basse saison");
    expect(html).toContain("6 % de demande en moins");
    // …et chaque clientèle garde SON signe, y compris à contre-courant.
    expect(html).toContain("−40 %");
    expect(html).toContain("+10 %");
  });

  it("une clientèle qui va mieux que le marché se lit en vert, même en basse saison", () => {
    const html = rendu([
      { name: "Marché", coef: 0.9 },
      { name: "Particuliers", coef: 1.1 },
    ]);
    // Le cas qui mentirait le plus facilement : une seule couleur pour tout
    // l'encart ferait passer une clientèle porteuse pour un vent contraire.
    expect(html).toContain("text-emerald-400");
    expect(html).toContain("text-amber-300");
  });
});
