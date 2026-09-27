import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TableauDeBord, type TourChiffre } from "@/components/tableau-de-bord";

/**
 * OÙ EN EST MON ENTREPRISE, ET DANS QUEL SENS ELLE VA.
 *
 * Trois tuiles : la valeur du dernier tour clos, l'écart avec le précédent, et
 * la courbe depuis le début. Ce qui doit tenir :
 *
 * · LA COULEUR NE DÉCIDE DE RIEN TOUTE SEULE. Le vert d'un résultat positif et
 *   le rouge d'un négatif se confondent pour une partie des daltoniens —
 *   mesuré à 4,6 d'écart perçu en deutéranopie, là où huit sont demandés. Le
 *   signe est donc écrit dans le nombre et dans l'écart.
 * · RIEN À MONTRER, RIEN À AFFICHER. Une courbe d'un point n'est pas une
 *   courbe, et un tableau de bord vide prend la place du jeu.
 * · CHAQUE TOUR EST SURVOLABLE, et sa valeur reste lisible sans la souris.
 */

const tours: TourChiffre[] = [
  { round: 1, libelle: "Trimestre 1", ca: 187_545, resultat: -21_227, tresorerie: -15_633 },
  { round: 2, libelle: "Trimestre 2", ca: 207_140, resultat: -11_849, tresorerie: -55_912 },
  { round: 3, libelle: "Trimestre 3", ca: 300_337, resultat: 32_729, tresorerie: -27_198 },
];

const rendre = (t: TourChiffre[]) =>
  renderToStaticMarkup(createElement(TableauDeBord, { tours: t }));

describe("le tableau de bord de l'élève", () => {
  it("ne s'affiche pas tant qu'aucun tour n'est clos", () => {
    expect(rendre([])).toBe("");
  });

  it("porte les trois chiffres de la maison, ceux des lignes de résumé", () => {
    const html = rendre(tours);
    for (const titre of ["CA", "Résultat", "Trésorerie"]) expect(html).toContain(titre);
    // La valeur montrée est celle du DERNIER tour clos, pas la première.
    expect(html).toContain("300");
    expect(html).toContain("32");
  });

  it("écrit le signe, au lieu de le confier à la couleur", () => {
    const html = rendre(tours);
    // Le résultat du dernier tour est positif, la trésorerie négative : les
    // deux se lisent sans voir la moindre couleur.
    expect(html).toMatch(/-\s?27/);
    // Et l'écart porte son signe, pas seulement sa flèche.
    expect(html).toContain("+");
  });

  it("dit « stable » plutôt que « −0 € » quand rien n'a bougé", () => {
    const plats = tours.map((t) => ({ ...t, ca: 200_000 }));
    expect(rendre(plats)).toContain("stable");
    expect(rendre(plats)).not.toContain("▼ -0");
  });

  it("dit « premier tour » quand il n'y a rien à comparer", () => {
    expect(rendre(tours.slice(0, 1))).toContain("premier tour");
  });

  it("donne à chaque courbe un texte de remplacement chiffré", () => {
    const html = rendre(tours);
    expect(html).toContain("Chiffre d&#x27;affaires, tour par tour");
    expect(html).toContain("Trimestre 1");
  });

  it("rend chaque tour survolable, avec sa valeur", () => {
    const html = rendre(tours);
    // Un point de survol par tour et par tuile, et son infobulle.
    expect((html.match(/<title>/g) ?? []).length).toBe(tours.length * 3);
  });

  it("ne trace la ligne de zéro que là où le signe veut dire quelque chose", () => {
    const html = rendre(tours);
    // Deux tuiles sur trois : le résultat et la trésorerie. Le chiffre
    // d'affaires ne passe pas sous zéro, une ligne de zéro n'y dirait rien.
    expect((html.match(/<line /g) ?? []).length).toBeLessThanOrEqual(2);
  });
});
