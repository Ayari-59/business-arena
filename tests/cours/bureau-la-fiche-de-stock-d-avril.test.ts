import { describe, expect, it } from "vitest";
import { bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { LA_FICHE_DE_STOCK_D_AVRIL as b, grilleDeLaFiche } from "../../src/config/cours/bureaux/la-fiche-de-stock-d-avril";
import type { EtapeDeClassement, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { HAUSSE_DE_LA_SECONDE_LIVRAISON, LE_MOIS_QUI_SUIT } from "../../src/config/cours/chapitres/les-stocks";
import { COMMANDE_DE_MAI, LETTRE_DE_HAUSSE, ficheDAvril } from "../../src/config/cours/monde/fiche-d-avril-de-pixel";
import { verifierUnBureau } from "../helpers/activites-du-cours";

/**
 * LE BUREAU DE LA FICHE DE STOCK D'AVRIL (monde/fiche-d-avril-de-pixel.ts, bureaux/la-fiche-de-stock-d-avril.ts).
 * Chaque chiffre refait à la main depuis le cas figé de PIXEL & CO et le mois qui suit du chapitre « Les
 * stocks » ; puis la forme, le service et la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const x = ficheDAvril();
const etape = <T>(id: string) => b.etapes.find((e) => e.id === id) as T;

describe("avril, chaque chiffre à la main", () => {
  const s = casDeLEntreprise("ecommerce").stock!;

  it("le stock du 1er avril est le stock final du trimestre : 2 000 + 3 778 − 3 203 articles à 27 €", () => {
    expect([s.initial.quantite, s.achats.quantite, s.vendues, s.achats.prixUnitaire]).toEqual([2_000, 3_778, 3_203, 27]);
    expect(x.initial).toEqual({ quantite: 2_575, valeur: 2_575 * 27 });
  });

  it("le mois qui suit : le sixième des achats et des ventes, à la dizaine ; la seconde livraison relevée de 2 €", () => {
    expect(LE_MOIS_QUI_SUIT.partDUneLivraison).toBe(1 / 6);
    expect(x.premiere.quantite).toBe(Math.round(3_778 / 6 / 10) * 10);
    expect(x.serie).toBe(Math.round(3_203 / 6 / 10) * 10);
    expect([x.premiere.quantite, x.serie]).toEqual([630, 530]);
    expect(HAUSSE_DE_LA_SECONDE_LIVRAISON).toBe(2);
    expect([x.premiere.ht, x.seconde.ht]).toEqual([630 * 27, 630 * 29]);
    expect([x.premiere.tva, x.seconde.ttc]).toEqual([3_402, c(18_270 * 1.2)]);
    expect(LETTRE_DE_HAUSSE.aPartirDu).toBeLessThan(LE_MOIS_QUI_SUIT.jours.livraison2);
    // La commande du 25 avril n'arrive que le 5 mai : elle n'entre pas dans la fiche d'avril.
    expect(COMMANDE_DE_MAI).toEqual({ jour: 25, livraison: 5 });
  });

  it("le coût moyen de la période, le stock final, le coût des ventes et la marge", () => {
    // (69 525 + 17 010 + 18 270) ÷ (2 575 + 1 260) = 104 805 ÷ 3 835 = 27,33 € au centime.
    expect(x.disponible).toEqual({ quantite: 3_835, valeur: 104_805 });
    expect(x.coutMoyen).toBe(c(104_805 / 3_835));
    expect(x.coutMoyen).toBe(27.33);
    expect(x.final).toEqual({ quantite: 2_775, valeur: c(2_775 * 27.33) });
    expect(x.coutDesVentes).toBe(c(104_805 - 75_840.75));
    // Les ventes : 1 060 articles au prix moyen du trimestre, 62 €.
    expect(x.ventes).toBe(1_060 * 62);
    expect(x.marge).toBe(c(65_720 - 28_964.25));
    expect(x.variation).toBe(c(69_525 - 75_840.75));
  });

  it("la fiche à compléter, les écritures et le piège de la commande de mai", () => {
    const g = grilleDeLaFiche();
    expect(g.lignes.at(-2)!.cellules[2]!.valeur).toBe(75_840.75);
    expect(g.lignes.at(-1)!.cellules[2]!.valeur).toBe(28_964.25);
    const j = etape<EtapeDuJournal>("les-ecritures");
    expect(j.ecritures.find((e) => e.id === "constatation")!.ecriture.lignes[0]!.montant).toBe(75_840.75);
    expect(j.ecritures.find((e) => e.id === "annulation")!.ecriture.lignes[0]!.montant).toBe(69_525);
    // Achats + variation = coût des ventes.
    expect(c(x.achats + x.variation)).toBe(x.coutDesVentes);
    expect(etape<EtapeDeClassement>("la-pile").elements.find((e) => e.code === "commande")!.categorie).toBe("rien");
  });
});

describe("la forme, le service et la langue", () => {
  it("un bureau de 5 à 9 pièces et 3 à 6 étapes, que le chapitre ouvre", () => {
    verifierUnBureau(b, { pieces: [5, 9], etapes: [3, 6] });
    expect(bureauxDuChapitre("les-stocks").map((y) => y.code)).toContain(b.code);
    expect(b.entreprise.nom).toBe("PIXEL & CO");
  });
});
