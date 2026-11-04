import { describe, expect, it } from "vitest";
import {
  L_AFFECTATION_DU_RESULTAT,
  SOLUTION_DE_L_AFFECTATION,
  affectation,
  affectationDuLaboratoire,
  demandeDeLAssocie,
} from "../../src/config/cours/chapitres/l-affectation-du-resultat";
import { DIVIDENDE_RECLAME_PAR_ACTION, L_ASSOCIE_QUI_VEUT_PLUS, demandeReclamee } from "../../src/config/cours/situations/par-chapitre/l-associe-qui-veut-plus";
import { dividendeQuiGardeLaLigne } from "../../src/config/cours/monde/affectation-du-resultat";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * L'AFFECTATION DU RÉSULTAT, SUR LE BÉNÉFICE DU PREMIER EXERCICE DE NOVA, ET SON CAS : L'ASSOCIÉ QUI
 * VEUT PLUS.
 *
 * Refait à la main : 79 225,96 € de bénéfice, 150 000 € de capital en 15 000 actions, 5 % en
 * réserve légale sous un plafond de 15 000 € ; 105 297,07 € de capacité d'autofinancement,
 * 229 225,96 € de capitaux propres, 252 669,45 € de trésorerie et 68 000 € d'emprunt ; la deuxième
 * ligne à 60 000 €.
 */

const ch = chapitreDuCas(L_AFFECTATION_DU_RESULTAT, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const BENEFICE = 79_225.96;
const RESERVE_LEGALE = c(BENEFICE * 0.05);
const DISTRIBUABLE = c(BENEFICE - RESERVE_LEGALE);
const CAF = 105_297.07;

describe("le bénéfice de NOVA et ce que la loi en fait", () => {
  const k = affectation(NOVA);

  it("la réserve légale et le bénéfice distribuable se refont à la main", () => {
    expect(k.benefice).toBe(BENEFICE);
    expect(RESERVE_LEGALE).toBe(3_961.3);
    expect(etape(ch, "la-reserve-legale", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([15_000, RESERVE_LEGALE, DISTRIBUABLE]);
    expect(DISTRIBUABLE).toBe(75_264.66);
  });

  it("la demande de l'associé : 30 000 € de dividendes, 264,66 € en report à nouveau", () => {
    expect(etape(ch, "la-demande-de-l-associe", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([30_000, c(DISTRIBUABLE - 30_000 - 45_000), c(BENEFICE - 30_000)]);
    expect(etape(ch, "ce-que-le-dividende-engage", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([c(229_225.96 - 30_000), c(252_669.45 - 30_000), c(CAF - 30_000)]);
    const x = demandeDeLAssocie(NOVA);
    expect(x.empruntPossible).toBe(c(229_225.96 - 30_000 - 68_000));
    expect(x.manquePourLaLigne).toBe(0);
  });

  it("une seule bonne réponse, partout", () => {
    expect(etape(ch, "pourquoi-une-reserve-legale", "choix").options(NOVA, VIDE).filter((o) => o.juste)).toHaveLength(1);
    expect(etape(ch, "predire-le-dividende", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["Capitaux propres et trésorerie baissent d'autant"]);
  });
});

describe("ce que le choix engage", () => {
  const k = affectation(NOVA);

  it("le curseur : 45 297 € de dividendes laissent la ligne autofinancée", () => {
    expect(dividendeQuiGardeLaLigne(k)).toBe(Math.floor(CAF - 60_000));
    gardeDuCurseur(ch, "jusqu-ou-distribuer", 45_297);
  });

  it("le laboratoire : les réserves ne déplacent pas d'argent, le dividende si", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-de-l-affectation");
    expect(SOLUTION_DE_L_AFFECTATION).toEqual({ dividende: 2, reserves: 45_000 });
    const a = affectationDuLaboratoire(NOVA, { dividende: 2, reserves: 0 });
    const b = affectationDuLaboratoire(NOVA, { dividende: 2, reserves: 45_000 });
    expect(b.capitauxPropres).toBe(a.capitauxPropres);
    expect(b.tresorerie).toBe(a.tresorerie);
    expect(a.reportANouveau).toBe(c(DISTRIBUABLE - 30_000));
    const defi = etape(ch, "le-laboratoire-de-l-affectation", "simulation").defi(NOVA);
    expect(defi.atteint({ dividende: 3, reserves: 30_000 })).toBe(true); // 45 000 €, la ligne reste autofinancée
    expect(defi.atteint({ dividende: 3.5, reserves: 20_000 })).toBe(false); // 52 500 € : il manquerait pour la ligne
    expect(defi.atteint({ dividende: 2.5, reserves: 35_000 })).toBe(false); // 2 764,66 € laissés en report
    expect(defi.atteint({ dividende: 2, reserves: 50_000 })).toBe(false); // plus que le bénéfice distribuable
    expect(defi.atteint({ dividende: 1.5, reserves: 50_000 })).toBe(false);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(L_AFFECTATION_DU_RESULTAT);
  });
});

describe("le cas : l'associé qui veut plus", () => {
  const { k, x } = demandeReclamee(NOVA);
  it("60 000 € permis par la loi, mais il manquerait 14 702,93 € pour la ligne", () => {
    expect(DIVIDENDE_RECLAME_PAR_ACTION * k.actions).toBe(60_000);
    expect(x.possible).toBe(true);
    expect(x.autofinancement).toBe(c(CAF - 60_000));
    expect(x.manquePourLaLigne).toBe(c(60_000 - (CAF - 60_000)));
    expect(x.manquePourLaLigne).toBe(14_702.93);
    expect(x.capitauxPropres).toBe(c(229_225.96 - 60_000));
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(L_ASSOCIE_QUI_VEUT_PLUS);
  });
});
