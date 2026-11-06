import { describe, expect, it } from "vitest";
import { bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { LES_PIECES_DE_JANVIER as b, grilleDuReste } from "../../src/config/cours/bureaux/les-pieces-de-janvier";
import type { EtapeDeClassement, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { extourne, janvierDeNova } from "../../src/config/cours/monde/janvier-de-nova";
import { verifierUnBureau } from "../helpers/activites-du-cours";

/**
 * LE BUREAU DES PIÈCES DE JANVIER (monde/janvier-de-nova.ts, bureaux/les-pieces-de-janvier.ts). Chaque
 * chiffre refait à la main depuis la fiche de NOVA ; ce que N+1 garde est celui du chapitre
 * « Régularisations de fin d'exercice » ; puis la forme, le service et la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const j = janvierDeNova();
const etape = <T>(id: string) => b.etapes.find((e) => e.id === id) as T;

describe("janvier N+1, chaque chiffre à la main", () => {
  it("les cinq régularisations de la fiche", () => {
    // L'assurance : 6 000 € le 1er octobre pour 12 mois, 9 mois en N+1.
    expect(f.assurance).toMatchObject({ prime: 6_000, moisCouverts: 12 });
    expect(j.effets.chargeConstateeDAvance.extourne).toBe(-(6_000 * 9) / 12);
    // Composants Express : 1 500 jeux à 23 €.
    expect(j.effets.factureNonParvenue.extourne).toBe(1_500 * 23);
    // La commande urgente : 200 enceintes à 59 € ; les 120 enceintes livrées le 8 janvier.
    expect(j.effets.factureAEtablir.extourne).toBe(-200 * 59);
    expect(j.effets.produitConstateDAvance.extourne).toBe(120 * 59);
    // Le compte à terme : 133 000 € à 3 % du 6 janvier, 355 jours en N sur 360, 12 mois au total.
    expect(j.effets.interetsDuPlacement.extourne).toBe(-c((133_000 * 0.03 * 355) / 360));
    expect(j.placement.interets).toBe(c(133_000 * 0.03));
    expect(j.placement.verse).toBe(133_000 + 3_990);
  });

  it("une extourne retourne l'écriture du 31 décembre, ligne par ligne", () => {
    expect(extourne("factureNonParvenue")).toEqual([
      { compte: "408", debit: 41_400, credit: 0 },
      { compte: "601", debit: 0, credit: 34_500 },
      { compte: "44586", debit: 0, credit: 6_900 },
    ]);
  });

  it("ce que N+1 garde : l'assurance, les enceintes et les intérêts de janvier", () => {
    expect(j.reste("chargeConstateeDAvance")).toBe(-4_500);
    expect(j.reste("factureNonParvenue")).toBe(0);
    expect(j.reste("factureAEtablir")).toBe(0);
    expect(j.reste("produitConstateDAvance")).toBe(7_080);
    expect(j.reste("interetsDuPlacement")).toBe(c(3_990 - 3_934.58));
    expect(j.resteDansNPlus1).toBe(c(-4_500 + 7_080 + 55.42));
    expect(grilleDuReste().lignes.at(-1)!.cellules.map((x) => x.valeur)).toEqual([21_345.42, -18_710, 2_635.42]);
  });

  it("cinq extournes, trois pièces ; le bon de livraison et l'attestation ne se saisissent pas", () => {
    expect(etape<EtapeDuJournal>("les-extournes").ecritures).toHaveLength(5);
    expect(etape<EtapeDuJournal>("les-pieces").ecritures).toHaveLength(3);
    const pile = etape<EtapeDeClassement>("la-pile").elements;
    expect(pile.filter((e) => e.categorie === "extourne").map((e) => e.code)).toEqual(["bon", "assurance"]);
  });
});

describe("la forme, le service et la langue", () => {
  it("un bureau de 5 à 9 pièces et 3 à 6 étapes, que le chapitre ouvre", () => {
    verifierUnBureau(b, { pieces: [5, 9], etapes: [3, 6] });
    expect(bureauxDuChapitre("regularisations-de-fin-d-exercice").map((y) => y.code)).toContain(b.code);
  });
});
