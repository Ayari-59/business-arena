import { describe, expect, it } from "vitest";
import { hautsFaitsDuTour, type TourJoue } from "@/scoring/hauts-faits";

/**
 * LES HAUTS FAITS SE DISENT UNE FOIS, AU TOUR OÙ ILS DEVIENNENT VRAIS.
 *
 * Ce sont des franchissements, pas des états : « trois tours dans le vert » se
 * dit au troisième, pas au quatrième. Et ils ne se marchent pas dessus — un
 * premier bénéfice n'est jamais aussi un retour au vert.
 */

const tours = (...lignes: [number, number, number][]): TourJoue[] =>
  lignes.map(([round, resultat, tresorerieNette]) => ({ round, resultat, tresorerieNette }));

const codes = (t: TourJoue[], round: number) => hautsFaitsDuTour(t, round).map((f) => f.code);

describe("premier bénéfice", () => {
  it("au premier tour positif, jamais avant", () => {
    const t = tours([1, -500, 1000], [2, 300, 1200]);
    expect(codes(t, 1)).toEqual([]);
    expect(codes(t, 2)).toContain("premier_benefice");
  });

  it("ne se redit pas au tour suivant", () => {
    const t = tours([1, -500, 1000], [2, 300, 1200], [3, 400, 1300]);
    expect(codes(t, 3)).not.toContain("premier_benefice");
  });

  it("un résultat nul n'est pas un bénéfice", () => {
    expect(codes(tours([1, 0, 100]), 1)).toEqual([]);
  });
});

describe("retour au vert", () => {
  it("bénéfice, puis perte, puis bénéfice", () => {
    const t = tours([1, 200, 900], [2, -100, 800], [3, 150, 850]);
    expect(codes(t, 3)).toContain("retour_au_vert");
  });

  it("n'est jamais confondu avec le premier bénéfice", () => {
    // Perte au tour 1, bénéfice au tour 2 : c'est un premier bénéfice, pas un
    // retour — il n'y avait rien à retrouver.
    const t = tours([1, -500, 900], [2, 300, 950]);
    expect(codes(t, 2)).toContain("premier_benefice");
    expect(codes(t, 2)).not.toContain("retour_au_vert");
  });

  it("ne se déclenche pas quand le résultat n'a jamais faibli", () => {
    const t = tours([1, 200, 900], [2, 300, 950]);
    expect(codes(t, 2)).not.toContain("retour_au_vert");
  });
});

describe("trois tours dans le vert", () => {
  it("au tour qui complète la série", () => {
    const t = tours([1, 100, 500], [2, 200, 600], [3, 300, 700]);
    expect(codes(t, 2)).not.toContain("serie_verte");
    expect(codes(t, 3)).toContain("serie_verte");
  });

  it("ne se redit pas au quatrième", () => {
    const t = tours([1, 100, 500], [2, 200, 600], [3, 300, 700], [4, 400, 800]);
    expect(codes(t, 4)).not.toContain("serie_verte");
  });

  it("une perte au milieu casse la série, qui peut repartir", () => {
    const t = tours([1, 100, 500], [2, -50, 400], [3, 100, 450], [4, 200, 500], [5, 300, 600]);
    expect(codes(t, 4)).not.toContain("serie_verte");
    expect(codes(t, 5)).toContain("serie_verte");
  });
});

describe("trésorerie sauvée", () => {
  it("elle était négative, elle ne l'est plus", () => {
    const t = tours([1, -900, -400], [2, -200, 150]);
    expect(codes(t, 2)).toContain("tresorerie_sauvee");
  });

  it("ne dépend pas du résultat : les deux sont des choses différentes", () => {
    // Tour 2 toujours en perte, mais la caisse est renflouée : c'est bien la
    // leçon qu'on veut nommer.
    const t = tours([1, -900, -400], [2, -200, 150]);
    expect(codes(t, 2)).not.toContain("premier_benefice");
  });

  it("rien au premier tour, faute de tour précédent", () => {
    expect(codes(tours([1, 500, 300]), 1)).toEqual(["premier_benefice"]);
  });
});

describe("les garde-fous", () => {
  it("un tour absent ne rend rien", () => {
    expect(hautsFaitsDuTour(tours([1, 100, 100]), 4)).toEqual([]);
  });

  it("aucun tour ne rend rien", () => {
    expect(hautsFaitsDuTour([], 1)).toEqual([]);
  });

  it("des tours désordonnés sont remis dans l'ordre", () => {
    const desordre = tours([3, 300, 700], [1, 100, 500], [2, 200, 600]);
    expect(codes(desordre, 3)).toContain("serie_verte");
  });

  it("les tours postérieurs sont ignorés", () => {
    // Le tableau de bord d'un tour ancien ne doit pas se nourrir de l'avenir.
    const t = tours([1, -100, 500], [2, 300, 600], [3, 400, 700]);
    expect(codes(t, 2)).toEqual(["premier_benefice"]);
  });

  it("chaque haut fait porte un titre et un détail non vides", () => {
    const t = tours([1, -900, -400], [2, 200, 150]);
    for (const f of hautsFaitsDuTour(t, 2)) {
      expect(f.titre.length, f.code).toBeGreaterThan(0);
      expect(f.detail.length, f.code).toBeGreaterThan(0);
    }
  });
});
