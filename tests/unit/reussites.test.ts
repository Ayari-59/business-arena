import { describe, expect, it } from "vitest";
import { lireLeTour, reussitesFranchies, type TourJoue } from "@/scoring/reussites";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * LES RÉUSSITES SE DISENT UNE FOIS, AU TOUR OÙ ELLES DEVIENNENT VRAIES.
 *
 * Ce sont des franchissements, pas des états : « trois tours dans le vert » se
 * dit au troisième, pas au quatrième. Et ils ne se marchent pas dessus — un
 * premier bénéfice n'est jamais aussi un retour au vert.
 */

const tours = (...lignes: [number, number, number][]): TourJoue[] =>
  lignes.map(([round, resultat, tresorerieNette]) => ({ round, resultat, tresorerieNette }));

const codes = (t: TourJoue[], round: number) => reussitesFranchies(t, round).map((f) => f.code);

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
    expect(reussitesFranchies(tours([1, 100, 100]), 4)).toEqual([]);
  });

  it("aucun tour ne rend rien", () => {
    expect(reussitesFranchies([], 1)).toEqual([]);
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

  it("chaque réussite porte un titre et un détail non vides", () => {
    const t = tours([1, -900, -400], [2, 200, 150]);
    for (const f of reussitesFranchies(t, 2)) {
      expect(f.titre.length, f.code).toBeGreaterThan(0);
      expect(f.detail.length, f.code).toBeGreaterThan(0);
    }
  });
});


/**
 * LES SIX QUI NE PARLENT PAS D'ARGENT.
 *
 * Les quatre premières lisaient le résultat net et la trésorerie, et rien
 * d'autre : gagner des parts de marché, tenir sa prévision, cesser de perdre
 * des ventes ou faire tourner l'atelier au bon régime ne valait rien. Ces
 * six-là lisent le marché, la prévision, les ruptures, l'atelier et le prix.
 */

/** Un tour avec les chiffres du marché, pour les réussites qui en vivent. */
const tourDetaille = (t: Partial<TourJoue> & { round: number }): TourJoue => ({
  resultat: 100,
  tresorerieNette: 1000,
  ...t,
});

describe("trois tours de mieux", () => {
  it("compte la PENTE, pas le signe : une perte qu'on réduit compte", () => {
    const t = tours([1, -900, 100], [2, -500, 100], [3, -200, 100]);
    expect(codes(t, 3)).toContain("progression");
  });

  it("ne se redit pas au quatrième tour de hausse", () => {
    const t = tours([1, -900, 100], [2, -500, 100], [3, -200, 100], [4, -50, 100]);
    expect(codes(t, 4)).not.toContain("progression");
  });

  it("un tour de recul casse la série", () => {
    const t = tours([1, -900, 100], [2, -500, 100], [3, -600, 100], [4, -200, 100]);
    expect(codes(t, 4)).not.toContain("progression");
  });
});

describe("rien de perdu", () => {
  it("se dit au tour qui corrige la rupture, pas au premier tour servi", () => {
    const t = [
      tourDetaille({ round: 1, ventesPerdues: 0 }),
      tourDetaille({ round: 2, ventesPerdues: 120 }),
      tourDetaille({ round: 3, ventesPerdues: 0 }),
    ];
    expect(codes(t, 1)).not.toContain("rien_de_perdu");
    expect(codes(t, 3)).toContain("rien_de_perdu");
  });
});

describe("atelier bien calibré", () => {
  it("demande les DEUX : près du plein, et personne laissé sans réponse", () => {
    expect(
      codes([tourDetaille({ round: 1, utilisation: 0.95, ventesPerdues: 0 })], 1),
    ).toContain("atelier_calibre");
    // Plein, mais des clients repartis : c'est une capacité trop petite.
    expect(
      codes([tourDetaille({ round: 1, utilisation: 0.99, ventesPerdues: 80 })], 1),
    ).not.toContain("atelier_calibre");
    // Personne laissé sans réponse, mais l'atelier tourne à moitié.
    expect(
      codes([tourDetaille({ round: 1, utilisation: 0.4, ventesPerdues: 0 })], 1),
    ).not.toContain("atelier_calibre");
  });
});

