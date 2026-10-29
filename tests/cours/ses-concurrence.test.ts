import { describe, expect, it } from "vitest";
import { ENTREPRISES_DE_LA_CONCURRENCE, HAUSSE_DU_PRIX, LA_CONCURRENCE, laConcurrence } from "../../src/config/cours/chapitres/la-concurrence";
import { PROGRAMME } from "../../src/config/cours/registre";
import { DE_COMBIEN_MONTER_LE_PRIX, troisPrix } from "../../src/config/cours/situations/par-chapitre/de-combien-monter-le-prix";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-du-marche";

/**
 * LA CONCURRENCE (seconde SES, palier 1), SUR LE MARCHÉ À TROIS DU MONDE DU COURS, ET SON CAS : DE
 * COMBIEN MONTER LE PRIX ?
 *
 * Refait à la main sur la fiche du marché à trois (monde/marche-a-trois.ts) : des enceintes par
 * trimestre (15 502, réconciliation : NOVA y reçoit 4 778 enceintes à 59 €), partagées selon l'attractivité (59 ÷ prix) puissance 4 × qualité perçue au carré ×
 * (1 + image). NOVA : 59 €, qualité 1, sans image. SoundBox : 51 €, qualité 0,96 − 0,06 = 0,90,
 * 16 000 € de communication (+0,08). Auris : 79 €, qualité 1,31 + 0,03 = 1,34, 8 000 € de
 * communication (+0,06) et un capital-image de ln 2 (× 0,22). Les ventes s'arrondissent à
 * l'enceinte chaque trimestre ; NOVA ne monte que 7 000 enceintes par trimestre.
 */

const IMAGE_D_AURIS = 0.06 + 0.22 * Math.log(2);
const attractivites = (prix: number) => [Math.pow(59 / prix, 4), Math.pow(59 / 51, 4) * 0.9 ** 2 * 1.08, Math.pow(59 / 79, 4) * 1.34 ** 2 * (1 + IMAGE_D_AURIS)];
/** Les ventes de l'année des trois enseignes, NOVA à un prix. */
function ventes(prix: number) {
  const a = attractivites(prix);
  const t = a.reduce((x, y) => x + y, 0);
  const demandes = a.map((x) => Math.round((x / t) * 15_502));
  return [Math.min(demandes[0]!, 7_000) * 4, demandes[1]! * 4, demandes[2]! * 4];
}
/** Le bénéfice de NOVA : 21 € de marge par enceinte au prix de 59 €, 374 196 € de charges fixes et 16 000 € de budget qualité. */
const benefice = (prix: number) => Math.round((ventes(prix)[0]! * (prix - 38) - 390_196) * 100) / 100;
const c = (x: number) => Math.round(x * 10) / 10;

describe("la concurrence", () => {
  it("au programme de seconde SES, chez NOVA seule, et son cas lui est dédié", () => {
    expect([LA_CONCURRENCE.parcours, LA_CONCURRENCE.palier]).toEqual(["seconde-ses", 1]);
    expect(PROGRAMME["seconde-ses"]![1]).toContain(LA_CONCURRENCE.titre);
    expect([...ENTREPRISES_DE_LA_CONCURRENCE]).toEqual(["nova"]);
    gardeDuCas(DE_COMBIEN_MONTER_LE_PRIX, LA_CONCURRENCE);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LA_CONCURRENCE);
  });

  it("l'année type : 19 112, 29 948 et 12 944 enceintes, 30,8 %, 48,3 % et 20,9 % ; le moins cher vend le plus", () => {
    expect(ventes(59)).toEqual([19_112, 29_948, 12_944]);
    const t = 19_112 + 29_948 + 12_944;
    expect(attendus(LA_CONCURRENCE, "parts")).toEqual([t, c((19_112 / t) * 100), c((29_948 / t) * 100), c((12_944 / t) * 100)]);
    expect(juste(LA_CONCURRENCE, "prix-et-ventes")).toEqual(["Le moins cher des trois"]);
  });

  it("NOVA à 64,90 € : 4 644 ventes perdues, 3 244 à SoundBox, 1 404 à Auris ; le bénéfice passe de 11 156 € à −1 006,80 €", () => {
    const [n, s2, a] = ventes(64.9);
    expect([n, s2, a]).toEqual([14_468, 33_192, 14_348]);
    expect(attendus(LA_CONCURRENCE, "hausse")).toEqual([19_112 - n!, s2! - 29_948, a! - 12_944, c((n! / (n! + s2! + a!)) * 100)]);
    expect(juste(LA_CONCURRENCE, "ou-vont-les-clients")).toEqual(["Chez SoundBox"]);
    expect([benefice(59), benefice(64.9)]).toEqual([11_156, -1_006.8]);
    expect(laConcurrence(NOVA).ecartDeBenefice).toBe(Math.round((-1_006.8 - 11_156) * 100) / 100);
    expect(juste(LA_CONCURRENCE, "benefice")).toEqual(["Il baisse : les clients perdus coûtent plus que la hausse ne rapporte"]);
    expect(HAUSSE_DU_PRIX).toBe(0.1);
  });

  it("le curseur : à 64 €, la marge couvre encore les charges ; à 65 €, plus", () => {
    gardeDuCurseur(LA_CONCURRENCE, "jusqu-ou-monter", 64);
    expect(benefice(64)).toBeGreaterThanOrEqual(0);
    expect(benefice(65)).toBe(-1_396);
  });

  it("le laboratoire : parti de 65 €, le meilleur bénéfice à l'euro est à 59 € (11 156 €), devant 60 € et 58 €", () => {
    const e = gardeDuLaboratoire(LA_CONCURRENCE, "le-laboratoire-du-prix");
    expect(e.defi(NOVA).solution).toEqual({ prix: 59 });
    expect(benefice(59)).toBeGreaterThan(Math.max(benefice(58), benefice(60)));
  });
});

describe("de combien monter le prix ?", () => {
  it("59 €, 61,95 € ou 64,90 € : le meilleur bénéfice est au prix d'aujourd'hui", () => {
    const k = troisPrix(NOVA);
    expect([k.garder.benefice, k.douce.benefice, k.forte.benefice]).toEqual([benefice(59), benefice(61.95), benefice(64.9)]);
    expect(benefice(61.95)).toBe(8_140.4);
    expect(attendus(DE_COMBIEN_MONTER_LE_PRIX, "les-parts")).toEqual([59, 61.95, 64.9].map((p) => c((ventes(p)[0]! / ventes(p).reduce((x, y) => x + y, 0)) * 100)));
    expect(juste(DE_COMBIEN_MONTER_LE_PRIX, "reponse")).toEqual(["Garder le prix"]);
  });
});
