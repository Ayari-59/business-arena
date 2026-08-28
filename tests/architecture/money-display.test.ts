import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatEuro } from "@/lib/format";

/**
 * Les montants affichés à l'élève passent par le formateur, pas par
 * `toLocaleString` à la main.
 *
 * Ce test existe à cause d'un écart réel. Les tarifs proratisés en périodicité
 * mensuelle sortaient à trois décimales : « Analyse de prix · 333,333 € », à
 * côté de tarifs ronds dans le même bloc. L'arrondi a d'abord été fait à la
 * source, à la création de la partie. Il ne rattrapait pas les parties DÉJÀ
 * ouvertes, dont le scénario est figé au moment du lancement : une classe
 * démarrée la veille gardait ses millièmes d'euro jusqu'à la fin de ses six
 * tours. L'affichage, lui, les rattrape toutes.
 *
 * On vérifie donc les deux bouts : le formateur arrondit bien, et l'écran de
 * décision s'en sert pour les tarifs plutôt que de formater lui-même.
 */

describe("les montants affichés sont arrondis à l'euro", () => {
  it("le formateur ne laisse jamais passer de décimales", () => {
    for (const montant of [333.3333, 1166.6667, 1833.3333, 316.667]) {
      expect(formatEuro(montant), `${montant}`).not.toMatch(/[.,]\d/);
    }
    // et il garde le séparateur de milliers
    expect(formatEuro(1166.6667).replace(/[  ]/g, " ")).toBe("1 167 €");
  });

  it("l'écran de décision formate ses tarifs avec lui", () => {
    const source = readFileSync("src/components/decision-form.tsx", "utf8");
    // Les tarifs proratisés : études, primes d'assurance à la formule et
    // assurance simple. Ce sont eux que la périodicité met en millièmes.
    for (const champ of ["study.cost", "f.premium", "insuranceOffer.premium"]) {
      expect(source, `${champ} n'est pas passé par formatEuro`).toContain(
        `formatEuro(${champ})`,
      );
      expect(
        source.includes(`${champ}.toLocaleString`),
        `${champ} formate encore à la main, les parties déjà ouvertes garderont leurs décimales`,
      ).toBe(false);
    }
  });
});
