import { describe, expect, it } from "vitest";
import { LE_DOSSIER_DE_FINANCEMENT as b, grilleDesOffres } from "../../src/config/cours/bureaux/le-dossier-de-financement";
import type { EtapeDeClassement, EtapeDeReponse } from "../../src/config/cours/bureaux/types";
import { INTERETS_PLAFOND, PREMIERE_ANNEE_PLAFOND } from "../../src/config/cours/monde/acteurs-du-financement";
import { BPIFRANCE_AU_PLUS, COMPTE_COURANT_POSSIBLE, MONTAGES_DU_DOSSIER, dossierDeFinancement } from "../../src/config/cours/monde/dossier-de-financement";
import { COMPTE_COURANT } from "../../src/config/cours/monde/financement-du-lycee";
import { gardesDuBureau } from "../helpers/activites-du-lot-c";

/**
 * LE BUREAU « LE DOSSIER DE FINANCEMENT » (monde/dossier-de-financement.ts) : chaque engagement refait à
 * la main, le seul montage qui tient sans ouvrir le capital, puis les gardes communes du lot C.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const d = dossierDeFinancement();

describe("le dossier de financement : chaque chiffre à la main", () => {
  it("l'hypothèse du bureau : 30 000 € de compte courant au lieu des 40 000 € du plafond", () => {
    expect(COMPTE_COURANT_POSSIBLE).toBe(30_000);
    expect(COMPTE_COURANT_POSSIBLE).toBeLessThan(COMPTE_COURANT.plafond!);
    expect(BPIFRANCE_AU_PLUS).toBe(40_000);
  });

  it("la banque : 80 000 € en cinq parts de 16 000 €, à 5 % du capital dû", () => {
    expect(d.offres.banque.interets).toBe(c(0.05 * (80_000 + 64_000 + 48_000 + 32_000 + 16_000)));
    expect(d.offres.banque.premiereAnnee).toBe(16_000 + 4_000);
  });

  it("Bpifrance : 40 000 € à 5,5 %, les intérêts seuls la première année, puis cinq parts de 8 000 €", () => {
    expect(d.offres.bpifrance.premiereAnnee).toBe(c(40_000 * 0.055));
    expect(d.offres.bpifrance.interets).toBe(c(0.055 * (40_000 + 40_000 + 32_000 + 24_000 + 16_000 + 8_000)));
  });

  it("la plateforme et le compte courant : les intérêts sur tout le capital, chaque année", () => {
    expect(d.offres.plateforme.interets).toBe(c(80_000 * 0.06 * 4));
    expect(d.offres.plateforme.premiereAnnee).toBe(c(80_000 * 0.06));
    expect(d.offres.compteCourant.interets).toBe(c(30_000 * 0.03 * 5));
    expect(d.offres.compteCourant.premiereAnnee).toBe(c(30_000 * 0.03));
  });

  it("le montage du chapitre ne se monte plus ; celui du bureau tient : 30 000 €, 10 000 € de Bpifrance, 40 000 € à la banque", () => {
    expect(d.duChapitre.compteCourant).toBe(40_000);
    const m = d.montages.avecBpifrance;
    expect([m.compteCourant, m.bpifrance, m.banque]).toEqual([30_000, 10_000, 40_000]);
    // Banque 40 000 € : 8 000 € + 2 000 € ; Bpifrance : 550 € ; compte courant : 900 €.
    expect(m.premiereAnnee).toBe(c(8_000 + 2_000 + 10_000 * 0.055 + 900));
    expect(m.interets).toBe(c(0.05 * (40_000 + 32_000 + 24_000 + 16_000 + 8_000) + 0.055 * (10_000 + 10_000 + 8_000 + 6_000 + 4_000 + 2_000) + 4_500));
    expect(m.premiereAnnee).toBeLessThanOrEqual(PREMIERE_ANNEE_PLAFOND);
    expect(m.interets).toBeLessThanOrEqual(INTERETS_PLAFOND);
    expect(d.tenables).toEqual({ compteCourantEtBanque: false, avecBpifrance: true, avecPlusDeBpifrance: false, avecLaBusinessAngel: true });
  });

  it("les autres montages tombent pour la raison que le corrigé donne", () => {
    expect(d.montages.compteCourantEtBanque.premiereAnnee).toBe(c(10_000 + 2_500 + 900));
    expect(d.montages.compteCourantEtBanque.premiereAnnee).toBeGreaterThan(PREMIERE_ANNEE_PLAFOND);
    expect(d.montages.avecPlusDeBpifrance.interets).toBeGreaterThan(INTERETS_PLAFOND);
    expect(d.montages.avecLaBusinessAngel.partDesFondateurs).toBe(15_000 / 20_000);
    expect(MONTAGES_DU_DOSSIER.avecLaBusinessAngel.capital).toBe(60_000);
  });

  it("le tableau, le tri et la réponse portent ces chiffres", () => {
    expect(grilleDesOffres().lignes.flatMap((l) => l.cellules.map((x) => x.valeur))).toEqual([12_000, 20_000, 8_800, 2_200, 19_200, 4_800, 4_500, 900]);
    const tri = b.etapes[0] as EtapeDeClassement;
    expect(tri.elements.filter((x) => x.categorie === "hors-de-portee").map((x) => x.code)).toEqual(["fonds", "obligations"]);
    const r = b.etapes.find((e) => e.type === "reponse") as EtapeDeReponse;
    expect(r.questions[0]!.options.find((o) => o.juste)!.texte).toMatch(/Bpifrance/);
  });
});

describe("le bureau « Le dossier de financement »", () => {
  gardesDuBureau(b, "les-acteurs-et-les-modes-de-financement");
});
