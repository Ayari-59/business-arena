import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BilanDePartie } from "@/components/bilan-de-partie";
import { bilanDeLaPartie, type TourDuBilan } from "@/pedagogy/bilan-de-partie";

/**
 * SIX TOURS DE TRAVAIL MÉRITENT MIEUX QU'UNE LIGNE.
 *
 * L'écran de fin disait « Partie terminée », un montant cumulé et deux boutons.
 * Ce qui s'était joué pendant la séance restait dispersé dans un accordéon.
 *
 * Ce que ce test garde : les chiffres sont ceux de TOUTE la partie (sauf la
 * trésorerie, qui est un solde), le tour décisif n'est pas le meilleur tour, et
 * l'écran ne promet pas un classement qui n'est pas ouvert.
 */

const tours = (...lignes: [number, number, number, number][]): TourDuBilan[] =>
  lignes.map(([round, ca, resultat, tresorerie]) => ({
    round,
    libelle: `Trimestre ${round}`,
    ca,
    resultat,
    tresorerie,
  }));

const sansEspacesFines = (t: string) =>
  t.replace(/[  ]/g, " ").replace(/&#x27;/g, "'");

describe("le bilan de la partie", () => {
  it("cumule ce qui se cumule, et garde le solde de trésorerie de la fin", () => {
    const b = bilanDeLaPartie(tours([1, 1000, -200, 500], [2, 1500, 300, 800], [3, 2000, 600, 900]))!;
    expect(b.caCumule).toBe(4500);
    expect(b.resultatCumule).toBe(700);
    // La trésorerie est un solde : l'additionner n'aurait aucun sens.
    expect(b.tresorerieFinale).toBe(900);
    expect(b.tours).toBe(3);
    expect(b.beneficiaire).toBe(true);
  });

  it("le tour décisif n'est pas le meilleur tour", () => {
    // Le redressement se joue au 2 (de −800 à +100, soit 900 de mieux) ; le
    // meilleur résultat tombe au 4, sans que rien y ait basculé.
    const b = bilanDeLaPartie(
      tours([1, 900, -800, 100], [2, 1200, 100, 200], [3, 1300, 150, 250], [4, 1400, 300, 400]),
    )!;
    expect(b.tourDecisif?.tour.round).toBe(2);
    expect(b.tourDecisif?.gain).toBe(900);
    expect(b.meilleurTour?.round).toBe(4);
  });

  it("sans progression, pas de tour décisif inventé", () => {
    const b = bilanDeLaPartie(tours([1, 900, 300, 500], [2, 800, 100, 400]))!;
    expect(b.tourDecisif).toBeNull();
  });

  it("un seul tour joué reste un bilan, sans tour décisif", () => {
    const b = bilanDeLaPartie(tours([1, 900, 300, 500]))!;
    expect(b.tours).toBe(1);
    expect(b.tourDecisif).toBeNull();
    expect(b.meilleurTour?.round).toBe(1);
  });

  it("aucune partie jouée, aucun bilan", () => {
    expect(bilanDeLaPartie([])).toBeNull();
  });
});

describe("l'écran de fin", () => {
  const rendu = (props: Parameters<typeof BilanDePartie>[0]) =>
    sansEspacesFines(renderToStaticMarkup(createElement(BilanDePartie, props)));

  const bilan = bilanDeLaPartie(
    tours([1, 900, -800, 100], [2, 1200, 100, 200], [3, 1300, 150, 250], [4, 1400, 300, 400]),
  )!;

  it("raconte la partie : ce qui a été fait, quand, et ce qui a été réussi", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan,
      reussites: { acquises: 6, total: 10, derniere: "Le marché vous suit" },
      place: { rang: 2, total: 6 },
      motDeClassement: null,
    });
    expect(html).toContain("4 tours joués");
    expect(html).toContain("4 800 €"); // le CA de toute la partie
    expect(html).toContain("Votre tour décisif");
    expect(html).toContain("Trimestre 2");
    expect(html).toContain("6 sur 10");
    expect(html).toContain("Le marché vous suit");
    expect(html).toContain("2e sur 6");
  });

  it("ne promet pas un classement que l'enseignant n'a pas ouvert", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan,
      reussites: { acquises: 1, total: 10, derniere: null },
      place: null,
      motDeClassement: "Le classement final sera révélé par votre enseignant.",
    });
    expect(html).toContain("révélé par votre enseignant");
    expect(html).not.toContain("sur 6.");
    // Sans réussite nommée, la phrase reste correcte.
    expect(html).toContain("1 sur 10.");
  });

  it("le record ne compare qu'à soi, et sait qu'il vient d'être battu", () => {
    const avec = (record: { monIpg: number; meilleur: number | null }) =>
      rendu({
        titre: "Partie terminée.",
        bilan,
        reussites: { acquises: 4, total: 10, derniere: null },
        place: null,
        motDeClassement: null,
        record,
      });
    expect(avec({ monIpg: 71, meilleur: 64 })).toContain("Nouveau record");
    expect(avec({ monIpg: 61, meilleur: 64 })).toContain("Votre record tient");
    // Première partie sur ce métier : il n'y a rien à battre, seulement une
    // référence à poser.
    const premiere = avec({ monIpg: 62, meilleur: null });
    expect(premiere).toContain("Votre première sur ce métier");
    expect(premiere).toContain("référence à battre");
  });

  it("sans record fourni (partie de classe), l'écran n'en parle pas", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan,
      reussites: { acquises: 4, total: 10, derniere: null },
      place: null,
      motDeClassement: null,
    });
    expect(html).not.toContain("record");
    expect(html).not.toContain("IPG");
  });

  it("la première place se dit « 1re », pas « 1e »", () => {
    const html = rendu({
      titre: "Victoire ! Volt domine le marché.",
      victoire: true,
      bilan,
      reussites: { acquises: 9, total: 10, derniere: "Pari tenu" },
      place: { rang: 1, total: 4 },
      motDeClassement: null,
    });
    expect(html).toContain("1re sur 4");
    expect(html).toContain("Victoire");
  });
});
