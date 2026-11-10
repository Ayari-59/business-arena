import { describe, expect, it } from "vitest";
import { RESEAUX_ET_INFORMATIQUE_EN_NUAGE as CH } from "../../src/config/cours/chapitres/reseaux-et-informatique-en-nuage";
import { debitDesVisios, passerALaFibre, visiosQueLaLigneTient } from "../../src/config/cours/monde/reseau-d-atlas";
import { PASSER_A_LA_FIBRE } from "../../src/config/cours/situations/par-chapitre/passer-a-la-fibre";
import { THEMES_DU_SIG, attendusT, gardeDuCasT, gardeDuLaboratoireT, gardeDuProgrammeT, gardesDeTexteT, justeT, triT } from "./gardes-de-la-terminale";

/**
 * « RÉSEAUX ET INFORMATIQUE EN NUAGE » (systèmes d'information de gestion de terminale, 4.2, lot F STMG),
 * ET SON CAS, CHEZ ATLAS CONSEIL.
 *
 * Refait à la main : 300 Mo × 8 = 2 400 Mbit, ÷ 20 = 120 secondes. La ligne laisse 20 × 80 % = 16 Mbit/s
 * aux visioconférences, à 2,5 chacune : 6 (15 Mbit/s ; 7 : 17,5). Un octet d'hôte : 2⁸ = 256 adresses,
 * 254 postes. Le cas : 300 × 80 % ÷ 2,5 = 96 visioconférences ; 2 400 ÷ 300 = 8 secondes ; 90 × 12 =
 * 1 080 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le seul thème 4 du SIG, pour s'afficher sous lui", () => {
    gardeDuProgrammeT(CH, THEMES_DU_SIG[3]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteT(CH);
  });
});

describe("débit, adresses, architecture et nuage", () => {
  it("le temps d'envoi : 2 400 Mbit, 120 secondes", () => {
    expect(attendusT(CH, "le-temps-d-envoi")).toEqual([2_400, 120]);
  });

  it("le laboratoire : la ligne tient 6 visioconférences, une seule solution", () => {
    gardeDuLaboratoireT(CH, "le-laboratoire-des-visios");
    expect(visiosQueLaLigneTient()).toBe(6);
    expect([debitDesVisios(6), debitDesVisios(7)]).toEqual([15, 17.5]);
  });

  it("les adresses : 256, dont 254 pour des postes", () => {
    expect(attendusT(CH, "les-adresses-disponibles")).toEqual([256, 254]);
    expect(justeT(CH, "le-meme-reseau")).toEqual(["192.168.10.42"]);
  });

  it("les tris", () => {
    expect(Object.values(triT(CH, "les-protocoles"))).toEqual(["https", "dns", "smtp", "dhcp"]);
    expect(Object.values(triT(CH, "la-configuration"))).toEqual(["adresse", "masque", "passerelle", "dns"]);
    expect(Object.values(triT(CH, "centraliser-ou-non"))).toEqual(["centralisation", "centralisation", "centralisation", "decentralisation", "decentralisation"]);
    expect(Object.values(triT(CH, "les-services-du-nuage"))).toEqual(["saas", "paas", "iaas"]);
  });
});

describe("le cas du chapitre", () => {
  it("96 visioconférences, 8 secondes, 1 080 € par an", () => {
    gardeDuCasT(PASSER_A_LA_FIBRE, CH);
    expect(passerALaFibre()).toMatchObject({ visiosAujourdhui: 6, visiosAvecLaFibre: 96, rapportAujourdhui: 120, rapportAvecLaFibre: 8, parAn: 1_080 });
  });
});
