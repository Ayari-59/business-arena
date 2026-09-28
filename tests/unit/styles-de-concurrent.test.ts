import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompetitiveBenchmark } from "@/components/competitive-benchmark";
import {
  STYLES,
  TOURS_AVANT_DE_LIRE_UN_CONCURRENT,
  styleDuConcurrent,
} from "@/config/styles-de-concurrent";

/**
 * ON APPREND À LIRE UN ADVERSAIRE, PAS À LIRE SA FICHE.
 *
 * Le moteur donne à chaque entreprise simulée un profil qui décide vraiment de
 * ses choix ; l'élève ne voyait qu'un nom et un prix moyen. Ce test garde les
 * trois règles de la révélation : elle attend deux tours clos, elle ne touche
 * jamais une équipe de la classe, et l'étiquette est expliquée quelque part
 * (une infobulle ne s'ouvre pas sur un téléphone).
 */

describe("le caractère d'un concurrent", () => {
  it("ne paraît qu'après deux tours clos", () => {
    expect(styleDuConcurrent("price_aggressive", 0)).toBeNull();
    expect(styleDuConcurrent("price_aggressive", 1)).toBeNull();
    expect(styleDuConcurrent("price_aggressive", TOURS_AVANT_DE_LIRE_UN_CONCURRENT)?.label).toBe(
      STYLES.price_aggressive.label,
    );
  });

  it("n'existe pas pour une équipe de la classe", () => {
    // Elle a des élèves, qui changeront d'avis ; l'étiqueter serait faux, et
    // ce serait la juger.
    expect(styleDuConcurrent(null, 6)).toBeNull();
    expect(styleDuConcurrent(undefined, 6)).toBeNull();
  });

  it("un profil inconnu ne devient pas une étiquette vide", () => {
    expect(styleDuConcurrent("profil_disparu", 6)).toBeNull();
  });

  it("chaque profil du moteur a son mot et son explication", () => {
    for (const [code, st] of Object.entries(STYLES)) {
      expect(st.label.length, code).toBeGreaterThan(2);
      expect(st.aide.length, code).toBeGreaterThan(20);
    }
  });
});

describe("le tableau des concurrents", () => {
  // React échappe l'apostrophe en `&#x27;` : on lit le texte tel qu'il paraît.
  const lisible = (t: string) => t.replace(/&#x27;/g, "'");
  const rendu = (styleDuPremier: { label: string; aide: string } | null) =>
    lisible(
      renderToStaticMarkup(
      createElement(CompetitiveBenchmark, {
        benchmark: {
          competitors: [
            {
              name: "SoundBox",
              isPlayer: false,
              avgPrice: 39,
              marketShare: 0.4,
              revenue: 120_000,
              style: styleDuPremier,
              embleme: null,
            },
            {
              name: "Votre entreprise",
              isPlayer: true,
              avgPrice: 59,
              marketShare: 0.3,
              revenue: 100_000,
              style: null,
              embleme: "etoile",
            },
          ],
          marketAvgPrice: 49,
          competitivenessIndex: 0.83,
        },
      }),
      ),
    );

  it("porte l'étiquette ET sa légende, une seule fois chacune", () => {
    const html = rendu(STYLES.price_aggressive);
    expect(html).toContain(STYLES.price_aggressive.label);
    expect(html).toContain(STYLES.price_aggressive.aide);
    // Deux concurrents peuvent partager un profil : la légende ne se répète pas.
    expect((html.match(new RegExp(STYLES.price_aggressive.aide, "g")) ?? []).length).toBe(1);
  });

  it("sans caractère connu, le tableau reste ce qu'il était", () => {
    const html = rendu(null);
    for (const st of Object.values(STYLES)) expect(html).not.toContain(st.aide);
  });
});