describe("pari tenu", () => {
  it("cinq pour cent d'écart, dans un sens comme dans l'autre", () => {
    const pari = (ventes: number) =>
      codes([tourDetaille({ round: 1, ventesPrevues: 1000, ventes })], 1);
    expect(pari(1040)).toContain("pari_tenu");
    expect(pari(960)).toContain("pari_tenu");
    expect(pari(1200)).not.toContain("pari_tenu");
    expect(pari(700)).not.toContain("pari_tenu");
  });

  it("sans annonce, rien à tenir", () => {
    expect(codes([tourDetaille({ round: 1, ventes: 1000 })], 1)).not.toContain("pari_tenu");
  });
});

describe("le marché vous suit", () => {
  it("trois tours de part en hausse, et pas un de plus", () => {
    const t = [
      tourDetaille({ round: 1, partDeMarche: 0.2 }),
      tourDetaille({ round: 2, partDeMarche: 0.22 }),
      tourDetaille({ round: 3, partDeMarche: 0.25 }),
      tourDetaille({ round: 4, partDeMarche: 0.27 }),
    ];
    expect(codes(t, 3)).toContain("part_gagnee");
    expect(codes(t, 4)).not.toContain("part_gagnee");
  });

  it("une part stable ne monte pas", () => {
    const t = [
      tourDetaille({ round: 1, partDeMarche: 0.2 }),
      tourDetaille({ round: 2, partDeMarche: 0.2 }),
      tourDetaille({ round: 3, partDeMarche: 0.25 }),
    ];
    expect(codes(t, 3)).not.toContain("part_gagnee");
  });
});

describe("plus cher, sans reculer", () => {
  it("le prix monte et la part tient", () => {
    const t = [
      tourDetaille({ round: 1, prixMoyen: 59, partDeMarche: 0.2 }),
      tourDetaille({ round: 2, prixMoyen: 64, partDeMarche: 0.2 }),
    ];
    expect(codes(t, 2)).toContain("prix_tenu");
  });

  it("monter son prix en perdant du terrain ne compte pas", () => {
    const t = [
      tourDetaille({ round: 1, prixMoyen: 59, partDeMarche: 0.2 }),
      tourDetaille({ round: 2, prixMoyen: 64, partDeMarche: 0.17 }),
    ];
    expect(codes(t, 2)).not.toContain("prix_tenu");
  });
});


describe("la lecture d'un tour", () => {
  /**
   * Les deux écrans qui affichent des réussites (le tableau de bord d'un tour,
   * la liste de la partie) lisent le résultat par CETTE fonction. Si elle
   * comptait les ventes autrement que la revue de prévision, « pari tenu »
   * serait vrai sur un écran et faux sur l'autre.
   */
  const resultat = {
    incomeStatement: { netIncome: 4200, revenue: 59_000 },
    functionalBalance: { netTreasury: 1500 },
    market: {
      totalShare: 0.23,
      bySegment: {
        a: { sold: 600, lost: 40 },
        b: { sold: 300, lost: 0 },
      },
    },
    production: { utilizationRate: 0.88 },
    orderOffer: { delivered: 100 },
  } as unknown as CompanyRoundResult;

  it("compte les ventes commande exceptionnelle comprise, comme la revue de prévision", () => {
    const t = lireLeTour(3, resultat, { lines: [{ format: "units", forecast: 950 }] });
    expect(t.ventes).toBe(1000); // 600 + 300 + 100
    expect(t.ventesPerdues).toBe(40);
    expect(t.ventesPrevues).toBe(950);
    expect(t.partDeMarche).toBe(0.23);
    expect(t.utilisation).toBe(0.88);
    expect(t.prixMoyen).toBe(59); // 59 000 € pour 1 000 unités
    expect(t.round).toBe(3);
  });

  it("sans revue de prévision, aucune annonce à tenir", () => {
    expect(lireLeTour(1, resultat).ventesPrevues).toBeUndefined();
    expect(lireLeTour(1, resultat, null).ventesPrevues).toBeUndefined();
  });
});
