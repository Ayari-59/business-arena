import { describe, expect, it } from "vitest";
import { COMMUNICATION, COMMUNICATIONS, communication } from "../../src/config/cours/chapitres/communication";
import { anneeDuMarche } from "../../src/config/cours/monde/attractivite";
import { MARCHE_A_TROIS } from "../../src/config/cours/monde/marche-a-trois";
import { PROGRAMME } from "../../src/config/cours/registre";
import { UNE_RALLONGE_POUR_LA_CAMPAGNE, rallongeDeLaCampagne } from "../../src/config/cours/situations/par-chapitre/une-rallonge-pour-la-campagne";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-du-marche";

/**
 * CE QUE RAPPORTE LA COMMUNICATION (bac STMG mercatique, palier 1), SUR UN TRIMESTRE DE L'ANNÉE TYPE
 * DU MARCHÉ À TROIS DU MONDE DU COURS, ET SON CAS : UNE RALLONGE POUR LA CAMPAGNE ?
 *
 * Refait à la main sur la fiche du marché à trois : l'attractivité de NOVA, 1 × (1 + effet de la
 * communication), face à SoundBox, (59 ÷ 51) puissance 4 × 0,90² × 1,08, et à Auris,
 * (59 ÷ 79) puissance 4 × 1,34² × (1,06 + 0,22 × ln 2) ; 15 502 enceintes par trimestre ; la courbe
 * de la communication (+0,04 à 4 000 €, +0,06 à 8 000 €, une droite entre deux points) ; 21 € de
 * marge par enceinte.
 */

const SOUNDBOX = Math.pow(59 / 51, 4) * 0.81 * 1.08;
const AURIS = Math.pow(59 / 79, 4) * 1.34 ** 2 * (1.06 + 0.22 * Math.log(2));
const effet = (b: number) => (b <= 4_000 ? (0.04 * b) / 4_000 : b <= 8_000 ? 0.04 + (0.02 * (b - 4_000)) / 4_000 : 0.06);
const ventes = (b: number) => {
  const a = 1 + effet(b);
  return Math.round((a / (a + SOUNDBOX + AURIS)) * 15_502);
};

describe("ce que rapporte la communication", () => {
  it("au programme du bac STMG, chez NOVA seule, et son cas lui est dédié", () => {
    expect(PROGRAMME.stmg[1]).toContain(COMMUNICATION.titre);
    expect([...COMMUNICATIONS]).toEqual(["nova"]);
    gardeDuCas(UNE_RALLONGE_POUR_LA_CAMPAGNE, COMMUNICATION);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(COMMUNICATION);
  });

  it("les cinq budgets : 4 778, 4 844, 4 909, 4 941 et 4 973 enceintes ; le résultat du trimestre, comme l'année type ÷ 4", () => {
    const k = communication(NOVA);
    expect(k.budgets.map((b) => b.ventes)).toEqual([0, 2_000, 4_000, 6_000, 8_000].map(ventes));
    expect(k.budgets.map((b) => b.resultat)).toEqual([0, 2_000, 4_000, 6_000, 8_000].map((b) => anneeDuMarche(MARCHE_A_TROIS, { nova: { budgetCommunication: b } }).nova.resultat / 4));
    expect(k.sans.resultat).toBe((ventes(0) * 4 * 21 - 374_196 - 16_000) / 4);
  });

  it("la campagne de 4 000 € : 131 ventes en plus, 30,53 € chacune, 1 249 € de perte ; le meilleur budget est zéro", () => {
    const g = ventes(4_000) - ventes(0);
    expect(g).toBe(131);
    expect(attendus(COMMUNICATION, "rentabilite")).toEqual([g, Math.round((4_000 / g) * 100) / 100, g * 21 - 4_000]);
    expect(juste(COMMUNICATION, "meilleur-budget")).toEqual(["Aucune campagne"]);
    expect(juste(COMMUNICATION, "rendements")).toEqual(["Les clients les plus faciles à convaincre l'ont déjà été"]);
  });

  it("le curseur : 191 ventes gagnées paieraient la campagne (4 011 €) ; 190 n'en font que 3 990 €", () => {
    const e = gardeDuCurseur(COMMUNICATION, "ce-qu-il-faudrait-vendre", Math.ceil(4_000 / 21));
    expect([e.droites(NOVA).produit(191), e.droites(NOVA).produit(190)]).toEqual([191 * 21, 190 * 21]);
  });

  it("le laboratoire : zéro, seul budget de 0 € à 8 000 € qui laisse le meilleur résultat ; 1 000 € ne font gagner que 33 ventes", () => {
    const e = gardeDuLaboratoire(COMMUNICATION, "le-laboratoire-du-budget");
    expect(e.defi(NOVA).solution).toEqual({ budget: 0 });
    expect(ventes(1_000) - ventes(0)).toBe(33);
    expect(33 * 21).toBeLessThan(1_000);
  });
});

describe("une rallonge pour la campagne ?", () => {
  it("de 4 000 € à 6 000 € : 32 ventes en plus pour 2 000 €, 672 € de marge, 1 328 € de perte", () => {
    const r = rallongeDeLaCampagne(NOVA);
    expect([r.budgetEnPlus, r.ventesEnPlus, r.margeEnPlus, r.gain]).toEqual([2_000, ventes(6_000) - ventes(4_000), 32 * 21, 32 * 21 - 2_000]);
    expect(ventes(6_000) - ventes(4_000)).toBe(32);
  });
});
