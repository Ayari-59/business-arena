import { describe, expect, it } from "vitest";
import { arrondi2 } from "../../src/pedagogy/cours/deux-decimales";
import { LE_MANAGEMENT_FACE_AU_CHANGEMENT } from "../../src/config/cours/chapitres/le-management-face-au-changement";
import { PROGRAMME } from "../../src/config/cours/registre";
import { PROTEGER_LE_SITE_DE_VENTE } from "../../src/config/cours/situations/par-chapitre/proteger-le-site-de-vente";
import { NOVA, attendus, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { bonneReponseJamaisLaPlusLongue } from "./gardes-du-management";

/**
 * LE MANAGEMENT FACE AU CHANGEMENT (management de première, 1.4, lot B STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 22 € de composants montés de 10 %, 24,20 €, et 16 € d'autres coûts : 40,20 € ; la
 * demande du premier trimestre 16 755 − 203 × prix, à l'enceinte entière ; la cyberattaque, 4 000 € et
 * 1 000 enceintes à 21 €, 5 % par an ; 23 609 enceintes en N, 0,35 kg d'emballage, 60 % valorisés.
 */

const demande = (p: number) => Math.floor(16_755 - 203 * p + 1e-9);
const marge = (p: number, cv: number) => Math.round((p - cv) * demande(p) * 100) / 100;

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(LE_MANAGEMENT_FACE_AU_CHANGEMENT, PROGRAMME["stmg-management"][1]!);
    expect(LE_MANAGEMENT_FACE_AU_CHANGEMENT.blocs[0]).toBe("STMG Thème 1 · À la rencontre du management des organisations");
    gardeDuCas(PROTEGER_LE_SITE_DE_VENTE, LE_MANAGEMENT_FACE_AU_CHANGEMENT);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, servis par le serveur", () => {
    gardesDeTexte(LE_MANAGEMENT_FACE_AU_CHANGEMENT);
    bonneReponseJamaisLaPlusLongue(LE_MANAGEMENT_FACE_AU_CHANGEMENT);
    bonneReponseJamaisLaPlusLongue(PROTEGER_LE_SITE_DE_VENTE);
  });
});

describe("le changement et la régulation", () => {
  it("les parties prenantes : trois internes, quatre externes", () => {
    expect(Object.values(triDe(LE_MANAGEMENT_FACE_AU_CHANGEMENT, "parties-prenantes")).sort()).toEqual(["externe", "externe", "externe", "externe", "interne", "interne", "interne"]);
  });

  it("la hausse : 40,20 € de coût variable, 18,80 € de marge, 10 511,60 € perdus sur le trimestre", () => {
    expect(attendus(LE_MANAGEMENT_FACE_AU_CHANGEMENT, "la-hausse-se-propage")).toEqual([40.2, 18.8, Math.round((marge(59, 38) - marge(59, 40.2)) * 100) / 100]);
    expect(marge(59, 38) - marge(59, 40.2)).toBeCloseTo(4_778 * 2.2, 6);
  });

  it("le laboratoire : 61,50 € rend la plus grande marge, 90 951 €, sans revenir aux 100 338 € d'avant", () => {
    const e = gardeDuLaboratoire(LE_MANAGEMENT_FACE_AU_CHANGEMENT, "le-laboratoire-du-prix");
    expect(e.defi(NOVA).solution).toEqual({ prix: 61.5 });
    const prix = Array.from({ length: 11 }, (_, i) => 59 + i * 0.5);
    const meilleur = prix.reduce((m, p) => (marge(p, 40.2) > marge(m, 40.2) ? p : m));
    expect([meilleur, marge(61.5, 40.2), marge(59, 38)]).toEqual([61.5, 90_951, 100_338]);
    expect(marge(61, 40.2)).toBeLessThan(marge(61.5, 40.2));
  });

  it("le numérique et l'écologie : 25 000 € d'attaque, 1 250 € par an ; 8 263,15 kg d'emballage, 3 305,26 kg non valorisés", () => {
    expect(attendus(LE_MANAGEMENT_FACE_AU_CHANGEMENT, "le-numerique-et-son-risque")).toEqual([4_000 + 1_000 * 21, 25_000 * 0.05]);
    expect(attendus(LE_MANAGEMENT_FACE_AU_CHANGEMENT, "l-empreinte-de-l-annee")).toEqual([arrondi2(23_609 * 0.35), arrondi2(arrondi2(23_609 * 0.35) * 0.4)]);
    expect(juste(LE_MANAGEMENT_FACE_AU_CHANGEMENT, "la-loi-ou-l-engagement")).toEqual(["L'emballage recyclé : un engagement au-delà de ce que la loi impose"]);
  });
});

describe("le cas du chapitre", () => {
  it("protéger le site : 1 250 € sans, 800 + 250 = 1 050 € avec", () => {
    expect(attendus(PROTEGER_LE_SITE_DE_VENTE, "les-deux-couts")).toEqual([25_000, 1_250, 800 + 25_000 * 0.01]);
    expect(juste(PROTEGER_LE_SITE_DE_VENTE, "reponse")).toEqual(["Prendre la protection : 200 € de moins par an en moyenne"]);
  });
});
