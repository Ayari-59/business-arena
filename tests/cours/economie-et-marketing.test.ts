import { describe, expect, it } from "vitest";
import { canauxDeDistribution, coefficientDeSaison, demandeAuPrix, marcheEtPart, segmentation } from "../../src/config/cours/monde/economie-et-marketing";
import { MERCATIQUE_DE_NOVA as f } from "../../src/config/cours/monde/mercatique-de-nova";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";

/**
 * LA FICHE DU MARCHÉ DE NOVA (monde/mercatique-de-nova.ts) TIENT AVEC LES AUTRES FICHES DE NOVA : les
 * trois clientèles refont la droite de demande de nova-gestion.ts, les segments refont le marché du
 * premier trimestre, et le prix, les coûts, les ventes et le canal sont ceux de nova-gestion.ts.
 */

describe("la fiche du marché de NOVA", () => {
  it("les trois droites des clientèles s'additionnent en celle du trimestre : 16 755 − 203 × prix", () => {
    expect(f.clienteles.reduce((t, k) => t + k.demandeAPrixNul, 0)).toBe(NOVA_GESTION.decision.demande.aPrixNul);
    expect(f.clienteles.reduce((t, k) => t + k.perdueParEuro, 0)).toBe(NOVA_GESTION.decision.demande.perdueParEuro);
    expect(segmentation(f).demande).toBe(demandeAuPrix(f, 59));
    expect(demandeAuPrix(f, 59)).toBe(4_778);
  });

  it("les segments achètent les 18 100 enceintes du marché de janvier à mars", () => {
    expect(segmentation(f).marche).toBe(NOVA_GESTION.semestre.marche.slice(0, 3).reduce((t, x) => t + x, 0));
    expect(marcheEtPart(f).debut.marche).toBe(18_100);
  });

  it("le premier trimestre : NOVA a fabriqué ce qu'elle a vendu, 4 778 enceintes, dont 960 à CampusTech", () => {
    expect(marcheEtPart(f).debut.nova.ventes).toBe(NOVA_GESTION.decision.production);
    const k = canauxDeDistribution(f);
    expect(k.direct.ventes + k.intermediaire.ventes).toBe(4_778);
    expect([k.delai, k.retard]).toEqual([60, 20]);
  });

  it("la saison de fin d'année : le premier trimestre × 6 940 ÷ 4 778 ; un au premier", () => {
    expect(coefficientDeSaison(f, 1)).toBe(1);
    expect(coefficientDeSaison(f, 4)).toBe(6_940 / 4_778);
  });
});
